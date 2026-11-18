import * as THREE from 'three';

export type TextureKind =
  | 'sand'
  | 'sandstone'
  | 'sandstone_frieze'
  | 'dust_stone_floor'
  | 'crate'
  | 'crate_military'
  | 'concrete'
  | 'cinderblock'
  | 'brick'
  | 'brick_yellow'
  | 'metal'
  | 'corrugated_metal'
  | 'hazard'
  | 'moss_stone'
  | 'asphalt'
  | 'gravel_track'
  | 'cracked_earth'
  | 'cliff_rock'
  | 'office_floor'
  | 'snow'
  | 'terracotta'
  | 'cobblestone'
  | 'wood_plank'
  | 'container_blue'
  | 'container_red'
  | 'water'
  | 'roof_tile'
  | 'window_glass'
  | 'wood_mahogany'
  | 'carpet_office'
  | 'bark_palm'
  | 'bark_pine'
  | 'foliage_leaf'
  | 'foliage_pine';

export type CharacterTextureKind =
  | 'ripstop_camo'
  | 'ripstop_solid'
  | 'urban_camo'
  | 'woodland_camo'
  | 'arctic_camo'
  | 'kevlar_molle'
  | 'leather';

export type WeaponSurfaceKind = 'gunmetal' | 'polymer' | 'walnut' | 'chrome' | 'carbon';
export type SoftParticleKind = 'smoke' | 'fire' | 'spark' | 'muzzle' | 'shockwave';

export interface PbrTexturePair {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  normalMap: THREE.CanvasTexture;
  roughnessMap?: THREE.CanvasTexture;
}

class ProceduralTextureLibrary {
  private cache = new Map<string, PbrTexturePair>();
  private charCache = new Map<string, PbrTexturePair>();
  private weaponCache = new Map<string, PbrTexturePair>();
  private skyCache = new Map<string, THREE.CanvasTexture>();
  private decalCache = new Map<string, THREE.CanvasTexture>();
  private particleCache = new Map<string, THREE.CanvasTexture>();
  private skinCache = new Map<number, THREE.CanvasTexture>();
  private maxAnisotropy = 8;

  public setMaxAnisotropy(val: number): void {
    this.maxAnisotropy = Math.max(1, Math.min(16, val));
  }

