import * as THREE from 'three';
import { settingsManager } from './SettingsManager';
import { WeaponId } from './types';

/**
 * 100% Procedural 3D Spatial Web Audio Engine:
 * - True Web Audio API PannerNode 3D spatialization synced to player camera
 * - Distance-based lowpass air absorption & indoor/outdoor acoustic reflections
 * - Distinct multi-layered synthesis for AK-47, M4A1, AWP, Deagle, SMGs, Shotguns, Pistols
 * - Synchronized reload stage mechanics, weapon switch clicks, footsteps, ricochets, & wind bed
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterSfx: GainNode | null = null;
  private masterMusic: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private menuDroneStop: (() => void) | null = null;
  private ambientWindStop: (() => void) | null = null;
  private isMuted = false;

  private listenerPos = new THREE.Vector3();

  constructor() {
    settingsManager.subscribe((s) => {
      if (this.masterSfx && this.ctx) {
        this.masterSfx.gain.setTargetAtTime(s.soundVolume, this.ctx.currentTime, 0.03);
      }
      if (this.masterMusic && this.ctx) {
        this.masterMusic.gain.setTargetAtTime(s.musicVolume, this.ctx.currentTime, 0.05);
      }
    });
  }

  public unlock(): void {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();
      this.masterSfx = this.ctx.createGain();
      this.masterMusic = this.ctx.createGain();
      const s = settingsManager.get();
      this.masterSfx.gain.value = s.soundVolume;
      this.masterMusic.gain.value = s.musicVolume;
      this.masterSfx.connect(this.ctx.destination);
      this.masterMusic.connect(this.ctx.destination);
      this.noiseBuffer = this.createNoiseBuffer(2.5);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public updateListener(pos: THREE.Vector3, forward: THREE.Vector3, up: THREE.Vector3): void {
    this.listenerPos.copy(pos);
    if (!this.ctx) return;
    const l = this.ctx.listener;
    const t = this.ctx.currentTime;
    if (l.positionX) {
      l.positionX.setValueAtTime(pos.x, t);
      l.positionY.setValueAtTime(pos.y, t);
      l.positionZ.setValueAtTime(pos.z, t);
      l.forwardX.setValueAtTime(forward.x, t);
      l.forwardY.setValueAtTime(forward.y, t);
      l.forwardZ.setValueAtTime(forward.z, t);
      l.upX.setValueAtTime(up.x, t);
      l.upY.setValueAtTime(up.y, t);
      l.upZ.setValueAtTime(up.z, t);
    } else if (typeof l.setPosition === 'function') {
      l.setPosition(pos.x, pos.y, pos.z);
      l.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
    }
  }

  private createNoiseBuffer(seconds: number): AudioBuffer {
    const ctx = this.ctx!;
    const length = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buf.getChannelData(0);
    // Warm pink-tinted white noise blend for richer organic acoustics
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.95 * b2 + white * 0.048;
      data[i] = Math.max(-1, Math.min(1, white * 0.65 + (b0 + b1 + b2) * 1.4));
    }
    return buf;
  }

  private routeOutput(worldPos?: THREE.Vector3, maxDist = 75): AudioNode {
    if (!this.ctx || !this.masterSfx) {
      throw new Error('Audio not ready');
    }
    if (!worldPos) return this.masterSfx;

    const panner = this.ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = 3.5;
    panner.maxDistance = maxDist;
    panner.rolloffFactor = 1.25;
    const t = this.ctx.currentTime;
    if (panner.positionX) {
      panner.positionX.setValueAtTime(worldPos.x, t);
      panner.positionY.setValueAtTime(worldPos.y, t);
      panner.positionZ.setValueAtTime(worldPos.z, t);
    } else {
      panner.setPosition(worldPos.x, worldPos.y, worldPos.z);
    }
    panner.connect(this.masterSfx);
    return panner;
  }

  public startAmbientWind(indoor = false): void {
    this.unlock();
    if (!this.ctx || !this.masterSfx || !this.noiseBuffer || this.ambientWindStop) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(indoor ? 160 : 340, now);
    filter.Q.value = indoor ? 1.8 : 0.7;

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.14;
    lfoGain.gain.value = indoor ? 35 : 140;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(indoor ? 0.025 : 0.045, now + 1.2);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterSfx);

    src.start(now);
    lfo.start(now);

    this.ambientWindStop = () => {
      const t = ctx.currentTime;
      gain.gain.setTargetAtTime(0.0001, t, 0.2);
      setTimeout(() => {
        try {
          src.stop();
          lfo.stop();
          gain.disconnect();
        } catch {
          // ignore
        }
      }, 400);
    };
  }

  public stopAmbientWind(): void {
    if (this.ambientWindStop) {
      this.ambientWindStop();
      this.ambientWindStop = null;
    }
  }

  public startMenuMusic(): void {
    this.unlock();
    if (!this.ctx || !this.masterMusic || this.menuDroneStop) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(55, now);
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(82.41, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(175, now);
    filter.Q.value = 2.4;

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.22, now + 1.5);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterMusic);

    osc1.start();
    osc2.start();

    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.18;
    lfoGain.gain.value = 60;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    this.menuDroneStop = () => {
      const t = ctx.currentTime;
      gain.gain.setTargetAtTime(0.0001, t, 0.25);
      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
          lfo.stop();
          gain.disconnect();
        } catch {
          // ignore
        }
      }, 600);
    };
  }

  public stopMenuMusic(): void {
    if (this.menuDroneStop) {
      this.menuDroneStop();
      this.menuDroneStop = null;
    }
  }

  public playWeaponFire(
    weaponId: WeaponId,
    silenced = false,
    distanceAttenuation = 1.0,
    worldPos?: THREE.Vector3,
    isIndoor = false
  ): void {
    if (this.isMuted || !this.ctx || !this.masterSfx || !this.noiseBuffer) return;
    if (distanceAttenuation <= 0.02) return;
    if (weaponId === 'knife') {
      this.playKnifeSlash();
      return;
    }

    const ctx = this.ctx;
    const now = ctx.currentTime;
    const dist = worldPos ? worldPos.distanceTo(this.listenerPos) : 0;
    const vol = Math.min(1, distanceAttenuation);
    const out = this.routeOutput(worldPos, 85);

    // Weapon-specific multi-stage acoustic profile
    let bodyFreq = 165;
    let crackFreq = 1850;
    let duration = 0.17;
    let punch = 0.72;
    let mechSnap = true;

    if (weaponId === 'awp') {
      bodyFreq = 84;
      crackFreq = 1280;
      duration = 0.56;
      punch = 1.0;
    } else if (weaponId === 'scout' || weaponId === 'g3sg1' || weaponId === 'sg550') {
      bodyFreq = 115;
      crackFreq = 1650;
      duration = 0.34;
      punch = 0.88;
    } else if (weaponId === 'ak47') {
      bodyFreq = 132;
      crackFreq = 1580;
      duration = 0.23;
      punch = 0.9;
    } else if (weaponId === 'm4a1' || weaponId === 'aug' || weaponId === 'sg552' || weaponId === 'galil' || weaponId === 'famas') {
      bodyFreq = silenced ? 290 : 178;
      crackFreq = silenced ? 2550 : 2150;
      duration = silenced ? 0.095 : 0.16;
      punch = silenced ? 0.34 : 0.7;
    } else if (weaponId === 'deagle') {
      bodyFreq = 108;
      crackFreq = 1380;
      duration = 0.32;
      punch = 0.94;
    } else if (weaponId === 'm3' || weaponId === 'xm1014') {
      bodyFreq = 92;
      crackFreq = 920;
      duration = 0.38;
      punch = 0.98;
    } else if (weaponId === 'm249') {
      bodyFreq = 148;
      crackFreq = 1750;
      duration = 0.22;
      punch = 0.85;
    } else if (weaponId === 'mp5' || weaponId === 'tmp' || weaponId === 'mac10' || weaponId === 'ump45' || weaponId === 'p90') {
      bodyFreq = weaponId === 'tmp' ? 320 : 215;
      crackFreq = weaponId === 'tmp' ? 2850 : 2350;
      duration = weaponId === 'tmp' ? 0.08 : 0.12;
      punch = weaponId === 'tmp' ? 0.32 : 0.54;
    } else if (weaponId === 'usp' && silenced) {
      bodyFreq = 350;
      crackFreq = 2950;
      duration = 0.08;
      punch = 0.28;
    } else {
      bodyFreq = 195;
      crackFreq = 2200;
      duration = 0.13;
      punch = 0.55;
    }

    // Distance air absorption cuts harsh highs on distant shots
    const airCutoff = Math.max(550, 9000 - dist * 135);
    const airLp = ctx.createBiquadFilter();
    airLp.type = 'lowpass';
    airLp.frequency.setValueAtTime(airCutoff, now);
    airLp.connect(out);

    // 1. Explosive propellant transient crack
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(crackFreq, now);
    bp.frequency.exponentialRampToValueAtTime(280, now + duration);
    bp.Q.value = silenced ? 2.4 : 0.8;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(punch * vol * 0.75, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noise.connect(bp);
    bp.connect(noiseGain);
    noiseGain.connect(airLp);
    noise.start(now);
    noise.stop(now + duration + 0.02);

    // 2. Low-end chest thump
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(bodyFreq, now);
    osc.frequency.exponentialRampToValueAtTime(34, now + Math.min(0.16, duration));

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(punch * vol * 0.68, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + Math.min(0.18, duration));

    osc.connect(oscGain);
    oscGain.connect(airLp);
    osc.start(now);
    osc.stop(now + Math.min(0.19, duration));

    // 3. Mechanical bolt clack (close-up tactile crispness)
    if (mechSnap && dist < 10) {
      const boltOsc = ctx.createOscillator();
      boltOsc.type = 'square';
      boltOsc.frequency.setValueAtTime(silenced ? 1900 : 2600, now);
      boltOsc.frequency.exponentialRampToValueAtTime(520, now + 0.022);
      const boltGain = ctx.createGain();
      boltGain.gain.setValueAtTime(0.11 * vol, now);
      boltGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      boltOsc.connect(boltGain);
      boltGain.connect(airLp);
      boltOsc.start(now);
      boltOsc.stop(now + 0.03);
    }

    // 4. Acoustic tail reflection (indoor tighter slapback vs outdoor canyon echo)
    if (!silenced && punch > 0.55) {
      const tailDelay = isIndoor ? 0.045 : 0.14;
      const tailNoise = ctx.createBufferSource();
      tailNoise.buffer = this.noiseBuffer;
      const tailLp = ctx.createBiquadFilter();
      tailLp.type = 'lowpass';
      tailLp.frequency.setValueAtTime(isIndoor ? 1100 : 720, now + tailDelay);
      const tailGain = ctx.createGain();
      tailGain.gain.setValueAtTime(0.001, now);
      tailGain.gain.setValueAtTime(punch * vol * (isIndoor ? 0.19 : 0.15), now + tailDelay);
      tailGain.gain.exponentialRampToValueAtTime(0.001, now + tailDelay + (isIndoor ? 0.24 : 0.48));
      tailNoise.connect(tailLp);
      tailLp.connect(tailGain);
      tailGain.connect(airLp);
      tailNoise.start(now + tailDelay);
      tailNoise.stop(now + tailDelay + 0.52);
    }

    // 5. AWP delayed bolt-cycle clack when player shoots
    if (weaponId === 'awp' && !worldPos) {
      this.playReloadStage('bolt_rack', 0.42);
    }
  }

  public playKnifeSlash(): void {
    if (!this.ctx || !this.masterSfx || !this.noiseBuffer) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(850, now);
    filter.frequency.exponentialRampToValueAtTime(3400, now + 0.085);
    filter.Q.value = 3.2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.38, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterSfx);
    noise.start(now);
    noise.stop(now + 0.16);
  }

  public playReloadStage(
    stage: 'mag_out' | 'mag_in' | 'bolt_rack' | 'weapon_switch',
    delaySec = 0
  ): void {
    if (!this.ctx || !this.masterSfx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime + delaySec;

    const osc = ctx.createOscillator();
    osc.type = stage === 'mag_in' ? 'triangle' : 'square';
    const fStart =
      stage === 'mag_out'
        ? 980
        : stage === 'mag_in'
        ? 560
        : stage === 'bolt_rack'
        ? 1480
        : 1180;
    const fEnd = stage === 'mag_in' ? 190 : 320;
    const dur = stage === 'bolt_rack' ? 0.085 : 0.055;

    osc.frequency.setValueAtTime(fStart, t);
    osc.frequency.exponentialRampToValueAtTime(fEnd, t + dur);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = fStart * 1.1;
    filter.Q.value = 1.4;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(stage === 'weapon_switch' ? 0.12 : 0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.01);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterSfx);
    osc.start(t);
    osc.stop(t + dur + 0.02);

    if (stage === 'bolt_rack' && this.noiseBuffer) {
      const n = ctx.createBufferSource();
      n.buffer = this.noiseBuffer;
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 2200;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(0.11, t + 0.03);
      ng.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
      n.connect(hp);
      hp.connect(ng);
      ng.connect(this.masterSfx);
      n.start(t + 0.03);
      n.stop(t + 0.12);
    }
  }

  public playReload(): void {
    this.playReloadStage('mag_out', 0.12);
    this.playReloadStage('mag_in', 0.92);
    this.playReloadStage('bolt_rack', 1.65);
  }

  public playDryFire(): void {
    if (!this.ctx || !this.masterSfx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1650, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.025);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
    osc.connect(gain);
    gain.connect(this.masterSfx);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  public playFootstep(
    surface: 'sand' | 'concrete' | 'metal' = 'sand',
    volume = 0.22,
    worldPos?: THREE.Vector3
  ): void {
    if (!this.ctx || !this.masterSfx || !this.noiseBuffer) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const out = this.routeOutput(worldPos, 28);

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = surface === 'metal' ? 'bandpass' : 'lowpass';
    filter.frequency.value = surface === 'metal' ? 1650 : surface === 'concrete' ? 760 : 520;
    filter.Q.value = surface === 'metal' ? 3.5 : 1.0;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (surface === 'sand' ? 0.11 : 0.075));
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(out);
    noise.start(now);
    noise.stop(now + 0.12);
  }

  public playRicochet(worldPos: THREE.Vector3): void {
    if (!this.ctx || !this.masterSfx) return;
    if (worldPos.distanceTo(this.listenerPos) > 28) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const out = this.routeOutput(worldPos, 30);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const base = 2400 + Math.random() * 1100;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.exponentialRampToValueAtTime(base * 0.45, now + 0.18);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
    osc.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playDeathCue(worldPos?: THREE.Vector3): void {
    if (!this.ctx || !this.masterSfx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const out = this.routeOutput(worldPos, 32);

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(165 + Math.random() * 30, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.24);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 460;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
    osc.connect(lp);
    lp.connect(gain);
    gain.connect(out);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  public playHitMarker(headshot = false): void {
    if (!this.ctx || !this.masterSfx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = headshot ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(headshot ? 1750 : 980, now);
    osc.frequency.exponentialRampToValueAtTime(headshot ? 720 : 440, now + 0.075);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(headshot ? 0.38 : 0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
    osc.connect(gain);
    gain.connect(this.masterSfx);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playExplosion(distanceAttenuation = 1.0, worldPos?: THREE.Vector3): void {
    if (!this.ctx || !this.masterSfx || !this.noiseBuffer) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const vol = Math.max(0.08, Math.min(1.0, distanceAttenuation));
    const out = this.routeOutput(worldPos, 110);

    const noise = ctx.createBufferSource();
    noise.buffer = this.noiseBuffer;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(720, now);
    lp.frequency.exponentialRampToValueAtTime(70, now + 1.0);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * 0.95, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.15);
    noise.connect(lp);
    lp.connect(gain);
    gain.connect(out);
    noise.start(now);
    noise.stop(now + 1.2);

    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(92, now);
    sub.frequency.exponentialRampToValueAtTime(22, now + 0.7);
    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(vol * 0.9, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
    sub.connect(subGain);
    subGain.connect(out);
    sub.start(now);
    sub.stop(now + 0.8);
  }

  public playFlashbang(): void {
    if (!this.ctx || !this.masterSfx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(3400, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
    osc.connect(gain);
    gain.connect(this.masterSfx);
    osc.start(now);
    osc.stop(now + 1.65);
  }

  public playBombBeep(urgent = false): void {
    if (!this.ctx || !this.masterSfx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(urgent ? 2550 : 2100, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(this.masterSfx);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playBuyClick(): void {
    if (!this.ctx || !this.masterSfx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(760, now);
    osc.frequency.exponentialRampToValueAtTime(1180, now + 0.06);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(this.masterSfx);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playRadioCue(type: 'go' | 'bomb_planted' | 'bomb_defused' | 'ct_win' | 't_win'): void {
    if (!this.ctx || !this.masterSfx) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const notes =
      type === 'go'
        ? [520, 680]
        : type === 'bomb_planted'
        ? [620, 520, 780]
        : type === 'bomb_defused'
        ? [540, 720, 960]
        : type === 'ct_win'
        ? [440, 554, 659]
        : [440, 392, 330];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1100;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.11, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.09);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterSfx!);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.1);
    });
  }
}

export const audioManager = new AudioManager();
