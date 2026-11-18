import * as THREE from 'three';
import { audioManager } from './AudioManager';
import { ColliderBox } from './MapManager';
import { settingsManager } from './SettingsManager';

const PLAYER_RADIUS = 0.42;
const STAND_HEIGHT = 1.78;
const CROUCH_HEIGHT = 1.22;
const STAND_EYE = 1.58;
const CROUCH_EYE = 1.06;
const GRAVITY = 21.5;
const JUMP_SPEED = 7.45;
const GROUND_FRICTION = 5.4;
const GROUND_ACCEL = 11.5;
const AIR_ACCEL = 18.0;
const AIR_WISH_CAP = 1.45;

export class PlayerController {
  public position = new THREE.Vector3(0, 0, 0);
  public velocity = new THREE.Vector3(0, 0, 0);
  public yaw = 0;
  public pitch = 0;
  public onGround = true;
  public isCrouching = false;
  public isWalking = false;
  public isSprinting = false;
  public moveSpeedRatio = 0;

  private eyeHeight = STAND_EYE;
  private stepAccumulator = 0;
  private wasOnGround = true;
  private landDip = 0;
  private stairSmoothOffset = 0;
  private bobTime = 0;
  private strafeTilt = 0;

  // Reusable scratch vectors to avoid GC in loop
  private readonly _forward = new THREE.Vector3();
  private readonly _right = new THREE.Vector3();
  private readonly _wishDir = new THREE.Vector3();
  private readonly _camUp = new THREE.Vector3(0, 1, 0);

  public reset(pos: THREE.Vector3, lookYaw = 0): void {
    this.position.copy(pos);
    this.velocity.set(0, 0, 0);
    this.yaw = lookYaw;
    this.pitch = 0;
    this.onGround = true;
    this.wasOnGround = true;
    this.isCrouching = false;
    this.isWalking = false;
    this.isSprinting = false;
    this.eyeHeight = STAND_EYE;
    this.landDip = 0;
    this.stairSmoothOffset = 0;
    this.stepAccumulator = 0;
    this.strafeTilt = 0;
  }

  public applyMouseDelta(dx: number, dy: number, zoomLevel: 0 | 1 | 2): void {
    const sens = settingsManager.get().mouseSensitivity;
    const zoomScale = zoomLevel === 2 ? 0.28 : zoomLevel === 1 ? 0.52 : 1.0;
    const factor = 0.0021 * sens * zoomScale;
    this.yaw -= dx * factor;
    this.pitch = THREE.MathUtils.clamp(this.pitch - dy * factor, -Math.PI / 2 + 0.04, Math.PI / 2 - 0.04);
  }

