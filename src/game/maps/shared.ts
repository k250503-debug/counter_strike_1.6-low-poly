import * as THREE from 'three';
import { textures, TextureKind } from '../ProceduralTextures';
import { PropBatchBuilder } from '../scenes/InstancedProps';
import { CharacterClassId, MapId, WeaponId } from '../types';

export interface ColliderBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
  isRamp?: boolean;
}

export interface BombsiteZone {
  label: 'A' | 'B';
  x: number;
  y: number;
  z: number;
  radius: number;
}

export interface WaypointNode {
  id: string;
  x: number;
  y: number;
  z: number;
  neighbors: string[];
  tag?: 'A' | 'B' | 'MID' | 'T' | 'CT';
}

export interface MenuFirefightSpot {
  pos: [number, number, number];
  yaw: number;
  cls: CharacterClassId;
  w: WeaponId;
  crouch: boolean;
}

export interface MenuShowcaseConfig {
  camCenter: THREE.Vector3;
  camOrbitRadius: number;
  camHeight: number;
  lookAt: THREE.Vector3;
  tSpots: MenuFirefightSpot[];
  ctSpots: MenuFirefightSpot[];
  smokePos?: THREE.Vector3;
}

export interface MapCalloutPin {
  name: string;
  x: number;
  y: number;
  z: number;
  zone: 'A' | 'B' | 'MID' | 'T' | 'CT';
}

export interface BuiltMap {
  id: MapId;
  group: THREE.Group;
  colliders: ColliderBox[];
  raycastMeshes: THREE.Mesh[];
  tSpawns: THREE.Vector3[];
  ctSpawns: THREE.Vector3[];
  dmSpawns: THREE.Vector3[];
  bombsites: BombsiteZone[];
  buyZones: { team: 'T' | 'CT'; x: number; z: number; radius: number }[];
  waypoints: WaypointNode[];
  callouts?: MapCalloutPin[];
  skyColor: number;
  fogColor: number;
  fogDensity: number;
  sunColor: number;
  sunIntensity: number;
  sunPos: THREE.Vector3;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  surfaceType: 'sand' | 'concrete' | 'metal';
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  menuShowcase: MenuShowcaseConfig;
  ambientParticleMode: 'dust' | 'snow' | 'mist' | 'sparks';
}

export interface MapBuildContext {
  group: THREE.Group;
  colliders: ColliderBox[];
  raycastMeshes: THREE.Mesh[];
  materials: Map<string, THREE.MeshStandardMaterial>;
  propBatch: PropBatchBuilder;
  shadows: boolean;
}

export function getMat(
  ctx: MapBuildContext,
  kind: TextureKind,
  repeatX = 1,
  repeatY = 1,
  tint = 0xffffff,
  roughness = 0.84,
  metalness = 0.06,
  normalStrength = 0.85
): THREE.MeshStandardMaterial {
  const key = `${kind}:${repeatX}:${repeatY}:${tint}:${roughness}:${metalness}:${normalStrength}`;
  const existing = ctx.materials.get(key);
  if (existing) return existing;
  const pair = textures.getPair(kind, repeatX, repeatY);
  const mat = new THREE.MeshStandardMaterial({
    map: pair.map,
    normalMap: pair.normalMap,
    normalScale: new THREE.Vector2(normalStrength, normalStrength),
    roughnessMap: pair.roughnessMap,
    color: tint,
    roughness,
    metalness,
  });
  ctx.materials.set(key, mat);
  return mat;
}

export function addSkyDome(ctx: MapBuildContext, zenith: number, horizon: number, cloud: number): void {
  const tex = textures.createSkyDomeTexture(zenith, horizon, cloud);
  const geo = new THREE.SphereGeometry(280, 32, 20);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    side: THREE.BackSide,
    fog: false,
  });
  const dome = new THREE.Mesh(geo, mat);
  dome.userData.isSkyDome = true;
  ctx.group.add(dome);
}

export function addSolidBox(
  ctx: MapBuildContext,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  kind: TextureKind,
  tint = 0xffffff,
  roughness = 0.84,
  metalness = 0.06,
  repX?: number,
  repY?: number,
  registerCollider = true
): THREE.Mesh {
  const rx = repX ?? Math.max(1, Math.round(Math.max(w, d) / 4));
  const ry = repY ?? Math.max(1, Math.round(h / 4));
  const mat = getMat(ctx, kind, rx, ry, tint, roughness, metalness);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  mesh.position.set(x, y + h / 2, z);
  mesh.castShadow = ctx.shadows;
  mesh.receiveShadow = ctx.shadows;
  ctx.group.add(mesh);
  ctx.raycastMeshes.push(mesh);
  if (registerCollider) {
    ctx.colliders.push({
      minX: x - w / 2,
      maxX: x + w / 2,
      minY: y,
      maxY: y + h,
      minZ: z - d / 2,
      maxZ: z + d / 2,
    });
  }
  return mesh;
}

/**
 * Walkable elevated floor deck spanning bottomY..topY cleanly with proper UV tiling.
 */
export function addFloorDeck(
  ctx: MapBuildContext,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  topY: number,
  kind: TextureKind,
  tint = 0xffffff,
  bottomY = 0,
  roughness = 0.86
): THREE.Mesh {
  const w = maxX - minX;
  const d = maxZ - minZ;
  const h = Math.max(0.25, topY - bottomY);
  const yStart = topY - h;
  const cx = (minX + maxX) * 0.5;
  const cz = (minZ + maxZ) * 0.5;
  return addSolidBox(
    ctx,
    cx,
    yStart,
    cz,
    w,
    h,
    d,
    kind,
    tint,
    roughness,
    0.04,
    Math.max(1, Math.round(w / 4)),
    Math.max(1, Math.round(d / 4)),
    true
  );
}

/**
 * Smooth angled walkable ramp backed by micro-step ColliderBoxes (rise <= 0.22m)
 * plus optional side curb walls so players & bots walk cleanly between elevations.
 */
export function addSlopeRamp(
  ctx: MapBuildContext,
  startX: number,
  startY: number,
  startZ: number,
  endX: number,
  endY: number,
  endZ: number,
  width: number,
  kind: TextureKind,
  tint = 0xffffff,
  baseY = 0,
  addSideCurbs = false
): void {
  const dx = endX - startX;
  const dy = endY - startY;
  const dz = endZ - startZ;
  const horizLen = Math.hypot(dx, dz);
  if (horizLen < 0.2) return;

  const slopeLen = Math.hypot(horizLen, dy);
  const angleY = Math.atan2(dx, dz);
  const slopeAngle = Math.atan2(dy, horizLen);
  const midX = (startX + endX) * 0.5;
  const midY = (startY + endY) * 0.5;
  const midZ = (startZ + endZ) * 0.5;

  const thickness = 0.42;
  const mat = getMat(ctx, kind, Math.max(1, Math.round(width / 3)), Math.max(2, Math.round(slopeLen / 3)), tint, 0.86, 0.04);
  const rampMesh = new THREE.Mesh(new THREE.BoxGeometry(width, thickness, slopeLen + 0.35), mat);
  rampMesh.position.set(midX, midY - thickness * 0.5 + 0.02, midZ);
  rampMesh.rotation.order = 'YXZ';
  rampMesh.rotation.y = angleY;
  rampMesh.rotation.x = -slopeAngle;
  rampMesh.castShadow = ctx.shadows;
  rampMesh.receiveShadow = ctx.shadows;
  ctx.group.add(rampMesh);
  ctx.raycastMeshes.push(rampMesh);

  // Underfill plinth so there's never an open gap underneath the ramp
  const minEndY = Math.min(startY, endY);
  if (minEndY > baseY + 0.1 || Math.abs(dy) > 0.2) {
    const steps = Math.max(6, Math.ceil(Math.abs(dy) / 0.2) + 2, Math.ceil(horizLen / 1.1));
    const alongX = Math.abs(dx) >= Math.abs(dz);
    const stepSpan = horizLen / steps;
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const sx = startX + dx * t;
      const sz = startZ + dz * t;
      const sy = startY + dy * t;
      const w = alongX ? stepSpan + 0.22 : width;
      const d = alongX ? width : stepSpan + 0.22;
      ctx.colliders.push({
        minX: sx - w / 2,
        maxX: sx + w / 2,
        minY: baseY,
        maxY: sy,
        minZ: sz - d / 2,
        maxZ: sz + d / 2,
        isRamp: true,
      });
    }
    // Visual apron wedge beneath slope
    const avgY = (startY + endY) * 0.5;
    if (avgY - baseY > 0.35) {
      const skirtH = Math.max(0.2, minEndY - baseY);
      const skirt = new THREE.Mesh(
        new THREE.BoxGeometry(alongX ? horizLen : width - 0.1, skirtH, alongX ? width - 0.1 : horizLen),
        mat
      );
      skirt.position.set(midX, baseY + skirtH * 0.5, midZ);
      skirt.receiveShadow = ctx.shadows;
      ctx.group.add(skirt);
    }
  }

  if (addSideCurbs) {
    const perpX = Math.cos(angleY);
    const perpZ = -Math.sin(angleY);
    const curbMat = getMat(ctx, 'concrete', 2, 1, 0xb8aa92, 0.84, 0.04);
    [-1, 1].forEach((side) => {
      const curb = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.42, slopeLen + 0.3), curbMat);
      curb.position.set(midX + perpX * (width * 0.5 - 0.12) * side, midY + 0.12, midZ + perpZ * (width * 0.5 - 0.12) * side);
      curb.rotation.order = 'YXZ';
      curb.rotation.y = angleY;
      curb.rotation.x = -slopeAngle;
      curb.castShadow = ctx.shadows;
      curb.receiveShadow = ctx.shadows;
      ctx.group.add(curb);
    });
  }
}

