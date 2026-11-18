import * as THREE from 'three';
import { textures } from './ProceduralTextures';
import { Team, WeaponId } from './types';

export interface WeaponViewMeta {
  muzzleZ: number;
  muzzleY: number;
  ejectPos: [number, number, number];
  rightHandPos: [number, number, number];
  rightHandRot: [number, number, number];
  leftHandPos: [number, number, number];
  leftHandRot: [number, number, number];
  pivotPos: [number, number, number];
  pivotRot: [number, number, number];
}

// PBR textured surface sets for realistic-stylized firearms
const gunmetalTex = textures.getWeaponSurfacePair('gunmetal');
const chromeTex = textures.getWeaponSurfacePair('chrome');
const polymerTex = textures.getWeaponSurfacePair('polymer');
const walnutTex = textures.getWeaponSurfacePair('walnut');
const carbonTex = textures.getWeaponSurfacePair('carbon');

const gunmetalMat = new THREE.MeshStandardMaterial({
  color: 0x353c45,
  map: gunmetalTex.map,
  normalMap: gunmetalTex.normalMap,
  normalScale: new THREE.Vector2(0.45, 0.45),
  roughnessMap: gunmetalTex.roughnessMap,
  roughness: 0.36,
  metalness: 0.86,
});

const darkSteelMat = new THREE.MeshStandardMaterial({
  color: 0x1e2329,
  map: gunmetalTex.map,
  normalMap: gunmetalTex.normalMap,
  normalScale: new THREE.Vector2(0.42, 0.42),
  roughnessMap: gunmetalTex.roughnessMap,
  roughness: 0.42,
  metalness: 0.82,
});

const chromeSteelMat = new THREE.MeshStandardMaterial({
  color: 0xd0d7df,
  map: chromeTex.map,
  normalMap: chromeTex.normalMap,
  normalScale: new THREE.Vector2(0.28, 0.28),
  roughnessMap: chromeTex.roughnessMap,
  roughness: 0.2,
  metalness: 0.94,
});

const polymerMat = new THREE.MeshStandardMaterial({
  color: 0x24292f,
  map: polymerTex.map,
  normalMap: polymerTex.normalMap,
  normalScale: new THREE.Vector2(0.55, 0.55),
  roughnessMap: polymerTex.roughnessMap,
  roughness: 0.7,
  metalness: 0.14,
});

const rubberGripMat = new THREE.MeshStandardMaterial({
  color: 0x17191d,
  map: polymerTex.map,
  normalMap: polymerTex.normalMap,
  normalScale: new THREE.Vector2(0.7, 0.7),
  roughnessMap: polymerTex.roughnessMap,
  roughness: 0.88,
  metalness: 0.06,
});

const tanPolymerMat = new THREE.MeshStandardMaterial({
  color: 0xa68e66,
  map: polymerTex.map,
  normalMap: polymerTex.normalMap,
  normalScale: new THREE.Vector2(0.5, 0.5),
  roughness: 0.66,
  metalness: 0.12,
});

const olivePolymerMat = new THREE.MeshStandardMaterial({
  color: 0x45583d,
  map: polymerTex.map,
  normalMap: polymerTex.normalMap,
  normalScale: new THREE.Vector2(0.5, 0.5),
  roughness: 0.66,
  metalness: 0.14,
});

const walnutWoodMat = new THREE.MeshStandardMaterial({
  color: 0x864922,
  map: walnutTex.map,
  normalMap: walnutTex.normalMap,
  normalScale: new THREE.Vector2(0.6, 0.6),
  roughnessMap: walnutTex.roughnessMap,
  roughness: 0.54,
  metalness: 0.06,
});

const cherryWoodMat = new THREE.MeshStandardMaterial({
  color: 0x9c4c20,
  map: walnutTex.map,
  normalMap: walnutTex.normalMap,
  normalScale: new THREE.Vector2(0.58, 0.58),
  roughnessMap: walnutTex.roughnessMap,
  roughness: 0.46,
  metalness: 0.08,
});

const carbonMat = new THREE.MeshStandardMaterial({
  color: 0x2a2f36,
  map: carbonTex.map,
  normalMap: carbonTex.normalMap,
  normalScale: new THREE.Vector2(0.65, 0.65),
  roughnessMap: carbonTex.roughnessMap,
  roughness: 0.38,
  metalness: 0.36,
});

const lensMat = new THREE.MeshPhysicalMaterial({
  color: 0x1e6490,
  roughness: 0.06,
  metalness: 0.22,
  clearcoat: 1.0,
  clearcoatRoughness: 0.05,
  iridescence: 0.45,
  iridescenceIOR: 1.35,
});

const reticleGlowMat = new THREE.MeshStandardMaterial({
  color: 0x62f29b,
  emissive: 0x2ecc71,
  emissiveIntensity: 1.15,
  roughness: 0.2,
});

const brassMat = new THREE.MeshStandardMaterial({
  color: 0xd4a93d,
  map: chromeTex.map,
  roughness: 0.26,
  metalness: 0.92,
});

const heGreenMat = new THREE.MeshStandardMaterial({
  color: 0x3b5434,
  map: polymerTex.map,
  normalMap: polymerTex.normalMap,
  roughness: 0.56,
  metalness: 0.3,
});

const flashSteelMat = new THREE.MeshStandardMaterial({
  color: 0x56677a,
  map: gunmetalTex.map,
  normalMap: gunmetalTex.normalMap,
  roughness: 0.36,
  metalness: 0.74,
});

const c4BrickMat = new THREE.MeshStandardMaterial({
  color: 0x7a725c,
  map: polymerTex.map,
  normalMap: polymerTex.normalMap,
  roughness: 0.8,
  metalness: 0.08,
});

const c4LedMat = new THREE.MeshStandardMaterial({
  color: 0xff3232,
  emissive: 0xff1e1e,
  emissiveIntensity: 1.8,
  roughness: 0.2,
});

export const SHARED_WEAPON_MATERIALS = new Set<THREE.Material>([
  gunmetalMat,
  darkSteelMat,
  chromeSteelMat,
  polymerMat,
  rubberGripMat,
  tanPolymerMat,
  olivePolymerMat,
  walnutWoodMat,
  cherryWoodMat,
  carbonMat,
  lensMat,
  reticleGlowMat,
  brassMat,
  heGreenMat,
  flashSteelMat,
  c4BrickMat,
  c4LedMat,
]);

function box(
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  rx = 0,
  ry = 0,
  rz = 0
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  return m;
}

function cyl(
  rt: number,
  rb: number,
  len: number,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  rx = Math.PI / 2,
  ry = 0,
  rz = 0,
  segs = 16
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, len, segs), mat);
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rz);
  m.castShadow = true;
  return m;
}

function extrudeProfile(
  pts: [number, number][],
  thickness: number,
  mat: THREE.Material,
  bevel = 0.004
): THREE.Mesh {
  const shape = new THREE.Shape();
  shape.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) {
    shape.lineTo(pts[i][0], pts[i][1]);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
  });
  geo.center();
  // Rotate so 2D X maps to -Z (forward along weapon) and 2D Y maps to +Y
  geo.rotateY(Math.PI / 2);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  return mesh;
}

function addPicatinnyRail(group: THREE.Group, y: number, zStart: number, zEnd: number, width = 0.024): void {
  const len = Math.abs(zEnd - zStart);
  const zMid = (zStart + zEnd) / 2;
  group.add(box(width, 0.008, len, darkSteelMat, 0, y, zMid));
  const notches = Math.max(3, Math.floor(len / 0.02));
  for (let i = 0; i < notches; i++) {
    const nz = zStart + (zEnd - zStart) * ((i + 0.5) / notches);
    group.add(box(width + 0.004, 0.005, 0.011, gunmetalMat, 0, y + 0.005, nz));
  }
}

