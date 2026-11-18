import * as THREE from 'three';
import { Team, WeaponId } from './types';

// Stylized Cartoon-Realistic PBR Weapon Materials
const gunmetalMat = new THREE.MeshStandardMaterial({
  color: 0x2f353d,
  roughness: 0.34,
  metalness: 0.86,
});

const darkSteelMat = new THREE.MeshStandardMaterial({
  color: 0x191d22,
  roughness: 0.42,
  metalness: 0.8,
});

const chromeSteelMat = new THREE.MeshStandardMaterial({
  color: 0xc2c9d1,
  roughness: 0.18,
  metalness: 0.94,
});

const polymerMat = new THREE.MeshStandardMaterial({
  color: 0x202429,
  roughness: 0.72,
  metalness: 0.14,
});

const rubberGripMat = new THREE.MeshStandardMaterial({
  color: 0x141619,
  roughness: 0.88,
  metalness: 0.05,
});

const tanPolymerMat = new THREE.MeshStandardMaterial({
  color: 0x9e8864,
  roughness: 0.68,
  metalness: 0.12,
});

const olivePolymerMat = new THREE.MeshStandardMaterial({
  color: 0x43543b,
  roughness: 0.68,
  metalness: 0.14,
});

const walnutWoodMat = new THREE.MeshStandardMaterial({
  color: 0x7b431e,
  roughness: 0.56,
  metalness: 0.06,
});

const cherryWoodMat = new THREE.MeshStandardMaterial({
  color: 0x8f471d,
  roughness: 0.48,
  metalness: 0.08,
});

const lensMat = new THREE.MeshPhysicalMaterial({
  color: 0x1e5c84,
  roughness: 0.08,
  metalness: 0.25,
  clearcoat: 1.0,
  clearcoatRoughness: 0.06,
});

const reticleGlowMat = new THREE.MeshStandardMaterial({
  color: 0x56d88a,
  emissive: 0x2abf65,
  emissiveIntensity: 0.9,
  roughness: 0.2,
});

const brassMat = new THREE.MeshStandardMaterial({
  color: 0xc9a03b,
  roughness: 0.28,
  metalness: 0.9,
});

const heGreenMat = new THREE.MeshStandardMaterial({
  color: 0x3b5234,
  roughness: 0.58,
  metalness: 0.28,
});

const flashSteelMat = new THREE.MeshStandardMaterial({
  color: 0x526173,
  roughness: 0.38,
  metalness: 0.72,
});

const c4BrickMat = new THREE.MeshStandardMaterial({
  color: 0x746d58,
  roughness: 0.82,
  metalness: 0.08,
});

const c4LedMat = new THREE.MeshStandardMaterial({
  color: 0xff2b2b,
  emissive: 0xff1e1e,
  emissiveIntensity: 1.6,
  roughness: 0.25,
});

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
  segs = 14
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
  const notches = Math.max(3, Math.floor(len / 0.022));
  for (let i = 0; i < notches; i++) {
    const nz = zStart + (zEnd - zStart) * ((i + 0.5) / notches);
    group.add(box(width + 0.003, 0.005, 0.011, gunmetalMat, 0, y + 0.005, nz));
  }
}