export function addTrimWall(
  ctx: MapBuildContext,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  kind: TextureKind,
  tint = 0xffffff,
  trimTint = 0x9c8668
): void {
  addSolidBox(ctx, x, y, z, w, h, d, kind, tint);
  const friezeKind: TextureKind =
    kind === 'sandstone' ? 'sandstone_frieze' : kind === 'moss_stone' ? 'moss_stone' : 'concrete';
  const capMat = getMat(ctx, friezeKind, Math.max(1, Math.round(Math.max(w, d) / 2.2)), 1, trimTint, 0.82, 0.05);

  const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.28, 0.36, d + 0.28), capMat);
  cap.position.set(x, y + h - 0.06, z);
  cap.castShadow = ctx.shadows;
  cap.receiveShadow = ctx.shadows;
  ctx.group.add(cap);

  const upperLip = new THREE.Mesh(new THREE.BoxGeometry(w + 0.42, 0.16, d + 0.42), capMat);
  upperLip.position.set(x, y + h + 0.14, z);
  upperLip.castShadow = ctx.shadows;
  ctx.group.add(upperLip);

  if (kind === 'sandstone' || kind === 'terracotta' || kind === 'brick' || kind === 'cinderblock') {
    const plinthTint = kind === 'sandstone' ? 0xe8d5b0 : 0x999288;
    const basePlinth = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.22, 0.46, d + 0.22),
      getMat(ctx, friezeKind, Math.max(1, Math.round(Math.max(w, d) / 2.2)), 1, plinthTint, 0.85, 0.04)
    );
    basePlinth.position.set(x, y + 0.23, z);
    basePlinth.receiveShadow = ctx.shadows;
    ctx.group.add(basePlinth);
  }

  const longSpan = Math.max(w, d);
  if (longSpan >= 11 && h >= 4.2) {
    const alongX = w >= d;
    const count = Math.max(2, Math.floor(longSpan / 8));
    for (let i = 0; i <= count; i++) {
      const off = -longSpan * 0.42 + (i / count) * (longSpan * 0.84);
      const pil = new THREE.Mesh(
        new THREE.BoxGeometry(alongX ? 0.42 : w + 0.16, h - 0.15, alongX ? d + 0.16 : 0.42),
        capMat
      );
      pil.position.set(x + (alongX ? off : 0), y + (h - 0.15) / 2, z + (alongX ? 0 : off));
      pil.castShadow = ctx.shadows;
      pil.receiveShadow = ctx.shadows;
      ctx.group.add(pil);
    }
  }

  if (kind === 'terracotta') {
    const roofMat = getMat(ctx, 'roof_tile', Math.max(2, Math.round(longSpan / 3)), 2, 0xc97553, 0.72, 0.08);
    const eave = new THREE.Mesh(new THREE.BoxGeometry(w + 0.65, 0.24, d + 0.65), roofMat);
    eave.position.set(x, y + h + 0.3, z);
    eave.castShadow = ctx.shadows;
    ctx.group.add(eave);
  }
}

/**
 * Wall with a clean rectangular doorway opening cut through it.
 */
export function addDoorwayWall(
  ctx: MapBuildContext,
  x: number,
  y: number,
  z: number,
  spanWidth: number,
  openingWidth: number,
  wallHeight: number,
  openingHeight: number,
  depth: number,
  kind: TextureKind,
  tint = 0xffffff,
  alongZ = false,
  doorwayOffset = 0
): void {
  const halfSpan = spanWidth * 0.5;
  const openMin = doorwayOffset - openingWidth * 0.5;
  const openMax = doorwayOffset + openingWidth * 0.5;
  const leftLen = Math.max(0.2, openMin - -halfSpan);
  const rightLen = Math.max(0.2, halfSpan - openMax);
  const leftCenter = (-halfSpan + openMin) * 0.5;
  const rightCenter = (openMax + halfSpan) * 0.5;

  if (!alongZ) {
    if (leftLen > 0.25) addTrimWall(ctx, x + leftCenter, y, z, leftLen, wallHeight, depth, kind, tint);
    if (rightLen > 0.25) addTrimWall(ctx, x + rightCenter, y, z, rightLen, wallHeight, depth, kind, tint);
    if (wallHeight > openingHeight + 0.2) {
      addSolidBox(ctx, x + doorwayOffset, y + openingHeight, z, openingWidth + 0.3, wallHeight - openingHeight, depth, kind, tint);
    }
    addSolidBox(ctx, x + doorwayOffset, y + openingHeight - 0.14, z, openingWidth + 0.6, 0.28, depth + 0.2, 'concrete', 0xbab0a2, 0.82, 0.05, 2, 1, false);
  } else {
    if (leftLen > 0.25) addTrimWall(ctx, x, y, z + leftCenter, depth, wallHeight, leftLen, kind, tint);
    if (rightLen > 0.25) addTrimWall(ctx, x, y, z + rightCenter, depth, wallHeight, rightLen, kind, tint);
    if (wallHeight > openingHeight + 0.2) {
      addSolidBox(ctx, x, y + openingHeight, z + doorwayOffset, depth, wallHeight - openingHeight, openingWidth + 0.3, kind, tint);
    }
    addSolidBox(ctx, x, y + openingHeight - 0.14, z + doorwayOffset, depth + 0.2, 0.28, openingWidth + 0.6, 'concrete', 0xbab0a2, 0.82, 0.05, 2, 1, false);
  }
}

