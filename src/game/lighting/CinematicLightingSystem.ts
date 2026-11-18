import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { BuiltMap } from '../MapManager';
import { settingsManager } from '../SettingsManager';
import { MapId } from '../types';

export interface MapLightingProfile {
  environmentIntensity: number;
  exposure: number;
  sunScale: number;
  rimColor: number;
  rimIntensity: number;
  bounceColor: number;
  bounceIntensity: number;
  scatterColor: number;
  shaftColor: number;
  mieStrength: number;
  rayleighStrength: number;
  shaftStrength: number;
  scatterDensity: number;
  sunDiscSize: number;
  volumetricTint: number;
  volumetricOpacity: number;
  hasIndoorFluorescents: boolean;
}

const DEFAULT_PROFILE: MapLightingProfile = {
  environmentIntensity: 0.72,
  exposure: 1.1,
  sunScale: 1.0,
  rimColor: 0x8dbce8,
  rimIntensity: 0.48,
  bounceColor: 0xd4b28a,
  bounceIntensity: 0.34,
  scatterColor: 0xffdfad,
  shaftColor: 0xffe6bd,
  mieStrength: 0.36,
  rayleighStrength: 0.24,
  shaftStrength: 0.3,
  scatterDensity: 0.0085,
  sunDiscSize: 0.055,
  volumetricTint: 0xffe0ad,
  volumetricOpacity: 0.14,
  hasIndoorFluorescents: false,
};

export const MAP_LIGHTING_PROFILES: Record<MapId, MapLightingProfile> = {
  de_dust2: {
    environmentIntensity: 0.76,
    exposure: 1.12,
    sunScale: 1.08,
    rimColor: 0x8ec3f0,
    rimIntensity: 0.5,
    bounceColor: 0xe3bf8e,
    bounceIntensity: 0.42,
    scatterColor: 0xffdfb0,
    shaftColor: 0xffe6ba,
    mieStrength: 0.42,
    rayleighStrength: 0.26,
    shaftStrength: 0.34,
    scatterDensity: 0.009,
    sunDiscSize: 0.06,
    volumetricTint: 0xffdfa8,
    volumetricOpacity: 0.14,
    hasIndoorFluorescents: false,
  },
  de_inferno: {
    environmentIntensity: 0.74,
    exposure: 1.1,
    sunScale: 1.05,
    rimColor: 0x90c0eb,
    rimIntensity: 0.48,
    bounceColor: 0xd8a87e,
    bounceIntensity: 0.38,
    scatterColor: 0xffd7a8,
    shaftColor: 0xffe1b5,
    mieStrength: 0.38,
    rayleighStrength: 0.24,
    shaftStrength: 0.32,
    scatterDensity: 0.0088,
    sunDiscSize: 0.058,
    volumetricTint: 0xffdba6,
    volumetricOpacity: 0.14,
    hasIndoorFluorescents: false,
  },
  de_nuke: {
    environmentIntensity: 0.84,
    exposure: 1.08,
    sunScale: 1.0,
    rimColor: 0x9bb8d6,
    rimIntensity: 0.52,
    bounceColor: 0x7b8896,
    bounceIntensity: 0.34,
    scatterColor: 0xd9e6f2,
    shaftColor: 0xf4efe4,
    mieStrength: 0.28,
    rayleighStrength: 0.22,
    shaftStrength: 0.24,
    scatterDensity: 0.0078,
    sunDiscSize: 0.048,
    volumetricTint: 0xd8ecff,
    volumetricOpacity: 0.13,
    hasIndoorFluorescents: true,
  },
  de_train: {
    environmentIntensity: 0.68,
    exposure: 1.08,
    sunScale: 0.96,
    rimColor: 0x8ea4ba,
    rimIntensity: 0.5,
    bounceColor: 0x707880,
    bounceIntensity: 0.3,
    scatterColor: 0xbccad6,
    shaftColor: 0xd8e4ee,
    mieStrength: 0.24,
    rayleighStrength: 0.3,
    shaftStrength: 0.2,
    scatterDensity: 0.0105,
    sunDiscSize: 0.042,
    volumetricTint: 0xcce0f5,
    volumetricOpacity: 0.14,
    hasIndoorFluorescents: true,
  },
  de_aztec: {
    environmentIntensity: 0.72,
    exposure: 1.09,
    sunScale: 1.04,
    rimColor: 0x8ac2b0,
    rimIntensity: 0.48,
    bounceColor: 0x6b7d52,
    bounceIntensity: 0.36,
    scatterColor: 0xcce6cf,
    shaftColor: 0xdff5d8,
    mieStrength: 0.44,
    rayleighStrength: 0.34,
    shaftStrength: 0.38,
    scatterDensity: 0.0115,
    sunDiscSize: 0.056,
    volumetricTint: 0xdcf5d4,
    volumetricOpacity: 0.16,
    hasIndoorFluorescents: false,
  },
  de_dust: {
    environmentIntensity: 0.76,
    exposure: 1.11,
    sunScale: 1.06,
    rimColor: 0x90c0eb,
    rimIntensity: 0.48,
    bounceColor: 0xdfb886,
    bounceIntensity: 0.4,
    scatterColor: 0xffe0b2,
    shaftColor: 0xffe6bd,
    mieStrength: 0.4,
    rayleighStrength: 0.26,
    shaftStrength: 0.32,
    scatterDensity: 0.0092,
    sunDiscSize: 0.058,
    volumetricTint: 0xffe0aa,
    volumetricOpacity: 0.14,
    hasIndoorFluorescents: false,
  },
  de_cbble: {
    environmentIntensity: 0.74,
    exposure: 1.09,
    sunScale: 1.02,
    rimColor: 0x9bc0e0,
    rimIntensity: 0.48,
    bounceColor: 0x8f8a7d,
    bounceIntensity: 0.34,
    scatterColor: 0xe6ecf2,
    shaftColor: 0xfff0d4,
    mieStrength: 0.3,
    rayleighStrength: 0.25,
    shaftStrength: 0.26,
    scatterDensity: 0.0085,
    sunDiscSize: 0.05,
    volumetricTint: 0xffe6bd,
    volumetricOpacity: 0.13,
    hasIndoorFluorescents: false,
  },
  de_mirage: {
    environmentIntensity: 0.76,
    exposure: 1.11,
    sunScale: 1.06,
    rimColor: 0x8fc0ed,
    rimIntensity: 0.48,
    bounceColor: 0xe2bc8c,
    bounceIntensity: 0.4,
    scatterColor: 0xffe0b2,
    shaftColor: 0xffe7bf,
    mieStrength: 0.4,
    rayleighStrength: 0.25,
    shaftStrength: 0.32,
    scatterDensity: 0.009,
    sunDiscSize: 0.058,
    volumetricTint: 0xffe0ab,
    volumetricOpacity: 0.14,
    hasIndoorFluorescents: false,
  },
  cs_office: {
    environmentIntensity: 0.78,
    exposure: 1.1,
    sunScale: 0.98,
    rimColor: 0xb0d0eb,
    rimIntensity: 0.46,
    bounceColor: 0x8999a8,
    bounceIntensity: 0.36,
    scatterColor: 0xddeaf7,
    shaftColor: 0xf4f8ff,
    mieStrength: 0.24,
    rayleighStrength: 0.26,
    shaftStrength: 0.22,
    scatterDensity: 0.0082,
    sunDiscSize: 0.044,
    volumetricTint: 0xe3f1ff,
    volumetricOpacity: 0.12,
    hasIndoorFluorescents: true,
  },
  cs_assault: {
    environmentIntensity: 0.62,
    exposure: 1.14,
    sunScale: 0.94,
    rimColor: 0x5d82ab,
    rimIntensity: 0.56,
    bounceColor: 0x454f5e,
    bounceIntensity: 0.32,
    scatterColor: 0x6785ab,
    shaftColor: 0x99bef0,
    mieStrength: 0.28,
    rayleighStrength: 0.3,
    shaftStrength: 0.22,
    scatterDensity: 0.011,
    sunDiscSize: 0.036,
    volumetricTint: 0xffba66,
    volumetricOpacity: 0.17,
    hasIndoorFluorescents: true,
  },
  cs_italy: {
    environmentIntensity: 0.75,
    exposure: 1.1,
    sunScale: 1.04,
    rimColor: 0x92c3ec,
    rimIntensity: 0.48,
    bounceColor: 0xd9b389,
    bounceIntensity: 0.38,
    scatterColor: 0xffddb0,
    shaftColor: 0xffe5bd,
    mieStrength: 0.38,
    rayleighStrength: 0.25,
    shaftStrength: 0.32,
    scatterDensity: 0.0088,
    sunDiscSize: 0.056,
    volumetricTint: 0xffdca8,
    volumetricOpacity: 0.14,
    hasIndoorFluorescents: false,
  },
  cs_militia: {
    environmentIntensity: 0.74,
    exposure: 1.1,
    sunScale: 1.02,
    rimColor: 0x96badb,
    rimIntensity: 0.48,
    bounceColor: 0x9a8268,
    bounceIntensity: 0.35,
    scatterColor: 0xedd6b7,
    shaftColor: 0xffe6c2,
    mieStrength: 0.36,
    rayleighStrength: 0.27,
    shaftStrength: 0.3,
    scatterDensity: 0.0094,
    sunDiscSize: 0.052,
    volumetricTint: 0xffe1b5,
    volumetricOpacity: 0.14,
    hasIndoorFluorescents: false,
  },
};

const AtmosphericScatteringShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    tDepth: { value: null as THREE.Texture | null },
    uInvProjection: { value: new THREE.Matrix4() },
    uSunViewDir: { value: new THREE.Vector3(0.4, 0.7, 0.4) },
    uSunScreenPos: { value: new THREE.Vector2(0.5, 0.5) },
    uSunVisible: { value: 1.0 },
    uScatterColor: { value: new THREE.Color(0xffdfb0) },
    uShaftColor: { value: new THREE.Color(0xffe6bd) },
    uMieStrength: { value: 0.36 },
    uRayleighStrength: { value: 0.24 },
    uShaftStrength: { value: 0.3 },
    uScatterDensity: { value: 0.0085 },
    uTime: { value: 0.0 },
    uSamples: { value: 18 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform mat4 uInvProjection;
    uniform vec3 uSunViewDir;
    uniform vec2 uSunScreenPos;
    uniform float uSunVisible;
    uniform vec3 uScatterColor;
    uniform vec3 uShaftColor;
    uniform float uMieStrength;
    uniform float uRayleighStrength;
    uniform float uShaftStrength;
    uniform float uScatterDensity;
    uniform float uTime;
    uniform int uSamples;
    varying vec2 vUv;

    float phaseHG(float cosTheta, float g) {
      float g2 = g * g;
      float denom = max(0.08, 1.0 + g2 - 2.0 * g * cosTheta);
      return (1.0 - g2) / (4.0 * 3.14159265 * pow(denom, 1.5));
    }

    vec3 reconstructViewPos(vec2 uv, float depth) {
      vec4 clip = vec4(uv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
      vec4 viewP = uInvProjection * clip;
      return viewP.xyz / max(0.0001, viewP.w);
    }

    float interleavedGradientNoise(vec2 px) {
      vec3 magic = vec3(0.06711056, 0.00583715, 52.9829189);
      return fract(magic.z * fract(dot(px, magic.xy)));
    }

    void main() {
      vec4 baseSample = texture2D(tDiffuse, vUv);
      vec3 col = baseSample.rgb;

      float depth = texture2D(tDepth, vUv).r;
      bool isSky = depth >= 0.99995;

      vec3 viewPos = reconstructViewPos(vUv, min(depth, 0.9999));
      float viewDist = length(viewPos);
      vec3 rayDir = normalize(viewPos);

      float cosTheta = clamp(dot(rayDir, normalize(uSunViewDir)), -1.0, 1.0);
      float mieForward = phaseHG(cosTheta, 0.72) * 3.2;
      float rayleighBroad = 0.35 + 0.65 * pow(max(0.0, cosTheta * 0.5 + 0.5), 1.6);

      // 1. Aerial Perspective & Atmospheric In-Scattering on distant architecture/terrain
      if (!isSky) {
        float opticalDepth = 1.0 - exp(-max(0.0, viewDist - 6.0) * uScatterDensity);
        vec3 inScatter = uScatterColor * (rayleighBroad * uRayleighStrength + mieForward * uMieStrength * 0.65);
        col = mix(col, max(col, inScatter), opticalDepth * 0.38);
        col += inScatter * opticalDepth * 0.26;
      } else {
        // Subtle Mie aureole boost in sky around sun direction
        float skyGlow = phaseHG(cosTheta, 0.8) * 1.45;
        col += uShaftColor * skyGlow * uMieStrength * 0.42;
      }

      // 2. Occluded Crepuscular Sun Shafts (God Rays)
      if (uSunVisible > 0.005 && uShaftStrength > 0.005) {
        vec2 sunPos = uSunScreenPos;
        vec2 delta = (vUv - sunPos);
        float radialDist = length(delta);

        // Clamp ray march span so far corners stay clean and jitter-free
        float maxStepSpan = 0.85;
        vec2 stepVec = delta * (min(radialDist, maxStepSpan) / max(0.0001, radialDist)) / float(uSamples);

        float dither = interleavedGradientNoise(gl_FragCoord.xy + fract(uTime) * 37.0);
        vec2 sampleUv = vUv - stepVec * dither;

        float illuminationDecay = 1.0;
        float accum = 0.0;
        float weightSum = 0.0;

        for (int i = 0; i < 24; i++) {
          if (i >= uSamples) break;
          sampleUv -= stepVec;
          vec2 clampedUv = clamp(sampleUv, vec2(0.001), vec2(0.999));
          float sDepth = texture2D(tDepth, clampedUv).r;
          float skyMask = smoothstep(0.9985, 0.99992, sDepth);
          float inFrame = step(0.0, sampleUv.x) * step(sampleUv.x, 1.0) * step(0.0, sampleUv.y) * step(sampleUv.y, 1.0);
          accum += skyMask * illuminationDecay * inFrame;
          weightSum += illuminationDecay;
          illuminationDecay *= 0.915;
        }

        float normalizedShafts = accum / max(0.001, weightSum);
        float angleAtten = smoothstep(-0.15, 0.85, cosTheta);
        float radialAtten = exp(-radialDist * 1.45);
        float occlusionFade = isSky ? 0.55 : 1.0;

        vec3 shaftAdd = uShaftColor * normalizedShafts * uShaftStrength * uSunVisible * (0.35 + 0.65 * angleAtten) * (0.4 + 0.6 * radialAtten) * occlusionFade;
        col += shaftAdd;
      }

      gl_FragColor = vec4(max(col, vec3(0.0)), baseSample.a);
    }
  `,
};

/**
 * Custom GTAOPass that excludes decals, volumetric cones, sprites, muzzle flashes,
 * and the sky dome from the normal/depth G-buffer so sky pixels remain at depth = 1.0
 * and transparent FX never cast dark AO rectangles.
 */
class TacticalGTAOPass extends GTAOPass {
  private _extraHidden: THREE.Object3D[] = [];

  override render(
    renderer: THREE.WebGLRenderer,
    writeBuffer: THREE.WebGLRenderTarget,
    readBuffer: THREE.WebGLRenderTarget,
    deltaTime = 0,
    maskActive = false
  ): void {
    const hidden = this._extraHidden;
    hidden.length = 0;
    this.scene.traverse((obj: THREE.Object3D) => {
      if (!obj.visible) return;
      if (obj.userData?.excludeFromAO || obj.userData?.isSkyDome || (obj as THREE.Sprite).isSprite) {
        obj.visible = false;
        hidden.push(obj);
        return;
      }
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        const mat = mesh.material;
        if (!Array.isArray(mat) && mat) {
          if (mat.transparent && mat.depthWrite === false) {
            obj.visible = false;
            hidden.push(obj);
            return;
          }
          if (mat.side === THREE.BackSide && mesh.geometry?.boundingSphere && mesh.geometry.boundingSphere.radius > 160) {
            obj.visible = false;
            hidden.push(obj);
          }
        }
      }
    });

    try {
      super.render(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
    } finally {
      for (let i = 0; i < hidden.length; i++) {
        hidden[i].visible = true;
      }
      hidden.length = 0;
    }
  }
}

export function bakeBiomeEnvironment(renderer: THREE.WebGLRenderer, map: BuiltMap): THREE.WebGLRenderTarget {
  const profile = MAP_LIGHTING_PROFILES[map.id] ?? DEFAULT_PROFILE;
  const iblScene = new THREE.Scene();

  const domeGeo = new THREE.SphereGeometry(22, 24, 16);
  const domeMat = new THREE.ShaderMaterial({
    uniforms: {
      uZenith: { value: new THREE.Color(map.hemiSky).multiplyScalar(1.15) },
      uHorizon: { value: new THREE.Color(map.fogColor).multiplyScalar(1.25) },
      uGround: { value: new THREE.Color(map.hemiGround).multiplyScalar(0.85) },
      uSunDir: { value: map.sunPos.clone().normalize() },
      uSunColor: { value: new THREE.Color(map.sunColor) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uZenith;
      uniform vec3 uHorizon;
      uniform vec3 uGround;
      uniform vec3 uSunDir;
      uniform vec3 uSunColor;
      varying vec3 vDir;
      void main() {
        float h = vDir.y;
        vec3 sky = h >= 0.0
          ? mix(uHorizon, uZenith, pow(clamp(h, 0.0, 1.0), 0.6))
          : mix(uHorizon * 0.72, uGround, pow(clamp(-h, 0.0, 1.0), 0.55));
        float sunAmt = max(0.0, dot(vDir, uSunDir));
        sky += uSunColor * (pow(sunAmt, 42.0) * 3.8 + pow(sunAmt, 6.0) * 0.48);
        gl_FragColor = vec4(sky, 1.0);
      }
    `,
    side: THREE.BackSide,
  });
  const dome = new THREE.Mesh(domeGeo, domeMat);
  iblScene.add(dome);

  const sunCardGeo = new THREE.PlaneGeometry(6, 6);
  const sunCardMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(map.sunColor).multiplyScalar(3.2),
    side: THREE.DoubleSide,
  });
  const sunCard = new THREE.Mesh(sunCardGeo, sunCardMat);
  sunCard.position.copy(map.sunPos).normalize().multiplyScalar(14);
  sunCard.lookAt(0, 0, 0);
  iblScene.add(sunCard);

  const rimCardMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(profile.rimColor).multiplyScalar(1.35),
    side: THREE.DoubleSide,
  });
  const rimCard = new THREE.Mesh(sunCardGeo, rimCardMat);
  rimCard.position.set(-map.sunPos.x, 26, -map.sunPos.z).normalize().multiplyScalar(15);
  rimCard.lookAt(0, 0, 0);
  iblScene.add(rimCard);

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const rt = pmrem.fromScene(iblScene, 0.035);
  pmrem.dispose();

  domeGeo.dispose();
  domeMat.dispose();
  sunCardGeo.dispose();
  sunCardMat.dispose();
  rimCardMat.dispose();
  return rt;
}

