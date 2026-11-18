import * as THREE from 'three';
import { disposeObjectSubtree } from '../utils/threeDisposal';
import { audioManager } from './AudioManager';
import { textures } from './ProceduralTextures';
import { WEAPON_DATABASE } from './WeaponDatabase';
import {
  buildFirstPersonHands,
  buildWeaponModel,
  getWeaponViewMeta,
  SHARED_WEAPON_MATERIALS,
  WeaponViewMeta,
} from './WeaponModels';
import { CharacterClassId, Team, WeaponId, WeaponInstance } from './types';

export class WeaponController {
  public viewRoot = new THREE.Group();
  private weaponPivot = new THREE.Group();
  private handsGroup: THREE.Group;
  private currentModel: THREE.Group | null = null;
  private muzzleFlashGroup: THREE.Group;
  private muzzlePoint = new THREE.Object3D();
  private ejectPoint = new THREE.Object3D();

  private activeWeaponId: WeaponId = 'usp';
  private activeTeam: Team = 'CT';
  private activeClassId: CharacterClassId | undefined = 'classic_ct';
  private activeSilenced = true;
  private activeMeta: WeaponViewMeta = getWeaponViewMeta('usp', true);

  public recoilPitch = 0;
  public recoilYaw = 0;
  public spreadPenalty = 0;
  public zoomLevel: 0 | 1 | 2 = 0;

  private fireCooldown = 0;
  private switchAnim = 0; // 0..1
  private kickAnim = 0;
  private meleeAnim = 0;
  private heavyStabAnim = 0;
  private flashTimer = 0;
  private boltCycleAnim = 0;
  private sprintBlend = 0;
  private shotCount = 0;
  private shotResetTimer = 0;

  public isReloading = false;
  private reloadTimer = 0;
  private reloadDuration = 2.0;
  private reloadStageFired = { out: false, in: false, rack: false };

  public isInspecting = false;
  private inspectTimer = 0;
  private inspectDuration = 2.45;

  private swayX = 0;
  private swayY = 0;
  private idleTime = 0;

  // Cached animated sub-parts on current weapon & hands
  private magPart: THREE.Object3D | null = null;
  private slidePart: THREE.Object3D | null = null;
  private boltPart: THREE.Object3D | null = null;
  private chargingPart: THREE.Object3D | null = null;
  private leftArmPart: THREE.Object3D | null = null;
  private rightArmPart: THREE.Object3D | null = null;