  private createNormalCanvasFromHeight(heightCanvas: HTMLCanvasElement, strength = 2.4): HTMLCanvasElement {
    const w = heightCanvas.width;
    const h = heightCanvas.height;
    const srcCtx = heightCanvas.getContext('2d')!;
    const srcData = srcCtx.getImageData(0, 0, w, h).data;

    const outCanvas = document.createElement('canvas');
    outCanvas.width = w;
    outCanvas.height = h;
    const outCtx = outCanvas.getContext('2d')!;
    const outImg = outCtx.createImageData(w, h);
    const dst = outImg.data;

    const sample = (x: number, y: number): number => {
      const wx = ((x % w) + w) % w;
      const wy = ((y % h) + h) % h;
      return srcData[(wy * w + wx) * 4] / 255;
    };

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const tl = sample(x - 1, y - 1);
        const t = sample(x, y - 1);
        const tr = sample(x + 1, y - 1);
        const l = sample(x - 1, y);
        const r = sample(x + 1, y);
        const bl = sample(x - 1, y + 1);
        const b = sample(x, y + 1);
        const br = sample(x + 1, y + 1);

        const dX = (tr + 2 * r + br - (tl + 2 * l + bl)) * strength;
        const dY = (bl + 2 * b + br - (tl + 2 * t + tr)) * strength;
        let nx = -dX;
        let ny = -dY;
        let nz = 1.0;
        const invLen = 1 / Math.hypot(nx, ny, nz);
        nx *= invLen;
        ny *= invLen;
        nz *= invLen;

        const idx = (y * w + x) * 4;
        dst[idx] = Math.round((nx * 0.5 + 0.5) * 255);
        dst[idx + 1] = Math.round((ny * 0.5 + 0.5) * 255);
        dst[idx + 2] = Math.round((nz * 0.5 + 0.5) * 255);
        dst[idx + 3] = 255;
      }
    }
    outCtx.putImageData(outImg, 0, 0);
    return outCanvas;
  }

  public getPair(kind: TextureKind, repeatX = 1, repeatY = 1): PbrTexturePair {
    const key = `${kind}:${repeatX}:${repeatY}`;
    const cached = this.cache.get(key);
    if (cached) return cached;

    const size = 512;
    const albedoCanvas = document.createElement('canvas');
    albedoCanvas.width = size;
    albedoCanvas.height = size;
    const aCtx = albedoCanvas.getContext('2d')!;

    const bumpCanvas = document.createElement('canvas');
    bumpCanvas.width = size;
    bumpCanvas.height = size;
    const bCtx = bumpCanvas.getContext('2d')!;

    this.drawPattern(aCtx, bCtx, kind, size);
    const normalCanvas = this.createNormalCanvasFromHeight(bumpCanvas, 2.2);

    const map = new THREE.CanvasTexture(albedoCanvas);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(repeatX, repeatY);
    map.anisotropy = this.maxAnisotropy;
    map.needsUpdate = true;

    const bumpMap = new THREE.CanvasTexture(bumpCanvas);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;
    bumpMap.repeat.set(repeatX, repeatY);
    bumpMap.anisotropy = this.maxAnisotropy;
    bumpMap.needsUpdate = true;

    const normalMap = new THREE.CanvasTexture(normalCanvas);
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;
    normalMap.repeat.set(repeatX, repeatY);
    normalMap.anisotropy = this.maxAnisotropy;
    normalMap.needsUpdate = true;

    const pair = { map, bumpMap, normalMap };
    this.cache.set(key, pair);
    return pair;
  }

  public get(kind: TextureKind, repeatX = 1, repeatY = 1): THREE.CanvasTexture {
    return this.getPair(kind, repeatX, repeatY).map;
  }

  public createSoftParticleTexture(kind: SoftParticleKind): THREE.CanvasTexture {
    const cached = this.particleCache.get(kind);
    if (cached) return cached;

    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const cx = size / 2;
    const cy = size / 2;
    ctx.clearRect(0, 0, size, size);

    if (kind === 'smoke') {
      // Multi-lobe billowy stylized cloud sprite
      const lobes = [
        [64, 64, 52, 0.45],
        [48, 56, 36, 0.34],
        [80, 58, 34, 0.32],
        [62, 44, 34, 0.32],
        [64, 78, 36, 0.28],
      ];
      for (const [lx, ly, lr, alpha] of lobes) {
        const g = ctx.createRadialGradient(lx, ly, 4, lx, ly, lr);
        g.addColorStop(0, `rgba(248, 250, 252, ${alpha})`);
        g.addColorStop(0.55, `rgba(210, 216, 224, ${alpha * 0.65})`);
        g.addColorStop(1, 'rgba(180, 186, 194, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(lx, ly, lr, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (kind === 'fire') {
      const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 60);
      g.addColorStop(0, 'rgba(255, 252, 220, 1.0)');
      g.addColorStop(0.28, 'rgba(255, 190, 64, 0.92)');
      g.addColorStop(0.6, 'rgba(235, 84, 24, 0.56)');
      g.addColorStop(1, 'rgba(80, 18, 8, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    } else if (kind === 'spark') {
      const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 54);
      g.addColorStop(0, 'rgba(255, 255, 240, 1)');
      g.addColorStop(0.32, 'rgba(255, 206, 92, 0.85)');
      g.addColorStop(1, 'rgba(255, 120, 20, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, size, size);
    } else if (kind === 'muzzle') {
      // Crisp 4-point star flare + bright core
      const core = ctx.createRadialGradient(cx, cy, 2, cx, cy, 42);
      core.addColorStop(0, 'rgba(255, 255, 244, 1)');
      core.addColorStop(0.35, 'rgba(255, 212, 112, 0.85)');
      core.addColorStop(1, 'rgba(255, 132, 32, 0)');
      ctx.fillStyle = core;
      ctx.fillRect(0, 0, size, size);

      ctx.save();
      ctx.translate(cx, cy);
      for (let i = 0; i < 4; i++) {
        ctx.rotate(Math.PI / 4);
        const sg = ctx.createRadialGradient(0, 0, 2, 0, 0, 58);
        sg.addColorStop(0, 'rgba(255, 248, 210, 0.92)');
        sg.addColorStop(0.5, 'rgba(255, 178, 60, 0.42)');
        sg.addColorStop(1, 'rgba(255, 120, 20, 0)');
        ctx.fillStyle = sg;
        ctx.beginPath();
        ctx.ellipse(0, 0, 58, 9, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else {
      // Shockwave ring
      const rg = ctx.createRadialGradient(cx, cy, 28, cx, cy, 60);
      rg.addColorStop(0, 'rgba(255, 220, 150, 0)');
      rg.addColorStop(0.65, 'rgba(255, 215, 130, 0.7)');
      rg.addColorStop(0.85, 'rgba(255, 165, 72, 0.45)');
      rg.addColorStop(1, 'rgba(255, 120, 30, 0)');
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    this.particleCache.set(kind, tex);
    return tex;
  }

  public getWeaponSurfacePair(kind: WeaponSurfaceKind): PbrTexturePair {
    const cached = this.weaponCache.get(kind);
    if (cached) return cached;

    const size = 256;
    const albedo = document.createElement('canvas');
    albedo.width = size;
    albedo.height = size;
    const aCtx = albedo.getContext('2d')!;

    const bump = document.createElement('canvas');
    bump.width = size;
    bump.height = size;
    const bCtx = bump.getContext('2d')!;

    const rough = document.createElement('canvas');
    rough.width = size;
    rough.height = size;
    const rCtx = rough.getContext('2d')!;

    let seed = kind.split('').reduce((a, c) => a + c.charCodeAt(0) * 37, 9001);
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    if (kind === 'gunmetal' || kind === 'chrome') {
      aCtx.fillStyle = kind === 'chrome' ? '#e4e8ee' : '#d2d6dc';
      aCtx.fillRect(0, 0, size, size);
      bCtx.fillStyle = '#808080';
      bCtx.fillRect(0, 0, size, size);
      rCtx.fillStyle = kind === 'chrome' ? '#484848' : '#7a7a7a';
      rCtx.fillRect(0, 0, size, size);
      // Brushed anisotropic metal grain + subtle oil-rubbed edge wear
      for (let y = 0; y < size; y += 2) {
        const v = Math.floor((rand() - 0.5) * 18);
        aCtx.fillStyle = `rgba(${210 + v}, ${214 + v}, ${220 + v}, 0.25)`;
        aCtx.fillRect(0, y, size, 1);
        bCtx.fillStyle = `rgb(${128 + v}, ${128 + v}, ${128 + v})`;
        bCtx.fillRect(0, y, size, 1);
      }
      for (let i = 0; i < 45; i++) {
        const rx = rand() * size;
        const ry = rand() * size;
        aCtx.fillStyle = 'rgba(255,255,255,0.06)';
        aCtx.fillRect(rx, ry, 14 + rand() * 34, 2);
      }
    } else if (kind === 'polymer') {
      aCtx.fillStyle = '#dedede';
      aCtx.fillRect(0, 0, size, size);
      bCtx.fillStyle = '#808080';
      bCtx.fillRect(0, 0, size, size);
      rCtx.fillStyle = '#a8a8a8';
      rCtx.fillRect(0, 0, size, size);
      // Micro-stippled matte grip texture
      for (let y = 0; y < size; y += 4) {
        for (let x = 0; x < size; x += 4) {
          const d = rand() > 0.5;
          bCtx.fillStyle = d ? '#a4a4a4' : '#5c5c5c';
          bCtx.fillRect(x, y, 2, 2);
          rCtx.fillStyle = d ? '#989898' : '#c0c0c0';
          rCtx.fillRect(x, y, 2, 2);
        }
      }
    } else if (kind === 'walnut') {
      aCtx.fillStyle = '#c89b6e';
      aCtx.fillRect(0, 0, size, size);
      bCtx.fillStyle = '#808080';
      bCtx.fillRect(0, 0, size, size);
      rCtx.fillStyle = '#8e8e8e';
      rCtx.fillRect(0, 0, size, size);
      // Stylized rich curved walnut grain streaks
      for (let i = 0; i < 46; i++) {
        const y0 = (i / 46) * size;
        aCtx.strokeStyle = i % 3 === 0 ? 'rgba(72, 38, 16, 0.34)' : 'rgba(135, 78, 36, 0.24)';
        aCtx.lineWidth = 1.5 + rand() * 2.5;
        aCtx.beginPath();
        aCtx.moveTo(0, y0);
        aCtx.bezierCurveTo(size * 0.33, y0 + (rand() - 0.5) * 18, size * 0.66, y0 + (rand() - 0.5) * 18, size, y0);
        aCtx.stroke();

        bCtx.strokeStyle = i % 2 === 0 ? '#707070' : '#949494';
        bCtx.lineWidth = 1.5;
        bCtx.beginPath();
        bCtx.moveTo(0, y0);
        bCtx.lineTo(size, y0);
        bCtx.stroke();
      }
    } else {
      // Carbon weave (knuckles, scopes, modern handguards)
      aCtx.fillStyle = '#cfcfcf';
      aCtx.fillRect(0, 0, size, size);
      bCtx.fillStyle = '#808080';
      bCtx.fillRect(0, 0, size, size);
      rCtx.fillStyle = '#707070';
      rCtx.fillRect(0, 0, size, size);
      for (let y = 0; y < size; y += 8) {
        for (let x = 0; x < size; x += 8) {
          const alt = ((x + y) / 8) % 2 === 0;
          aCtx.fillStyle = alt ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.22)';
          aCtx.fillRect(x, y, 7, 7);
          bCtx.fillStyle = alt ? '#a2a2a2' : '#626262';
          bCtx.fillRect(x, y, 7, 7);
          rCtx.fillStyle = alt ? '#5e5e5e' : '#8c8c8c';
          rCtx.fillRect(x, y, 7, 7);
        }
      }
    }

    const normalCanvas = this.createNormalCanvasFromHeight(bump, 2.0);
    const map = new THREE.CanvasTexture(albedo);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.anisotropy = this.maxAnisotropy;

    const bumpMap = new THREE.CanvasTexture(bump);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;

    const normalMap = new THREE.CanvasTexture(normalCanvas);
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;

    const roughnessMap = new THREE.CanvasTexture(rough);
    roughnessMap.wrapS = THREE.RepeatWrapping;
    roughnessMap.wrapT = THREE.RepeatWrapping;

    const pair = { map, bumpMap, normalMap, roughnessMap };
    this.weaponCache.set(kind, pair);
    return pair;
  }

  public createSkinTexture(baseHex: number): THREE.CanvasTexture {
    const cached = this.skinCache.get(baseHex);
    if (cached) return cached;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const base = new THREE.Color(baseHex);
    const r = Math.round(base.r * 255);
    const g = Math.round(base.g * 255);
    const b = Math.round(base.b * 255);

    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, size, size);

    // Subtle stylized subsurface warmth around cheeks/nose & darker eye-socket ambient shading
    const blush = ctx.createRadialGradient(size * 0.5, size * 0.54, 10, size * 0.5, size * 0.54, 96);
    blush.addColorStop(0, `rgba(${Math.min(255, r + 24)}, ${Math.max(0, g - 8)}, ${Math.max(0, b - 14)}, 0.28)`);
    blush.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = blush;
    ctx.fillRect(0, 0, size, size);

    // Subtle beard/stubble jawline warmth at lower third
    const jaw = ctx.createLinearGradient(0, size * 0.58, 0, size);
    jaw.addColorStop(0, 'rgba(30, 20, 16, 0)');
    jaw.addColorStop(1, 'rgba(42, 28, 22, 0.22)');
    ctx.fillStyle = jaw;
    ctx.fillRect(0, size * 0.58, size, size * 0.42);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.maxAnisotropy;
    this.skinCache.set(baseHex, tex);
    return tex;
  }

  public createSkyDomeTexture(zenithHex: number, horizonHex: number, cloudHex: number): THREE.CanvasTexture {
    const key = `${zenithHex}:${horizonHex}:${cloudHex}`;
    const cached = this.skyCache.get(key);
    if (cached) return cached;

    const w = 1024;
    const h = 512;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    const cZenith = new THREE.Color(zenithHex);
    const cHorizon = new THREE.Color(horizonHex);
    const cCloud = new THREE.Color(cloudHex);

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0.0, `#${cZenith.getHexString()}`);
    grad.addColorStop(0.48, `#${cZenith.clone().lerp(cHorizon, 0.65).getHexString()}`);
    grad.addColorStop(0.62, `#${cHorizon.getHexString()}`);
    grad.addColorStop(1.0, `#${cHorizon.clone().multiplyScalar(0.65).getHexString()}`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Soft atmospheric clouds across upper hemisphere
    for (let i = 0; i < 65; i++) {
      const cx = (i * 97) % w;
      const cy = 65 + ((i * 53) % 165);
      const rx = 45 + (i % 5) * 28;
      const ry = 10 + (i % 4) * 6;
      const rad = ctx.createRadialGradient(cx, cy, 2, cx, cy, rx);
      rad.addColorStop(0, `rgba(${Math.round(cCloud.r * 255)}, ${Math.round(cCloud.g * 255)}, ${Math.round(cCloud.b * 255)}, 0.24)`);
      rad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = rad;
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    this.skyCache.set(key, tex);
    return tex;
  }

  public createSiteDecal(letter: 'A' | 'B'): THREE.CanvasTexture {
    const key = `site:${letter}`;
    const cached = this.decalCache.get(key);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, 256, 256);
    ctx.strokeStyle = 'rgba(205, 52, 36, 0.88)';
    ctx.lineWidth = 14;
    ctx.strokeRect(20, 20, 216, 216);

    ctx.fillStyle = 'rgba(205, 52, 36, 0.88)';
    ctx.font = 'bold 148px Impact, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, 128, 134);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.maxAnisotropy;
    this.decalCache.set(key, tex);
    return tex;
  }

  public createGooseGraffitiTexture(): THREE.CanvasTexture {
    const key = 'decal:goose_graffiti';
    const cached = this.decalCache.get(key);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 512, 256);

    ctx.save();
    ctx.translate(256, 128);
    ctx.rotate(-0.04);

    // Spray mist backing
    const spray = ctx.createRadialGradient(0, 0, 12, 0, 0, 220);
    spray.addColorStop(0, 'rgba(30, 18, 12, 0.32)');
    spray.addColorStop(1, 'rgba(30, 18, 12, 0)');
    ctx.fillStyle = spray;
    ctx.fillRect(-240, -110, 480, 220);

    // CS 1.6 style "Goose" crimson-orange spray script + "A" arrow
    ctx.font = 'italic bold 82px Impact, Georgia, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(20, 12, 8, 0.78)';
    ctx.strokeText('Goose', -18, -14);
    ctx.fillStyle = '#c83e2b';
    ctx.fillText('Goose', -18, -14);

    ctx.font = 'bold 26px monospace';
    ctx.fillStyle = 'rgba(235, 198, 140, 0.85)';
    ctx.fillText('L33T KREW · SITE A', 0, 46);

    // Directional arrow
    ctx.strokeStyle = '#c83e2b';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(95, -18);
    ctx.lineTo(165, -18);
    ctx.lineTo(146, -34);
    ctx.moveTo(165, -18);
    ctx.lineTo(146, -2);
    ctx.stroke();

    ctx.restore();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.maxAnisotropy;
    this.decalCache.set(key, tex);
    return tex;
  }

  public createTrainSignTexture(text: string, bgHex = '#1f4978', fgHex = '#f2f5f8'): THREE.CanvasTexture {
    const key = `sign:${text}:${bgHex}:${fgHex}`;
    const cached = this.decalCache.get(key);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 192;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = bgHex;
    ctx.fillRect(0, 0, 512, 192);

    ctx.strokeStyle = fgHex;
    ctx.lineWidth = 10;
    ctx.strokeRect(12, 12, 488, 168);

    ctx.fillStyle = fgHex;
    const fontSize = text.length <= 2 ? 116 : text.length <= 8 ? 64 : 46;
    ctx.font = `bold ${fontSize}px Impact, Arial Black, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 256, 100);

    // Corner mounting bolts + slight industrial grime
    ctx.fillStyle = 'rgba(20,24,28,0.65)';
    [
      [26, 26],
      [486, 26],
      [26, 166],
      [486, 166],
    ].forEach(([bx, by]) => {
      ctx.beginPath();
      ctx.arc(bx, by, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.maxAnisotropy;
    this.decalCache.set(key, tex);
    return tex;
  }

  public createBlastDoorTexture(): THREE.CanvasTexture {
    const key = 'decal:blast_door';
    const cached = this.decalCache.get(key);
    if (cached) return cached;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Heavy gunmetal bunker steel base
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, '#5a5248');
    grad.addColorStop(0.5, '#4c463e');
    grad.addColorStop(1, '#36322d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Concentric arched bunker ribs
    for (let i = 0; i < 4; i++) {
      const inset = 24 + i * 28;
      ctx.strokeStyle = i % 2 === 0 ? '#2b2622' : '#73685c';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.arc(size / 2, size * 0.72, size * 0.45 - inset, Math.PI, 0);
      ctx.stroke();
    }

    // Center vertical seam + locking pistons
    ctx.fillStyle = '#221f1c';
    ctx.fillRect(size / 2 - 4, 48, 8, size - 48);
    for (let y = 120; y < size - 60; y += 92) {
      ctx.fillStyle = '#6d6459';
      ctx.fillRect(size / 2 - 36, y, 72, 22);
      ctx.strokeStyle = '#1d1b18';
      ctx.lineWidth = 3;
      ctx.strokeRect(size / 2 - 36, y, 72, 22);
    }

    // Bottom hazard kickplate
    ctx.fillStyle = '#c9942c';
    ctx.fillRect(0, size - 44, size, 44);
    ctx.fillStyle = '#1b1d21';
    for (let x = -64; x < size + 64; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, size - 44);
      ctx.lineTo(x + 24, size - 44);
      ctx.lineTo(x, size);
      ctx.lineTo(x - 24, size);
      ctx.closePath();
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.maxAnisotropy;
    this.decalCache.set(key, tex);
    return tex;
  }

  public createCityWindowFacadeTexture(tintHex = '#52463d'): THREE.CanvasTexture {
    const key = `facade:${tintHex}`;
    const cached = this.decalCache.get(key);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = tintHex;
    ctx.fillRect(0, 0, 512, 512);

    // Subtle horizontal floor cornices
    for (let y = 0; y < 512; y += 128) {
      ctx.fillStyle = 'rgba(0,0,0,0.28)';
      ctx.fillRect(0, y, 512, 12);
    }

    // Grid of lit & dark urban windows
    let seed = 7731;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 6; col++) {
        const wx = 26 + col * 82;
        const wy = 28 + row * 128;
        ctx.fillStyle = '#25211e';
        ctx.fillRect(wx - 4, wy - 4, 52, 76);
        const lit = rand() > 0.62;
        ctx.fillStyle = lit ? '#e0bc79' : '#1b2430';
        ctx.fillRect(wx, wy, 44, 68);
        // Window mullion
        ctx.fillStyle = '#2c2926';
        ctx.fillRect(wx + 20, wy, 4, 68);
        ctx.fillRect(wx, wy + 32, 44, 4);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.maxAnisotropy;
    this.decalCache.set(key, tex);
    return tex;
  }

  public createRoadStripeTexture(): THREE.CanvasTexture {
    const key = 'decal:road_stripe';
    const cached = this.decalCache.get(key);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 512, 128);
    ctx.fillStyle = 'rgba(222, 178, 62, 0.85)';
    for (let x = 24; x < 512; x += 128) {
      ctx.fillRect(x, 52, 76, 24);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.repeat.set(5, 1);
    tex.anisotropy = this.maxAnisotropy;
    this.decalCache.set(key, tex);
    return tex;
  }

  public createBulletHoleTexture(): THREE.CanvasTexture {
    const key = 'bullet_hole';
    const cached = this.decalCache.get(key);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 64, 64);

    // Outer scorch/dust halo
    const halo = ctx.createRadialGradient(32, 32, 4, 32, 32, 28);
    halo.addColorStop(0, 'rgba(18, 18, 18, 0.92)');
    halo.addColorStop(0.38, 'rgba(38, 34, 30, 0.62)');
    halo.addColorStop(0.75, 'rgba(65, 58, 50, 0.22)');
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(32, 32, 28, 0, Math.PI * 2);
    ctx.fill();

    // Jagged impact cracks
    ctx.strokeStyle = 'rgba(20, 18, 16, 0.85)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 + 0.3;
      ctx.beginPath();
      ctx.moveTo(32 + Math.cos(ang) * 4, 32 + Math.sin(ang) * 4);
      ctx.lineTo(32 + Math.cos(ang) * (16 + (i % 3) * 4), 32 + Math.sin(ang) * (16 + (i % 3) * 4));
      ctx.stroke();
    }

    // Dark center core
    ctx.fillStyle = '#0d0d0e';
    ctx.beginPath();
    ctx.arc(32, 32, 6, 0, Math.PI * 2);
    ctx.fill();

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.maxAnisotropy;
    this.decalCache.set(key, tex);
    return tex;
  }

  public createContactShadowTexture(): THREE.CanvasTexture {
    const key = 'contact_shadow';
    const cached = this.decalCache.get(key);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(64, 64, 6, 64, 64, 62);
    grad.addColorStop(0, 'rgba(6, 8, 12, 0.72)');
    grad.addColorStop(0.55, 'rgba(6, 8, 12, 0.34)');
    grad.addColorStop(1, 'rgba(6, 8, 12, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.decalCache.set(key, tex);
    return tex;
  }

  public createBloodSplatterTexture(variant = 0): THREE.CanvasTexture {
    const key = `blood_splatter:${variant % 3}`;
    const cached = this.decalCache.get(key);
    if (cached) return cached;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, size, size);

    let seed = 9187 + (variant % 3) * 1337;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    const cx = size * 0.5;
    const cy = size * 0.5;

    // Soft crimson mist halo
    const mist = ctx.createRadialGradient(cx, cy, 8, cx, cy, 96);
    mist.addColorStop(0, 'rgba(110, 8, 12, 0.85)');
    mist.addColorStop(0.5, 'rgba(135, 12, 16, 0.42)');
    mist.addColorStop(1, 'rgba(90, 6, 8, 0)');
    ctx.fillStyle = mist;
    ctx.beginPath();
    ctx.arc(cx, cy, 96, 0, Math.PI * 2);
    ctx.fill();

    // Irregular central splat lobes
    for (let i = 0; i < 16; i++) {
      const ang = rand() * Math.PI * 2;
      const dist = rand() * 38;
      const r = 12 + rand() * 24;
      ctx.fillStyle = rand() > 0.45 ? 'rgba(118, 9, 13, 0.92)' : 'rgba(68, 4, 6, 0.94)';
      ctx.beginPath();
      ctx.ellipse(cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist, r, r * (0.65 + rand() * 0.5), ang, 0, Math.PI * 2);
      ctx.fill();
    }

    // Arterial directional streaks & gravity drips
    for (let i = 0; i < 24; i++) {
      const ang = rand() * Math.PI * 2;
      const startR = 14 + rand() * 26;
      const len = 26 + rand() * 68;
      ctx.strokeStyle = rand() > 0.35 ? 'rgba(138, 10, 15, 0.86)' : 'rgba(82, 5, 8, 0.9)';
      ctx.lineWidth = 2 + rand() * 5.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * startR, cy + Math.sin(ang) * startR);
      ctx.lineTo(cx + Math.cos(ang) * (startR + len), cy + Math.sin(ang) * (startR + len) + rand() * 14);
      ctx.stroke();

      // Satellite droplets at tips
      const dropDist = startR + len + 6 + rand() * 24;
      ctx.fillStyle = 'rgba(128, 10, 14, 0.88)';
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ang) * dropDist, cy + Math.sin(ang) * dropDist, 1.8 + rand() * 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.maxAnisotropy;
    this.decalCache.set(key, tex);
    return tex;
  }

  public createBloodPoolTexture(): THREE.CanvasTexture {
    const key = 'blood_pool';
    const cached = this.decalCache.get(key);
    if (cached) return cached;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, size, size);

    let seed = 4421;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    const cx = 128;
    const cy = 128;

    // Organic overlapping dark crimson pool lobes
    for (let i = 0; i < 14; i++) {
      const ang = (i / 14) * Math.PI * 2 + rand() * 0.4;
      const dist = 10 + rand() * 34;
      const rx = 34 + rand() * 38;
      const ry = 26 + rand() * 32;
      const lx = cx + Math.cos(ang) * dist;
      const ly = cy + Math.sin(ang) * dist;
      const g = ctx.createRadialGradient(lx, ly, 4, lx, ly, rx);
      g.addColorStop(0, 'rgba(62, 3, 5, 0.96)');
      g.addColorStop(0.65, 'rgba(104, 8, 12, 0.9)');
      g.addColorStop(0.92, 'rgba(128, 12, 16, 0.65)');
      g.addColorStop(1, 'rgba(110, 8, 12, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(lx, ly, rx, ry, ang, 0, Math.PI * 2);
      ctx.fill();
    }

    // Glossy coagulated dark core
    const core = ctx.createRadialGradient(cx, cy, 4, cx, cy, 56);
    core.addColorStop(0, 'rgba(42, 2, 4, 0.95)');
    core.addColorStop(0.7, 'rgba(84, 5, 9, 0.72)');
    core.addColorStop(1, 'rgba(84, 5, 9, 0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(cx, cy, 56, 0, Math.PI * 2);
    ctx.fill();

    // Peripheral drops
    for (let i = 0; i < 18; i++) {
      const ang = rand() * Math.PI * 2;
      const dist = 68 + rand() * 44;
      ctx.fillStyle = 'rgba(112, 8, 12, 0.86)';
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ang) * dist, cy + Math.sin(ang) * dist, 2 + rand() * 5, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.maxAnisotropy;
    this.decalCache.set(key, tex);
    return tex;
  }

  public createFactionPatchTexture(team: 'T' | 'CT'): THREE.CanvasTexture {
    const key = `patch:${team}`;
    const cached = this.decalCache.get(key);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = team === 'CT' ? '#17273b' : '#2a1d14';
    ctx.fillRect(0, 0, 128, 128);

    // Embroidered stitched border
    ctx.strokeStyle = team === 'CT' ? '#79b2f2' : '#e89d41';
    ctx.lineWidth = 7;
    ctx.strokeRect(8, 8, 112, 112);

    ctx.fillStyle = team === 'CT' ? '#cfe4ff' : '#f7ba63';
    if (team === 'CT') {
      // Tactical shield + chevron bars
      ctx.beginPath();
      ctx.moveTo(64, 22);
      ctx.lineTo(100, 36);
      ctx.lineTo(94, 80);
      ctx.lineTo(64, 106);
      ctx.lineTo(34, 80);
      ctx.lineTo(28, 36);
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(44, 58);
      ctx.lineTo(64, 42);
      ctx.lineTo(84, 58);
      ctx.lineTo(84, 69);
      ctx.lineTo(64, 53);
      ctx.lineTo(44, 69);
      ctx.closePath();
      ctx.fill();
    } else {
      // Insurgent star/crosshair emblem
      ctx.beginPath();
      ctx.arc(64, 64, 34, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a1 = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        const a2 = a1 + Math.PI / 5;
        const ox = 64 + Math.cos(a1) * 26;
        const oy = 64 + Math.sin(a1) * 26;
        const ix = 64 + Math.cos(a2) * 11;
        const iy = 64 + Math.sin(a2) * 11;
        if (i === 0) ctx.moveTo(ox, oy);
        else ctx.lineTo(ox, oy);
        ctx.lineTo(ix, iy);
      }
      ctx.closePath();
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.maxAnisotropy;
    this.decalCache.set(key, tex);
    return tex;
  }

  public createPolicePatchTexture(): THREE.CanvasTexture {
    const key = 'patch:police';
    const cached = this.decalCache.get(key);
    if (cached) return cached;

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 96;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#15181d';
    ctx.fillRect(0, 0, 256, 96);
    ctx.strokeStyle = '#3c4450';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 248, 88);

    ctx.fillStyle = '#e5e9ef';
    ctx.font = 'bold 52px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('POLICE', 128, 50);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = this.maxAnisotropy;
    this.decalCache.set(key, tex);
    return tex;
  }

  public getCharacterTexturePair(kind: CharacterTextureKind): PbrTexturePair {
    const cached = this.charCache.get(kind);
    if (cached) return cached;

    const size = 256;
    const albedo = document.createElement('canvas');
    albedo.width = size;
    albedo.height = size;
    const aCtx = albedo.getContext('2d')!;

    const bump = document.createElement('canvas');
    bump.width = size;
    bump.height = size;
    const bCtx = bump.getContext('2d')!;

    const rough = document.createElement('canvas');
    rough.width = size;
    rough.height = size;
    const rCtx = rough.getContext('2d')!;

    let seed = kind.split('').reduce((a, c) => a + c.charCodeAt(0) * 31, 4242);
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    if (
      kind === 'ripstop_camo' ||
      kind === 'ripstop_solid' ||
      kind === 'urban_camo' ||
      kind === 'woodland_camo' ||
      kind === 'arctic_camo'
    ) {
      // Bright neutral base so per-class material tint multiplies cleanly
      if (kind === 'urban_camo') {
        aCtx.fillStyle = '#c9cdd2';
      } else if (kind === 'woodland_camo') {
        aCtx.fillStyle = '#8b8358';
      } else if (kind === 'arctic_camo') {
        aCtx.fillStyle = '#e6e9ec';
      } else {
        aCtx.fillStyle = '#e5e5e5';
      }
      aCtx.fillRect(0, 0, size, size);
      bCtx.fillStyle = '#808080';
      bCtx.fillRect(0, 0, size, size);
      rCtx.fillStyle = '#d4d4d4';
      rCtx.fillRect(0, 0, size, size);

      if (kind === 'ripstop_camo') {
        for (let i = 0; i < 42; i++) {
          const v = rand() > 0.5 ? 168 : rand() > 0.35 ? 205 : 246;
          aCtx.fillStyle = `rgba(${v}, ${v}, ${v}, 0.52)`;
          aCtx.beginPath();
          aCtx.ellipse(
            rand() * size,
            rand() * size,
            16 + rand() * 34,
            10 + rand() * 20,
            rand() * Math.PI,
            0,
            Math.PI * 2
          );
          aCtx.fill();
        }
      } else if (kind === 'urban_camo') {
        // Phoenix Connexion urban winter/tiger grey-black-white camo
        const urbanPalette = ['#4b5058', '#23272d', '#eff2f5', '#8f949c'];
        for (let i = 0; i < 58; i++) {
          aCtx.fillStyle = urbanPalette[i % urbanPalette.length];
          aCtx.beginPath();
          const cx = rand() * size;
          const cy = rand() * size;
          const rx = 18 + rand() * 34;
          const ry = 8 + rand() * 14;
          aCtx.ellipse(cx, cy, rx, ry, (rand() - 0.5) * 0.7, 0, Math.PI * 2);
          aCtx.fill();
        }
      } else if (kind === 'woodland_camo') {
        // Classic woodland olive / brown / tan / charcoal camo
        const woodPalette = ['#464f2f', '#6b5336', '#bfb084', '#26291e'];
        for (let i = 0; i < 62; i++) {
          aCtx.fillStyle = woodPalette[i % woodPalette.length];
          aCtx.beginPath();
          aCtx.ellipse(
            rand() * size,
            rand() * size,
            15 + rand() * 30,
            11 + rand() * 22,
            rand() * Math.PI,
            0,
            Math.PI * 2
          );
          aCtx.fill();
        }
      } else if (kind === 'arctic_camo') {
        // Arctic Avengers snow-white / cool slate / jet black camo
        const arcticPalette = ['#2c3036', '#7b828a', '#f7f9fb', '#aeb4bc'];
        for (let i = 0; i < 60; i++) {
          aCtx.fillStyle = arcticPalette[i % arcticPalette.length];
          aCtx.beginPath();
          aCtx.ellipse(
            rand() * size,
            rand() * size,
            14 + rand() * 32,
            9 + rand() * 18,
            rand() * Math.PI,
            0,
            Math.PI * 2
          );
          aCtx.fill();
        }
      }

      // Micro ripstop grid weave + stitched pocket seam lines
      aCtx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
      bCtx.strokeStyle = '#9c9c9c';
      aCtx.lineWidth = 1;
      bCtx.lineWidth = 1;
      for (let g = 0; g < size; g += 8) {
        aCtx.beginPath();
        aCtx.moveTo(g, 0);
        aCtx.lineTo(g, size);
        aCtx.moveTo(0, g);
        aCtx.lineTo(size, g);
        aCtx.stroke();

        bCtx.beginPath();
        bCtx.moveTo(g, 0);
        bCtx.lineTo(g, size);
        bCtx.moveTo(0, g);
        bCtx.lineTo(size, g);
        bCtx.stroke();
      }

      // Tactical double-stitch seam accent
      aCtx.setLineDash([4, 3]);
      aCtx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      aCtx.strokeRect(10, 10, size - 20, size - 20);
      aCtx.setLineDash([]);
    } else if (kind === 'kevlar_molle') {
      aCtx.fillStyle = '#dcdcdc';
      aCtx.fillRect(0, 0, size, size);
      bCtx.fillStyle = '#787878';
      bCtx.fillRect(0, 0, size, size);
      rCtx.fillStyle = '#9e9e9e';
      rCtx.fillRect(0, 0, size, size);

      // Horizontal PALS/MOLLE webbing channels + vertical bar-tack stitches
      for (let y = 16; y < size; y += 36) {
        aCtx.fillStyle = 'rgba(0, 0, 0, 0.18)';
        aCtx.fillRect(0, y, size, 16);
        bCtx.fillStyle = '#b8b8b8';
        bCtx.fillRect(0, y, size, 15);
        rCtx.fillStyle = '#b8b8b8';
        rCtx.fillRect(0, y, size, 15);

        for (let x = 16; x < size; x += 32) {
          aCtx.fillStyle = 'rgba(255, 255, 255, 0.16)';
          aCtx.fillRect(x, y, 3, 16);
        }
      }
      // Ballistic nylon cross-hatch
      bCtx.strokeStyle = '#909090';
      bCtx.lineWidth = 1;
      for (let i = 0; i < size; i += 6) {
        bCtx.beginPath();
        bCtx.moveTo(i, 0);
        bCtx.lineTo(i, size);
        bCtx.stroke();
      }
    } else {
      // Grained tactical leather (boots, gloves, holsters, belts)
      aCtx.fillStyle = '#d6d6d6';
      aCtx.fillRect(0, 0, size, size);
      bCtx.fillStyle = '#808080';
      bCtx.fillRect(0, 0, size, size);
      rCtx.fillStyle = '#888888';
      rCtx.fillRect(0, 0, size, size);

      for (let i = 0; i < 420; i++) {
        const x = rand() * size;
        const y = rand() * size;
        const r = 1.5 + rand() * 3.5;
        const shade = rand() > 0.5 ? 195 : 235;
        aCtx.fillStyle = `rgba(${shade}, ${shade}, ${shade}, 0.25)`;
        aCtx.beginPath();
        aCtx.arc(x, y, r, 0, Math.PI * 2);
        aCtx.fill();

        bCtx.fillStyle = rand() > 0.5 ? '#969696' : '#6c6c6c';
        bCtx.beginPath();
        bCtx.arc(x, y, r, 0, Math.PI * 2);
        bCtx.fill();
      }
    }

    const normalCanvas = this.createNormalCanvasFromHeight(bump, 2.0);

    const map = new THREE.CanvasTexture(albedo);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = THREE.RepeatWrapping;
    map.wrapT = THREE.RepeatWrapping;
    map.anisotropy = this.maxAnisotropy;

    const bumpMap = new THREE.CanvasTexture(bump);
    bumpMap.wrapS = THREE.RepeatWrapping;
    bumpMap.wrapT = THREE.RepeatWrapping;

    const normalMap = new THREE.CanvasTexture(normalCanvas);
    normalMap.wrapS = THREE.RepeatWrapping;
    normalMap.wrapT = THREE.RepeatWrapping;

    const roughnessMap = new THREE.CanvasTexture(rough);
    roughnessMap.wrapS = THREE.RepeatWrapping;
    roughnessMap.wrapT = THREE.RepeatWrapping;

    const pair = { map, bumpMap, normalMap, roughnessMap };
    this.charCache.set(kind, pair);
    return pair;
  }

  private drawPattern(
    ctx: CanvasRenderingContext2D,
    bCtx: CanvasRenderingContext2D,
    kind: TextureKind,
    size: number
  ): void {
    const w = size;
    const h = size;

    // Seeded pseudo-random so textures look deterministic & crisp
    let seed = kind.split('').reduce((a, c) => a + c.charCodeAt(0) * 17, 1337);
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    const addGrain = (targetCtx: CanvasRenderingContext2D, amount: number) => {
      const img = targetCtx.getImageData(0, 0, w, h);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const n = (rand() - 0.5) * amount;
        d[i] = Math.min(255, Math.max(0, d[i] + n));
        d[i + 1] = Math.min(255, Math.max(0, d[i + 1] + n));
        d[i + 2] = Math.min(255, Math.max(0, d[i + 2] + n));
      }
      targetCtx.putImageData(img, 0, 0);
    };

    // Default neutral mid-height bump
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, w, h);

    switch (kind) {
      case 'sand': {
        ctx.fillStyle = '#d4b178';
        ctx.fillRect(0, 0, w, h);
        // Sculpted golden desert wind ripples
        for (let y = 0; y < h; y += 16) {
          ctx.fillStyle = y % 32 === 0 ? 'rgba(150, 110, 58, 0.18)' : 'rgba(248, 224, 178, 0.17)';
          ctx.fillRect(0, y, w, 8);
          bCtx.fillStyle = y % 32 === 0 ? '#727272' : '#8e8e8e';
          bCtx.fillRect(0, y, w, 8);
        }
        // Fine desert pebbles & gravel flecks
        for (let i = 0; i < 140; i++) {
          const px = rand() * w;
          const py = rand() * h;
          const pr = 1.4 + rand() * 3.4;
          ctx.fillStyle = rand() > 0.5 ? 'rgba(120, 88, 48, 0.36)' : 'rgba(238, 214, 172, 0.34)';
          ctx.beginPath();
          ctx.arc(px, py, pr, 0, Math.PI * 2);
          ctx.fill();
          bCtx.fillStyle = '#a4a4a4';
          bCtx.fillRect(px, py, pr, pr);
        }
        addGrain(ctx, 20);
        addGrain(bCtx, 18);
        break;
      }

      case 'sandstone': {
        ctx.fillStyle = '#d9be92';
        ctx.fillRect(0, 0, w, h);
        bCtx.fillStyle = '#929292';
        bCtx.fillRect(0, 0, w, h);

        const rows = 8;
        const rowH = h / rows;
        for (let r = 0; r < rows; r++) {
          const y = r * rowH;
          const cols = 4;
          const colW = w / cols;
          const off = (r % 2) * (colW / 2);
          for (let c = -1; c <= cols; c++) {
            const x = c * colW + off;
            const shade = Math.floor((rand() - 0.5) * 20);
            ctx.fillStyle = `rgb(${216 + shade}, ${188 + shade}, ${142 + shade})`;
            ctx.fillRect(x + 2, y + 2, colW - 4, rowH - 4);
            ctx.fillStyle = 'rgba(255, 245, 224, 0.18)';
            ctx.fillRect(x + 2, y + 2, colW - 4, 4);
            ctx.fillStyle = 'rgba(84, 60, 34, 0.24)';
            ctx.fillRect(x + 2, y + rowH - 6, colW - 4, 4);

            bCtx.fillStyle = '#3c3c3c';
            bCtx.fillRect(x, y, colW, 3);
            bCtx.fillRect(x, y, 3, rowH);
          }
        }
        const grime = ctx.createLinearGradient(0, h * 0.72, 0, h);
        grime.addColorStop(0, 'rgba(90, 68, 42, 0)');
        grime.addColorStop(1, 'rgba(80, 58, 34, 0.26)');
        ctx.fillStyle = grime;
        ctx.fillRect(0, h * 0.72, w, h * 0.28);
        addGrain(ctx, 18);
        addGrain(bCtx, 16);
        break;
      }

      case 'sandstone_frieze': {
        // CS 1.6 Dust2 carved sandstone parapet molding band (image_9a191133 & image_58ba8fc2)
        ctx.fillStyle = '#cbb083';
        ctx.fillRect(0, 0, w, h);
        bCtx.fillStyle = '#7a7a7a';
        bCtx.fillRect(0, 0, w, h);

        // Top & bottom beveled cornice ledges
        ctx.fillStyle = '#e5cfa6';
        ctx.fillRect(0, 0, w, 56);
        ctx.fillStyle = '#7d6341';
        ctx.fillRect(0, 56, w, 24);
        ctx.fillRect(0, h - 76, w, 24);
        ctx.fillStyle = '#e0c79b';
        ctx.fillRect(0, h - 52, w, 52);

        bCtx.fillStyle = '#d4d4d4';
        bCtx.fillRect(0, 0, w, 56);
        bCtx.fillRect(0, h - 52, w, 52);
        bCtx.fillStyle = '#363636';
        bCtx.fillRect(0, 56, w, 24);
        bCtx.fillRect(0, h - 76, w, 24);

        // Repeating carved egg-and-dart / arched dentil medallions
        for (let x = 0; x < w; x += 64) {
          ctx.fillStyle = '#6c5335';
          ctx.fillRect(x + 8, 98, 48, h - 196);
          ctx.fillStyle = '#d9bf93';
          ctx.beginPath();
          ctx.roundRect(x + 14, 108, 36, h - 216, 14);
          ctx.fill();
          ctx.strokeStyle = '#5c4429';
          ctx.lineWidth = 6;
          ctx.stroke();

          bCtx.fillStyle = '#343434';
          bCtx.fillRect(x + 8, 98, 48, h - 196);
          bCtx.fillStyle = '#dcdcdc';
          bCtx.beginPath();
          bCtx.roundRect(x + 14, 108, 36, h - 216, 14);
          bCtx.fill();
        }
        addGrain(ctx, 18);
        addGrain(bCtx, 16);
        break;
      }

      case 'dust_stone_floor': {
        // Warm weathered Dust2 courtyard / catwalk flagstone pavers (image_9a191133)
        ctx.fillStyle = '#8b7352';
        ctx.fillRect(0, 0, w, h);
        bCtx.fillStyle = '#383838';
        bCtx.fillRect(0, 0, w, h);

        const rows = 6;
        const rh = h / rows;
        for (let r = 0; r < rows; r++) {
          const cols = 4;
          const cw = w / cols;
          const off = (r % 2) * (cw * 0.45);
          for (let c = -1; c <= cols; c++) {
            const x = c * cw + off;
            const y = r * rh;
            const d = Math.floor((rand() - 0.5) * 28);
            ctx.fillStyle = `rgb(${168 + d}, ${138 + d}, ${96 + d})`;
            ctx.beginPath();
            ctx.roundRect(x + 4, y + 4, cw - 8, rh - 8, 10);
            ctx.fill();
            ctx.fillStyle = 'rgba(245, 224, 180, 0.16)';
            ctx.fillRect(x + 8, y + 6, cw - 16, 6);

            bCtx.fillStyle = '#b8b8b8';
            bCtx.beginPath();
            bCtx.roundRect(x + 4, y + 4, cw - 8, rh - 8, 10);
            bCtx.fill();
          }
        }
        addGrain(ctx, 22);
        addGrain(bCtx, 18);
        break;
      }

      case 'crate': {
        ctx.fillStyle = '#8b653d';
        ctx.fillRect(0, 0, w, h);
        bCtx.fillStyle = '#858585';
        bCtx.fillRect(0, 0, w, h);

        // Horizontal wood planks
        for (let y = 0; y < h; y += 64) {
          const tone = Math.floor((rand() - 0.5) * 16);
          ctx.fillStyle = `rgb(${139 + tone}, ${101 + tone}, ${61 + tone})`;
          ctx.fillRect(0, y + 2, w, 60);
          bCtx.fillStyle = '#555555';
          bCtx.fillRect(0, y, w, 3);
        }
        // Wood grain streaks
        ctx.fillStyle = 'rgba(64, 40, 18, 0.22)';
        for (let i = 0; i < 90; i++) {
          ctx.fillRect(0, rand() * h, w, 1.5 + rand() * 2);
        }
        // Heavy outer frame & diagonal cross brace
        ctx.strokeStyle = '#573b1f';
        ctx.lineWidth = 34;
        ctx.strokeRect(17, 17, w - 34, h - 34);
        bCtx.strokeStyle = '#c8c8c8';
        bCtx.lineWidth = 34;
        bCtx.strokeRect(17, 17, w - 34, h - 34);

        ctx.lineWidth = 22;
        ctx.beginPath();
        ctx.moveTo(28, 28);
        ctx.lineTo(w - 28, h - 28);
        ctx.moveTo(w - 28, 28);
        ctx.lineTo(28, h - 28);
        ctx.stroke();

        bCtx.lineWidth = 22;
        bCtx.beginPath();
        bCtx.moveTo(28, 28);
        bCtx.lineTo(w - 28, h - 28);
        bCtx.moveTo(w - 28, 28);
        bCtx.lineTo(28, h - 28);
        bCtx.stroke();

        // Corner steel brackets + bolts + subtle tactical stencil
        ctx.fillStyle = '#2d3238';
        [
          [0, 0],
          [w - 36, 0],
          [0, h - 36],
          [w - 36, h - 36],
        ].forEach(([cx, cy]) => {
          ctx.fillRect(cx, cy, 36, 36);
          ctx.fillStyle = '#6c7680';
          ctx.beginPath();
          ctx.arc(cx + 18, cy + 18, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#2d3238';
        });
        ctx.fillStyle = 'rgba(32, 26, 18, 0.42)';
        ctx.font = 'bold 26px monospace';
        ctx.fillText('ORD-04', 76, 84);
        addGrain(ctx, 14);
        break;
      }

      case 'concrete': {
        ctx.fillStyle = '#84898f';
        ctx.fillRect(0, 0, w, h);
        bCtx.fillStyle = '#848484';
        bCtx.fillRect(0, 0, w, h);

        // 2x2 architectural concrete slabs
        ctx.strokeStyle = 'rgba(38, 42, 46, 0.45)';
        ctx.lineWidth = 4;
        bCtx.strokeStyle = '#383838';
        bCtx.lineWidth = 5;
        for (let i = 0; i <= w; i += 256) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, h);
          ctx.moveTo(0, i);
          ctx.lineTo(w, i);
          ctx.stroke();

          bCtx.beginPath();
          bCtx.moveTo(i, 0);
          bCtx.lineTo(i, h);
          bCtx.moveTo(0, i);
          bCtx.lineTo(w, i);
          bCtx.stroke();
        }
        // Subtle form-tie holes
        ctx.fillStyle = 'rgba(40, 44, 48, 0.5)';
        [
          [64, 64],
          [192, 64],
          [64, 192],
          [192, 192],
          [320, 64],
          [448, 64],
          [320, 192],
          [448, 192],
          [64, 320],
          [192, 320],
          [64, 448],
          [192, 448],
          [320, 320],
          [448, 320],
          [320, 448],
          [448, 448],
        ].forEach(([hx, hy]) => {
          ctx.beginPath();
          ctx.arc(hx, hy, 4, 0, Math.PI * 2);
          ctx.fill();
        });
        addGrain(ctx, 20);
        addGrain(bCtx, 18);
        break;
      }

      case 'brick': {
        ctx.fillStyle = '#a89a8c'; // Mortar
        ctx.fillRect(0, 0, w, h);
        bCtx.fillStyle = '#383838';
        bCtx.fillRect(0, 0, w, h);

        const rows = 16;
        const rowH = h / rows;
        const cols = 8;
        const colW = w / cols;
        for (let r = 0; r < rows; r++) {
          const off = (r % 2) * (colW / 2);
          for (let c = -1; c <= cols; c++) {
            const x = c * colW + off;
            const y = r * rowH;
            const red = 135 + Math.floor(rand() * 38);
            const green = 74 + Math.floor(rand() * 22);
            const blue = 56 + Math.floor(rand() * 18);
            ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
            ctx.fillRect(x + 2, y + 2, colW - 4, rowH - 4);
            bCtx.fillStyle = '#9a9a9a';
            bCtx.fillRect(x + 2, y + 2, colW - 4, rowH - 4);
          }
        }
        addGrain(ctx, 18);
        addGrain(bCtx, 14);
        break;
      }

      case 'metal': {
        ctx.fillStyle = '#535e69';
        ctx.fillRect(0, 0, w, h);
        bCtx.fillStyle = '#808080';
        bCtx.fillRect(0, 0, w, h);

        ctx.strokeStyle = '#2d343d';
        ctx.lineWidth = 5;
        ctx.strokeRect(4, 4, w - 8, h - 8);
        ctx.strokeRect(4, h / 2, w - 8, 2);

        bCtx.strokeStyle = '#383838';
        bCtx.lineWidth = 6;
        bCtx.strokeRect(4, 4, w - 8, h - 8);

        // Rivets
        for (let x = 24; x < w; x += 64) {
          for (let y = 24; y < h; y += 64) {
            ctx.fillStyle = '#758291';
            ctx.beginPath();
            ctx.arc(x, y, 4.5, 0, Math.PI * 2);
            ctx.fill();
            bCtx.fillStyle = '#d0d0d0';
            bCtx.beginPath();
            bCtx.arc(x, y, 4.5, 0, Math.PI * 2);
            bCtx.fill();
          }
        }
        addGrain(ctx, 12);
        break;
      }

      case 'hazard': {
        ctx.fillStyle = '#d49e2a';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#1b1d21';
        for (let i = -h; i < w + h; i += 64) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i + 32, 0);
          ctx.lineTo(i + 32 - h, h);
          ctx.lineTo(i - h, h);
          ctx.closePath();
          ctx.fill();
        }
        addGrain(ctx, 14);
        break;
      }

      case 'crate_military': {
        // Olive-green ordnance crate with black straps & yellow stencil (Dust2/Train/Nuke)
        ctx.fillStyle = '#4d583a';
        ctx.fillRect(0, 0, w, h);
        bCtx.fillStyle = '#868686';
        bCtx.fillRect(0, 0, w, h);

        for (let y = 0; y < h; y += 64) {
          const t = Math.floor((rand() - 0.5) * 12);
          ctx.fillStyle = `rgb(${77 + t}, ${88 + t}, ${58 + t})`;
          ctx.fillRect(0, y + 2, w, 60);
          bCtx.fillStyle = '#505050';
          bCtx.fillRect(0, y, w, 3);
        }
        ctx.strokeStyle = '#313824';
        ctx.lineWidth = 36;
        ctx.strokeRect(18, 18, w - 36, h - 36);
        bCtx.strokeStyle = '#cfcfcf';
        bCtx.lineWidth = 36;
        bCtx.strokeRect(18, 18, w - 36, h - 36);

        // Twin vertical steel strapping bands
        ctx.fillStyle = '#222629';
        ctx.fillRect(108, 0, 22, h);
        ctx.fillRect(w - 130, 0, 22, h);
        bCtx.fillStyle = '#d8d8d8';
        bCtx.fillRect(108, 0, 22, h);
        bCtx.fillRect(w - 130, 0, 22, h);

        // Ordnance yellow stencil
        ctx.fillStyle = 'rgba(232, 194, 88, 0.78)';
        ctx.font = 'bold 34px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('7.62 NATO', w / 2, h / 2 - 14);
        ctx.font = 'bold 24px monospace';
        ctx.fillText('LOT 16-B · EXP', w / 2, h / 2 + 26);
        addGrain(ctx, 16);
        break;
      }

      case 'cinderblock': {
        ctx.fillStyle = '#6f7378';
        ctx.fillRect(0, 0, w, h);
        bCtx.fillStyle = '#404040';
        bCtx.fillRect(0, 0, w, h);
        const rows = 10;
        const cols = 4;
        const rh = h / rows;
        const cw = w / cols;
        for (let r = 0; r < rows; r++) {
          const off = (r % 2) * (cw / 2);
          for (let c = -1; c <= cols; c++) {
            const x = c * cw + off;
            const y = r * rh;
            const s = Math.floor((rand() - 0.5) * 16);
            ctx.fillStyle = `rgb(${120 + s}, ${123 + s}, ${126 + s})`;
            ctx.fillRect(x + 2, y + 2, cw - 4, rh - 4);
            bCtx.fillStyle = '#a4a4a4';
            bCtx.fillRect(x + 2, y + 2, cw - 4, rh - 4);
          }
        }
        addGrain(ctx, 20);
        addGrain(bCtx, 18);
        break;
      }

      case 'brick_yellow': {
        ctx.fillStyle = '#a3998b';
        ctx.fillRect(0, 0, w, h);
        bCtx.fillStyle = '#3c3c3c';
        bCtx.fillRect(0, 0, w, h);
        const rows = 14;
        const cols = 6;
        const rh = h / rows;
        const cw = w / cols;
        for (let r = 0; r < rows; r++) {
          const off = (r % 2) * (cw / 2);
          for (let c = -1; c <= cols; c++) {
            const x = c * cw + off;
            const y = r * rh;
            const t = Math.floor(rand() * 24);
            ctx.fillStyle = `rgb(${182 + t}, ${164 + t}, ${130 + t})`;
            ctx.fillRect(x + 2, y + 2, cw - 4, rh - 4);
            bCtx.fillStyle = '#a2a2a2';
            bCtx.fillRect(x + 2, y + 2, cw - 4, rh - 4);
          }
        }
        addGrain(ctx, 18);
        addGrain(bCtx, 14);
        break;
      }

      case 'corrugated_metal': {
        ctx.fillStyle = '#4e5862';
        ctx.fillRect(0, 0, w, h);
        for (let x = 0; x < w; x += 24) {
          ctx.fillStyle = 'rgba(255,255,255,0.14)';
          ctx.fillRect(x, 0, 8, h);
          ctx.fillStyle = 'rgba(0,0,0,0.28)';
          ctx.fillRect(x + 12, 0, 8, h);
          bCtx.fillStyle = '#d4d4d4';
          bCtx.fillRect(x, 0, 11, h);
          bCtx.fillStyle = '#323232';
          bCtx.fillRect(x + 12, 0, 11, h);
        }
        addGrain(ctx, 14);
        break;
      }

      case 'gravel_track': {
        // Crushed granite railroad ballast floor
        ctx.fillStyle = '#5c5954';
        ctx.fillRect(0, 0, w, h);
        bCtx.fillStyle = '#787878';
        bCtx.fillRect(0, 0, w, h);
        for (let i = 0; i < 650; i++) {
          const gx = rand() * w;
          const gy = rand() * h;
          const gr = 2 + rand() * 5;
          const v = 64 + Math.floor(rand() * 68);
          ctx.fillStyle = `rgb(${v + 4}, ${v}, ${v - 4})`;
          ctx.fillRect(gx, gy, gr, gr * 0.8);
          bCtx.fillStyle = rand() > 0.5 ? '#c4c4c4' : '#4a4a4a';
          bCtx.fillRect(gx, gy, gr, gr * 0.8);
        }
        addGrain(ctx, 22);
        addGrain(bCtx, 20);
        break;
      }

      case 'cracked_earth': {
        // Reddish-brown desert dirt floor from de_nuke yard
        ctx.fillStyle = '#7a6354';
        ctx.fillRect(0, 0, w, h);
        bCtx.fillStyle = '#888888';
        bCtx.fillRect(0, 0, w, h);
        for (let i = 0; i < 40; i++) {
          ctx.fillStyle = rand() > 0.5 ? 'rgba(98, 72, 58, 0.34)' : 'rgba(146, 122, 104, 0.28)';
          ctx.beginPath();
          ctx.ellipse(rand() * w, rand() * h, 18 + rand() * 44, 12 + rand() * 32, rand() * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.strokeStyle = 'rgba(42, 30, 24, 0.42)';
        bCtx.strokeStyle = '#363636';
        ctx.lineWidth = 2;
        bCtx.lineWidth = 3;
        for (let i = 0; i < 36; i++) {
          let sx = rand() * w;
          let sy = rand() * h;
          ctx.beginPath();
          bCtx.beginPath();
          ctx.moveTo(sx, sy);
          bCtx.moveTo(sx, sy);
          for (let s = 0; s < 4; s++) {
            sx += (rand() - 0.5) * 60;
            sy += (rand() - 0.5) * 60;
            ctx.lineTo(sx, sy);
            bCtx.lineTo(sx, sy);
          }
          ctx.stroke();
          bCtx.stroke();
        }
        addGrain(ctx, 22);
        break;
      }

      case 'cliff_rock': {
        // Reddish canyon cliff wall texture from de_nuke
        ctx.fillStyle = '#784e40';
        ctx.fillRect(0, 0, w, h);
        bCtx.fillStyle = '#7c7c7c';
        bCtx.fillRect(0, 0, w, h);
        for (let i = 0; i < 55; i++) {
          const rx = rand() * w;
          const ry = rand() * h;
          const rw = 30 + rand() * 90;
          const rh = 40 + rand() * 120;
          const tone = Math.floor((rand() - 0.5) * 42);
          ctx.fillStyle = `rgb(${122 + tone}, ${76 + Math.round(tone * 0.7)}, ${62 + Math.round(tone * 0.6)})`;
          ctx.fillRect(rx, ry, rw, rh);
          bCtx.fillStyle = rand() > 0.5 ? '#b4b4b4' : '#4c4c4c';
          bCtx.fillRect(rx, ry, rw, rh);
        }
        addGrain(ctx, 26);
        addGrain(bCtx, 24);
        break;
      }

      case 'container_blue':
      case 'container_red': {
        const base = kind === 'container_blue' ? [48, 84, 122] : [142, 48, 42];
        ctx.fillStyle = `rgb(${base[0]}, ${base[1]}, ${base[2]})`;
        ctx.fillRect(0, 0, w, h);
        // Corrugated vertical steel ribs
        for (let x = 0; x < w; x += 32) {
          ctx.fillStyle = 'rgba(255,255,255,0.12)';
          ctx.fillRect(x, 0, 10, h);
          ctx.fillStyle = 'rgba(0,0,0,0.24)';
          ctx.fillRect(x + 14, 0, 10, h);

          bCtx.fillStyle = '#c8c8c8';
          bCtx.fillRect(x, 0, 14, h);
          bCtx.fillStyle = '#383838';
          bCtx.fillRect(x + 16, 0, 14, h);
        }
        // Top/bottom container frame rail
        ctx.fillStyle = 'rgba(0,0,0,0.32)';
        ctx.fillRect(0, 0, w, 24);
        ctx.fillRect(0, h - 24, w, 24);
        // White circular shipping cargo emblem (image_5c6cc03c & image_d0354829)
        ctx.strokeStyle = 'rgba(242, 244, 246, 0.72)';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 68, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(242, 244, 246, 0.72)';
        ctx.beginPath();
        ctx.moveTo(w / 2 - 28, h / 2 + 34);
        ctx.lineTo(w / 2, h / 2 - 36);
        ctx.lineTo(w / 2 + 28, h / 2 + 34);
        ctx.lineTo(w / 2 + 12, h / 2 + 34);
        ctx.lineTo(w / 2, h / 2 + 2);
        ctx.lineTo(w / 2 - 12, h / 2 + 34);
        ctx.closePath();
        ctx.fill();
        addGrain(ctx, 12);
        break;
      }

      case 'moss_stone': {
        ctx.fillStyle = '#6c7260';
        ctx.fillRect(0, 0, w, h);
        bCtx.fillStyle = '#888888';
        bCtx.fillRect(0, 0, w, h);

        // Carved Aztec stone blocks with Mayan geometric relief carvings (image_4e314595)
        for (let y = 0; y < h; y += 128) {
          for (let x = 0; x < w; x += 128) {
            const tint = Math.floor((rand() - 0.5) * 18);
            ctx.fillStyle = `rgb(${128 + tint}, ${126 + tint}, ${106 + tint})`;
            ctx.fillRect(x + 4, y + 4, 120, 120);

            ctx.strokeStyle = 'rgba(34, 38, 28, 0.65)';
            ctx.lineWidth = 6;
            ctx.strokeRect(x + 4, y + 4, 120, 120);

            // Inner stepped Mayan carving motif
            ctx.strokeStyle = 'rgba(72, 68, 52, 0.55)';
            ctx.lineWidth = 4;
            ctx.strokeRect(x + 18, y + 18, 92, 92);
            ctx.strokeRect(x + 36, y + 36, 56, 56);
            ctx.fillStyle = 'rgba(64, 60, 46, 0.45)';
            ctx.fillRect(x + 52, y + 52, 24, 24);

            bCtx.strokeStyle = '#323232';
            bCtx.lineWidth = 6;
            bCtx.strokeRect(x + 4, y + 4, 120, 120);
            bCtx.strokeStyle = '#c8c8c8';
            bCtx.lineWidth = 4;
            bCtx.strokeRect(x + 18, y + 18, 92, 92);
          }
        }
        // Organic moss patches
        for (let i = 0; i < 42; i++) {
          ctx.fillStyle = `rgba(${54 + Math.floor(rand() * 28)}, ${98 + Math.floor(rand() * 34)}, 44, 0.36)`;
          ctx.beginPath();
          ctx.arc(rand() * w, rand() * h, 14 + rand() * 26, 0, Math.PI * 2);
          ctx.fill();
        }
        addGrain(ctx, 22);
        addGrain(bCtx, 20);
        break;
      }

      case 'asphalt': {
        ctx.fillStyle = '#32363b';
        ctx.fillRect(0, 0, w, h);
        addGrain(ctx, 30);
        addGrain(bCtx, 28);
        break;
      }

      case 'office_floor': {
        ctx.fillStyle = '#57606b';
        ctx.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y += 64) {
          for (let x = 0; x < w; x += 64) {
            const alt = ((x + y) / 64) % 2 === 0 ? 6 : -6;
            ctx.fillStyle = `rgb(${87 + alt}, ${96 + alt}, ${107 + alt})`;
            ctx.fillRect(x + 1, y + 1, 62, 62);
          }
        }
        addGrain(ctx, 10);
        break;
      }

      case 'snow': {
        ctx.fillStyle = '#e0e9f2';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 30; i++) {
          ctx.fillStyle = 'rgba(182, 204, 224, 0.22)';
          ctx.beginPath();
          ctx.ellipse(rand() * w, rand() * h, 40 + rand() * 50, 14 + rand() * 20, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        addGrain(ctx, 12);
        break;
      }

      case 'terracotta': {
        ctx.fillStyle = '#cca17a';
        ctx.fillRect(0, 0, w, h);
        for (let i = 0; i < 35; i++) {
          ctx.fillStyle = rand() > 0.5 ? 'rgba(145, 92, 56, 0.14)' : 'rgba(240, 212, 180, 0.14)';
          ctx.beginPath();
          ctx.arc(rand() * w, rand() * h, 24 + rand() * 44, 0, Math.PI * 2);
          ctx.fill();
        }
        // Subtle base plinth & top cornice line
        ctx.fillStyle = 'rgba(92, 62, 42, 0.26)';
        ctx.fillRect(0, h - 42, w, 42);
        addGrain(ctx, 16);
        addGrain(bCtx, 14);
        break;
      }

      case 'cobblestone': {
        ctx.fillStyle = '#5c554e';
        ctx.fillRect(0, 0, w, h);
        bCtx.fillStyle = '#303030';
        bCtx.fillRect(0, 0, w, h);

        const rows = 12;
        const cols = 10;
        const rh = h / rows;
        const cw = w / cols;
        for (let r = 0; r < rows; r++) {
          const off = (r % 2) * (cw * 0.5);
          for (let c = -1; c <= cols; c++) {
            const x = c * cw + off;
            const y = r * rh;
            const v = 115 + Math.floor(rand() * 34);
            ctx.fillStyle = `rgb(${v + 8}, ${v + 2}, ${v - 8})`;
            ctx.beginPath();
            ctx.roundRect(x + 3, y + 3, cw - 6, rh - 6, 8);
            ctx.fill();
            bCtx.fillStyle = '#b4b4b4';
            bCtx.beginPath();
            bCtx.roundRect(x + 3, y + 3, cw - 6, rh - 6, 8);
            bCtx.fill();
          }
        }
        addGrain(ctx, 16);
        break;
      }

      case 'wood_plank': {
        ctx.fillStyle = '#734b2b';
        ctx.fillRect(0, 0, w, h);
        bCtx.fillStyle = '#888888';
        bCtx.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y += 64) {
          const s = Math.floor((rand() - 0.5) * 18);
          ctx.fillStyle = `rgb(${115 + s}, ${75 + s}, ${43 + s})`;
          ctx.fillRect(0, y + 2, w, 60);
          bCtx.fillStyle = '#383838';
          bCtx.fillRect(0, y, w, 3);
        }
        addGrain(ctx, 16);
        break;
      }

      case 'water': {
        ctx.fillStyle = '#1f5363';
        ctx.fillRect(0, 0, w, h);
        bCtx.fillStyle = '#808080';
        bCtx.fillRect(0, 0, w, h);
        for (let i = 0; i < 85; i++) {
          const wx = rand() * w;
          const wy = rand() * h;
          const ww = 32 + rand() * 68;
          ctx.fillStyle = i % 2 === 0 ? 'rgba(130, 215, 232, 0.22)' : 'rgba(18, 62, 76, 0.24)';
          ctx.fillRect(wx, wy, ww, 4);
          bCtx.fillStyle = i % 2 === 0 ? '#a4a4a4' : '#646464';
          bCtx.fillRect(wx, wy, ww, 4);
        }
        addGrain(ctx, 8);
        break;
      }

      case 'roof_tile': {
        ctx.fillStyle = '#a85338';
        ctx.fillRect(0, 0, w, h);
        bCtx.fillStyle = '#707070';
        bCtx.fillRect(0, 0, w, h);
        const rows = 8;
        const cols = 12;
        const rh = h / rows;
        const cw = w / cols;
        for (let r = 0; r < rows; r++) {
          const y = r * rh;
          for (let c = 0; c < cols; c++) {
            const x = c * cw;
            const s = Math.floor((rand() - 0.5) * 26);
            const g = ctx.createLinearGradient(x, y, x + cw, y);
            g.addColorStop(0, `rgb(${128 + s}, ${60 + Math.round(s * 0.5)}, ${40 + Math.round(s * 0.4)})`);
            g.addColorStop(0.5, `rgb(${182 + s}, ${92 + Math.round(s * 0.5)}, ${62 + Math.round(s * 0.4)})`);
            g.addColorStop(1, `rgb(${112 + s}, ${50 + Math.round(s * 0.5)}, ${34 + Math.round(s * 0.4)})`);
            ctx.fillStyle = g;
            ctx.fillRect(x + 1, y + 2, cw - 2, rh - 4);
            ctx.fillStyle = 'rgba(28, 12, 8, 0.35)';
            ctx.fillRect(x, y + rh - 5, cw, 5);

            const bg = bCtx.createLinearGradient(x, y, x + cw, y);
            bg.addColorStop(0, '#505050');
            bg.addColorStop(0.5, '#d8d8d8');
            bg.addColorStop(1, '#505050');
            bCtx.fillStyle = bg;
            bCtx.fillRect(x + 1, y + 2, cw - 2, rh - 5);
          }
        }
        addGrain(ctx, 14);
        break;
      }

      case 'window_glass': {
        // Architectural multi-pane window with subtle interior depth & reflection diagonal
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, '#4d6f8c');
        grad.addColorStop(0.45, '#2b4359');
        grad.addColorStop(1, '#1d2b38');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(210, 236, 255, 0.16)';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.35);
        ctx.lineTo(w * 0.65, 0);
        ctx.lineTo(w * 0.88, 0);
        ctx.lineTo(0, h * 0.58);
        ctx.closePath();
        ctx.fill();
        // Mullions
        ctx.fillStyle = '#252b33';
        ctx.fillRect(0, 0, w, 16);
        ctx.fillRect(0, h - 16, w, 16);
        ctx.fillRect(0, 0, 16, h);
        ctx.fillRect(w - 16, 0, 16, h);
        ctx.fillRect(w / 2 - 6, 0, 12, h);
        ctx.fillRect(0, h / 2 - 6, w, 12);
        bCtx.fillStyle = '#606060';
        bCtx.fillRect(0, 0, w, h);
        bCtx.fillStyle = '#d0d0d0';
        bCtx.fillRect(w / 2 - 6, 0, 12, h);
        bCtx.fillRect(0, h / 2 - 6, w, 12);
        break;
      }

      case 'wood_mahogany': {
        ctx.fillStyle = '#5e3420';
        ctx.fillRect(0, 0, w, h);
        bCtx.fillStyle = '#808080';
        bCtx.fillRect(0, 0, w, h);
        for (let i = 0; i < 65; i++) {
          const y0 = (i / 65) * h;
          ctx.strokeStyle = i % 2 === 0 ? 'rgba(42, 18, 8, 0.35)' : 'rgba(128, 72, 42, 0.25)';
          ctx.lineWidth = 2 + rand() * 3;
          ctx.beginPath();
          ctx.moveTo(0, y0);
          ctx.bezierCurveTo(w * 0.3, y0 + (rand() - 0.5) * 18, w * 0.7, y0 + (rand() - 0.5) * 18, w, y0);
          ctx.stroke();
          bCtx.strokeStyle = i % 2 === 0 ? '#747474' : '#909090';
          bCtx.lineWidth = 2;
          bCtx.beginPath();
          bCtx.moveTo(0, y0);
          bCtx.lineTo(w, y0);
          bCtx.stroke();
        }
        addGrain(ctx, 10);
        break;
      }

      case 'carpet_office': {
        ctx.fillStyle = '#3f4b59';
        ctx.fillRect(0, 0, w, h);
        bCtx.fillStyle = '#787878';
        bCtx.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y += 64) {
          for (let x = 0; x < w; x += 64) {
            const alt = ((x + y) / 64) % 2 === 0 ? 7 : -7;
            ctx.fillStyle = `rgb(${63 + alt}, ${75 + alt}, ${89 + alt})`;
            ctx.fillRect(x + 1, y + 1, 62, 62);
            bCtx.fillStyle = alt > 0 ? '#8c8c8c' : '#707070';
            bCtx.fillRect(x + 1, y + 1, 62, 62);
          }
        }
        addGrain(ctx, 18);
        addGrain(bCtx, 18);
        break;
      }

      case 'bark_palm': {
        ctx.fillStyle = '#6f553b';
        ctx.fillRect(0, 0, w, h);
        bCtx.fillStyle = '#787878';
        bCtx.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y += 32) {
          ctx.fillStyle = 'rgba(42, 28, 16, 0.48)';
          ctx.fillRect(0, y, w, 8);
          ctx.fillStyle = 'rgba(154, 126, 92, 0.25)';
          ctx.fillRect(0, y + 10, w, 14);
          bCtx.fillStyle = '#404040';
          bCtx.fillRect(0, y, w, 7);
          bCtx.fillStyle = '#b4b4b4';
          bCtx.fillRect(0, y + 8, w, 16);
        }
        addGrain(ctx, 18);
        break;
      }

      case 'bark_pine': {
        ctx.fillStyle = '#4c3828';
        ctx.fillRect(0, 0, w, h);
        bCtx.fillStyle = '#787878';
        bCtx.fillRect(0, 0, w, h);
        for (let i = 0; i < 90; i++) {
          const x = rand() * w;
          const y = rand() * h;
          const pw = 10 + rand() * 18;
          const ph = 26 + rand() * 44;
          ctx.fillStyle = rand() > 0.5 ? 'rgba(34, 22, 14, 0.45)' : 'rgba(98, 72, 52, 0.32)';
          ctx.fillRect(x, y, pw, ph);
          bCtx.fillStyle = rand() > 0.5 ? '#b4b4b4' : '#4a4a4a';
          bCtx.fillRect(x, y, pw, ph);
        }
        addGrain(ctx, 18);
        break;
      }

      case 'foliage_leaf': {
        ctx.fillStyle = '#385c2b';
        ctx.fillRect(0, 0, w, h);
        bCtx.fillStyle = '#787878';
        bCtx.fillRect(0, 0, w, h);
        for (let i = 0; i < 160; i++) {
          const lx = rand() * w;
          const ly = rand() * h;
          const rx = 12 + rand() * 20;
          const ry = 6 + rand() * 10;
          const ang = rand() * Math.PI;
          const gVal = 82 + Math.floor(rand() * 58);
          ctx.fillStyle = `rgb(${Math.round(gVal * 0.52)}, ${gVal}, ${Math.round(gVal * 0.38)})`;
          ctx.beginPath();
          ctx.ellipse(lx, ly, rx, ry, ang, 0, Math.PI * 2);
          ctx.fill();
          bCtx.fillStyle = rand() > 0.5 ? '#b8b8b8' : '#585858';
          bCtx.beginPath();
          bCtx.ellipse(lx, ly, rx, ry, ang, 0, Math.PI * 2);
          bCtx.fill();
        }
        addGrain(ctx, 14);
        break;
      }

      case 'foliage_pine': {
        ctx.fillStyle = '#253f31';
        ctx.fillRect(0, 0, w, h);
        bCtx.fillStyle = '#747474';
        bCtx.fillRect(0, 0, w, h);
        for (let i = 0; i < 200; i++) {
          const x = rand() * w;
          const y = rand() * h;
          const ang = rand() * Math.PI * 2;
          const len = 14 + rand() * 24;
          const frosted = rand() > 0.72;
          ctx.strokeStyle = frosted ? '#b6cedc' : rand() > 0.45 ? '#355c47' : '#1b3126';
          ctx.lineWidth = 3 + rand() * 3;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
          ctx.stroke();
          bCtx.strokeStyle = frosted ? '#d0d0d0' : '#969696';
          bCtx.lineWidth = 3;
          bCtx.beginPath();
          bCtx.moveTo(x, y);
          bCtx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
          bCtx.stroke();
        }
        addGrain(ctx, 12);
        break;
      }
    }
  }
}

export const textures = new ProceduralTextureLibrary();
