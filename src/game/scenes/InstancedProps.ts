import * as THREE from 'three';
import { gltfPipeline, HeroAssetId } from '../../assets/models/GltfModelPipeline';
import { TextureKind, textures } from '../ProceduralTextures';

export interface InstancedPropEntry {
  x: number;
  y: number;
  z: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  rotY: number;
  colorHex: number;
}

export interface HeroGlbSpot {
  assetId: HeroAssetId;
  x: number;
  y: number;
  z: number;
  rotY: number;
  scale?: number;
}

function deterministicJitter(x: number, z: number, seed: number): number {
  const s = Math.sin(x * 12.9898 + z * 78.233 + seed * 37.719) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Chamfered unit crate body centered at origin (-0.5..+0.5) so instanced crates
 * catch realistic specular highlights along beveled edges instead of sharp cube corners.
 */
function createBeveledCrateGeometry(): THREE.BufferGeometry {
  const s = 0.46;
  const shape = new THREE.Shape();
  shape.moveTo(-s, -s);
  shape.lineTo(s, -s);
  shape.lineTo(s, s);
  shape.lineTo(-s, s);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.92,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 2,
  });
  geo.center();
  return geo;
}

/**
 * Ribbed 55-gallon fuel drum LatheGeometry centered vertically (-0.64..+0.64)
 * with rolled top/bottom chimes and raised structural bands.
 */
function createRibbedDrumGeometry(): THREE.BufferGeometry {
  const pts = [
    new THREE.Vector2(0.01, -0.64),
    new THREE.Vector2(0.46, -0.64),
    new THREE.Vector2(0.475, -0.59),
    new THREE.Vector2(0.445, -0.54),
    new THREE.Vector2(0.445, -0.34),
    new THREE.Vector2(0.485, -0.30),
    new THREE.Vector2(0.445, -0.26),
    new THREE.Vector2(0.445, -0.04),
    new THREE.Vector2(0.485, 0.0),
    new THREE.Vector2(0.445, 0.04),
    new THREE.Vector2(0.445, 0.26),
    new THREE.Vector2(0.485, 0.30),
    new THREE.Vector2(0.445, 0.34),
    new THREE.Vector2(0.445, 0.54),
    new THREE.Vector2(0.475, 0.59),
    new THREE.Vector2(0.45, 0.64),
    new THREE.Vector2(0.01, 0.625),
  ];
  return new THREE.LatheGeometry(pts, 24);
}

/**
 * Arched, V-folded palm frond blade extending from x=0..2.75 along +X with graceful droop.
 */