function addScope(group: THREE.Group, y: number, zCenter: number, length = 0.25, radius = 0.018): void {
  // Mount rings
  group.add(box(0.026, 0.028, 0.022, darkSteelMat, 0, y - 0.022, zCenter - length * 0.22));
  group.add(box(0.026, 0.028, 0.022, darkSteelMat, 0, y - 0.022, zCenter + length * 0.22));
  // Contoured scope tube via Lathe
  const half = length / 2;
  const pts = [
    new THREE.Vector2(0.001, -half),
    new THREE.Vector2(radius * 1.18, -half),
    new THREE.Vector2(radius * 1.18, -half + 0.05),
    new THREE.Vector2(radius * 0.85, -half + 0.075),
    new THREE.Vector2(radius * 0.85, half - 0.06),
    new THREE.Vector2(radius * 1.05, half - 0.04),
    new THREE.Vector2(radius * 1.05, half),
    new THREE.Vector2(0.001, half),
  ];
  const scopeGeo = new THREE.LatheGeometry(pts, 16);
  scopeGeo.rotateX(Math.PI / 2);
  const scopeMesh = new THREE.Mesh(scopeGeo, darkSteelMat);
  scopeMesh.position.set(0, y, zCenter);
  scopeMesh.castShadow = true;
  group.add(scopeMesh);

  // Windage / elevation turrets
  group.add(cyl(0.009, 0.009, 0.016, gunmetalMat, 0, y + radius * 1.1, zCenter, 0, 0, 0, 10));
  group.add(cyl(0.009, 0.009, 0.016, gunmetalMat, radius * 1.1, y, zCenter, 0, 0, Math.PI / 2, 10));

  // Front & rear optical lenses
  group.add(cyl(radius * 1.02, radius * 1.02, 0.008, lensMat, 0, y, zCenter - half - 0.002));
  group.add(cyl(radius * 0.9, radius * 0.9, 0.008, lensMat, 0, y, zCenter + half + 0.002));
}

function addTriggerAssembly(group: THREE.Group, y: number, z: number): void {
  group.add(box(0.012, 0.005, 0.05, darkSteelMat, 0, y - 0.024, z)); // Guard bottom
  group.add(box(0.012, 0.024, 0.006, darkSteelMat, 0, y - 0.012, z - 0.024)); // Guard front
  const trig = box(0.007, 0.018, 0.007, chromeSteelMat, 0, y - 0.008, z, -0.35, 0, 0);
  trig.name = 'trigger';
  group.add(trig);
}

/**
 * Builds a high-detail stylized 3D weapon model pointing along -Z
 * with named sub-parts ('magazine', 'slide', 'bolt', 'charging_handle', 'suppressor')
 * for physically accurate first-person reload & firing animations.
 */