  private canStandUp(colliders: ColliderBox[]): boolean {
    const pMinY = this.position.y + CROUCH_HEIGHT * 0.6;
    const pMaxY = this.position.y + STAND_HEIGHT;
    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      if (pMaxY <= c.minY || pMinY >= c.maxY) continue;
      if (
        this.position.x + PLAYER_RADIUS > c.minX &&
        this.position.x - PLAYER_RADIUS < c.maxX &&
        this.position.z + PLAYER_RADIUS > c.minZ &&
        this.position.z - PLAYER_RADIUS < c.maxZ
      ) {
        return false;
      }
    }
    return true;
  }

  public update(
    dt: number,
    keys: Record<string, boolean>,
    colliders: ColliderBox[],
    weaponSpeedMult: number,
    surfaceType: 'sand' | 'concrete' | 'metal',
    frozen: boolean,
    camera: THREE.PerspectiveCamera,
    recoilPitchOffset: number,
    recoilYawOffset: number,
    onFallImpact?: (impactSpeed: number) => void
  ): void {
    const kb = settingsManager.get().keybinds;
    const wantsCrouch = !frozen && Boolean(keys[kb.crouch]);
    if (wantsCrouch) {
      this.isCrouching = true;
    } else if (this.isCrouching && this.canStandUp(colliders)) {
      this.isCrouching = false;
    }
    this.isWalking = Boolean(keys[kb.walk]);

    const targetEye = this.isCrouching ? CROUCH_EYE : STAND_EYE;
    this.eyeHeight = THREE.MathUtils.damp(this.eyeHeight, targetEye, 15, dt);

    // Direction vectors from yaw
    this._forward.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    this._right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));

    let fInput = 0;
    let rInput = 0;
    if (!frozen) {
      if (keys[kb.forward]) fInput += 1;
      if (keys[kb.backward]) fInput -= 1;
      if (keys[kb.right]) rInput += 1;
      if (keys[kb.left]) rInput -= 1;
    }

    this._wishDir.set(0, 0, 0);
    if (fInput !== 0 || rInput !== 0) {
      this._wishDir.addScaledVector(this._forward, fInput);
      this._wishDir.addScaledVector(this._right, rInput);
      this._wishDir.normalize();
    }

    // Sprinting when moving forward without walk/crouch and holding Alt/V or lightweight weapon
    const sprintKey = Boolean(keys['AltLeft'] || keys['KeyV']);
    this.isSprinting =
      !frozen &&
      !this.isCrouching &&
      !this.isWalking &&
      fInput > 0 &&
      (sprintKey || weaponSpeedMult >= 1.02);

    let maxSpeed = 6.5 * weaponSpeedMult;
    if (this.isCrouching) maxSpeed *= 0.52;
    else if (this.isWalking) maxSpeed *= 0.54;
    else if (this.isSprinting) maxSpeed *= 1.15;

    if (this.onGround) {
      // GoldSrc PM_Friction: crisp counter-strafe stopping
      const speed = Math.hypot(this.velocity.x, this.velocity.z);
      if (speed > 0.001) {
        const control = Math.max(speed, 2.6);
        const drop = control * GROUND_FRICTION * dt;
        const newSpeed = Math.max(0, speed - drop);
        const scale = newSpeed / speed;
        this.velocity.x *= scale;
        this.velocity.z *= scale;
      }

      // GoldSrc PM_Accelerate
      if (this._wishDir.lengthSq() > 0) {
        const currentSpeed = this.velocity.x * this._wishDir.x + this.velocity.z * this._wishDir.z;
        const addSpeed = maxSpeed - currentSpeed;
        if (addSpeed > 0) {
          const accelSpeed = Math.min(addSpeed, GROUND_ACCEL * maxSpeed * dt);
          this.velocity.x += accelSpeed * this._wishDir.x;
          this.velocity.z += accelSpeed * this._wishDir.z;
        }
      }
    } else {
      // GoldSrc PM_AirAccelerate: enables smooth air-strafing & bhop flow
      if (this._wishDir.lengthSq() > 0) {
        const wishSpeed = Math.min(maxSpeed, AIR_WISH_CAP);
        const currentSpeed = this.velocity.x * this._wishDir.x + this.velocity.z * this._wishDir.z;
        const addSpeed = wishSpeed - currentSpeed;
        if (addSpeed > 0) {
          const accelSpeed = Math.min(addSpeed, AIR_ACCEL * maxSpeed * dt);
          this.velocity.x += accelSpeed * this._wishDir.x;
          this.velocity.z += accelSpeed * this._wishDir.z;
        }
      }
    }

    if (!frozen && keys[kb.jump] && this.onGround) {
      this.velocity.y = JUMP_SPEED;
      this.onGround = false;
      audioManager.playFootstep(surfaceType, 0.16);
    }

    // Gravity
    this.velocity.y -= GRAVITY * dt;
    const preImpactVy = this.velocity.y;

    // Move & collide X, Z, Y separately for clean wall sliding and smooth stair stepping
    const activeHeight = this.isCrouching ? CROUCH_HEIGHT : STAND_HEIGHT;
    const prevY = this.position.y;

    this.position.x += this.velocity.x * dt;
    this.resolveHorizontal(colliders, activeHeight, 'x');

    this.position.z += this.velocity.z * dt;
    this.resolveHorizontal(colliders, activeHeight, 'z');

    this.position.y += this.velocity.y * dt;
    this.resolveVertical(colliders, activeHeight);

    const steppedDelta = this.position.y - prevY;
    if (this.onGround && steppedDelta > 0.04 && steppedDelta <= 0.46) {
      this.stairSmoothOffset = Math.min(0.45, this.stairSmoothOffset + steppedDelta);
    }
    this.stairSmoothOffset = THREE.MathUtils.damp(this.stairSmoothOffset, 0, 22, dt);

    // Smooth landing cushion, footstep thud & CS 1.6 fall damage
    if (!this.wasOnGround && this.onGround) {
      const impact = Math.abs(preImpactVy);
      this.landDip = Math.min(0.22, 0.065 + Math.max(0, impact - 6) * 0.012);
      audioManager.playFootstep(surfaceType, Math.min(0.55, 0.28 + Math.max(0, impact - 8) * 0.03));
      if (impact > 13.2 && onFallImpact) {
        onFallImpact(impact);
      }
    }
    this.wasOnGround = this.onGround;
    this.landDip = THREE.MathUtils.damp(this.landDip, 0, 12, dt);

    const horizSpeed = Math.hypot(this.velocity.x, this.velocity.z);
    this.moveSpeedRatio = THREE.MathUtils.clamp(horizSpeed / 6.5, 0, 1.25);

    if (this.onGround && horizSpeed > 2.2 && !this.isWalking && !this.isCrouching) {
      this.stepAccumulator += horizSpeed * dt;
      const stepStride = this.isSprinting ? 2.0 : 2.25;
      if (this.stepAccumulator >= stepStride) {
        this.stepAccumulator = 0;
        audioManager.playFootstep(surfaceType, this.isSprinting ? 0.28 : 0.22);
      }
    }

    if (this.onGround && horizSpeed > 0.45) {
      const bobRate = this.isSprinting ? 12.2 : this.isWalking || this.isCrouching ? 6.5 : 10.2;
      this.bobTime += dt * bobRate;
    }

    const headBob = this.onGround ? Math.sin(this.bobTime * 2) * 0.018 * Math.min(1, this.moveSpeedRatio) : 0;
    const targetTilt = -rInput * 0.014;
    this.strafeTilt = THREE.MathUtils.damp(this.strafeTilt, targetTilt, 10, dt);

    // Apply smooth camera transform & sync 3D Web Audio listener
    camera.position.set(
      this.position.x,
      this.position.y - this.stairSmoothOffset + this.eyeHeight - this.landDip + headBob,
      this.position.z
    );
    camera.rotation.order = 'YXZ';
    camera.rotation.y = this.yaw + recoilYawOffset;
    camera.rotation.x = THREE.MathUtils.clamp(
      this.pitch + recoilPitchOffset,
      -Math.PI / 2 + 0.03,
      Math.PI / 2 - 0.03
    );
    camera.rotation.z = this.strafeTilt;

    camera.getWorldDirection(this._forward);
    audioManager.updateListener(camera.position, this._forward, this._camUp);
  }

  private resolveHorizontal(colliders: ColliderBox[], height: number, axis: 'x' | 'z'): void {
    const pMinY = this.position.y + 0.05;
    const pMaxY = this.position.y + height;

    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      if (pMaxY <= c.minY || pMinY >= c.maxY) continue;

      if (
        this.position.x + PLAYER_RADIUS > c.minX &&
        this.position.x - PLAYER_RADIUS < c.maxX &&
        this.position.z + PLAYER_RADIUS > c.minZ &&
        this.position.z - PLAYER_RADIUS < c.maxZ
      ) {
        const stepHeight = c.maxY - this.position.y;
        if (stepHeight > 0 && stepHeight <= 0.45 && this.onGround) {
          this.position.y = c.maxY;
          continue;
        }

        if (axis === 'x') {
          const pushLeft = c.minX - (this.position.x + PLAYER_RADIUS);
          const pushRight = c.maxX - (this.position.x - PLAYER_RADIUS);
          this.position.x += Math.abs(pushLeft) < Math.abs(pushRight) ? pushLeft : pushRight;
          this.velocity.x = 0;
        } else {
          const pushBack = c.minZ - (this.position.z + PLAYER_RADIUS);
          const pushFwd = c.maxZ - (this.position.z - PLAYER_RADIUS);
          this.position.z += Math.abs(pushBack) < Math.abs(pushFwd) ? pushBack : pushFwd;
          this.velocity.z = 0;
        }
      }
    }
  }

  private resolveVertical(colliders: ColliderBox[], height: number): void {
    this.onGround = false;

    if (this.position.y <= 0) {
      this.position.y = 0;
      if (this.velocity.y < 0) this.velocity.y = 0;
      this.onGround = true;
    }

    for (let i = 0; i < colliders.length; i++) {
      const c = colliders[i];
      if (
        this.position.x + PLAYER_RADIUS * 0.9 > c.minX &&
        this.position.x - PLAYER_RADIUS * 0.9 < c.maxX &&
        this.position.z + PLAYER_RADIUS * 0.9 > c.minZ &&
        this.position.z - PLAYER_RADIUS * 0.9 < c.maxZ
      ) {
        if (this.velocity.y <= 0 && this.position.y >= c.maxY - 0.35 && this.position.y <= c.maxY + 0.08) {
          this.position.y = c.maxY;
          this.velocity.y = 0;
          this.onGround = true;
        } else if (
          this.velocity.y > 0 &&
          this.position.y + height > c.minY &&
          this.position.y < c.minY
        ) {
          this.position.y = c.minY - height;
          this.velocity.y = 0;
        }
      }
    }
  }
}
