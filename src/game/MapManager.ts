import * as THREE from 'three';
import { textures, TextureKind } from './ProceduralTextures';
import { attachHeroGlbLodProps, HeroGlbSpot, PropBatchBuilder } from './scenes/InstancedProps';
import { CharacterClassId, MapId, WeaponId } from './types';

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

interface BuildContext {
  group: THREE.Group;
  colliders: ColliderBox[];
  raycastMeshes: THREE.Mesh[];
  materials: Map<string, THREE.MeshStandardMaterial>;
  propBatch: PropBatchBuilder;
  shadows: boolean;
}

function getMat(
  ctx: BuildContext,
  kind: TextureKind,
  repeatX = 1,
  repeatY = 1,
  tint = 0xffffff,
  roughness = 0.84,
  metalness = 0.06,
  bumpScale = 0.045
): THREE.MeshStandardMaterial {
  const key = `${kind}:${repeatX}:${repeatY}:${tint}:${roughness}:${metalness}:${bumpScale}`;
  const existing = ctx.materials.get(key);
  if (existing) return existing;
  const pair = textures.getPair(kind, repeatX, repeatY);
  const mat = new THREE.MeshStandardMaterial({
    map: pair.map,
    bumpMap: pair.bumpMap,
    bumpScale,
    color: tint,
    roughness,
    metalness,
  });
  ctx.materials.set(key, mat);
  return mat;
}

function addSkyDome(ctx: BuildContext, zenith: number, horizon: number, cloud: number) {
  const tex = textures.createSkyDomeTexture(zenith, horizon, cloud);
  const geo = new THREE.SphereGeometry(220, 28, 16);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    side: THREE.BackSide,
    fog: false,
  });
  const dome = new THREE.Mesh(geo, mat);
  ctx.group.add(dome);
}

function addSolidBox(
  ctx: BuildContext,
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

function addTrimWall(
  ctx: BuildContext,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  kind: TextureKind,
  tint = 0xffffff,
  trimTint = 0x9c8668
) {
  addSolidBox(ctx, x, y, z, w, h, d, kind, tint);
  const friezeKind: TextureKind =
    kind === 'sandstone' ? 'sandstone_frieze' : kind === 'moss_stone' ? 'moss_stone' : 'concrete';
  const capMat = getMat(ctx, friezeKind, Math.max(1, Math.round(Math.max(w, d) / 2.2)), 1, trimTint, 0.85, 0.05);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.24, 0.42, d + 0.24), capMat);
  cap.position.set(x, y + h - 0.04, z);
  cap.castShadow = ctx.shadows;
  cap.receiveShadow = ctx.shadows;
  ctx.group.add(cap);

  if (kind === 'sandstone') {
    const basePlinth = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.18, 0.44, d + 0.18),
      getMat(ctx, 'sandstone_frieze', Math.max(1, Math.round(Math.max(w, d) / 2.2)), 1, 0xe8d5b0, 0.86, 0.04)
    );
    basePlinth.position.set(x, y + 0.22, z);
    basePlinth.receiveShadow = ctx.shadows;
    ctx.group.add(basePlinth);
  }
}

function addPlaneDecal(
  ctx: BuildContext,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  map: THREE.Texture,
  rotY = 0,
  rotX = 0,
  transparent = true
) {
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

function addArchedBlindWindow(
  ctx: BuildContext,
  x: number,
  y: number,
  z: number,
  alongZ = false,
  width = 1.65,
  height = 1.7
) {
  const recessMat = new THREE.MeshStandardMaterial({ color: 0x2a231c, roughness: 0.94, metalness: 0.05 });
  const frameMat = getMat(ctx, 'concrete', 1, 1, 0xa89272, 0.85, 0.04);
  const g = new THREE.Group();
  g.position.set(x, y, z);
  if (alongZ) g.rotation.y = Math.PI / 2;

  const body = new THREE.Mesh(new THREE.BoxGeometry(width, height * 0.65, 0.14), recessMat);
  body.position.y = -height * 0.18;
  g.add(body);

  const arch = new THREE.Mesh(
    new THREE.CylinderGeometry(width * 0.5, width * 0.5, 0.14, 14, 1, false, 0, Math.PI),
    recessMat
  );
  arch.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  arch.position.y = height * 0.14;
  g.add(arch);

  const sill = new THREE.Mesh(new THREE.BoxGeometry(width + 0.34, 0.16, 0.24), frameMat);
  sill.position.set(0, -height * 0.54, 0.06);
  g.add(sill);
  ctx.group.add(g);
}

function addFluorescentTube(ctx: BuildContext, x: number, y: number, z: number, alongZ = false) {
  const fixture = new THREE.Mesh(
    new THREE.BoxGeometry(alongZ ? 0.16 : 1.5, 0.08, alongZ ? 1.5 : 0.16),
    getMat(ctx, 'metal', 1, 1, 0x2d3238, 0.45, 0.7)
  );
  fixture.position.set(x, y, z);
  ctx.group.add(fixture);

  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 1.38, 8),
    new THREE.MeshBasicMaterial({ color: 0xf4f9ff })
  );
  tube.rotation.z = alongZ ? 0 : Math.PI / 2;
  tube.rotation.x = alongZ ? Math.PI / 2 : 0;
  tube.position.set(x, y - 0.08, z);
  ctx.group.add(tube);

  const pt = new THREE.PointLight(0xe4f1ff, 2.0, 20, 1.6);
  pt.position.set(x, y - 0.35, z);
  ctx.group.add(pt);
}

function addRedWallLadder(
  ctx: BuildContext,
  x: number,
  y: number,
  z: number,
  height: number,
  facingAxis: 'x+' | 'x-' | 'z+' | 'z-' = 'z+'
) {
  const mat = getMat(ctx, 'metal', 1, 1, 0xb8352a, 0.42, 0.65);
  const g = new THREE.Group();
  g.position.set(x, y, z);
  if (facingAxis === 'x+') g.rotation.y = Math.PI / 2;
  else if (facingAxis === 'x-') g.rotation.y = -Math.PI / 2;
  else if (facingAxis === 'z-') g.rotation.y = Math.PI;

  [-0.26, 0.26].forEach((rx) => {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, height, 6), mat);
    rail.position.set(rx, height / 2, 0);
    g.add(rail);
  });
  for (let ry = 0.35; ry < height; ry += 0.38) {
    const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.52, 6), mat);
    rung.rotation.z = Math.PI / 2;
    rung.position.set(0, ry, 0);
    g.add(rung);
  }
  ctx.group.add(g);
}

function addHedgeRow(ctx: BuildContext, x: number, y: number, z: number, length: number, alongX = true) {
  const mat = new THREE.MeshStandardMaterial({ color: 0x38572c, roughness: 0.92, metalness: 0.02 });
  const w = alongX ? length : 1.05;
  const d = alongX ? 1.05 : length;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, 1.25, d), mat);
  mesh.position.set(x, y + 0.625, z);
  mesh.castShadow = ctx.shadows;
  mesh.receiveShadow = ctx.shadows;
  ctx.group.add(mesh);
  ctx.raycastMeshes.push(mesh);
  ctx.colliders.push({
    minX: x - w / 2,
    maxX: x + w / 2,
    minY: y,
    maxY: y + 1.25,
    minZ: z - d / 2,
    maxZ: z + d / 2,
  });
}

function addBunkerBlastDoor(ctx: BuildContext, x: number, y: number, z: number, w = 7.4, h = 5.4, rotY = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = rotY;

  const archFrame = new THREE.Mesh(
    new THREE.CylinderGeometry(w * 0.58, w * 0.58, 1.2, 18, 1, false, 0, Math.PI),
    getMat(ctx, 'concrete', 2, 1, 0x5c6066, 0.85, 0.08)
  );
  archFrame.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  archFrame.position.set(0, h * 0.48, 0);
  g.add(archFrame);

  const doorMat = new THREE.MeshStandardMaterial({
    map: textures.createBlastDoorTexture(),
    roughness: 0.52,
    metalness: 0.58,
  });
  const door = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.6), doorMat);
  door.position.set(0, h / 2, 0.15);
  door.castShadow = ctx.shadows;
  door.receiveShadow = ctx.shadows;
  g.add(door);

  // Overhead glowing red hazard beacon like image_d0354829
  const beacon = new THREE.Mesh(
    new THREE.BoxGeometry(0.65, 0.24, 0.35),
    new THREE.MeshBasicMaterial({ color: 0xff3b24 })
  );
  beacon.position.set(0, h + 0.45, 0.65);
  g.add(beacon);

  const redLight = new THREE.PointLight(0xff4a2b, 2.2, 14, 1.6);
  redLight.position.set(0, h + 0.1, 1.2);
  g.add(redLight);

  ctx.group.add(g);
}

function addArchway(
  ctx: BuildContext,
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
) {
  const sideW = (spanWidth - openingWidth) / 2;
  if (rotateY === 0) {
    addSolidBox(ctx, x - openingWidth / 2 - sideW / 2, y, z, sideW, wallHeight, depth, kind, tint);
    addSolidBox(ctx, x + openingWidth / 2 + sideW / 2, y, z, sideW, wallHeight, depth, kind, tint);
    addSolidBox(ctx, x, y + openingHeight, z, openingWidth + 0.2, wallHeight - openingHeight, depth, kind, tint);
    // Stepped stone pilasters & arched keystone lintel
    addSolidBox(ctx, x - openingWidth / 2 - 0.12, y, z, 0.36, openingHeight, depth + 0.22, 'concrete', 0xbab0a2, 0.85, 0.04, 1, 2, false);
    addSolidBox(ctx, x + openingWidth / 2 + 0.12, y, z, 0.36, openingHeight, depth + 0.22, 'concrete', 0xbab0a2, 0.85, 0.04, 1, 2, false);
    addSolidBox(ctx, x, y + openingHeight - 0.1, z, openingWidth + 0.8, 0.36, depth + 0.28, 'concrete', 0xbab0a2, 0.82, 0.05, 2, 1, false);
    // Roof parapet trim cap
    addSolidBox(ctx, x, y + wallHeight, z, spanWidth + 0.26, 0.24, depth + 0.26, 'concrete', 0x9c8b75, 0.86, 0.04, 3, 1, false);
  } else {
    addSolidBox(ctx, x, y, z - openingWidth / 2 - sideW / 2, depth, wallHeight, sideW, kind, tint);
    addSolidBox(ctx, x, y, z + openingWidth / 2 + sideW / 2, depth, wallHeight, sideW, kind, tint);
    addSolidBox(ctx, x, y + openingHeight, z, depth, wallHeight - openingHeight, openingWidth + 0.2, kind, tint);
    addSolidBox(ctx, x, y, z - openingWidth / 2 - 0.12, depth + 0.22, openingHeight, 0.36, 'concrete', 0xbab0a2, 0.85, 0.04, 1, 2, false);
    addSolidBox(ctx, x, y, z + openingWidth / 2 + 0.12, depth + 0.22, openingHeight, 0.36, 'concrete', 0xbab0a2, 0.85, 0.04, 1, 2, false);
    addSolidBox(ctx, x, y + openingHeight - 0.1, z, depth + 0.28, 0.36, openingWidth + 0.8, 'concrete', 0xbab0a2, 0.82, 0.05, 2, 1, false);
    addSolidBox(ctx, x, y + wallHeight, z, depth + 0.26, 0.24, spanWidth + 0.26, 'concrete', 0x9c8b75, 0.86, 0.04, 3, 1, false);
  }
}

