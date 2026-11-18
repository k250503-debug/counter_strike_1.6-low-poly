import * as THREE from 'three';
import { textures } from './ProceduralTextures';
import { CHARACTER_CLASSES } from './WeaponDatabase';
import { CharacterClassId, WeaponId } from './types';
import { buildWeaponModel } from './WeaponModels';

export interface CharacterRig {
  root: THREE.Group;
  hips: THREE.Group;
  torso: THREE.Group;
  head: THREE.Group;
  leftArm: THREE.Group;
  leftElbow: THREE.Group;
  rightArm: THREE.Group;
  rightElbow: THREE.Group;
  leftLeg: THREE.Group;
  leftKnee: THREE.Group;
  rightLeg: THREE.Group;
  rightKnee: THREE.Group;
  weaponMount: THREE.Group;
  headMesh: THREE.Mesh;
  bodyHitMeshes: THREE.Mesh[];
  muzzlePoint: THREE.Object3D;
  muzzleFlash: THREE.Group;
  contactShadow: THREE.Mesh;
}

export interface CharacterAnimOptions {
  onGround?: boolean;
  isReloading?: boolean;
  hitFlinch?: number;
  landDip?: number;
  aimPitch?: number;
  deathStyle?: number;
  baseY?: number;
}

/**
 * Shared beveled shooter's-cut SAPI ballistic armor plate geometry.
 */
function createSapiPlateGeo(w = 0.28, h = 0.31, depth = 0.042): THREE.ExtrudeGeometry {
  const hw = w * 0.5;
  const hh = h * 0.5;
  const cutX = w * 0.24;
  const cutY = h * 0.24;

  const shape = new THREE.Shape();
  shape.moveTo(-hw + cutX, hh);
  shape.lineTo(hw - cutX, hh);
  shape.lineTo(hw, hh - cutY);
  shape.lineTo(hw, -hh + 0.03);
  shape.lineTo(hw - 0.03, -hh);
  shape.lineTo(-hw + 0.03, -hh);
  shape.lineTo(-hw, -hh + 0.03);
  shape.lineTo(-hw, hh - cutY);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.012,
    bevelThickness: 0.012,
  });
  geo.center();
  return geo;
}

/**
 * Shared contoured tactical kneepad shell geometry.
 */
function createKneePadGeo(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.048, 0.055);
  shape.quadraticCurveTo(0, 0.072, 0.048, 0.055);
  shape.lineTo(0.056, -0.02);
  shape.quadraticCurveTo(0, -0.068, -0.056, -0.02);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.022,
    bevelEnabled: true,
    bevelSegments: 2,
    steps: 1,
    bevelSize: 0.008,
    bevelThickness: 0.008,
  });
  geo.center();
  return geo;
}

/**
 * Builds a high-fidelity, stylized 3D military operative rig with procedural
 * ripstop cloth, Cordura Kevlar MOLLE vests, leather holsters/boots, metallic
 * buckles & comms gear, sculpted facial features, class-specific headgear,
 * articulated joints, contact shadow grounding, and weapon-mounted muzzle flash.
 * Grounded at y = 0 (bottom-center pivot), standing height ~1.82m.
 */