export function buildWeaponModel(weaponId: WeaponId, silenced = false): THREE.Group {
  const g = new THREE.Group();
  g.name = `weapon_${weaponId}`;

  switch (weaponId) {
    case 'knife': {
      // Sculpted tactical bayonet / combat knife
      const grip = cyl(0.016, 0.018, 0.135, rubberGripMat, 0, -0.008, 0.055);
      grip.scale.set(0.85, 1, 1.15);
      g.add(grip);
      g.add(cyl(0.019, 0.019, 0.018, darkSteelMat, 0, -0.008, 0.125)); // Pommel cap
      g.add(box(0.044, 0.052, 0.014, darkSteelMat, 0, -0.004, -0.015)); // Crossguard

      // Clip-point Bowie blade via ExtrudeGeometry
      const blade = extrudeProfile(
        [
          [0, -0.014],
          [0.18, -0.012],
          [0.24, 0.004],
          [0.19, 0.016],
          [0.08, 0.015],
          [0, 0.016],
        ],
        0.005,
        chromeSteelMat,
        0.002
      );
      blade.position.set(0, 0.002, -0.14);
      g.add(blade);
      // Fuller groove & serrated spine accent
      g.add(box(0.007, 0.006, 0.12, gunmetalMat, 0, 0.008, -0.1));
      break;
    }

    case 'glock18': {
      // Polymer lower frame with picatinny rail & ergonomic beavertail
      g.add(box(0.031, 0.022, 0.195, polymerMat, 0, -0.002, -0.025));
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

      // Movable steel slide
      const slide = new THREE.Group();
      slide.name = 'slide';
      slide.add(box(0.032, 0.036, 0.215, darkSteelMat, 0, 0.026, -0.032));
      slide.add(box(0.022, 0.012, 0.055, chromeSteelMat, 0, 0.034, -0.015)); // Ejection port
      slide.add(box(0.008, 0.01, 0.01, reticleGlowMat, 0, 0.048, -0.126)); // Tritium front sight
      slide.add(box(0.022, 0.01, 0.01, darkSteelMat, 0, 0.048, 0.062)); // Rear notch sight
      g.add(slide);

      g.add(cyl(0.0075, 0.0075, 0.045, chromeSteelMat, 0, 0.022, -0.142));

      // Removable magazine inside grip
      const mag = new THREE.Group();
      mag.name = 'magazine';
      const magBody = box(0.02, 0.1, 0.032, darkSteelMat, 0, -0.062, 0.044, 0.22, 0, 0);
      mag.add(magBody);
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
      slide.add(box(0.008, 0.011, 0.01, reticleGlowMat, 0, 0.05, -0.132));
      slide.add(box(0.022, 0.011, 0.01, darkSteelMat, 0, 0.05, 0.065));
      g.add(slide);

      g.add(cyl(0.008, 0.008, 0.04, chromeSteelMat, 0, 0.023, -0.15));
      if (silenced) {
        const sup = cyl(0.017, 0.017, 0.175, darkSteelMat, 0, 0.023, -0.24);
        sup.name = 'suppressor';
        g.add(sup);
        g.add(cyl(0.0185, 0.0185, 0.022, gunmetalMat, 0, 0.023, -0.165)); // Mounting collar
      }

      const mag = new THREE.Group();
      mag.name = 'magazine';
      mag.add(box(0.02, 0.1, 0.032, darkSteelMat, 0, -0.062, 0.045, 0.2, 0, 0));
      mag.add(box(0.026, 0.012, 0.038, polymerMat, 0, -0.112, 0.054, 0.2, 0, 0));
      g.add(mag);
      break;
    }

    case 'deagle': {
      // Heavy Chrome Magnum Frame
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

      // Triangular heavy barrel shroud + reciprocating slide
      g.add(box(0.034, 0.046, 0.135, chromeSteelMat, 0, 0.028, -0.12));
      addPicatinnyRail(g, 0.054, -0.16, -0.06, 0.022);
      g.add(cyl(0.011, 0.011, 0.04, darkSteelMat, 0, 0.028, -0.195));

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
      g.add(box(0.028, 0.104, 0.042, rubberGripMat, 0, -0.058, 0.046, 0.22, 0, 0));
      addTriggerAssembly(g, -0.01, 0.004);
      const slide = new THREE.Group();
      slide.name = 'slide';
      slide.add(box(0.032, 0.036, 0.212, slideMat, 0, 0.025, -0.03));
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
      const pump = new THREE.Group();
      pump.name = 'charging_handle';
      pump.add(cyl(0.021, 0.021, 0.19, isAuto ? tanPolymerMat : rubberGripMat, 0, -0.002, -0.26));
      g.add(pump);
      break;
    }

    case 'mp5': {
      // Sculpted MP5 upper + welded sight drum + curved banana mag
      g.add(box(0.042, 0.056, 0.29, darkSteelMat, 0, 0.02, -0.01));
      addPicatinnyRail(g, 0.051, -0.1, 0.09, 0.022);
      // Collapsible tactical stock
      g.add(box(0.038, 0.048, 0.04, polymerMat, 0, 0.014, 0.15));
      g.add(box(0.008, 0.014, 0.22, gunmetalMat, -0.022, 0.018, 0.24));
      g.add(box(0.008, 0.014, 0.22, gunmetalMat, 0.022, 0.018, 0.24));
      g.add(box(0.038, 0.078, 0.032, rubberGripMat, 0, 0.004, 0.34));

      // Ergonomic trigger group & pistol grip
      g.add(box(0.031, 0.096, 0.04, rubberGripMat, 0, -0.054, 0.065, 0.24, 0, 0));
      addTriggerAssembly(g, -0.014, 0.02);

      // Slanted tropical handguard & cocking tube
      g.add(cyl(0.013, 0.013, 0.21, gunmetalMat, 0, 0.04, -0.21));
      const handle = box(0.026, 0.012, 0.014, chromeSteelMat, -0.018, 0.044, -0.26);
      handle.name = 'charging_handle';
      g.add(handle);
      g.add(cyl(0.011, 0.011, 0.24, darkSteelMat, 0, 0.02, -0.26));
      g.add(box(0.04, 0.044, 0.17, polymerMat, 0, 0.004, -0.2));
      g.add(cyl(0.013, 0.013, 0.014, darkSteelMat, 0, 0.052, -0.295, Math.PI / 2, 0, 0, 12)); // Front hood sight

      // Curved MP5 magazine
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
      g.add(cyl(0.017, 0.017, 0.25, darkSteelMat, 0, 0.022, -0.24));
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
      g.add(box(0.03, 0.095, 0.04, rubberGripMat, 0, -0.055, 0.08, 0.24, 0, 0));
      addTriggerAssembly(g, -0.016, 0.025);
      const mag = new THREE.Group();
      mag.name = 'magazine';
      mag.add(box(0.024, 0.17, 0.038, darkSteelMat, 0, -0.09, -0.09, 0.04, 0, 0));
      g.add(mag);
      break;
    }

    case 'p90': {
      // Ergonomic Futurist Bullpup PDW
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
      // Translucent bronze 50-rd top horizontal magazine
      const mag = new THREE.Group();
      mag.name = 'magazine';
      mag.add(box(0.04, 0.024, 0.26, tanPolymerMat, 0, 0.062, -0.02));
      g.add(mag);
      // Reflex sight housing + glowing green reticle lens
      g.add(box(0.036, 0.042, 0.065, darkSteelMat, 0, 0.082, -0.14));
      g.add(cyl(0.012, 0.012, 0.012, lensMat, 0, 0.084, -0.16));
      g.add(cyl(0.011, 0.011, 0.11, darkSteelMat, 0, 0.02, -0.22));
      break;
    }

    case 'ak47': {
      // Sculpted Kalashnikov with ribbed dust cover, cherry-mahogany wood furniture, bright chrome bolt & curved 7.62 mag
      g.add(box(0.043, 0.058, 0.31, gunmetalMat, 0, 0.016, 0.0)); // Lower receiver
      g.add(box(0.038, 0.024, 0.26, darkSteelMat, 0, 0.046, 0.01)); // Dust cover
      const boltCarrier = box(0.02, 0.016, 0.085, chromeSteelMat, 0.022, 0.034, -0.02);
      boltCarrier.name = 'charging_handle';
      g.add(boltCarrier);

      // Sloped laminated cherry-mahogany buttstock + steel buttplate
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

      // Cherry-mahogany handguard + upper gas tube
      g.add(box(0.04, 0.046, 0.21, cherryWoodMat, 0, 0.012, -0.25));
      g.add(box(0.034, 0.018, 0.16, cherryWoodMat, 0, 0.042, -0.23)); // Upper wood handguard
      g.add(cyl(0.01, 0.01, 0.46, darkSteelMat, 0, 0.026, -0.37));
      g.add(cyl(0.009, 0.009, 0.23, gunmetalMat, 0, 0.046, -0.24));
      g.add(box(0.02, 0.032, 0.03, darkSteelMat, 0, 0.038, -0.36)); // Gas block

      // Slanted muzzle compensator
      g.add(cyl(0.013, 0.013, 0.038, darkSteelMat, 0, 0.026, -0.6));

      // Front hooded sight & rear tangent sight
      g.add(box(0.012, 0.03, 0.016, darkSteelMat, 0, 0.048, -0.55));
      g.add(box(0.02, 0.012, 0.038, darkSteelMat, 0, 0.06, -0.14));

      // Ergonomic Bakelite pistol grip + trigger guard
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

      // Curved AK 30-rd banana magazine
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
      // Forged AR-15 upper/lower receiver + iconic hollow carry handle + delta ring + A-frame sight (image_58ba8fc2)
      g.add(box(0.042, 0.058, 0.29, darkSteelMat, 0, 0.018, 0.0));
      addPicatinnyRail(g, 0.049, -0.26, 0.12, 0.026);
      // Hollow Carry Handle bridge (front/rear uprights + top bar + aperture drum)
      g.add(box(0.026, 0.026, 0.026, gunmetalMat, 0, 0.061, -0.052));
      g.add(box(0.026, 0.03, 0.032, gunmetalMat, 0, 0.063, 0.072));
      g.add(box(0.026, 0.012, 0.15, darkSteelMat, 0, 0.076, 0.01));
      g.add(cyl(0.012, 0.012, 0.02, gunmetalMat, 0, 0.068, 0.072, 0, 0, Math.PI / 2, 10));
      const chHandle = box(0.036, 0.012, 0.02, gunmetalMat, 0, 0.042, 0.135);
      chHandle.name = 'charging_handle';
      g.add(chHandle);

      // Buffer tube & Crane tactical stock
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

      // Ribbed round M4 handguard + delta ring
      g.add(cyl(0.027, 0.025, 0.022, gunmetalMat, 0, 0.02, -0.14)); // Delta ring
      g.add(cyl(0.025, 0.025, 0.22, polymerMat, 0, 0.02, -0.25, Math.PI / 2, 0, 0, 10));
      for (let rz = -0.34; rz <= -0.17; rz += 0.022) {
        g.add(cyl(0.027, 0.027, 0.007, rubberGripMat, 0, 0.02, rz, Math.PI / 2, 0, 0, 10));
      }
      g.add(cyl(0.01, 0.01, 0.4, gunmetalMat, 0, 0.022, -0.35)); // Barrel
      // A-frame front sight tower
      g.add(box(0.014, 0.044, 0.018, darkSteelMat, 0, 0.046, -0.39, -0.18, 0, 0));
      g.add(box(0.014, 0.044, 0.014, darkSteelMat, 0, 0.046, -0.37));

      // Pistol grip + trigger assembly
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

      // STANAG 30-rd magazine
      const mag = new THREE.Group();
      mag.name = 'magazine';
      mag.add(box(0.025, 0.145, 0.046, gunmetalMat, 0, -0.075, -0.08, -0.1, 0, 0));
      mag.add(box(0.029, 0.016, 0.05, polymerMat, 0, -0.145, -0.086, -0.1, 0, 0));
      g.add(mag);

      if (silenced) {
        const sup = cyl(0.019, 0.019, 0.22, darkSteelMat, 0, 0.022, -0.57);
        sup.name = 'suppressor';
        g.add(sup);
        g.add(cyl(0.021, 0.021, 0.025, gunmetalMat, 0, 0.022, -0.47));
      } else {
        g.add(cyl(0.013, 0.011, 0.04, darkSteelMat, 0, 0.022, -0.54)); // A2 birdcage flash hider
      }
      break;
    }

    case 'galil': {
      // Classic CS 1.6 IDF Galil ARM with signature walnut forearm handguard, rear aperture sight & ribbed receiver (image_9a191133)
      g.add(box(0.042, 0.058, 0.3, darkSteelMat, 0, 0.018, 0.0));
      g.add(box(0.036, 0.018, 0.25, gunmetalMat, 0, 0.05, 0.0));
      const boltHandle = box(0.02, 0.014, 0.032, chromeSteelMat, 0.024, 0.036, -0.04);
      boltHandle.name = 'charging_handle';
      g.add(boltHandle);

      // Folding tubular steel stock
      g.add(box(0.016, 0.012, 0.23, gunmetalMat, 0, 0.028, 0.25));
      g.add(box(0.016, 0.012, 0.23, gunmetalMat, 0, -0.014, 0.25));
      g.add(box(0.024, 0.068, 0.026, rubberGripMat, 0, 0.008, 0.36));

      // Signature Galil wood forearm handguard + upper gas tube + rear & front ironsights
      g.add(box(0.042, 0.044, 0.22, walnutWoodMat, 0, 0.012, -0.25));
      g.add(cyl(0.01, 0.01, 0.41, darkSteelMat, 0, 0.024, -0.36));
      g.add(cyl(0.009, 0.009, 0.22, gunmetalMat, 0, 0.042, -0.24));
      g.add(box(0.024, 0.022, 0.02, darkSteelMat, 0, 0.064, 0.1)); // Rear sight ears
      g.add(box(0.012, 0.026, 0.014, darkSteelMat, 0, 0.048, -0.49)); // Front post

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
      const bodyMat = isAwp ? olivePolymerMat : gunmetalMat;
      // Sculpted Accuracy International thumbhole sniper chassis
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
      g.add(box(0.045, 0.072, 0.02, rubberGripMat, 0, -0.005, 0.46)); // Recoil pad

      // Receiver + animated bolt handle
      g.add(cyl(0.02, 0.02, 0.22, darkSteelMat, 0, 0.038, -0.02));
      const boltGroup = new THREE.Group();
      boltGroup.name = 'bolt';
      boltGroup.add(cyl(0.006, 0.006, 0.04, chromeSteelMat, 0.024, 0.038, 0.04, 0, 0, Math.PI / 2));
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 10), chromeSteelMat);
      knob.position.set(0.045, 0.038, 0.04);
      boltGroup.add(knob);
      g.add(boltGroup);

      // Heavy fluted barrel + rectangular muzzle brake + folded twin bipod legs (image_36f018f4)
      g.add(cyl(0.013, 0.015, 0.64, darkSteelMat, 0, 0.038, -0.45));
      if (isAwp) {
        g.add(box(0.03, 0.03, 0.065, darkSteelMat, 0, 0.038, -0.78));
        g.add(box(0.036, 0.022, 0.045, darkSteelMat, 0, -0.006, -0.18)); // Bipod lug
        g.add(cyl(0.007, 0.007, 0.22, gunmetalMat, -0.022, -0.018, -0.3));
        g.add(cyl(0.007, 0.007, 0.22, gunmetalMat, 0.022, -0.018, -0.3));
      }

      // High-magnification optical scope
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
      g.add(box(0.044, 0.078, 0.25, polymerMat, 0, 0.008, 0.28));
      g.add(cyl(0.015, 0.015, 0.46, darkSteelMat, 0, 0.034, -0.38));
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
      // Ribbed pineapple fragmentation grenade
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.038, 12, 10), heGreenMat);
      body.scale.set(0.92, 1.15, 0.92);
      g.add(body);
      g.add(cyl(0.014, 0.016, 0.024, brassMat, 0, 0.046, 0, 0, 0, 0, 10));
      g.add(box(0.012, 0.058, 0.016, darkSteelMat, 0.026, 0.02, 0, 0, 0, -0.25));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.012, 0.0025, 6, 12), chromeSteelMat);
      ring.position.set(-0.018, 0.048, 0);
      g.add(ring);
      break;
    }

    case 'flashbang': {
      g.add(cyl(0.029, 0.029, 0.108, flashSteelMat, 0, 0, 0, 0, 0, 0, 14));
      g.add(cyl(0.012, 0.012, 0.022, chromeSteelMat, 0, 0.062, 0, 0, 0, 0, 10));
      g.add(box(0.008, 0.062, 0.014, darkSteelMat, 0.025, 0.025, 0, 0, 0, -0.2));
      break;
    }

    case 'smokegrenade': {
      g.add(cyl(0.03, 0.03, 0.115, olivePolymerMat, 0, 0, 0, 0, 0, 0, 14));
      g.add(cyl(0.031, 0.031, 0.024, chromeSteelMat, 0, 0.018, 0, 0, 0, 0, 14));
      g.add(cyl(0.012, 0.012, 0.02, darkSteelMat, 0, 0.064, 0, 0, 0, 0, 10));
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
 * Builds articulated first-person tactical hands with contoured forearms,
 * cuffs, padded knuckle gloves, thumbs, and individual curled fingers.
 * Named child groups ('left_arm', 'right_arm') enable live mag-swap & bolt animations.
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

  const gloveColor = isSas || isGsg9 || isSeal || isGign ? 0x181c22 : 0x26231f;
  const knuckleColor = team === 'CT' ? 0x353c45 : 0x453e35;
  const skinColor = isElite ? 0xbe8e68 : isArctic ? 0xd4aa8d : 0xc99c7a;

  const sleeveMat = new THREE.MeshPhysicalMaterial({
    color: sleeveColor,
    roughness: 0.76,
    metalness: 0.05,
    sheen: 0.3,
    sheenRoughness: 0.7,
  });
  const gloveMat = new THREE.MeshStandardMaterial({ color: gloveColor, roughness: 0.62, metalness: 0.14 });
  const knuckleMat = new THREE.MeshStandardMaterial({ color: knuckleColor, roughness: 0.38, metalness: 0.42 });
  const skinMat = new THREE.MeshPhysicalMaterial({
    color: skinColor,
    roughness: 0.56,
    metalness: 0.02,
    sheen: 0.2,
    sheenColor: new THREE.Color(0xffbfa0),
  });

  const forearmMat = bareForearm ? skinMat : sleeveMat;
  const fingerTipMat = fingerless ? skinMat : gloveMat;

  const buildGlovedHand = (isRight: boolean) => {
    const hand = new THREE.Group();
    const s = isRight ? 1 : -1;

    // Palm
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.032, 0.065), gloveMat);
    hand.add(palm);

    // Carbon-fiber knuckle guard across top
    const knuckle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.024), knuckleMat);
    knuckle.position.set(0, 0.016, -0.018);
    hand.add(knuckle);

    // Articulated thumb
    const thumb = new THREE.Group();
    thumb.position.set(-s * 0.026, 0.006, -0.008);
    thumb.rotation.set(0.25, s * 0.35, 0);
    const thumbBase = new THREE.Mesh(new THREE.CapsuleGeometry(0.007, 0.022, 4, 8), gloveMat);
    thumbBase.rotation.x = Math.PI / 2;
    thumbBase.position.z = -0.014;
    const thumbTip = new THREE.Mesh(new THREE.CapsuleGeometry(0.006, 0.014, 4, 8), fingerTipMat);
    thumbTip.rotation.x = Math.PI / 2;
    thumbTip.position.z = -0.032;
    thumb.add(thumbBase, thumbTip);
    hand.add(thumb);

    // 4 curled fingers
    for (let f = 0; f < 4; f++) {
      const fx = (-0.016 + f * 0.0108) * s;
      const finger = new THREE.Group();
      finger.position.set(fx, 0.004, -0.032);
      const seg1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.0058, 0.018, 4, 6), gloveMat);
      seg1.rotation.x = Math.PI / 2.6;
      seg1.position.set(0, -0.005, -0.01);
      const seg2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.005, 0.015, 4, 6), fingerTipMat);
      seg2.rotation.x = Math.PI / 1.8;
      seg2.position.set(0, -0.018, -0.016);
      finger.add(seg1, seg2);
      hand.add(finger);
    }

    return hand;
  };

  // Right arm (trigger hand)
  const rightArm = new THREE.Group();
  rightArm.name = 'right_arm';
  const rForearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.036, 0.24, 6, 10), forearmMat);
  rForearm.rotation.set(Math.PI / 2 - 0.14, 0, -0.18);
  rForearm.position.set(0.068, -0.082, 0.22);
  rightArm.add(rForearm);

  if (!bareForearm) {
    const rCuff = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.036, 0.026, 10), gloveMat);
    rCuff.rotation.set(Math.PI / 2 - 0.14, 0, -0.18);
    rCuff.position.set(0.034, -0.068, 0.11);
    rightArm.add(rCuff);
  }

  const rightHand = buildGlovedHand(true);
  rightHand.name = 'right_hand';
  rightHand.position.set(0.012, -0.048, 0.072);
  rightHand.rotation.set(0.18, -0.1, -0.45);
  rightArm.add(rightHand);
  hands.add(rightArm);

  // Left arm (support / reload hand)
  const leftArm = new THREE.Group();
  leftArm.name = 'left_arm';
  const lForearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.035, 0.26, 6, 10), forearmMat);
  lForearm.rotation.set(Math.PI / 2 - 0.22, 0, 0.42);
  lForearm.position.set(-0.095, -0.088, 0.045);
  leftArm.add(lForearm);

  const lWatch = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.018, 12), darkSteelMat);
  lWatch.rotation.set(Math.PI / 2 - 0.22, 0, 0.42);
  lWatch.position.set(-0.042, -0.052, -0.055);
  leftArm.add(lWatch);

  const leftHand = buildGlovedHand(false);
  leftHand.name = 'left_hand';
  leftHand.position.set(-0.01, -0.022, -0.11);
  leftHand.rotation.set(-0.1, 0.22, 0.55);
  leftArm.add(leftHand);
  hands.add(leftArm);

  return hands;
}