  constructor() {
    this.viewRoot.add(this.weaponPivot);
    this.handsGroup = buildFirstPersonHands('CT', 'classic_ct');
    this.weaponPivot.add(this.handsGroup);
    this.cacheHandParts();

    this.weaponPivot.add(this.muzzlePoint);
    this.weaponPivot.add(this.ejectPoint);

    // Stylized soft radial star muzzle flash (crossed textured glow planes + bright core)
    this.muzzleFlashGroup = new THREE.Group();
    const muzzleTex = textures.createSoftParticleTexture('muzzle');
    const flashPlaneMat = new THREE.MeshBasicMaterial({
      map: muzzleTex,
      color: 0xffe4a0,
      transparent: true,
      opacity: 0.94,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const flashGeo = new THREE.PlaneGeometry(0.24, 0.24);
    const p1 = new THREE.Mesh(flashGeo, flashPlaneMat);
    const p2 = new THREE.Mesh(flashGeo, flashPlaneMat);
    p2.rotation.y = Math.PI / 2;
    const p3 = new THREE.Mesh(flashGeo, flashPlaneMat);
    p3.rotation.x = Math.PI / 2;
    this.muzzleFlashGroup.add(p1, p2, p3);
    p1.userData.excludeFromAO = true;
    p2.userData.excludeFromAO = true;
    p3.userData.excludeFromAO = true;
    this.muzzleFlashGroup.userData.excludeFromAO = true;
    this.muzzleFlashGroup.visible = false;
    this.muzzlePoint.add(this.muzzleFlashGroup);
  }

  private cacheHandParts(): void {
    this.leftArmPart = this.handsGroup.getObjectByName('left_arm') ?? null;
    this.rightArmPart = this.handsGroup.getObjectByName('right_arm') ?? null;
  }

  private cacheWeaponParts(): void {
    if (!this.currentModel) {
      this.magPart = null;
      this.slidePart = null;
      this.boltPart = null;
      this.chargingPart = null;
      return;
    }
    this.magPart = this.currentModel.getObjectByName('magazine') ?? null;
    this.slidePart = this.currentModel.getObjectByName('slide') ?? null;
    this.boltPart = this.currentModel.getObjectByName('bolt') ?? null;
    this.chargingPart = this.currentModel.getObjectByName('charging_handle') ?? null;
  }

  public setTeam(team: Team, classId?: CharacterClassId): void {
    if (this.activeTeam === team && this.activeClassId === classId) return;
    this.activeTeam = team;
    this.activeClassId = classId;
    this.weaponPivot.remove(this.handsGroup);
    disposeObjectSubtree(this.handsGroup, undefined, SHARED_WEAPON_MATERIALS);
    this.handsGroup = buildFirstPersonHands(team, classId);
    this.weaponPivot.add(this.handsGroup);
    this.cacheHandParts();
    this.applyImmediateHandPose();
  }

  private applyImmediateHandPose(): void {
    const m = this.activeMeta;
    if (this.rightArmPart) {
      this.rightArmPart.position.set(m.rightHandPos[0], m.rightHandPos[1], m.rightHandPos[2]);
      this.rightArmPart.rotation.set(m.rightHandRot[0], m.rightHandRot[1], m.rightHandRot[2]);
    }
    if (this.leftArmPart) {
      this.leftArmPart.position.set(m.leftHandPos[0], m.leftHandPos[1], m.leftHandPos[2]);
      this.leftArmPart.rotation.set(m.leftHandRot[0], m.leftHandRot[1], m.leftHandRot[2]);
    }
  }

  public equip(inst: WeaponInstance): void {
    const same = this.activeWeaponId === inst.id && this.activeSilenced === Boolean(inst.silenced);
    this.activeWeaponId = inst.id;
    this.activeSilenced = Boolean(inst.silenced);
    this.activeMeta = getWeaponViewMeta(inst.id, Boolean(inst.silenced));
    this.isReloading = false;
    this.reloadTimer = 0;
    this.isInspecting = false;
    this.inspectTimer = 0;
    this.boltCycleAnim = 0;
    this.shotCount = 0;
    this.shotResetTimer = 0;
    this.zoomLevel = 0;
    this.switchAnim = 1.0;

    if (!same || !this.currentModel) {
      if (this.currentModel) {
        this.weaponPivot.remove(this.currentModel);
        disposeObjectSubtree(this.currentModel, undefined, SHARED_WEAPON_MATERIALS);
      }
      this.currentModel = buildWeaponModel(inst.id, Boolean(inst.silenced));
      this.weaponPivot.add(this.currentModel);
      this.cacheWeaponParts();
    }

    audioManager.playReloadStage('weapon_switch');

    if (this.magPart) this.magPart.position.set(0, 0, 0);
    if (this.slidePart) this.slidePart.position.set(0, 0, 0);
    if (this.boltPart) {
      this.boltPart.position.set(0, 0, 0);
      this.boltPart.rotation.set(0, 0, 0);
    }
    if (this.chargingPart) this.chargingPart.position.set(0, 0, 0);

    const m = this.activeMeta;
    this.muzzlePoint.position.set(0, m.muzzleY, m.muzzleZ);
    this.ejectPoint.position.set(m.ejectPos[0], m.ejectPos[1], m.ejectPos[2]);
    this.weaponPivot.position.set(m.pivotPos[0], m.pivotPos[1], m.pivotPos[2]);
    this.weaponPivot.rotation.set(m.pivotRot[0], m.pivotRot[1], m.pivotRot[2]);
    this.applyImmediateHandPose();
  }

  public startInspect(): void {
    if (this.isReloading || this.zoomLevel > 0 || this.switchAnim > 0.35) return;
    if (this.isInspecting) {
      this.isInspecting = false;
      this.inspectTimer = 0;
      return;
    }
    this.isInspecting = true;
    this.inspectTimer = this.inspectDuration;
    audioManager.playWeaponInspect();
  }

  public getMuzzleWorldPosition(out: THREE.Vector3): THREE.Vector3 {
    this.muzzlePoint.updateWorldMatrix(true, false);
    return this.muzzlePoint.getWorldPosition(out);
  }

  public getEjectionWorldPosition(out: THREE.Vector3): THREE.Vector3 {
    this.ejectPoint.updateWorldMatrix(true, false);
    return this.ejectPoint.getWorldPosition(out);
  }

  public addSway(dx: number, dy: number): void {
    this.swayX = THREE.MathUtils.clamp(this.swayX - dx * 0.00022, -0.04, 0.04);
    this.swayY = THREE.MathUtils.clamp(this.swayY + dy * 0.00022, -0.04, 0.04);
  }

  public startReload(inst: WeaponInstance): boolean {
    const def = WEAPON_DATABASE[inst.id];
    if (this.isReloading || def.magazineSize <= 0) return false;
    if (inst.ammoInMag >= def.magazineSize || inst.ammoReserve <= 0) return false;
    this.isReloading = true;
    this.isInspecting = false;
    this.inspectTimer = 0;
    this.zoomLevel = 0;
    this.boltCycleAnim = 0;
    this.reloadDuration = def.reloadTime;
    this.reloadTimer = def.reloadTime;
    this.reloadStageFired = { out: false, in: false, rack: false };
    return true;
  }

  public tryToggleAltFire(inst: WeaponInstance): void {
    this.isInspecting = false;
    this.inspectTimer = 0;
    const def = WEAPON_DATABASE[inst.id];
    if (def.zoomFov) {
      if (def.hasSecondZoom) {
        this.zoomLevel = ((this.zoomLevel + 1) % 3) as 0 | 1 | 2;
      } else {
        this.zoomLevel = this.zoomLevel === 0 ? 1 : 0;
      }
      audioManager.playBuyClick();
    } else if (def.silencerAvailable) {
      inst.silenced = !inst.silenced;
      this.equip(inst);
      audioManager.playBuyClick();
    } else if (def.burstAvailable) {
      inst.burstMode = !inst.burstMode;
      audioManager.playBuyClick();
    }
  }

  public canFire(): boolean {
    return this.fireCooldown <= 0 && !this.isReloading && this.switchAnim < 0.35;
  }

  public triggerKnifeStab(): boolean {
    if (!this.canFire() || this.activeWeaponId !== 'knife') return false;
    this.isInspecting = false;
    this.inspectTimer = 0;
    this.fireCooldown = 0.85;
    this.heavyStabAnim = 1.0;
    audioManager.playKnifeSlash();
    return true;
  }

  public triggerFire(inst: WeaponInstance): boolean {
    if (!this.canFire()) return false;
    this.isInspecting = false;
    this.inspectTimer = 0;
    const def = WEAPON_DATABASE[inst.id];

    if (def.slot === 'knife') {
      this.fireCooldown = 60 / def.fireRateRPM;
      this.meleeAnim = 1.0;
      audioManager.playKnifeSlash();
      return true;
    }

    if (def.slot === 'grenade' || inst.id === 'c4') {
      this.fireCooldown = 0.5;
      this.meleeAnim = 0.85;
      return true;
    }

    if (inst.ammoInMag <= 0) {
      this.fireCooldown = 0.25;
      audioManager.playDryFire();
      return false;
    }

    inst.ammoInMag -= 1;
    this.fireCooldown = 60 / def.fireRateRPM;
    this.kickAnim = 1.0;
    this.shotCount += 1;
    this.shotResetTimer = 0.34;

    if (inst.id === 'awp' || inst.id === 'scout') {
      this.boltCycleAnim = 1.0;
      this.zoomLevel = 0;
    }
    if (!inst.silenced && inst.id !== 'tmp') {
      this.flashTimer = 0.048;
    }

    const climbMult = this.shotCount <= 3 ? 0.88 : this.shotCount <= 8 ? 1.05 : 0.72;
    this.recoilPitch += def.recoilKick * climbMult;
    if (this.shotCount > 2) {
      const patternPhase = (this.shotCount - 3) * 0.52;
      const patternSweep = Math.sin(patternPhase) * 0.85 + (Math.random() - 0.5) * 0.25;
      this.recoilYaw += patternSweep * def.recoilHorizontal;
    } else {
      this.recoilYaw += (Math.random() - 0.5) * def.recoilHorizontal * 0.25;
    }
    this.spreadPenalty = Math.min(0.12, this.spreadPenalty + def.recoilKick * 0.48);

    audioManager.playWeaponFire(inst.id, Boolean(inst.silenced), 1.0);
    return true;
  }

  public getReloadProgress(): number {
    if (!this.isReloading || this.reloadDuration <= 0) return 0;
    return Math.max(0, Math.min(1, 1 - this.reloadTimer / this.reloadDuration));
  }

  public update(
    dt: number,
    inst: WeaponInstance,
    moveSpeedRatio: number,
    isCrouching: boolean,
    baseFov: number,
    camera: THREE.PerspectiveCamera,
    isSprinting = false
  ): void {
    this.idleTime += dt;
    this.fireCooldown = Math.max(0, this.fireCooldown - dt);
    this.switchAnim = THREE.MathUtils.damp(this.switchAnim, 0, 12, dt);
    this.kickAnim = THREE.MathUtils.damp(this.kickAnim, 0, 18, dt);
    this.meleeAnim = THREE.MathUtils.damp(this.meleeAnim, 0, 11, dt);
    this.heavyStabAnim = THREE.MathUtils.damp(this.heavyStabAnim, 0, 8, dt);
    this.boltCycleAnim = Math.max(0, this.boltCycleAnim - dt * (inst.id === 'awp' ? 0.95 : 1.35));
    this.sprintBlend = THREE.MathUtils.damp(
      this.sprintBlend,
      isSprinting && !this.isReloading && !this.isInspecting && this.zoomLevel === 0 ? 1 : 0,
      10,
      dt
    );

    if (this.shotResetTimer > 0) {
      this.shotResetTimer -= dt;
      if (this.shotResetTimer <= 0) {
        this.shotCount = 0;
      }
    }

    this.recoilPitch = THREE.MathUtils.damp(this.recoilPitch, 0, 10.5, dt);
    this.recoilYaw = THREE.MathUtils.damp(this.recoilYaw, 0, 10.5, dt);
    this.spreadPenalty = THREE.MathUtils.damp(this.spreadPenalty, 0, 8.5, dt);

    this.swayX = THREE.MathUtils.damp(this.swayX, 0, 10, dt);
    this.swayY = THREE.MathUtils.damp(this.swayY, 0, 10, dt);

    const def = WEAPON_DATABASE[inst.id];
    const m = this.activeMeta;
    let reloadDip = 0;
    let reloadRoll = 0;
    let reloadPitch = 0;

    if (this.isReloading) {
      this.reloadTimer -= dt;
      const p = this.getReloadProgress();

      if (!this.reloadStageFired.out && p >= 0.14) {
        this.reloadStageFired.out = true;
        audioManager.playReloadStage('mag_out');
      }
      if (!this.reloadStageFired.in && p >= 0.56) {
        this.reloadStageFired.in = true;
        audioManager.playReloadStage('mag_in');
      }
      if (!this.reloadStageFired.rack && p >= 0.8) {
        this.reloadStageFired.rack = true;
        audioManager.playReloadStage('bolt_rack');
      }

      const envelope = Math.sin(p * Math.PI);
      reloadDip = envelope * 0.075;
      reloadRoll = -envelope * 0.4;
      reloadPitch = envelope * 0.25;

      if (this.magPart) {
        if (p < 0.2) {
          this.magPart.position.y = -(p / 0.2) * 0.02;
        } else if (p < 0.52) {
          const dropT = Math.min(1, (p - 0.2) / 0.16);
          this.magPart.position.y = -0.02 - dropT * 0.24;
          this.magPart.position.z = dropT * 0.03;
        } else if (p < 0.72) {
          const insertT = (p - 0.52) / 0.2;
          this.magPart.position.y = THREE.MathUtils.lerp(-0.26, 0, insertT);
          this.magPart.position.z = THREE.MathUtils.lerp(0.03, 0, insertT);
        } else {
          this.magPart.position.set(0, 0, 0);
        }
      }

      if (this.leftArmPart) {
        if (p < 0.72) {
          const handDrop = Math.sin(Math.min(1, p / 0.72) * Math.PI);
          this.leftArmPart.position.set(
            THREE.MathUtils.lerp(m.leftHandPos[0], 0.02, handDrop),
            THREE.MathUtils.lerp(m.leftHandPos[1], -0.18, handDrop),
            THREE.MathUtils.lerp(m.leftHandPos[2], -0.05, handDrop)
          );
          this.leftArmPart.rotation.set(
            m.leftHandRot[0] + 0.35 * handDrop,
            m.leftHandRot[1] + 0.18 * handDrop,
            m.leftHandRot[2] + 0.2 * handDrop
          );
        } else {
          const rackT = Math.sin(((p - 0.72) / 0.28) * Math.PI);
          this.leftArmPart.position.set(
            THREE.MathUtils.lerp(m.leftHandPos[0], -0.02, rackT),
            THREE.MathUtils.lerp(m.leftHandPos[1], 0.04, rackT),
            THREE.MathUtils.lerp(m.leftHandPos[2], -0.04, rackT)
          );
          this.leftArmPart.rotation.set(m.leftHandRot[0], m.leftHandRot[1] - 0.14 * rackT, m.leftHandRot[2]);
          if (this.chargingPart) {
            this.chargingPart.position.z = rackT * 0.055;
          }
          if (this.slidePart) {
            this.slidePart.position.z = rackT * 0.045;
          }
        }
      }

      if (this.reloadTimer <= 0) {
        this.isReloading = false;
        if (this.magPart) this.magPart.position.set(0, 0, 0);
        if (this.chargingPart) this.chargingPart.position.set(0, 0, 0);
        const needed = def.magazineSize - inst.ammoInMag;
        const take = Math.min(needed, inst.ammoReserve);
        inst.ammoInMag += take;
        inst.ammoReserve -= take;
      }
    } else if (this.leftArmPart) {
      this.leftArmPart.position.x = THREE.MathUtils.damp(this.leftArmPart.position.x, m.leftHandPos[0], 14, dt);
      this.leftArmPart.position.y = THREE.MathUtils.damp(this.leftArmPart.position.y, m.leftHandPos[1], 14, dt);
      this.leftArmPart.position.z = THREE.MathUtils.damp(this.leftArmPart.position.z, m.leftHandPos[2], 14, dt);
      this.leftArmPart.rotation.x = THREE.MathUtils.damp(this.leftArmPart.rotation.x, m.leftHandRot[0], 14, dt);
      this.leftArmPart.rotation.y = THREE.MathUtils.damp(this.leftArmPart.rotation.y, m.leftHandRot[1], 14, dt);
      this.leftArmPart.rotation.z = THREE.MathUtils.damp(this.leftArmPart.rotation.z, m.leftHandRot[2], 14, dt);
      if (this.chargingPart) {
        this.chargingPart.position.z = THREE.MathUtils.damp(this.chargingPart.position.z, 0, 16, dt);
      }
    }

    // Pistol slide reciprocating blowback on shot
    if (this.slidePart && !this.isReloading) {
      this.slidePart.position.z = this.kickAnim * 0.046;
    }

    // AWP / Scout post-shot bolt-action cycling animation
    let boltTilt = 0;
    if (this.boltPart && this.boltCycleAnim > 0 && !this.isReloading) {
      const bPhase = 1 - this.boltCycleAnim;
      if (bPhase > 0.18 && bPhase < 0.88) {
        const arc = Math.sin(((bPhase - 0.18) / 0.7) * Math.PI);
        this.boltPart.rotation.z = arc * 0.85;
        this.boltPart.position.z = arc * 0.075;
        boltTilt = arc * 0.22;
        if (this.rightArmPart) {
          this.rightArmPart.position.set(
            m.rightHandPos[0] + 0.025 * arc,
            m.rightHandPos[1] + 0.05 * arc,
            m.rightHandPos[2] - 0.06 * arc
          );
        }
      } else {
        this.boltPart.rotation.z = THREE.MathUtils.damp(this.boltPart.rotation.z, 0, 16, dt);
        this.boltPart.position.z = THREE.MathUtils.damp(this.boltPart.position.z, 0, 16, dt);
        if (this.rightArmPart) {
          this.rightArmPart.position.x = THREE.MathUtils.damp(this.rightArmPart.position.x, m.rightHandPos[0], 14, dt);
          this.rightArmPart.position.y = THREE.MathUtils.damp(this.rightArmPart.position.y, m.rightHandPos[1], 14, dt);
          this.rightArmPart.position.z = THREE.MathUtils.damp(this.rightArmPart.position.z, m.rightHandPos[2], 14, dt);
        }
      }
    } else if (this.rightArmPart) {
      this.rightArmPart.position.x = THREE.MathUtils.damp(this.rightArmPart.position.x, m.rightHandPos[0], 14, dt);
      this.rightArmPart.position.y = THREE.MathUtils.damp(this.rightArmPart.position.y, m.rightHandPos[1], 14, dt);
      this.rightArmPart.position.z = THREE.MathUtils.damp(this.rightArmPart.position.z, m.rightHandPos[2], 14, dt);
      this.rightArmPart.rotation.x = THREE.MathUtils.damp(this.rightArmPart.rotation.x, m.rightHandRot[0], 14, dt);
      this.rightArmPart.rotation.y = THREE.MathUtils.damp(this.rightArmPart.rotation.y, m.rightHandRot[1], 14, dt);
      this.rightArmPart.rotation.z = THREE.MathUtils.damp(this.rightArmPart.rotation.z, m.rightHandRot[2], 14, dt);
    }

    // Weapon inspection choreography ([F] key)
    let inspectX = 0;
    let inspectY = 0;
    let inspectZ = 0;
    let inspectPitch = 0;
    let inspectYaw = 0;
    let inspectRoll = 0;
    if (this.isInspecting) {
      this.inspectTimer -= dt;
      if (this.inspectTimer <= 0 || this.isReloading || this.zoomLevel > 0) {
        this.isInspecting = false;
        this.inspectTimer = 0;
      } else {
        const ip = 1 - this.inspectTimer / this.inspectDuration; // 0..1
        const envelope = Math.sin(ip * Math.PI);
        const turnSide = Math.sin(ip * Math.PI * 2); // Shows left side then tilts to right side
        inspectX = -0.075 * envelope;
        inspectY = 0.032 * envelope;
        inspectZ = 0.055 * envelope;
        inspectPitch = 0.14 * envelope;
        inspectYaw = 0.62 * envelope + turnSide * 0.24;
        inspectRoll = -0.44 * envelope + turnSide * 0.58;
      }
    }

    // Muzzle flash visibility
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      this.muzzleFlashGroup.visible = true;
      this.muzzleFlashGroup.rotation.z += dt * 45;
      const s = 0.68 + Math.random() * 0.55;
      this.muzzleFlashGroup.scale.setScalar(s);
    } else {
      this.muzzleFlashGroup.visible = false;
    }

    // Scope FOV interpolation
    let targetFov = baseFov;
    if (this.zoomLevel === 1 && def.zoomFov) {
      targetFov = def.zoomFov;
    } else if (this.zoomLevel === 2 && def.zoomFov) {
      targetFov = Math.max(14, def.zoomFov * 0.45);
    } else if (this.sprintBlend > 0.05) {
      targetFov = baseFov + this.sprintBlend * 3.5;
    }
    if (Math.abs(camera.fov - targetFov) > 0.08) {
      camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 16, dt);
      camera.updateProjectionMatrix();
    }

    const isSniperScoped = this.zoomLevel > 0 && def.hasSecondZoom;
    this.viewRoot.visible = !isSniperScoped;

    const bobFreq = isSprinting ? 11.2 : 8.0;
    const walkBobX = Math.cos(this.idleTime * bobFreq) * 0.011 * moveSpeedRatio;
    const walkBobY = Math.abs(Math.sin(this.idleTime * bobFreq)) * 0.013 * moveSpeedRatio;
    const idleBreath = Math.sin(this.idleTime * 2.0) * 0.0028;

    const meleeArc = Math.sin(this.meleeAnim * Math.PI);
    const stabArc = Math.sin(this.heavyStabAnim * Math.PI);
    const sprintOffsetX = -this.sprintBlend * 0.08;
    const sprintOffsetY = -this.sprintBlend * 0.045;
    const sprintYaw = this.sprintBlend * 0.55;
    const sprintRoll = -this.sprintBlend * 0.25;

    this.viewRoot.position.set(
      this.swayX + walkBobX - (isCrouching ? 0.014 : 0) + sprintOffsetX - meleeArc * 0.09 - stabArc * 0.05 + inspectX,
      this.swayY - walkBobY + idleBreath - this.switchAnim * 0.22 - reloadDip + sprintOffsetY - stabArc * 0.03 + inspectY,
      this.kickAnim * 0.052 - meleeArc * 0.19 - stabArc * 0.28 + inspectZ
    );
    this.viewRoot.rotation.set(
      this.kickAnim * 0.1 - meleeArc * 0.42 - stabArc * 0.55 - this.switchAnim * 0.35 + reloadPitch + inspectPitch,
      meleeArc * 0.55 + sprintYaw + inspectYaw,
      reloadRoll + sprintRoll + boltTilt - meleeArc * 0.45 + stabArc * 0.35 + inspectRoll
    );
  }

  public getCurrentSpread(inst: WeaponInstance, moveSpeedRatio: number, isCrouching: boolean, onGround: boolean): number {
    const def = WEAPON_DATABASE[inst.id];
    let spread = def.baseSpread;
    if (this.zoomLevel > 0) spread *= 0.22;
    if (isCrouching) spread *= 0.62;
    spread += moveSpeedRatio * def.moveSpread;
    if (!onGround) spread += 0.085;
    spread += this.spreadPenalty;
    return spread;
  }
}