export function buildCharacterRig(
  classId: CharacterClassId,
  weaponId?: WeaponId,
  enableShadows = true
): CharacterRig {
  const def = CHARACTER_CLASSES[classId];
  const isCT = def.team === 'CT';

  const isPhoenix = classId === 'classic_t';
  const isElite = classId === 'desert_t';
  const isArctic = classId === 'urban_t';
  const isGuerilla = classId === 'military_t';
  const isSeal = classId === 'classic_ct';
  const isGsg9 = classId === 'specops_ct';
  const isSas = classId === 'urban_ct';
  const isGign = classId === 'assault_ct';

  // Procedural PBR texture sets tailored per CS 1.6 unit
  const solidClothTex = textures.getCharacterTexturePair('ripstop_solid');
  const urbanCamoTex = textures.getCharacterTexturePair('urban_camo');
  const woodlandCamoTex = textures.getCharacterTexturePair('woodland_camo');
  const arcticCamoTex = textures.getCharacterTexturePair('arctic_camo');
  const kevlarTex = textures.getCharacterTexturePair('kevlar_molle');
  const leatherTex = textures.getCharacterTexturePair('leather');

  const shirtTex = isArctic ? arcticCamoTex : solidClothTex;
  const pantsTex = isPhoenix
    ? urbanCamoTex
    : isGuerilla
    ? woodlandCamoTex
    : isArctic
    ? arcticCamoTex
    : solidClothTex;

  const pantsColorHex = isPhoenix
    ? 0xd6dadf
    : isGuerilla
    ? 0xc8c7aa
    : isArctic
    ? 0xf0f3f6
    : isElite
    ? def.accentColor
    : def.primaryColor;

  const shirtMat = new THREE.MeshPhysicalMaterial({
    color: isArctic ? 0xf0f3f6 : def.primaryColor,
    map: shirtTex.map,
    bumpMap: shirtTex.bumpMap,
    bumpScale: 0.015,
    roughnessMap: shirtTex.roughnessMap,
    roughness: 0.8,
    metalness: 0.04,
    sheen: 0.35,
    sheenRoughness: 0.68,
    sheenColor: new THREE.Color(def.primaryColor).lerp(new THREE.Color(0xffffff), 0.32),
  });

  const pantsMat = new THREE.MeshPhysicalMaterial({
    color: pantsColorHex,
    map: pantsTex.map,
    bumpMap: pantsTex.bumpMap,
    bumpScale: 0.016,
    roughnessMap: pantsTex.roughnessMap,
    roughness: 0.82,
    metalness: 0.04,
    sheen: 0.3,
    sheenRoughness: 0.72,
    sheenColor: new THREE.Color(pantsColorHex).lerp(new THREE.Color(0xffffff), 0.28),
  });

  const secondaryMat = new THREE.MeshPhysicalMaterial({
    color: def.secondaryColor,
    map: kevlarTex.map,
    bumpMap: kevlarTex.bumpMap,
    bumpScale: 0.022,
    roughnessMap: kevlarTex.roughnessMap,
    roughness: 0.58,
    metalness: 0.14,
    clearcoat: 0.08,
    clearcoatRoughness: 0.6,
  });

  const accentMat = new THREE.MeshPhysicalMaterial({
    color: isPhoenix || isGign || isSeal || isGsg9 || isSas ? 0x262a2e : def.accentColor,
    map: kevlarTex.map,
    bumpMap: kevlarTex.bumpMap,
    bumpScale: 0.016,
    roughness: 0.56,
    metalness: 0.16,
  });

  const headbandMat = new THREE.MeshPhysicalMaterial({
    color: 0xb52924,
    map: solidClothTex.map,
    bumpMap: solidClothTex.bumpMap,
    bumpScale: 0.014,
    roughness: 0.78,
    metalness: 0.02,
  });

  const skinMat = new THREE.MeshPhysicalMaterial({
    color: def.skinColor,
    roughness: 0.52,
    metalness: 0.02,
    sheen: 0.22,
    sheenRoughness: 0.55,
    sheenColor: new THREE.Color(0xffbfa0),
    clearcoat: 0.04,
    clearcoatRoughness: 0.5,
  });

  const bootMat = new THREE.MeshPhysicalMaterial({
    color: isElite ? 0x4b3522 : 0x181a1f,
    map: leatherTex.map,
    bumpMap: leatherTex.bumpMap,
    bumpScale: 0.018,
    roughnessMap: leatherTex.roughnessMap,
    roughness: 0.44,
    metalness: 0.16,
    clearcoat: 0.14,
    clearcoatRoughness: 0.45,
  });

  const gloveMat = new THREE.MeshPhysicalMaterial({
    color: 0x1b1e24,
    map: leatherTex.map,
    bumpMap: leatherTex.bumpMap,
    bumpScale: 0.014,
    roughness: 0.56,
    metalness: 0.1,
  });

  const balaclavaMat = new THREE.MeshPhysicalMaterial({
    color: 0x16181c,
    map: solidClothTex.map,
    bumpMap: solidClothTex.bumpMap,
    bumpScale: 0.018,
    roughness: 0.84,
    metalness: 0.03,
  });

  const helmetShellMat = new THREE.MeshPhysicalMaterial({
    color: isSeal ? 0xc8b594 : isGsg9 ? 0x38442a : def.secondaryColor,
    map: isSeal ? woodlandCamoTex.map : solidClothTex.map,
    bumpMap: isSeal ? woodlandCamoTex.bumpMap : solidClothTex.bumpMap,
    bumpScale: 0.014,
    roughness: 0.44,
    metalness: 0.18,
    clearcoat: 0.16,
    clearcoatRoughness: 0.34,
  });

  const metalGearMat = new THREE.MeshPhysicalMaterial({
    color: 0x333a42,
    roughness: 0.28,
    metalness: 0.86,
    clearcoat: 0.22,
  });

  const goldFrameMat = new THREE.MeshPhysicalMaterial({
    color: 0xd4af4a,
    roughness: 0.22,
    metalness: 0.9,
  });

  const visorMat = new THREE.MeshPhysicalMaterial({
    color: isElite ? 0x1c140e : isCT ? 0x102438 : 0x1e1812,
    roughness: 0.08,
    metalness: 0.78,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
    iridescence: isElite ? 0.35 : 0.55,
    iridescenceIOR: 1.35,
  });

  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf0ede6, roughness: 0.3 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x1b1715, roughness: 0.18 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x221914, roughness: 0.86, metalness: 0.04 });
  const patchMat = new THREE.MeshStandardMaterial({
    map: isSeal ? textures.createPolicePatchTexture() : textures.createFactionPatchTexture(def.team),
    roughness: 0.72,
    metalness: 0.06,
  });

  const root = new THREE.Group();
  const bodyHitMeshes: THREE.Mesh[] = [];

  // Grounded Soft Contact Shadow Disc
  const contactShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 0.95),
    new THREE.MeshBasicMaterial({
      map: textures.createContactShadowTexture(),
      transparent: true,
      depthWrite: false,
      opacity: 0.55,
      polygonOffset: true,
      polygonOffsetFactor: -1,
    })
  );
  contactShadow.rotation.x = -Math.PI / 2;
  contactShadow.position.y = 0.014;
  root.add(contactShadow);

  // Hips / Pelvis Center (~0.92m off ground)
  const hips = new THREE.Group();
  hips.position.y = 0.92;
  root.add(hips);

  const pelvis = new THREE.Mesh(new THREE.CapsuleGeometry(0.145, 0.1, 6, 14), pantsMat);
  pelvis.rotation.z = Math.PI / 2;
  pelvis.scale.set(0.96, 1.0, 0.8);
  pelvis.castShadow = enableShadows;
  pelvis.receiveShadow = enableShadows;
  hips.add(pelvis);
  bodyHitMeshes.push(pelvis);

  // Heavy Battle Belt + Metallic Buckle + Pouches
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.168, 0.172, 0.072, 16), bootMat);
  belt.scale.set(1.12, 1, 0.8);
  belt.position.y = 0.042;
  belt.castShadow = enableShadows;
  hips.add(belt);

  const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.056, 0.026), metalGearMat);
  buckle.position.set(0, 0.042, -0.136);
  const buckleTab = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.036, 0.03), accentMat);
  buckleTab.position.set(0, 0.042, -0.14);
  hips.add(buckle, buckleTab);

  if (!isElite) {
    const hipPouch = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.09, 0.075), secondaryMat);
    hipPouch.position.set(-0.165, 0.025, -0.05);
    const dumpPouch = new THREE.Mesh(new THREE.CapsuleGeometry(0.058, 0.055, 4, 10), secondaryMat);
    dumpPouch.scale.set(1.2, 1.0, 0.65);
    dumpPouch.position.set(0.09, -0.02, 0.145);
    hips.add(hipPouch, dumpPouch);
  }

  // Articulated 2-Segment Legs (Thigh + Cargo Pockets + Thigh Holster + Optional Knee Pads + Shin + Laced Combat Boots)
  const kneePadGeo = createKneePadGeo();
  const makeLeg = (side: -1 | 1) => {
    const hipGroup = new THREE.Group();
    hipGroup.position.set(side * 0.105, -0.04, 0);

    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.078, 0.27, 6, 14), pantsMat);
    thigh.position.y = -0.21;
    thigh.castShadow = enableShadows;
    thigh.receiveShadow = enableShadows;
    hipGroup.add(thigh);
    bodyHitMeshes.push(thigh);

    // Side BDU cargo pocket with flap
    if (!isElite) {
      const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.145, 0.105), pantsMat);
      pocket.position.set(side * 0.07, -0.22, 0);
      const pocketFlap = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.035, 0.11), pantsMat);
      pocketFlap.position.set(side * 0.072, -0.16, 0);
      hipGroup.add(pocket, pocketFlap);
    }

    // Drop-leg holster on right thigh (authentic CS 1.6 silhouette across CT & Phoenix/Elite)
    if (side === 1 && !isGuerilla && !isArctic) {
      const dropStrap = new THREE.Mesh(new THREE.CylinderGeometry(0.083, 0.083, 0.028, 12), bootMat);
      dropStrap.position.y = -0.18;
      const holsterShell = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.145, 0.082), bootMat);
      holsterShell.position.set(0.086, -0.18, -0.01);
      const pistolSlide = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.09, 0.038), metalGearMat);
      pistolSlide.position.set(0.088, -0.11, -0.015);
      const pistolGrip = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.062, 0.036), gloveMat);
      pistolGrip.rotation.x = 0.38;
      pistolGrip.position.set(0.088, -0.08, 0.02);
      hipGroup.add(dropStrap, holsterShell, pistolSlide, pistolGrip);
    }

    // Knee Joint Pivot
    const kneeGroup = new THREE.Group();
    kneeGroup.position.set(0, -0.42, 0);
    hipGroup.add(kneeGroup);

    // Heavy tactical knee pads on Counter-Terrorists (especially prominent on GSG-9)
    if (isCT) {
      const kneePadMat = isGsg9 || isSas ? bootMat : secondaryMat;
      const kneePad = new THREE.Mesh(kneePadGeo, kneePadMat);
      kneePad.position.set(0, 0, -0.068);
      kneePad.scale.setScalar(isGsg9 ? 1.18 : 1.0);
      kneePad.castShadow = enableShadows;
      const kneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.042, 10, 8), bootMat);
      kneeCap.scale.set(1.1, 0.9, 0.45);
      kneeCap.position.set(0, 0, -0.08);
      const kneeStrap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.028, 12), bootMat);
      kneeGroup.add(kneePad, kneeCap, kneeStrap);
    }

    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.065, 0.25, 6, 14), pantsMat);
    shin.position.y = -0.2;
    shin.castShadow = enableShadows;
    shin.receiveShadow = enableShadows;
    kneeGroup.add(shin);
    bodyHitMeshes.push(shin);

    // Multi-Part Lace-up Combat Boot
    const bootGroup = new THREE.Group();
    bootGroup.position.set(0, -0.4, 0);

    const bootShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.064, 0.16, 14), bootMat);
    bootShaft.position.y = 0.045;
    bootShaft.castShadow = enableShadows;

    const bootBody = new THREE.Mesh(new THREE.CapsuleGeometry(0.061, 0.095, 6, 12), bootMat);
    bootBody.rotation.x = Math.PI / 2;
    bootBody.scale.set(1.06, 1.0, 0.74);
    bootBody.position.set(0, -0.022, -0.045);
    bootBody.castShadow = enableShadows;

    const toeCap = new THREE.Mesh(new THREE.SphereGeometry(0.056, 10, 8), bootMat);
    toeCap.scale.set(1.05, 0.65, 1.15);
    toeCap.position.set(0, -0.028, -0.105);

    const sole = new THREE.Mesh(new THREE.BoxGeometry(0.128, 0.032, 0.24), metalGearMat);
    sole.position.set(0, -0.048, -0.044);

    const laces = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.11, 0.025), metalGearMat);
    laces.rotation.x = -0.2;
    laces.position.set(0, 0.03, -0.066);

    bootGroup.add(bootShaft, bootBody, toeCap, sole, laces);
    kneeGroup.add(bootGroup);

    return { hipGroup, kneeGroup };
  };

  const leftLegData = makeLeg(-1);
  const rightLegData = makeLeg(1);
  const leftLeg = leftLegData.hipGroup;
  const leftKnee = leftLegData.kneeGroup;
  const rightLeg = rightLegData.hipGroup;
  const rightKnee = rightLegData.kneeGroup;
  hips.add(leftLeg, rightLeg);

  // Sculpted Torso & Unit-Specific Shirt / Tactical Vest / Web Harness
  const torso = new THREE.Group();
  torso.position.y = 0.08;
  hips.add(torso);

  const abdomen = new THREE.Mesh(new THREE.CylinderGeometry(0.168, 0.146, 0.23, 14), shirtMat);
  abdomen.scale.set(1.12, 1, 0.8);
  abdomen.position.y = 0.12;
  abdomen.castShadow = enableShadows;
  torso.add(abdomen);
  bodyHitMeshes.push(abdomen);

  const chest = new THREE.Mesh(new THREE.CapsuleGeometry(0.175, 0.165, 8, 16), shirtMat);
  chest.rotation.z = Math.PI / 2;
  chest.scale.set(1.06, 1.0, 0.8);
  chest.position.y = 0.34;
  chest.castShadow = enableShadows;
  chest.receiveShadow = enableShadows;
  torso.add(chest);
  bodyHitMeshes.push(chest);

  if (isElite) {
    // Elite Crew: Crisp Olive Collared Button-Up Shirt (NO heavy ballistic vest)
    const collarL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.045), shirtMat);
    collarL.rotation.set(0.3, 0, -0.45);
    collarL.position.set(-0.052, 0.48, -0.055);
    const collarR = collarL.clone();
    collarR.rotation.z = 0.45;
    collarR.position.x = 0.052;
    const collarBack = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.045, 12), shirtMat);
    collarBack.position.set(0, 0.49, 0.01);
    const placket = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.36, 0.015), accentMat);
    placket.position.set(0, 0.28, -0.142);
    const shirtPocket = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.018), shirtMat);
    shirtPocket.position.set(0.082, 0.34, -0.138);
    torso.add(collarL, collarR, collarBack, placket, shirtPocket);
  } else if (isArctic) {
    // Arctic Avengers: Slim Black Chest Web Harness over Snow-Camo Winter Jacket
    [-0.082, 0.082].forEach((sx) => {
      const strapF = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.36, 0.025), secondaryMat);
      strapF.position.set(sx, 0.29, -0.14);
      const strapB = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.36, 0.025), secondaryMat);
      strapB.position.set(sx, 0.29, 0.14);
      const topLink = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.032, 0.28), secondaryMat);
      topLink.position.set(sx, 0.47, 0);
      torso.add(strapF, strapB, topLink);
    });
    const chestBand = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.052, 0.28), secondaryMat);
    chestBand.position.set(0, 0.18, 0);
    torso.add(chestBand);
    [-0.09, 0.09].forEach((px) => {
      const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.105, 0.048), secondaryMat);
      pouch.position.set(px, 0.18, -0.156);
      torso.add(pouch);
    });
  } else {
    // Beveled SAPI Tactical Armor Vest (CT units + Phoenix Connexion + Guerilla Warfare)
    const sapiGeo = createSapiPlateGeo(0.285, 0.32, 0.044);
    const frontPlate = new THREE.Mesh(sapiGeo, secondaryMat);
    frontPlate.position.set(0, 0.295, -0.125);
    frontPlate.castShadow = enableShadows;
    const backPlate = new THREE.Mesh(sapiGeo, secondaryMat);
    backPlate.position.set(0, 0.295, 0.125);
    backPlate.castShadow = enableShadows;
    torso.add(frontPlate, backPlate);
    bodyHitMeshes.push(frontPlate);

    // Shoulder carrier straps
    [-0.122, 0.122].forEach((sx) => {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.042, 0.265), secondaryMat);
      strap.position.set(sx, 0.468, 0);
      const buckleRing = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.02, 0.026), metalGearMat);
      buckleRing.position.set(sx, 0.435, -0.132);
      torso.add(strap, buckleRing);
    });

    if (isCT) {
      const collar = new THREE.Mesh(
        new THREE.TorusGeometry(0.115, 0.022, 8, 18, Math.PI * 1.45),
        secondaryMat
      );
      collar.rotation.x = Math.PI / 2;
      collar.rotation.z = -Math.PI * 0.22;
      collar.position.set(0, 0.475, 0.01);
      torso.add(collar);
    }

    // Chest Patch: "POLICE" stencil on SEAL Team 6, Unit Morale Patch on others
    const adminPouch = new THREE.Mesh(new THREE.BoxGeometry(0.145, 0.088, 0.036), secondaryMat);
    adminPouch.position.set(0, 0.36, -0.156);
    const moralePatch = new THREE.Mesh(
      new THREE.PlaneGeometry(isSeal ? 0.125 : 0.084, isSeal ? 0.046 : 0.052),
      patchMat
    );
    moralePatch.rotation.y = Math.PI;
    moralePatch.position.set(0, 0.362, -0.176);
    torso.add(adminPouch, moralePatch);

    // Front Magazine & Utility Pouches (heavy 4-pouch chest rig on GIGN/GSG-9/SAS/Guerilla)
    [-0.088, 0, 0.088].forEach((px) => {
      const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.122, 0.052), secondaryMat);
      pouch.position.set(px, 0.195, -0.162);
      const flap = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.034, 0.056), accentMat);
      flap.position.set(px, 0.238, -0.164);
      torso.add(pouch, flap);
    });

    if (isCT) {
      const radio = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.11, 0.042), metalGearMat);
      radio.position.set(-0.148, 0.37, -0.115);
      const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.007, 0.19, 6), metalGearMat);
      antenna.position.set(-0.162, 0.5, -0.115);
      torso.add(radio, antenna);
    }

    const pack = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.135, 6, 12), secondaryMat);
    pack.scale.set(1.1, 1.0, 0.62);
    pack.position.set(0, 0.295, 0.18);
    pack.castShadow = enableShadows;
    torso.add(pack);
  }

  // Neck + Sculpted Head & Class-Accurate Headgear
  const head = new THREE.Group();
  head.position.y = 0.51;
  torso.add(head);

  const isHoodedHead = isPhoenix || isArctic || isSas || isGign || isSeal || isGsg9;
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.068, 0.11, 12),
    isPhoenix || isArctic || isSas || isGign ? balaclavaMat : skinMat
  );
  neck.position.y = 0.04;
  head.add(neck);

  const headMat = isHoodedHead ? balaclavaMat : skinMat;
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.115, 18, 16), headMat);
  headMesh.scale.set(0.92, 1.12, 1.0);
  headMesh.position.y = 0.18;
  headMesh.castShadow = enableShadows;
  head.add(headMesh);

  const jaw = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.055, 6, 12), headMat);
  jaw.rotation.x = Math.PI / 6;
  jaw.position.set(0, 0.125, -0.025);
  head.add(jaw);

  // Sculpted Ears
  [-0.098, 0.098].forEach((ex) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.026, 8, 8), headMat);
    ear.scale.set(0.45, 1.15, 0.8);
    ear.position.set(ex, 0.178, 0.005);
    head.add(ear);
  });

  const addEyes = (yOff: number, zOff: number) => {
    [-0.035, 0.035].forEach((ex) => {
      const eyeW = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), eyeWhiteMat);
      eyeW.scale.set(1.2, 0.72, 0.6);
      eyeW.position.set(ex, yOff, zOff);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), pupilMat);
      pupil.position.set(ex, yOff, zOff - 0.008);
      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.008, 0.014), hairMat);
      brow.rotation.z = ex < 0 ? 0.1 : -0.1;
      brow.position.set(ex, yOff + 0.018, zOff - 0.006);
      head.add(eyeW, pupil, brow);
    });
  };

  if (isPhoenix || isArctic) {
    // Clean CS 1.6 Black Balaclava with narrow eye opening (NO ski goggles on forehead)
    const eyeSlot = new THREE.Mesh(new THREE.BoxGeometry(0.114, 0.04, 0.032), skinMat);
    eyeSlot.position.set(0, 0.185, -0.095);
    addEyes(0.185, -0.106);
    head.add(eyeSlot);
    if (isPhoenix) {
      // Subtle stitched mouth slit on Phoenix balaclava
      const mouthSlit = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.012, 0.015), skinMat);
      mouthSlit.position.set(0, 0.125, -0.098);
      head.add(mouthSlit);
    }
  } else if (isElite) {
    // Elite Crew: Spiked Flat-Top Dark Hair + Gold-Framed Aviator Sunglasses + Goatee
    addEyes(0.184, -0.101);
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.036, 0.03), skinMat);
    nose.position.set(0, 0.166, -0.11);
    // Flat-top dark hair crown
    const hairCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.104, 0.108, 0.075, 14), hairMat);
    hairCrown.position.set(0, 0.275, 0.008);
    const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.108, 12, 10, 0, Math.PI * 2, 0, Math.PI * 0.52), hairMat);
    hairBack.position.set(0, 0.215, 0.012);
    // Gold aviator sunglasses (twin lenses + gold bridge)
    [-0.038, 0.038].forEach((gx) => {
      const rim = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.036, 0.018), goldFrameMat);
      rim.position.set(gx, 0.186, -0.112);
      const lens = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.028, 0.021), visorMat);
      lens.position.set(gx, 0.186, -0.114);
      head.add(rim, lens);
    });
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.008, 0.016), goldFrameMat);
    bridge.position.set(0, 0.194, -0.114);
    const goatee = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.028, 4, 8), hairMat);
    goatee.position.set(0, 0.105, -0.088);
    head.add(nose, hairCrown, hairBack, bridge, goatee);
  } else if (isGuerilla) {
    // Guerilla Warfare: Crimson-Red Headband + Rear Tails + Full Beard + Tousled Dark Hair
    addEyes(0.185, -0.102);
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.024, 0.038, 0.03), skinMat);
    nose.position.set(0, 0.168, -0.112);
    const beard = new THREE.Mesh(new THREE.CapsuleGeometry(0.072, 0.042, 4, 10), hairMat);
    beard.position.set(0, 0.11, -0.032);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.114, 0.116, 0.052, 14), headbandMat);
    band.position.set(0, 0.225, 0);
    [-0.024, 0.024].forEach((tx, idx) => {
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.022, 0.15, 6), headbandMat);
      tail.rotation.set(Math.PI * 0.72, 0, (idx === 0 ? -1 : 1) * 0.22);
      tail.position.set(tx, 0.185, 0.145);
      head.add(tail);
    });
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), hairMat);
    hair.scale.set(0.94, 0.68, 1.0);
    hair.position.set(0, 0.25, 0.005);
    head.add(nose, beard, band, hair);
  } else if (isSas) {
    // SAS (Top #1): Integrated Black Respirator Hood (NO Helmet) + Twin Round Goggles + Twin Filter Canisters
    const hoodRidge = new THREE.Mesh(new THREE.SphereGeometry(0.122, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), balaclavaMat);
    hoodRidge.position.set(0, 0.19, 0.006);
    hoodRidge.castShadow = enableShadows;
    head.add(hoodRidge);

    // Twin round S10 gas-mask eyepieces
    [-0.04, 0.04].forEach((ex) => {
      const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.026, 14), metalGearMat);
      bezel.rotation.x = Math.PI / 2;
      bezel.position.set(ex, 0.186, -0.108);
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.03, 14), visorMat);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(ex, 0.186, -0.11);
      head.add(bezel, lens);
    });

    const maskSnout = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.048, 0.068, 12), bootMat);
    maskSnout.rotation.x = Math.PI / 2;
    maskSnout.position.set(0, 0.128, -0.112);
    const filterL = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.056, 12), metalGearMat);
    filterL.rotation.set(Math.PI / 2, 0, -0.35);
    filterL.position.set(-0.062, 0.122, -0.126);
    const filterR = filterL.clone();
    filterR.rotation.z = 0.35;
    filterR.position.x = 0.062;
    head.add(maskSnout, filterL, filterR);
  } else if (isGign) {
    // GIGN (Top #2): Charcoal Knit Balaclava / Watch-Cap Hood + Exposed Eyes (NO heavy helmet)
    const knitCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.122, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
      balaclavaMat
    );
    knitCap.position.set(0, 0.2, 0.005);
    const knitBand = new THREE.Mesh(new THREE.TorusGeometry(0.112, 0.018, 8, 18), balaclavaMat);
    knitBand.rotation.x = Math.PI / 2;
    knitBand.position.set(0, 0.218, 0);
    const eyeSlot = new THREE.Mesh(new THREE.BoxGeometry(0.114, 0.04, 0.03), skinMat);
    eyeSlot.position.set(0, 0.182, -0.096);
    addEyes(0.182, -0.106);
    head.add(knitCap, knitBand, eyeSlot);
  } else {
    // SEAL Team 6 (Top #4, desert camo helmet) & GSG-9 (Top #3, olive PASGT helmet)
    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.134, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.6),
      helmetShellMat
    );
    helmet.position.set(0, 0.19, 0.008);
    helmet.castShadow = enableShadows;
    head.add(helmet);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.012, 6, 20), bootMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 0.19, 0.008);
    head.add(rim);

    // Side tactical headset earcups + boom mic
    [-0.125, 0.125].forEach((cx) => {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.022, 12), bootMat);
      cup.rotation.z = Math.PI / 2;
      cup.position.set(cx, 0.175, 0.005);
      head.add(cup);
    });
    const boomCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.122, 0.16, -0.01),
      new THREE.Vector3(-0.095, 0.13, -0.095),
      new THREE.Vector3(-0.03, 0.125, -0.115),
    ]);
    const boomMic = new THREE.Mesh(new THREE.TubeGeometry(boomCurve, 8, 0.005, 6, false), metalGearMat);
    head.add(boomMic);

    const eyeSlot = new THREE.Mesh(new THREE.BoxGeometry(0.114, 0.04, 0.03), skinMat);
    eyeSlot.position.set(0, 0.176, -0.096);
    addEyes(0.176, -0.105);
    const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.148, 0.042, 0.034), visorMat);
    goggles.position.set(0, isGsg9 ? 0.184 : 0.214, -0.114);
    const goggleStrap = new THREE.Mesh(new THREE.CylinderGeometry(0.133, 0.133, 0.024, 16, 1, true), bootMat);
    goggleStrap.position.set(0, isGsg9 ? 0.184 : 0.214, 0.006);
    head.add(eyeSlot, goggles, goggleStrap);
  }

  // Articulated 2-Segment Arms (Bare muscular arms on Guerilla & Phoenix forearms, full sleeves on CT/Elite/Arctic)
  const makeArm = (side: -1 | 1) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.242, 0.41, 0);

    if (isGuerilla) {
      // Bare muscular shoulder & bicep (sleeveless tank top)
      const deltoid = new THREE.Mesh(new THREE.SphereGeometry(0.068, 12, 10), skinMat);
      deltoid.scale.set(0.95, 1.05, 0.95);
      shoulder.add(deltoid);
      const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.056, 0.18, 6, 12), skinMat);
      upper.position.y = -0.13;
      upper.castShadow = enableShadows;
      shoulder.add(upper);
      bodyHitMeshes.push(upper);
    } else if (isPhoenix) {
      // Short navy t-shirt sleeve cap + bare lower bicep
      const sleeveCap = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), shirtMat);
      sleeveCap.scale.set(0.96, 1.05, 0.96);
      const shortSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.058, 0.13, 12), shirtMat);
      shortSleeve.position.y = -0.065;
      const lowerBicep = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.11, 6, 12), skinMat);
      lowerBicep.position.y = -0.17;
      lowerBicep.castShadow = enableShadows;
      shoulder.add(sleeveCap, shortSleeve, lowerBicep);
      bodyHitMeshes.push(lowerBicep);
    } else {
      const sleeveShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.072, 12, 10), shirtMat);
      sleeveShoulder.scale.set(0.96, 1.05, 0.96);
      shoulder.add(sleeveShoulder);

      if (isCT) {
        const shoulderPatch = new THREE.Mesh(new THREE.PlaneGeometry(0.058, 0.058), patchMat);
        shoulderPatch.rotation.y = side * (Math.PI / 2);
        shoulderPatch.position.set(side * 0.064, -0.08, 0);
        shoulder.add(shoulderPatch);
      }

      const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.056, 0.18, 6, 12), shirtMat);
      upper.position.y = -0.13;
      upper.castShadow = enableShadows;
      shoulder.add(upper);
      bodyHitMeshes.push(upper);
    }

    const elbow = new THREE.Group();
    elbow.position.set(0, -0.26, 0);
    shoulder.add(elbow);

    const forearmMat = isGuerilla || isPhoenix ? skinMat : shirtMat;
    if (!isGuerilla && !isPhoenix && !isElite) {
      const elbowPad = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), secondaryMat);
      elbowPad.position.set(0, 0, 0.02);
      elbow.add(elbowPad);
    }

    const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.047, 0.17, 6, 12), forearmMat);
    forearm.position.set(0, -0.12, 0);
    forearm.castShadow = enableShadows;
    elbow.add(forearm);

    // Wristwatch on Left Wrist
    if (side === -1) {
      const watchStrap = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.02, 10), bootMat);
      watchStrap.position.set(0, -0.215, 0);
      const watchFace = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.024, 0.014), metalGearMat);
      watchFace.position.set(-0.04, -0.215, 0);
      elbow.add(watchStrap, watchFace);
    }

    // Tactical Gloves (Fingerless skin fingers on Terrorists Phoenix/Elite/Guerilla, full gloves on CT & Arctic)
    const isFingerless = isPhoenix || isElite || isGuerilla;
    const fingerMat = isFingerless ? skinMat : gloveMat;
    const gloveGroup = new THREE.Group();
    gloveGroup.position.set(0, -0.25, 0);
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.072, 0.045), gloveMat);
    const knucklePlate = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.024, 0.02), metalGearMat);
    knucklePlate.position.set(side * 0.008, -0.015, -0.018);
    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.026, 4, 6), fingerMat);
    thumb.rotation.z = side * -0.5;
    thumb.position.set(-side * 0.032, -0.01, -0.014);
    const fingers = new THREE.Mesh(new THREE.CapsuleGeometry(0.022, 0.036, 4, 8), fingerMat);
    fingers.rotation.z = Math.PI / 2;
    fingers.position.set(0, -0.048, -0.006);
    gloveGroup.add(palm, knucklePlate, thumb, fingers);
    elbow.add(gloveGroup);

    return { shoulder, elbow };
  };

  const leftArmData = makeArm(-1);
  const rightArmData = makeArm(1);
  const leftArm = leftArmData.shoulder;
  const leftElbow = leftArmData.elbow;
  const rightArm = rightArmData.shoulder;
  const rightElbow = rightArmData.elbow;

  // Natural two-handed tactical rifle ready stance
  rightArm.rotation.set(0.45, -0.1, -0.12);
  rightElbow.rotation.set(1.05, 0, 0);

  leftArm.rotation.set(0.58, 0.42, 0.12);
  leftElbow.rotation.set(1.12, 0, 0);

  torso.add(leftArm, rightArm);

  // Weapon mount anchored to torso forward aim plane
  const weaponMount = new THREE.Group();
  weaponMount.position.set(0.12, 0.25, -0.28);
  torso.add(weaponMount);

  const muzzlePoint = new THREE.Object3D();
  muzzlePoint.position.set(0, 0.025, -0.62);
  weaponMount.add(muzzlePoint);

  // 3D Muzzle Flash Burst Star anchored at muzzlePoint (flashes during firing!)
  const muzzleFlash = new THREE.Group();
  const flashMat = new THREE.MeshBasicMaterial({
    color: 0xffcf70,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
  });
  for (let i = 0; i < 3; i++) {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.22, 5), flashMat);
    spike.rotation.z = (i * Math.PI) / 3;
    spike.rotation.x = Math.PI / 2;
    muzzleFlash.add(spike);
  }
  const coreGlow = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff5d4 }));
  muzzleFlash.add(coreGlow);
  muzzleFlash.visible = false;
  muzzlePoint.add(muzzleFlash);

  const chosenWeapon = weaponId || def.defaultWeapon;
  const wModel = buildWeaponModel(chosenWeapon, chosenWeapon === 'm4a1' || chosenWeapon === 'usp');
  wModel.scale.setScalar(1.12);
  weaponMount.add(wModel);
  alignMuzzlePoint(muzzlePoint, chosenWeapon);

  return {
    root,
    hips,
    torso,
    head,
    leftArm,
    leftElbow,
    rightArm,
    rightElbow,
    leftLeg,
    leftKnee,
    rightLeg,
    rightKnee,
    weaponMount,
    headMesh,
    bodyHitMeshes,
    muzzlePoint,
    muzzleFlash,
    contactShadow,
  };
}