export function addPlaneDecal(
  ctx: MapBuildContext,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  map: THREE.Texture,
  rotY = 0,
  rotX = 0,
  transparent = true
): THREE.Mesh {
  const mat = new THREE.MeshStandardMaterial({
    map,
    transparent,
    roughness: 0.78,
    metalness: 0.05,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rotX, rotY, 0);
  mesh.receiveShadow = ctx.shadows;
  ctx.group.add(mesh);
  return mesh;
}

export function addArchedBlindWindow(
  ctx: MapBuildContext,
  x: number,
  y: number,
  z: number,
  alongZ = false,
  width = 1.65,
  height = 1.7
): void {
  const glassMat = getMat(ctx, 'window_glass', 2, 2, 0x8fb0cc, 0.18, 0.45, 0.45);
  const frameMat = getMat(ctx, 'concrete', 1, 1, 0xb8a384, 0.82, 0.05);
  const woodMat = getMat(ctx, 'wood_plank', 1, 1, 0x5c422c, 0.75, 0.06);
  const g = new THREE.Group();
  g.position.set(x, y, z);
  if (alongZ) g.rotation.y = Math.PI / 2;

  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height * 0.65, 0.14), glassMat);
  body.position.y = -height * 0.18;
  g.add(body);

  const arch = new THREE.Mesh(
    new THREE.CylinderGeometry(width * 0.5, width * 0.5, 0.14, 16, 1, false, 0, Math.PI),
    glassMat
  );
  arch.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  arch.position.y = height * 0.14;
  g.add(arch);

  const archTrim = new THREE.Mesh(new THREE.TorusGeometry(width * 0.54, 0.09, 8, 16, Math.PI), frameMat);
  archTrim.position.set(0, height * 0.14, 0.05);
  g.add(archTrim);

  [-width * 0.54, width * 0.54].forEach((jx) => {
    const jamb = new THREE.Mesh(new THREE.BoxGeometry(0.14, height * 0.68, 0.18), frameMat);
    jamb.position.set(jx, -height * 0.18, 0.04);
    g.add(jamb);
  });

  const vBar = new THREE.Mesh(new THREE.BoxGeometry(0.06, height * 0.85, 0.16), woodMat);
  vBar.position.set(0, -height * 0.05, 0.03);
  const hBar = new THREE.Mesh(new THREE.BoxGeometry(width, 0.06, 0.16), woodMat);
  hBar.position.set(0, -height * 0.12, 0.03);
  g.add(vBar, hBar);

  const sill = new THREE.Mesh(new THREE.BoxGeometry(width + 0.42, 0.18, 0.28), frameMat);
  sill.position.set(0, -height * 0.54, 0.08);
  g.add(sill);
  ctx.group.add(g);
}

export function addFluorescentTube(ctx: MapBuildContext, x: number, y: number, z: number, alongZ = false, addLight = true): void {
  const fixture = new THREE.Mesh(
    new THREE.BoxGeometry(alongZ ? 0.22 : 1.56, 0.09, alongZ ? 1.56 : 0.22),
    getMat(ctx, 'metal', 1, 1, 0x2d3238, 0.42, 0.72)
  );
  fixture.position.set(x, y, z);
  ctx.group.add(fixture);

  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 1.38, 10),
    new THREE.MeshBasicMaterial({ color: 0xf4f9ff })
  );
  tube.rotation.z = alongZ ? 0 : Math.PI / 2;
  tube.rotation.x = alongZ ? Math.PI / 2 : 0;
  tube.position.set(x, y - 0.08, z);
  ctx.group.add(tube);

  if (addLight) {
    const pt = new THREE.PointLight(0xe4f1ff, 2.0, 22, 1.5);
    pt.position.set(x, y - 0.35, z);
    ctx.group.add(pt);
  }
}

export function addRedWallLadder(
  ctx: MapBuildContext,
  x: number,
  y: number,
  z: number,
  height: number,
  facingAxis: 'x+' | 'x-' | 'z+' | 'z-' = 'z+'
): void {
  const mat = getMat(ctx, 'metal', 1, 1, 0xb8352a, 0.42, 0.65);
  const g = new THREE.Group();
  g.position.set(x, y, z);
  if (facingAxis === 'x+') g.rotation.y = Math.PI / 2;
  else if (facingAxis === 'x-') g.rotation.y = -Math.PI / 2;
  else if (facingAxis === 'z-') g.rotation.y = Math.PI;

  [-0.26, 0.26].forEach((rx) => {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, height, 8), mat);
    rail.position.set(rx, height / 2, 0);
    g.add(rail);
  });
  for (let ry = 0.35; ry < height; ry += 0.38) {
    const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.52, 8), mat);
    rung.rotation.z = Math.PI / 2;
    rung.position.set(0, ry, 0);
    g.add(rung);
  }
  ctx.group.add(g);
}

export function addHedgeRow(ctx: MapBuildContext, x: number, y: number, z: number, length: number, alongX = true): void {
  const w = alongX ? length : 1.05;
  const d = alongX ? 1.05 : length;
  const stoneMat = getMat(ctx, 'concrete', 2, 1, 0xb2a696, 0.86, 0.04);
  const leafMat = getMat(ctx, 'foliage_leaf', 3, 2, 0x4b7438, 0.78, 0.02);

  const planter = new THREE.Mesh(new THREE.BoxGeometry(w, 0.34, d), stoneMat);
  planter.position.set(x, y + 0.17, z);
  planter.castShadow = ctx.shadows;
  planter.receiveShadow = ctx.shadows;
  ctx.group.add(planter);
  ctx.raycastMeshes.push(planter);

  const count = Math.max(3, Math.round(length / 0.85));
  const bushGeo = new THREE.DodecahedronGeometry(0.58, 1);
  for (let i = 0; i < count; i++) {
    const off = -length * 0.44 + (i / Math.max(1, count - 1)) * (length * 0.88);
    const bush = new THREE.Mesh(bushGeo, leafMat);
    const scaleH = 0.92 + ((i * 7) % 3) * 0.12;
    bush.scale.set(0.95, scaleH, 0.95);
    bush.rotation.y = i * 0.9;
    bush.position.set(x + (alongX ? off : 0), y + 0.74, z + (alongX ? 0 : off));
    bush.castShadow = ctx.shadows;
    bush.receiveShadow = ctx.shadows;
    ctx.group.add(bush);
    ctx.raycastMeshes.push(bush);
  }

  ctx.colliders.push({
    minX: x - w / 2,
    maxX: x + w / 2,
    minY: y,
    maxY: y + 1.25,
    minZ: z - d / 2,
    maxZ: z + d / 2,
  });
}

export function addBunkerBlastDoor(ctx: MapBuildContext, x: number, y: number, z: number, w = 7.4, h = 5.4, rotY = 0): void {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;

  const archFrame = new THREE.Mesh(
    new THREE.CylinderGeometry(w * 0.58, w * 0.58, 1.2, 24, 1, false, 0, Math.PI),
    getMat(ctx, 'concrete', 2, 1, 0x5c6066, 0.85, 0.08)
  );
  archFrame.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  archFrame.position.set(0, h * 0.48, 0);
  g.add(archFrame);

  const doorMat = new THREE.MeshStandardMaterial({
    map: textures.createBlastDoorTexture(),
    normalMap: textures.getPair('metal', 2, 2).normalMap,
    normalScale: new THREE.Vector2(0.7, 0.7),
    roughness: 0.48,
    metalness: 0.62,
  });
  const door = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.6), doorMat);
  door.position.set(0, h / 2, 0.15);
  door.castShadow = ctx.shadows;
  door.receiveShadow = ctx.shadows;
  g.add(door);

  const ramMat = getMat(ctx, 'metal', 1, 1, 0x2d3238, 0.35, 0.82);
  [-w * 0.42, w * 0.42].forEach((rx) => {
    const ram = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, h * 0.72, 12), ramMat);
    ram.position.set(rx, h * 0.36, 0.52);
    g.add(ram);
  });

  const beacon = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.28, 0.28, 12),
    new THREE.MeshBasicMaterial({ color: 0xff3b24 })
  );
  beacon.position.set(0, h + 0.45, 0.65);
  g.add(beacon);

  const redLight = new THREE.PointLight(0xff4a2b, 2.2, 14, 1.6);
  redLight.position.set(0, h + 0.1, 1.2);
  g.add(redLight);

  ctx.group.add(g);
}

