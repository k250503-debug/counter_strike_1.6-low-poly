import * as THREE from 'three';
import { disposeObjectSubtree } from '../utils/threeDisposal';
import { updateBlendedCharacterPose } from './animation/CharacterAnimator';
import { textures } from './ProceduralTextures';
import { CHARACTER_CLASSES } from './WeaponDatabase';
import { buildWeaponModel, getWeaponViewMeta, SHARED_WEAPON_MATERIALS } from './WeaponModels';
import { CharacterClassId, WeaponId } from './types';

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
  dt?: number;
  sprint?: boolean;
}

/**
 * Shared sculpted anatomical meshes for cartoon-realistic character silhouettes.
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

function createSculptedTorsoGeo(): THREE.LatheGeometry {
  // Waist -> Athletic Ribcage -> Trapezius Taper
  const pts = [
    new THREE.Vector2(0.001, 0.0),
    new THREE.Vector2(0.145, 0.02),
    new THREE.Vector2(0.156, 0.14),
    new THREE.Vector2(0.184, 0.28),
    new THREE.Vector2(0.194, 0.39),
    new THREE.Vector2(0.165, 0.47),
    new THREE.Vector2(0.075, 0.51),
    new THREE.Vector2(0.001, 0.52),
  ];
  const geo = new THREE.LatheGeometry(pts, 18);
  geo.scale(1.1, 1.0, 0.78);
  return geo;
}

function createSculptedShinGeo(): THREE.LatheGeometry {
  // Knee -> Muscular Calf -> Boot Ankle
  const pts = [
    new THREE.Vector2(0.052, -0.37),
    new THREE.Vector2(0.064, -0.26),
    new THREE.Vector2(0.076, -0.14),
    new THREE.Vector2(0.072, -0.04),
    new THREE.Vector2(0.064, 0.03),
  ];
  return new THREE.LatheGeometry(pts, 14);
}

function createSculptedForearmGeo(): THREE.LatheGeometry {
  const pts = [
    new THREE.Vector2(0.038, -0.23),
    new THREE.Vector2(0.045, -0.16),
    new THREE.Vector2(0.056, -0.07),
    new THREE.Vector2(0.052, 0.01),
  ];
  return new THREE.LatheGeometry(pts, 14);
}

/**
 * Builds a high-fidelity cartoon-realistic military operative rig with:
 * - Sculpted anatomical torso, limbs, face (brow, nose, lips, iris/cornea eyes, ears)
 * - Normal-mapped ripstop/camo/MOLLE fabrics, leather gear, & SSS-warmth skin
 * - Class-authentic headgear, headsets, visors, masks, & battle harnesses
 * - Properly modeled 5-finger articulated tactical hands/gloves
 * - Smooth contact shadow & crossed radial weapon muzzle flash
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

  const solidClothTex = textures.getCharacterTexturePair('ripstop_solid');
  const urbanCamoTex = textures.getCharacterTexturePair('urban_camo');
  const woodlandCamoTex = textures.getCharacterTexturePair('woodland_camo');
  const arcticCamoTex = textures.getCharacterTexturePair('arctic_camo');
  const kevlarTex = textures.getCharacterTexturePair('kevlar_molle');
  const leatherTex = textures.getCharacterTexturePair('leather');
  const skinTex = textures.createSkinTexture(def.skinColor);

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
    normalMap: shirtTex.normalMap,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughnessMap: shirtTex.roughnessMap,
    roughness: 0.78,
    metalness: 0.04,
    sheen: 0.42,
    sheenRoughness: 0.65,
    sheenColor: new THREE.Color(def.primaryColor).lerp(new THREE.Color(0xffffff), 0.32),
  });

  const pantsMat = new THREE.MeshPhysicalMaterial({
    color: pantsColorHex,
    map: pantsTex.map,
    normalMap: pantsTex.normalMap,
    normalScale: new THREE.Vector2(0.88, 0.88),
    roughnessMap: pantsTex.roughnessMap,
    roughness: 0.8,
    metalness: 0.04,
    sheen: 0.35,
    sheenRoughness: 0.7,
    sheenColor: new THREE.Color(pantsColorHex).lerp(new THREE.Color(0xffffff), 0.28),
  });

  const secondaryMat = new THREE.MeshPhysicalMaterial({
    color: def.secondaryColor,
    map: kevlarTex.map,
    normalMap: kevlarTex.normalMap,
    normalScale: new THREE.Vector2(1.0, 1.0),
    roughnessMap: kevlarTex.roughnessMap,
    roughness: 0.56,
    metalness: 0.14,
    clearcoat: 0.08,
    clearcoatRoughness: 0.58,
  });

  const accentMat = new THREE.MeshPhysicalMaterial({
    color: isPhoenix || isGign || isSeal || isGsg9 || isSas ? 0x262a2e : def.accentColor,
    map: kevlarTex.map,
    normalMap: kevlarTex.normalMap,
    normalScale: new THREE.Vector2(0.85, 0.85),
    roughness: 0.54,
    metalness: 0.18,
  });

  const headbandMat = new THREE.MeshPhysicalMaterial({
    color: 0xb82924,
    map: solidClothTex.map,
    normalMap: solidClothTex.normalMap,
    normalScale: new THREE.Vector2(0.75, 0.75),
    roughness: 0.76,
    metalness: 0.02,
    sheen: 0.35,
  });

  const skinMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: skinTex,
    roughness: 0.48,
    metalness: 0.02,
    sheen: 0.28,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color(0xffbfa0),
    clearcoat: 0.05,
    clearcoatRoughness: 0.45,
  });

  const lipMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(def.skinColor).lerp(new THREE.Color(0x9e544b), 0.45),
    roughness: 0.46,
  });

  const bootMat = new THREE.MeshPhysicalMaterial({
    color: isElite ? 0x4b3522 : 0x181a1f,
    map: leatherTex.map,
    normalMap: leatherTex.normalMap,
    normalScale: new THREE.Vector2(0.9, 0.9),
    roughnessMap: leatherTex.roughnessMap,
    roughness: 0.42,
    metalness: 0.16,
    clearcoat: 0.18,
    clearcoatRoughness: 0.42,
  });

  const gloveMat = new THREE.MeshPhysicalMaterial({
    color: 0x1b1e24,
    map: leatherTex.map,
    normalMap: leatherTex.normalMap,
    normalScale: new THREE.Vector2(0.8, 0.8),
    roughness: 0.52,
    metalness: 0.12,
  });

  const balaclavaMat = new THREE.MeshPhysicalMaterial({
    color: 0x17191e,
    map: solidClothTex.map,
    normalMap: solidClothTex.normalMap,
    normalScale: new THREE.Vector2(0.9, 0.9),
    roughness: 0.82,
    metalness: 0.03,
    sheen: 0.32,
  });

  const helmetShellMat = new THREE.MeshPhysicalMaterial({
    color: isSeal ? 0xc8b594 : isGsg9 ? 0x38442a : def.secondaryColor,
    map: isSeal ? woodlandCamoTex.map : solidClothTex.map,
    normalMap: isSeal ? woodlandCamoTex.normalMap : solidClothTex.normalMap,
    normalScale: new THREE.Vector2(0.6, 0.6),
    roughness: 0.42,
    metalness: 0.18,
    clearcoat: 0.2,
    clearcoatRoughness: 0.32,
  });

  const metalGearMat = new THREE.MeshPhysicalMaterial({
    color: 0x343c44,
    roughness: 0.26,
    metalness: 0.88,
    clearcoat: 0.24,
  });

  const goldFrameMat = new THREE.MeshPhysicalMaterial({
    color: 0xd9b34d,
    roughness: 0.2,
    metalness: 0.92,
  });

  const visorMat = new THREE.MeshPhysicalMaterial({
    color: isElite ? 0x1e160f : isCT ? 0x112840 : 0x201912,
    roughness: 0.06,
    metalness: 0.8,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    iridescence: isElite ? 0.38 : 0.6,
    iridescenceIOR: 1.38,
  });

  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.22 });
  const irisMat = new THREE.MeshStandardMaterial({ color: isCT ? 0x3a6484 : 0x523926, roughness: 0.24 });
  const pupilMat = new THREE.MeshPhysicalMaterial({
    color: 0x0f0f12,
    roughness: 0.1,
    clearcoat: 0.9,
  });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x221914, roughness: 0.82, metalness: 0.05 });
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
      opacity: 0.56,
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

  const pelvis = new THREE.Mesh(new THREE.CapsuleGeometry(0.142, 0.1, 8, 16), pantsMat);
  pelvis.rotation.z = Math.PI / 2;
  pelvis.scale.set(0.96, 1.0, 0.8);
  pelvis.castShadow = enableShadows;
  pelvis.receiveShadow = enableShadows;
  hips.add(pelvis);
  bodyHitMeshes.push(pelvis);

  // Heavy Battle Belt + Metallic Buckle + Pouches
  const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.168, 0.172, 0.072, 18), bootMat);
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
    const hipPouch = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.092, 0.078), secondaryMat);
    hipPouch.position.set(-0.165, 0.025, -0.05);
    const dumpPouch = new THREE.Mesh(new THREE.CapsuleGeometry(0.058, 0.055, 6, 12), secondaryMat);
    dumpPouch.scale.set(1.2, 1.0, 0.65);
    dumpPouch.position.set(0.09, -0.02, 0.145);
    hips.add(hipPouch, dumpPouch);
  }

  // Sculpted 2-Segment Legs
  const kneePadGeo = createKneePadGeo();
  const shinGeo = createSculptedShinGeo();
  const makeLeg = (side: -1 | 1) => {
    const hipGroup = new THREE.Group();
    hipGroup.position.set(side * 0.105, -0.04, 0);

    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.078, 0.27, 8, 16), pantsMat);
    thigh.position.y = -0.21;
    thigh.castShadow = enableShadows;
    thigh.receiveShadow = enableShadows;
    hipGroup.add(thigh);
    bodyHitMeshes.push(thigh);

    if (!isElite) {
      const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.145, 0.105), pantsMat);
      pocket.position.set(side * 0.07, -0.22, 0);
      const pocketFlap = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.035, 0.11), pantsMat);
      pocketFlap.position.set(side * 0.072, -0.16, 0);
      hipGroup.add(pocket, pocketFlap);
    }

    if (side === 1 && !isGuerilla && !isArctic) {
      const dropStrap = new THREE.Mesh(new THREE.CylinderGeometry(0.083, 0.083, 0.028, 14), bootMat);
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

    const kneeGroup = new THREE.Group();
    kneeGroup.position.set(0, -0.42, 0);
    hipGroup.add(kneeGroup);

    if (isCT) {
      const kneePadMat = isGsg9 || isSas ? bootMat : secondaryMat;
      const kneePad = new THREE.Mesh(kneePadGeo, kneePadMat);
      kneePad.position.set(0, 0, -0.068);
      kneePad.scale.setScalar(isGsg9 ? 1.18 : 1.0);
      kneePad.castShadow = enableShadows;
      const kneeCap = new THREE.Mesh(new THREE.SphereGeometry(0.042, 12, 10), bootMat);
      kneeCap.scale.set(1.1, 0.9, 0.45);
      kneeCap.position.set(0, 0, -0.08);
      const kneeStrap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.028, 14), bootMat);
      kneeGroup.add(kneePad, kneeCap, kneeStrap);
    }

    const shin = new THREE.Mesh(shinGeo, pantsMat);
    shin.castShadow = enableShadows;
    shin.receiveShadow = enableShadows;
    kneeGroup.add(shin);
    bodyHitMeshes.push(shin);

    // Multi-Part Lace-up Combat Boot with treaded heel/sole
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

    const toeCap = new THREE.Mesh(new THREE.SphereGeometry(0.056, 12, 10), bootMat);
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

  // Sculpted Anatomical Torso (LatheGeometry ribcage + chest/collar + SAPI vest)
  const torso = new THREE.Group();
  torso.position.y = 0.08;
  hips.add(torso);

  const sculptedTorso = new THREE.Mesh(createSculptedTorsoGeo(), shirtMat);
  sculptedTorso.castShadow = enableShadows;
  sculptedTorso.receiveShadow = enableShadows;
  torso.add(sculptedTorso);
  bodyHitMeshes.push(sculptedTorso);

  if (isElite) {
    const collarL = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.045), shirtMat);
    collarL.rotation.set(0.3, 0, -0.45);
    collarL.position.set(-0.052, 0.48, -0.055);
    const collarR = collarL.clone();
    collarR.rotation.z = 0.45;
    collarR.position.x = 0.052;
    const collarBack = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.095, 0.045, 14), shirtMat);
    collarBack.position.set(0, 0.49, 0.01);
    const placket = new THREE.Mesh(new THREE.BoxGeometry(0.028, 0.36, 0.015), accentMat);
    placket.position.set(0, 0.28, -0.145);
    const shirtPocket = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.018), shirtMat);
    shirtPocket.position.set(0.082, 0.34, -0.142);
    torso.add(collarL, collarR, collarBack, placket, shirtPocket);
  } else if (isArctic) {
    [-0.082, 0.082].forEach((sx) => {
      const strapF = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.36, 0.025), secondaryMat);
      strapF.position.set(sx, 0.29, -0.145);
      const strapB = new THREE.Mesh(new THREE.BoxGeometry(0.046, 0.36, 0.025), secondaryMat);
      strapB.position.set(sx, 0.29, 0.145);
      const topLink = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.032, 0.28), secondaryMat);
      topLink.position.set(sx, 0.47, 0);
      torso.add(strapF, strapB, topLink);
    });
    const chestBand = new THREE.Mesh(new THREE.BoxGeometry(0.33, 0.052, 0.29), secondaryMat);
    chestBand.position.set(0, 0.18, 0);
    torso.add(chestBand);
    [-0.09, 0.09].forEach((px) => {
      const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.105, 0.048), secondaryMat);
      pouch.position.set(px, 0.18, -0.16);
      torso.add(pouch);
    });
  } else {
    const sapiGeo = createSapiPlateGeo(0.29, 0.325, 0.044);
    const frontPlate = new THREE.Mesh(sapiGeo, secondaryMat);
    frontPlate.position.set(0, 0.295, -0.13);
    frontPlate.castShadow = enableShadows;
    const backPlate = new THREE.Mesh(sapiGeo, secondaryMat);
    backPlate.position.set(0, 0.295, 0.13);
    backPlate.castShadow = enableShadows;
    torso.add(frontPlate, backPlate);
    bodyHitMeshes.push(frontPlate);

    [-0.122, 0.122].forEach((sx) => {
      const strap = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.042, 0.275), secondaryMat);
      strap.position.set(sx, 0.468, 0);
      const buckleRing = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.02, 0.026), metalGearMat);
      buckleRing.position.set(sx, 0.435, -0.136);
      torso.add(strap, buckleRing);
    });

    if (isCT) {
      const collar = new THREE.Mesh(
        new THREE.TorusGeometry(0.115, 0.022, 10, 20, Math.PI * 1.45),
        secondaryMat
      );
      collar.rotation.x = Math.PI / 2;
      collar.rotation.z = -Math.PI * 0.22;
      collar.position.set(0, 0.475, 0.01);
      torso.add(collar);
    }

    const adminPouch = new THREE.Mesh(new THREE.BoxGeometry(0.145, 0.088, 0.036), secondaryMat);
    adminPouch.position.set(0, 0.36, -0.16);
    const moralePatch = new THREE.Mesh(
      new THREE.PlaneGeometry(isSeal ? 0.125 : 0.084, isSeal ? 0.046 : 0.052),
      patchMat
    );
    moralePatch.rotation.y = Math.PI;
    moralePatch.position.set(0, 0.362, -0.18);
    torso.add(adminPouch, moralePatch);

    [-0.088, 0, 0.088].forEach((px) => {
      const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.122, 0.052), secondaryMat);
      pouch.position.set(px, 0.195, -0.166);
      const flap = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.034, 0.056), accentMat);
      flap.position.set(px, 0.238, -0.168);
      torso.add(pouch, flap);
    });

    if (isCT) {
      const radio = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.11, 0.042), metalGearMat);
      radio.position.set(-0.15, 0.37, -0.118);
      const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.007, 0.19, 8), metalGearMat);
      antenna.position.set(-0.164, 0.5, -0.118);
      torso.add(radio, antenna);
    }

    const pack = new THREE.Mesh(new THREE.CapsuleGeometry(0.105, 0.135, 8, 14), secondaryMat);
    pack.scale.set(1.1, 1.0, 0.62);
    pack.position.set(0, 0.295, 0.185);
    pack.castShadow = enableShadows;
    torso.add(pack);
  }

  // Sculpted Neck & Cartoon-Realistic Face + Headgear
  const head = new THREE.Group();
  head.position.y = 0.51;
  torso.add(head);

  const isHoodedHead = isPhoenix || isArctic || isSas || isGign || isSeal || isGsg9;
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.068, 0.11, 14),
    isPhoenix || isArctic || isSas || isGign ? balaclavaMat : skinMat
  );
  neck.position.y = 0.04;
  head.add(neck);

  const headMat = isHoodedHead ? balaclavaMat : skinMat;
  const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.114, 24, 20), headMat);
  headMesh.scale.set(0.92, 1.12, 1.0);
  headMesh.position.y = 0.18;
  headMesh.castShadow = enableShadows;
  head.add(headMesh);

  // Tapered chin / jawline
  const jaw = new THREE.Mesh(new THREE.CapsuleGeometry(0.066, 0.052, 8, 14), headMat);
  jaw.rotation.x = Math.PI / 5.8;
  jaw.position.set(0, 0.124, -0.025);
  head.add(jaw);

  // Subtle Cheekbones + Brow Ridge on exposed/mask heads
  const browRidge = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.088, 6, 10), headMat);
  browRidge.rotation.z = Math.PI / 2;
  browRidge.position.set(0, 0.204, -0.095);
  head.add(browRidge);

  [-0.098, 0.098].forEach((ex) => {
    const ear = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 10), headMat);
    ear.scale.set(0.45, 1.18, 0.82);
    ear.position.set(ex, 0.178, 0.005);
    head.add(ear);
  });

  const addDetailedEyes = (yOff: number, zOff: number) => {
    [-0.036, 0.036].forEach((ex) => {
      const eyeW = new THREE.Mesh(new THREE.SphereGeometry(0.015, 10, 8), eyeWhiteMat);
      eyeW.scale.set(1.25, 0.72, 0.65);
      eyeW.position.set(ex, yOff, zOff);

      const iris = new THREE.Mesh(new THREE.SphereGeometry(0.0095, 10, 8), irisMat);
      iris.scale.set(1.0, 1.0, 0.55);
      iris.position.set(ex, yOff, zOff - 0.007);

      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.0056, 10, 8), pupilMat);
      pupil.position.set(ex, yOff, zOff - 0.011);

      const eyelid = new THREE.Mesh(new THREE.CapsuleGeometry(0.004, 0.024, 4, 6), skinMat);
      eyelid.rotation.z = Math.PI / 2;
      eyelid.position.set(ex, yOff + 0.009, zOff - 0.004);

      const brow = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.009, 0.014), hairMat);
      brow.rotation.z = ex < 0 ? 0.12 : -0.12;
      brow.position.set(ex, yOff + 0.019, zOff - 0.007);

      head.add(eyeW, iris, pupil, eyelid, brow);
    });
  };

  const addSculptedNoseAndMouth = () => {
    const noseBridge = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.028, 6, 8), skinMat);
    noseBridge.rotation.x = 0.28;
    noseBridge.position.set(0, 0.168, -0.108);
    const noseTip = new THREE.Mesh(new THREE.SphereGeometry(0.013, 10, 8), skinMat);
    noseTip.scale.set(1.15, 0.85, 1.0);
    noseTip.position.set(0, 0.154, -0.116);
    const upperLip = new THREE.Mesh(new THREE.CapsuleGeometry(0.006, 0.026, 4, 8), lipMat);
    upperLip.rotation.z = Math.PI / 2;
    upperLip.position.set(0, 0.128, -0.104);
    head.add(noseBridge, noseTip, upperLip);
  };

  if (isPhoenix || isArctic) {
    const eyeSlot = new THREE.Mesh(new THREE.BoxGeometry(0.114, 0.04, 0.032), skinMat);
    eyeSlot.position.set(0, 0.185, -0.095);
    addDetailedEyes(0.185, -0.106);
    head.add(eyeSlot);
    if (isPhoenix) {
      const mouthSlit = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.012, 0.015), skinMat);
      mouthSlit.position.set(0, 0.125, -0.098);
      head.add(mouthSlit);
    }
  } else if (isElite) {
    addDetailedEyes(0.184, -0.101);
    addSculptedNoseAndMouth();
    const hairCrown = new THREE.Mesh(new THREE.CylinderGeometry(0.104, 0.108, 0.075, 16), hairMat);
    hairCrown.position.set(0, 0.275, 0.008);
    const hairBack = new THREE.Mesh(new THREE.SphereGeometry(0.108, 14, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), hairMat);
    hairBack.position.set(0, 0.215, 0.012);
    [-0.038, 0.038].forEach((gx) => {
      const rim = new THREE.Mesh(new THREE.BoxGeometry(0.052, 0.036, 0.018), goldFrameMat);
      rim.position.set(gx, 0.186, -0.114);
      const lens = new THREE.Mesh(new THREE.BoxGeometry(0.044, 0.028, 0.021), visorMat);
      lens.position.set(gx, 0.186, -0.116);
      head.add(rim, lens);
    });
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.008, 0.016), goldFrameMat);
    bridge.position.set(0, 0.194, -0.116);
    const goatee = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.028, 6, 10), hairMat);
    goatee.position.set(0, 0.105, -0.088);
    head.add(hairCrown, hairBack, bridge, goatee);
  } else if (isGuerilla) {
    addDetailedEyes(0.185, -0.102);
    addSculptedNoseAndMouth();
    const beard = new THREE.Mesh(new THREE.CapsuleGeometry(0.072, 0.042, 6, 12), hairMat);
    beard.position.set(0, 0.11, -0.032);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.114, 0.116, 0.052, 16), headbandMat);
    band.position.set(0, 0.225, 0);
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), headbandMat);
    knot.position.set(0, 0.225, 0.116);
    [-0.024, 0.024].forEach((tx, idx) => {
      const tail = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.145, 0.008), headbandMat);
      tail.rotation.set(0.32, 0, (idx === 0 ? -1 : 1) * 0.2);
      tail.position.set(tx, 0.165, 0.135);
      head.add(tail);
    });
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.11, 14, 12), hairMat);
    hair.scale.set(0.94, 0.68, 1.0);
    hair.position.set(0, 0.25, 0.005);
    head.add(beard, band, knot, hair);
  } else if (isSas) {
    const hoodRidge = new THREE.Mesh(new THREE.SphereGeometry(0.122, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.62), balaclavaMat);
    hoodRidge.position.set(0, 0.19, 0.006);
    hoodRidge.castShadow = enableShadows;
    head.add(hoodRidge);

    [-0.04, 0.04].forEach((ex) => {
      const bezel = new THREE.Mesh(new THREE.CylinderGeometry(0.031, 0.031, 0.026, 16), metalGearMat);
      bezel.rotation.x = Math.PI / 2;
      bezel.position.set(ex, 0.186, -0.108);
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.03, 16), visorMat);
      lens.rotation.x = Math.PI / 2;
      lens.position.set(ex, 0.186, -0.11);
      head.add(bezel, lens);
    });

    const maskSnout = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.048, 0.068, 14), bootMat);
    maskSnout.rotation.x = Math.PI / 2;
    maskSnout.position.set(0, 0.128, -0.112);
    const filterL = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.056, 14), metalGearMat);
    filterL.rotation.set(Math.PI / 2, 0, -0.35);
    filterL.position.set(-0.062, 0.122, -0.126);
    const filterR = filterL.clone();
    filterR.rotation.z = 0.35;
    filterR.position.x = 0.062;
    head.add(maskSnout, filterL, filterR);
  } else if (isGign) {
    const knitCap = new THREE.Mesh(
      new THREE.SphereGeometry(0.122, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.56),
      balaclavaMat
    );
    knitCap.position.set(0, 0.2, 0.005);
    const knitBand = new THREE.Mesh(new THREE.TorusGeometry(0.112, 0.018, 10, 20), balaclavaMat);
    knitBand.rotation.x = Math.PI / 2;
    knitBand.position.set(0, 0.218, 0);
    const eyeSlot = new THREE.Mesh(new THREE.BoxGeometry(0.114, 0.04, 0.03), skinMat);
    eyeSlot.position.set(0, 0.182, -0.096);
    addDetailedEyes(0.182, -0.106);
    head.add(knitCap, knitBand, eyeSlot);
  } else {
    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.134, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.6),
      helmetShellMat
    );
    helmet.position.set(0, 0.19, 0.008);
    helmet.castShadow = enableShadows;
    head.add(helmet);

    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.012, 8, 22), bootMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, 0.19, 0.008);
    const nvgMount = new THREE.Mesh(new THREE.BoxGeometry(0.038, 0.042, 0.022), metalGearMat);
    nvgMount.position.set(0, 0.265, -0.115);
    head.add(rim, nvgMount);

    [-0.125, 0.125].forEach((cx) => {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.022, 14), bootMat);
      cup.rotation.z = Math.PI / 2;
      cup.position.set(cx, 0.175, 0.005);
      head.add(cup);
    });
    const boomCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.122, 0.16, -0.01),
      new THREE.Vector3(-0.095, 0.13, -0.095),
      new THREE.Vector3(-0.03, 0.125, -0.115),
    ]);
    const boomMic = new THREE.Mesh(new THREE.TubeGeometry(boomCurve, 10, 0.005, 8, false), metalGearMat);
    head.add(boomMic);

    const eyeSlot = new THREE.Mesh(new THREE.BoxGeometry(0.114, 0.04, 0.03), skinMat);
    eyeSlot.position.set(0, 0.176, -0.096);
    addDetailedEyes(0.176, -0.105);
    const goggles = new THREE.Mesh(new THREE.BoxGeometry(0.148, 0.042, 0.034), visorMat);
    goggles.position.set(0, isGsg9 ? 0.184 : 0.214, -0.114);
    const goggleStrap = new THREE.Mesh(new THREE.CylinderGeometry(0.133, 0.133, 0.024, 18, 1, true), bootMat);
    goggleStrap.position.set(0, isGsg9 ? 0.184 : 0.214, 0.006);
    head.add(eyeSlot, goggles, goggleStrap);
  }

  // Sculpted Arms + Articulated 5-Finger Hands
  const forearmGeo = createSculptedForearmGeo();
  const makeArm = (side: -1 | 1) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.242, 0.41, 0);

    if (isGuerilla) {
      const deltoid = new THREE.Mesh(new THREE.SphereGeometry(0.068, 14, 12), skinMat);
      deltoid.scale.set(0.95, 1.05, 0.95);
      shoulder.add(deltoid);
      const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.056, 0.18, 8, 14), skinMat);
      upper.position.y = -0.13;
      upper.castShadow = enableShadows;
      shoulder.add(upper);
      bodyHitMeshes.push(upper);
    } else if (isPhoenix) {
      const sleeveCap = new THREE.Mesh(new THREE.SphereGeometry(0.07, 14, 12), shirtMat);
      sleeveCap.scale.set(0.96, 1.05, 0.96);
      const shortSleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.058, 0.13, 14), shirtMat);
      shortSleeve.position.y = -0.065;
      const lowerBicep = new THREE.Mesh(new THREE.CapsuleGeometry(0.052, 0.11, 8, 14), skinMat);
      lowerBicep.position.y = -0.17;
      lowerBicep.castShadow = enableShadows;
      shoulder.add(sleeveCap, shortSleeve, lowerBicep);
      bodyHitMeshes.push(lowerBicep);
    } else {
      const sleeveShoulder = new THREE.Mesh(new THREE.SphereGeometry(0.072, 14, 12), shirtMat);
      sleeveShoulder.scale.set(0.96, 1.05, 0.96);
      shoulder.add(sleeveShoulder);

      if (isCT) {
        const shoulderPatch = new THREE.Mesh(new THREE.PlaneGeometry(0.058, 0.058), patchMat);
        shoulderPatch.rotation.y = side * (Math.PI / 2);
        shoulderPatch.position.set(side * 0.064, -0.08, 0);
        shoulder.add(shoulderPatch);
      }

      const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.056, 0.18, 8, 14), shirtMat);
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
      const elbowPad = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 10), secondaryMat);
      elbowPad.position.set(0, 0, 0.02);
      elbow.add(elbowPad);
    }

    const forearm = new THREE.Mesh(forearmGeo, forearmMat);
    forearm.castShadow = enableShadows;
    elbow.add(forearm);

    if (side === -1) {
      const watchStrap = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.02, 12), bootMat);
      watchStrap.position.set(0, -0.205, 0);
      const watchFace = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.024, 0.014), metalGearMat);
      watchFace.position.set(-0.04, -0.205, 0);
      elbow.add(watchStrap, watchFace);
    }

    // Properly Modeled Hands + 5 Articulated Fingers
    const isFingerless = isPhoenix || isElite || isGuerilla;
    const fingerMat = isFingerless ? skinMat : gloveMat;
    const gloveGroup = new THREE.Group();
    gloveGroup.position.set(0, -0.25, 0);

    const palm = new THREE.Mesh(new THREE.CapsuleGeometry(0.026, 0.036, 6, 10), gloveMat);
    palm.scale.set(1.1, 0.9, 0.72);
    const knucklePlate = new THREE.Mesh(new THREE.BoxGeometry(0.062, 0.022, 0.018), metalGearMat);
    knucklePlate.position.set(side * 0.006, -0.016, -0.018);

    const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.009, 0.028, 4, 8), fingerMat);
    thumb.rotation.z = side * -0.55;
    thumb.position.set(-side * 0.032, -0.012, -0.014);
    gloveGroup.add(palm, knucklePlate, thumb);

    for (let f = 0; f < 4; f++) {
      const fx = (-0.018 + f * 0.012) * side;
      const finger = new THREE.Mesh(new THREE.CapsuleGeometry(0.0072, 0.034, 4, 8), fingerMat);
      finger.rotation.x = 0.52;
      finger.position.set(fx, -0.046, -0.012);
      gloveGroup.add(finger);
    }
    elbow.add(gloveGroup);

    return { shoulder, elbow };
  };

  const leftArmData = makeArm(-1);
  const rightArmData = makeArm(1);
  const leftArm = leftArmData.shoulder;
  const leftElbow = leftArmData.elbow;
  const rightArm = rightArmData.shoulder;
  const rightElbow = rightArmData.elbow;

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

  // Stylized Soft Muzzle Flash Glow Planes (no low-poly cones)
  const muzzleFlash = new THREE.Group();
  const muzzleTex = textures.createSoftParticleTexture('muzzle');
  const flashMat = new THREE.MeshBasicMaterial({
    map: muzzleTex,
    color: 0xffdf8e,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const flashPlaneGeo = new THREE.PlaneGeometry(0.28, 0.28);
  const fp1 = new THREE.Mesh(flashPlaneGeo, flashMat);
  const fp2 = new THREE.Mesh(flashPlaneGeo, flashMat);
  fp2.rotation.y = Math.PI / 2;
  const fp3 = new THREE.Mesh(flashPlaneGeo, flashMat);
  fp3.rotation.x = Math.PI / 2;
  muzzleFlash.add(fp1, fp2, fp3);
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
  const meta = getWeaponViewMeta(weaponId, weaponId === 'm4a1' || weaponId === 'usp');
  muzzlePoint.position.set(0, meta.muzzleY * 1.12, meta.muzzleZ * 1.12);
}

export function setCharacterWeapon(rig: CharacterRig, weaponId: WeaponId): void {
  for (let i = rig.weaponMount.children.length - 1; i >= 0; i--) {
    const child = rig.weaponMount.children[i];
    if (child !== rig.muzzlePoint) {
      rig.weaponMount.remove(child);
      disposeObjectSubtree(child, undefined, SHARED_WEAPON_MATERIALS);
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
