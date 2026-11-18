import * as THREE from 'three';

export interface CharacterAnimRig {
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
}

interface BlendState {
  lastTime: number;
  walkWeight: number;
  runWeight: number;
  crouchWeight: number;
  airWeight: number;
  reloadWeight: number;
  stridePhase: number;
}

const rigBlendStates = new WeakMap<CharacterAnimRig, BlendState>();

function getBlendState(rig: CharacterAnimRig, time: number): BlendState {
  let state = rigBlendStates.get(rig);
  if (!state) {
    state = {
      lastTime: time,
      walkWeight: 0,
      runWeight: 0,
      crouchWeight: 0,
      airWeight: 0,
      reloadWeight: 0,
      stridePhase: 0,
    };
    rigBlendStates.set(rig, state);
  }
  return state;
}

/**
 * Smooth frame-rate-independent character animation state blender:
 * Blends Idle <-> Walk <-> Run <-> Crouch <-> Jump <-> Reload <-> Recoil <-> Hit Flinch <-> 4 Death Animations
 * using damped blend weights so locomotion transitions never snap abruptly.
 */
export function updateBlendedCharacterPose(
  rig: CharacterAnimRig,
  time: number,
  speedRatio: number,
  crouching: boolean,
  recoilKick = 0,
  dead = false,
  deathProgress = 0,
  opts: CharacterAnimOptions = {}
): void {
  const {
    onGround = true,
    isReloading = false,
    hitFlinch = 0,
    landDip = 0,
    aimPitch = 0,
    deathStyle = 0,
    baseY = rig.root.position.y,
    dt: optDt,
  } = opts;

  const st = getBlendState(rig, time);
  const dt = optDt !== undefined ? Math.min(0.05, Math.max(0.001, optDt)) : Math.min(0.05, Math.max(0.001, time - st.lastTime || 0.016));
  st.lastTime = time;

  if (dead) {
    rig.muzzleFlash.visible = false;
    rig.contactShadow.visible = false;

    const t = Math.min(1, deathProgress);
    const kneeT = Math.min(1, t / 0.28);
    const fallT = Math.max(0, (t - 0.12) / 0.88);
    const ease = 1 - Math.pow(1 - fallT, 3);
    const bounce = Math.sin(Math.min(1, Math.max(0, (t - 0.72) / 0.28)) * Math.PI) * 0.04;
    const style = Math.abs(Math.floor(deathStyle)) % 4;
    const blend = 1 - Math.exp(-18 * dt);

    if (style === 1) {
      rig.head.rotation.x = THREE.MathUtils.lerp(0, -0.78, Math.min(1, t * 2.8));
      rig.head.rotation.z = THREE.MathUtils.lerp(0, 0.32, ease);
      rig.torso.rotation.x = THREE.MathUtils.lerp(0, -0.34, Math.min(1, t * 2.0));
      rig.root.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 2, ease);
      rig.root.rotation.z = THREE.MathUtils.lerp(0, -0.24, ease);
      rig.root.position.y = baseY + THREE.MathUtils.lerp(0, 0.16, ease) + bounce;
      rig.hips.position.y = THREE.MathUtils.lerp(0.92, 0.84, kneeT);
      rig.leftLeg.rotation.x = THREE.MathUtils.lerp(rig.leftLeg.rotation.x, 0.22, blend);
      rig.rightLeg.rotation.x = THREE.MathUtils.lerp(rig.rightLeg.rotation.x, -0.14, blend);
      rig.leftKnee.rotation.x = THREE.MathUtils.lerp(rig.leftKnee.rotation.x, -0.42, blend);
      rig.rightKnee.rotation.x = THREE.MathUtils.lerp(rig.rightKnee.rotation.x, -0.18, blend);
      rig.leftArm.rotation.set(THREE.MathUtils.lerp(rig.leftArm.rotation.x, 1.55, blend), 0.25, 0.85 * ease);
      rig.rightArm.rotation.set(THREE.MathUtils.lerp(rig.rightArm.rotation.x, 1.35, blend), -0.2, -0.75 * ease);
    } else if (style === 2) {
      rig.hips.position.y = THREE.MathUtils.lerp(0.92, 0.54, kneeT);
      rig.head.rotation.x = THREE.MathUtils.lerp(0, 0.42, ease);
      rig.torso.rotation.x = THREE.MathUtils.lerp(0, -0.45, Math.min(1, t * 2.2));
      rig.root.rotation.x = THREE.MathUtils.lerp(0, Math.PI / 2 - 0.12, ease);
      rig.root.rotation.z = THREE.MathUtils.lerp(0, 0.16, ease);
      rig.root.position.y = baseY + THREE.MathUtils.lerp(0, 0.14, ease) + bounce;
      rig.leftLeg.rotation.x = THREE.MathUtils.lerp(rig.leftLeg.rotation.x, 0.55, blend);
      rig.rightLeg.rotation.x = THREE.MathUtils.lerp(rig.rightLeg.rotation.x, 0.38, blend);
      rig.leftKnee.rotation.x = THREE.MathUtils.lerp(rig.leftKnee.rotation.x, -1.25, blend);
      rig.rightKnee.rotation.x = THREE.MathUtils.lerp(rig.rightKnee.rotation.x, -0.95, blend);
      rig.leftArm.rotation.set(THREE.MathUtils.lerp(rig.leftArm.rotation.x, -0.45, blend), 0.15, 0.55 * ease);
      rig.rightArm.rotation.set(THREE.MathUtils.lerp(rig.rightArm.rotation.x, -0.65, blend), -0.15, -0.48 * ease);
    } else if (style === 3) {
      rig.torso.rotation.y = THREE.MathUtils.lerp(0, 0.48, ease);
      rig.head.rotation.z = THREE.MathUtils.lerp(0, -0.38, ease);
      rig.root.rotation.z = THREE.MathUtils.lerp(0, 1.46, ease);
      rig.root.rotation.x = THREE.MathUtils.lerp(0, -0.34, ease);
      rig.root.position.y = baseY + THREE.MathUtils.lerp(0, 0.21, ease) + bounce;
      rig.hips.position.y = THREE.MathUtils.lerp(0.92, 0.82, kneeT);
      rig.leftLeg.rotation.x = THREE.MathUtils.lerp(rig.leftLeg.rotation.x, 0.4, blend);
      rig.rightLeg.rotation.x = THREE.MathUtils.lerp(rig.rightLeg.rotation.x, -0.18, blend);
      rig.leftKnee.rotation.x = THREE.MathUtils.lerp(rig.leftKnee.rotation.x, -0.78, blend);
      rig.rightKnee.rotation.x = THREE.MathUtils.lerp(rig.rightKnee.rotation.x, -0.32, blend);
      rig.leftArm.rotation.set(THREE.MathUtils.lerp(rig.leftArm.rotation.x, 0.9, blend), 0.1, 0.65 * ease);
      rig.rightArm.rotation.set(THREE.MathUtils.lerp(rig.rightArm.rotation.x, 1.25, blend), -0.3, -0.35 * ease);
    } else {
      rig.hips.position.y = THREE.MathUtils.lerp(0.92, 0.84, kneeT);
      rig.torso.rotation.x = THREE.MathUtils.lerp(0, -0.22, ease);
      rig.head.rotation.x = THREE.MathUtils.lerp(0, -0.36, ease);
      rig.root.rotation.x = THREE.MathUtils.lerp(0, -Math.PI / 2, ease);
      rig.root.rotation.z = THREE.MathUtils.lerp(0, 0.28, ease);
      rig.root.position.y = baseY + THREE.MathUtils.lerp(0, 0.16, ease) + bounce;
      rig.leftKnee.rotation.x = THREE.MathUtils.lerp(rig.leftKnee.rotation.x, -0.68, blend);
      rig.rightKnee.rotation.x = THREE.MathUtils.lerp(rig.rightKnee.rotation.x, -0.35, blend);
      rig.leftArm.rotation.set(THREE.MathUtils.lerp(rig.leftArm.rotation.x, 1.4, blend), 0.15, 0.52 * ease);
      rig.rightArm.rotation.set(THREE.MathUtils.lerp(rig.rightArm.rotation.x, 1.15, blend), -0.2, -0.45 * ease);
    }
    return;
  }

  // Smooth exponential state weights
  const targetWalk = speedRatio > 0.08 ? THREE.MathUtils.clamp(speedRatio / 0.65, 0, 1) : 0;
  const targetRun = speedRatio > 0.65 && !crouching ? THREE.MathUtils.clamp((speedRatio - 0.65) / 0.4, 0, 1) : 0;
  const targetCrouch = crouching ? 1 : 0;
  const targetAir = onGround ? 0 : 1;
  const targetReload = isReloading ? 1 : 0;

  st.walkWeight = THREE.MathUtils.damp(st.walkWeight, targetWalk, 11, dt);
  st.runWeight = THREE.MathUtils.damp(st.runWeight, targetRun, 10, dt);
  st.crouchWeight = THREE.MathUtils.damp(st.crouchWeight, targetCrouch, 12, dt);
  st.airWeight = THREE.MathUtils.damp(st.airWeight, targetAir, 14, dt);
  st.reloadWeight = THREE.MathUtils.damp(st.reloadWeight, targetReload, 12, dt);

  const strideRate = THREE.MathUtils.lerp(7.8, 11.4, st.runWeight);
  st.stridePhase += dt * strideRate * Math.max(0.15, st.walkWeight);

  rig.contactShadow.visible = true;
  rig.root.rotation.x = THREE.MathUtils.damp(rig.root.rotation.x, 0, 16, dt);
  rig.root.rotation.z = THREE.MathUtils.damp(rig.root.rotation.z, 0, 16, dt);
  rig.contactShadow.scale.setScalar(THREE.MathUtils.lerp(1.0, 1.14, st.crouchWeight) * (1 - st.airWeight * 0.25));

  // 3D Muzzle flash star
  rig.muzzleFlash.visible = recoilKick > 0.72;
  if (rig.muzzleFlash.visible) {
    rig.muzzleFlash.rotation.z = time * 42;
    rig.muzzleFlash.scale.setScalar(0.85 + (recoilKick - 0.72) * 1.45);
  }

  // 1. Hip vertical cycle (Idle breath + Stride bounce + Crouch + Land cushion)
  const breath = Math.sin(time * 2.1) * 0.009 * (1 - st.walkWeight * 0.5);
  const bounce = Math.abs(Math.sin(st.stridePhase)) * 0.044 * st.walkWeight * (1 - st.airWeight);
  const targetHipY =
    THREE.MathUtils.lerp(0.92, 0.56, st.crouchWeight) - landDip * 0.16 + bounce + breath;
  rig.hips.position.y = THREE.MathUtils.damp(rig.hips.position.y, targetHipY, 16, dt);

  // 2. Blended Lower-Body Kinematics (Idle <-> Walk/Run <-> Crouch <-> Airborne)
  const idleLegL = 0.04;
  const idleLegR = -0.05;
  const idleKneeL = -0.08;
  const idleKneeR = -0.06;

  const strideAmp = THREE.MathUtils.lerp(0.56, 0.72, st.runWeight) * (1 - st.crouchWeight * 0.45);
  const walkLegL = Math.sin(st.stridePhase) * strideAmp;
  const walkLegR = -Math.sin(st.stridePhase) * strideAmp;
  const walkKneeL = -Math.max(0, -Math.cos(st.stridePhase)) * THREE.MathUtils.lerp(0.85, 1.08, st.runWeight);
  const walkKneeR = -Math.max(0, Math.cos(st.stridePhase)) * THREE.MathUtils.lerp(0.85, 1.08, st.runWeight);

  let targetLegL = THREE.MathUtils.lerp(idleLegL, walkLegL, st.walkWeight);
  let targetLegR = THREE.MathUtils.lerp(idleLegR, walkLegR, st.walkWeight);
  let targetKneeL = THREE.MathUtils.lerp(idleKneeL, walkKneeL, st.walkWeight);
  let targetKneeR = THREE.MathUtils.lerp(idleKneeR, walkKneeR, st.walkWeight);

  // Blend Crouch tuck
  targetLegL = THREE.MathUtils.lerp(targetLegL, 0.78 + walkLegL * 0.45, st.crouchWeight);
  targetLegR = THREE.MathUtils.lerp(targetLegR, 0.56 + walkLegR * 0.45, st.crouchWeight);
  targetKneeL = THREE.MathUtils.lerp(targetKneeL, -1.3 + walkKneeL * 0.25, st.crouchWeight);
  targetKneeR = THREE.MathUtils.lerp(targetKneeR, -1.12 + walkKneeR * 0.25, st.crouchWeight);

  // Blend Airborne tuck
  targetLegL = THREE.MathUtils.lerp(targetLegL, 0.65, st.airWeight);
  targetLegR = THREE.MathUtils.lerp(targetLegR, 0.35, st.airWeight);
  targetKneeL = THREE.MathUtils.lerp(targetKneeL, -1.1, st.airWeight);
  targetKneeR = THREE.MathUtils.lerp(targetKneeR, -0.75, st.airWeight);

  rig.leftLeg.rotation.x = THREE.MathUtils.damp(rig.leftLeg.rotation.x, targetLegL, 18, dt);
  rig.rightLeg.rotation.x = THREE.MathUtils.damp(rig.rightLeg.rotation.x, targetLegR, 18, dt);
  rig.leftKnee.rotation.x = THREE.MathUtils.damp(rig.leftKnee.rotation.x, targetKneeL - landDip * 0.5, 18, dt);
  rig.rightKnee.rotation.x = THREE.MathUtils.damp(rig.rightKnee.rotation.x, targetKneeR - landDip * 0.5, 18, dt);

  // 3. Torso & Head Articulation
  const clampedPitch = THREE.MathUtils.clamp(aimPitch, -0.45, 0.45);
  const sprintLean = -0.14 * st.runWeight - 0.18 * st.crouchWeight;
  const flinchBack = hitFlinch * 0.28;
  const flinchRoll = hitFlinch * 0.16;
  const torsoTwist =
    Math.sin(st.stridePhase) * 0.08 * st.walkWeight +
    Math.sin(time * 0.9) * 0.028 * (1 - st.walkWeight);

  rig.torso.rotation.x = THREE.MathUtils.damp(
    rig.torso.rotation.x,
    sprintLean + clampedPitch * 0.45 + breath * 1.4 - recoilKick * 0.11 + flinchBack,
    16,
    dt
  );
  rig.torso.rotation.y = THREE.MathUtils.damp(rig.torso.rotation.y, torsoTwist, 16, dt);
  rig.torso.rotation.z = THREE.MathUtils.damp(rig.torso.rotation.z, flinchRoll, 16, dt);

  const targetHeadY = THREE.MathUtils.lerp(Math.sin(time * 0.75) * 0.09, -torsoTwist * 0.6, st.walkWeight);
  const targetHeadX = Math.sin(time * 1.6) * 0.025 + clampedPitch * 0.55 + hitFlinch * 0.22;
  rig.head.rotation.y = THREE.MathUtils.damp(rig.head.rotation.y, targetHeadY, 14, dt);
  rig.head.rotation.x = THREE.MathUtils.damp(rig.head.rotation.x, targetHeadX, 14, dt);
  rig.head.rotation.z = THREE.MathUtils.damp(rig.head.rotation.z, 0, 14, dt);

  // 4. Arms & Weapon Mount (blended Combat Ready <-> Walk/Run Sway <-> Reload)
  const armRunBob = Math.cos(st.stridePhase) * 0.08 * st.walkWeight;
  const rWave = Math.sin(time * 6.0) * 0.18;

  const combatRightArmX = 0.45 + clampedPitch * 0.35 - recoilKick * 0.22 + armRunBob;
  const combatLeftArmX = 0.58 + clampedPitch * 0.35 - recoilKick * 0.18 - armRunBob;
  const reloadLeftArmX = 0.25 + rWave;

  rig.rightArm.rotation.set(
    THREE.MathUtils.damp(rig.rightArm.rotation.x, combatRightArmX, 18, dt),
    -0.1,
    -0.12
  );
  rig.rightElbow.rotation.set(
    THREE.MathUtils.damp(rig.rightElbow.rotation.x, 1.05 + recoilKick * 0.18, 18, dt),
    0,
    0
  );

  rig.leftArm.rotation.set(
    THREE.MathUtils.damp(
      rig.leftArm.rotation.x,
      THREE.MathUtils.lerp(combatLeftArmX, reloadLeftArmX, st.reloadWeight),
      18,
      dt
    ),
    THREE.MathUtils.lerp(0.42, 0.25, st.reloadWeight),
    THREE.MathUtils.lerp(0.12, 0.2, st.reloadWeight)
  );
  rig.leftElbow.rotation.set(
    THREE.MathUtils.damp(
      rig.leftElbow.rotation.x,
      THREE.MathUtils.lerp(1.12, 1.45 + rWave, st.reloadWeight),
      18,
      dt
    ),
    0,
    0
  );

  rig.weaponMount.position.z = THREE.MathUtils.lerp(
    -0.28 + recoilKick * 0.055,
    -0.26,
    st.reloadWeight
  );
  rig.weaponMount.rotation.set(
    THREE.MathUtils.lerp(clampedPitch * 0.5 + recoilKick * 0.22, -0.22, st.reloadWeight),
    THREE.MathUtils.lerp(0, 0.35, st.reloadWeight),
    THREE.MathUtils.lerp(0, -0.25, st.reloadWeight)
  );
}
