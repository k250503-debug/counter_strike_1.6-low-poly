import * as THREE from 'three';
import { gltfPipeline, HeroAssetId } from '../../assets/models/GltfModelPipeline';
import { TextureKind } from '../ProceduralTextures';

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

/**
 * Deterministic fast hash for subtle natural variation (+/- 10-12%) across repeated props
 * without breaking visual alignment or gameplay colliders.
 */
function deterministicJitter(x: number, z: number, seed: number): number {
  const s = Math.sin(x * 12.9898 + z * 78.233 + seed * 37.719) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Batches repeated map props (wooden crates, military crates, ribbed fuel drums,
 * palm trunks/crowns, snowy pines, jersey barriers) into GPU InstancedMesh draws
 * with per-instance color variation and valid bounding spheres.
 */
export class PropBatchBuilder {
  private standardCrates: InstancedPropEntry[] = [];
  private militaryCrates: InstancedPropEntry[] = [];
  private pallets: InstancedPropEntry[] = [];
  private barrelBodies: InstancedPropEntry[] = [];
  private barrelRibs: InstancedPropEntry[] = [];
  private palmTrunks: InstancedPropEntry[] = [];
  private palmFronds: InstancedPropEntry[] = [];
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
  }

  public addBarrelInstance(x: number, y: number, z: number, tint: number): void {
    const jitter = 0.94 + deterministicJitter(x, z, 1) * 0.12;
    this.barrelBodies.push({
      x,
      y: y + 0.64 * jitter,
      z,
      scaleX: jitter,
      scaleY: jitter,
      scaleZ: jitter,
      rotY: deterministicJitter(x, z, 2) * Math.PI * 2,
      colorHex: tint,
    });
    [0.25, 0.64, 1.05].forEach((ry) => {
      this.barrelRibs.push({
        x,
        y: y + ry * jitter,
        z,
        scaleX: jitter,
        scaleY: jitter,
        scaleZ: jitter,
        rotY: 0,
        colorHex: 0x22262b,
      });
    });
  }

  public addPalmInstance(x: number, y: number, z: number, height: number): void {
    const scaleJitter = 0.92 + deterministicJitter(x, z, 3) * 0.16;
    const h = height * scaleJitter;
    const baseYaw = deterministicJitter(x, z, 4) * Math.PI * 2;
    const segs = 4;
    let curX = x;
    let curZ = z;
    for (let s = 0; s < segs; s++) {
      const sh = h / segs;
      curX = x + Math.cos(baseYaw) * s * 0.12;
      curZ = z + Math.sin(baseYaw) * s * 0.12;
      this.palmTrunks.push({
        x: curX,
        y: y + (s + 0.5) * sh,
        z: curZ,
        scaleX: 1 - s * 0.1,
        scaleY: sh + 0.08,
        scaleZ: 1 - s * 0.1,
        rotY: baseYaw,
        colorHex: 0x826344,
      });
    }
    for (let i = 0; i < 8; i++) {
      const ang = baseYaw + (i / 8) * Math.PI * 2;
      this.palmFronds.push({
        x: curX + Math.cos(ang) * 1.15,
        y: y + h - 0.14,
        z: curZ + Math.sin(ang) * 1.15,
        scaleX: 1,
        scaleY: 1,
        scaleZ: 1,
        rotY: -ang,
        colorHex: i % 2 === 0 ? 0x4d7839 : 0x5c8a45,
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
      colorHex: 0x4f3826,
    });
    [
      { py: 2.8, r: 1.7, h: 2.2 },
      { py: 4.1, r: 1.3, h: 1.9 },
      { py: 5.2, r: 0.85, h: 1.6 },
    ].forEach((tier) => {
      this.pineCones.push({
        x,
        y: y + tier.py * s,
        z,
        scaleX: tier.r * s,
        scaleY: tier.h * s,
        scaleZ: tier.r * s,
        rotY: yaw,
        colorHex: 0x2d4a34,
      });
      this.pineSnowCaps.push({
        x,
        y: y + (tier.py + tier.h * 0.32) * s,
        z,
        scaleX: tier.r * 0.56 * s,
        scaleY: tier.h * 0.36 * s,
        scaleZ: tier.r * 0.56 * s,
        rotY: yaw,
        colorHex: 0xdce7f0,
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
    // Crates (batch wood & military ordnance crates)
    this.emitInstanced(
      group,
      raycastMeshes,
      new THREE.BoxGeometry(1, 1, 1),
      getMaterial('crate', 1, 1, 0xffffff, 0.78, 0.08),
      this.standardCrates,
      shadows,
      shadows
    );
    this.emitInstanced(
      group,
      raycastMeshes,
      new THREE.BoxGeometry(1, 1, 1),
      getMaterial('crate_military', 1, 1, 0xffffff, 0.76, 0.12),
      this.militaryCrates,
      shadows,
      shadows
    );
    this.emitInstanced(
      group,
      null,
      new THREE.BoxGeometry(1, 1, 1),
      getMaterial('wood_plank', 1, 1, 0xffffff, 0.88, 0.04),
      this.pallets,
      false,
      shadows
    );

    // Oil barrels + ribs
    this.emitInstanced(
      group,
      raycastMeshes,
      new THREE.CylinderGeometry(0.46, 0.46, 1.28, 16),
      getMaterial('metal', 1, 1, 0xffffff, 0.46, 0.55),
      this.barrelBodies,
      shadows,
      shadows
    );
    this.emitInstanced(
      group,
      null,
      new THREE.CylinderGeometry(0.48, 0.48, 0.06, 16),
      getMaterial('metal', 1, 1, 0xffffff, 0.35, 0.75),
      this.barrelRibs,
      false,
      shadows
    );

    // Palm trees (curved trunk segments + frond cones)
    this.emitInstanced(
      group,
      raycastMeshes,
      new THREE.CylinderGeometry(0.24, 0.28, 1, 8),
      getMaterial('wood_plank', 1, 2, 0xffffff, 0.9, 0.02),
      this.palmTrunks,
      shadows,
      shadows
    );
    this.emitInstanced(
      group,
      null,
      new THREE.ConeGeometry(0.42, 2.75, 5),
      new THREE.MeshStandardMaterial({ roughness: 0.74, metalness: 0.02 }),
      this.palmFronds,
      shadows,
      false,
      0,
      -Math.PI / 2.5
    );

    // Pine trees
    this.emitInstanced(
      group,
      raycastMeshes,
      new THREE.CylinderGeometry(0.2, 0.32, 2.2, 7),
      getMaterial('wood_plank', 1, 2, 0xffffff, 0.9, 0.02),
      this.pineTrunks,
      shadows,
      shadows
    );
    this.emitInstanced(
      group,
      null,
      new THREE.ConeGeometry(1, 1, 8),
      new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0.02 }),
      this.pineCones,
      shadows,
      false
    );
    this.emitInstanced(
      group,
      null,
      new THREE.ConeGeometry(1, 1, 8),
      new THREE.MeshStandardMaterial({ roughness: 0.88, metalness: 0.02 }),
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