function addDoubleDoors(
  ctx: BuildContext,
  x: number,
  y: number,
  z: number,
  width: number,
  gapWidth: number,
  height: number,
  tint = 0x5c4732,
  rotateY = 0
) {
  const leafW = (width - gapWidth) / 2;
  const ironMat = getMat(ctx, 'metal', 1, 1, 0x26292e, 0.45, 0.72);
  const offset = gapWidth / 2 + leafW / 2;

  [-1, 1].forEach((side) => {
    const lx = rotateY === 0 ? x + side * offset : x;
    const lz = rotateY === 0 ? z : z + side * offset;
    const w = rotateY === 0 ? leafW : 0.42;
    const d = rotateY === 0 ? 0.42 : leafW;

    // Thick wood/plank door panel
    addSolidBox(ctx, lx, y, lz, w, height, d, 'wood_plank', tint, 0.72, 0.12, 1, 2);

    // Iron hinge straps & crossbar
    [0.85, height * 0.5, height - 0.75].forEach((sy) => {
      const strap = new THREE.Mesh(
        new THREE.BoxGeometry(rotateY === 0 ? leafW + 0.04 : 0.48, 0.14, rotateY === 0 ? 0.48 : leafW + 0.04),
        ironMat
      );
      strap.position.set(lx, y + sy, lz);
      ctx.group.add(strap);
    });
  });

  // Heavy weathered stone & timber lintel above the doors
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

function addSandbagBarricade(
  ctx: BuildContext,
  x: number,
  y: number,
  z: number,
  lengthCount = 4,
  layers = 2,
  alongX = true,
  tint = 0xbda782
) {
  const bagMat = getMat(ctx, 'sand', 1, 1, tint, 0.92, 0.02);
  const bagGeo = new THREE.CapsuleGeometry(0.18, 0.46, 4, 8);
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

function addMarketAwning(
  ctx: BuildContext,
  x: number,
  y: number,
  z: number,
  w: number,
  d: number,
  clothTint = 0xb5533c,
  pitchX = false,
  withLantern = false
) {
  const woodMat = getMat(ctx, 'wood_plank', 1, 1, 0x5e4028, 0.85, 0.04);
  const clothMat = new THREE.MeshStandardMaterial({
    color: clothTint,
    roughness: 0.9,
    metalness: 0.02,
    side: THREE.DoubleSide,
  });

  // Angled canopy roof
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(w, 0.09, d), clothMat);
  canopy.position.set(x, y, z);
  canopy.rotation.x = pitchX ? 0 : 0.22;
  canopy.rotation.z = pitchX ? 0.22 : 0;
  canopy.castShadow = ctx.shadows;
  canopy.receiveShadow = ctx.shadows;
  ctx.group.add(canopy);

  // Wooden support rafters underneath
  for (let i = -1; i <= 1; i++) {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(pitchX ? w : 0.14, 0.14, pitchX ? 0.14 : d), woodMat);
    beam.position.set(x + (pitchX ? 0 : i * (w * 0.38)), y - 0.08, z + (pitchX ? i * (d * 0.38) : 0));
    beam.rotation.x = pitchX ? 0 : 0.22;
    beam.rotation.z = pitchX ? 0.22 : 0;
    ctx.group.add(beam);
  }

  if (withLantern) {
    const lamp = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.1, 0.26, 8),
      new THREE.MeshBasicMaterial({ color: 0xffd28a })
    );
    lamp.position.set(x, y - 0.35, z);
    ctx.group.add(lamp);
    const pt = new THREE.PointLight(0xffb866, 1.4, 15, 1.6);
    pt.position.set(x, y - 0.5, z);
    ctx.group.add(pt);
  }
}

function addWindowShutter(
  ctx: BuildContext,
  x: number,
  y: number,
  z: number,
  alongZ = false,
  shutterColor = 0x526b5c
) {
  const frameMat = getMat(ctx, 'wood_plank', 1, 1, shutterColor, 0.78, 0.08);
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x161412, roughness: 0.95 });
  const g = new THREE.Group();
  g.position.set(x, y, z);
  if (alongZ) g.rotation.y = Math.PI / 2;

  const recess = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.75, 0.12), darkMat);
  g.add(recess);
  [-0.82, 0.82].forEach((sx) => {
    const shutter = new THREE.Mesh(new THREE.BoxGeometry(0.32, 1.78, 0.1), frameMat);
    shutter.position.set(sx, 0, 0.04);
    g.add(shutter);
  });
  // Sill
  const sill = new THREE.Mesh(
    new THREE.BoxGeometry(1.75, 0.14, 0.22),
    getMat(ctx, 'concrete', 1, 1, 0xbab0a2, 0.85, 0.05)
  );
  sill.position.set(0, -0.92, 0.06);
  g.add(sill);
  ctx.group.add(g);
}

function addIndustrialPipeRun(
  ctx: BuildContext,
  x: number,
  y: number,
  z: number,
  length: number,
  alongX = true,
  tint = 0x62707d,
  radius = 0.22
) {
  const mat = getMat(ctx, 'metal', 2, 1, tint, 0.42, 0.68);
  const pipe = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 10), mat);
  pipe.position.set(x, y, z);
  pipe.rotation.z = alongX ? Math.PI / 2 : 0;
  pipe.rotation.x = alongX ? 0 : Math.PI / 2;
  pipe.castShadow = ctx.shadows;
  ctx.group.add(pipe);

  // Pipe flange collars
  const collarMat = getMat(ctx, 'metal', 1, 1, 0x2c3238, 0.4, 0.78);
  for (let off = -length * 0.35; off <= length * 0.36; off += length * 0.35) {
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(radius * 1.24, radius * 1.24, 0.14, 10), collarMat);
    collar.rotation.copy(pipe.rotation);
    collar.position.set(x + (alongX ? off : 0), y, z + (alongX ? 0 : off));
    ctx.group.add(collar);
  }
}

function addTunnelLantern(ctx: BuildContext, x: number, y: number, z: number) {
  const cage = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.14, 0.32, 8),
    new THREE.MeshBasicMaterial({ color: 0xffd088 })
  );
  cage.position.set(x, y, z);
  ctx.group.add(cage);
  const pt = new THREE.PointLight(0xffb463, 1.85, 22, 1.5);
  pt.position.set(x, y - 0.25, z);
  ctx.group.add(pt);
}

function addCrate(
  ctx: BuildContext,
  x: number,
  y: number,
  z: number,
  size = 1.6,
  h?: number,
  tint = 0xffffff,
  kind: TextureKind = 'crate'
) {
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

function addOilBarrel(ctx: BuildContext, x: number, y: number, z: number, tint = 0x3b593d) {
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

function addShippingContainer(
  ctx: BuildContext,
  x: number,
  y: number,
  z: number,
  length: number,
  height: number,
  width: number,
  colorKind: 'container_blue' | 'container_red',
  alongX = true
) {
  const w = alongX ? length : width;
  const d = alongX ? width : length;
  addSolidBox(ctx, x, y, z, w, height, d, colorKind, 0xffffff, 0.52, 0.48, Math.round(length / 3), 1);
  const frameMat = getMat(ctx, 'metal', 1, 1, 0x2a3038, 0.45, 0.65);
  const topFrame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, 0.14, d + 0.08), frameMat);
  topFrame.position.set(x, y + height - 0.05, z);
  ctx.group.add(topFrame);
  // Vertical locking bars on front face
  [-0.35, 0.35].forEach((off) => {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, height * 0.88, 0.08), frameMat);
    bar.position.set(
      x + (alongX ? w / 2 + 0.03 : off * width),
      y + height * 0.5,
      z + (alongX ? off * width : d / 2 + 0.03)
    );
    ctx.group.add(bar);
  });
}

function addFreightTrainCar(ctx: BuildContext, x: number, y: number, z: number, tint: number) {
  addSolidBox(ctx, x, y, z, 10.6, 0.65, 3.0, 'metal', 0x202429, 0.6, 0.7, 2, 1);
  const kind = tint === 0x8f3932 ? 'container_red' : tint === 0x3b5370 ? 'container_blue' : 'corrugated_metal';
  addSolidBox(ctx, x, y + 0.65, z, 11.2, 2.7, 3.3, kind, kind === 'corrugated_metal' ? tint : 0xffffff, 0.5, 0.45, 3, 1);
  addSolidBox(ctx, x, y + 3.35, z, 11.4, 0.35, 3.1, 'metal', 0x383e45, 0.45, 0.6, 3, 1, false);
  // Red end ladder (classic de_train climb silhouette)
  addRedWallLadder(ctx, x + 5.66, y + 0.6, z + 0.9, 2.85, 'x+');
  addRedWallLadder(ctx, x - 5.66, y + 0.6, z - 0.9, 2.85, 'x-');
  const wheelMat = getMat(ctx, 'metal', 1, 1, 0x16181c, 0.4, 0.85);
  [-3.8, -2.8, 2.8, 3.8].forEach((wx) => {
    [-1.4, 1.4].forEach((wz) => {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.2, 12), wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(x + wx, y + 0.36, z + wz);
      ctx.group.add(wheel);
    });
  });
}

function addFountain(ctx: BuildContext, x: number, y: number, z: number) {
  addSolidBox(ctx, x, y, z, 4.6, 0.65, 4.6, 'concrete', 0xbab0a2, 0.82, 0.05, 2, 1);
  const water = new THREE.Mesh(
    new THREE.BoxGeometry(4.1, 0.1, 4.1),
    getMat(ctx, 'water', 2, 2, 0x4ca6ba, 0.15, 0.3)
  );
  water.position.set(x, y + 0.64, z);
  ctx.group.add(water);
  addSolidBox(ctx, x, y + 0.65, z, 1.1, 1.35, 1.1, 'concrete', 0xc9bfb0, 0.78, 0.05, 1, 1);
  addSolidBox(ctx, x, y + 1.85, z, 2.0, 0.25, 2.0, 'concrete', 0xc9bfb0, 0.78, 0.05, 1, 1, false);
}

function addPalmTree(ctx: BuildContext, x: number, y: number, z: number, height = 6.2) {
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

function addPineTree(ctx: BuildContext, x: number, y: number, z: number, scale = 1.0) {
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

function addStreetLamp(ctx: BuildContext, x: number, y: number, z: number, warmColor = 0xffb85c) {
  const poleMat = getMat(ctx, 'metal', 1, 2, 0x272c33, 0.5, 0.7);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 5.4, 8), poleMat);
  pole.position.set(x, y + 2.7, z);
  ctx.group.add(pole);
  const bulb = new THREE.Mesh(
    new THREE.BoxGeometry(0.55, 0.18, 0.35),
    new THREE.MeshBasicMaterial({ color: warmColor })
  );
  bulb.position.set(x, y + 5.45, z);
  ctx.group.add(bulb);
  const pt = new THREE.PointLight(warmColor, 2.2, 22, 1.5);
  pt.position.set(x, y + 5.1, z);
  ctx.group.add(pt);
}

function addVehicle(ctx: BuildContext, x: number, y: number, z: number, bodyTint: number, alongZ = true) {
  // Lower chassis (hood, doors, trunk)
  const cw = alongZ ? 2.25 : 4.7;
  const cd = alongZ ? 4.7 : 2.25;
  addSolidBox(ctx, x, y + 0.36, z, cw, 0.78, cd, 'metal', bodyTint, 0.38, 0.52, 2, 1);

  // Cabin upper greenhouse
  const cabW = alongZ ? 1.98 : 2.25;
  const cabD = alongZ ? 2.25 : 1.98;
  addSolidBox(ctx, x, y + 1.14, z, cabW, 0.68, cabD, 'metal', bodyTint, 0.38, 0.52, 1, 1);

  // Tinted windshield + rear window strips
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x1e2c3a, roughness: 0.18, metalness: 0.7 });
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(cabW - 0.12, 0.52, cabD + 0.04),
    glassMat
  );
  glass.position.set(x, y + 1.44, z);
  ctx.group.add(glass);

  // Headlights & Taillights
  const headMat = new THREE.MeshBasicMaterial({ color: 0xfff0c4 });
  const tailMat = new THREE.MeshBasicMaterial({ color: 0xc92c2c });
  [-0.75, 0.75].forEach((side) => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.08), headMat);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.14, 0.08), tailMat);
    if (alongZ) {
      hl.position.set(x + side, y + 0.72, z + cd / 2 + 0.02);
      tl.position.set(x + side, y + 0.72, z - cd / 2 - 0.02);
    } else {
      hl.rotation.y = Math.PI / 2;
      tl.rotation.y = Math.PI / 2;
      hl.position.set(x + cw / 2 + 0.02, y + 0.72, z + side);
      tl.position.set(x - cw / 2 - 0.02, y + 0.72, z + side);
    }
    ctx.group.add(hl, tl);
  });

  // Wheels + Alloy Rims
  const wheelMat = getMat(ctx, 'asphalt', 1, 1, 0x15171a, 0.85, 0.1);
  const rimMat = getMat(ctx, 'metal', 1, 1, 0x9aa2ab, 0.35, 0.8);
  [-1.02, 1.02].forEach((side) => {
    [-1.45, 1.45].forEach((axle) => {
      const wx = alongZ ? x + side * 1.08 : x + axle;
      const wz = alongZ ? z + axle : z + side * 1.08;
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.26, 14), wheelMat);
      const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.28, 10), rimMat);
      w.rotation.z = alongZ ? Math.PI / 2 : 0;
      w.rotation.x = alongZ ? 0 : Math.PI / 2;
      rim.rotation.copy(w.rotation);
      w.position.set(wx, y + 0.4, wz);
      rim.position.copy(w.position);
      ctx.group.add(w, rim);
    });
  });
}