function createArchedPalmFrondGeometry(): THREE.BufferGeometry {
  const segs = 10;
  const length = 2.75;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const x = t * length;
    const archY = Math.sin(t * Math.PI * 0.72) * 0.48 - t * t * 0.92;
    const halfW = Math.sin(Math.pow(t, 0.65) * Math.PI) * 0.44 + (1 - t) * 0.06;
    const droopEdgeY = archY - halfW * 0.28;

    // Left edge, center spine, right edge
    positions.push(x, droopEdgeY, -halfW);
    positions.push(x, archY + 0.04, 0);
    positions.push(x, droopEdgeY, halfW);

    uvs.push(0, t);
    uvs.push(0.5, t);
    uvs.push(1, t);
  }

  for (let i = 0; i < segs; i++) {
    const row0 = i * 3;
    const row1 = (i + 1) * 3;
    indices.push(row0, row1, row1 + 1);
    indices.push(row0, row1 + 1, row0 + 1);
    indices.push(row0 + 1, row1 + 1, row1 + 2);
    indices.push(row0 + 1, row1 + 2, row0 + 2);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Sculpted fluted evergreen pine bough skirt (-0.5..+0.5 height, ~1.0 max radius)
 * replacing bare geometric cones with organic multi-lobed branch silhouettes.
 */
function createOrganicPineTierGeometry(lobes = 7): THREE.BufferGeometry {
  const radialSegs = 21;
  const heightSegs = 4;
  const geo = new THREE.CylinderGeometry(0.06, 1.0, 1.0, radialSegs, heightSegs, false);
  const pos = geo.attributes.position as THREE.BufferAttribute;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const r = Math.hypot(x, z);
    if (r > 0.04) {
      const ang = Math.atan2(z, x);
      const t = 0.5 - y; // 0 at top, 1 at bottom
      const lobeFactor = 1 + 0.22 * Math.cos(ang * lobes + t * 1.4) * (0.35 + 0.65 * t);
      const stepDroop = Math.sin(t * Math.PI * 2.5) * 0.045;
      pos.setX(i, x * lobeFactor);
      pos.setZ(i, z * lobeFactor);
      pos.setY(i, y - stepDroop * r);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

/**
 * Batches repeated map props (chamfered framed crates, ribbed fuel drums,
 * arched palm crowns, multi-lobed snowy pines) into GPU InstancedMesh draws
 * with per-instance color variation and normal-mapped materials.
 */
export class PropBatchBuilder {
  private standardCrates: InstancedPropEntry[] = [];
  private militaryCrates: InstancedPropEntry[] = [];
  private crateRims: InstancedPropEntry[] = [];
  private pallets: InstancedPropEntry[] = [];
  private barrelBodies: InstancedPropEntry[] = [];
  private barrelBungs: InstancedPropEntry[] = [];
  private palmTrunks: InstancedPropEntry[] = [];
  private palmFronds: InstancedPropEntry[] = [];
  private palmCoconuts: InstancedPropEntry[] = [];
  private pineTrunks: InstancedPropEntry[] = [];
  private pineCones: InstancedPropEntry[] = [];
  private pineSnowCaps: InstancedPropEntry[] = [];

  public addCrateInstance(
    x: number,
    y: number,
    z: number,
    size: number,
    h: number,
    tint: number,
    kind: TextureKind
  ): void {
    if (y < 0.05) {
      this.pallets.push({
        x,
        y: y + 0.06,
        z,
        scaleX: size + 0.16,
        scaleY: 0.12,
        scaleZ: size + 0.16,
        rotY: 0,
        colorHex: 0x6b4c30,
      });
    }
    const crateY = y < 0.05 ? y + 0.12 : y;
    const entry: InstancedPropEntry = {
      x,
      y: crateY + h / 2,
      z,
      scaleX: size,
      scaleY: h,
      scaleZ: size,
      rotY: 0,
      colorHex: tint,
    };
    if (kind === 'crate_military') {
      this.militaryCrates.push(entry);
    } else {
      this.standardCrates.push(entry);
    }

    // Steel top and bottom reinforcing collar bands for modeled depth
    const rimColor = kind === 'crate_military' ? 0x262c33 : 0x4b3b2c;
    this.crateRims.push(
      {
        x,
        y: crateY + 0.045,
        z,
        scaleX: size * 1.03,
        scaleY: 0.075,
        scaleZ: size * 1.03,
        rotY: 0,
        colorHex: rimColor,
      },
      {
        x,
        y: crateY + h - 0.045,
        z,
        scaleX: size * 1.03,
        scaleY: 0.075,
        scaleZ: size * 1.03,
        rotY: 0,
        colorHex: rimColor,
      }
    );
  }

  public addBarrelInstance(x: number, y: number, z: number, tint: number): void {
    const jitter = 0.94 + deterministicJitter(x, z, 1) * 0.12;
    const yaw = deterministicJitter(x, z, 2) * Math.PI * 2;
    this.barrelBodies.push({
      x,
      y: y + 0.64 * jitter,
      z,
      scaleX: jitter,
      scaleY: jitter,
      scaleZ: jitter,
      rotY: yaw,
      colorHex: tint,
    });
    this.barrelBungs.push({
      x: x + Math.cos(yaw) * 0.2 * jitter,
      y: y + 1.28 * jitter,
      z: z + Math.sin(yaw) * 0.2 * jitter,
      scaleX: jitter,
      scaleY: jitter,
      scaleZ: jitter,
      rotY: yaw,
      colorHex: 0xc8ced4,
    });
  }

  public addPalmInstance(x: number, y: number, z: number, height: number): void {
    const scaleJitter = 0.92 + deterministicJitter(x, z, 3) * 0.16;
    const h = height * scaleJitter;
    const baseYaw = deterministicJitter(x, z, 4) * Math.PI * 2;
    const segs = 5;
    let curX = x;
    let curZ = z;
    for (let s = 0; s < segs; s++) {
      const sh = h / segs;
      const sway = (s * s) / (segs * segs);
      curX = x + Math.cos(baseYaw) * sway * 0.45;
      curZ = z + Math.sin(baseYaw) * sway * 0.45;
      this.palmTrunks.push({
        x: curX,
        y: y + (s + 0.5) * sh,
        z: curZ,
        scaleX: 1.08 - s * 0.11,
        scaleY: sh + 0.09,
        scaleZ: 1.08 - s * 0.11,
        rotY: baseYaw,
        colorHex: 0x9b7956,
      });
    }

    // Coconut cluster under crown
    for (let c = 0; c < 3; c++) {
      const cAng = baseYaw + (c / 3) * Math.PI * 2;
      this.palmCoconuts.push({
        x: curX + Math.cos(cAng) * 0.22,
        y: y + h - 0.22,
        z: curZ + Math.sin(cAng) * 0.22,
        scaleX: 0.16,
        scaleY: 0.19,
        scaleZ: 0.16,
        rotY: cAng,
        colorHex: 0x5c3e26,
      });
    }

    // Double-tier arched palm fronds (10 total blades)
    for (let i = 0; i < 10; i++) {
      const ang = baseYaw + (i / 10) * Math.PI * 2;
      const lenScale = i % 2 === 0 ? 1.04 : 0.84;
      this.palmFronds.push({
        x: curX,
        y: y + h - (i % 2 === 0 ? 0.06 : 0.18),
        z: curZ,
        scaleX: lenScale,
        scaleY: lenScale,
        scaleZ: lenScale,
        rotY: -ang,
        colorHex: i % 2 === 0 ? 0x56883e : 0x6ca14d,
      });
    }
  }

  public addPineInstance(x: number, y: number, z: number, scale: number): void {
    const s = scale * (0.9 + deterministicJitter(x, z, 5) * 0.2);
    const yaw = deterministicJitter(x, z, 6) * Math.PI * 2;
    this.pineTrunks.push({
      x,
      y: y + 1.1 * s,
      z,
      scaleX: s,
      scaleY: s,
      scaleZ: s,
      rotY: yaw,
      colorHex: 0x6a4b34,
    });
    [
      { py: 2.8, r: 1.78, h: 2.25 },
      { py: 4.1, r: 1.38, h: 1.95 },
      { py: 5.25, r: 0.92, h: 1.65 },
    ].forEach((tier, idx) => {
      this.pineCones.push({
        x,
        y: y + tier.py * s,
        z,
        scaleX: tier.r * s,
        scaleY: tier.h * s,
        scaleZ: tier.r * s,
        rotY: yaw + idx * 0.55,
        colorHex: 0x355c3e,
      });
      this.pineSnowCaps.push({
        x,
        y: y + (tier.py + tier.h * 0.28) * s,
        z,
        scaleX: tier.r * 0.62 * s,
        scaleY: tier.h * 0.42 * s,
        scaleZ: tier.r * 0.62 * s,
        rotY: yaw + idx * 0.55,
        colorHex: 0xe6eff7,
      });
    });
  }

  private emitInstanced(
    group: THREE.Group,
    raycastMeshes: THREE.Mesh[] | null,
    geo: THREE.BufferGeometry,
    mat: THREE.Material,
    entries: InstancedPropEntry[],
    castShadow: boolean,
    receiveShadow: boolean,
    customXRot = 0,
    customZRot = 0
  ): void {
    if (entries.length === 0) {
      geo.dispose();
      return;
    }
    const inst = new THREE.InstancedMesh(geo, mat, entries.length);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    for (let i = 0; i < entries.length; i++) {
      const e = entries[i];
      dummy.position.set(e.x, e.y, e.z);
      dummy.rotation.set(customXRot, e.rotY, customZRot);
      dummy.scale.set(e.scaleX, e.scaleY, e.scaleZ);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
      color.setHex(e.colorHex);
      inst.setColorAt(i, color);
    }
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    inst.computeBoundingSphere();
    inst.castShadow = castShadow;
    inst.receiveShadow = receiveShadow;
    group.add(inst);
    if (raycastMeshes) {
      raycastMeshes.push(inst as unknown as THREE.Mesh);
    }
  }

  public flush(
    group: THREE.Group,
    raycastMeshes: THREE.Mesh[],
    shadows: boolean,
    getMaterial: (
      kind: TextureKind,
      repX: number,
      repY: number,
      tint: number,
      roughness: number,
      metalness: number
    ) => THREE.MeshStandardMaterial
  ): void {
    // Chamfered crates + steel collar rims + wooden pallets
    this.emitInstanced(
      group,
      raycastMeshes,
      createBeveledCrateGeometry(),
      getMaterial('crate', 1, 1, 0xffffff, 0.76, 0.08),
      this.standardCrates,
      shadows,
      shadows
    );
    this.emitInstanced(
      group,
      raycastMeshes,
      createBeveledCrateGeometry(),
      getMaterial('crate_military', 1, 1, 0xffffff, 0.74, 0.14),
      this.militaryCrates,
      shadows,
      shadows
    );
    this.emitInstanced(
      group,
      null,
      new THREE.BoxGeometry(1, 1, 1),
      getMaterial('metal', 1, 1, 0xffffff, 0.42, 0.68),
      this.crateRims,
      false,
      shadows
    );
    this.emitInstanced(
      group,
      null,
      new THREE.BoxGeometry(1, 1, 1),
      getMaterial('wood_plank', 1, 1, 0xffffff, 0.86, 0.04),
      this.pallets,
      false,
      shadows
    );

    // Lathe-profiled ribbed oil barrels + top bung caps
    this.emitInstanced(
      group,
      raycastMeshes,
      createRibbedDrumGeometry(),
      getMaterial('metal', 2, 2, 0xffffff, 0.42, 0.6),
      this.barrelBodies,
      shadows,
      shadows
    );
    this.emitInstanced(
      group,
      null,
      new THREE.CylinderGeometry(0.055, 0.055, 0.05, 12),
      getMaterial('metal', 1, 1, 0xffffff, 0.25, 0.85),
      this.barrelBungs,
      false,
      shadows
    );

    // Palm trees (textured ringed trunks + coconuts + arched V-folded fronds)
    this.emitInstanced(
      group,
      raycastMeshes,
      new THREE.CylinderGeometry(0.22, 0.28, 1, 12),
      getMaterial('bark_palm', 1, 2, 0xffffff, 0.9, 0.02),
      this.palmTrunks,
      shadows,
      shadows
    );
    this.emitInstanced(
      group,
      null,
      new THREE.SphereGeometry(1, 10, 8),
      new THREE.MeshStandardMaterial({ roughness: 0.78, metalness: 0.02 }),
      this.palmCoconuts,
      false,
      false
    );
    const leafPair = textures.getPair('foliage_leaf', 1, 2);
    this.emitInstanced(
      group,
      null,
      createArchedPalmFrondGeometry(),
      new THREE.MeshStandardMaterial({
        map: leafPair.map,
        normalMap: leafPair.normalMap,
        normalScale: new THREE.Vector2(0.85, 0.85),
        roughness: 0.68,
        metalness: 0.02,
        side: THREE.DoubleSide,
      }),
      this.palmFronds,
      shadows,
      false
    );

    // Pine trees (bark_pine trunks + multi-lobed evergreen tiers + snow caps)
    this.emitInstanced(
      group,
      raycastMeshes,
      new THREE.CylinderGeometry(0.18, 0.34, 2.2, 10),
      getMaterial('bark_pine', 1, 2, 0xffffff, 0.92, 0.02),
      this.pineTrunks,
      shadows,
      shadows
    );
    const pinePair = textures.getPair('foliage_pine', 2, 2);
    this.emitInstanced(
      group,
      null,
      createOrganicPineTierGeometry(7),
      new THREE.MeshStandardMaterial({
        map: pinePair.map,
        normalMap: pinePair.normalMap,
        normalScale: new THREE.Vector2(0.9, 0.9),
        roughness: 0.84,
        metalness: 0.02,
      }),
      this.pineCones,
      shadows,
      false
    );
    const snowPair = textures.getPair('snow', 2, 2);
    this.emitInstanced(
      group,
      null,
      createOrganicPineTierGeometry(7),
      new THREE.MeshStandardMaterial({
        map: snowPair.map,
        normalMap: snowPair.normalMap,
        roughness: 0.82,
        metalness: 0.04,
      }),
      this.pineSnowCaps,
      false,
      false
    );
  }
}

/**
 * Mounts GLTF/GLB-compiled hero props wrapped in THREE.LOD (high/med/low detail)
 * at strategic landmark cover locations on each map.
 */
export function attachHeroGlbLodProps(
  group: THREE.Group,
  shadows: boolean,
  spots: HeroGlbSpot[]
): void {
  const medBarrierMat = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.88, metalness: 0.05 });
  const lowDrumMat = new THREE.MeshStandardMaterial({ color: 0x3b593d, roughness: 0.5, metalness: 0.4 });

  for (const spot of spots) {
    const placeholder = new THREE.Group();
    placeholder.position.set(spot.x, spot.y, spot.z);
    placeholder.rotation.y = spot.rotY;
    placeholder.scale.setScalar(spot.scale ?? 1.0);
    group.add(placeholder);

    const builderMap: Record<HeroAssetId, () => THREE.Group> = {
      jersey_barrier_glb: () => {
        const g = new THREE.Group();
        g.add(new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.96, 2.35), medBarrierMat));
        return g;
      },
      fuel_drum_glb: () => {
        const g = new THREE.Group();
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.96, 10), lowDrumMat);
        m.position.y = 0.48;
        g.add(m);
        return g;
      },
      tactical_crate_glb: () => {
        const g = new THREE.Group();
        const m = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), medBarrierMat);
        m.position.y = 0.7;
        g.add(m);
        return g;
      },
      c4_satchel_glb: () => new THREE.Group(),
    };

    void gltfPipeline.loadProceduralGlb(spot.assetId, builderMap[spot.assetId]).then((glbScene) => {
      glbScene.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          obj.castShadow = shadows;
          obj.receiveShadow = shadows;
        }
      });

      const medProxy = builderMap[spot.assetId]();
      medProxy.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          obj.castShadow = shadows;
          obj.receiveShadow = shadows;
        }
      });

      const lowProxy = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.9, 1.1),
        spot.assetId === 'fuel_drum_glb' ? lowDrumMat : medBarrierMat
      );
      lowProxy.position.y = 0.45;

      const lod = gltfPipeline.createLodWrapper(glbScene, medProxy, lowProxy, 22, 48);
      placeholder.add(lod);
    });
  }
}