function addSuppressor(group: THREE.Group, y: number, zCenter: number, radius: number, length: number): void {
  const half = length / 2;
  const pts = [
    new THREE.Vector2(0.001, -half),
    new THREE.Vector2(radius * 0.92, -half),
    new THREE.Vector2(radius, -half + 0.012),
    new THREE.Vector2(radius, half - 0.025),
    new THREE.Vector2(radius * 1.08, half - 0.016),
    new THREE.Vector2(radius * 1.08, half),
    new THREE.Vector2(0.001, half),
  ];
  const geo = new THREE.LatheGeometry(pts, 18);
  geo.rotateX(Math.PI / 2);
  const mesh = new THREE.Mesh(geo, darkSteelMat);
  mesh.name = 'suppressor';
  mesh.position.set(0, y, zCenter);
  mesh.castShadow = true;
  group.add(mesh);

  // Subtle knurled grip collar rings
  const ring = cyl(radius * 1.05, radius * 1.05, 0.024, gunmetalMat, 0, y, zCenter + half - 0.022, Math.PI / 2, 0, 0, 18);
  group.add(ring);
}

function addFlashHider(group: THREE.Group, y: number, z: number, radius = 0.013, len = 0.044): void {
  const pts = [
    new THREE.Vector2(radius * 0.72, -len * 0.5),
    new THREE.Vector2(radius, -len * 0.35),
    new THREE.Vector2(radius, len * 0.25),
    new THREE.Vector2(radius * 0.82, len * 0.5),
  ];
  const geo = new THREE.LatheGeometry(pts, 14);
  geo.rotateX(Math.PI / 2);
  const m = new THREE.Mesh(geo, darkSteelMat);
  m.position.set(0, y, z);
  m.castShadow = true;
  group.add(m);
  // Darkened muzzle bore tip
  group.add(cyl(radius * 0.56, radius * 0.56, 0.006, rubberGripMat, 0, y, z - len * 0.48, Math.PI / 2, 0, 0, 12));
}

function addScope(group: THREE.Group, y: number, zCenter: number, length = 0.25, radius = 0.018): void {
  group.add(box(0.028, 0.03, 0.022, darkSteelMat, 0, y - 0.022, zCenter - length * 0.22));
  group.add(box(0.028, 0.03, 0.022, darkSteelMat, 0, y - 0.022, zCenter + length * 0.22));
  const half = length / 2;
  const pts = [
    new THREE.Vector2(0.001, -half),
    new THREE.Vector2(radius * 1.2, -half),
    new THREE.Vector2(radius * 1.2, -half + 0.052),
    new THREE.Vector2(radius * 0.85, -half + 0.075),
    new THREE.Vector2(radius * 0.85, half - 0.062),
    new THREE.Vector2(radius * 1.08, half - 0.04),
    new THREE.Vector2(radius * 1.08, half),
    new THREE.Vector2(0.001, half),
  ];
  const scopeGeo = new THREE.LatheGeometry(pts, 18);
  scopeGeo.rotateX(Math.PI / 2);
  const scopeMesh = new THREE.Mesh(scopeGeo, darkSteelMat);
  scopeMesh.position.set(0, y, zCenter);
  scopeMesh.castShadow = true;
  group.add(scopeMesh);

  // Windage / elevation turrets
  group.add(cyl(0.009, 0.009, 0.018, gunmetalMat, 0, y + radius * 1.1, zCenter, 0, 0, 0, 12));
  group.add(cyl(0.009, 0.009, 0.018, gunmetalMat, radius * 1.1, y, zCenter, 0, 0, Math.PI / 2, 12));

  // Coated optical objective & ocular lenses
  group.add(cyl(radius * 1.04, radius * 1.04, 0.008, lensMat, 0, y, zCenter - half - 0.002));
  group.add(cyl(radius * 0.92, radius * 0.92, 0.008, lensMat, 0, y, zCenter + half + 0.002));
}

function addTriggerAssembly(group: THREE.Group, y: number, z: number): void {
  group.add(box(0.012, 0.005, 0.052, darkSteelMat, 0, y - 0.024, z));
  group.add(box(0.012, 0.024, 0.006, darkSteelMat, 0, y - 0.012, z - 0.024));
  const trig = box(0.007, 0.018, 0.007, chromeSteelMat, 0, y - 0.008, z, -0.35, 0, 0);
  trig.name = 'trigger';
  group.add(trig);
}

/**
 * Returns weapon-specific muzzle tip, brass ejection port, first-person pivot,
 * and right/left hand anchor coordinates so sculpted hands remain planted accurately.
 */
