import * as THREE from 'three';
import { textures } from '../ProceduralTextures';

interface SoftSpriteParticle {
  sprite: THREE.Sprite;
  vel: THREE.Vector3;
  gravity: number;
  drag: number;
  life: number;
  maxLife: number;
  startScale: number;
  endScale: number;
  startOpacity: number;
  rotSpeed: number;
}

interface ShockwaveRing {
  mesh: THREE.Mesh;
  life: number;
  maxLife: number;
  startScale: number;
  endScale: number;
  startOpacity: number;
}

interface TransientLight {
  light: THREE.PointLight;
  life: number;
  maxLife: number;
  peakIntensity: number;
}

interface ShellCasing {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  angVel: THREE.Vector3;
  life: number;
  floorY: number;
  bounced: boolean;
}

interface SmokePuff {
  sprite: THREE.Sprite;
  basePos: THREE.Vector3;
  driftPhase: number;
  targetScale: number;
  baseOpacity: number;
  rotSpeed: number;
}

export interface VolumetricSmokeCloud {
  group: THREE.Group;
  pos: THREE.Vector3;
  puffs: SmokePuff[];
  life: number;
  maxLife: number;
}

const MAX_SPRITES = 260;
const MAX_CASINGS = 42;

export class ParticleEffects {
  private scene: THREE.Scene;

  private smokeTex: THREE.CanvasTexture;
  private fireTex: THREE.CanvasTexture;
  private sparkTex: THREE.CanvasTexture;
  private shockwaveTex: THREE.CanvasTexture;

  private shockwaveGeo = new THREE.PlaneGeometry(1, 1);
  private casingGeo = new THREE.CylinderGeometry(0.006, 0.0065, 0.028, 8);
  private casingMat = new THREE.MeshStandardMaterial({
    color: 0xd9a84e,
    roughness: 0.24,
    metalness: 0.92,
  });

