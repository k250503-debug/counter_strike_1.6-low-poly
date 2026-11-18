import * as THREE from 'three';
import { audioManager } from './AudioManager';
import { WEAPON_DATABASE } from './WeaponDatabase';
import { buildFirstPersonHands, buildWeaponModel } from './WeaponModels';
import { Team, WeaponId, WeaponInstance, CharacterClassId } from './types';

export class WeaponController {
  public viewRoot = new THREE.Group();
  private weaponPivot = new THREE.Group();
  private handsGroup: THREE.Group;
  private currentModel: THREE.Group | null = null;
  private muzzleFlashMesh: THREE.Mesh;

  private activeWeaponId: WeaponId = 'usp';
  private activeTeam: Team = 'CT';
  private activeClassId: CharacterClassId | undefined = 'classic_ct';
  private activeSilenced = true;

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

    // Multi-layered stylized muzzle flash star geometry
    const flashGeo = new THREE.OctahedronGeometry(0.065, 0);
    const flashMat = new THREE.MeshBasicMaterial({
      color: 0xffd57a,
      transparent: true,
      opacity: 0.92,
    });
    this.muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
    this.muzzleFlashMesh.visible = false;
    this.weaponPivot.add(this.muzzleFlashMesh);
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

  private disposeSubtree(root: THREE.Object3D): void {
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = (obj as { material?: THREE.Material | THREE.Material[] }).material;
      if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
      else if (mat) mat.dispose();
    });
  }

  public setTeam(team: Team, classId?: CharacterClassId): void {
    if (this.activeTeam === team && this.activeClassId === classId) return;
    this.activeTeam = team;
    this.activeClassId = classId;
    this.weaponPivot.remove(this.handsGroup);
    this.disposeSubtree(this.handsGroup);
    this.handsGroup = buildFirstPersonHands(team, classId);
    this.weaponPivot.add(this.handsGroup);
    this.cacheHandParts();
  }

  public equip(inst: WeaponInstance): void {
    const same = this.activeWeaponId === inst.id && this.activeSilenced === Boolean(inst.silenced);
    this.activeWeaponId = inst.id;
    this.activeSilenced = Boolean(inst.silenced);
    this.isReloading = false;
    this.reloadTimer = 0;
    this.boltCycleAnim = 0;
    this.shotCount = 0;
    this.shotResetTimer = 0;
    this.zoomLevel = 0;
    this.switchAnim = 1.0;

    if (!same || !this.currentModel) {
      if (this.currentModel) {
        this.weaponPivot.remove(this.currentModel);
        this.disposeSubtree(this.currentModel);
      }
      this.currentModel = buildWeaponModel(inst.id, Boolean(inst.silenced));
      this.weaponPivot.add(this.currentModel);
      this.cacheWeaponParts();
    }

    audioManager.playReloadStage('weapon_switch');

    // Reset sub-parts
    if (this.magPart) this.magPart.position.set(0, 0, 0);
    if (this.slidePart) this.slidePart.position.set(0, 0, 0);
    if (this.boltPart) {
      this.boltPart.position.set(0, 0, 0);
      this.boltPart.rotation.set(0, 0, 0);
    }
    if (this.chargingPart) this.chargingPart.position.set(0, 0, 0);

    // Classic CS 1.6 first-person viewmodel framing
    const def = WEAPON_DATABASE[inst.id];
    if (inst.id === 'knife') {
      this.weaponPivot.position.set(0.21, -0.21, -0.32);
      this.weaponPivot.rotation.set(0.14, 0.22, -0.18);
    } else if (def.slot === 'grenade' || inst.id === 'c4') {
      this.weaponPivot.position.set(0.21, -0.22, -0.31);
      this.weaponPivot.rotation.set(0.08, 0.14, 0);
    } else if (def.slot === 'secondary') {
      this.weaponPivot.position.set(0.19, -0.19, -0.33);
      this.weaponPivot.rotation.set(0.025, 0.06, 0.02);
    } else {
      this.weaponPivot.position.set(0.2, -0.195, -0.32);
      this.weaponPivot.rotation.set(0.025, 0.06, 0.02);
    }
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
    this.zoomLevel = 0;
    this.boltCycleAnim = 0;
    this.reloadDuration = def.reloadTime;
    this.reloadTimer = def.reloadTime;
    this.reloadStageFired = { out: false, in: false, rack: false };
    return true;
  }

  public tryToggleAltFire(inst: WeaponInstance): void {
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
    this.fireCooldown = 0.85;
    this.heavyStabAnim = 1.0;
    audioManager.playKnifeSlash();
    return true;
  }

  public triggerFire(inst: WeaponInstance): boolean {
    if (!this.canFire()) return false;
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
      this.flashTimer = 0.045;
    }

    // Authentic CS 1.6 recoil curve: crisp vertical first 3 shots, then structured T-pattern sweep
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
      isSprinting && !this.isReloading && this.zoomLevel === 0 ? 1 : 0,
      10,
      dt
    );

    if (this.shotResetTimer > 0) {
      this.shotResetTimer -= dt;
      if (this.shotResetTimer <= 0) {
        this.shotCount = 0;
      }
    }

    // Recoil & spread recovery
    this.recoilPitch = THREE.MathUtils.damp(this.recoilPitch, 0, 10.5, dt);
    this.recoilYaw = THREE.MathUtils.damp(this.recoilYaw, 0, 10.5, dt);
    this.spreadPenalty = THREE.MathUtils.damp(this.spreadPenalty, 0, 8.5, dt);

    this.swayX = THREE.MathUtils.damp(this.swayX, 0, 10, dt);
    this.swayY = THREE.MathUtils.damp(this.swayY, 0, 10, dt);

    // Multi-stage synchronized Reload completion & audio cues
    const def = WEAPON_DATABASE[inst.id];
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

      // Tilt rifle inward so magazine & bolt are clearly animated in first-person view
      const envelope = Math.sin(p * Math.PI);
      reloadDip = envelope * 0.08;
      reloadRoll = -envelope * 0.42;
      reloadPitch = envelope * 0.28;

      // Animate magazine physically sliding out and snapping back in
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

      // Animate left hand reaching to magwell, dropping mag, then racking charging handle
      if (this.leftArmPart) {
        if (p < 0.72) {
          const handDrop = Math.sin(Math.min(1, p / 0.72) * Math.PI);
          this.leftArmPart.position.set(0.04 * handDrop, -0.14 * handDrop, 0.08 * handDrop);
          this.leftArmPart.rotation.set(0.35 * handDrop, 0.18 * handDrop, 0.25 * handDrop);
        } else {
          const rackT = Math.sin(((p - 0.72) / 0.28) * Math.PI);
          this.leftArmPart.position.set(0.04 * rackT, 0.03 * rackT, 0.14 * rackT);
          this.leftArmPart.rotation.set(0, -0.12 * rackT, 0);
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
    } else {
      if (this.leftArmPart) {
        this.leftArmPart.position.x = THREE.MathUtils.damp(this.leftArmPart.position.x, 0, 14, dt);
        this.leftArmPart.position.y = THREE.MathUtils.damp(this.leftArmPart.position.y, 0, 14, dt);
        this.leftArmPart.position.z = THREE.MathUtils.damp(this.leftArmPart.position.z, 0, 14, dt);
        this.leftArmPart.rotation.x = THREE.MathUtils.damp(this.leftArmPart.rotation.x, 0, 14, dt);
        this.leftArmPart.rotation.y = THREE.MathUtils.damp(this.leftArmPart.rotation.y, 0, 14, dt);
        this.leftArmPart.rotation.z = THREE.MathUtils.damp(this.leftArmPart.rotation.z, 0, 14, dt);
      }
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
      const bPhase = 1 - this.boltCycleAnim; // 0..1
      if (bPhase > 0.18 && bPhase < 0.88) {
        const arc = Math.sin(((bPhase - 0.18) / 0.7) * Math.PI);
        this.boltPart.rotation.z = arc * 0.85;
        this.boltPart.position.z = arc * 0.075;
        boltTilt = arc * 0.22;
        if (this.rightArmPart) {
          this.rightArmPart.position.set(0.02 * arc, 0.04 * arc, 0.05 * arc);
        }
      } else {
        this.boltPart.rotation.z = THREE.MathUtils.damp(this.boltPart.rotation.z, 0, 16, dt);
        this.boltPart.position.z = THREE.MathUtils.damp(this.boltPart.position.z, 0, 16, dt);
        if (this.rightArmPart) {
          this.rightArmPart.position.x = THREE.MathUtils.damp(this.rightArmPart.position.x, 0, 14, dt);
          this.rightArmPart.position.y = THREE.MathUtils.damp(this.rightArmPart.position.y, 0, 14, dt);
          this.rightArmPart.position.z = THREE.MathUtils.damp(this.rightArmPart.position.z, 0, 14, dt);
        }
      }
    } else if (this.rightArmPart) {
      this.rightArmPart.position.x = THREE.MathUtils.damp(this.rightArmPart.position.x, 0, 14, dt);
      this.rightArmPart.position.y = THREE.MathUtils.damp(this.rightArmPart.position.y, 0, 14, dt);
      this.rightArmPart.position.z = THREE.MathUtils.damp(this.rightArmPart.position.z, 0, 14, dt);
    }

    // Muzzle flash visibility
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      this.muzzleFlashMesh.visible = true;
      this.muzzleFlashMesh.position.set(0, 0.025, -0.58);
      this.muzzleFlashMesh.rotation.z += dt * 45;
      const s = 0.72 + Math.random() * 0.65;
      this.muzzleFlashMesh.scale.setScalar(s);
    } else {
      this.muzzleFlashMesh.visible = false;
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

    // Hide viewmodel when sniper scope overlay is active
    const isSniperScoped = this.zoomLevel > 0 && def.hasSecondZoom;
    this.viewRoot.visible = !isSniperScoped;

    // Smooth walk/run/sprint bob + idle breath + weapon recoil + melee slash
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
      this.swayX + walkBobX - (isCrouching ? 0.014 : 0) + sprintOffsetX - meleeArc * 0.09 - stabArc * 0.05,
      this.swayY - walkBobY + idleBreath - this.switchAnim * 0.22 - reloadDip + sprintOffsetY - stabArc * 0.03,
      this.kickAnim * 0.052 - meleeArc * 0.19 - stabArc * 0.28
    );
    this.viewRoot.rotation.set(
      this.kickAnim * 0.1 - meleeArc * 0.42 - stabArc * 0.55 - this.switchAnim * 0.35 + reloadPitch,
      meleeArc * 0.55 + sprintYaw,
      reloadRoll + sprintRoll + boltTilt - meleeArc * 0.45 + stabArc * 0.35
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