export function addArchway(
  ctx: MapBuildContext,
  x: number,
  y: number,
  z: number,
  spanWidth: number,
  openingWidth: number,
  wallHeight: number,
  openingHeight: number,
  depth: number,
  kind: TextureKind,
  tint = 0xffffff,
  rotateY = 0
): void {
  const sideW = Math.max(0.4, (spanWidth - openingWidth) / 2);
  const trimMat = getMat(ctx, 'concrete', 2, 1, 0xbdb2a2, 0.82, 0.05);
  if (rotateY === 0) {
    addSolidBox(ctx, x - openingWidth / 2 - sideW / 2, y, z, sideW, wallHeight, depth, kind, tint);
    addSolidBox(ctx, x + openingWidth / 2 + sideW / 2, y, z, sideW, wallHeight, depth, kind, tint);
    addSolidBox(ctx, x, y + openingHeight, z, openingWidth + 0.2, wallHeight - openingHeight, depth, kind, tint);
    addSolidBox(ctx, x - openingWidth / 2 - 0.12, y, z, 0.38, openingHeight, depth + 0.24, 'concrete', 0xbab0a2, 0.84, 0.04, 1, 2, false);
    addSolidBox(ctx, x + openingWidth / 2 + 0.12, y, z, 0.38, openingHeight, depth + 0.24, 'concrete', 0xbab0a2, 0.84, 0.04, 1, 2, false);
    addSolidBox(ctx, x, y + openingHeight - 0.1, z, openingWidth + 0.85, 0.38, depth + 0.3, 'concrete', 0xbab0a2, 0.82, 0.05, 2, 1, false);
    const archRadius = Math.min(openingWidth * 0.48, 3.6);
    const archRing = new THREE.Mesh(new THREE.TorusGeometry(archRadius, 0.16, 8, 20, Math.PI), trimMat);
    archRing.position.set(x, y + openingHeight - 0.2, z + depth * 0.5 + 0.06);
    ctx.group.add(archRing);
    const archRingBack = archRing.clone();
    archRingBack.position.z = z - depth * 0.5 - 0.06;
    ctx.group.add(archRingBack);
    addSolidBox(ctx, x, y + wallHeight, z, spanWidth + 0.32, 0.28, depth + 0.32, 'concrete', 0x9c8b75, 0.85, 0.04, 3, 1, false);
  } else {
    addSolidBox(ctx, x, y, z - openingWidth / 2 - sideW / 2, depth, wallHeight, sideW, kind, tint);
    addSolidBox(ctx, x, y, z + openingWidth / 2 + sideW / 2, depth, wallHeight, sideW, kind, tint);
    addSolidBox(ctx, x, y + openingHeight, z, depth, wallHeight - openingHeight, openingWidth + 0.2, kind, tint);
    addSolidBox(ctx, x, y, z - openingWidth / 2 - 0.12, depth + 0.24, openingHeight, 0.38, 'concrete', 0xbab0a2, 0.84, 0.04, 1, 2, false);
    addSolidBox(ctx, x, y, z + openingWidth / 2 + 0.12, depth + 0.24, openingHeight, 0.38, 'concrete', 0xbab0a2, 0.84, 0.04, 1, 2, false);
    addSolidBox(ctx, x, y + openingHeight - 0.1, z, depth + 0.3, 0.38, openingWidth + 0.85, 'concrete', 0xbab0a2, 0.82, 0.05, 2, 1, false);
    const archRadius = Math.min(openingWidth * 0.48, 3.6);
    const archRing = new THREE.Mesh(new THREE.TorusGeometry(archRadius, 0.16, 8, 20, Math.PI), trimMat);
    archRing.rotation.y = Math.PI / 2;
    archRing.position.set(x + depth * 0.5 + 0.06, y + openingHeight - 0.2, z);
    ctx.group.add(archRing);
    const archRingBack = archRing.clone();
    archRingBack.position.x = x - depth * 0.5 - 0.06;
    ctx.group.add(archRingBack);
    addSolidBox(ctx, x, y + wallHeight, z, depth + 0.32, 0.28, spanWidth + 0.32, 'concrete', 0x9c8b75, 0.85, 0.04, 3, 1, false);
  }
}

export function addDoubleDoors(
  ctx: MapBuildContext,
  x: number,
  y: number,
  z: number,
  width: number,
  gapWidth: number,
  height: number,
  tint = 0x5c4732,
  rotateY = 0
): void {
  const leafW = Math.max(0.5, (width - gapWidth) / 2);
  const ironMat = getMat(ctx, 'metal', 1, 1, 0x26292e, 0.42, 0.76);
  const brassMat = getMat(ctx, 'metal', 1, 1, 0xb89448, 0.3, 0.85);
  const offset = gapWidth / 2 + leafW / 2;

  [-1, 1].forEach((side) => {
    const lx = rotateY === 0 ? x + side * offset : x;
    const lz = rotateY === 0 ? z : z + side * offset;
    const w = rotateY === 0 ? leafW : 0.42;
    const d = rotateY === 0 ? 0.42 : leafW;

    addSolidBox(ctx, lx, y, lz, w, height, d, 'wood_plank', tint, 0.72, 0.1, 1, 2);

    [0.75, height * 0.5, height - 0.68].forEach((sy) => {
      const strap = new THREE.Mesh(
        new THREE.BoxGeometry(rotateY === 0 ? leafW + 0.06 : 0.48, 0.16, rotateY === 0 ? 0.48 : leafW + 0.06),
        ironMat
      );
      strap.position.set(lx, y + sy, lz);
      ctx.group.add(strap);
    });

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.022, 8, 14), brassMat);
    const edgeOff = -side * (leafW * 0.38);
    ring.position.set(
      rotateY === 0 ? lx + edgeOff : lx + 0.25,
      y + 1.25,
      rotateY === 0 ? lz + 0.25 : lz + edgeOff
    );
    ring.rotation.y = rotateY;
    ctx.group.add(ring);
  });

  addSolidBox(
    ctx,
    x,
    y + height,
    z,
    rotateY === 0 ? width + 0.9 : 0.78,
    0.52,
    rotateY === 0 ? 0.78 : width + 0.9,
    'sandstone',
    0xcab28b,
    0.85,
    0.05,
    2,
    1
  );
}

export function addSandbagBarricade(
  ctx: MapBuildContext,
  x: number,
  y: number,
  z: number,
  lengthCount = 4,
  layers = 2,
  alongX = true,
  tint = 0xbda782
): void {
  const bagMat = getMat(ctx, 'sand', 1, 1, tint, 0.9, 0.02);
  const bagGeo = new THREE.CapsuleGeometry(0.18, 0.46, 6, 12);
  for (let row = 0; row < layers; row++) {
    const count = Math.max(1, lengthCount - row);
    for (let i = 0; i < count; i++) {
      const off = (i - (count - 1) / 2) * 0.78;
      const bag = new THREE.Mesh(bagGeo, bagMat);
      bag.rotation.z = alongX ? Math.PI / 2 : 0;
      bag.rotation.x = alongX ? 0 : Math.PI / 2;
      bag.rotation.y = ((i + row) % 2 === 0 ? 1 : -1) * 0.06;
      bag.position.set(
        x + (alongX ? off : ((row % 2) - 0.5) * 0.06),
        y + 0.18 + row * 0.3,
        z + (alongX ? ((row % 2) - 0.5) * 0.06 : off)
      );
      bag.castShadow = ctx.shadows;
      bag.receiveShadow = ctx.shadows;
      ctx.group.add(bag);
    }
  }
  const span = lengthCount * 0.78;
  const h = layers * 0.32 + 0.08;
  ctx.colliders.push({
    minX: x - (alongX ? span / 2 : 0.32),
    maxX: x + (alongX ? span / 2 : 0.32),
    minY: y,
    maxY: y + h,
    minZ: z - (alongX ? 0.32 : span / 2),
    maxZ: z + (alongX ? 0.32 : span / 2),
  });
}

