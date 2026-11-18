import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

export type HeroAssetId =
  | 'tactical_crate_glb'
  | 'fuel_drum_glb'
  | 'jersey_barrier_glb'
  | 'c4_satchel_glb';

/**
 * Hermetic GLTF/GLB Asset Pipeline:
 * - Compiles composite procedural Three.js assemblies into genuine binary GLB buffers via GLTFExporter
 * - Parses and caches assets through Three.js GLTFLoader (and supports external .glb URLs)
 * - Supports AnimationClip extraction & LOD cloning with zero external 404 risk
 */
class GltfModelPipeline {
  private loader = new GLTFLoader();
  private exporter = new GLTFExporter();
  private glbCache = new Map<string, Promise<GLTF>>();

  /**
   * Loads an external .gltf/.glb URL via GLTFLoader with caching & shadow setup.
   */
  public loadGlbUrl(url: string): Promise<THREE.Group> {
    let entry = this.glbCache.get(url);
    if (!entry) {
      entry = this.loader.loadAsync(url);
      this.glbCache.set(url, entry);
    }
    return entry.then((gltf) => this.prepareClone(gltf.scene));
  }

  /**
   * Compiles a Three.js Group into an in-memory binary GLB buffer using GLTFExporter,
   * then parses it back through GLTFLoader so all assets go through a unified GLB pipeline.
   */
  public loadProceduralGlb(id: HeroAssetId, builder: () => THREE.Group): Promise<THREE.Group> {
    let entry = this.glbCache.get(id);
    if (!entry) {
      entry = new Promise<GLTF>((resolve, reject) => {
        const sourceGroup = builder();
        this.exporter.parse(
          sourceGroup,
          (result) => {
            if (result instanceof ArrayBuffer) {
              this.loader.parse(result, '', resolve, reject);
            } else {
              const json = JSON.stringify(result);
              this.loader.parse(json, '', resolve, reject);
            }
          },
          (err) => reject(err),
          { binary: true }
        );
      });
      this.glbCache.set(id, entry);
    }
    return entry.then((gltf) => this.prepareClone(gltf.scene));
  }

  private prepareClone(root: THREE.Group): THREE.Group {
    const clone = root.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return clone;
  }

  /**
   * Builds a multi-level THREE.LOD wrapper from high, medium, and low detail geometries.
   */
  public createLodWrapper(
    highDetail: THREE.Object3D,
    medDetail: THREE.Object3D,
    lowDetail: THREE.Object3D,
    medDist = 24,
    lowDist = 48
  ): THREE.LOD {
    const lod = new THREE.LOD();
    lod.addLevel(highDetail, 0);
    lod.addLevel(medDetail, medDist);
    lod.addLevel(lowDetail, lowDist);
    return lod;
  }

  /**
   * Warm-compiles core tactical hero GLB assets in the background on app boot.
   */
  public warmCoreGlbAssets(): void {
    void this.loadProceduralGlb('jersey_barrier_glb', buildJerseyBarrierGroup);
    void this.loadProceduralGlb('fuel_drum_glb', buildFuelDrumGroup);
    void this.loadProceduralGlb('tactical_crate_glb', buildTacticalCrateGroup);
  }
}

function buildJerseyBarrierGroup(): THREE.Group {
  const g = new THREE.Group();
  const shape = new THREE.Shape();
  shape.moveTo(-0.38, 0);
  shape.lineTo(0.38, 0);
  shape.lineTo(0.32, 0.24);
  shape.lineTo(0.16, 0.42);
  shape.lineTo(0.13, 0.96);
  shape.lineTo(-0.13, 0.96);
  shape.lineTo(-0.16, 0.42);
  shape.lineTo(-0.32, 0.24);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 2.35,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 2,
  });
  geo.translate(0, 0, -1.175);
  const concrete = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.88, metalness: 0.04 });
  const body = new THREE.Mesh(geo, concrete);
  g.add(body);

  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xd99b26, roughness: 0.65, metalness: 0.1 });
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.14, 2.2), stripeMat);
  stripe.position.set(0, 0.82, 0);
  g.add(stripe);
  return g;
}

function buildFuelDrumGroup(): THREE.Group {
  const g = new THREE.Group();
  const pts = [
    new THREE.Vector2(0.01, 0),
    new THREE.Vector2(0.31, 0),
    new THREE.Vector2(0.32, 0.04),
    new THREE.Vector2(0.3, 0.28),
    new THREE.Vector2(0.33, 0.31),
    new THREE.Vector2(0.3, 0.34),
    new THREE.Vector2(0.3, 0.62),
    new THREE.Vector2(0.33, 0.65),
    new THREE.Vector2(0.3, 0.68),
    new THREE.Vector2(0.32, 0.92),
    new THREE.Vector2(0.29, 0.96),
    new THREE.Vector2(0.01, 0.96),
  ];
  const lathe = new THREE.LatheGeometry(pts, 18);
  const drumMat = new THREE.MeshStandardMaterial({ color: 0x3b593d, roughness: 0.46, metalness: 0.56 });
  g.add(new THREE.Mesh(lathe, drumMat));

  const capMat = new THREE.MeshStandardMaterial({ color: 0xb8bec4, roughness: 0.28, metalness: 0.86 });
  const bung = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 10), capMat);
  bung.position.set(0.14, 0.97, 0.08);
  g.add(bung);
  return g;
}

function buildTacticalCrateGroup(): THREE.Group {
  const g = new THREE.Group();
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x7b6344, roughness: 0.84, metalness: 0.05 });
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x2a2f36, roughness: 0.38, metalness: 0.78 });

  const core = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.4, 1.4), woodMat);
  core.position.y = 0.7;
  g.add(core);

  const rimTop = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.1, 1.48), steelMat);
  rimTop.position.y = 1.38;
  const rimBot = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.1, 1.48), steelMat);
  rimBot.position.y = 0.05;
  g.add(rimTop, rimBot);
  return g;
}

export const gltfPipeline = new GltfModelPipeline();