export function getWeaponViewMeta(weaponId: WeaponId, silenced = false): WeaponViewMeta {
  switch (weaponId) {
    case 'knife':
      return {
        muzzleZ: -0.26,
        muzzleY: 0.002,
        ejectPos: [0, 0, 0],
        rightHandPos: [0.006, -0.014, 0.065],
        rightHandRot: [0.22, -0.1, -0.42],
        leftHandPos: [-0.22, -0.18, 0.25], // Support arm retracted out of knife close-up frame
        leftHandRot: [0.3, 0.2, 0.4],
        pivotPos: [0.2, -0.21, -0.32],
        pivotRot: [0.14, 0.22, -0.18],
      };
    case 'hegrenade':
    case 'flashbang':
    case 'smokegrenade':
      return {
        muzzleZ: -0.1,
        muzzleY: 0.0,
        ejectPos: [0, 0, 0],
        rightHandPos: [0.008, -0.024, 0.024],
        rightHandRot: [0.18, -0.12, -0.4],
        leftHandPos: [-0.24, -0.18, 0.24],
        leftHandRot: [0.35, 0.2, 0.4],
        pivotPos: [0.2, -0.22, -0.31],
        pivotRot: [0.08, 0.14, 0],
      };
    case 'c4':
      return {
        muzzleZ: -0.12,
        muzzleY: 0.02,
        ejectPos: [0, 0, 0],
        rightHandPos: [0.055, -0.022, 0.02],
        rightHandRot: [0.1, -0.16, -0.32],
        leftHandPos: [-0.065, -0.022, 0.015],
        leftHandRot: [0.1, 0.16, 0.32],
        pivotPos: [0.08, -0.22, -0.32],
        pivotRot: [0.18, 0.04, 0],
      };
    case 'glock18':
    case 'usp':
    case 'p228':
    case 'fiveseven':
      return {
        muzzleZ: silenced && weaponId === 'usp' ? -0.34 : -0.18,
        muzzleY: 0.024,
        ejectPos: [0.022, 0.036, -0.015],
        rightHandPos: [0.008, -0.056, 0.062],
        rightHandRot: [0.2, -0.08, -0.42],
        leftHandPos: [-0.012, -0.062, 0.05], // Cupped support grip around pistol frame
        leftHandRot: [0.22, 0.28, 0.52],
        pivotPos: [0.19, -0.19, -0.33],
        pivotRot: [0.025, 0.06, 0.02],
      };
    case 'deagle':
      return {
        muzzleZ: -0.22,
        muzzleY: 0.028,
        ejectPos: [0.024, 0.036, -0.02],
        rightHandPos: [0.008, -0.06, 0.065],
        rightHandRot: [0.2, -0.08, -0.44],
        leftHandPos: [-0.012, -0.064, 0.054],
        leftHandRot: [0.22, 0.26, 0.52],
        pivotPos: [0.19, -0.19, -0.33],
        pivotRot: [0.025, 0.06, 0.02],
      };
    case 'elite':
      return {
        muzzleZ: -0.2,
        muzzleY: 0.024,
        ejectPos: [0.095, 0.034, -0.02],
        rightHandPos: [0.084, -0.056, 0.056],
        rightHandRot: [0.18, -0.08, -0.4],
        leftHandPos: [-0.084, -0.056, 0.056],
        leftHandRot: [0.18, 0.08, 0.4],
        pivotPos: [0.0, -0.19, -0.34],
        pivotRot: [0.02, 0.0, 0],
      };
    case 'm3':
    case 'xm1014':
      return {
        muzzleZ: -0.62,
        muzzleY: 0.032,
        ejectPos: [0.028, 0.025, 0.02],
        rightHandPos: [0.01, -0.054, 0.125],
        rightHandRot: [0.22, -0.08, -0.42],
        leftHandPos: [-0.014, -0.018, -0.25], // Hand on pump / forend
        leftHandRot: [-0.14, 0.2, 0.58],
        pivotPos: [0.2, -0.195, -0.32],
        pivotRot: [0.025, 0.06, 0.02],
      };
    case 'mp5':
    case 'ump45':
      return {
        muzzleZ: -0.39,
        muzzleY: 0.022,
        ejectPos: [0.026, 0.026, 0.0],
        rightHandPos: [0.01, -0.054, 0.075],
        rightHandRot: [0.2, -0.08, -0.44],
        leftHandPos: [-0.012, -0.01, -0.19],
        leftHandRot: [-0.12, 0.22, 0.55],
        pivotPos: [0.2, -0.195, -0.32],
        pivotRot: [0.025, 0.06, 0.02],
      };
    case 'tmp':
    case 'mac10':
      return {
        muzzleZ: -0.34,
        muzzleY: 0.022,
        ejectPos: [0.025, 0.026, 0.0],
        rightHandPos: [0.01, -0.056, 0.032],
        rightHandRot: [0.18, -0.08, -0.42],
        leftHandPos: [-0.012, -0.044, -0.095],
        leftHandRot: [0.05, 0.22, 0.52],
        pivotPos: [0.2, -0.195, -0.32],
        pivotRot: [0.025, 0.06, 0.02],
      };
    case 'p90':
      return {
        muzzleZ: -0.29,
        muzzleY: 0.02,
        ejectPos: [0.02, -0.03, 0.06],
        rightHandPos: [0.01, -0.038, 0.04],
        rightHandRot: [0.18, -0.08, -0.44],
        leftHandPos: [-0.014, -0.026, -0.1],
        leftHandRot: [-0.08, 0.22, 0.55],
        pivotPos: [0.2, -0.195, -0.32],
        pivotRot: [0.025, 0.06, 0.02],
      };
    case 'famas':
    case 'aug':
      return {
        muzzleZ: -0.45,
        muzzleY: 0.024,
        ejectPos: [0.026, 0.022, 0.14],
        rightHandPos: [0.01, -0.056, -0.05],
        rightHandRot: [0.2, -0.08, -0.44],
        leftHandPos: [-0.014, -0.015, -0.175],
        leftHandRot: [-0.12, 0.2, 0.55],
        pivotPos: [0.2, -0.195, -0.32],
        pivotRot: [0.025, 0.06, 0.02],
      };
    case 'scout':
    case 'awp':
      return {
        muzzleZ: weaponId === 'awp' ? -0.82 : -0.77,
        muzzleY: 0.038,
        ejectPos: [0.026, 0.04, 0.01],
        rightHandPos: [0.01, -0.056, 0.14],
        rightHandRot: [0.2, -0.08, -0.42],
        leftHandPos: [-0.014, -0.012, -0.14],
        leftHandRot: [-0.1, 0.22, 0.56],
        pivotPos: [0.2, -0.195, -0.31],
        pivotRot: [0.025, 0.06, 0.02],
      };
    case 'm249':
      return {
        muzzleZ: -0.63,
        muzzleY: 0.034,
        ejectPos: [0.035, 0.032, -0.01],
        rightHandPos: [0.01, -0.056, 0.11],
        rightHandRot: [0.2, -0.08, -0.44],
        leftHandPos: [-0.016, -0.014, -0.24],
        leftHandRot: [-0.14, 0.2, 0.56],
        pivotPos: [0.2, -0.198, -0.32],
        pivotRot: [0.025, 0.06, 0.02],
      };
    case 'ak47':
    case 'm4a1':
    case 'galil':
    case 'sg552':
    case 'g3sg1':
    case 'sg550':
    default:
      return {
        muzzleZ: weaponId === 'm4a1' && silenced ? -0.69 : weaponId === 'g3sg1' || weaponId === 'sg550' ? -0.63 : -0.61,
        muzzleY: 0.025,
        ejectPos: [0.026, 0.028, -0.01],
        rightHandPos: [0.01, -0.056, 0.105],
        rightHandRot: [0.2, -0.08, -0.44],
        leftHandPos: [-0.014, -0.008, -0.22],
        leftHandRot: [-0.12, 0.22, 0.55],
        pivotPos: [0.2, -0.195, -0.32],
        pivotRot: [0.025, 0.06, 0.02],
      };
  }
}

/**
 * Builds a high-detail stylized 3D weapon model pointing along -Z
 * with named sub-parts ('magazine', 'slide', 'bolt', 'charging_handle', 'suppressor')
 * for physically accurate first-person reload, firing, and inspection animations.
 */