export function addMarketAwning(
  ctx: MapBuildContext,
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  clothTint = 0xb5533c,
  pitchX = false,
  withLantern = false
): void {
  const woodMat = getMat(ctx, 'wood_plank', 1, 1, 0x5e4028, 0.85, 0.04);
  const clothMat = new THREE.MeshStandardMaterial({
    color: clothTint,
    roughness: 0.86,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });
  const trimClothMat = new THREE.MeshStandardMaterial({
    color: 0xf0e4cf,
    roughness: 0.88,
    metalness: 0.02,
  });

  const canopy = new THREE.Mesh(new THREE.BoxGeometry(w, 0.09, d), clothMat);
  canopy.position.set(x, y, z);
  canopy.rotation.x = pitchX ? 0 : 0.22;
  canopy.rotation.z = pitchX ? 0.22 : 0;
  canopy.castShadow = ctx.shadows;
  canopy.receiveShadow = ctx.shadows;
  ctx.group.add(canopy);

  const valance = new THREE.Mesh(new THREE.BoxGeometry(pitchX ? 0.08 : w, 0.22, pitchX ? d : 0.08), trimClothMat);
  valance.position.set(x + (pitchX ? w * 0.49 : 0), y - 0.12 - d * 0.1, z + (pitchX ? 0 : d * 0.49));
  ctx.group.add(valance);

  for (let i = -1; i <= 1; i++) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(pitchX ? w : 0.14, 0.14, pitchX ? 0.14 : d), woodMat);
    beam.position.set(x + (pitchX ? 0 : i * (w * 0.38)), y - 0.08, z + (pitchX ? i * (d * 0.38) : 0));
    beam.rotation.x = pitchX ? 0 : 0.22;
    beam.rotation.z = pitchX ? 0.22 : 0;
    ctx.group.add(beam);
  }

  if (withLantern) {
    const lamp = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.1, 0.26, 10),
      new THREE.MeshBasicMaterial({ color: 0xffd28a })
    );
    lamp.position.set(x, y - 0.35, z);
    ctx.group.add(lamp);
    const pt = new THREE.PointLight(0xffb866, 1.4, 15, 1.6);
    pt.position.set(x, y - 0.5, z);
    ctx.group.add(pt);
  }
}

export function addWindowShutter(
  ctx: MapBuildContext,
  x: number,
  y: number,
  z: number,
  alongZ = false,
  shutterColor = 0x526b5c
): void {
  const frameMat = getMat(ctx, 'wood_plank', 1, 1, shutterColor, 0.74, 0.08);
  const glassMat = getMat(ctx, 'window_glass', 2, 2, 0x89aec9, 0.16, 0.45, 0.4);
  const trimMat = getMat(ctx, 'concrete', 1, 1, 0xd4cab8, 0.82, 0.04);
  const g = new THREE.Group();
  g.position.set(x, y, z);
  if (alongZ) g.rotation.y = Math.PI / 2;

  const recess = new THREE.Mesh(new THREE.BoxGeometry(1.36, 1.75, 0.12), glassMat);
  g.add(recess);
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.75, 0.16), trimMat);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.06, 0.16), trimMat);
  g.add(crossV, crossH);

  [-0.84, 0.84].forEach((sx) => {
    const shutter = new THREE.Mesh(new THREE.BoxGeometry(0.36, 1.78, 0.1), frameMat);
    shutter.position.set(sx, 0, 0.04);
    g.add(shutter);
  });

  const lintel = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.18, 0.24), trimMat);
  lintel.position.set(0, 0.96, 0.06);
  const sill = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.16, 0.26), trimMat);
  sill.position.set(0, -0.94, 0.07);
  g.add(lintel, sill);
  ctx.group.add(g);
}

export function addIndustrialPipeRun(
  ctx: MapBuildContext,
  x: number,
  y: number,
  z: number,
  length: number,
  alongX = true,
  tint = 0x62707d,
  radius = 0.22
): void {
  const mat = getMat(ctx, 'metal', 2, 1, tint, 0.4, 0.7);
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 14), mat);
  pipe.position.set(x, y, z);
  pipe.rotation.z = alongX ? Math.PI / 2 : 0;
  pipe.rotation.x = alongX ? 0 : Math.PI / 2;
  pipe.castShadow = ctx.shadows;
  ctx.group.add(pipe);

  const collarMat = getMat(ctx, 'metal', 1, 1, 0x2c3238, 0.38, 0.8);
  for (let off = -length * 0.35; off <= length * 0.36; off += length * 0.35) {
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.24, radius * 1.24, 0.14, 14), collarMat);
    collar.rotation.copy(pipe.rotation);
    collar.position.set(x + (alongX ? off : 0), y, z + (alongX ? 0 : off));
    ctx.group.add(collar);
  }
}

export function addTunnelLantern(ctx: MapBuildContext, x: number, y: number, z: number, addLight = true): void {
  const ironMat = getMat(ctx, 'metal', 1, 1, 0x24282e, 0.45, 0.75);
  const cap = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.16, 10), ironMat);
  cap.position.set(x, y + 0.18, z);
  ctx.group.add(cap);

  const cage = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.12, 0.28, 10),
    new THREE.MeshBasicMaterial({ color: 0xffd088 })
  );
  cage.position.set(x, y, z);
  ctx.group.add(cage);
  if (addLight) {
    const pt = new THREE.PointLight(0xffb463, 2.1, 24, 1.45);
    pt.position.set(x, y - 0.25, z);
    ctx.group.add(pt);
  }
}

export function addCrate(
  ctx: MapBuildContext,
  x: number,
  y: number,
  z: number,
  size = 1.6,
  h?: number,
  tint = 0xffffff,
  kind: TextureKind = 'crate'
): void {
  const height = h ?? size;
  if (kind === 'crate' || kind === 'crate_military') {
    ctx.propBatch.addCrateInstance(x, y, z, size, height, tint, kind);
    const baseY = y < 0.05 ? y + 0.12 : y;
    ctx.colliders.push({
      minX: x - size / 2,
      maxX: x + size / 2,
      minY: baseY,
      maxY: baseY + height,
      minZ: z - size / 2,
      maxZ: z + size / 2,
    });
    return;
  }
  if (y < 0.05) {
    addSolidBox(ctx, x, y, z, size + 0.16, 0.12, size + 0.16, 'wood_plank', 0x6b4c30, 0.88, 0.04, 1, 1, false);
    addSolidBox(ctx, x, y + 0.12, z, size, height, size, kind, tint, 0.78, 0.08, 1, 1);
    return;
  }
  addSolidBox(ctx, x, y, z, size, height, size, kind, tint, 0.78, 0.08, 1, 1);
}

export function addOilBarrel(ctx: MapBuildContext, x: number, y: number, z: number, tint = 0x3b593d): void {
  ctx.propBatch.addBarrelInstance(x, y, z, tint);
  ctx.colliders.push({
    minX: x - 0.48,
    maxX: x + 0.48,
    minY: y,
    maxY: y + 1.28,
    minZ: z - 0.48,
    maxZ: z + 0.48,
  });
}

export function addShippingContainer(
  ctx: MapBuildContext,
  x: number,
  y: number,
  z: number,
  length: number,
  height: number,
  width: number,
  colorKind: 'container_blue' | 'container_red',
  alongX = true
): void {
  const w = alongX ? length : width;
  const d = alongX ? width : length;
  addSolidBox(ctx, x, y, z, w, height, d, colorKind, 0xffffff, 0.5, 0.5, Math.round(length / 3), 1);
  const frameMat = getMat(ctx, 'metal', 1, 1, 0x2a3038, 0.42, 0.72);
  const topFrame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.15, d + 0.1), frameMat);
  topFrame.position.set(x, y + height - 0.05, z);
  const botFrame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.12, d + 0.1), frameMat);
  botFrame.position.set(x, y + 0.06, z);
  ctx.group.add(topFrame, botFrame);

  [-0.35, 0.35].forEach((off) => {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, height * 0.9, 8), frameMat);
    bar.position.set(
      x + (alongX ? w / 2 + 0.04 : off * width),
      y + height * 0.5,
      z + (alongX ? off * width : d / 2 + 0.04)
    );
    ctx.group.add(bar);
  });
}