function alignMuzzlePoint(muzzlePoint: THREE.Object3D, weaponId: WeaponId): void {
  const barrelZ: Partial<Record<WeaponId, number>> = {
    awp: -0.96,
    scout: -0.88,
    ak47: -0.74,
    m4a1: -0.76,
    sg552: -0.72,
    aug: -0.68,
    galil: -0.72,
    famas: -0.66,
    m249: -0.82,
    xm1014: -0.74,
    p90: -0.5,
    mp5: -0.58,
    ump45: -0.56,
    mac10: -0.44,
    deagle: -0.42,
    usp: -0.45,
    glock18: -0.38,
    knife: -0.34,
  };
  muzzlePoint.position.set(0, 0.028, barrelZ[weaponId] ?? -0.62);
}

export function setCharacterWeapon(rig: CharacterRig, weaponId: WeaponId): void {
  for (let i = rig.weaponMount.children.length - 1; i >= 0; i--) {
    const child = rig.weaponMount.children[i];
    if (child !== rig.muzzlePoint) {
      rig.weaponMount.remove(child);
    }
  }
  if (!rig.weaponMount.children.includes(rig.muzzlePoint)) {
    rig.weaponMount.add(rig.muzzlePoint);
  }
  const model = buildWeaponModel(weaponId, weaponId === 'm4a1' || weaponId === 'usp');
  model.scale.setScalar(1.12);
  rig.weaponMount.add(model);
  alignMuzzlePoint(rig.muzzlePoint, weaponId);
}

import { updateBlendedCharacterPose } from './animation/CharacterAnimator';

/**
 * Full-body articulated animation state machine supporting smooth damped blending across:
 * Idle breathing, Walk, Run/Sprint with authentic knee bending & arm counter-swing,
 * Crouch tuck, Airborne Jump tuck, Landing cushion, Weapon recoil, Aim Pitch,
 * 3D Third-Person Muzzle Flash, Reload hand motion, Bullet Hit Flinch, and 4 Death Styles.
 */
export function animateCharacterPose(
  rig: CharacterRig,
  time: number,
  speedRatio: number,
  crouching: boolean,
  recoilKick = 0,
  dead = false,
  deathProgress = 0,
  opts: CharacterAnimOptions = {}
): void {
  updateBlendedCharacterPose(rig, time, speedRatio, crouching, recoilKick, dead, deathProgress, opts);
}