export function buildWeaponModel(weaponId: WeaponId, silenced = false): THREE.Group {
  const g = new THREE.Group();
  g.name = `weapon_${weaponId}`;

  switch (weaponId) {
    case 'knife': {
      // Sculpted tactical bayonet / combat knife with ribbed grip & fuller blade
      const grip = cyl(0.016, 0.018, 0.138, rubberGripMat, 0, -0.008, 0.055);
      grip.scale.set(0.85, 1, 1.15);
      g.add(grip);
      for (let z = 0.015; z <= 0.095; z += 0.02) {
        g.add(cyl(0.0175, 0.0175, 0.007, darkSteelMat, 0, -0.008, z));
      }
      g.add(cyl(0.02, 0.018, 0.02, darkSteelMat, 0, -0.008, 0.126));
      g.add(box(0.046, 0.054, 0.014, darkSteelMat, 0, -0.004, -0.015));

      const blade = extrudeProfile(
        [
          [0, -0.015],
          [0.185, -0.013],
          [0.245, 0.004],
          [0.195, 0.017],
          [0.08, 0.016],
          [0, 0.017],
        ],
        0.005,
        chromeSteelMat,
        0.002
      );
      blade.position.set(0, 0.002, -0.14);
      g.add(blade);
      g.add(box(0.0075, 0.006, 0.125, gunmetalMat, 0, 0.008, -0.1));
      break;
    }

    case 'glock18': {
      g.add(box(0.031, 0.022, 0.198, polymerMat, 0, -0.002, -0.025));
      addPicatinnyRail(g, -0.014, -0.11, -0.045, 0.02);
      const grip = extrudeProfile(
        [
          [-0.022, 0],
          [0.022, 0],
          [0.036, -0.105],
          [-0.008, -0.105],
        ],
        0.026,
        rubberGripMat,
        0.003
      );
      grip.position.set(0, -0.058, 0.044);
      g.add(grip);
      addTriggerAssembly(g, -0.01, 0.002);

      const slide = new THREE.Group();
      slide.name = 'slide';
      slide.add(box(0.032, 0.036, 0.215, darkSteelMat, 0, 0.026, -0.032));
      slide.add(box(0.022, 0.012, 0.055, chromeSteelMat, 0, 0.034, -0.015));
      // Slide rear serrations
      for (let sz = 0.022; sz <= 0.062; sz += 0.01) {
        slide.add(box(0.034, 0.024, 0.004, gunmetalMat, 0, 0.025, sz));
      }
      slide.add(box(0.008, 0.01, 0.01, reticleGlowMat, 0, 0.048, -0.126));
      slide.add(box(0.022, 0.01, 0.01, darkSteelMat, 0, 0.048, 0.062));
      g.add(slide);

      g.add(cyl(0.0075, 0.0075, 0.045, chromeSteelMat, 0, 0.022, -0.142));

      const mag = new THREE.Group();
      mag.name = 'magazine';
      mag.add(box(0.02, 0.1, 0.032, darkSteelMat, 0, -0.062, 0.044, 0.22, 0, 0));
      mag.add(box(0.026, 0.012, 0.038, polymerMat, 0, -0.112, 0.054, 0.22, 0, 0));
      g.add(mag);
      break;
    }

    case 'usp': {
      g.add(box(0.031, 0.024, 0.205, polymerMat, 0, -0.002, -0.025));
      const grip = extrudeProfile(
        [
          [-0.022, 0],
          [0.022, 0],
          [0.034, -0.108],
          [-0.01, -0.108],
        ],
        0.027,
        rubberGripMat,
        0.003
      );
      grip.position.set(0, -0.06, 0.044);
      g.add(grip);
      addTriggerAssembly(g, -0.01, 0.004);

      const slide = new THREE.Group();
      slide.name = 'slide';
      slide.add(box(0.033, 0.038, 0.225, gunmetalMat, 0, 0.027, -0.034));
      slide.add(box(0.022, 0.012, 0.055, chromeSteelMat, 0, 0.036, -0.015));
      for (let sz = 0.026; sz <= 0.066; sz += 0.01) {
        slide.add(box(0.035, 0.025, 0.004, darkSteelMat, 0, 0.026, sz));
      }
      slide.add(box(0.008, 0.011, 0.01, reticleGlowMat, 0, 0.05, -0.132));
      slide.add(box(0.022, 0.011, 0.01, darkSteelMat, 0, 0.05, 0.065));
      g.add(slide);

      g.add(cyl(0.008, 0.008, 0.04, chromeSteelMat, 0, 0.023, -0.15));
      if (silenced) {
        addSuppressor(g, 0.023, -0.245, 0.018, 0.185);
      }

      const mag = new THREE.Group();
      mag.name = 'magazine';
      mag.add(box(0.02, 0.1, 0.032, darkSteelMat, 0, -0.062, 0.045, 0.2, 0, 0));
      mag.add(box(0.026, 0.012, 0.038, polymerMat, 0, -0.112, 0.054, 0.2, 0, 0));
      g.add(mag);
      break;
    }

    case 'deagle': {
      g.add(box(0.036, 0.026, 0.255, chromeSteelMat, 0, -0.003, -0.045));
      const grip = extrudeProfile(
        [
          [-0.025, 0],
          [0.025, 0],
          [0.04, -0.115],
          [-0.01, -0.115],
        ],
        0.031,
        rubberGripMat,
        0.004
      );
      grip.position.set(0, -0.064, 0.048);
      g.add(grip);
      addTriggerAssembly(g, -0.012, 0.004);

      g.add(box(0.034, 0.046, 0.135, chromeSteelMat, 0, 0.028, -0.12));
      addPicatinnyRail(g, 0.054, -0.16, -0.06, 0.022);
      g.add(cyl(0.011, 0.011, 0.042, darkSteelMat, 0, 0.028, -0.195));
      g.add(box(0.01, 0.012, 0.012, reticleGlowMat, 0, 0.054, -0.175));

      const slide = new THREE.Group();
      slide.name = 'slide';
      slide.add(box(0.036, 0.044, 0.15, chromeSteelMat, 0, 0.028, 0.015));
      slide.add(box(0.024, 0.014, 0.048, darkSteelMat, 0, 0.036, -0.02));
      slide.add(box(0.022, 0.012, 0.012, darkSteelMat, 0, 0.054, 0.075));
      g.add(slide);

      const mag = new THREE.Group();
      mag.name = 'magazine';
      mag.add(box(0.022, 0.105, 0.036, chromeSteelMat, 0, -0.066, 0.05, 0.22, 0, 0));
      mag.add(box(0.028, 0.014, 0.042, darkSteelMat, 0, -0.118, 0.062, 0.22, 0, 0));
      g.add(mag);
      break;
    }

    case 'p228':
    case 'fiveseven': {
      const slideMat = weaponId === 'fiveseven' ? polymerMat : gunmetalMat;
      g.add(box(0.03, 0.023, 0.2, darkSteelMat, 0, -0.002, -0.025));
      const grip = extrudeProfile(
        [
          [-0.02, 0],
          [0.02, 0],
          [0.034, -0.104],
          [-0.008, -0.104],
        ],
        0.026,
        rubberGripMat,
        0.003
      );
      grip.position.set(0, -0.058, 0.046);
      g.add(grip);
      addTriggerAssembly(g, -0.01, 0.004);
      const slide = new THREE.Group();
      slide.name = 'slide';
      slide.add(box(0.032, 0.036, 0.212, slideMat, 0, 0.025, -0.03));
      slide.add(box(0.022, 0.011, 0.045, chromeSteelMat, 0, 0.034, -0.018));
      slide.add(box(0.008, 0.01, 0.01, reticleGlowMat, 0, 0.046, -0.125));
      g.add(slide);
      g.add(cyl(0.0075, 0.0075, 0.038, chromeSteelMat, 0, 0.024, -0.14));
      const mag = new THREE.Group();
      mag.name = 'magazine';
      mag.add(box(0.02, 0.098, 0.032, darkSteelMat, 0, -0.06, 0.046, 0.22, 0, 0));
      g.add(mag);
      break;
    }

    case 'elite': {
      [-0.08, 0.08].forEach((offsetX) => {
        g.add(box(0.029, 0.02, 0.195, darkSteelMat, offsetX, -0.002, -0.03));
        g.add(box(0.026, 0.105, 0.04, rubberGripMat, offsetX, -0.058, 0.04, 0.22, 0, 0));
        g.add(box(0.031, 0.034, 0.225, gunmetalMat, offsetX, 0.025, -0.04));
        g.add(box(0.02, 0.012, 0.05, chromeSteelMat, offsetX, 0.034, -0.02));
        g.add(cyl(0.0075, 0.0075, 0.055, chromeSteelMat, offsetX, 0.024, -0.158));
      });
      break;
    }

    case 'm3':
    case 'xm1014': {
      const isAuto = weaponId === 'xm1014';
      g.add(box(0.046, 0.062, 0.29, darkSteelMat, 0, 0.014, 0.02));
      addPicatinnyRail(g, 0.048, -0.1, 0.12, 0.024);
      const stock = extrudeProfile(
        [
          [-0.08, 0.02],
          [0.14, 0.018],
          [0.15, -0.06],
          [-0.08, -0.025],
        ],
        0.036,
        polymerMat,
        0.005
      );
      stock.position.set(0, -0.008, 0.24);
      g.add(stock);
      g.add(box(0.032, 0.09, 0.042, rubberGripMat, 0, -0.056, 0.12, 0.3, 0, 0));
      addTriggerAssembly(g, -0.018, 0.065);
      g.add(cyl(0.013, 0.013, 0.52, gunmetalMat, 0, 0.032, -0.35));
      g.add(cyl(0.012, 0.012, 0.45, darkSteelMat, 0, 0.004, -0.31));
      g.add(box(0.016, 0.022, 0.018, darkSteelMat, 0, 0.046, -0.58)); // Bead sight base
      g.add(box(0.006, 0.01, 0.008, reticleGlowMat, 0, 0.054, -0.58));
      const pump = new THREE.Group();
      pump.name = 'charging_handle';
      pump.add(cyl(0.021, 0.021, 0.19, isAuto ? tanPolymerMat : rubberGripMat, 0, -0.002, -0.26));
      for (let rz = -0.33; rz <= -0.19; rz += 0.025) {
        pump.add(cyl(0.0225, 0.0225, 0.008, darkSteelMat, 0, -0.002, rz));
      }
      g.add(pump);
      break;
    }

    case 'mp5': {
      g.add(box(0.042, 0.056, 0.29, darkSteelMat, 0, 0.02, -0.01));
      addPicatinnyRail(g, 0.051, -0.1, 0.09, 0.022);
      g.add(box(0.038, 0.048, 0.04, polymerMat, 0, 0.014, 0.15));
      g.add(box(0.008, 0.014, 0.22, gunmetalMat, -0.022, 0.018, 0.24));
      g.add(box(0.008, 0.014, 0.22, gunmetalMat, 0.022, 0.018, 0.24));
      g.add(box(0.038, 0.078, 0.032, rubberGripMat, 0, 0.004, 0.34));
      g.add(box(0.031, 0.096, 0.04, rubberGripMat, 0, -0.054, 0.065, 0.24, 0, 0));
      addTriggerAssembly(g, -0.014, 0.02);

      g.add(cyl(0.013, 0.013, 0.21, gunmetalMat, 0, 0.04, -0.21));
      const handle = box(0.026, 0.012, 0.014, chromeSteelMat, -0.018, 0.044, -0.26);
      handle.name = 'charging_handle';
      g.add(handle);
      g.add(cyl(0.011, 0.011, 0.24, darkSteelMat, 0, 0.02, -0.26));
      g.add(box(0.04, 0.044, 0.17, polymerMat, 0, 0.004, -0.2));
      g.add(cyl(0.013, 0.013, 0.014, darkSteelMat, 0, 0.052, -0.295, Math.PI / 2, 0, 0, 12));
      addFlashHider(g, 0.02, -0.38, 0.013, 0.032);

      const mag = new THREE.Group();
      mag.name = 'magazine';
      const magShape = extrudeProfile(
        [
          [0, 0.02],
          [0.034, 0.02],
          [0.056, -0.14],
          [0.022, -0.145],
        ],
        0.022,
        darkSteelMat,
        0.002
      );
      magShape.position.set(0, -0.08, -0.1);
      mag.add(magShape);
      g.add(mag);
      break;
    }

    case 'tmp': {
      g.add(box(0.038, 0.056, 0.23, olivePolymerMat, 0, 0.02, -0.02));
      addSuppressor(g, 0.022, -0.24, 0.017, 0.23);
      g.add(box(0.03, 0.115, 0.04, rubberGripMat, 0, -0.058, 0.03, 0.18, 0, 0));
      g.add(box(0.028, 0.075, 0.032, olivePolymerMat, 0, -0.04, -0.1));
      const mag = new THREE.Group();
      mag.name = 'magazine';
      mag.add(box(0.02, 0.12, 0.03, darkSteelMat, 0, -0.08, 0.032, 0.18, 0, 0));
      g.add(mag);
      break;
    }

    case 'mac10': {
      g.add(box(0.044, 0.068, 0.22, gunmetalMat, 0, 0.02, -0.02));
      g.add(cyl(0.012, 0.012, 0.12, darkSteelMat, 0, 0.022, -0.17));
      g.add(box(0.032, 0.105, 0.042, polymerMat, 0, -0.058, 0.02, 0.12, 0, 0));
      g.add(box(0.03, 0.01, 0.16, chromeSteelMat, 0, 0.035, 0.15));
      const mag = new THREE.Group();
      mag.name = 'magazine';
      mag.add(box(0.022, 0.15, 0.032, darkSteelMat, 0, -0.095, 0.02, 0.12, 0, 0));
      g.add(mag);
      break;
    }

    case 'ump45': {
      g.add(box(0.044, 0.064, 0.31, polymerMat, 0, 0.02, -0.02));
      addPicatinnyRail(g, 0.055, -0.14, 0.1, 0.024);
      g.add(box(0.032, 0.054, 0.22, polymerMat, 0, 0.012, 0.23));
      g.add(cyl(0.012, 0.012, 0.16, darkSteelMat, 0, 0.022, -0.23));
      addFlashHider(g, 0.022, -0.32, 0.013, 0.032);
      g.add(box(0.03, 0.095, 0.04, rubberGripMat, 0, -0.055, 0.08, 0.24, 0, 0));
      addTriggerAssembly(g, -0.016, 0.025);
      const mag = new THREE.Group();
      mag.name = 'magazine';
      mag.add(box(0.024, 0.17, 0.038, darkSteelMat, 0, -0.09, -0.09, 0.04, 0, 0));
      g.add(mag);
      break;
    }

    case 'p90': {
      const hull = extrudeProfile(
        [
          [-0.22, 0.048],
          [0.06, 0.052],
          [0.24, 0.044],
          [0.24, -0.045],
          [0.04, -0.038],
          [-0.08, -0.046],
          [-0.2, -0.025],
        ],
        0.046,
        polymerMat,
        0.005
      );
      hull.position.set(0, 0.006, 0.04);
      g.add(hull);
      const mag = new THREE.Group();
      mag.name = 'magazine';
      mag.add(box(0.04, 0.024, 0.26, tanPolymerMat, 0, 0.062, -0.02));
      g.add(mag);
      g.add(box(0.036, 0.042, 0.065, darkSteelMat, 0, 0.082, -0.14));
      g.add(cyl(0.012, 0.012, 0.012, lensMat, 0, 0.084, -0.16));
      g.add(box(0.006, 0.006, 0.006, reticleGlowMat, 0, 0.084, -0.14));
      g.add(cyl(0.011, 0.011, 0.11, darkSteelMat, 0, 0.02, -0.22));
      break;
    }

    case 'ak47': {
      g.add(box(0.043, 0.058, 0.31, gunmetalMat, 0, 0.016, 0.0));
      g.add(box(0.038, 0.024, 0.26, darkSteelMat, 0, 0.046, 0.01));
      const boltCarrier = box(0.02, 0.016, 0.085, chromeSteelMat, 0.022, 0.034, -0.02);
      boltCarrier.name = 'charging_handle';
      g.add(boltCarrier);

      const stock = extrudeProfile(
        [
          [-0.09, 0.02],
          [0.14, 0.004],
          [0.145, -0.078],
          [-0.09, -0.022],
        ],
        0.036,
        cherryWoodMat,
        0.005
      );
      stock.position.set(0, -0.008, 0.27);
      g.add(stock);
      g.add(box(0.038, 0.082, 0.014, darkSteelMat, 0, -0.03, 0.41));

      g.add(box(0.04, 0.046, 0.21, cherryWoodMat, 0, 0.012, -0.25));
      g.add(box(0.034, 0.018, 0.16, cherryWoodMat, 0, 0.042, -0.23));
      g.add(cyl(0.01, 0.01, 0.46, darkSteelMat, 0, 0.026, -0.37));
      g.add(cyl(0.009, 0.009, 0.23, gunmetalMat, 0, 0.046, -0.24));
      g.add(box(0.02, 0.032, 0.03, darkSteelMat, 0, 0.038, -0.36));
      addFlashHider(g, 0.026, -0.605, 0.013, 0.04);

      g.add(box(0.012, 0.03, 0.016, darkSteelMat, 0, 0.048, -0.55));
      g.add(box(0.02, 0.012, 0.038, darkSteelMat, 0, 0.06, -0.14));

      const grip = extrudeProfile(
        [
          [-0.018, 0],
          [0.02, 0],
          [0.042, -0.098],
          [0.004, -0.098],
        ],
        0.028,
        walnutWoodMat,
        0.003
      );
      grip.position.set(0, -0.056, 0.11);
      g.add(grip);
      addTriggerAssembly(g, -0.014, 0.065);

      const mag = new THREE.Group();
      mag.name = 'magazine';
      const magMesh = extrudeProfile(
        [
          [0, 0.02],
          [0.048, 0.02],
          [0.088, -0.16],
          [0.04, -0.175],
        ],
        0.025,
        darkSteelMat,
        0.003
      );
      magMesh.position.set(0, -0.088, -0.1);
      mag.add(magMesh);
      g.add(mag);
      break;
    }

    case 'm4a1': {
      g.add(box(0.042, 0.058, 0.29, darkSteelMat, 0, 0.018, 0.0));
      addPicatinnyRail(g, 0.049, -0.26, 0.12, 0.026);
      g.add(box(0.026, 0.026, 0.026, gunmetalMat, 0, 0.061, -0.052));
      g.add(box(0.026, 0.03, 0.032, gunmetalMat, 0, 0.063, 0.072));
      g.add(box(0.026, 0.012, 0.15, darkSteelMat, 0, 0.076, 0.01));
      g.add(cyl(0.012, 0.012, 0.02, gunmetalMat, 0, 0.068, 0.072, 0, 0, Math.PI / 2, 10));
      const chHandle = box(0.036, 0.012, 0.02, gunmetalMat, 0, 0.042, 0.135);
      chHandle.name = 'charging_handle';
      g.add(chHandle);

      g.add(cyl(0.016, 0.016, 0.22, gunmetalMat, 0, 0.024, 0.24));
      const stock = extrudeProfile(
        [
          [-0.08, 0.03],
          [0.12, 0.028],
          [0.12, -0.068],
          [-0.02, -0.042],
        ],
        0.038,
        polymerMat,
        0.005
      );
      stock.position.set(0, 0.004, 0.275);
      g.add(stock);

      g.add(cyl(0.027, 0.025, 0.022, gunmetalMat, 0, 0.02, -0.14));
      g.add(cyl(0.025, 0.025, 0.22, polymerMat, 0, 0.02, -0.25, Math.PI / 2, 0, 0, 12));
      for (let rz = -0.34; rz <= -0.17; rz += 0.022) {
        g.add(cyl(0.027, 0.027, 0.007, rubberGripMat, 0, 0.02, rz, Math.PI / 2, 0, 0, 12));
      }
      g.add(cyl(0.01, 0.01, 0.4, gunmetalMat, 0, 0.022, -0.35));
      g.add(box(0.014, 0.044, 0.018, darkSteelMat, 0, 0.046, -0.39, -0.18, 0, 0));
      g.add(box(0.014, 0.044, 0.014, darkSteelMat, 0, 0.046, -0.37));

      const grip = extrudeProfile(
        [
          [-0.018, 0],
          [0.018, 0],
          [0.038, -0.098],
          [0.002, -0.098],
        ],
        0.028,
        rubberGripMat,
        0.003
      );
      grip.position.set(0, -0.056, 0.1);
      g.add(grip);
      addTriggerAssembly(g, -0.014, 0.055);

      const mag = new THREE.Group();
      mag.name = 'magazine';
      mag.add(box(0.025, 0.145, 0.046, gunmetalMat, 0, -0.075, -0.08, -0.1, 0, 0));
      mag.add(box(0.029, 0.016, 0.05, polymerMat, 0, -0.145, -0.086, -0.1, 0, 0));
      g.add(mag);

      if (silenced) {
        addSuppressor(g, 0.022, -0.57, 0.019, 0.22);
      } else {
        addFlashHider(g, 0.022, -0.54, 0.013, 0.042);
      }
      break;
    }

    case 'galil': {
      g.add(box(0.042, 0.058, 0.3, darkSteelMat, 0, 0.018, 0.0));
      g.add(box(0.036, 0.018, 0.25, gunmetalMat, 0, 0.05, 0.0));
      const boltHandle = box(0.02, 0.014, 0.032, chromeSteelMat, 0.024, 0.036, -0.04);
      boltHandle.name = 'charging_handle';
      g.add(boltHandle);

      g.add(box(0.016, 0.012, 0.23, gunmetalMat, 0, 0.028, 0.25));
      g.add(box(0.016, 0.012, 0.23, gunmetalMat, 0, -0.014, 0.25));
      g.add(box(0.024, 0.068, 0.026, rubberGripMat, 0, 0.008, 0.36));

      g.add(box(0.042, 0.044, 0.22, walnutWoodMat, 0, 0.012, -0.25));
      g.add(cyl(0.01, 0.01, 0.41, darkSteelMat, 0, 0.024, -0.36));
      g.add(cyl(0.009, 0.009, 0.22, gunmetalMat, 0, 0.042, -0.24));
      g.add(box(0.024, 0.022, 0.02, darkSteelMat, 0, 0.064, 0.1));
      g.add(box(0.012, 0.026, 0.014, darkSteelMat, 0, 0.048, -0.49));
      addFlashHider(g, 0.024, -0.57, 0.012, 0.038);

      g.add(box(0.03, 0.096, 0.038, rubberGripMat, 0, -0.056, 0.1, 0.24, 0, 0));
      addTriggerAssembly(g, -0.014, 0.055);
      const mag = new THREE.Group();
      mag.name = 'magazine';
      mag.add(box(0.026, 0.165, 0.044, darkSteelMat, 0, -0.085, -0.08, -0.16, 0, 0));
      g.add(mag);
      break;
    }

    case 'famas': {
      g.add(box(0.044, 0.075, 0.44, polymerMat, 0, 0.01, 0.04));
      g.add(box(0.034, 0.036, 0.3, polymerMat, 0, 0.065, -0.02));
      g.add(cyl(0.01, 0.01, 0.24, gunmetalMat, 0, 0.024, -0.28));
      addFlashHider(g, 0.024, -0.41, 0.012, 0.036);
      g.add(box(0.03, 0.095, 0.038, rubberGripMat, 0, -0.056, -0.05, 0.22, 0, 0));
      addTriggerAssembly(g, -0.02, -0.09);
      const mag = new THREE.Group();
      mag.name = 'magazine';
      mag.add(box(0.026, 0.135, 0.044, darkSteelMat, 0, -0.07, 0.16));
      g.add(mag);
      break;
    }

    case 'aug': {
      const hull = extrudeProfile(
        [
          [-0.22, 0.045],
          [0.08, 0.048],
          [0.24, 0.04],
          [0.24, -0.055],
          [-0.08, -0.032],
          [-0.22, -0.02],
        ],
        0.044,
        olivePolymerMat,
        0.005
      );
      hull.position.set(0, 0.008, 0.04);
      g.add(hull);
      addScope(g, 0.074, -0.02, 0.18, 0.015);
      g.add(cyl(0.01, 0.01, 0.3, gunmetalMat, 0, 0.024, -0.3));
      addFlashHider(g, 0.024, -0.45, 0.012, 0.036);
      g.add(box(0.028, 0.092, 0.036, olivePolymerMat, 0, -0.055, -0.06, 0.2, 0, 0));
      const mag = new THREE.Group();
      mag.name = 'magazine';
      mag.add(box(0.026, 0.13, 0.044, tanPolymerMat, 0, -0.065, 0.16));
      g.add(mag);
      break;
    }

    case 'sg552': {
      g.add(box(0.042, 0.06, 0.3, gunmetalMat, 0, 0.018, 0.0));
      g.add(box(0.036, 0.064, 0.24, olivePolymerMat, 0, 0.004, 0.25));
      g.add(box(0.042, 0.048, 0.2, olivePolymerMat, 0, 0.016, -0.23));
      addScope(g, 0.074, 0.0, 0.17, 0.015);
      g.add(cyl(0.01, 0.01, 0.28, darkSteelMat, 0, 0.024, -0.32));
      addFlashHider(g, 0.024, -0.47, 0.012, 0.036);
      g.add(box(0.03, 0.096, 0.038, rubberGripMat, 0, -0.056, 0.1, 0.24, 0, 0));
      addTriggerAssembly(g, -0.014, 0.055);
      const mag = new THREE.Group();
      mag.name = 'magazine';
      mag.add(box(0.026, 0.145, 0.044, polymerMat, 0, -0.075, -0.08, -0.1, 0, 0));
      g.add(mag);
      break;
    }

    case 'scout':
    case 'awp': {
      const isAwp = weaponId === 'awp';
      const bodyMat = isAwp ? olivePolymerMat : carbonMat;
      const chassis = extrudeProfile(
        [
          [-0.25, 0.032],
          [0.12, 0.035],
          [0.36, 0.026],
          [0.36, -0.05],
          [0.18, -0.045],
          [0.12, -0.015],
          [-0.08, -0.045],
          [-0.25, -0.02],
        ],
        0.044,
        bodyMat,
        0.005
      );
      chassis.position.set(0, 0.006, 0.1);
      g.add(chassis);
      g.add(box(0.045, 0.072, 0.02, rubberGripMat, 0, -0.005, 0.46));

      g.add(cyl(0.02, 0.02, 0.22, darkSteelMat, 0, 0.038, -0.02));
      const boltGroup = new THREE.Group();
      boltGroup.name = 'bolt';
      boltGroup.add(cyl(0.006, 0.006, 0.04, chromeSteelMat, 0.024, 0.038, 0.04, 0, 0, Math.PI / 2));
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.012, 12, 10), chromeSteelMat);
      knob.position.set(0.045, 0.038, 0.04);
      boltGroup.add(knob);
      g.add(boltGroup);

      g.add(cyl(0.013, 0.015, 0.64, darkSteelMat, 0, 0.038, -0.45));
      if (isAwp) {
        g.add(box(0.032, 0.032, 0.068, darkSteelMat, 0, 0.038, -0.78));
        g.add(box(0.036, 0.022, 0.045, darkSteelMat, 0, -0.006, -0.18));
        g.add(cyl(0.007, 0.007, 0.22, gunmetalMat, -0.022, -0.018, -0.3));
        g.add(cyl(0.007, 0.007, 0.22, gunmetalMat, 0.022, -0.018, -0.3));
      } else {
        addFlashHider(g, 0.038, -0.77, 0.013, 0.035);
      }

      addPicatinnyRail(g, 0.056, -0.14, 0.08, 0.024);
      addScope(g, 0.088, -0.03, 0.3, 0.02);

      g.add(box(0.03, 0.095, 0.04, rubberGripMat, 0, -0.055, 0.14, 0.24, 0, 0));
      addTriggerAssembly(g, -0.016, 0.07);

      const mag = new THREE.Group();
      mag.name = 'magazine';
      mag.add(box(0.026, 0.09, 0.054, darkSteelMat, 0, -0.055, -0.08));
      g.add(mag);
      break;
    }

    case 'g3sg1':
    case 'sg550': {
      const isG3 = weaponId === 'g3sg1';
      const trimMat = isG3 ? darkSteelMat : olivePolymerMat;
      g.add(box(0.044, 0.062, 0.34, gunmetalMat, 0, 0.018, 0.0));
      g.add(box(0.038, 0.068, 0.26, trimMat, 0, 0.004, 0.28));
      g.add(box(0.04, 0.044, 0.24, trimMat, 0, 0.016, -0.26));
      g.add(cyl(0.01, 0.01, 0.44, darkSteelMat, 0, 0.024, -0.4));
      addFlashHider(g, 0.024, -0.62, 0.013, 0.04);
      addScope(g, 0.076, -0.02, 0.22, 0.017);
      g.add(box(0.03, 0.096, 0.038, rubberGripMat, 0, -0.056, 0.1, 0.24, 0, 0));
      addTriggerAssembly(g, -0.014, 0.055);
      const mag = new THREE.Group();
      mag.name = 'magazine';
      mag.add(box(0.026, 0.125, 0.046, darkSteelMat, 0, -0.065, -0.09));
      g.add(mag);
      break;
    }

    case 'm249': {
      g.add(box(0.062, 0.085, 0.38, gunmetalMat, 0, 0.022, -0.02));
      addPicatinnyRail(g, 0.068, -0.14, 0.12, 0.028);
      g.add(box(0.044, 0.078, 0.25, polymerMat, 0, 0.008, 0.28));
      g.add(cyl(0.015, 0.015, 0.46, darkSteelMat, 0, 0.034, -0.38));
      addFlashHider(g, 0.034, -0.62, 0.016, 0.046);
      g.add(box(0.052, 0.046, 0.24, polymerMat, 0, 0.004, -0.28));
      const mag = new THREE.Group();
      mag.name = 'magazine';
      mag.add(box(0.095, 0.11, 0.11, olivePolymerMat, -0.03, -0.065, -0.08));
      mag.add(box(0.042, 0.012, 0.075, brassMat, -0.03, 0.02, -0.08));
      g.add(mag);
      g.add(box(0.032, 0.1, 0.04, rubberGripMat, 0, -0.058, 0.11, 0.24, 0, 0));
      break;
    }

    case 'hegrenade': {
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.038, 16, 12), heGreenMat);
      body.scale.set(0.92, 1.15, 0.92);
      g.add(body);
      g.add(cyl(0.014, 0.016, 0.024, brassMat, 0, 0.046, 0, 0, 0, 0, 12));
      g.add(box(0.012, 0.058, 0.016, darkSteelMat, 0.026, 0.02, 0, 0, 0, -0.25));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.0025, 8, 14), chromeSteelMat);
      ring.position.set(-0.018, 0.048, 0);
      g.add(ring);
      break;
    }

    case 'flashbang': {
      g.add(cyl(0.029, 0.029, 0.108, flashSteelMat, 0, 0, 0, 0, 0, 0, 16));
      g.add(cyl(0.012, 0.012, 0.022, chromeSteelMat, 0, 0.062, 0, 0, 0, 0, 12));
      g.add(box(0.008, 0.062, 0.014, darkSteelMat, 0.025, 0.025, 0, 0, 0, -0.2));
      break;
    }

    case 'smokegrenade': {
      g.add(cyl(0.03, 0.03, 0.115, olivePolymerMat, 0, 0, 0, 0, 0, 0, 16));
      g.add(cyl(0.031, 0.031, 0.024, chromeSteelMat, 0, 0.018, 0, 0, 0, 0, 16));
      g.add(cyl(0.012, 0.012, 0.02, darkSteelMat, 0, 0.064, 0, 0, 0, 0, 12));
      break;
    }

    case 'c4': {
      g.add(box(0.14, 0.06, 0.2, c4BrickMat, 0, 0, 0));
      g.add(box(0.085, 0.016, 0.115, darkSteelMat, 0, 0.034, 0.01));
      g.add(box(0.052, 0.009, 0.028, lensMat, 0, 0.042, -0.02));
      const led = box(0.014, 0.01, 0.014, c4LedMat, 0.028, 0.043, -0.038);
      led.name = 'c4_led';
      g.add(led);
      break;
    }
  }

  return g;
}