export function addFreightTrainCar(ctx: MapBuildContext, x: number, y: number, z: number, tint: number): void {
  addSolidBox(ctx, x, y, z, 10.6, 0.65, 3.0, 'metal', 0x202429, 0.6, 0.7, 2, 1);
  const kind = tint === 0x8f3932 ? 'container_red' : tint === 0x3b5370 ? 'container_blue' : 'corrugated_metal';
  addSolidBox(ctx, x, y + 0.65, z, 11.2, 2.7, 3.3, kind, kind === 'corrugated_metal' ? tint : 0xffffff, 0.48, 0.48, 3, 1);
  addSolidBox(ctx, x, y + 3.35, z, 11.4, 0.35, 3.1, 'metal', 0x383e45, 0.42, 0.65, 3, 1, false);
  addRedWallLadder(ctx, x + 5.66, y + 0.6, z + 0.9, 2.85, 'x+');
  addRedWallLadder(ctx, x - 5.66, y + 0.6, z - 0.9, 2.85, 'x-');
  const wheelMat = getMat(ctx, 'metal', 1, 1, 0x16181c, 0.38, 0.85);
  [-3.8, -2.8, 2.8, 3.8].forEach((wx) => {
    [-1.4, 1.4].forEach((wz) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.22, 16), wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x + wx, y + 0.38, z + wz);
      ctx.group.add(wheel);
    });
  });
}

export function addFountain(ctx: MapBuildContext, x: number, y: number, z: number): void {
  const stoneMat = getMat(ctx, 'concrete', 2, 1, 0xc9bfb0, 0.78, 0.05);
  const rimMat = getMat(ctx, 'sandstone_frieze', 3, 1, 0xd6cab8, 0.76, 0.05);
  const waterMat = getMat(ctx, 'water', 2, 2, 0x4ca6ba, 0.14, 0.32);

  const outerRim = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 2.7, 0.68, 8), rimMat);
  outerRim.position.set(x, y + 0.34, z);
  outerRim.castShadow = ctx.shadows;
  outerRim.receiveShadow = ctx.shadows;
  ctx.group.add(outerRim);
  ctx.raycastMeshes.push(outerRim);
  ctx.colliders.push({
    minX: x - 2.35,
    maxX: x + 2.35,
    minY: y,
    maxY: y + 0.68,
    minZ: z - 2.35,
    maxZ: z + 2.35,
  });

  const water = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.25, 0.12, 8), waterMat);
  water.position.set(x, y + 0.62, z);
  ctx.group.add(water);

  const pedestalPts = [
    new THREE.Vector2(0.01, 0),
    new THREE.Vector2(0.65, 0),
    new THREE.Vector2(0.55, 0.25),
    new THREE.Vector2(0.32, 0.55),
    new THREE.Vector2(0.38, 0.95),
    new THREE.Vector2(1.05, 1.25),
    new THREE.Vector2(1.12, 1.42),
    new THREE.Vector2(0.88, 1.44),
    new THREE.Vector2(0.28, 1.28),
    new THREE.Vector2(0.22, 1.85),
    new THREE.Vector2(0.45, 2.05),
    new THREE.Vector2(0.01, 2.1),
  ];
  const pedestal = new THREE.Mesh(new THREE.LatheGeometry(pedestalPts, 16), stoneMat);
  pedestal.position.set(x, y + 0.5, z);
  pedestal.castShadow = ctx.shadows;
  pedestal.receiveShadow = ctx.shadows;
  ctx.group.add(pedestal);
  ctx.raycastMeshes.push(pedestal);
  ctx.colliders.push({
    minX: x - 0.65,
    maxX: x + 0.65,
    minY: y + 0.5,
    maxY: y + 2.2,
    minZ: z - 0.65,
    maxZ: z + 0.65,
  });

  const spireWater = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.65, 12), waterMat);
  spireWater.position.set(x, y + 2.65, z);
  ctx.group.add(spireWater);
}

export function addPalmTree(ctx: MapBuildContext, x: number, y: number, z: number, height = 6.2): void {
  ctx.propBatch.addPalmInstance(x, y, z, height);
  ctx.colliders.push({
    minX: x - 0.35,
    maxX: x + 0.35,
    minY: y,
    maxY: y + height,
    minZ: z - 0.35,
    maxZ: z + 0.35,
  });
}

export function addPineTree(ctx: MapBuildContext, x: number, y: number, z: number, scale = 1.0): void {
  ctx.propBatch.addPineInstance(x, y, z, scale);
  ctx.colliders.push({
    minX: x - 0.4,
    maxX: x + 0.4,
    minY: y,
    maxY: y + 4 * scale,
    minZ: z - 0.4,
    maxZ: z + 0.4,
  });
}

export function addStreetLamp(ctx: MapBuildContext, x: number, y: number, z: number, warmColor = 0xffb85c, addLight = true): void {
  const poleMat = getMat(ctx, 'metal', 1, 2, 0x272c33, 0.45, 0.75);
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 0.65, 10), poleMat);
  plinth.position.set(x, y + 0.325, z);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 5.1, 10), poleMat);
  pole.position.set(x, y + 2.9, z);
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.1, 0.1), poleMat);
  arm.position.set(x + 0.25, y + 5.4, z);
  const hood = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.2, 10), poleMat);
  hood.position.set(x + 0.48, y + 5.48, z);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.16, 10, 8),
    new THREE.MeshBasicMaterial({ color: warmColor })
  );
  bulb.position.set(x + 0.48, y + 5.34, z);
  ctx.group.add(plinth, pole, arm, hood, bulb);
  if (addLight) {
    const pt = new THREE.PointLight(warmColor, 2.0, 24, 1.5);
    pt.position.set(x + 0.48, y + 5.05, z);
    ctx.group.add(pt);
  }
}

export function addVehicle(ctx: MapBuildContext, x: number, y: number, z: number, bodyTint: number, alongZ = true): void {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  if (!alongZ) g.rotation.y = Math.PI / 2;

  const carShape = new THREE.Shape();
  carShape.moveTo(-2.32, 0.36);
  carShape.lineTo(2.32, 0.36);
  carShape.lineTo(2.38, 0.66);
  carShape.lineTo(2.26, 0.94);
  carShape.lineTo(1.22, 1.06);
  carShape.lineTo(0.55, 1.62);
  carShape.lineTo(-0.88, 1.64);
  carShape.lineTo(-1.62, 1.12);
  carShape.lineTo(-2.26, 1.02);
  carShape.lineTo(-2.38, 0.64);
  carShape.closePath();

  const bodyGeo = new THREE.ExtrudeGeometry(carShape, {
    depth: 1.96,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.06,
    bevelSegments: 3,
  });
  bodyGeo.translate(0, 0, -0.98);
  bodyGeo.rotateY(-Math.PI / 2);

  const paintMat = new THREE.MeshStandardMaterial({
    color: bodyTint,
    roughness: 0.28,
    metalness: 0.58,
  });
  const body = new THREE.Mesh(bodyGeo, paintMat);
  body.castShadow = ctx.shadows;
  body.receiveShadow = ctx.shadows;
  g.add(body);
  ctx.raycastMeshes.push(body);

  const trimMat = getMat(ctx, 'metal', 1, 1, 0x1d2126, 0.55, 0.4);
  const fBump = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.22, 0.22), trimMat);
  fBump.position.set(0, 0.42, 2.38);
  const rBump = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.22, 0.22), trimMat);
  rBump.position.set(0, 0.42, -2.38);
  g.add(fBump, rBump);

  const glassMat = new THREE.MeshStandardMaterial({ color: 0x192836, roughness: 0.12, metalness: 0.85 });
  const cabinGlass = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.46, 2.05), glassMat);
  cabinGlass.position.set(0, 1.32, -0.15);
  cabinGlass.rotation.x = 0.04;
  g.add(cabinGlass);

  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff0c4 });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xd9322b });
  const grille = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.24, 0.08), trimMat);
  grille.position.set(0, 0.72, 2.36);
  g.add(grille);

  [-0.76, 0.76].forEach((sx) => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.08), headMat);
    hl.position.set(sx, 0.76, 2.36);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.16, 0.08), tailMat);
    tl.position.set(sx, 0.78, -2.36);
    const mirror = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.16), paintMat);
    mirror.position.set(sx * 1.44, 1.1, 0.72);
    g.add(hl, tl, mirror);
  });

  const wheelMat = getMat(ctx, 'asphalt', 1, 1, 0x15171a, 0.85, 0.1);
  const rimMat = getMat(ctx, 'metal', 1, 1, 0xb8c0c9, 0.28, 0.85);
  [-1.02, 1.02].forEach((side) => {
    [-1.45, 1.45].forEach((axle) => {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.41, 0.41, 0.28, 18), wheelMat);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.3, 12), rimMat);
      w.rotation.z = Math.PI / 2;
      rim.rotation.z = Math.PI / 2;
      w.position.set(side, 0.41, axle);
      rim.position.set(side, 0.41, axle);
      w.castShadow = ctx.shadows;
      g.add(w, rim);
    });
  });

  ctx.group.add(g);
  const cw = alongZ ? 2.25 : 4.75;
  const cd = alongZ ? 4.75 : 2.25;
  ctx.colliders.push({
    minX: x - cw / 2,
    maxX: x + cw / 2,
    minY: y,
    maxY: y + 1.65,
    minZ: z - cd / 2,
    maxZ: z + cd / 2,
  });
}