export class CinematicLightingSystem {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private container: HTMLElement;
  private isSoftwareGl: boolean;

  // Multi-layer light rig
  public hemiLight: THREE.HemisphereLight;
  public nearSunLight: THREE.DirectionalLight;
  public farSunLight: THREE.DirectionalLight;
  public rimLight: THREE.DirectionalLight;
  public bounceLight: THREE.DirectionalLight;
  private c4BeaconLight: THREE.PointLight;

  // Procedural Sky Corona & Volumetric Beams
  private sunCoronaGroup = new THREE.Group();
  private sunCoronaMesh: THREE.Mesh;
  private sunCoronaMat: THREE.ShaderMaterial;
  private volumetricGroup = new THREE.Group();
  private volumetricMaterials: THREE.ShaderMaterial[] = [];

  // Cached per-map PMREM environment maps
  private envCache = new Map<MapId, THREE.WebGLRenderTarget>();
  private currentProfile: MapLightingProfile = MAP_LIGHTING_PROFILES.de_dust2;
  private sunOffset = new THREE.Vector3(54, 78, 38);

  // Post-processing
  private composer: EffectComposer | null = null;
  private gtaoPass: TacticalGTAOPass | null = null;
  private scatteringPass: ShaderPass | null = null;
  private bloomPass: UnrealBloomPass | null = null;