  private sprites: SoftSpriteParticle[] = [];
  private shockwaves: ShockwaveRing[] = [];
  private lights: TransientLight[] = [];
  private casings: ShellCasing[] = [];
  public smokeClouds: VolumetricSmokeCloud[] = [];

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.smokeTex = textures.createSoftParticleTexture('smoke');
    this.fireTex = textures.createSoftParticleTexture('fire');
    this.sparkTex = textures.createSoftParticleTexture('spark');
    this.shockwaveTex = textures.createSoftParticleTexture('shockwave');
  }

  private pushSprite(
    tex: THREE.CanvasTexture,
    pos: THREE.Vector3,
    vel: THREE.Vector3,
    opts: {
      color?: number;
      additive?: boolean;
      gravity?: number;
      drag?: number;
      life: number;
      startScale: number;
      endScale: number;
      opacity?: number;
      rotSpeed?: number;
    }
  ): void {
    if (this.sprites.length >= MAX_SPRITES) {
      const oldest = this.sprites.shift();
      if (oldest) {
        this.scene.remove(oldest.sprite);
        oldest.sprite.material.dispose();
      }
    }

    const mat = new THREE.SpriteMaterial({
      map: tex,
      color: opts.color ?? 0xffffff,
      transparent: true,
      opacity: opts.opacity ?? 0.9,
      depthWrite: false,
      blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      rotation: Math.random() * Math.PI * 2,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.position.copy(pos);
    sprite.scale.setScalar(opts.startScale);
    this.scene.add(sprite);

    this.sprites.push({
      sprite,
      vel,
      gravity: opts.gravity ?? 0,
      drag: opts.drag ?? 1.5,
      life: opts.life,
      maxLife: opts.life,
      startScale: opts.startScale,
      endScale: opts.endScale,
      startOpacity: opts.opacity ?? 0.9,
      rotSpeed: opts.rotSpeed ?? (Math.random() - 0.5) * 1.6,
    });
  }

  public spawnSparks(pos: THREE.Vector3, count: number, colorHex = 0xffc864): void {
    for (let i = 0; i < count; i++) {
      const speed = 2.2 + Math.random() * 5.2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI * 0.65;
      const vel = new THREE.Vector3(
        Math.cos(theta) * Math.sin(phi) * speed,
        Math.cos(phi) * speed * 0.95 + 1.1,
        Math.sin(theta) * Math.sin(phi) * speed
      );
      this.pushSprite(this.sparkTex, pos, vel, {
        color: colorHex,
        additive: true,
        gravity: 13.5,
        drag: 2.2,
        life: 0.24 + Math.random() * 0.24,
        startScale: 0.22 + Math.random() * 0.14,
        endScale: 0.03,
        opacity: 0.95,
      });
    }
  }

  public spawnMuzzleWisp(pos: THREE.Vector3): void {
    const vel = new THREE.Vector3(
      (Math.random() - 0.5) * 0.28,
      0.55 + Math.random() * 0.35,
      (Math.random() - 0.5) * 0.28
    );
    this.pushSprite(this.smokeTex, pos, vel, {
      color: 0xdde2e8,
      additive: false,
      gravity: -0.3,
      drag: 3.2,
      life: 0.38 + Math.random() * 0.18,
      startScale: 0.08,
      endScale: 0.36,
      opacity: 0.32,
      rotSpeed: (Math.random() - 0.5) * 2.5,
    });
  }

  public spawnExplosion(pos: THREE.Vector3, scale = 1.0, includeShockwave = true): void {
    const base = pos.clone();
    base.y = Math.max(0.15, base.y);

    // Core incandescent flash
    this.pushSprite(this.fireTex, base.clone().add(new THREE.Vector3(0, 0.35 * scale, 0)), new THREE.Vector3(0, 0.4, 0), {
      color: 0xfff2cc,
      additive: true,
      gravity: 0,
      drag: 4,
      life: 0.22,
      startScale: 1.4 * scale,
      endScale: 4.8 * scale,
      opacity: 1.0,
    });

    // Expanding multi-lobe fireball
    const fireCount = Math.round(7 * Math.min(1.6, scale));
    for (let i = 0; i < fireCount; i++) {
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 0.9 * scale,
        0.2 + Math.random() * 0.7 * scale,
        (Math.random() - 0.5) * 0.9 * scale
      );
      const vel = new THREE.Vector3(
        offset.x * 2.4,
        1.4 + Math.random() * 2.6 * scale,
        offset.z * 2.4
      );
      this.pushSprite(this.fireTex, base.clone().add(offset), vel, {
        color: i % 2 === 0 ? 0xff9d3b : 0xff6b24,
        additive: true,
        gravity: -1.4,
        drag: 2.8,
        life: 0.38 + Math.random() * 0.24,
        startScale: 1.1 * scale,
        endScale: (3.2 + Math.random() * 1.4) * scale,
        opacity: 0.88,
      });
    }

    // Billowing dark & warm explosion smoke plume
    const smokeCount = Math.round(9 * Math.min(1.6, scale));
    for (let i = 0; i < smokeCount; i++) {
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 1.4 * scale,
        0.3 + Math.random() * 0.9 * scale,
        (Math.random() - 0.5) * 1.4 * scale
      );
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 2.2 * scale,
        1.8 + Math.random() * 2.4 * scale,
        (Math.random() - 0.5) * 2.2 * scale
      );
      this.pushSprite(this.smokeTex, base.clone().add(offset), vel, {
        color: i < 3 ? 0x7a685c : 0x45494f,
        additive: false,
        gravity: -0.6,
        drag: 2.2,
        life: 1.35 + Math.random() * 0.85,
        startScale: 1.35 * scale,
        endScale: (4.4 + Math.random() * 1.8) * scale,
        opacity: 0.74,
      });
    }

    // Glowing embers
    this.spawnSparks(base.clone().add(new THREE.Vector3(0, 0.3, 0)), Math.round(18 * Math.min(1.6, scale)), 0xff9b3d);

    // Expanding horizontal ground shockwave ring
    if (includeShockwave) {
      const swMat = new THREE.MeshBasicMaterial({
        map: this.shockwaveTex,
        color: 0xffd28a,
        transparent: true,
        opacity: 0.88,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      });
      const ring = new THREE.Mesh(this.shockwaveGeo, swMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(base.x, Math.max(0.06, base.y), base.z);
      ring.scale.setScalar(0.6 * scale);
      ring.userData.excludeFromAO = true;
      this.scene.add(ring);
      this.shockwaves.push({
        mesh: ring,
        life: 0.42,
        maxLife: 0.42,
        startScale: 0.6 * scale,
        endScale: 9.2 * scale,
        startOpacity: 0.88,
      });
    }

    // Dynamic point flash
    if (this.lights.length < 4) {
      const light = new THREE.PointLight(0xff9436, 9 * scale, 22 * scale, 1.8);
      light.position.copy(base).add(new THREE.Vector3(0, 0.9, 0));
      this.scene.add(light);
      this.lights.push({
        light,
        life: 0.45,
        maxLife: 0.45,
        peakIntensity: 9 * scale,
      });
    }
  }

  public spawnFlashPop(pos: THREE.Vector3): void {
    this.pushSprite(this.fireTex, pos.clone().add(new THREE.Vector3(0, 0.25, 0)), new THREE.Vector3(0, 0, 0), {
      color: 0xffffff,
      additive: true,
      gravity: 0,
      drag: 4,
      life: 0.16,
      startScale: 0.9,
      endScale: 3.4,
      opacity: 0.95,
    });
    this.spawnSparks(pos, 10, 0xf2f7ff);
    if (this.lights.length < 4) {
      const light = new THREE.PointLight(0xeef6ff, 12, 24, 1.7);
      light.position.set(pos.x, Math.max(0.45, pos.y + 0.35), pos.z);
      this.scene.add(light);
      this.lights.push({
        light,
        life: 0.22,
        maxLife: 0.22,
        peakIntensity: 12,
      });
    }
  }

  public spawnSmokeCloud(pos: THREE.Vector3, life: number): void {
    const group = new THREE.Group();
    group.position.copy(pos);

    const puffs: SmokePuff[] = [];
    const puffCount = 16;
    const tints = [0xc9cfd6, 0xd9dfe6, 0xb6bec7];

    for (let i = 0; i < puffCount; i++) {
      const mat = new THREE.SpriteMaterial({
        map: this.smokeTex,
        color: tints[i % tints.length],
        transparent: true,
        opacity: 0,
        depthWrite: false,
        rotation: Math.random() * Math.PI * 2,
      });
      const sprite = new THREE.Sprite(mat);
      const angle = (i / puffCount) * Math.PI * 2 + Math.random() * 0.4;
      const rad = i < 4 ? 0.55 * Math.random() : 1.0 + Math.random() * 1.45;
      const basePos = new THREE.Vector3(
        Math.cos(angle) * rad,
        0.75 + Math.random() * 1.85,
        Math.sin(angle) * rad
      );
      sprite.position.copy(basePos);
      const targetScale = 2.5 + Math.random() * 1.65;
      sprite.scale.setScalar(0.35);
      group.add(sprite);

      puffs.push({
        sprite,
        basePos,
        driftPhase: Math.random() * Math.PI * 2,
        targetScale,
        baseOpacity: 0.56 + Math.random() * 0.2,
        rotSpeed: (Math.random() - 0.5) * 0.35,
      });
    }

    this.scene.add(group);
    this.smokeClouds.push({
      group,
      pos: pos.clone(),
      puffs,
      life,
      maxLife: life,
    });
  }

  public spawnShellCasing(
    origin: THREE.Vector3,
    rightDir: THREE.Vector3,
    upDir: THREE.Vector3,
    forwardDir: THREE.Vector3,
    floorY: number
  ): void {
    if (this.casings.length >= MAX_CASINGS) {
      const oldest = this.casings.shift();
      if (oldest) this.scene.remove(oldest.mesh);
    }

    const mesh = new THREE.Mesh(this.casingGeo, this.casingMat);
    mesh.position.copy(origin);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.PI / 2);
    this.scene.add(mesh);

    const vel = new THREE.Vector3()
      .addScaledVector(rightDir, 1.55 + Math.random() * 0.65)
      .addScaledVector(upDir, 1.35 + Math.random() * 0.55)
      .addScaledVector(forwardDir, (Math.random() - 0.35) * 0.65);

    this.casings.push({
      mesh,
      vel,
      angVel: new THREE.Vector3(
        (Math.random() - 0.5) * 26,
        (Math.random() - 0.5) * 24,
        (Math.random() - 0.5) * 28
      ),
      life: 2.3,
      floorY: floorY + 0.014,
      bounced: false,
    });
  }

  public update(dt: number, elapsed: number): void {
    // 1. Soft billboard sprites
    for (let i = this.sprites.length - 1; i >= 0; i--) {
      const p = this.sprites[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.scene.remove(p.sprite);
        p.sprite.material.dispose();
        this.sprites.splice(i, 1);
        continue;
      }
      const t = 1 - p.life / p.maxLife;
      p.vel.y -= p.gravity * dt;
      p.vel.multiplyScalar(Math.max(0, 1 - p.drag * dt));
      p.sprite.position.addScaledVector(p.vel, dt);
      p.sprite.scale.setScalar(THREE.MathUtils.lerp(p.startScale, p.endScale, t));
      p.sprite.material.rotation += p.rotSpeed * dt;
      p.sprite.material.opacity = p.startOpacity * Math.pow(1 - t, 1.25);
    }

    // 2. Shockwave rings
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.life -= dt;
      if (s.life <= 0) {
        this.scene.remove(s.mesh);
        (s.mesh.material as THREE.Material).dispose();
        this.shockwaves.splice(i, 1);
        continue;
      }
      const t = 1 - s.life / s.maxLife;
      const easeOut = 1 - Math.pow(1 - t, 2.2);
      s.mesh.scale.setScalar(THREE.MathUtils.lerp(s.startScale, s.endScale, easeOut));
      (s.mesh.material as THREE.MeshBasicMaterial).opacity = s.startOpacity * (1 - t);
    }

    // 3. Transient explosion lights
    for (let i = this.lights.length - 1; i >= 0; i--) {
      const l = this.lights[i];
      l.life -= dt;
      if (l.life <= 0) {
        this.scene.remove(l.light);
        this.lights.splice(i, 1);
        continue;
      }
      const frac = l.life / l.maxLife;
      l.light.intensity = l.peakIntensity * frac * frac;
    }

    // 4. Ejected brass shell casings
    for (let i = this.casings.length - 1; i >= 0; i--) {
      const c = this.casings[i];
      c.life -= dt;
      if (c.life <= 0) {
        this.scene.remove(c.mesh);
        this.casings.splice(i, 1);
        continue;
      }
      if (c.mesh.position.y > c.floorY || c.vel.y > 0) {
        c.vel.y -= 13.5 * dt;
        c.mesh.position.addScaledVector(c.vel, dt);
        c.mesh.rotation.x += c.angVel.x * dt;
        c.mesh.rotation.y += c.angVel.y * dt;
        c.mesh.rotation.z += c.angVel.z * dt;
        if (c.mesh.position.y <= c.floorY) {
          c.mesh.position.y = c.floorY;
          if (!c.bounced && Math.abs(c.vel.y) > 0.7) {
            c.bounced = true;
            c.vel.y = Math.abs(c.vel.y) * 0.34;
            c.vel.x *= 0.45;
            c.vel.z *= 0.45;
            c.angVel.multiplyScalar(0.45);
          } else {
            c.vel.set(0, 0, 0);
            c.angVel.set(0, 0, 0);
            c.mesh.rotation.x = 0;
            c.mesh.rotation.z = Math.PI / 2;
          }
        }
      }
    }

    // 5. Volumetric smoke clouds (smooth bloom-in, gentle drift, smooth fade-out)
    for (let i = this.smokeClouds.length - 1; i >= 0; i--) {
      const sc = this.smokeClouds[i];
      sc.life -= dt;
      if (sc.life <= 0) {
        this.scene.remove(sc.group);
        for (const puff of sc.puffs) {
          puff.sprite.material.dispose();
        }
        this.smokeClouds.splice(i, 1);
        continue;
      }
      const age = sc.maxLife - sc.life;
      const growT = Math.min(1, age / 1.15);
      const growEase = 1 - Math.pow(1 - growT, 2.5);
      const fadeOut = sc.maxLife > 1000 ? 1 : Math.min(1, sc.life / 2.2);

      sc.group.rotation.y += dt * 0.08;
      for (const puff of sc.puffs) {
        puff.sprite.material.rotation += puff.rotSpeed * dt;
        const drift = Math.sin(elapsed * 0.8 + puff.driftPhase) * 0.18;
        puff.sprite.position.set(
          puff.basePos.x * (0.35 + 0.65 * growEase) + drift,
          puff.basePos.y * (0.45 + 0.55 * growEase) + Math.cos(elapsed * 0.65 + puff.driftPhase) * 0.1,
          puff.basePos.z * (0.35 + 0.65 * growEase) - drift
        );
        puff.sprite.scale.setScalar(THREE.MathUtils.lerp(0.55, puff.targetScale, growEase));
        puff.sprite.material.opacity = puff.baseOpacity * growEase * fadeOut;
      }
    }
  }

  public clear(): void {
    for (const p of this.sprites) {
      this.scene.remove(p.sprite);
      p.sprite.material.dispose();
    }
    this.sprites = [];

    for (const s of this.shockwaves) {
      this.scene.remove(s.mesh);
      (s.mesh.material as THREE.Material).dispose();
    }
    this.shockwaves = [];

    for (const l of this.lights) {
      this.scene.remove(l.light);
    }
    this.lights = [];

    for (const c of this.casings) {
      this.scene.remove(c.mesh);
    }
    this.casings = [];

    for (const sc of this.smokeClouds) {
      this.scene.remove(sc.group);
      for (const puff of sc.puffs) {
        puff.sprite.material.dispose();
      }
    }
    this.smokeClouds = [];
  }

  public dispose(): void {
    this.clear();
    this.shockwaveGeo.dispose();
    this.casingGeo.dispose();
    this.casingMat.dispose();
  }
}