export function addSteps(
  ctx: MapBuildContext,
  startX: number,
  startY: number,
  startZ: number,
  dirX: number,
  dirZ: number,
  width: number,
  totalRise: number,
  totalRun: number,
  steps = 6,
  kind: TextureKind = 'sandstone'
): void {
  const stepH = totalRise / steps;
  const stepRun = totalRun / steps;
  for (let i = 0; i < steps; i++) {
    const cx = startX + dirX * (i + 0.5) * stepRun;
    const cz = startZ + dirZ * (i + 0.5) * stepRun;
    const h = (i + 1) * stepH;
    const w = Math.abs(dirZ) > 0.5 ? width : stepRun + 0.08;
    const d = Math.abs(dirX) > 0.5 ? width : stepRun + 0.08;
    addSolidBox(ctx, cx, startY, cz, w, h, d, kind, 0xffffff, 0.86, 0.04, 1, 1);
  }
}

export function addSiteDecal(ctx: MapBuildContext, x: number, y: number, z: number, letter: 'A' | 'B'): void {
  const mat = new THREE.MeshStandardMaterial({
    map: textures.createSiteDecal(letter),
    transparent: true,
    roughness: 0.88,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), mat);
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(x, y + 0.03, z);
  plane.receiveShadow = ctx.shadows;
  ctx.group.add(plane);
}

function createSculptedPeakGeometry(): THREE.BufferGeometry {
  const geo = new THREE.ConeGeometry(1, 1, 14, 4);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const px = pos.getX(i);
    const py = pos.getY(i);
    const pz = pos.getZ(i);
    const r = Math.hypot(px, pz);
    if (r > 0.05) {
      const ang = Math.atan2(pz, px);
      const ridge = 1 + 0.22 * Math.sin(ang * 3 + py * 2.5) + 0.14 * Math.cos(ang * 5);
      pos.setX(i, px * ridge);
      pos.setZ(i, pz * ridge);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

export function addGroundAndHorizon(
  ctx: MapBuildContext,
  width: number,
  depth: number,
  groundKind: TextureKind,
  groundTint: number,
  perimeterKind: TextureKind,
  perimeterTint: number,
  wallHeight = 8.4,
  biome: 'desert' | 'canyon' | 'urban' | 'jungle' | 'villa' | 'snow' = 'desert'
): void {
  const outerMat = getMat(ctx, groundKind, 56, 56, groundTint, 0.9, 0.03);
  const outerFloor = new THREE.Mesh(new THREE.PlaneGeometry(width * 3.8, depth * 3.8), outerMat);
  outerFloor.rotation.x = -Math.PI / 2;
  outerFloor.position.y = 0;
  outerFloor.receiveShadow = ctx.shadows;
  ctx.group.add(outerFloor);
  ctx.raycastMeshes.push(outerFloor);

  const hw = width / 2;
  const hd = depth / 2;
  addTrimWall(ctx, 0, 0, -hd - 1, width + 4, wallHeight, 2, perimeterKind, perimeterTint);
  addTrimWall(ctx, 0, 0, hd + 1, width + 4, wallHeight, 2, perimeterKind, perimeterTint);
  addTrimWall(ctx, -hw - 1, 0, 0, 2, wallHeight, depth, perimeterKind, perimeterTint);
  addTrimWall(ctx, hw + 1, 0, 0, 2, wallHeight, depth, perimeterKind, perimeterTint);

  const dummy = new THREE.Object3D();
  if (biome === 'desert' || biome === 'canyon' || biome === 'jungle' || biome === 'snow') {
    const peakColor =
      biome === 'canyon' ? 0x7d4c3b : biome === 'jungle' ? 0x455e43 : biome === 'snow' ? 0xb4c7d9 : 0xa38562;
    const peakGeo = createSculptedPeakGeometry();
    const peakMat = getMat(ctx, biome === 'canyon' ? 'cliff_rock' : perimeterKind, 3, 2, peakColor, 0.92, 0.03);
    const inst = new THREE.InstancedMesh(peakGeo, peakMat, 44);
    for (let i = 0; i < 44; i++) {
      const angle = (i / 44) * Math.PI * 2;
      const dist = Math.max(width, depth) * 0.78 + (i % 4) * 16;
      const h = (biome === 'canyon' ? 28 : 30) + (i % 5) * 10;
      const r = 22 + (i % 4) * 9;
      dummy.position.set(Math.cos(angle) * dist, h * 0.46, Math.sin(angle) * dist);
      dummy.scale.set(r, h, r * 0.85);
      dummy.rotation.y = angle + (i % 3) * 0.4;
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.computeBoundingSphere();
    ctx.group.add(inst);
  } else {
    const skyGeo = new THREE.BoxGeometry(1, 1, 1);
    const skyMat = new THREE.MeshStandardMaterial({
      map: textures.createCityWindowFacadeTexture(biome === 'villa' ? '#9e8068' : '#57463e'),
      roughness: 0.82,
      metalness: 0.08,
    });
    const inst = new THREE.InstancedMesh(skyGeo, skyMat, 32);
    const roofCapGeo = new THREE.BoxGeometry(1.06, 0.06, 1.06);
    const roofCapMat = getMat(
      ctx,
      biome === 'villa' ? 'roof_tile' : 'concrete',
      2,
      2,
      biome === 'villa' ? 0xb86545 : 0x5c636b,
      0.8,
      0.06
    );
    const roofInst = new THREE.InstancedMesh(roofCapGeo, roofCapMat, 32);

    for (let i = 0; i < 32; i++) {
      const angle = (i / 32) * Math.PI * 2;
      const dist = Math.max(width, depth) * 0.72 + (i % 3) * 12;
      const h = 18 + (i % 5) * 7;
      const w = 13 + (i % 4) * 5;
      dummy.position.set(Math.cos(angle) * dist, h / 2 - 0.5, Math.sin(angle) * dist);
      dummy.scale.set(w, h, w);
      dummy.rotation.y = angle * 0.5;
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);

      dummy.position.set(Math.cos(angle) * dist, h - 0.15, Math.sin(angle) * dist);
      dummy.scale.set(w, 8, w);
      dummy.updateMatrix();
      roofInst.setMatrixAt(i, dummy.matrix);
    }
    inst.computeBoundingSphere();
    roofInst.computeBoundingSphere();
    ctx.group.add(inst, roofInst);
  }
}

export function addOfficeWorkstation(ctx: MapBuildContext, x: number, y: number, z: number, rotY = 0): void {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;
  const woodMat = getMat(ctx, 'wood_mahogany', 2, 1, 0x996944, 0.55, 0.08);
  const frameMat = getMat(ctx, 'metal', 1, 1, 0x262b30, 0.38, 0.78);
  const monitorCase = getMat(ctx, 'metal', 1, 1, 0x1b1e22, 0.42, 0.5);
  const screenMat = new THREE.MeshBasicMaterial({ color: 0x62a4de });
  const chairMat = new THREE.MeshStandardMaterial({ color: 0x282d33, roughness: 0.72, metalness: 0.08 });

  const top = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.09, 1.15), woodMat);
  top.position.set(0, 0.78, 0);
  const drawers = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.74, 1.04), woodMat);
  drawers.position.set(0.9, 0.37, 0);
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.74, 0.96), frameMat);
  legL.position.set(-1.18, 0.37, 0);
  const modesty = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.45, 0.06), woodMat);
  modesty.position.set(-0.2, 0.52, -0.45);
  g.add(top, drawers, legL, modesty);

  [-0.48, 0.42].forEach((mx, idx) => {
    const stand = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.16, 0.1), frameMat);
    stand.position.set(mx, 0.9, -0.26);
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.46, 0.05), monitorCase);
    bezel.position.set(mx, 1.16, -0.24);
    bezel.rotation.y = idx === 0 ? 0.12 : -0.14;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.4), screenMat);
    screen.position.set(mx, 1.16, -0.21);
    screen.rotation.y = bezel.rotation.y;
    g.add(stand, bezel, screen);
  });
  const keyboard = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.025, 0.16), monitorCase);
  keyboard.position.set(-0.05, 0.84, 0.18);
  g.add(keyboard);

  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.09, 0.54), chairMat);
  seat.position.set(0, 0.48, 0.92);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.62, 0.09), chairMat);
  back.position.set(0, 0.8, 1.18);
  back.rotation.x = -0.08;
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.42, 8), frameMat);
  stem.position.set(0, 0.25, 0.92);
  const baseStar = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.34, 0.05, 5), frameMat);
  baseStar.position.set(0, 0.06, 0.92);
  g.add(seat, back, stem, baseStar);

  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = ctx.shadows;
      o.receiveShadow = ctx.shadows;
    }
  });
  ctx.group.add(g);
  ctx.colliders.push({
    minX: x - 1.35,
    maxX: x + 1.35,
    minY: y,
    maxY: y + 0.85,
    minZ: z - 0.8,
    maxZ: z + 0.8,
  });
}