  // Fallback depth target when GTAOPass is disabled (Medium quality or zoomed scope)
  private fallbackDepthTarget: THREE.WebGLRenderTarget | null = null;
  private depthOverrideMat = new THREE.MeshDepthMaterial();
  private _hiddenForDepth: THREE.Object3D[] = [];

  // Reusable zero-GC math vectors & matrices
  private readonly _sunDir = new THREE.Vector3();
  private readonly _sunWorldPos = new THREE.Vector3();
  private readonly _sunClip = new THREE.Vector4();
  private readonly _camFwd = new THREE.Vector3();
  private readonly _lightTargetPos = new THREE.Vector3();
  private readonly _lightSpacePos = new THREE.Vector3();
  private readonly _lightRight = new THREE.Vector3();
  private readonly _lightUp = new THREE.Vector3();
  private readonly _worldUp = new THREE.Vector3(0, 1, 0);

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    container: HTMLElement,
    isSoftwareGl: boolean
  ) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.container = container;
    this.isSoftwareGl = isSoftwareGl;

    // 1. Hemisphere Sky/Ground Bounce
    this.hemiLight = new THREE.HemisphereLight(0x9ec5e6, 0x8a7052, 0.72);
    this.scene.add(this.hemiLight);

    // 2. Near-Field High-Resolution Key Sun (Texel-snapped around focus)
    this.nearSunLight = new THREE.DirectionalLight(0xffe6bd, 1.35);
    this.nearSunLight.position.set(48, 72, 34);
    this.nearSunLight.castShadow = !isSoftwareGl;
    this.nearSunLight.shadow.mapSize.set(2048, 2048);
    this.nearSunLight.shadow.camera.near = 1;
    this.nearSunLight.shadow.camera.far = 185;
    const nearD = 26;
    this.nearSunLight.shadow.camera.left = -nearD;
    this.nearSunLight.shadow.camera.right = nearD;
    this.nearSunLight.shadow.camera.top = nearD;
    this.nearSunLight.shadow.camera.bottom = -nearD;
    this.nearSunLight.shadow.radius = 2.2;
    this.nearSunLight.shadow.bias = -0.00035;
    this.nearSunLight.shadow.normalBias = 0.018;
    this.scene.add(this.nearSunLight);
    this.scene.add(this.nearSunLight.target);

    // 3. Far Macro Sun Cascade (Wide courtyard & tower shadows on High quality)
    this.farSunLight = new THREE.DirectionalLight(0xffe6bd, 0.65);
    this.farSunLight.position.set(48, 72, 34);
    this.farSunLight.castShadow = !isSoftwareGl;
    this.farSunLight.shadow.mapSize.set(1024, 1024);
    this.farSunLight.shadow.camera.near = 2;
    this.farSunLight.shadow.camera.far = 230;
    const farD = 74;
    this.farSunLight.shadow.camera.left = -farD;
    this.farSunLight.shadow.camera.right = farD;
    this.farSunLight.shadow.camera.top = farD;
    this.farSunLight.shadow.camera.bottom = -farD;
    this.farSunLight.shadow.radius = 3.0;
    this.farSunLight.shadow.bias = -0.00055;
    this.farSunLight.shadow.normalBias = 0.032;
    this.scene.add(this.farSunLight);
    this.scene.add(this.farSunLight.target);

    // 4. Opposite-Azimuth Sky Rim Light (Dynamic separation on silhouette edges)
    this.rimLight = new THREE.DirectionalLight(0x8dbce8, 0.48);
    this.rimLight.position.set(-45, 32, -38);
    this.scene.add(this.rimLight);

    // 5. Indirect Ground Albedo Bounce Light (Warm sand / cool concrete uplift)
    this.bounceLight = new THREE.DirectionalLight(0xd4b28a, 0.34);
    this.bounceLight.position.set(-22, 14, 30);
    this.scene.add(this.bounceLight);

    // 6. Dynamic Planted C4 Pulsing Beacon Light
    this.c4BeaconLight = new THREE.PointLight(0xff2b1f, 0, 11, 1.8);
    this.scene.add(this.c4BeaconLight);

    // 7. Procedural Sun Disc & Mie Corona (Inside SkyDome radius 280 -> placed at 245)
    this.sunCoronaMat = new THREE.ShaderMaterial({
      uniforms: {
        uSunColor: { value: new THREE.Color(0xffe4b8) },
        uDiscSize: { value: 0.055 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uSunColor;
        uniform float uDiscSize;
        varying vec2 vUv;
        void main() {
          vec2 p = vUv * 2.0 - 1.0;
          float r = length(p);
          float disc = smoothstep(uDiscSize * 1.45, uDiscSize * 0.65, r);
          float innerHalo = exp(-r * 5.2) * 0.85;
          float outerMie = exp(-r * 2.1) * 0.38;
          float alpha = clamp(disc + innerHalo + outerMie, 0.0, 1.0) * smoothstep(1.0, 0.55, r);
          vec3 col = mix(uSunColor, vec3(1.0, 0.99, 0.95), disc * 0.85) * (0.95 + disc * 1.35);
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      blending: THREE.AdditiveBlending,
      fog: false,
    });
    this.sunCoronaMesh = new THREE.Mesh(new THREE.PlaneGeometry(96, 96), this.sunCoronaMat);
    this.sunCoronaMesh.userData.excludeFromAO = true;
    this.sunCoronaGroup.add(this.sunCoronaMesh);
    this.scene.add(this.sunCoronaGroup);

    // 8. Volumetric Sunbeam & Lamp Dust Cones Container
    this.scene.add(this.volumetricGroup);

    this.rebuildPostProcessing();
  }

  private getOrBakeBiomeEnv(map: BuiltMap): THREE.Texture {
    const cached = this.envCache.get(map.id);
    if (cached) return cached.texture;
    const rt = bakeBiomeEnvironment(this.renderer, map);
    this.envCache.set(map.id, rt);
    return rt.texture;
  }

  public applyMapAtmosphere(map: BuiltMap): void {
    const profile = MAP_LIGHTING_PROFILES[map.id] ?? DEFAULT_PROFILE;
    this.currentProfile = profile;

    this.scene.background = new THREE.Color(map.skyColor);
    this.scene.fog = new THREE.FogExp2(map.fogColor, map.fogDensity * 0.88);
    this.renderer.toneMappingExposure = profile.exposure;

    // Biome-reactive PBR environment map
    this.scene.environment = this.getOrBakeBiomeEnv(map);
    this.scene.environmentIntensity = profile.environmentIntensity;

    // Update sun vector
    this.sunOffset.copy(map.sunPos);
    this._sunDir.copy(map.sunPos).normalize();

    // Split sun intensity across Near High-Res Cascade (66%) + Far Macro Cascade (34%)
    const totalSun = map.sunIntensity * profile.sunScale;
    const quality = settingsManager.get().graphicsQuality;
    const useDualCascade = !this.isSoftwareGl && quality === 'high';

    this.nearSunLight.color.setHex(map.sunColor);
    this.farSunLight.color.setHex(map.sunColor);
    if (useDualCascade) {
      this.nearSunLight.intensity = totalSun * 0.66;
      this.farSunLight.intensity = totalSun * 0.34;
    } else {
      this.nearSunLight.intensity = totalSun;
      this.farSunLight.intensity = 0;
    }
    this.nearSunLight.position.copy(map.sunPos);
    this.farSunLight.position.copy(map.sunPos);

    // Opposite-azimuth Sky Rim Light
    this.rimLight.color.setHex(profile.rimColor);
    this.rimLight.intensity = profile.rimIntensity;
    this.rimLight.position.set(
      -this._sunDir.x * 58,
      Math.max(22, this._sunDir.y * 34),
      -this._sunDir.z * 58
    );

    // Ground Albedo Bounce Light (soft lateral/upward indirect fill)
    this.bounceLight.color.setHex(profile.bounceColor);
    this.bounceLight.intensity = profile.bounceIntensity;
    this.bounceLight.position.set(
      -this._sunDir.z * 38,
      14,
      this._sunDir.x * 38
    );

    // Hemisphere sky-ground ambient
    this.hemiLight.color.setHex(map.hemiSky);
    this.hemiLight.groundColor.setHex(map.hemiGround);
    this.hemiLight.intensity = map.hemiIntensity * 0.94;

    // Sun Corona Shader
    this.sunCoronaMat.uniforms.uSunColor.value.setHex(profile.shaftColor);
    this.sunCoronaMat.uniforms.uDiscSize.value = profile.sunDiscSize;

    // Atmospheric Scattering Uniforms
    if (this.scatteringPass) {
      const u = this.scatteringPass.uniforms;
      (u.uScatterColor.value as THREE.Color).setHex(profile.scatterColor);
      (u.uShaftColor.value as THREE.Color).setHex(profile.shaftColor);
      u.uMieStrength.value = profile.mieStrength;
      u.uRayleighStrength.value = profile.rayleighStrength;
      u.uShaftStrength.value = profile.shaftStrength;
      u.uScatterDensity.value = profile.scatterDensity;
    }

    // Build subtle volumetric sunbeams & point-lamp dust cones inside map
    this.rebuildVolumetricCones(map, profile);
    this.applyShadowQualitySettings();
  }

  private createVolumetricConeMaterial(colorHex: number, opacity: number): THREE.ShaderMaterial {
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(colorHex) },
        uOpacity: { value: opacity },
        uTime: { value: 0 },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        varying vec3 vNormalView;
        varying vec3 vViewPos;
        void main() {
          vUv = uv;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vViewPos = -mvPos.xyz;
          vNormalView = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        uniform float uOpacity;
        uniform float uTime;
        varying vec2 vUv;
        varying vec3 vNormalView;
        varying vec3 vViewPos;
        void main() {
          vec3 V = normalize(vViewPos);
          // Soft Fresnel edge fade so cone silhouette never looks polygonal
          float fresnel = pow(abs(dot(vNormalView, V)), 1.85);
          // Vertical longitudinal fade (strong near source, dissolves toward floor)
          float vertFade = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.18, vUv.y);
          // Gentle animated drifting atmospheric dust bands
          float shimmer = 0.86 + 0.14 * sin(vUv.y * 10.0 - uTime * 0.9 + vUv.x * 6.2831);
          float alpha = fresnel * vertFade * uOpacity * shimmer;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
      blending: THREE.AdditiveBlending,
    });
    this.volumetricMaterials.push(mat);
    return mat;
  }

  private rebuildVolumetricCones(map: BuiltMap, profile: MapLightingProfile): void {
    // Dispose old cones
    for (let i = 0; i < this.volumetricGroup.children.length; i++) {
      const m = this.volumetricGroup.children[i] as THREE.Mesh;
      m.geometry?.dispose();
    }
    this.volumetricGroup.clear();
    for (let i = 0; i < this.volumetricMaterials.length; i++) {
      this.volumetricMaterials[i].dispose();
    }
    this.volumetricMaterials = [];

    // 1. Place subtle dust-cone beams beneath key map PointLights (capped at 8 for perf)
    let lampCones = 0;
    map.group.traverse((obj) => {
      if (lampCones >= 8) return;
      if ((obj as THREE.PointLight).isPointLight) {
        const pt = obj as THREE.PointLight;
        const worldPos = new THREE.Vector3();
        pt.getWorldPosition(worldPos);
        const coneH = Math.min(5.2, Math.max(2.6, worldPos.y + 0.2));
        const topR = 0.24;
        const botR = 1.65;
        const geo = new THREE.CylinderGeometry(topR, botR, coneH, 16, 1, true);
        const mat = this.createVolumetricConeMaterial(pt.color.getHex(), profile.hasIndoorFluorescents ? 0.11 : 0.1);
        const cone = new THREE.Mesh(geo, mat);
        cone.position.set(worldPos.x, worldPos.y - coneH * 0.5 + 0.1, worldPos.z);
        cone.userData.excludeFromAO = true;
        this.volumetricGroup.add(cone);
        lampCones++;
      }
    });

    // 2. Place slanted directional sunbeam shafts over bombsites & mid landmarks
    const sunDir = map.sunPos.clone().normalize();
    const beamSpots: THREE.Vector3[] = [];
    for (const site of map.bombsites) {
      beamSpots.push(new THREE.Vector3(site.x, site.y, site.z));
    }
    const midCallout = map.callouts?.find((c) => c.zone === 'MID');
    if (midCallout) {
      beamSpots.push(new THREE.Vector3(midCallout.x, midCallout.y, midCallout.z));
    }

    const up = new THREE.Vector3(0, 1, 0);
    const beamQuat = new THREE.Quaternion().setFromUnitVectors(up, sunDir);
    const beamLen = 18;

    for (let i = 0; i < Math.min(3, beamSpots.length); i++) {
      const spot = beamSpots[i];
      const geo = new THREE.CylinderGeometry(1.4, 3.6, beamLen, 18, 1, true);
      const mat = this.createVolumetricConeMaterial(profile.volumetricTint, profile.volumetricOpacity);
      const beam = new THREE.Mesh(geo, mat);
      beam.quaternion.copy(beamQuat);
      beam.position.copy(spot).addScaledVector(sunDir, beamLen * 0.44);
      beam.userData.excludeFromAO = true;
      this.volumetricGroup.add(beam);
    }
  }

  public applySettings(): void {
    this.applyShadowQualitySettings();
    this.rebuildPostProcessing();
    this.applyMapAtmosphereScaleOnly();
  }

  private applyMapAtmosphereScaleOnly(): void {
    const quality = settingsManager.get().graphicsQuality;
    const useDualCascade = !this.isSoftwareGl && quality === 'high';
    const totalSun = this.nearSunLight.intensity + this.farSunLight.intensity;
    if (useDualCascade) {
      this.nearSunLight.intensity = totalSun * 0.66;
      this.farSunLight.intensity = totalSun * 0.34;
    } else {
      this.nearSunLight.intensity = totalSun;
      this.farSunLight.intensity = 0;
    }
  }

  private applyShadowQualitySettings(): void {
    const quality = settingsManager.get().graphicsQuality;
    const shadowsEnabled = !this.isSoftwareGl && quality !== 'low';
    this.renderer.shadowMap.enabled = shadowsEnabled;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.nearSunLight.castShadow = shadowsEnabled;
    const nearSize = quality === 'high' ? 2048 : 1024;
    const nearD = quality === 'high' ? 26 : 34;

    if (this.nearSunLight.shadow.mapSize.width !== nearSize) {
      this.nearSunLight.shadow.mapSize.set(nearSize, nearSize);
      this.nearSunLight.shadow.map?.dispose();
      this.nearSunLight.shadow.map = null;
    }
    this.nearSunLight.shadow.camera.left = -nearD;
    this.nearSunLight.shadow.camera.right = nearD;
    this.nearSunLight.shadow.camera.top = nearD;
    this.nearSunLight.shadow.camera.bottom = -nearD;
    this.nearSunLight.shadow.camera.updateProjectionMatrix();

    // Far macro shadow cascade only on High quality
    const enableFar = shadowsEnabled && quality === 'high';
    this.farSunLight.castShadow = enableFar;
    if (!enableFar && this.farSunLight.shadow.map) {
      this.farSunLight.shadow.map.dispose();
      this.farSunLight.shadow.map = null;
    }
  }

  public rebuildPostProcessing(): void {
    this.composer?.dispose();
    this.gtaoPass?.dispose();
    this.fallbackDepthTarget?.dispose();
    this.composer = null;
    this.gtaoPass = null;
    this.scatteringPass = null;
    this.bloomPass = null;
    this.fallbackDepthTarget = null;

    const s = settingsManager.get();
    if (this.isSoftwareGl || s.graphicsQuality === 'low') {
      return;
    }

    const w = Math.max(1, this.container.clientWidth || window.innerWidth);
    const h = Math.max(1, this.container.clientHeight || window.innerHeight);
    const pixelRatio = Math.min(window.devicePixelRatio, 2) * s.resolutionScale;

    const rt = new THREE.WebGLRenderTarget(w, h, {
      type: THREE.HalfFloatType,
      samples: 4,
    });

    const composer = new EffectComposer(this.renderer, rt);
    composer.setPixelRatio(pixelRatio);
    composer.setSize(w, h);

    composer.addPass(new RenderPass(this.scene, this.camera));

    // Ground-Truth Ambient Occlusion (GTAOPass) on High quality
    const gtao = new TacticalGTAOPass(this.scene, this.camera, w, h);
    gtao.output = GTAOPass.OUTPUT.Default;
    gtao.blendIntensity = 0.72;
    gtao.updateGtaoMaterial({
      radius: 0.78,
      distanceExponent: 1.6,
      thickness: 0.62,
      distanceFallOff: 0.9,
      scale: 1.15,
      samples: 12,
    });
    gtao.updatePdMaterial({
      lumaPhi: 8.5,
      depthPhi: 2.2,
      normalPhi: 3.2,
      radius: 5.5,
      rings: 2,
      samples: 12,
    });
    gtao.enabled = s.graphicsQuality === 'high';
    composer.addPass(gtao);
    this.gtaoPass = gtao;

    // Fallback half-res depth target for AtmosphericScatteringPass when GTAO is disabled
    const depthW = Math.max(1, Math.floor(w * 0.5));
    const depthH = Math.max(1, Math.floor(h * 0.5));
    const depthTex = new THREE.DepthTexture(depthW, depthH);
    depthTex.format = THREE.DepthStencilFormat;
    depthTex.type = THREE.UnsignedInt248Type;
    this.fallbackDepthTarget = new THREE.WebGLRenderTarget(depthW, depthH, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthTexture: depthTex,
    });

    // Atmospheric Light Scattering (Mie aerial perspective + occluded sun shafts)
    const scattering = new ShaderPass(AtmosphericScatteringShader);
    scattering.uniforms.tDepth.value = gtao.depthTexture;
    scattering.uniforms.uSamples.value = s.graphicsQuality === 'high' ? 20 : 14;
    const p = this.currentProfile;
    (scattering.uniforms.uScatterColor.value as THREE.Color).setHex(p.scatterColor);
    (scattering.uniforms.uShaftColor.value as THREE.Color).setHex(p.shaftColor);
    scattering.uniforms.uMieStrength.value = p.mieStrength;
    scattering.uniforms.uRayleighStrength.value = p.rayleighStrength;
    scattering.uniforms.uShaftStrength.value = p.shaftStrength;
    scattering.uniforms.uScatterDensity.value = p.scatterDensity;
    composer.addPass(scattering);
    this.scatteringPass = scattering;

    // Calibrated linear-space HDR bloom
    const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.24, 0.46, 0.92);
    composer.addPass(bloom);
    this.bloomPass = bloom;

    composer.addPass(new OutputPass());
    this.composer = composer;
  }

  public resize(width: number, height: number): void {
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    this.composer?.setSize(w, h);
    if (this.fallbackDepthTarget) {
      this.fallbackDepthTarget.setSize(Math.max(1, Math.floor(w * 0.5)), Math.max(1, Math.floor(h * 0.5)));
    }
  }

  /**
   * Updates texel-snapped dual shadow cascades, sun corona orientation,
   * C4 tactical beacon pulse, volumetric cone shimmer, and scattering uniforms.
   */
  public update(
    elapsed: number,
    focusX: number,
    focusY: number,
    focusZ: number,
    plantedC4Pos: THREE.Vector3 | null,
    bombTimer: number
  ): void {
    // 1. Update Sun Corona billboard anchored relative to active camera
    this._sunDir.copy(this.sunOffset).normalize();
    this.sunCoronaGroup.position.copy(this.camera.position);
    this.sunCoronaMesh.position.copy(this._sunDir).multiplyScalar(242);
    this.sunCoronaMesh.lookAt(this.camera.position);

    // 2. Animate volumetric dust-beam shimmer
    for (let i = 0; i < this.volumetricMaterials.length; i++) {
      this.volumetricMaterials[i].uniforms.uTime.value = elapsed;
    }

    // 3. Dynamic planted C4 red tactical light pulse
    if (plantedC4Pos) {
      const rate = bombTimer < 10 ? 14 : 4;
      const pulse = Math.max(0, Math.sin(elapsed * rate));
      this.c4BeaconLight.position.set(plantedC4Pos.x, plantedC4Pos.y + 0.32, plantedC4Pos.z);
      this.c4BeaconLight.intensity = pulse > 0.15 ? 2.6 * pulse : 0;
    } else {
      this.c4BeaconLight.intensity = 0;
    }

    // 4. Light-space texel snapping on Near & Far shadow frustums (eliminates shadow swimming)
    if (this.nearSunLight.castShadow) {
      const nearD = this.nearSunLight.shadow.camera.right;
      const mapSize = this.nearSunLight.shadow.mapSize.width;
      const texelSize = (nearD * 2) / Math.max(1, mapSize);

      this._lightTargetPos.set(focusX, Math.max(0, focusY), focusZ);
      this._lightRight.crossVectors(this._worldUp, this._sunDir).normalize();
      this._lightUp.crossVectors(this._sunDir, this._lightRight).normalize();

      const rx = Math.round(this._lightTargetPos.dot(this._lightRight) / texelSize) * texelSize;
      const uy = Math.round(this._lightTargetPos.dot(this._lightUp) / texelSize) * texelSize;
      const dz = this._lightTargetPos.dot(this._sunDir);

      this._lightSpacePos
        .set(0, 0, 0)
        .addScaledVector(this._lightRight, rx)
        .addScaledVector(this._lightUp, uy)
        .addScaledVector(this._sunDir, dz);

      this.nearSunLight.target.position.copy(this._lightSpacePos);
      this.nearSunLight.position.copy(this._lightSpacePos).addScaledVector(this._sunDir, 95);
    }

    if (this.farSunLight.castShadow) {
      const gx = Math.round(focusX / 4) * 4;
      const gz = Math.round(focusZ / 4) * 4;
      this.farSunLight.target.position.set(gx, 0, gz);
      this.farSunLight.position.set(gx + this.sunOffset.x, this.sunOffset.y, gz + this.sunOffset.z);
    }

    // 5. Update Atmospheric Scattering Pass uniforms
    if (this.scatteringPass) {
      this.camera.updateMatrixWorld();
      this.scatteringPass.uniforms.uInvProjection.value.copy(this.camera.projectionMatrixInverse);
      this.scatteringPass.uniforms.uTime.value = elapsed;

      // Sun direction in view-space
      this._lightSpacePos.copy(this._sunDir).transformDirection(this.camera.matrixWorldInverse).normalize();
      (this.scatteringPass.uniforms.uSunViewDir.value as THREE.Vector3).copy(this._lightSpacePos);

      // Project distant sun point to screen space
      this._sunWorldPos.copy(this.camera.position).addScaledVector(this._sunDir, 240);
      this._sunClip.set(this._sunWorldPos.x, this._sunWorldPos.y, this._sunWorldPos.z, 1.0);
      this._sunClip.applyMatrix4(this.camera.matrixWorldInverse);
      this._sunClip.applyMatrix4(this.camera.projectionMatrix);

      this.camera.getWorldDirection(this._camFwd);
      const sunDot = this._camFwd.dot(this._sunDir);
      // Smoothly fade sun shafts out when looking away from sun (>98 degrees)
      const visibility = THREE.MathUtils.smoothstep(sunDot, -0.15, 0.35);

      if (this._sunClip.w > 0.001) {
        const ndcX = this._sunClip.x / this._sunClip.w;
        const ndcY = this._sunClip.y / this._sunClip.w;
        (this.scatteringPass.uniforms.uSunScreenPos.value as THREE.Vector2).set(
          ndcX * 0.5 + 0.5,
          ndcY * 0.5 + 0.5
        );
        // Also softly attenuate if sun is wildly off-screen
        const offScreenDist = Math.max(0, Math.hypot(ndcX, ndcY) - 1.1);
        this.scatteringPass.uniforms.uSunVisible.value = visibility * Math.max(0, 1 - offScreenDist * 0.55);
      } else {
        this.scatteringPass.uniforms.uSunVisible.value = 0;
      }
    }
  }

  private renderFallbackDepth(): void {
    if (!this.fallbackDepthTarget) return;
    const hidden = this._hiddenForDepth;
    hidden.length = 0;

    this.scene.traverse((obj: THREE.Object3D) => {
      if (!obj.visible) return;
      if (obj.userData?.excludeFromAO || obj.userData?.isSkyDome || (obj as THREE.Sprite).isSprite || (obj as THREE.Points).isPoints || (obj as THREE.Line).isLine) {
        obj.visible = false;
        hidden.push(obj);
        return;
      }
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        const mat = mesh.material;
        if (!Array.isArray(mat) && mat) {
          if ((mat.transparent && mat.depthWrite === false) || (mat.side === THREE.BackSide && mesh.geometry?.boundingSphere && mesh.geometry.boundingSphere.radius > 160)) {
            obj.visible = false;
            hidden.push(obj);
          }
        }
      }
    });

    const prevTarget = this.renderer.getRenderTarget();
    const prevOverride = this.scene.overrideMaterial;
    const prevAutoClear = this.renderer.autoClear;

    this.renderer.setRenderTarget(this.fallbackDepthTarget);
    this.renderer.autoClear = true;
    this.renderer.clear();
    this.scene.overrideMaterial = this.depthOverrideMat;
    this.renderer.render(this.scene, this.camera);
    this.scene.overrideMaterial = prevOverride;
    this.renderer.autoClear = prevAutoClear;
    this.renderer.setRenderTarget(prevTarget);

    for (let i = 0; i < hidden.length; i++) {
      hidden[i].visible = true;
    }
    hidden.length = 0;
  }

  public render(dt: number, zoomLevel: number): void {
    if (!this.composer) {
      this.renderer.render(this.scene, this.camera);
      return;
    }

    const quality = settingsManager.get().graphicsQuality;
    const wantGtao = quality === 'high' && zoomLevel === 0;

    if (this.gtaoPass) {
      this.gtaoPass.enabled = wantGtao;
    }

    if (this.scatteringPass) {
      if (wantGtao && this.gtaoPass) {
        this.scatteringPass.uniforms.tDepth.value = this.gtaoPass.depthTexture;
        this.scatteringPass.enabled = true;
      } else if (this.fallbackDepthTarget) {
        this.renderFallbackDepth();
        this.scatteringPass.uniforms.tDepth.value = this.fallbackDepthTarget.depthTexture;
        this.scatteringPass.enabled = zoomLevel === 0;
      }
    }

    if (this.bloomPass) {
      this.bloomPass.strength = zoomLevel > 0 ? 0.16 : 0.24;
    }

    this.composer.render(dt);
  }

  public dispose(): void {
    this.composer?.dispose();
    if (this.gtaoPass) {
      this.gtaoPass.gtaoMaterial?.dispose();
      this.gtaoPass.blendMaterial?.dispose();
      this.gtaoPass.dispose();
    }
    this.fallbackDepthTarget?.dispose();
    this.depthOverrideMat.dispose();
    this.sunCoronaMesh.geometry.dispose();
    this.sunCoronaMat.dispose();

    for (let i = 0; i < this.volumetricGroup.children.length; i++) {
      const m = this.volumetricGroup.children[i] as THREE.Mesh;
      m.geometry?.dispose();
    }
    this.volumetricGroup.clear();
    for (let i = 0; i < this.volumetricMaterials.length; i++) {
      this.volumetricMaterials[i].dispose();
    }
    this.volumetricMaterials = [];

    this.envCache.forEach((rt) => rt.dispose());
    this.envCache.clear();
    this.scene.environment = null;
  }
}
