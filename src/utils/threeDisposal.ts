import * as THREE from 'three';

/**
 * Recursively disposes geometries and materials on a dynamic Three.js subtree,
 * optionally skipping shared/cached geometries or materials.
 */
export function disposeObjectSubtree(
  root: THREE.Object3D,
  skipGeometries?: Set<THREE.BufferGeometry>,
  skipMaterials?: Set<THREE.Material>
): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.geometry && (!skipGeometries || !skipGeometries.has(mesh.geometry))) {
      mesh.geometry.dispose();
    }
    const mat = (obj as { material?: THREE.Material | THREE.Material[] }).material;
    if (Array.isArray(mat)) {
      for (const m of mat) {
        if (!skipMaterials || !skipMaterials.has(m)) {
          m.dispose();
        }
      }
    } else if (mat && (!skipMaterials || !skipMaterials.has(mat))) {
      mat.dispose();
    }
  });
}