export function addTerracottaPot(ctx: MapBuildContext, x: number, y: number, z: number, scale = 1.0): void {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.scale.setScalar(scale);

  const potPts = [
    new THREE.Vector2(0.01, 0),
    new THREE.Vector2(0.24, 0),
    new THREE.Vector2(0.36, 0.45),
    new THREE.Vector2(0.31, 0.72),
    new THREE.Vector2(0.36, 0.8),
    new THREE.Vector2(0.28, 0.82),
    new THREE.Vector2(0.01, 0.7),
  ];
  const potMat = getMat(ctx, 'terracotta', 1, 1, 0xc26e4b, 0.78, 0.04);
  const pot = new THREE.Mesh(new THREE.LatheGeometry(potPts, 14), potMat);
  pot.castShadow = ctx.shadows;
  pot.receiveShadow = ctx.shadows;
  g.add(pot);

  const leafMat = getMat(ctx, 'foliage_leaf', 2, 2, 0x52823d, 0.72, 0.02);
  const shrub = new THREE.Mesh(new THREE.DodecahedronGeometry(0.38, 1), leafMat);
  shrub.position.y = 0.96;
  shrub.scale.set(1, 1.2, 1);
  shrub.castShadow = ctx.shadows;
  g.add(shrub);
  ctx.group.add(g);
}

export function addCafeBistroSet(ctx: MapBuildContext, x: number, y: number, z: number): void {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  const ironMat = getMat(ctx, 'metal', 1, 1, 0x25292e, 0.45, 0.72);
  const woodMat = getMat(ctx, 'wood_plank', 1, 1, 0x8c623d, 0.74, 0.06);

  const tableTop = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 16), woodMat);
  tableTop.position.y = 0.76;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.74, 10), ironMat);
  pole.position.y = 0.37;
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.06, 12), ironMat);
  foot.position.y = 0.03;
  g.add(tableTop, pole, foot);

  [-0.78, 0.78].forEach((cx) => {
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 12), woodMat);
    seat.position.set(cx, 0.46, 0);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.44, 8), ironMat);
    leg.position.set(cx, 0.22, 0);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.42, 0.4), ironMat);
    back.position.set(cx + Math.sign(cx) * 0.22, 0.68, 0);
    g.add(seat, leg, back);
  });

  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) {
      o.castShadow = ctx.shadows;
      o.receiveShadow = ctx.shadows;
    }
  });
  ctx.group.add(g);
}

export function addTempleBrazier(ctx: MapBuildContext, x: number, y: number, z: number): void {
  const stoneMat = getMat(ctx, 'moss_stone', 1, 1, 0x626e58, 0.88, 0.04);
  const pts = [
    new THREE.Vector2(0.01, 0),
    new THREE.Vector2(0.45, 0),
    new THREE.Vector2(0.32, 0.6),
    new THREE.Vector2(0.62, 0.95),
    new THREE.Vector2(0.54, 1.05),
    new THREE.Vector2(0.01, 0.85),
  ];
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(pts, 12), stoneMat);
  bowl.position.set(x, y, z);
  bowl.castShadow = ctx.shadows;
  ctx.group.add(bowl);

  const ember = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xff8c36 })
  );
  ember.scale.set(1.2, 0.6, 1.2);
  ember.position.set(x, y + 0.98, z);
  ctx.group.add(ember);

  const light = new THREE.PointLight(0xff9244, 1.6, 15, 1.6);
  light.position.set(x, y + 1.4, z);
  ctx.group.add(light);
}

export function addSafetyBollard(ctx: MapBuildContext, x: number, y: number, z: number): void {
  const yellowMat = getMat(ctx, 'hazard', 1, 1, 0xebb63b, 0.45, 0.35);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.95, 12), yellowMat);
  post.position.set(x, y + 0.475, z);
  post.castShadow = ctx.shadows;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), yellowMat);
  cap.position.set(x, y + 0.95, z);
  ctx.group.add(post, cap);
}

export function addSafetyRail(ctx: MapBuildContext, x: number, y: number, z: number, length: number, alongX = true, registerCollider = false): void {
  const railMat = getMat(ctx, 'metal', 1, 1, 0xd4a438, 0.42, 0.65);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, length, 8), railMat);
  top.position.set(x, y + 1.05, z);
  top.rotation.z = alongX ? Math.PI / 2 : 0;
  top.rotation.x = alongX ? 0 : Math.PI / 2;
  const mid = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, length, 8), railMat);
  mid.position.set(x, y + 0.56, z);
  mid.rotation.copy(top.rotation);
  ctx.group.add(top, mid);

  const posts = Math.max(2, Math.round(length / 2.2) + 1);
  for (let i = 0; i < posts; i++) {
    const off = -length * 0.5 + (i / (posts - 1)) * length;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.08, 8), railMat);
    p.position.set(x + (alongX ? off : 0), y + 0.54, z + (alongX ? 0 : off));
    ctx.group.add(p);
  }
  if (registerCollider) {
    ctx.colliders.push({
      minX: x - (alongX ? length / 2 : 0.15),
      maxX: x + (alongX ? length / 2 : 0.15),
      minY: y,
      maxY: y + 1.1,
      minZ: z - (alongX ? 0.15 : length / 2),
      maxZ: z + (alongX ? 0.15 : length / 2),
    });
  }
}

export function linkWaypoints(nodes: WaypointNode[], a: string, b: string): void {
  const na = nodes.find((n) => n.id === a);
  const nb = nodes.find((n) => n.id === b);
  if (na && nb) {
    if (!na.neighbors.includes(b)) na.neighbors.push(b);
    if (!nb.neighbors.includes(a)) nb.neighbors.push(a);
  }
}