function addSteps(
  ctx: BuildContext,
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
) {
  const stepH = totalRise / steps;
  const stepRun = totalRun / steps;
  for (let i = 0; i < steps; i++) {
    const cx = startX + dirX * (i + 0.5) * stepRun;
    const cz = startZ + dirZ * (i + 0.5) * stepRun;
    const h = (i + 1) * stepH;
    const w = Math.abs(dirZ) > 0.5 ? width : stepRun + 0.05;
    const d = Math.abs(dirX) > 0.5 ? width : stepRun + 0.05;
    addSolidBox(ctx, cx, startY, cz, w, h, d, kind, 0xffffff, 0.86, 0.04, 1, 1);
  }
}

function addSiteDecal(ctx: BuildContext, x: number, y: number, z: number, letter: 'A' | 'B') {
  const mat = new THREE.MeshStandardMaterial({
    map: textures.createSiteDecal(letter),
    transparent: true,
    roughness: 0.88,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), mat);
  plane.rotation.x = -Math.PI / 2;
  plane.position.set(x, y + 0.03, z);
  plane.receiveShadow = ctx.shadows;
  ctx.group.add(plane);
}

function addGroundAndHorizon(
  ctx: BuildContext,
  width: number,
  depth: number,
  groundKind: TextureKind,
  groundTint: number,
  perimeterKind: TextureKind,
  perimeterTint: number,
  wallHeight = 7.2,
  biome: 'desert' | 'canyon' | 'urban' | 'jungle' | 'villa' | 'snow' = 'desert'
) {
  const outerMat = getMat(ctx, groundKind, 40, 40, groundTint, 0.92, 0.03);
  const outerFloor = new THREE.Mesh(new THREE.PlaneGeometry(width * 3.6, depth * 3.6), outerMat);
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

  // Sculpted biome horizons matching CS 1.6 map backdrops
  const dummy = new THREE.Object3D();
  if (biome === 'desert' || biome === 'canyon' || biome === 'jungle' || biome === 'snow') {
    const peakColor =
      biome === 'canyon' ? 0x7d4c3b : biome === 'jungle' ? 0x455e43 : biome === 'snow' ? 0xb4c7d9 : 0x9e8260;
    const peakGeo = new THREE.ConeGeometry(1, 1, 6);
    const peakMat = getMat(ctx, biome === 'canyon' ? 'cliff_rock' : perimeterKind, 2, 2, peakColor, 0.94, 0.03);
    const inst = new THREE.InstancedMesh(peakGeo, peakMat, 36);
    for (let i = 0; i < 36; i++) {
      const angle = (i / 36) * Math.PI * 2;
      const dist = Math.max(width, depth) * 0.78 + (i % 4) * 14;
      const h = (biome === 'canyon' ? 22 : 24) + (i % 5) * 9;
      const r = 18 + (i % 4) * 8;
      dummy.position.set(Math.cos(angle) * dist, h * 0.46, Math.sin(angle) * dist);
      dummy.scale.set(r, h, r * 0.85);
      dummy.rotation.y = angle + (i % 3) * 0.4;
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.computeBoundingSphere();
    ctx.group.add(inst);
  } else {
    // Urban / Villa multi-story brick skyline with lit windows (image_5c6cc03c)
    const skyGeo = new THREE.BoxGeometry(1, 1, 1);
    const skyMat = new THREE.MeshStandardMaterial({
      map: textures.createCityWindowFacadeTexture(biome === 'villa' ? '#9e8068' : '#57463e'),
      roughness: 0.86,
      metalness: 0.08,
    });
    const inst = new THREE.InstancedMesh(skyGeo, skyMat, 28);
    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2;
      const dist = Math.max(width, depth) * 0.72 + (i % 3) * 11;
      const h = 15 + (i % 5) * 6;
      const w = 11 + (i % 4) * 4.5;
      dummy.position.set(Math.cos(angle) * dist, h / 2 - 0.5, Math.sin(angle) * dist);
      dummy.scale.set(w, h, w);
      dummy.rotation.y = angle * 0.5;
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.computeBoundingSphere();
    ctx.group.add(inst);
  }
}

function link(nodes: WaypointNode[], a: string, b: string) {
  const na = nodes.find((n) => n.id === a);
  const nb = nodes.find((n) => n.id === b);
  if (na && nb) {
    if (!na.neighbors.includes(b)) na.neighbors.push(b);
    if (!nb.neighbors.includes(a)) nb.neighbors.push(a);
  }
}

const HERO_GLB_SPOTS: Record<MapId, HeroGlbSpot[]> = {
  de_dust2: [
    { assetId: 'jersey_barrier_glb', x: 1.6, y: 0, z: -13.5, rotY: Math.PI / 2 },
    { assetId: 'jersey_barrier_glb', x: 26.5, y: 0, z: -14, rotY: 0.25 },
    { assetId: 'fuel_drum_glb', x: 14.5, y: 0, z: -26.5, rotY: 0.4 },
  ],
  de_inferno: [
    { assetId: 'jersey_barrier_glb', x: 0, y: 0, z: 16, rotY: Math.PI / 2 },
    { assetId: 'fuel_drum_glb', x: -23.5, y: 0, z: 6, rotY: 0.2 },
  ],
  de_nuke: [
    { assetId: 'jersey_barrier_glb', x: -16, y: 0, z: 22, rotY: Math.PI / 2 },
    { assetId: 'fuel_drum_glb', x: -12, y: 0, z: 2, rotY: 0.8 },
    { assetId: 'tactical_crate_glb', x: 16, y: 0, z: -4, rotY: 0.35 },
  ],
  de_train: [
    { assetId: 'jersey_barrier_glb', x: -6, y: 0, z: -4, rotY: Math.PI / 2 },
    { assetId: 'fuel_drum_glb', x: 8, y: 0, z: -6, rotY: 1.1 },
  ],
  de_aztec: [
    { assetId: 'tactical_crate_glb', x: -5, y: 0, z: 18, rotY: 0.2 },
    { assetId: 'fuel_drum_glb', x: 15, y: 0, z: -19, rotY: 0.5 },
  ],
  cs_office: [
    { assetId: 'jersey_barrier_glb', x: 4, y: 0, z: 21, rotY: Math.PI / 2 },
    { assetId: 'jersey_barrier_glb', x: -10, y: 0, z: 21, rotY: Math.PI / 2 },
  ],
  cs_assault: [
    { assetId: 'jersey_barrier_glb', x: 5, y: 0, z: 21, rotY: Math.PI / 2 },
    { assetId: 'fuel_drum_glb', x: -8, y: 0, z: 12, rotY: 0.6 },
  ],
  cs_italy: [
    { assetId: 'fuel_drum_glb', x: 7, y: 0, z: -12, rotY: 0.4 },
    { assetId: 'tactical_crate_glb', x: -8, y: 0, z: 16, rotY: 0.15 },
  ],
};

export class MapManager {
  public buildMap(mapId: MapId, shadows = true): BuiltMap {
    const ctx: BuildContext = {
      group: new THREE.Group(),
      colliders: [],
      raycastMeshes: [],
      materials: new Map(),
      propBatch: new PropBatchBuilder(),
      shadows,
    };

    let built: BuiltMap;
    switch (mapId) {
      case 'de_dust2':
        built = this.buildDust2(ctx);
        break;
      case 'de_inferno':
        built = this.buildInferno(ctx);
        break;
      case 'de_nuke':
        built = this.buildNuke(ctx);
        break;
      case 'de_train':
        built = this.buildTrain(ctx);
        break;
      case 'de_aztec':
        built = this.buildAztec(ctx);
        break;
      case 'cs_office':
        built = this.buildOffice(ctx);
        break;
      case 'cs_assault':
        built = this.buildAssault(ctx);
        break;
      case 'cs_italy':
        built = this.buildItaly(ctx);
        break;
    }

    ctx.propBatch.flush(ctx.group, ctx.raycastMeshes, shadows, (kind, rx, ry, tint, rough, metal) =>
      getMat(ctx, kind, rx, ry, tint, rough, metal)
    );
    attachHeroGlbLodProps(ctx.group, shadows, HERO_GLB_SPOTS[mapId] || []);

    return built;
  }

  private buildDust2(ctx: BuildContext): BuiltMap {
    addSkyDome(ctx, 0x487ec2, 0xeddcc0, 0xfff8ed);
    addGroundAndHorizon(ctx, 76, 84, 'sand', 0xe5cca0, 'sandstone', 0xdac197, 7.2, 'desert');

    // T Spawn Courtyard: Vaulted Citadel Arches, Market Pergola, Sandbags & Palms
    addArchway(ctx, 0, 0, 25, 36, 12, 5.6, 4.0, 2.2, 'sandstone', 0xd9c29c);
    addArchedBlindWindow(ctx, -11, 3.9, 23.85, false);
    addArchedBlindWindow(ctx, 11, 3.9, 23.85, false);
    addMarketAwning(ctx, -12, 3.8, 34, 6.2, 3.4, 0xb8523b, false, true);
    addMarketAwning(ctx, 12, 3.8, 34, 6.2, 3.4, 0x4f7354, false, true);
    addSandbagBarricade(ctx, -8.5, 0, 29, 4, 2, true);
    addPalmTree(ctx, -15, 0, 32, 6.8);
    addPalmTree(ctx, 16, 0, 33, 6.2);
    addCrate(ctx, -5, 0, 32, 1.8, 1.6, 0xffffff, 'crate_military');
    addCrate(ctx, 6, 0, 31, 1.6);

    // Mid Corridor & Iconic Double Doors + Arched Blind Windows
    addTrimWall(ctx, -9, 0, 6, 2.2, 5.8, 26, 'sandstone', 0xd1b88e);
    addTrimWall(ctx, 9, 0, 6, 2.2, 5.8, 24, 'sandstone', 0xd1b88e);
    addArchedBlindWindow(ctx, -7.85, 3.8, 4, true);
    addArchedBlindWindow(ctx, -7.85, 3.8, 12, true);
    addArchedBlindWindow(ctx, 7.85, 3.8, 6, true);
    addDoubleDoors(ctx, 0, 0, -2, 16, 3.2, 4.4, 0x5c4732); // Mid Double Doors
    addCrate(ctx, -2.5, 0, 5.5, 1.9, 1.9, 0xd4b688); // Iconic Xbox
    addSandbagBarricade(ctx, -4.4, 0, 5.6, 2, 2, false);
    addOilBarrel(ctx, 6.2, 0, 9, 0x7d3a2e);

    // Catwalk / Short A with Flagstone Paving, Steps & Carved Frieze Parapet (image_9a191133)
    addSolidBox(ctx, 11, 0, -6, 6, 1.5, 14, 'dust_stone_floor', 0xd6c29d, 0.86, 0.04, 2, 4);
    addSteps(ctx, 11, 0, 1, 0, 1, 4.5, 1.5, 4.5, 5, 'dust_stone_floor');
    addTrimWall(ctx, 14.5, 1.5, -13, 1.2, 1.4, 8, 'sandstone', 0xc9ac82);
    addMarketAwning(ctx, 11, 4.2, -7, 5.4, 4.2, 0xc77d42, false, false);

    // Long A House, Vaulted Doorway, Blue Container & Iconic Long A Car
    addTrimWall(ctx, 20, 0, 14, 2.2, 5.8, 24, 'sandstone', 0xd3ba92);
    addArchedBlindWindow(ctx, 21.15, 3.8, 6, true);
    addDoubleDoors(ctx, 29, 0, 18, 16, 4.0, 4.6, 0x5c4732); // Long Doors
    addSolidBox(ctx, 29, 5.0, 18, 17, 0.7, 7, 'sandstone', 0xc9af87, 0.85, 0.05, 4, 2, false);
    addFluorescentTube(ctx, 29, 4.55, 18, false);
    addShippingContainer(ctx, 27, 0, 5, 5.2, 2.4, 2.4, 'container_blue', false);
    addVehicle(ctx, 32.5, 0, -10, 0x7a6c5a, true); // Long A Car cover!
    addCrate(ctx, 32, 0, -3.5, 1.8, 1.7);
    addOilBarrel(ctx, 24, 0, -10, 0x3b593d);
    addPalmTree(ctx, 34, 0, -16, 7.2);

    // Bombsite A Elevated Flagstone Platform, Military Crates & Goose Corner Graffiti (image_e13b2855)
    addSolidBox(ctx, 24, 0, -28, 16, 1.2, 12, 'dust_stone_floor', 0xd9c39e, 0.86, 0.04, 4, 3);
    addSteps(ctx, 16, 0, -28, -1, 0, 5, 1.2, 3.8, 4, 'dust_stone_floor');
    addSteps(ctx, 24, 0, -22, 0, 1, 5, 1.2, 3.8, 4, 'dust_stone_floor');
    addCrate(ctx, 22, 1.2, -29, 1.7, 1.7, 0xffffff, 'crate_military');
    addCrate(ctx, 27, 1.2, -26, 1.6, 2.2);
    addCrate(ctx, 25, 1.2, -31, 1.5, 1.5, 0xffffff, 'crate_military');
    addSandbagBarricade(ctx, 19, 1.2, -33, 3, 2, true);
    addPlaneDecal(ctx, 24, 3.1, -40.85, 6.4, 3.2, textures.createGooseGraffitiTexture(), 0);
    addSiteDecal(ctx, 24, 1.2, -28, 'A');

    // CT Mid Archway & Spawn Defense (image_58ba8fc2 fluorescent underpass)
    addArchway(ctx, 2, 0, -18, 14, 5.5, 5.6, 4.0, 2.0, 'sandstone', 0xd1b88e);
    addFluorescentTube(ctx, 2, 3.9, -18, false);
    addCrate(ctx, 8, 0, -26, 1.8, 1.6);
    addCrate(ctx, -4, 0, -29, 1.9, 1.8, 0xffffff, 'crate_military');
    addSandbagBarricade(ctx, 13, 0, -34, 3, 2, true);

    // B Tunnels (Vaulted Arch Ceiling + Rib Beams + Fluorescent Underpass Tube)
    addTrimWall(ctx, -18, 0, 4, 2.2, 5.0, 26, 'sandstone', 0xc4aa82);
    addArchway(ctx, -26, 0, 14, 14, 5.2, 5.2, 3.8, 2.0, 'sandstone', 0xc4aa82);
    addSolidBox(ctx, -28, 4.4, 2, 18, 0.8, 22, 'concrete', 0x6b675f);
    [-4, 2, 8].forEach((tz) => {
      addSolidBox(ctx, -27, 4.0, tz, 14, 0.35, 0.55, 'sandstone', 0xb39770, 0.88, 0.04, 2, 1, false);
    });
    addCrate(ctx, -26, 0, 3, 1.6, 1.6);
    addOilBarrel(ctx, -22, 0, -2, 0x5e4a38);
    addFluorescentTube(ctx, -26, 3.9, 5, true);
    addTunnelLantern(ctx, -26, 3.8, -4);

    // Bombsite B Platform, Window Sill, Double Doors & Double Stack
    addSolidBox(ctx, -26, 0, -28, 14, 1.0, 12, 'dust_stone_floor', 0xd1ba93, 0.86, 0.04, 3, 3);
    addSteps(ctx, -26, 0, -22, 0, 1, 5, 1.0, 3.5, 4, 'dust_stone_floor');
    addArchway(ctx, -16, 0, -22, 12, 4.0, 5.0, 3.4, 1.8, 'sandstone', 0xd1b88e, Math.PI / 2);
    addCrate(ctx, -24, 1.0, -27, 1.7, 1.8, 0xffffff, 'crate_military');
    addCrate(ctx, -29, 1.0, -29, 1.8, 2.2);
    addCrate(ctx, -21, 0, -16, 1.7, 1.6);
    addSandbagBarricade(ctx, -31, 1.0, -23, 3, 2, false);
    addPalmTree(ctx, -33, 0, -18, 6.4);
    addSiteDecal(ctx, -25, 1.0, -27, 'B');

    const waypoints: WaypointNode[] = [
      { id: 't_spawn', x: 0, y: 0, z: 34, neighbors: [], tag: 'T' },
      { id: 't_mid', x: 0, y: 0, z: 16, neighbors: [] },
      { id: 'mid_doors', x: 0, y: 0, z: 0, neighbors: [], tag: 'MID' },
      { id: 'ct_mid', x: 0, y: 0, z: -24, neighbors: [] },
      { id: 'ct_spawn', x: 8, y: 0, z: -34, neighbors: [], tag: 'CT' },
      { id: 'long_entry', x: 28, y: 0, z: 24, neighbors: [] },
      { id: 'long_doors', x: 29, y: 0, z: 12, neighbors: [] },
      { id: 'long_a', x: 29, y: 0, z: -8, neighbors: [] },
      { id: 'catwalk', x: 11, y: 1.5, z: -8, neighbors: [] },
      { id: 'site_a', x: 24, y: 1.2, z: -28, neighbors: [], tag: 'A' },
      { id: 'tuns_entry', x: -24, y: 0, z: 22, neighbors: [] },
      { id: 'tuns_mid', x: -25, y: 0, z: 2, neighbors: [] },
      { id: 'tuns_exit', x: -25, y: 0, z: -12, neighbors: [] },
      { id: 'site_b', x: -25, y: 1.0, z: -27, neighbors: [], tag: 'B' },
      { id: 'b_doors', x: -12, y: 0, z: -25, neighbors: [] },
    ];
    [
      ['t_spawn', 't_mid'],
      ['t_mid', 'mid_doors'],
      ['mid_doors', 'ct_mid'],
      ['ct_mid', 'ct_spawn'],
      ['t_spawn', 'long_entry'],
      ['long_entry', 'long_doors'],
      ['long_doors', 'long_a'],
      ['long_a', 'site_a'],
      ['t_mid', 'catwalk'],
      ['catwalk', 'site_a'],
      ['ct_spawn', 'site_a'],
      ['t_spawn', 'tuns_entry'],
      ['tuns_entry', 'tuns_mid'],
      ['tuns_mid', 'tuns_exit'],
      ['tuns_exit', 'site_b'],
      ['site_b', 'b_doors'],
      ['b_doors', 'ct_mid'],
    ].forEach(([a, b]) => link(waypoints, a, b));

    return {
      id: 'de_dust2',
      group: ctx.group,
      colliders: ctx.colliders,
      raycastMeshes: ctx.raycastMeshes,
      tSpawns: [
        new THREE.Vector3(-4, 0, 35),
        new THREE.Vector3(0, 0, 35),
        new THREE.Vector3(4, 0, 35),
        new THREE.Vector3(-2, 0, 32),
        new THREE.Vector3(3, 0, 32),
      ],
      ctSpawns: [
        new THREE.Vector3(6, 0, -35),
        new THREE.Vector3(10, 0, -35),
        new THREE.Vector3(14, 0, -34),
        new THREE.Vector3(4, 0, -33),
        new THREE.Vector3(11, 0, -32),
      ],
      dmSpawns: [
        new THREE.Vector3(0, 0, 34),
        new THREE.Vector3(29, 0, 4),
        new THREE.Vector3(24, 1.2, -28),
        new THREE.Vector3(-25, 1.0, -27),
        new THREE.Vector3(0, 0, -10),
        new THREE.Vector3(-25, 0, 4),
      ],
      bombsites: [
        { label: 'A', x: 24, y: 1.2, z: -28, radius: 6.0 },
        { label: 'B', x: -25, y: 1.0, z: -27, radius: 5.8 },
      ],
      buyZones: [
        { team: 'T', x: 0, z: 34, radius: 10 },
        { team: 'CT', x: 9, z: -34, radius: 10 },
      ],
      waypoints,
      skyColor: 0x9ec0d9,
      fogColor: 0xdecbb0,
      fogDensity: 0.0075,
      sunColor: 0xffe4b8,
      sunIntensity: 1.9,
      sunPos: new THREE.Vector3(40, 62, 28),
      hemiSky: 0x9ec5e6,
      hemiGround: 0xa68961,
      hemiIntensity: 0.74,
      surfaceType: 'sand',
      bounds: { minX: -38, maxX: 38, minZ: -42, maxZ: 42 },
      ambientParticleMode: 'dust',
      menuShowcase: {
        camCenter: new THREE.Vector3(0, 3.8, 2),
        camOrbitRadius: 14,
        camHeight: 4.0,
        lookAt: new THREE.Vector3(-0.5, 1.4, -2),
        smokePos: new THREE.Vector3(-1.2, 0.2, -1.8),
        tSpots: [
          { pos: [-5.2, 0, 8], yaw: 0.2, cls: 'classic_t', w: 'ak47', crouch: false },
          { pos: [-1.8, 0, 6], yaw: -0.1, cls: 'desert_t', w: 'deagle', crouch: true },
          { pos: [4.2, 0, 10], yaw: -0.25, cls: 'military_t', w: 'galil', crouch: false },
          { pos: [6.4, 0, 5], yaw: -0.3, cls: 'urban_t', w: 'sg552', crouch: true },
        ],
        ctSpots: [
          { pos: [-5.0, 0, -10], yaw: 2.9, cls: 'classic_ct', w: 'm4a1', crouch: true },
          { pos: [-1.4, 0, -12], yaw: 3.08, cls: 'specops_ct', w: 'aug', crouch: false },
          { pos: [3.8, 0, -9], yaw: 3.3, cls: 'urban_ct', w: 'mp5', crouch: true },
          { pos: [6.2, 0, -13], yaw: 3.4, cls: 'assault_ct', w: 'awp', crouch: false },
        ],
      },
    };
  }

  private buildInferno(ctx: BuildContext): BuiltMap {
    addSkyDome(ctx, 0x4b7cb5, 0xebcfb2, 0xfff2e0);
    addGroundAndHorizon(ctx, 72, 78, 'cobblestone', 0xc9beb0, 'terracotta', 0xd4a47f, 7.2, 'villa');

    // Mid Villa Corridors with Terracotta & Brick Houses + Shutters + Awnings
    addTrimWall(ctx, -10, 0, 10, 2.2, 5.8, 28, 'terracotta', 0xdcb995);
    addTrimWall(ctx, 10, 0, 8, 2.2, 5.8, 26, 'terracotta', 0xdcb995);
    addWindowShutter(ctx, -8.85, 3.8, 10, true, 0x45634b);
    addWindowShutter(ctx, 8.85, 3.8, 6, true, 0x6b472b);
    addMarketAwning(ctx, 0, 4.2, 22, 7.5, 3.2, 0xa84735, false, true);
    addCrate(ctx, 0, 0, 8, 1.7, 1.5);
    addOilBarrel(ctx, 3, 0, 2, 0x6b472b);
    addOilBarrel(ctx, -3, 0, -3, 0x6b472b);

    // Banana Lane (Brick & Stone Wall + Wood Pile Cover + Sandbags)
    addTrimWall(ctx, -20, 0, -4, 2.2, 5.4, 32, 'brick', 0xa86449);
    addTrimWall(ctx, -30, 0, -4, 2.2, 5.4, 32, 'brick', 0xa86449);
    addSandbagBarricade(ctx, -25, 0, -1, 3, 2, true);
    addCrate(ctx, -25, 0, 4, 1.8, 1.7, 0x87633e);
    addOilBarrel(ctx, -22.5, 0, -5, 0x8a4829);
    addCrate(ctx, -23, 0, -8, 1.6, 1.7);

    // Bombsite B Fountain Piazza
    addFountain(ctx, -25, 0, -27);
    addCrate(ctx, -18, 0, -29, 1.8, 1.9, 0x7a855c);
    addCrate(ctx, -31, 0, -24, 1.8, 1.7);
    addStreetLamp(ctx, -19, 0, -19, 0xffd18c);
    addSiteDecal(ctx, -25, 0, -21, 'B');

    // Archway & Library
    addArchway(ctx, -4, 0, -14, 14, 5.2, 5.4, 3.8, 2.2, 'terracotta', 0xd1ab84);
    addTrimWall(ctx, 8, 0, -16, 2.2, 5.2, 12, 'terracotta', 0xcfa77e);

    // Apartments & Balcony overlooking Pit / A
    addTrimWall(ctx, 22, 0, 12, 2.2, 5.8, 20, 'brick', 0x9e5e44);
    addWindowShutter(ctx, 20.85, 3.8, 12, true, 0x45634b);
    addSolidBox(ctx, 27, 0, -4, 10, 1.8, 14, 'wood_plank', 0xb89674);
    addSteps(ctx, 27, 0, 3, 0, 1, 5, 1.8, 4.5, 5, 'wood_plank');
    addSolidBox(ctx, 22.2, 1.8, -4, 0.3, 1.1, 14, 'wood_plank', 0x6b4528);
    addCrate(ctx, 29, 0, -16, 1.8, 1.8);

    // Bombsite A
    addVehicle(ctx, 28, 0, -28, 0x45586b, false);
    addCrate(ctx, 20, 0, -26, 1.8, 1.9, 0x737f57);
    addCrate(ctx, 18, 0, -21, 1.6, 1.5);
    addStreetLamp(ctx, 16, 0, -29, 0xffd18c);
    addSiteDecal(ctx, 23, 0, -24, 'A');

    const waypoints: WaypointNode[] = [
      { id: 't', x: 0, y: 0, z: 32, neighbors: [], tag: 'T' },
      { id: 'mid', x: 0, y: 0, z: 4, neighbors: [], tag: 'MID' },
      { id: 'banana', x: -25, y: 0, z: 12, neighbors: [] },
      { id: 'banana_top', x: -25, y: 0, z: -10, neighbors: [] },
      { id: 'b', x: -25, y: 0, z: -21, neighbors: [], tag: 'B' },
      { id: 'ct', x: 2, y: 0, z: -32, neighbors: [], tag: 'CT' },
      { id: 'arch', x: 2, y: 0, z: -14, neighbors: [] },
      { id: 'apts', x: 27, y: 1.8, z: -4, neighbors: [] },
      { id: 'a', x: 23, y: 0, z: -24, neighbors: [], tag: 'A' },
    ];
    [
      ['t', 'mid'],
      ['t', 'banana'],
      ['banana', 'banana_top'],
      ['banana_top', 'b'],
      ['b', 'ct'],
      ['mid', 'arch'],
      ['arch', 'ct'],
      ['arch', 'a'],
      ['t', 'apts'],
      ['apts', 'a'],
      ['ct', 'a'],
    ].forEach(([a, b]) => link(waypoints, a, b));

    return {
      id: 'de_inferno',
      group: ctx.group,
      colliders: ctx.colliders,
      raycastMeshes: ctx.raycastMeshes,
      tSpawns: [
        new THREE.Vector3(-3, 0, 32),
        new THREE.Vector3(0, 0, 32),
        new THREE.Vector3(3, 0, 32),
        new THREE.Vector3(-2, 0, 29),
        new THREE.Vector3(2, 0, 29),
      ],
      ctSpawns: [
        new THREE.Vector3(-2, 0, -32),
        new THREE.Vector3(2, 0, -32),
        new THREE.Vector3(6, 0, -32),
        new THREE.Vector3(0, 0, -29),
        new THREE.Vector3(4, 0, -29),
      ],
      dmSpawns: [
        new THREE.Vector3(0, 0, 32),
        new THREE.Vector3(-25, 0, 0),
        new THREE.Vector3(-25, 0, -21),
        new THREE.Vector3(23, 0, -24),
        new THREE.Vector3(0, 0, 4),
      ],
      bombsites: [
        { label: 'A', x: 23, y: 0, z: -24, radius: 6.0 },
        { label: 'B', x: -25, y: 0, z: -21, radius: 6.0 },
      ],
      buyZones: [
        { team: 'T', x: 0, z: 31, radius: 10 },
        { team: 'CT', x: 2, z: -31, radius: 10 },
      ],
      waypoints,
      skyColor: 0x8bb8db,
      fogColor: 0xd1bfaa,
      fogDensity: 0.007,
      sunColor: 0xffdfb0,
      sunIntensity: 1.85,
      sunPos: new THREE.Vector3(-35, 58, 30),
      hemiSky: 0x99c4e8,
      hemiGround: 0x8a6d56,
      hemiIntensity: 0.72,
      surfaceType: 'concrete',
      bounds: { minX: -36, maxX: 36, minZ: -39, maxZ: 39 },
      ambientParticleMode: 'dust',
      menuShowcase: {
        camCenter: new THREE.Vector3(-25, 4.2, -16),
        camOrbitRadius: 11,
        camHeight: 4.5,
        lookAt: new THREE.Vector3(-25, 1.2, -25),
        smokePos: new THREE.Vector3(-25, 0.2, -16),
        tSpots: [
          { pos: [-26.5, 0, -8], yaw: 0.05, cls: 'classic_t', w: 'ak47', crouch: false },
          { pos: [-22.8, 0, -10], yaw: -0.1, cls: 'military_t', w: 'galil', crouch: true },
          { pos: [-27.5, 0, -12], yaw: 0.15, cls: 'desert_t', w: 'mp5', crouch: false },
        ],
        ctSpots: [
          { pos: [-21, 0, -28], yaw: 2.9, cls: 'classic_ct', w: 'm4a1', crouch: true },
          { pos: [-28, 0, -29], yaw: 3.3, cls: 'assault_ct', w: 'famas', crouch: false },
          { pos: [-24, 0, -31], yaw: 3.1, cls: 'urban_ct', w: 'aug', crouch: true },
        ],
      },
    };
  }

  private buildNuke(ctx: BuildContext): BuiltMap {
    addSkyDome(ctx, 0x4876a8, 0xb8cade, 0xe8eff5);
    addGroundAndHorizon(ctx, 74, 74, 'cracked_earth', 0xba9e8c, 'cliff_rock', 0xb88974, 8.2, 'canyon');

    // Iconic Canyon Bunker Blast Door behind T Spawn (image_d0354829)
    addBunkerBlastDoor(ctx, -16, 0, 35.8, 8.0, 5.8, Math.PI);
    addSolidBox(ctx, 18, 0, 33, 18, 2.4, 2.4, 'cinderblock', 0x9ea2a6);

    // Industrial Yard Silo, Overhead Pipes, Nuclear Containers (image_1d0979b9)
    const siloMat = getMat(ctx, 'metal', 2, 2, 0xa0abb5, 0.4, 0.65);
    const silo = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 8.0, 18), siloMat);
    silo.position.set(-22, 4.0, 6);
    silo.castShadow = ctx.shadows;
    ctx.group.add(silo);
    ctx.raycastMeshes.push(silo);
    ctx.colliders.push({ minX: -24.6, maxX: -19.4, minY: 0, maxY: 8.0, minZ: 3.4, maxZ: 8.6 });

    addIndustrialPipeRun(ctx, -10, 4.8, -10, 26, true, 0x5c7388, 0.28);
    addIndustrialPipeRun(ctx, -10, 5.4, -10, 26, true, 0xb89535, 0.18);
    addSolidBox(ctx, -22, 0, 6, 5.4, 0.8, 5.4, 'hazard', 0xffffff, 0.6, 0.2, 2, 1, false);
    addShippingContainer(ctx, -20, 0, -10, 7.6, 3.2, 3.4, 'container_red', true);
    addShippingContainer(ctx, -10, 0, 12, 7.0, 3.0, 3.4, 'container_blue', false);
    addCrate(ctx, -14, 0, 19, 1.8, 1.8, 0xffffff, 'crate_military');

    // Main Reactor Warehouse (Cinderblock base + Corrugated Steel Upper)
    addArchway(ctx, 14, 0, 14, 24, 6.0, 6.2, 4.0, 2.0, 'cinderblock', 0xaab0b8);
    addArchway(ctx, 2, 0, -2, 24, 6.5, 6.2, 4.0, 2.0, 'corrugated_metal', 0x768494, Math.PI / 2);
    addTrimWall(ctx, 18, 0, -24, 24, 6.2, 2.0, 'corrugated_metal', 0x768494);
    addSolidBox(ctx, 10, 0, 4, 6, 3.2, 6, 'metal', 0x8a5b3e);
    addSolidBox(ctx, 10, 3.2, 4, 6.4, 0.35, 6.4, 'hazard', 0xffffff, 0.6, 0.2, 2, 1, false);

    // Twin Nuclear Reactor Cores (Site A)
    const coreMat = getMat(ctx, 'metal', 2, 2, 0xc9a53b, 0.35, 0.72);
    const core = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 5.5, 18), coreMat);
    core.position.set(19, 2.75, -9);
    core.castShadow = ctx.shadows;
    ctx.group.add(core);
    ctx.raycastMeshes.push(core);
    ctx.colliders.push({ minX: 16.9, maxX: 21.1, minY: 0, maxY: 5.5, minZ: -11.1, maxZ: -6.9 });
    addFluorescentTube(ctx, 14, 4.8, -9, false);
    addSiteDecal(ctx, 14, 0, -10, 'A');

    // Ramp & Bombsite B Annex
    addSolidBox(ctx, -22, 0, -24, 14, 1.4, 12, 'concrete', 0x767f8a);
    addSteps(ctx, -15, 0, -24, 1, 0, 5, 1.4, 4, 4, 'metal');
    addCrate(ctx, -24, 1.4, -26, 1.8, 1.8, 0xffffff, 'crate_military');
    addSolidBox(ctx, -21, 1.4, -21, 3.5, 3.5, 3.5, 'metal', 0x4b708f);
    addOilBarrel(ctx, -18, 1.4, -27, 0xd49e2a);
    addSiteDecal(ctx, -22, 1.4, -24, 'B');

    const waypoints: WaypointNode[] = [
      { id: 't', x: -16, y: 0, z: 30, neighbors: [], tag: 'T' },
      { id: 'yard', x: -20, y: 0, z: 0, neighbors: [], tag: 'MID' },
      { id: 'lobby', x: 10, y: 0, z: 22, neighbors: [] },
      { id: 'a', x: 14, y: 0, z: -10, neighbors: [], tag: 'A' },
      { id: 'b', x: -22, y: 1.4, z: -24, neighbors: [], tag: 'B' },
      { id: 'ct', x: 24, y: 0, z: -30, neighbors: [], tag: 'CT' },
    ];
    [
      ['t', 'yard'],
      ['t', 'lobby'],
      ['yard', 'b'],
      ['lobby', 'a'],
      ['a', 'ct'],
      ['b', 'ct'],
      ['yard', 'a'],
    ].forEach(([a, b]) => link(waypoints, a, b));

    return {
      id: 'de_nuke',
      group: ctx.group,
      colliders: ctx.colliders,
      raycastMeshes: ctx.raycastMeshes,
      tSpawns: [
        new THREE.Vector3(-20, 0, 30),
        new THREE.Vector3(-16, 0, 30),
        new THREE.Vector3(-12, 0, 30),
        new THREE.Vector3(-18, 0, 27),
        new THREE.Vector3(-14, 0, 27),
      ],
      ctSpawns: [
        new THREE.Vector3(20, 0, -30),
        new THREE.Vector3(24, 0, -30),
        new THREE.Vector3(28, 0, -30),
        new THREE.Vector3(22, 0, -27),
        new THREE.Vector3(26, 0, -27),
      ],
      dmSpawns: [
        new THREE.Vector3(-16, 0, 30),
        new THREE.Vector3(-20, 0, 0),
        new THREE.Vector3(14, 0, -10),
        new THREE.Vector3(-22, 1.4, -24),
        new THREE.Vector3(24, 0, -30),
      ],
      bombsites: [
        { label: 'A', x: 14, y: 0, z: -10, radius: 6.2 },
        { label: 'B', x: -22, y: 1.4, z: -24, radius: 6.0 },
      ],
      buyZones: [
        { team: 'T', x: -16, z: 29, radius: 10 },
        { team: 'CT', x: 24, z: -29, radius: 10 },
      ],
      waypoints,
      skyColor: 0x7b98b2,
      fogColor: 0x93a5b5,
      fogDensity: 0.008,
      sunColor: 0xfff0db,
      sunIntensity: 1.7,
      sunPos: new THREE.Vector3(35, 55, -20),
      hemiSky: 0xa2bed6,
      hemiGround: 0x4b555e,
      hemiIntensity: 0.74,
      surfaceType: 'metal',
      bounds: { minX: -37, maxX: 37, minZ: -37, maxZ: 37 },
      ambientParticleMode: 'sparks',
      menuShowcase: {
        camCenter: new THREE.Vector3(-16, 4.4, 2),
        camOrbitRadius: 15,
        camHeight: 4.8,
        lookAt: new THREE.Vector3(-16, 1.6, -2),
        smokePos: new THREE.Vector3(-15, 0.2, -3),
        tSpots: [
          { pos: [-17, 0, 14], yaw: 0.1, cls: 'urban_t', w: 'ak47', crouch: false },
          { pos: [-13, 0, 11], yaw: -0.2, cls: 'classic_t', w: 'galil', crouch: true },
          { pos: [-23, 0, 12], yaw: 0.2, cls: 'military_t', w: 'p90', crouch: false },
        ],
        ctSpots: [
          { pos: [-14, 0, -12], yaw: 3.1, cls: 'specops_ct', w: 'm4a1', crouch: true },
          { pos: [-21, 0, -15], yaw: 3.2, cls: 'classic_ct', w: 'aug', crouch: false },
          { pos: [-8, 0, -10], yaw: 2.8, cls: 'assault_ct', w: 'awp', crouch: true },
        ],
      },
    };
  }

  private buildTrain(ctx: BuildContext): BuiltMap {
    addSkyDome(ctx, 0x4c6278, 0x9aa9b5, 0xd2dce3);
    addGroundAndHorizon(ctx, 78, 74, 'gravel_track', 0x9b9892, 'brick_yellow', 0xd6cdb8, 7.6, 'urban');

    // Railroad Track Steel Rails + Timber Cross-Ties (image_72510c6d)
    const railMat = getMat(ctx, 'metal', 8, 1, 0x3b4047, 0.4, 0.8);
    const sleeperMat = getMat(ctx, 'wood_plank', 1, 1, 0x4a382b, 0.9, 0.04);
    [-12.8, -11.2, -24.8, -23.2, 13.2, 14.8, 15.2, 16.8].forEach((rz) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(72, 0.09, 0.14), railMat);
      rail.position.set(0, 0.05, rz);
      ctx.group.add(rail);
    });
    [-12, -24, 14, 16].forEach((trackZ) => {
      for (let tx = -34; tx <= 34; tx += 1.6) {
        const tie = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 2.2), sleeperMat);
        tie.position.set(tx, 0.025, trackZ);
        ctx.group.add(tie);
      }
    });
    addIndustrialPipeRun(ctx, 0, 5.6, -12, 64, true, 0x3b4047, 0.12);
    addIndustrialPipeRun(ctx, 0, 5.6, 14, 64, true, 0x3b4047, 0.12);

    // Trainyard B Triple-Arch Tunnel Bays "4 · 5 · 6" + Nuclear Flatbed + "Trainyard B" Sign (image_72510c6d)
    addTrimWall(ctx, -37.5, 0, 14, 2.4, 6.2, 24, 'brick', 0xa66e58);
    [
      { z: 7, num: '4' },
      { z: 14, num: '5' },
      { z: 21, num: '6' },
    ].forEach((bay) => {
      addSolidBox(ctx, -35.8, 0, bay.z, 1.4, 4.2, 4.6, 'concrete', 0x16181c, 0.92, 0.05, 1, 1, false);
      addPlaneDecal(ctx, -34.95, 4.75, bay.z, 1.5, 1.15, textures.createTrainSignTexture(bay.num, '#1f4978', '#f4f7fa'), Math.PI / 2);
      addTunnelLantern(ctx, -34.5, 4.35, bay.z);
    });
    addPlaneDecal(ctx, -36.1, 4.9, 14, 4.8, 1.45, textures.createTrainSignTexture('Trainyard B', '#1f4978', '#f4f7fa'), Math.PI / 2);

    // Right-hand pale yellow-brick arched factory facade (image_72510c6d)
    addTrimWall(ctx, 37.5, 0, 0, 2.4, 6.4, 42, 'brick_yellow', 0xe6ddc8);
    [-12, -2, 8, 18].forEach((wz) => {
      addArchedBlindWindow(ctx, 36.2, 4.1, wz, true, 2.2, 2.1);
    });

    // Green Industrial Electrical Switchgear Cabinet with Hazard Sign
    addSolidBox(ctx, -18, 0, 7.5, 1.8, 2.2, 1.1, 'metal', 0x3c694b, 0.55, 0.35);
    addPlaneDecal(ctx, -18, 1.4, 8.08, 0.7, 0.7, textures.createTrainSignTexture('440V', '#d9a426', '#16181c'), 0);

    // Freight Boxcars on Yard tracks
    addFreightTrainCar(ctx, -10, 0, -12, 0x8f3932);
    addFreightTrainCar(ctx, 10, 0, -12, 0x3f5e4b);
    addFreightTrainCar(ctx, 0, 0, -24, 0x3b5370);
    addCrate(ctx, -2, 0, -16, 1.6, 1.5, 0xffffff, 'crate_military');
    addOilBarrel(ctx, 4, 0, -16, 0x3b593d);
    addSiteDecal(ctx, 2, 0, -18, 'A');

    // Central Popdog / Ivy Brick Halls
    addArchway(ctx, -20, 0, 0, 14, 4.5, 5.4, 3.6, 2.2, 'brick', 0x776258);
    addArchway(ctx, 20, 0, 0, 14, 4.5, 5.4, 3.6, 2.2, 'brick', 0x776258);
    addWindowShutter(ctx, -20, 3.8, 1.15, false, 0x3c434a);
    addStreetLamp(ctx, 0, 0, -6, 0xffd28a);

    // Site B Boxcars
    addFreightTrainCar(ctx, -12, 0, 14, 0x8f6b32);
    addFreightTrainCar(ctx, 8, 0, 16, 0x3f5e4b);
    addCrate(ctx, -2, 0, 18, 1.8, 1.7);
    addSandbagBarricade(ctx, 5, 0, 12, 3, 2, false);
    addSiteDecal(ctx, -2, 0, 14, 'B');

    const waypoints: WaypointNode[] = [
      { id: 't', x: -30, y: 0, z: 24, neighbors: [], tag: 'T' },
      { id: 'ivy', x: 26, y: 0, z: -12, neighbors: [] },
      { id: 'a', x: 2, y: 0, z: -18, neighbors: [], tag: 'A' },
      { id: 'b', x: -2, y: 0, z: 14, neighbors: [], tag: 'B' },
      { id: 'mid', x: 0, y: 0, z: 0, neighbors: [], tag: 'MID' },
      { id: 'ct', x: 30, y: 0, z: -26, neighbors: [], tag: 'CT' },
    ];
    [
      ['t', 'b'],
      ['b', 'mid'],
      ['mid', 'a'],
      ['a', 'ct'],
      ['a', 'ivy'],
      ['ivy', 'ct'],
      ['t', 'mid'],
    ].forEach(([a, b]) => link(waypoints, a, b));

    return {
      id: 'de_train',
      group: ctx.group,
      colliders: ctx.colliders,
      raycastMeshes: ctx.raycastMeshes,
      tSpawns: [
        new THREE.Vector3(-30, 0, 26),
        new THREE.Vector3(-27, 0, 24),
        new THREE.Vector3(-32, 0, 22),
        new THREE.Vector3(-28, 0, 28),
        new THREE.Vector3(-25, 0, 26),
      ],
      ctSpawns: [
        new THREE.Vector3(30, 0, -26),
        new THREE.Vector3(27, 0, -24),
        new THREE.Vector3(32, 0, -22),
        new THREE.Vector3(28, 0, -28),
        new THREE.Vector3(25, 0, -26),
      ],
      dmSpawns: [
        new THREE.Vector3(-30, 0, 24),
        new THREE.Vector3(2, 0, -18),
        new THREE.Vector3(-2, 0, 14),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(30, 0, -26),
      ],
      bombsites: [
        { label: 'A', x: 2, y: 0, z: -18, radius: 6.2 },
        { label: 'B', x: -2, y: 0, z: 14, radius: 6.2 },
      ],
      buyZones: [
        { team: 'T', x: -29, z: 25, radius: 10 },
        { team: 'CT', x: 29, z: -25, radius: 10 },
      ],
      waypoints,
      skyColor: 0x6f7d87,
      fogColor: 0x7e8a94,
      fogDensity: 0.0085,
      sunColor: 0xe3e9f0,
      sunIntensity: 1.65,
      sunPos: new THREE.Vector3(-30, 50, -30),
      hemiSky: 0x8ea0ad,
      hemiGround: 0x4a4d50,
      hemiIntensity: 0.75,
      surfaceType: 'concrete',
      bounds: { minX: -39, maxX: 39, minZ: -37, maxZ: 37 },
      ambientParticleMode: 'dust',
      menuShowcase: {
        camCenter: new THREE.Vector3(0, 4.5, -18),
        camOrbitRadius: 15,
        camHeight: 5.0,
        lookAt: new THREE.Vector3(0, 1.5, -16),
        smokePos: new THREE.Vector3(0, 0.2, -16),
        tSpots: [
          { pos: [-10, 0, -4], yaw: -0.1, cls: 'classic_t', w: 'ak47', crouch: false },
          { pos: [-4, 0, -6], yaw: -0.1, cls: 'urban_t', w: 'galil', crouch: true },
          { pos: [2, 0, -5], yaw: 0.1, cls: 'military_t', w: 'm249', crouch: false },
        ],
        ctSpots: [
          { pos: [6, 0, -20], yaw: 3.1, cls: 'classic_ct', w: 'm4a1', crouch: true },
          { pos: [-2, 0, -21], yaw: 3.0, cls: 'specops_ct', w: 'awp', crouch: false },
          { pos: [12, 0, -18], yaw: 3.3, cls: 'urban_ct', w: 'mp5', crouch: true },
        ],
      },
    };
  }

  private buildAztec(ctx: BuildContext): BuiltMap {
    addSkyDome(ctx, 0x486e68, 0x8ea89c, 0xcbd9d0);
    addGroundAndHorizon(ctx, 76, 76, 'moss_stone', 0x828c74, 'moss_stone', 0x707a64, 7.6, 'jungle');

    // River Water Channel running East-West under the Bridge
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(74, 16),
      getMat(ctx, 'water', 10, 3, 0x2f7682, 0.2, 0.35)
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(0, 0.04, -8);
    ctx.group.add(water);

    // Temple Double Doors
    addArchway(ctx, 0, 0, 4, 34, 6.0, 5.8, 4.2, 2.4, 'moss_stone', 0x5c6952);
    addDoubleDoors(ctx, 0, 0, 4, 5.8, 2.4, 4.1, 0x453b2e);

    // Iconic Aztec Wooden Suspension Bridge over Water Gorge
    addSolidBox(ctx, 20, 0, -8, 5.5, 1.5, 20, 'wood_plank', 0x805d3b);
    addSteps(ctx, 20, 0, 2, 0, 1, 4.5, 1.5, 4, 4, 'moss_stone');
    addSteps(ctx, 20, 0, -18, 0, -1, 4.5, 1.5, 4, 4, 'moss_stone');
    // Bridge side wooden rope posts
    [-16, -10, -4, 0].forEach((bz) => {
      addSolidBox(ctx, 17.4, 1.5, bz, 0.25, 1.1, 0.25, 'wood_plank', 0x5c4024);
      addSolidBox(ctx, 22.6, 1.5, bz, 0.25, 1.1, 0.25, 'wood_plank', 0x5c4024);
    });

    // Stepped Temple Pillars, Torch Braziers & Jungle Trees
    addPalmTree(ctx, -28, 0, 16, 7.0);
    addPalmTree(ctx, 28, 0, 18, 6.8);
    addPalmTree(ctx, -28, 0, -28, 7.2);
    addPalmTree(ctx, 29, 0, -29, 6.5);
    addTunnelLantern(ctx, 0, 3.8, 4);
    addSandbagBarricade(ctx, -6, 0, 14, 3, 2, true, 0x8b8f74);

    addTrimWall(ctx, -24, 0, -20, 3, 5.6, 3, 'moss_stone', 0x626e58, 0x79876e);
    addTrimWall(ctx, -14, 0, -24, 3, 5.6, 3, 'moss_stone', 0x626e58, 0x79876e);
    addCrate(ctx, -20, 0, -22, 1.8, 1.8);
    addSiteDecal(ctx, -20, 0, -20, 'B');

    addTrimWall(ctx, 14, 0, -24, 3, 5.6, 3, 'moss_stone', 0x626e58, 0x79876e);
    addCrate(ctx, 22, 0, -24, 1.9, 1.8);
    addCrate(ctx, 18, 0, -28, 1.7, 1.6);
    addSiteDecal(ctx, 18, 0, -24, 'A');

    addCrate(ctx, 0, 0, 12, 1.8, 1.6);
    addCrate(ctx, -4, 0, -18, 1.8, 1.7);

    const waypoints: WaypointNode[] = [
      { id: 't', x: 0, y: 0, z: 30, neighbors: [], tag: 'T' },
      { id: 'doors', x: 0, y: 0, z: 4, neighbors: [], tag: 'MID' },
      { id: 'bridge', x: 20, y: 1.5, z: -8, neighbors: [] },
      { id: 'a', x: 18, y: 0, z: -24, neighbors: [], tag: 'A' },
      { id: 'b', x: -20, y: 0, z: -20, neighbors: [], tag: 'B' },
      { id: 'ct', x: 0, y: 0, z: -32, neighbors: [], tag: 'CT' },
    ];
    [
      ['t', 'doors'],
      ['t', 'bridge'],
      ['bridge', 'a'],
      ['doors', 'a'],
      ['doors', 'b'],
      ['a', 'ct'],
      ['b', 'ct'],
    ].forEach(([a, b]) => link(waypoints, a, b));

    return {
      id: 'de_aztec',
      group: ctx.group,
      colliders: ctx.colliders,
      raycastMeshes: ctx.raycastMeshes,
      tSpawns: [
        new THREE.Vector3(-4, 0, 30),
        new THREE.Vector3(0, 0, 30),
        new THREE.Vector3(4, 0, 30),
        new THREE.Vector3(-2, 0, 27),
        new THREE.Vector3(2, 0, 27),
      ],
      ctSpawns: [
        new THREE.Vector3(-4, 0, -32),
        new THREE.Vector3(0, 0, -32),
        new THREE.Vector3(4, 0, -32),
        new THREE.Vector3(-2, 0, -29),
        new THREE.Vector3(2, 0, -29),
      ],
      dmSpawns: [
        new THREE.Vector3(0, 0, 30),
        new THREE.Vector3(20, 1.5, -8),
        new THREE.Vector3(18, 0, -24),
        new THREE.Vector3(-20, 0, -20),
        new THREE.Vector3(0, 0, 4),
      ],
      bombsites: [
        { label: 'A', x: 18, y: 0, z: -24, radius: 6.0 },
        { label: 'B', x: -20, y: 0, z: -20, radius: 6.0 },
      ],
      buyZones: [
        { team: 'T', x: 0, z: 29, radius: 10 },
        { team: 'CT', x: 0, z: -31, radius: 10 },
      ],
      waypoints,
      skyColor: 0x627d73,
      fogColor: 0x6c877c,
      fogDensity: 0.011,
      sunColor: 0xd9f0dc,
      sunIntensity: 1.65,
      sunPos: new THREE.Vector3(20, 60, 20),
      hemiSky: 0x82a697,
      hemiGround: 0x3b4a33,
      hemiIntensity: 0.74,
      surfaceType: 'concrete',
      bounds: { minX: -38, maxX: 38, minZ: -38, maxZ: 38 },
      ambientParticleMode: 'mist',
      menuShowcase: {
        camCenter: new THREE.Vector3(10, 4.8, -8),
        camOrbitRadius: 14,
        camHeight: 5.2,
        lookAt: new THREE.Vector3(18, 2.0, -8),
        smokePos: new THREE.Vector3(20, 1.6, -8),
        tSpots: [
          { pos: [19, 1.5, -2], yaw: 0, cls: 'military_t', w: 'ak47', crouch: false },
          { pos: [21, 1.5, 0], yaw: 0.1, cls: 'classic_t', w: 'sg552', crouch: true },
          { pos: [4, 0, 10], yaw: 0.15, cls: 'desert_t', w: 'deagle', crouch: false },
        ],
        ctSpots: [
          { pos: [19, 1.5, -14], yaw: 3.14, cls: 'classic_ct', w: 'm4a1', crouch: true },
          { pos: [21, 1.5, -16], yaw: 3.0, cls: 'specops_ct', w: 'aug', crouch: false },
          { pos: [3, 0, -19], yaw: 3.0, cls: 'urban_ct', w: 'awp', crouch: true },
        ],
      },
    };
  }

  private buildOffice(ctx: BuildContext): BuiltMap {
    addSkyDome(ctx, 0x89a9c7, 0xd8e5f0, 0xf2f7fc);
    addGroundAndHorizon(ctx, 72, 72, 'office_floor', 0x8c97a3, 'concrete', 0xc9d4de, 7.2, 'snow');

    // Exterior Snowy CT Courtyard (South Z > 10)
    addSolidBox(ctx, 0, 0.01, 24, 70, 0.08, 26, 'snow', 0xedf4fa, 0.9, 0.02, 10, 4, false);
    addPineTree(ctx, -25, 0, 26, 1.15);
    addPineTree(ctx, 25, 0, 26, 1.1);
    addPineTree(ctx, -20, 0, 16, 0.95);
    addVehicle(ctx, 14, 0, 22, 0x26384d, false); // Armored SWAT Truck
    addSandbagBarricade(ctx, -7, 0, 17, 3, 2, true, 0x6f7b87);

    // Main Glass & Concrete Office Building Facade
    addArchway(ctx, 0, 0, 10, 70, 8.0, 5.2, 3.6, 1.5, 'concrete', 0xb8c0c8);
    addWindowShutter(ctx, -12, 3.6, 10.78, false, 0x394b5e);
    addWindowShutter(ctx, 12, 3.6, 10.78, false, 0x394b5e);
    [
      [-18, -14],
      [0, -14],
      [18, -14],
    ].forEach(([lx, lz]) => {
      const pt = new THREE.PointLight(0xffe9c9, 1.6, 26, 1.5);
      pt.position.set(lx, 4.2, lz);
      ctx.group.add(pt);
    });

    // Interior Cubicles, Mahogany Desks, Monitors & Conference Room
    addSolidBox(ctx, -14, 0, -4, 1.2, 2.4, 16, 'concrete', 0x9aa4ad);
    addSolidBox(ctx, 0, 0, -6, 12, 2.4, 1.2, 'concrete', 0x9aa4ad);
    addSolidBox(ctx, 16, 0, -6, 1.2, 4.4, 16, 'concrete', 0xa8b1ba);
    addSolidBox(ctx, -22, 0, -18, 4.8, 0.95, 2.0, 'wood_plank', 0x6b4528);
    addSolidBox(ctx, 22, 0, -20, 4.8, 0.95, 2.0, 'wood_plank', 0x6b4528);
    // Office workstation monitors on desks
    [-22, 22].forEach((dx, idx) => {
      const monitor = new THREE.Mesh(
        new THREE.BoxGeometry(0.95, 0.55, 0.08),
        new THREE.MeshBasicMaterial({ color: 0x5c96cc })
      );
      monitor.position.set(dx, 1.32, idx === 0 ? -18 : -20);
      ctx.group.add(monitor);
    });
    addCrate(ctx, 0, 0, 2, 1.6, 1.5, 0x7b8691);

    addSiteDecal(ctx, -22, 0, -22, 'B');
    addSiteDecal(ctx, 22, 0, -22, 'A');

    const waypoints: WaypointNode[] = [
      { id: 'ct', x: 0, y: 0, z: 28, neighbors: [], tag: 'CT' },
      { id: 'hall', x: 0, y: 0, z: 6, neighbors: [], tag: 'MID' },
      { id: 'left', x: -22, y: 0, z: -22, neighbors: [], tag: 'B' },
      { id: 'right', x: 22, y: 0, z: -22, neighbors: [], tag: 'A' },
      { id: 't', x: 0, y: 0, z: -28, neighbors: [], tag: 'T' },
    ];
    [
      ['ct', 'hall'],
      ['hall', 'left'],
      ['hall', 'right'],
      ['left', 't'],
      ['right', 't'],
    ].forEach(([a, b]) => link(waypoints, a, b));

    return {
      id: 'cs_office',
      group: ctx.group,
      colliders: ctx.colliders,
      raycastMeshes: ctx.raycastMeshes,
      tSpawns: [
        new THREE.Vector3(-4, 0, -29),
        new THREE.Vector3(0, 0, -29),
        new THREE.Vector3(4, 0, -29),
        new THREE.Vector3(-2, 0, -26),
        new THREE.Vector3(2, 0, -26),
      ],
      ctSpawns: [
        new THREE.Vector3(-4, 0, 29),
        new THREE.Vector3(0, 0, 29),
        new THREE.Vector3(4, 0, 29),
        new THREE.Vector3(-2, 0, 26),
        new THREE.Vector3(2, 0, 26),
      ],
      dmSpawns: [
        new THREE.Vector3(0, 0, 28),
        new THREE.Vector3(0, 0, -28),
        new THREE.Vector3(-22, 0, -22),
        new THREE.Vector3(22, 0, -22),
        new THREE.Vector3(0, 0, 6),
      ],
      bombsites: [
        { label: 'A', x: 22, y: 0, z: -22, radius: 5.8 },
        { label: 'B', x: -22, y: 0, z: -22, radius: 5.8 },
      ],
      buyZones: [
        { team: 'T', x: 0, z: -28, radius: 10 },
        { team: 'CT', x: 0, z: 28, radius: 10 },
      ],
      waypoints,
      skyColor: 0xbfd1e0,
      fogColor: 0xd0deeb,
      fogDensity: 0.008,
      sunColor: 0xf4f8ff,
      sunIntensity: 1.65,
      sunPos: new THREE.Vector3(30, 50, 40),
      hemiSky: 0xd9e8f5,
      hemiGround: 0x626b75,
      hemiIntensity: 0.8,
      surfaceType: 'concrete',
      bounds: { minX: -36, maxX: 36, minZ: -36, maxZ: 36 },
      ambientParticleMode: 'snow',
      menuShowcase: {
        camCenter: new THREE.Vector3(-4, 4.0, 20),
        camOrbitRadius: 14,
        camHeight: 4.5,
        lookAt: new THREE.Vector3(0, 1.5, 10),
        smokePos: new THREE.Vector3(0, 0.2, 11),
        tSpots: [
          { pos: [-3, 0, 6], yaw: 3.1, cls: 'urban_t', w: 'ak47', crouch: false },
          { pos: [3, 0, 7], yaw: 3.0, cls: 'classic_t', w: 'p90', crouch: true },
          { pos: [0, 0, 4], yaw: 3.14, cls: 'military_t', w: 'awp', crouch: false },
        ],
        ctSpots: [
          { pos: [-5, 0, 20], yaw: 0, cls: 'classic_ct', w: 'm4a1', crouch: true },
          { pos: [6, 0, 22], yaw: -0.2, cls: 'specops_ct', w: 'mp5', crouch: false },
          { pos: [11, 0, 19], yaw: -0.35, cls: 'assault_ct', w: 'aug', crouch: true },
        ],
      },
    };
  }

  private buildAssault(ctx: BuildContext): BuiltMap {
    addSkyDome(ctx, 0x1e2836, 0x45566b, 0x687c94);
    addGroundAndHorizon(ctx, 74, 76, 'asphalt', 0x495059, 'brick', 0x614a40, 7.8, 'urban');

    // Yellow dashed asphalt lane markings (image_5c6cc03c)
    addPlaneDecal(ctx, 0, 0.025, 22, 54, 1.4, textures.createRoadStripeTexture(), 0, -Math.PI / 2);

    // Warehouse Corrugated Steel Facade, Green Warehouse Sign & Red Vertical Wall Ladder (image_5c6cc03c)
    addArchway(ctx, 0, 0, 4, 72, 10.0, 6.6, 4.4, 1.6, 'corrugated_metal', 0x566270);
    addPlaneDecal(ctx, -12, 4.7, 4.86, 5.2, 1.5, textures.createTrainSignTexture('WAREHOUSE 04', '#265c37', '#f0f4f0'), 0);
    addRedWallLadder(ctx, -18, 0, 4.88, 6.4, 'z+');
    addSolidBox(ctx, 0, 5.2, 4, 10.4, 0.4, 2.0, 'hazard', 0xffffff, 0.6, 0.2, 4, 1, false);
    addIndustrialPipeRun(ctx, -14, 5.2, -14, 28, false, 0x4e5863, 0.34);
    addIndustrialPipeRun(ctx, 12, 5.2, -16, 28, false, 0x4e5863, 0.34);

    // Triple-stacked Red Container Tower + Blue Yard Containers (image_5c6cc03c)
    addShippingContainer(ctx, -20, 0, 22, 8.2, 3.0, 3.4, 'container_red', true);
    addShippingContainer(ctx, -20, 3.0, 22, 8.2, 3.0, 3.4, 'container_red', true);
    addShippingContainer(ctx, -14, 0, -14, 8.2, 3.2, 3.5, 'container_blue', true);
    addShippingContainer(ctx, 12, 0, -18, 8.2, 3.2, 3.5, 'container_red', true);
    addSolidBox(ctx, -24, 0, -24, 6, 2.2, 16, 'metal', 0x5b646e);
    addSteps(ctx, -24, 0, -16, 0, 1, 4, 2.2, 5, 5, 'metal');

    // Exterior Night Alleyway Trucks & Warm Sodium Streetlamps
    addVehicle(ctx, -10, 0, 20, 0x707880, false);
    addStreetLamp(ctx, -18, 0, 18, 0xffaa44);
    addStreetLamp(ctx, 16, 0, 18, 0xffaa44);
    addStreetLamp(ctx, 0, 0, -14, 0x99ccff);

    addCrate(ctx, 10, 0, 18, 1.8, 1.8, 0xffffff, 'crate_military');
    addCrate(ctx, 0, 0, -8, 1.9, 1.8);
    addOilBarrel(ctx, 7, 0, 14, 0x3b593d);

    addSiteDecal(ctx, 14, 0, -24, 'A');
    addSiteDecal(ctx, -16, 0, -24, 'B');

    const waypoints: WaypointNode[] = [
      { id: 'ct', x: 0, y: 0, z: 30, neighbors: [], tag: 'CT' },
      { id: 'door', x: 0, y: 0, z: 4, neighbors: [], tag: 'MID' },
      { id: 'a', x: 14, y: 0, z: -24, neighbors: [], tag: 'A' },
      { id: 'b', x: -16, y: 0, z: -24, neighbors: [], tag: 'B' },
      { id: 't', x: 0, y: 0, z: -30, neighbors: [], tag: 'T' },
    ];
    [
      ['ct', 'door'],
      ['door', 'a'],
      ['door', 'b'],
      ['a', 't'],
      ['b', 't'],
    ].forEach(([a, b]) => link(waypoints, a, b));

    return {
      id: 'cs_assault',
      group: ctx.group,
      colliders: ctx.colliders,
      raycastMeshes: ctx.raycastMeshes,
      tSpawns: [
        new THREE.Vector3(-4, 0, -30),
        new THREE.Vector3(0, 0, -30),
        new THREE.Vector3(4, 0, -30),
        new THREE.Vector3(-2, 0, -27),
        new THREE.Vector3(2, 0, -27),
      ],
      ctSpawns: [
        new THREE.Vector3(-4, 0, 30),
        new THREE.Vector3(0, 0, 30),
        new THREE.Vector3(4, 0, 30),
        new THREE.Vector3(-2, 0, 27),
        new THREE.Vector3(2, 0, 27),
      ],
      dmSpawns: [
        new THREE.Vector3(0, 0, 30),
        new THREE.Vector3(0, 0, -30),
        new THREE.Vector3(14, 0, -24),
        new THREE.Vector3(-16, 0, -24),
        new THREE.Vector3(0, 0, 4),
      ],
      bombsites: [
        { label: 'A', x: 14, y: 0, z: -24, radius: 5.8 },
        { label: 'B', x: -16, y: 0, z: -24, radius: 5.8 },
      ],
      buyZones: [
        { team: 'T', x: 0, z: -29, radius: 10 },
        { team: 'CT', x: 0, z: 29, radius: 10 },
      ],
      waypoints,
      skyColor: 0x2c3847,
      fogColor: 0x3b4859,
      fogDensity: 0.009,
      sunColor: 0xb0c9e8,
      sunIntensity: 1.35,
      sunPos: new THREE.Vector3(-30, 50, 35),
      hemiSky: 0x6f859e,
      hemiGround: 0x353b42,
      hemiIntensity: 0.78,
      surfaceType: 'metal',
      bounds: { minX: -37, maxX: 37, minZ: -38, maxZ: 38 },
      ambientParticleMode: 'sparks',
      menuShowcase: {
        camCenter: new THREE.Vector3(6, 4.6, 16),
        camOrbitRadius: 13,
        camHeight: 4.8,
        lookAt: new THREE.Vector3(-2, 1.5, 4),
        smokePos: new THREE.Vector3(0, 0.2, 5),
        tSpots: [
          { pos: [-3, 0, -2], yaw: 3.1, cls: 'classic_t', w: 'ak47', crouch: false },
          { pos: [3, 0, 0], yaw: 3.0, cls: 'urban_t', w: 'mac10', crouch: true },
        ],
        ctSpots: [
          { pos: [-5, 0, 16], yaw: 0, cls: 'urban_ct', w: 'mp5', crouch: true },
          { pos: [6, 0, 16], yaw: -0.2, cls: 'classic_ct', w: 'm4a1', crouch: false },
        ],
      },
    };
  }

  private buildItaly(ctx: BuildContext): BuiltMap {
    addSkyDome(ctx, 0x5c96cc, 0xead5ba, 0xfff5e8);
    addGroundAndHorizon(ctx, 74, 76, 'cobblestone', 0xd1c4b2, 'terracotta', 0xd4a47d, 7.2, 'villa');

    // Long Alley Buildings, Shutters, Archways & Villa Courtyard Hedges (image_4fda53a5)
    addTrimWall(ctx, -10, 0, 8, 2.2, 5.6, 26, 'terracotta', 0xd9b791);
    addTrimWall(ctx, 10, 0, 8, 2.2, 5.6, 26, 'terracotta', 0xd9b791);
    addWindowShutter(ctx, -8.85, 3.7, 6, true, 0x45634b);
    addWindowShutter(ctx, 8.85, 3.7, 10, true, 0x6b472b);
    addHedgeRow(ctx, -16, 0, 20, 9, false);
    addHedgeRow(ctx, 16, 0, 20, 9, false);

    // Market Courtyard Fountain + Colorful Market Stalls & Awnings
    addFountain(ctx, 0, 0, -14);
    addSolidBox(ctx, -20, 0, -10, 3.8, 1.2, 2.2, 'wood_plank', 0x875c38);
    addMarketAwning(ctx, -20, 2.6, -10, 4.4, 3.0, 0xb8483c, false, true);
    addSolidBox(ctx, 20, 0, -10, 3.8, 1.2, 2.2, 'wood_plank', 0x875c38);
    addMarketAwning(ctx, 20, 2.6, -10, 4.4, 3.0, 0x457343, false, true);
    addOilBarrel(ctx, -14, 0, -13, 0x6b472b);
    addCrate(ctx, -4, 0, 10, 1.7, 1.6);

    // Upper Bridge overlooking Market Square
    addSolidBox(ctx, 0, 0, -24, 14, 1.8, 5, 'terracotta', 0xc8a47e);
    addSteps(ctx, 7, 0, -24, 1, 0, 4, 1.8, 4.5, 5, 'terracotta');
    addSteps(ctx, -7, 0, -24, -1, 0, 4, 1.8, 4.5, 5, 'terracotta');
    addStreetLamp(ctx, -6, 0, -18, 0xffd594);

    addSiteDecal(ctx, -22, 0, -22, 'B');
    addSiteDecal(ctx, 22, 0, -22, 'A');

    const waypoints: WaypointNode[] = [
      { id: 'ct', x: 0, y: 0, z: 30, neighbors: [], tag: 'CT' },
      { id: 'mid', x: 0, y: 0, z: 4, neighbors: [], tag: 'MID' },
      { id: 'market', x: 0, y: 0, z: -14, neighbors: [] },
      { id: 'a', x: 22, y: 0, z: -22, neighbors: [], tag: 'A' },
      { id: 'b', x: -22, y: 0, z: -22, neighbors: [], tag: 'B' },
      { id: 't', x: 0, y: 0, z: -32, neighbors: [], tag: 'T' },
    ];
    [
      ['ct', 'mid'],
      ['mid', 'market'],
      ['market', 'a'],
      ['market', 'b'],
      ['a', 't'],
      ['b', 't'],
    ].forEach(([a, b]) => link(waypoints, a, b));

    return {
      id: 'cs_italy',
      group: ctx.group,
      colliders: ctx.colliders,
      raycastMeshes: ctx.raycastMeshes,
      tSpawns: [
        new THREE.Vector3(-4, 0, -32),
        new THREE.Vector3(0, 0, -32),
        new THREE.Vector3(4, 0, -32),
        new THREE.Vector3(-2, 0, -29),
        new THREE.Vector3(2, 0, -29),
      ],
      ctSpawns: [
        new THREE.Vector3(-4, 0, 30),
        new THREE.Vector3(0, 0, 30),
        new THREE.Vector3(4, 0, 30),
        new THREE.Vector3(-2, 0, 27),
        new THREE.Vector3(2, 0, 27),
      ],
      dmSpawns: [
        new THREE.Vector3(0, 0, 30),
        new THREE.Vector3(0, 0, -32),
        new THREE.Vector3(22, 0, -22),
        new THREE.Vector3(-22, 0, -22),
        new THREE.Vector3(0, 0, -14),
      ],
      bombsites: [
        { label: 'A', x: 22, y: 0, z: -22, radius: 5.8 },
        { label: 'B', x: -22, y: 0, z: -22, radius: 5.8 },
      ],
      buyZones: [
        { team: 'T', x: 0, z: -31, radius: 10 },
        { team: 'CT', x: 0, z: 29, radius: 10 },
      ],
      waypoints,
      skyColor: 0x99c6e8,
      fogColor: 0xdfcfba,
      fogDensity: 0.007,
      sunColor: 0xffe4b8,
      sunIntensity: 1.85,
      sunPos: new THREE.Vector3(38, 60, 25),
      hemiSky: 0xa6d0f0,
      hemiGround: 0x917458,
      hemiIntensity: 0.74,
      surfaceType: 'concrete',
      bounds: { minX: -37, maxX: 37, minZ: -38, maxZ: 38 },
      ambientParticleMode: 'dust',
      menuShowcase: {
        camCenter: new THREE.Vector3(6, 4.4, -10),
        camOrbitRadius: 14,
        camHeight: 4.8,
        lookAt: new THREE.Vector3(0, 1.4, -14),
        smokePos: new THREE.Vector3(0, 0.2, -10),
        tSpots: [
          { pos: [-3, 1.8, -23], yaw: 3.1, cls: 'desert_t', w: 'ak47', crouch: false },
          { pos: [4, 1.8, -23], yaw: 3.2, cls: 'classic_t', w: 'galil', crouch: true },
          { pos: [-12, 0, -18], yaw: 2.8, cls: 'military_t', w: 'deagle', crouch: false },
        ],
        ctSpots: [
          { pos: [-4, 0, -5], yaw: 0.1, cls: 'classic_ct', w: 'm4a1', crouch: true },
          { pos: [4, 0, -4], yaw: -0.1, cls: 'specops_ct', w: 'aug', crouch: false },
          { pos: [12, 0, -8], yaw: -0.4, cls: 'assault_ct', w: 'famas', crouch: true },
        ],
      },
    };
  }
}

export const mapManager = new MapManager();