/**
 * Builds articulated first-person tactical hands with ripstop-textured forearms,
 * cuffs, carbon-knuckle gloves, tactical watch, opposable thumbs, and 4 multi-jointed
 * fingers per hand. Hands are attached directly to 'right_arm' and 'left_arm' so
 * WeaponController can plant them accurately onto any weapon's grip & handguard.
 */
export function buildFirstPersonHands(team: Team, classId?: string): THREE.Group {
  const hands = new THREE.Group();
  hands.name = 'fp_hands';

  const isPhoenix = classId === 'classic_t';
  const isElite = classId === 'desert_t';
  const isArctic = classId === 'urban_t';
  const isGuerilla = classId === 'military_t';
  const isSeal = classId === 'classic_ct';
  const isGsg9 = classId === 'specops_ct';
  const isSas = classId === 'urban_ct';
  const isGign = classId === 'assault_ct';

  const bareForearm = isPhoenix || isGuerilla;
  const fingerless = isPhoenix || isElite || isGuerilla || team === 'T';

  const sleeveColor = isPhoenix
    ? 0x20314b
    : isElite
    ? 0x576634
    : isArctic
    ? 0xdcdfe3
    : isGuerilla
    ? 0x3c4729
    : isSas
    ? 0x22262b
    : isGsg9
    ? 0x3e4b2e
    : isSeal || isGign
    ? 0x43516e
    : team === 'CT'
    ? 0x243447
    : 0x524c3b;

  const gloveColor = isSas || isGsg9 || isSeal || isGign ? 0x1a1e24 : 0x2a2621;
  const skinColor = isElite ? 0xbe8e68 : isArctic ? 0xd4aa8d : 0xc99c7a;

  const clothTex = textures.getCharacterTexturePair(isArctic ? 'arctic_camo' : 'ripstop_solid');
  const leatherTex = textures.getCharacterTexturePair('leather');
  const skinTex = textures.createSkinTexture(skinColor);

  const sleeveMat = new THREE.MeshPhysicalMaterial({
    color: sleeveColor,
    map: clothTex.map,
    normalMap: clothTex.normalMap,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughnessMap: clothTex.roughnessMap,
    roughness: 0.76,
    metalness: 0.04,
    sheen: 0.35,
    sheenRoughness: 0.68,
  });
  const gloveMat = new THREE.MeshPhysicalMaterial({
    color: gloveColor,
    map: leatherTex.map,
    normalMap: leatherTex.normalMap,
    normalScale: new THREE.Vector2(0.7, 0.7),
    roughnessMap: leatherTex.roughnessMap,
    roughness: 0.54,
    metalness: 0.14,
  });
  const knuckleMat = carbonMat;
  const skinMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: skinTex,
    roughness: 0.52,
    metalness: 0.02,
    sheen: 0.24,
    sheenRoughness: 0.56,
    sheenColor: new THREE.Color(0xffbfa0),
  });

  const forearmMat = bareForearm ? skinMat : sleeveMat;
  const fingerTipMat = fingerless ? skinMat : gloveMat;

  const buildGlovedHand = (isRight: boolean) => {
    const hand = new THREE.Group();
    const s = isRight ? 1 : -1;

    // Sculpted anatomical palm
    const palm = new THREE.Mesh(new THREE.CapsuleGeometry(0.024, 0.036, 6, 12), gloveMat);
    palm.scale.set(1.05, 0.72, 1.0);
    palm.rotation.x = Math.PI / 2;
    hand.add(palm);

    // Wrist velcro strap + molded carbon-fiber knuckle plate
    const wristStrap = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.03, 0.024, 14), gloveMat);
    wristStrap.rotation.x = Math.PI / 2;
    wristStrap.position.set(0, 0, 0.036);
    hand.add(wristStrap);

    const knuckle = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.012, 0.022), knuckleMat);
    knuckle.position.set(0, 0.016, -0.016);
    hand.add(knuckle);

    // Opposable Thumb (2 phalanges)
    const thumb = new THREE.Group();
    thumb.position.set(-s * 0.025, 0.005, -0.006);
    thumb.rotation.set(0.26, s * 0.36, 0);
    const thumbBase = new THREE.Mesh(new THREE.CapsuleGeometry(0.007, 0.02, 5, 10), gloveMat);
    thumbBase.rotation.x = Math.PI / 2;
    thumbBase.position.z = -0.013;
    const thumbTip = new THREE.Mesh(new THREE.CapsuleGeometry(0.0062, 0.015, 5, 10), fingerTipMat);
    thumbTip.rotation.x = Math.PI / 2;
    thumbTip.position.z = -0.031;
    thumb.add(thumbBase, thumbTip);
    hand.add(thumb);

    // 4 Articulated Fingers (index slightly extended on trigger/rail, others wrapped)
    for (let f = 0; f < 4; f++) {
      const fx = (-0.016 + f * 0.0108) * s;
      const isIndex = f === 0;
      const finger = new THREE.Group();
      finger.position.set(fx, 0.004, -0.03);
      const seg1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.0056, 0.018, 4, 8), gloveMat);
      seg1.rotation.x = isIndex ? Math.PI / 2.2 : Math.PI / 2.7;
      seg1.position.set(0, -0.004, -0.01);
      const seg2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.0048, 0.015, 4, 8), fingerTipMat);
      seg2.rotation.x = isIndex ? Math.PI / 2.0 : Math.PI / 1.7;
      seg2.position.set(0, isIndex ? -0.012 : -0.018, -0.018);
      finger.add(seg1, seg2);
      hand.add(finger);
    }

    return hand;
  };

  // Forearm contour via LatheGeometry (wrist taper to muscular forearm)
  const armPts = [
    new THREE.Vector2(0.026, -0.14),
    new THREE.Vector2(0.031, -0.06),
    new THREE.Vector2(0.039, 0.06),
    new THREE.Vector2(0.043, 0.15),
  ];
  const armGeo = new THREE.LatheGeometry(armPts, 14);
  armGeo.rotateX(Math.PI / 2);

  // Right arm (anchor origin moved dynamically by WeaponController to weapon's rightHandPos)
  const rightArm = new THREE.Group();
  rightArm.name = 'right_arm';
  const rightHand = buildGlovedHand(true);
  rightHand.name = 'right_hand';
  rightArm.add(rightHand);

  const rForearm = new THREE.Mesh(armGeo, forearmMat);
  rForearm.position.set(0.056, -0.042, 0.16);
  rForearm.rotation.set(0.18, -0.26, 0.0);
  rightArm.add(rForearm);

  if (!bareForearm) {
    const rCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.035, 0.026, 12), gloveMat);
    rCuff.rotation.set(Math.PI / 2 + 0.18, 0, -0.26);
    rCuff.position.set(0.024, -0.02, 0.055);
    rightArm.add(rCuff);
  }
  hands.add(rightArm);

  // Left arm (support / reload / bolt hand)
  const leftArm = new THREE.Group();
  leftArm.name = 'left_arm';
  const leftHand = buildGlovedHand(false);
  leftHand.name = 'left_hand';
  leftArm.add(leftHand);

  const lForearm = new THREE.Mesh(armGeo, forearmMat);
  lForearm.position.set(-0.072, -0.052, 0.155);
  lForearm.rotation.set(0.22, 0.38, 0.0);
  leftArm.add(lForearm);

  const lWatch = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.031, 0.018, 14), darkSteelMat);
  lWatch.rotation.set(Math.PI / 2 + 0.22, 0, 0.38);
  lWatch.position.set(-0.028, -0.024, 0.062);
  leftArm.add(lWatch);

  hands.add(leftArm);

  return hands;
}
