import * as THREE from 'three';
import { audioManager } from './AudioManager';
import {
  BotContext,
  CombatTarget,
  createBot,
  equipBotWeaponForRound,
  notifyBotsOfGunfire,
  triggerBotHitReaction,
  updateBotAI,
} from './BotAI';
import { animateCharacterPose, buildCharacterRig, CharacterRig } from './CharacterModels';
import { ParticleEffects } from './effects/ParticleEffects';
import { HealthSystem } from './HealthSystem';
import { InventorySystem } from './InventorySystem';
import { CinematicLightingSystem } from './lighting/CinematicLightingSystem';
import { BuiltMap, mapManager } from './MapManager';
import { PlayerController } from './PlayerController';
import { textures } from './ProceduralTextures';
import { RoundManager } from './RoundManager';
import { settingsManager } from './SettingsManager';
import { WeaponController } from './WeaponController';
import { WEAPON_DATABASE } from './WeaponDatabase';
import { buildWeaponModel, SHARED_WEAPON_MATERIALS } from './WeaponModels';
import {
  CharacterClassId,
  GameMode,
  HudSnapshot,
  KillFeedEntry,
  MapId,
  RadarBlip,
  RadioEntry,
  ScoreboardRow,
  Team,
  WeaponId,
  WeaponSlot,
} from './types';

interface TracerEffect {
  line: THREE.Line;
  life: number;
}

interface ImpactParticle {
  mesh: THREE.Mesh;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
}

interface ThrownGrenade {
  type: 'hegrenade' | 'flashbang' | 'smokegrenade';
  mesh: THREE.Group;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  fuse: number;
  ownerName: string;
  ownerTeam: 'T' | 'CT';
}

interface DroppedWeapon {
  id: string;
  weaponId: WeaponId;
  ammoInMag: number;
  ammoReserve: number;
  silenced: boolean;
  mesh: THREE.Group;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  pickupCooldown: number;
}

interface MenuSoldier {
  rig: CharacterRig;
  team: 'T' | 'CT';
  basePos: THREE.Vector3;
  yaw: number;
  shootTimer: number;
  recoil: number;
  crouch: boolean;
}

const MENU_SHOWCASE_ORDER: MapId[] = [
  'de_dust2',
  'de_inferno',
  'de_nuke',
  'de_train',
  'de_aztec',
  'de_dust',
  'de_cbble',
  'de_mirage',
  'cs_office',
  'cs_assault',
  'cs_italy',
  'cs_militia',
];

export class GameEngine {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl = false;

  private frameId = 0;
  private lastTime = performance.now();
  private disposed = false;

  private engineMode: 'MENU_BATTLE' | 'MATCH' = 'MENU_BATTLE';

  // Menu battle scene state
  private menuGroup = new THREE.Group();
  private menuSoldiers: MenuSoldier[] = [];
  private menuExplosionTimer = 3.2;
  private menuMapIndex = 0;
  private menuCycleTimer = 9.5;
  private menuMuzzleLight = new THREE.PointLight(0xffb454, 0, 12, 2);
  private menuMuzzleTimer = 0;

  // Ambient environmental particles (dust motes, snow, jungle mist, industrial sparks)
  private ambientParticles: THREE.Points | null = null;
  private ambientParticleMode: 'dust' | 'snow' | 'mist' | 'sparks' = 'dust';
  private ambientBounds = { minX: -35, maxX: 35, minZ: -35, maxZ: 35 };

  // First-person muzzle flash illumination
  private playerMuzzleLight = new THREE.PointLight(0xffba5c, 0, 10, 2);
  private playerMuzzleTimer = 0;

  // Match state
  private currentMap: BuiltMap | null = null;
  private playerController = new PlayerController();
  private weaponController = new WeaponController();
  private playerHealth = new HealthSystem();
  private inventory = new InventorySystem();
  private roundManager = new RoundManager();

  private playerTeam: 'T' | 'CT' = 'CT';
  private playerClass: CharacterClassId = 'classic_ct';
  private playerKills = 0;
  private playerDeaths = 0;
  private playerRespawnTimer = 0;
  private multiKillCount = 0;
  private multiKillTimer = 0;
  private roundFirstBloodClaimed = false;

  private bots: BotContext[] = [];
  private tracers: TracerEffect[] = [];
  private particles: ImpactParticle[] = [];
  private bulletDecals: THREE.Mesh[] = [];
  private bulletDecalGeo = new THREE.PlaneGeometry(0.18, 0.18);
  private bulletDecalMat: THREE.MeshStandardMaterial | null = null;
  private bloodDecals: THREE.Mesh[] = [];
  private bloodPools: { mesh: THREE.Mesh; age: number }[] = [];
  private bloodSplatterGeo = new THREE.PlaneGeometry(0.85, 0.85);
  private bloodPoolGeo = new THREE.PlaneGeometry(1.4, 1.4);
  private bloodSplatterMats: THREE.MeshStandardMaterial[] = [];
  private bloodPoolMat: THREE.MeshStandardMaterial | null = null;
  private bloodDropGeo = new THREE.SphereGeometry(0.036, 5, 4);
  private bloodDropMats: THREE.MeshBasicMaterial[] = [];
  private particleEffects: ParticleEffects;
  private lightingSystem: CinematicLightingSystem;
  private thrownGrenades: ThrownGrenade[] = [];
  private droppedWeapons: DroppedWeapon[] = [];
  private plantedC4Mesh: THREE.Group | null = null;
  private plantedC4Pos: THREE.Vector3 | null = null;

  private killFeed: KillFeedEntry[] = [];
  private radioLog: RadioEntry[] = [];
  private weaponSelectTimer = 0;
  private currentTargetId: HudSnapshot['targetId'] = null;
  private lastRadioSpotTime = 0;
  private plantProgress = 0;
  private defuseProgress = 0;
  private hitMarkerTimer = 0;
  private damageIndicatorTimer = 0;
  private bloodOverlayAlpha = 0;
  private flashAlpha = 0;
  private smokeOverlayAlpha = 0;

  // Death cam & CS 1.6 post-death spectator view state
  private isSpectatorMode = false;
  private spectatorMode: 'DEATH_CAM' | 'UPPER_OVERVIEW' | 'CHASE_CAM' | 'FIRST_PERSON' = 'DEATH_CAM';
  private spectatorTargetIndex = 0;
  private deathCamProgress = 0;
  private deathCamStartPos = new THREE.Vector3();
  private deathCamYaw = 0;
  private deathCamPitch = 0;
  private killedByPos: THREE.Vector3 | null = null;
  private killedByName: string | null = null;
  private killedByWeapon: string | null = null;
  private overviewOffset = new THREE.Vector3();
  private overviewHeight = 32;
  private overviewYaw = 0.35;

  private keys: Record<string, boolean> = {};
  private mouseDownLeft = false;
  private isPointerLocked = false;
  private buyMenuOpen = false;
  private pauseMenuOpen = false;

  private fpsAccum = 0;
  private fpsFrames = 0;
  private currentFps = 60;
  private hudEmitAccum = 0;

  private onHudUpdate: (snap: HudSnapshot) => void;
  private onToggleBuyMenu: () => void;
  private onPauseChange: (paused: boolean) => void;
  private onMenuMapChange?: (mapId: MapId) => void;

  // Reusable math helpers (zero GC allocations inside tick)
  private readonly _raycaster = new THREE.Raycaster();
  private readonly _rayDir = new THREE.Vector3();
  private readonly _eyePos = new THREE.Vector3();
  private readonly _tmpMuzzle = new THREE.Vector3();
  private readonly _tmpEject = new THREE.Vector3();
  private readonly _tmpRight = new THREE.Vector3();
  private readonly _tmpUp = new THREE.Vector3();
  private readonly _tmpTarget = new THREE.Vector3();
  private readonly _camUp = new THREE.Vector3(0, 1, 0);
  private readonly _tmpToBot = new THREE.Vector3();
  private readonly _tmpFwd = new THREE.Vector3();
  private readonly _tmpThrowDir = new THREE.Vector3();

  constructor(
    container: HTMLElement,
    callbacks: {
      onHudUpdate: (snap: HudSnapshot) => void;
      onToggleBuyMenu: () => void;
      onPauseChange: (paused: boolean) => void;
      onMenuMapChange?: (mapId: MapId) => void;
    }
  ) {
    this.container = container;
    this.onHudUpdate = callbacks.onHudUpdate;
    this.onToggleBuyMenu = callbacks.onToggleBuyMenu;
    this.onPauseChange = callbacks.onPauseChange;
    this.onMenuMapChange = callbacks.onMenuMapChange;

    // Software WebGL detection per Three.js skill specification
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2) * settingsManager.get().resolutionScale
    );
    this.renderer.setSize(container.clientWidth || window.innerWidth, container.clientHeight || window.innerHeight);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl && settingsManager.get().graphicsQuality !== 'low';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    textures.setMaxAnisotropy(this.renderer.capabilities.getMaxAnisotropy());

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      settingsManager.get().fov,
      (container.clientWidth || window.innerWidth) / (container.clientHeight || window.innerHeight),
      0.08,
      520
    );
    this.scene.add(this.camera);

    // Dynamic muzzle flash point lights
    this.playerMuzzleLight.position.set(0.24, -0.14, -0.75);
    this.camera.add(this.playerMuzzleLight);
    this.scene.add(this.menuMuzzleLight);

    // Attach first-person weapon view to camera
    this.camera.add(this.weaponController.viewRoot);
    this.weaponController.viewRoot.visible = false;

    this.particleEffects = new ParticleEffects(this.scene);
    this.lightingSystem = new CinematicLightingSystem(
      this.renderer,
      this.scene,
      this.camera,
      this.container,
      this.isSoftwareGl
    );

    this.bindEvents();
    this.startMenuBattleScene();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.lastTime = performance.now();
    this.tick();
  }

  private bindEvents(): void {
    window.addEventListener('resize', this.onResize);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('wheel', this.onWheel, { passive: true });
    window.addEventListener('contextmenu', this.onContextMenu);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('contextmenu', this.onContextMenu);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    audioManager.stopAmbientWind();
    audioManager.stopMenuMusic();
    audioManager.stopAllVoices();
    this.clearMatchEntities();
    this.scene.remove(this.menuGroup);
    this.disposeObject3D(this.menuGroup);
    this.menuSoldiers = [];
    if (this.currentMap) {
      this.scene.remove(this.currentMap.group);
      this.disposeObject3D(this.currentMap.group);
      this.currentMap = null;
    }
    if (this.ambientParticles) {
      this.scene.remove(this.ambientParticles);
      this.ambientParticles.geometry.dispose();
      (this.ambientParticles.material as THREE.Material).dispose();
      this.ambientParticles = null;
    }
    this.bulletDecalGeo.dispose();
    this.bulletDecalMat?.dispose();
    this.bloodSplatterGeo.dispose();
    this.bloodPoolGeo.dispose();
    this.bloodSplatterMats.forEach((m) => m.dispose());
    this.bloodSplatterMats = [];
    this.bloodPoolMat?.dispose();
    this.bloodDropGeo.dispose();
    this.bloodDropMats.forEach((m) => m.dispose());
    this.bloodDropMats = [];
    this.particleEffects.dispose();
    this.lightingSystem.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  /**
   * Disposes geometries and materials on dynamic scene subtrees while preserving
   * globally cached textures and shared weapon PBR materials.
   */
  private disposeObject3D(root: THREE.Object3D): void {
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (
        mesh.geometry &&
        mesh.geometry !== this.bulletDecalGeo &&
        mesh.geometry !== this.bloodSplatterGeo &&
        mesh.geometry !== this.bloodPoolGeo &&
        mesh.geometry !== this.bloodDropGeo
      ) {
        mesh.geometry.dispose();
      }
      const mat = (obj as { material?: THREE.Material | THREE.Material[] }).material;
      if (Array.isArray(mat)) {
        for (const m of mat) {
          if (m !== this.bulletDecalMat && m !== this.bloodPoolMat && !SHARED_WEAPON_MATERIALS.has(m)) {
            m.dispose();
          }
        }
      } else if (mat && mat !== this.bulletDecalMat && mat !== this.bloodPoolMat && !SHARED_WEAPON_MATERIALS.has(mat)) {
        mat.dispose();
      }
    });
  }

  public applySettings(): void {
    const s = settingsManager.get();
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2) * s.resolutionScale
    );
    if (this.weaponController.zoomLevel === 0) {
      this.camera.fov = s.fov;
      this.camera.updateProjectionMatrix();
    }
    this.lightingSystem.applySettings();
  }

  public setUiOverlayState(buyOpen: boolean, paused: boolean): void {
    this.buyMenuOpen = buyOpen;
    this.pauseMenuOpen = paused;
    if (buyOpen || paused) {
      this.mouseDownLeft = false;
      this.keys = {};
      if (document.pointerLockElement === this.renderer.domElement) {
        document.exitPointerLock();
      }
    }
  }

  public requestPointerLock(): void {
    if (this.engineMode !== 'MATCH') return;
    audioManager.unlock();
    this.renderer.domElement.requestPointerLock?.();
  }

  public setMenuShowcaseMap(mapId: MapId): void {
    const idx = MENU_SHOWCASE_ORDER.indexOf(mapId);
    if (idx !== -1) {
      this.menuMapIndex = idx;
    }
    this.startMenuBattleScene(mapId);
    this.menuCycleTimer = 11.5;
  }

  public cycleMenuShowcaseMap(delta: number): void {
    this.menuMapIndex =
      (this.menuMapIndex + delta + MENU_SHOWCASE_ORDER.length) % MENU_SHOWCASE_ORDER.length;
    this.startMenuBattleScene(MENU_SHOWCASE_ORDER[this.menuMapIndex]);
    this.menuCycleTimer = 11.5;
  }

  public startMenuBattleScene(mapId?: MapId): void {
    this.engineMode = 'MENU_BATTLE';
    audioManager.stopAmbientWind();
    audioManager.stopAllVoices();
    this.weaponController.viewRoot.visible = false;
    this.playerMuzzleLight.intensity = 0;
    this.clearMatchEntities();

    if (mapId) {
      const idx = MENU_SHOWCASE_ORDER.indexOf(mapId);
      if (idx !== -1) this.menuMapIndex = idx;
    }
    const targetMapId = MENU_SHOWCASE_ORDER[this.menuMapIndex];

    if (this.currentMap) {
      this.scene.remove(this.currentMap.group);
      this.disposeObject3D(this.currentMap.group);
      this.currentMap = null;
    }

    const enableShadows = !this.isSoftwareGl && settingsManager.get().graphicsQuality !== 'low';
    const map = mapManager.buildMap(targetMapId, enableShadows);
    this.currentMap = map;
    this.scene.add(map.group);
    this.applyMapAtmosphere(map);
    this.spawnAmbientParticles(map);

    this.scene.remove(this.menuGroup);
    this.disposeObject3D(this.menuGroup);
    this.menuGroup = new THREE.Group();
    this.menuSoldiers = [];
    this.menuCycleTimer = 9.5;
    this.menuMuzzleLight.intensity = 0;

    const showcase = map.menuShowcase;

    showcase.tSpots.forEach((s, idx) => {
      const rig = buildCharacterRig(s.cls, s.w, enableShadows);
      rig.root.position.set(...s.pos);
      rig.root.rotation.y = s.yaw;
      this.menuGroup.add(rig.root);
      this.menuSoldiers.push({
        rig,
        team: 'T',
        basePos: new THREE.Vector3(...s.pos),
        yaw: s.yaw,
        shootTimer: 0.35 + idx * 0.42,
        recoil: 0,
        crouch: s.crouch,
      });
    });

    showcase.ctSpots.forEach((s, idx) => {
      const rig = buildCharacterRig(s.cls, s.w, enableShadows);
      rig.root.position.set(...s.pos);
      rig.root.rotation.y = s.yaw;
      this.menuGroup.add(rig.root);
      this.menuSoldiers.push({
        rig,
        team: 'CT',
        basePos: new THREE.Vector3(...s.pos),
        yaw: s.yaw,
        shootTimer: 0.25 + idx * 0.48,
        recoil: 0,
        crouch: s.crouch,
      });
    });

    if (showcase.smokePos) {
      this.spawnSmokeCloud(showcase.smokePos, 9999);
    }
    this.scene.add(this.menuGroup);

    this.camera.fov = 56;
    this.camera.updateProjectionMatrix();
    this.camera.position.set(
      showcase.camCenter.x,
      showcase.camHeight,
      showcase.camCenter.z + showcase.camOrbitRadius * 0.35
    );
    this.camera.lookAt(showcase.lookAt);

    this.onMenuMapChange?.(targetMapId);
  }

  public startMatch(config: {
    mapId: MapId;
    mode: GameMode;
    team: Team;
    classId: CharacterClassId;
  }): void {
    audioManager.stopMenuMusic();
    audioManager.unlock();
    this.engineMode = 'MATCH';
    this.menuMuzzleLight.intensity = 0;
    this.scene.remove(this.menuGroup);
    this.disposeObject3D(this.menuGroup);
    this.menuGroup = new THREE.Group();
    this.menuSoldiers = [];
    this.clearMatchEntities();

    if (this.currentMap) {
      this.scene.remove(this.currentMap.group);
      this.disposeObject3D(this.currentMap.group);
      this.currentMap = null;
    }
    this.currentMap = mapManager.buildMap(config.mapId, !this.isSoftwareGl && settingsManager.get().graphicsQuality !== 'low');
    this.scene.add(this.currentMap.group);
    this.applyMapAtmosphere(this.currentMap);
    this.spawnAmbientParticles(this.currentMap);
    audioManager.startAmbientWind(config.mapId === 'cs_office' || config.mapId === 'cs_assault');

    this.playerTeam = config.team === 'SPECTATOR' ? 'CT' : config.team;
    const isSpectator = config.team === 'SPECTATOR';
    this.isSpectatorMode = isSpectator;
    this.playerClass = config.classId;
    this.playerKills = 0;
    this.playerDeaths = 0;
    this.killFeed = [];
    this.bloodOverlayAlpha = 0;
    this.killedByName = null;
    this.killedByWeapon = null;
    this.killedByPos = null;
    this.spectatorTargetIndex = 0;
    this.spectatorMode = isSpectator ? 'UPPER_OVERVIEW' : 'DEATH_CAM';
    this.overviewOffset.set(0, 0, 0);
    this.overviewHeight = 32;

    this.weaponController.setTeam(this.playerTeam);
    this.weaponController.viewRoot.visible = !isSpectator;
    this.camera.fov = settingsManager.get().fov;
    this.camera.updateProjectionMatrix();

    // Create 9 AI bots (5v5 total with player, or 9 enemies in DM)
    const botShadows = !this.isSoftwareGl && settingsManager.get().graphicsQuality !== 'low';
    const tCount = isSpectator ? 5 : this.playerTeam === 'T' ? 4 : 5;
    const ctCount = isSpectator ? 5 : this.playerTeam === 'CT' ? 4 : 5;

    for (let i = 0; i < tCount; i++) {
      const bot = createBot(i, 'T', botShadows);
      this.bots.push(bot);
      this.scene.add(bot.rig.root);
    }
    for (let i = 0; i < ctCount; i++) {
      const bot = createBot(i, 'CT', botShadows);
      this.bots.push(bot);
      this.scene.add(bot.rig.root);
    }

    const startCash = config.mode === 'practice' || config.mode === 'tdm' || config.mode === 'dm' ? 16000 : 800;
    this.inventory.resetForNewMatch(this.playerTeam, startCash);
    this.playerHealth.reset(false);
    if (isSpectator) {
      this.playerHealth.alive = false;
    }

    this.roundManager.resetMatch(config.mode);
    this.setupRoundSpawns(true);
    this.weaponController.equip(this.inventory.getActiveWeapon());
    this.buyMenuOpen = false;
    this.pauseMenuOpen = false;
    this.emitHudSnapshot();

    if (!isSpectator) {
      setTimeout(() => this.requestPointerLock(), 80);
    }
  }

  public buyItem(weaponId: WeaponId): { ok: boolean; reason?: string } {
    if (this.engineMode !== 'MATCH') return { ok: false, reason: 'Not in match' };
    const def = WEAPON_DATABASE[weaponId];
    const isBuyMode = this.roundManager.mode === 'bomb_defusal';
    const inBuyZone = this.isPlayerInBuyZone();
    const inBuyTime = this.roundManager.buyPeriodTimer > 0;

    if (isBuyMode && (!inBuyZone || !inBuyTime)) {
      return { ok: false, reason: !inBuyTime ? 'Buy period expired' : 'Leave buy zone prohibited' };
    }
    if (def.team !== 'BOTH' && def.team !== this.playerTeam) {
      return { ok: false, reason: `Restricted to ${def.team} forces` };
    }
    if (this.inventory.money < def.price) {
      return { ok: false, reason: 'Insufficient funds' };
    }

    if (weaponId === 'kevlar') {
      this.inventory.money -= def.price;
      this.playerHealth.grantArmor(false);
      audioManager.playBuyClick();
      this.emitHudSnapshot();
      return { ok: true };
    }
    if (weaponId === 'kevlar_helmet') {
      this.inventory.money -= def.price;
      this.playerHealth.grantArmor(true);
      audioManager.playBuyClick();
      this.emitHudSnapshot();
      return { ok: true };
    }

    const bought = this.inventory.equipWeapon(weaponId, false);
    if (!bought) return { ok: false, reason: 'Cannot carry more of this item' };

    audioManager.playBuyClick();
    this.weaponSelectTimer = 2.2;
    this.weaponController.equip(this.inventory.getActiveWeapon());
    this.emitHudSnapshot();
    return { ok: true };
  }

  private applyMapAtmosphere(map: BuiltMap): void {
    this.lightingSystem.applyMapAtmosphere(map);
  }

  private getFloorYAt(x: number, z: number, curY: number): number {
    if (!this.currentMap) return 0;
    let bestY = 0;
    const cols = this.currentMap.colliders;
    for (let i = 0; i < cols.length; i++) {
      const c = cols[i];
      if (x >= c.minX && x <= c.maxX && z >= c.minZ && z <= c.maxZ && c.maxY <= curY + 0.45) {
        if (c.maxY > bestY) bestY = c.maxY;
      }
    }
    return bestY;
  }

  private clearMatchEntities(): void {
    this.bots.forEach((b) => {
      this.scene.remove(b.rig.root);
      this.disposeObject3D(b.rig.root);
    });
    this.bots = [];
    this.tracers.forEach((t) => {
      this.scene.remove(t.line);
      t.line.geometry.dispose();
      (t.line.material as THREE.Material).dispose();
    });
    this.tracers = [];
    this.particles.forEach((p) => this.scene.remove(p.mesh));
    this.particles = [];
    this.bulletDecals.forEach((d) => this.scene.remove(d));
    this.bulletDecals = [];
    this.bloodDecals.forEach((d) => this.scene.remove(d));
    this.bloodDecals = [];
    this.bloodPools.forEach((p) => this.scene.remove(p.mesh));
    this.bloodPools = [];
    this.thrownGrenades.forEach((g) => {
      this.scene.remove(g.mesh);
      this.disposeObject3D(g.mesh);
    });
    this.thrownGrenades = [];
    this.particleEffects.clear();
    this.droppedWeapons.forEach((d) => {
      this.scene.remove(d.mesh);
      this.disposeObject3D(d.mesh);
    });
    this.droppedWeapons = [];
    if (this.plantedC4Mesh) {
      this.scene.remove(this.plantedC4Mesh);
      this.disposeObject3D(this.plantedC4Mesh);
      this.plantedC4Mesh = null;
    }
    this.plantedC4Pos = null;
  }

  private setupRoundSpawns(firstRound = false): void {
    if (!this.currentMap) return;

    // Remove planted C4, grenades, dropped weapons, and blood pools from previous round
    if (this.plantedC4Mesh) {
      this.scene.remove(this.plantedC4Mesh);
      this.disposeObject3D(this.plantedC4Mesh);
      this.plantedC4Mesh = null;
    }
    this.plantedC4Pos = null;
    this.thrownGrenades.forEach((g) => {
      this.scene.remove(g.mesh);
      this.disposeObject3D(g.mesh);
    });
    this.thrownGrenades = [];
    this.particleEffects.clear();
    this.droppedWeapons.forEach((d) => {
      this.scene.remove(d.mesh);
      this.disposeObject3D(d.mesh);
    });
    this.droppedWeapons = [];
    this.bloodDecals.forEach((d) => this.scene.remove(d));
    this.bloodDecals = [];
    this.bloodPools.forEach((p) => this.scene.remove(p.mesh));
    this.bloodPools = [];
    this.plantProgress = 0;
    this.defuseProgress = 0;
    this.radioLog = [];
    this.lastRadioSpotTime = 0;
    this.currentTargetId = null;
    this.weaponSelectTimer = 2.2;
    this.multiKillCount = 0;
    this.multiKillTimer = 0;
    this.roundFirstBloodClaimed = false;

    // Player spawn
    const spawns = this.playerTeam === 'T' ? this.currentMap.tSpawns : this.currentMap.ctSpawns;
    const pSpawn = spawns[0] || new THREE.Vector3(0, 0, 0);
    const lookYaw = this.playerTeam === 'T' ? 0 : Math.PI;
    this.playerController.reset(pSpawn, lookYaw);
    this.bloodOverlayAlpha = 0;
    this.killedByName = null;
    this.killedByWeapon = null;
    this.killedByPos = null;

    if (this.isSpectatorMode) {
      this.playerHealth.alive = false;
      this.weaponController.viewRoot.visible = false;
      this.spectatorMode = 'UPPER_OVERVIEW';
    } else {
      if (!this.playerHealth.alive || firstRound) {
        this.playerHealth.reset(false);
        if (!firstRound) this.inventory.resetAfterDeath(this.playerTeam);
      } else {
        this.playerHealth.health = 100;
        this.playerHealth.alive = true;
      }
      this.weaponController.viewRoot.visible = true;
      this.spectatorMode = 'DEATH_CAM';
      this.camera.rotation.z = 0;
    }

    if (this.roundManager.mode === 'practice' && firstRound && !this.isSpectatorMode) {
      this.inventory.equipWeapon(this.playerTeam === 'T' ? 'ak47' : 'm4a1', true);
      this.playerHealth.grantArmor(true);
    }

    // Assign C4 to a Terrorist in Bomb Defusal
    this.inventory.hasC4 = false;
    this.bots.forEach((b) => (b.hasC4 = false));

    if (this.roundManager.mode === 'bomb_defusal') {
      const tBots = this.bots.filter((b) => b.team === 'T');
      if (!this.isSpectatorMode && this.playerTeam === 'T' && Math.random() < 0.45) {
        this.inventory.hasC4 = true;
      } else if (tBots.length > 0) {
        tBots[0].hasC4 = true;
      } else if (!this.isSpectatorMode && this.playerTeam === 'T') {
        this.inventory.hasC4 = true;
      }
    }

    // Spawn bots
    let tIdx = 1;
    let ctIdx = 1;
    this.bots.forEach((bot) => {
      const list =
        this.roundManager.mode === 'dm'
          ? this.currentMap!.dmSpawns
          : bot.team === 'T'
          ? this.currentMap!.tSpawns
          : this.currentMap!.ctSpawns;
      const idx = bot.team === 'T' ? tIdx++ : ctIdx++;
      const sp = list[idx % list.length];
      bot.position.copy(sp);
      bot.position.x += (Math.random() - 0.5) * 1.4;
      bot.position.z += (Math.random() - 0.5) * 1.4;
      bot.yaw = bot.team === 'T' ? 0 : Math.PI;
      bot.deathTimer = 0;
      bot.respawnTimer = 0;
      bot.hitFlinch = 0;
      bot.recoilKick = 0;
      bot.targetWaypointId = null;
      bot.lastWaypointId = null;
      bot.plantDefuseProgress = 0;
      bot.health.reset(bot.health.alive);
      if (firstRound) bot.money = this.roundManager.mode === 'bomb_defusal' ? 800 : 16000;
      equipBotWeaponForRound(bot);
      bot.rig.muzzleFlash.visible = false;
      bot.rig.head.visible = true;
      bot.rig.contactShadow.visible = true;
      bot.rig.root.position.copy(bot.position);
      bot.rig.root.rotation.set(0, bot.yaw, 0);
      bot.rig.root.visible = true;
    });

    this.weaponController.equip(this.inventory.getActiveWeapon());
    this.pushRadioMessage(
      'Commander',
      this.playerTeam,
      firstRound ? 'Lock and load. Go! Go! Go!' : 'Okay, let\'s move out!'
    );
    if (this.roundManager.phase !== 'FREEZETIME') {
      audioManager.playVoiceLine(firstRound ? 'lock_and_load' : 'go');
    }
  }

  private tick = (): void => {
    if (this.disposed) return;

    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.fpsAccum += dt;
    this.fpsFrames += 1;
    if (this.fpsAccum >= 0.4) {
      this.currentFps = Math.round(this.fpsFrames / this.fpsAccum);
      this.fpsAccum = 0;
      this.fpsFrames = 0;
    }

    if (this.engineMode === 'MENU_BATTLE') {
      this.updateMenuBattle(dt, now / 1000);
    } else {
      this.updateMatch(dt, now / 1000);
    }

    this.lightingSystem.render(dt, this.weaponController.zoomLevel);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private updateMenuBattle(dt: number, elapsed: number): void {
    if (!this.currentMap) return;
    const sc = this.currentMap.menuShowcase;

    // Auto-cycle showcase across all 8 CS 1.6 maps
    this.menuCycleTimer -= dt;
    if (this.menuCycleTimer <= 0) {
      this.menuMapIndex = (this.menuMapIndex + 1) % MENU_SHOWCASE_ORDER.length;
      this.startMenuBattleScene();
      return;
    }

    // Smooth cinematic camera glide framing the current map's landmark firefight
    const angle = elapsed * 0.14;
    this.camera.position.x = sc.camCenter.x + Math.sin(angle) * sc.camOrbitRadius * 0.42;
    this.camera.position.y = sc.camHeight + Math.cos(elapsed * 0.24) * 0.38;
    this.camera.position.z = sc.camCenter.z + Math.cos(angle * 0.85) * sc.camOrbitRadius * 0.34;
    this.camera.lookAt(sc.lookAt);
    this.lightingSystem.update(elapsed, sc.lookAt.x, sc.lookAt.y, sc.lookAt.z, null, 0);

    if (this.menuMuzzleTimer > 0) {
      this.menuMuzzleTimer -= dt;
      this.menuMuzzleLight.intensity = Math.max(0, (this.menuMuzzleTimer / 0.05) * 3.8);
    } else {
      this.menuMuzzleLight.intensity = 0;
    }

    const tList = this.menuSoldiers.filter((m) => m.team === 'T');
    const ctList = this.menuSoldiers.filter((m) => m.team === 'CT');

    for (let i = 0; i < this.menuSoldiers.length; i++) {
      const s = this.menuSoldiers[i];
      s.recoil = THREE.MathUtils.damp(s.recoil, 0, 12, dt);
      s.shootTimer -= dt;

      const enemies = s.team === 'T' ? ctList : tList;
      const steadyFoe = enemies.length > 0 ? enemies[i % enemies.length] : null;
      const aimX = steadyFoe ? steadyFoe.basePos.x : sc.lookAt.x;
      const aimY = steadyFoe ? steadyFoe.basePos.y + (steadyFoe.crouch ? 1.0 : 1.38) : sc.lookAt.y;
      const aimZ = steadyFoe ? steadyFoe.basePos.z : sc.lookAt.z;
      const eyeY = s.basePos.y + (s.crouch ? 1.05 : 1.42);
      const aimPitch = THREE.MathUtils.clamp(
        Math.atan2(aimY - eyeY, Math.max(1.5, Math.hypot(aimX - s.basePos.x, aimZ - s.basePos.z))),
        -0.45,
        0.45
      );

      // Subtle lateral cover peek along soldier's facing perpendicular
      const peek = Math.sin(elapsed * 1.15 + s.basePos.x + s.basePos.z) * 0.35;
      s.rig.root.position.set(
        s.basePos.x + Math.cos(s.yaw) * peek,
        s.basePos.y,
        s.basePos.z - Math.sin(s.yaw) * peek
      );
      s.rig.root.rotation.y = s.yaw;

      const fired = s.shootTimer <= 0;
      if (fired) {
        s.shootTimer = 0.28 + Math.random() * 0.62;
        s.recoil = 1.0;
      }

      animateCharacterPose(s.rig, elapsed, 0.2, s.crouch, s.recoil, false, 0, { aimPitch });

      if (fired) {
        s.rig.root.updateMatrixWorld(true);
        s.rig.muzzlePoint.getWorldPosition(this._tmpMuzzle);

        const foe = enemies.length > 0 ? enemies[Math.floor(Math.random() * enemies.length)] : null;
        if (foe) {
          this._tmpTarget.set(
            foe.basePos.x + (Math.random() - 0.5) * 2.2,
            foe.basePos.y + 0.75 + Math.random() * 0.9,
            foe.basePos.z + (Math.random() - 0.5) * 2.2
          );
        } else {
          this._tmpTarget.set(
            sc.lookAt.x + (Math.random() - 0.5) * 4,
            sc.lookAt.y,
            sc.lookAt.z + (Math.random() - 0.5) * 4
          );
        }

        this.spawnTracer(this._tmpMuzzle, this._tmpTarget, 0xffd27a);
        this.spawnImpactSparks(this._tmpTarget, 3);
        this.menuMuzzleLight.position.copy(this._tmpMuzzle);
        this.menuMuzzleTimer = 0.05;
      }
    }

    // Periodic background explosion burst near landmark
    this.menuExplosionTimer -= dt;
    if (this.menuExplosionTimer <= 0) {
      this.menuExplosionTimer = 5.0 + Math.random() * 3.0;
      const expPos = sc.lookAt
        .clone()
        .add(new THREE.Vector3((Math.random() - 0.5) * 7, -0.9, (Math.random() - 0.5) * 7));
      expPos.y = Math.max(0.25, expPos.y);
      this.particleEffects.spawnExplosion(expPos, 0.72, true);
    }

    this.updateAmbientParticles(dt, elapsed);
    this.updateEffects(dt, elapsed);
  }

  private updateMatch(dt: number, elapsed: number): void {
    if (!this.currentMap) return;

    this.hitMarkerTimer = Math.max(0, this.hitMarkerTimer - dt);
    this.damageIndicatorTimer = Math.max(0, this.damageIndicatorTimer - dt);
    this.weaponSelectTimer = Math.max(0, this.weaponSelectTimer - dt);
    this.flashAlpha = Math.max(0, this.flashAlpha - dt * 0.45);
    if (this.multiKillTimer > 0) {
      this.multiKillTimer = Math.max(0, this.multiKillTimer - dt);
      if (this.multiKillTimer === 0) {
        this.multiKillCount = 0;
      }
    }
    const nowMs = performance.now();
    if (this.radioLog.length > 0) {
      this.radioLog = this.radioLog.filter((r) => nowMs - r.timestamp < 8500);
    }
    if (this.playerHealth.alive) {
      this.bloodOverlayAlpha = Math.max(0, this.bloodOverlayAlpha - dt * 0.38);
    } else if (!this.isSpectatorMode) {
      const restBlood = this.spectatorMode === 'DEATH_CAM' ? 0.52 : 0.16;
      this.bloodOverlayAlpha = THREE.MathUtils.damp(this.bloodOverlayAlpha, restBlood, 3.2, dt);
    } else {
      this.bloodOverlayAlpha = 0;
    }

    if (this.playerMuzzleTimer > 0) {
      this.playerMuzzleTimer -= dt;
      this.playerMuzzleLight.intensity = Math.max(0, (this.playerMuzzleTimer / 0.045) * 3.4);
    } else {
      this.playerMuzzleLight.intensity = 0;
    }

    this.updateAmbientParticles(dt, elapsed);
    this.lightingSystem.update(
      elapsed,
      this.camera.position.x,
      Math.max(0, this.camera.position.y - 1.5),
      this.camera.position.z,
      this.plantedC4Pos,
      this.roundManager.bombTimer
    );

    const activeWeapon = this.inventory.getActiveWeapon();
    const def = WEAPON_DATABASE[activeWeapon.id];
    const frozen = this.roundManager.phase === 'FREEZETIME' || !this.playerHealth.alive;

    // 1. Player Movement & Viewmodel (or Post-Death / Spectator Camera)
    if (this.playerHealth.alive) {
      this.playerController.update(
        dt,
        this.keys,
        this.currentMap.colliders,
        def.moveSpeedMultiplier,
        this.currentMap.surfaceType,
        frozen || this.buyMenuOpen || this.pauseMenuOpen,
        this.camera,
        this.weaponController.recoilPitch,
        this.weaponController.recoilYaw,
        (impactSpeed) => {
          const fallDmg = Math.max(4, Math.round((impactSpeed - 12.8) * 6.5));
          const res = this.playerHealth.applyDamage(fallDmg, 0.15, false);
          this.damageIndicatorTimer = 0.35;
          this.bloodOverlayAlpha = Math.max(this.bloodOverlayAlpha, res.killed ? 1.0 : 0.45);
          if (res.killed) {
            audioManager.playDeathCue();
            this.playerDeaths += 1;
            this.playerRespawnTimer = 3.0;
            this.triggerPlayerDeath('Gravity', 'Fall Damage');
            this.handleElimination('Gravity', this.playerTeam === 'T' ? 'CT' : 'T', 'You', this.playerTeam, 'Fall', false);
          }
        }
      );

      this.weaponController.update(
        dt,
        activeWeapon,
        this.playerController.moveSpeedRatio,
        this.playerController.isCrouching,
        settingsManager.get().fov,
        this.camera,
        this.playerController.isSprinting
      );

      // Automatic fire hold
      if (this.mouseDownLeft && def.automatic && !frozen && !this.buyMenuOpen && !this.pauseMenuOpen && this.isPointerLocked) {
        this.firePlayerWeapon();
      }

      // Handle Bomb Plant / Defuse hold E
      this.handleBombInteract(dt);
    } else {
      // Deathmatch respawn timer
      if (!this.isSpectatorMode && (this.roundManager.mode === 'tdm' || this.roundManager.mode === 'dm')) {
        this.playerRespawnTimer -= dt;
        if (this.playerRespawnTimer <= 0) {
          this.respawnPlayer();
        }
      }
    }

    // 2. Bots update
    const targets: CombatTarget[] = [
      {
        id: 'player',
        team: this.playerTeam,
        position: this.playerController.position,
        alive: this.playerHealth.alive,
      },
      ...this.bots.map((b) => ({
        id: b.id,
        team: b.team,
        position: b.position,
        alive: b.health.alive,
      })),
    ];

    const isFFA = this.roundManager.mode === 'dm';
    const freezeBots = this.roundManager.phase === 'FREEZETIME' || this.roundManager.phase === 'ROUND_END';

    for (const bot of this.bots) {
      if (!bot.health.alive && (this.roundManager.mode === 'tdm' || this.roundManager.mode === 'dm')) {
        bot.respawnTimer -= dt;
        if (bot.respawnTimer <= 0) {
          const list = isFFA
            ? this.currentMap.dmSpawns
            : bot.team === 'T'
            ? this.currentMap.tSpawns
            : this.currentMap.ctSpawns;
          const sp = list[Math.floor(Math.random() * list.length)];
          bot.position.copy(sp);
          bot.health.reset(false);
          bot.deathTimer = 0;
          bot.hitFlinch = 0;
          bot.recoilKick = 0;
          equipBotWeaponForRound(bot);
          bot.rig.muzzleFlash.visible = false;
          bot.rig.head.visible = true;
          bot.rig.contactShadow.visible = true;
          bot.rig.root.position.copy(bot.position);
          bot.rig.root.rotation.set(0, bot.yaw, 0);
        }
      }

      if (!freezeBots) {
        updateBotAI(
          bot,
          dt,
          elapsed,
          settingsManager.get().botDifficulty,
          targets,
          this.currentMap.waypoints,
          this.currentMap.colliders,
          this.currentMap.raycastMeshes,
          this.plantedC4Pos,
          this.currentMap.bombsites,
          this.playerController.position,
          this.currentMap.surfaceType,
          isFFA,
          (shooter, origin, dir) => this.resolveBotShot(shooter, origin, dir),
          (planter, site) => {
            planter.hasC4 = false;
            this.spawnPlantedC4(planter.position.clone());
            this.roundManager.plantBomb(site);
            this.pushRadioMessage(planter.name, 'T', 'The bomb has been planted!');
          },
          (defuser) => {
            this.roundManager.defuseBomb((w) => this.handleRoundEndRewards(w));
            defuser.money = Math.min(16000, defuser.money + 300);
            this.pushRadioMessage(defuser.name, 'CT', 'Bomb has been defused!');
          }
        );
      } else {
        bot.rig.root.position.copy(bot.position);
        bot.rig.root.rotation.y = bot.yaw;
        animateCharacterPose(bot.rig, elapsed, 0, false, 0, !bot.health.alive, bot.deathTimer, {
          deathStyle: bot.deathStyle,
          baseY: bot.position.y,
        });
      }
    }

    // Update post-death / spectator camera after bot poses update
    if (!this.playerHealth.alive) {
      this.updateSpectatorCamera(dt);
    }

    // 3. Dropped Weapons, Crosshair Target ID, Grenades & Effects
    this.updateDroppedWeapons(dt);
    this.updateTargetIdentification();
    this.updateGrenades(dt);
    this.updateEffects(dt, elapsed);

    // Check if player is inside a smoke cloud
    let inSmoke = 0;
    for (const sc of this.particleEffects.smokeClouds) {
      const dist = sc.pos.distanceTo(this.camera.position);
      if (dist < 4.5) {
        inSmoke = Math.max(inSmoke, (1 - dist / 4.5) * 0.85);
      }
    }
    this.smokeOverlayAlpha = THREE.MathUtils.damp(this.smokeOverlayAlpha, inSmoke, 6, dt);

    // 4. Round Manager update
    const aliveT =
      (this.playerTeam === 'T' && this.playerHealth.alive ? 1 : 0) +
      this.bots.filter((b) => b.team === 'T' && b.health.alive).length;
    const aliveCT =
      (this.playerTeam === 'CT' && this.playerHealth.alive ? 1 : 0) +
      this.bots.filter((b) => b.team === 'CT' && b.health.alive).length;

    this.roundManager.update(
      dt,
      aliveT,
      aliveCT,
      (winner) => this.handleRoundEndRewards(winner),
      () => this.setupRoundSpawns(false),
      () => this.triggerC4Explosion()
    );

    // Blink planted C4 LED
    if (this.plantedC4Mesh) {
      const led = this.plantedC4Mesh.getObjectByName('c4_led') as THREE.Mesh | undefined;
      if (led) {
        const blinkRate = this.roundManager.bombTimer < 10 ? 14 : 4;
        led.visible = Math.sin(elapsed * blinkRate) > 0;
      }
    }

    // 5. Throttled HUD snapshot push (~20Hz)
    this.hudEmitAccum += dt;
    if (this.hudEmitAccum >= 0.05) {
      this.hudEmitAccum = 0;
      this.emitHudSnapshot();
    }
  }

  private handleBombInteract(dt: number): void {
    if (this.roundManager.mode !== 'bomb_defusal') return;
    const kb = settingsManager.get().keybinds;
    const holdingUse = Boolean(this.keys[kb.use]);

    if (!holdingUse) {
      this.plantProgress = 0;
      this.defuseProgress = 0;
      return;
    }

    // Terrorist planting C4
    if (this.playerTeam === 'T' && this.inventory.hasC4 && !this.roundManager.bombPlanted) {
      const site = this.getPlayerBombsite();
      if (site) {
        this.plantProgress += dt / 3.2;
        if (this.plantProgress >= 1) {
          this.plantProgress = 0;
          this.inventory.hasC4 = false;
          if (this.inventory.activeSlot === 'c4') {
            this.inventory.activeSlot = this.inventory.primary ? 'primary' : 'secondary';
            this.weaponController.equip(this.inventory.getActiveWeapon());
          }
          this.spawnPlantedC4(this.playerController.position.clone());
          this.roundManager.plantBomb(site);
          this.pushRadioMessage('You', 'T', 'The bomb has been planted!');
        }
        return;
      }
    }

    // Counter-Terrorist defusing C4
    if (this.playerTeam === 'CT' && this.roundManager.bombPlanted && this.plantedC4Pos) {
      const dist = this.playerController.position.distanceTo(this.plantedC4Pos);
      if (dist < 2.6) {
        const duration = this.inventory.hasDefuseKit ? 5.0 : 10.0;
        this.defuseProgress += dt / duration;
        if (this.defuseProgress >= 1) {
          this.defuseProgress = 0;
          this.inventory.addMoney(300);
          this.roundManager.defuseBomb((w) => this.handleRoundEndRewards(w));
          this.pushRadioMessage('You', 'CT', 'Bomb has been defused!');
        }
        return;
      }
    }

    this.plantProgress = 0;
    this.defuseProgress = 0;
  }

  private spawnPlantedC4(pos: THREE.Vector3): void {
    if (this.plantedC4Mesh) this.scene.remove(this.plantedC4Mesh);
    this.plantedC4Mesh = buildWeaponModel('c4');
    this.plantedC4Mesh.scale.setScalar(1.4);
    this.plantedC4Mesh.position.set(pos.x, pos.y + 0.05, pos.z);
    this.scene.add(this.plantedC4Mesh);
    this.plantedC4Pos = pos.clone();
  }

  private triggerC4Explosion(): void {
    if (!this.plantedC4Pos) return;
    const center = this.plantedC4Pos.clone();
    if (this.plantedC4Mesh) {
      this.scene.remove(this.plantedC4Mesh);
      this.disposeObject3D(this.plantedC4Mesh);
      this.plantedC4Mesh = null;
    }
    this.plantedC4Pos = null;
    audioManager.playExplosion(1.0);
    this.particleEffects.spawnExplosion(center, 1.85, true);

    // Damage nearby combatants
    const pDist = this.playerController.position.distanceTo(center);
    if (this.playerHealth.alive && pDist < 22) {
      const dmg = Math.round((1 - pDist / 22) * 260);
      const res = this.playerHealth.applyDamage(dmg, 0.9, false);
      this.damageIndicatorTimer = 0.45;
      this.bloodOverlayAlpha = Math.max(this.bloodOverlayAlpha, res.killed ? 1.0 : 0.72);
      if (res.killed) {
        this.playerDeaths += 1;
        this.playerRespawnTimer = 3.0;
        this.triggerPlayerDeath('C4 Explosive', 'C4', center);
      }
    }
    this.bots.forEach((b) => {
      if (!b.health.alive) return;
      const d = b.position.distanceTo(center);
      if (d < 22) {
        const res = b.health.applyDamage(Math.round((1 - d / 22) * 260), 0.9, false);
        if (res.killed) {
          b.deaths += 1;
          b.deathStyle = 0;
          this.spawnDeathBloodPool(b.position);
        }
      }
    });
  }

  private handleRoundEndRewards(winner: 'T' | 'CT' | 'DRAW'): void {
    const winBonus = 3250;
    const lossBonus = 1900;
    this.inventory.addMoney(this.playerTeam === winner ? winBonus : lossBonus);
    this.bots.forEach((b) => {
      b.money = Math.min(16000, b.money + (b.team === winner ? winBonus : lossBonus));
    });
  }

  private respawnPlayer(): void {
    if (!this.currentMap || this.isSpectatorMode) return;
    const list =
      this.roundManager.mode === 'dm'
        ? this.currentMap.dmSpawns
        : this.playerTeam === 'T'
        ? this.currentMap.tSpawns
        : this.currentMap.ctSpawns;
    const sp = list[Math.floor(Math.random() * list.length)];
    this.playerController.reset(sp, Math.random() * Math.PI * 2);
    this.playerHealth.reset(false);
    this.playerHealth.grantArmor(true);
    this.bloodOverlayAlpha = 0;
    this.killedByName = null;
    this.killedByWeapon = null;
    this.killedByPos = null;
    this.spectatorMode = 'DEATH_CAM';
    this.bots.forEach((b) => {
      b.rig.head.visible = true;
    });
    this.weaponController.viewRoot.visible = true;
    this.weaponController.equip(this.inventory.getActiveWeapon());
  }

  private firePlayerWeapon(): void {
    if (!this.playerHealth.alive || !this.currentMap) return;
    const inst = this.inventory.getActiveWeapon();
    const def = WEAPON_DATABASE[inst.id];

    // Special: Grenade throw
    if (def.slot === 'grenade') {
      if (!this.weaponController.triggerFire(inst)) return;
      this.throwGrenade(inst.id as 'hegrenade' | 'flashbang' | 'smokegrenade');
      return;
    }

    if (inst.id === 'c4') return;

    if (!this.weaponController.triggerFire(inst)) return;

    if (def.slot !== 'knife') {
      notifyBotsOfGunfire(
        this.bots,
        this.playerController.position,
        this.playerTeam,
        this.roundManager.mode === 'dm'
      );
      if (!inst.silenced) {
        this.playerMuzzleTimer = 0.045;
        this.playerMuzzleLight.intensity = 3.4;
        if (this.weaponController.zoomLevel === 0) {
          this.weaponController.getMuzzleWorldPosition(this._tmpMuzzle);
          this.particleEffects.spawnMuzzleWisp(this._tmpMuzzle);
        }
      }
      if (this.weaponController.zoomLevel === 0) {
        this.weaponController.getEjectionWorldPosition(this._tmpEject);
        this.camera.getWorldDirection(this._tmpFwd);
        this._tmpRight.crossVectors(this._tmpFwd, this._camUp).normalize();
        this._tmpUp.crossVectors(this._tmpRight, this._tmpFwd).normalize();
        this.particleEffects.spawnShellCasing(
          this._tmpEject,
          this._tmpRight,
          this._tmpUp,
          this._tmpFwd,
          this.playerController.position.y
        );
      }
    }

    // Fire pellets (1 for standard, multiple for shotgun)
    const pellets = def.pellets ?? 1;
    const spread = this.weaponController.getCurrentSpread(
      inst,
      this.playerController.moveSpeedRatio,
      this.playerController.isCrouching,
      this.playerController.onGround
    );

    const botHitMeshes: THREE.Object3D[] = [];
    for (const b of this.bots) {
      if (!b.health.alive) continue;
      if (this.roundManager.mode !== 'dm' && b.team === this.playerTeam) continue;
      botHitMeshes.push(b.rig.headMesh, ...b.rig.bodyHitMeshes);
    }

    for (let p = 0; p < pellets; p++) {
      this.camera.getWorldPosition(this._eyePos);
      this.camera.getWorldDirection(this._rayDir);

      // Apply spread
      this._rayDir.x += (Math.random() - 0.5) * spread;
      this._rayDir.y += (Math.random() - 0.5) * spread;
      this._rayDir.z += (Math.random() - 0.5) * spread;
      this._rayDir.normalize();

      this._raycaster.set(this._eyePos, this._rayDir);
      this._raycaster.far = def.range;

      const wallHits = this._raycaster.intersectObjects(this.currentMap.raycastMeshes, false);
      const wallDist = wallHits.length > 0 ? wallHits[0].distance : def.range;

      const enemyHits = this._raycaster.intersectObjects(botHitMeshes, false);
      if (def.slot !== 'knife' && this.weaponController.zoomLevel === 0) {
        this.weaponController.getMuzzleWorldPosition(this._tmpMuzzle);
      } else {
        this._tmpMuzzle.set(0.14, -0.1, 0).applyQuaternion(this.camera.quaternion).add(this._eyePos);
      }

      // Check CS 1.6 thin-cover wallbang penetration for high-caliber weapons
      let wallbangHit: THREE.Intersection | null = null;
      if (
        def.slot !== 'knife' &&
        def.armorPenetration >= 0.72 &&
        wallHits.length > 0 &&
        enemyHits.length > 0 &&
        enemyHits[0].distance > wallHits[0].distance
      ) {
        const wh = wallHits[0];
        const span = enemyHits[0].distance - wh.distance;
        if (span > 0.04 && span < 1.35) {
          this._tmpTarget.copy(this._rayDir).negate();
          this._raycaster.set(enemyHits[0].point, this._tmpTarget);
          this._raycaster.far = span;
          const backHits = this._raycaster.intersectObject(wh.object, false);
          if (backHits.length > 0) {
            const thickness = span - backHits[0].distance;
            if (thickness > 0 && thickness <= 0.92) {
              wallbangHit = enemyHits[0];
              this.spawnImpactSparks(backHits[0].point, 3);
            }
          }
        }
      }

      const activeEnemyHit =
        enemyHits.length > 0 && enemyHits[0].distance < wallDist ? enemyHits[0] : wallbangHit;

      if (activeEnemyHit) {
        const isWallbang = activeEnemyHit === wallbangHit;
        if (isWallbang && wallHits.length > 0) {
          const wh = wallHits[0];
          this.spawnImpactSparks(wh.point, 4);
          this.spawnBulletDecal(wh.point, wh.face?.normal, wh.object);
        }

        const { entityId, isHead } = activeEnemyHit.object.userData as { entityId: string; isHead: boolean };
        const victim = this.bots.find((b) => b.id === entityId);
        if (victim) {
          let finalDamage = isWallbang ? Math.round(def.damage * 0.56) : def.damage;
          if (def.slot === 'knife') {
            const victimFwdX = -Math.sin(victim.yaw);
            const victimFwdZ = -Math.cos(victim.yaw);
            const dot = this._rayDir.x * victimFwdX + this._rayDir.z * victimFwdZ;
            if (dot > 0.25) finalDamage = 55; // Backstab bonus
          }
          const res = victim.health.applyDamage(finalDamage, def.armorPenetration, isHead);
          triggerBotHitReaction(victim, isHead);
          this.hitMarkerTimer = 0.16;
          audioManager.playHitMarker(isHead);
          this.spawnBloodBurst(activeEnemyHit.point, this._rayDir, isHead ? 12 : 7, isHead);
          this.spawnWallBloodSplatter(activeEnemyHit.point, this._rayDir);

          if (res.killed) {
            audioManager.playDeathCue(victim.position);
            this.spawnDeathBloodPool(victim.position);
            this.spawnBotDroppedWeapon(victim);
            this.handleElimination(
              'You',
              this.playerTeam,
              victim.name,
              victim.team,
              isWallbang ? `${def.shortName} · WB` : def.shortName,
              isHead
            );
            victim.deaths += 1;
            victim.respawnTimer = 3.0;
            this.playerKills += 1;
            this.inventory.addMoney(300);
            if (this.roundManager.mode === 'tdm') {
              if (this.playerTeam === 'T') this.roundManager.tScore += 1;
              else this.roundManager.ctScore += 1;
            }
            this.recordPlayerKill(isHead);
          }
        }
        if (def.slot !== 'knife') {
          this.spawnTracer(this._tmpMuzzle, activeEnemyHit.point, 0xffe296);
        }
      } else if (wallHits.length > 0) {
        const wh = wallHits[0];
        this.spawnImpactSparks(wh.point, def.slot === 'knife' ? 3 : 4);
        if (def.slot !== 'knife') {
          this.spawnBulletDecal(wh.point, wh.face?.normal, wh.object);
          if (Math.random() < 0.35) audioManager.playRicochet(wh.point);
          this.spawnTracer(this._tmpMuzzle, wh.point, 0xffe296);
        }
      } else if (def.slot !== 'knife') {
        this._tmpTarget.copy(this._eyePos).addScaledVector(this._rayDir, 60);
        this.spawnTracer(this._tmpMuzzle, this._tmpTarget, 0xffe296);
      }
    }
  }

  private fireKnifeHeavyStab(): void {
    if (!this.playerHealth.alive || !this.currentMap) return;
    if (!this.weaponController.triggerKnifeStab()) return;

    const botHitMeshes: THREE.Object3D[] = [];
    for (const b of this.bots) {
      if (!b.health.alive) continue;
      if (this.roundManager.mode !== 'dm' && b.team === this.playerTeam) continue;
      botHitMeshes.push(b.rig.headMesh, ...b.rig.bodyHitMeshes);
    }

    this.camera.getWorldPosition(this._eyePos);
    this.camera.getWorldDirection(this._rayDir);
    this._raycaster.set(this._eyePos, this._rayDir);
    this._raycaster.far = 2.4;

    const wallHits = this._raycaster.intersectObjects(this.currentMap.raycastMeshes, false);
    const wallDist = wallHits.length > 0 ? wallHits[0].distance : 2.4;
    const enemyHits = this._raycaster.intersectObjects(botHitMeshes, false);

    if (enemyHits.length > 0 && enemyHits[0].distance < wallDist) {
      const hit = enemyHits[0];
      const { entityId, isHead } = hit.object.userData as { entityId: string; isHead: boolean };
      const victim = this.bots.find((b) => b.id === entityId);
      if (victim) {
        const victimFwdX = -Math.sin(victim.yaw);
        const victimFwdZ = -Math.cos(victim.yaw);
        const dot = this._rayDir.x * victimFwdX + this._rayDir.z * victimFwdZ;
        const dmg = dot > 0.25 ? 125 : 65; // Classic CS 1.6 heavy backstab
        const res = victim.health.applyDamage(dmg, 0.85, isHead);
        triggerBotHitReaction(victim, isHead);
        this.hitMarkerTimer = 0.18;
        audioManager.playHitMarker(isHead || dmg > 100);
        this.spawnBloodBurst(hit.point, this._rayDir, 10, isHead);
        this.spawnWallBloodSplatter(hit.point, this._rayDir);
        if (res.killed) {
          audioManager.playDeathCue(victim.position);
          this.spawnDeathBloodPool(victim.position);
          this.spawnBotDroppedWeapon(victim);
          this.handleElimination('You', this.playerTeam, victim.name, victim.team, 'Knife', isHead);
          victim.deaths += 1;
          victim.respawnTimer = 3.0;
          this.playerKills += 1;
          this.inventory.addMoney(300);
          if (this.roundManager.mode === 'tdm') {
            if (this.playerTeam === 'T') this.roundManager.tScore += 1;
            else this.roundManager.ctScore += 1;
          }
          this.recordPlayerKill(isHead);
        }
      }
    } else if (wallHits.length > 0) {
      this.spawnImpactSparks(wallHits[0].point, 4);
    }
  }

  private resolveBotShot(shooter: BotContext, origin: THREE.Vector3, dir: THREE.Vector3): void {
    if (!this.currentMap) return;
    notifyBotsOfGunfire(this.bots, origin, shooter.team, this.roundManager.mode === 'dm');
    const def = WEAPON_DATABASE[shooter.weaponId];
    this._raycaster.set(origin, dir);
    this._raycaster.far = def.range;

    const wallHits = this._raycaster.intersectObjects(this.currentMap.raycastMeshes, false);
    const wallDist = wallHits.length > 0 ? wallHits[0].distance : def.range;

    // Check player hit (simple cylinder/sphere check along ray)
    let hitDist = wallDist;
    let hitPlayer = false;
    let playerHeadshot = false;

    if (
      this.playerHealth.alive &&
      (this.roundManager.mode === 'dm' || shooter.team !== this.playerTeam)
    ) {
      const pCenter = this.playerController.position.clone().add(new THREE.Vector3(0, 1.0, 0));
      const toPlayer = pCenter.clone().sub(origin);
      const proj = toPlayer.dot(dir);
      if (proj > 0 && proj < wallDist) {
        const closest = origin.clone().addScaledVector(dir, proj);
        const horizDist = Math.hypot(closest.x - pCenter.x, closest.z - pCenter.z);
        const vertDiff = closest.y - this.playerController.position.y;
        const maxH = this.playerController.isCrouching ? 1.25 : 1.78;
        if (horizDist < 0.44 && vertDiff >= 0 && vertDiff <= maxH) {
          hitDist = proj;
          hitPlayer = true;
          playerHeadshot = vertDiff > maxH - 0.3;
        }
      }
    }

    // Check opposing bots
    const enemyMeshes: THREE.Object3D[] = [];
    for (const b of this.bots) {
      if (!b.health.alive || b.id === shooter.id) continue;
      if (this.roundManager.mode !== 'dm' && b.team === shooter.team) continue;
      enemyMeshes.push(b.rig.headMesh, ...b.rig.bodyHitMeshes);
    }

    const botHits = this._raycaster.intersectObjects(enemyMeshes, false);
    const botHit = botHits.length > 0 && botHits[0].distance < hitDist ? botHits[0] : null;

    shooter.rig.root.updateMatrixWorld(true);
    shooter.rig.muzzlePoint.getWorldPosition(this._tmpMuzzle);

    if (botHit) {
      const { entityId, isHead } = botHit.object.userData as { entityId: string; isHead: boolean };
      const victim = this.bots.find((b) => b.id === entityId);
      if (victim) {
        const res = victim.health.applyDamage(def.damage, def.armorPenetration, isHead);
        triggerBotHitReaction(victim, isHead);
        this.spawnBloodBurst(botHit.point, dir, isHead ? 10 : 6, isHead);
        this.spawnWallBloodSplatter(botHit.point, dir);
        if (res.killed) {
          audioManager.playDeathCue(victim.position);
          this.spawnDeathBloodPool(victim.position);
          this.spawnBotDroppedWeapon(victim);
          shooter.kills += 1;
          shooter.money = Math.min(16000, shooter.money + 300);
          victim.deaths += 1;
          victim.respawnTimer = 3.0;
          this.handleElimination(shooter.name, shooter.team, victim.name, victim.team, def.shortName, isHead);
          if (this.roundManager.mode === 'tdm') {
            if (shooter.team === 'T') this.roundManager.tScore += 1;
            else this.roundManager.ctScore += 1;
          }
        }
      }
      this.spawnTracer(this._tmpMuzzle, botHit.point, 0xffc966);
    } else if (hitPlayer) {
      const res = this.playerHealth.applyDamage(def.damage, def.armorPenetration, playerHeadshot);
      this.damageIndicatorTimer = 0.42;
      this.bloodOverlayAlpha = Math.max(
        this.bloodOverlayAlpha,
        res.killed ? 1.0 : Math.min(0.88, (playerHeadshot ? 0.65 : 0.42) + (1 - this.playerHealth.health / 100) * 0.35)
      );
      if (res.killed) {
        audioManager.playDeathCue();
        this.playerDeaths += 1;
        this.playerRespawnTimer = 3.0;
        this.triggerPlayerDeath(shooter.name, def.shortName, shooter.position);
        shooter.kills += 1;
        this.handleElimination(shooter.name, shooter.team, 'You', this.playerTeam, def.shortName, playerHeadshot);
        if (this.roundManager.mode === 'tdm') {
          if (shooter.team === 'T') this.roundManager.tScore += 1;
          else this.roundManager.ctScore += 1;
        }
      }
      this._tmpTarget.copy(origin).addScaledVector(dir, hitDist);
      this.spawnTracer(this._tmpMuzzle, this._tmpTarget, 0xffc966);
    } else {
      if (wallHits.length > 0) {
        this._tmpTarget.copy(wallHits[0].point);
      } else {
        this._tmpTarget.copy(origin).addScaledVector(dir, 45);
      }
      this.spawnTracer(this._tmpMuzzle, this._tmpTarget, 0xffc966);
      if (wallHits.length > 0) {
        this.spawnImpactSparks(this._tmpTarget, 3);
        this.spawnBulletDecal(this._tmpTarget, wallHits[0].face?.normal, wallHits[0].object);
      }
    }
  }

  private pushRadioMessage(sender: string, team: 'T' | 'CT', message: string): void {
    const now = performance.now();
    const last = this.radioLog[this.radioLog.length - 1];
    if (last && last.sender === sender && last.message === message && now - last.timestamp < 1400) {
      return;
    }
    this.radioLog.push({
      id: `${Date.now()}-${Math.random()}`,
      sender,
      team,
      message,
      timestamp: now,
    });
    if (this.radioLog.length > 4) this.radioLog.shift();
  }

  private spawnBotDroppedWeapon(bot: BotContext): void {
    const def = WEAPON_DATABASE[bot.weaponId];
    if (!def || (def.slot !== 'primary' && def.slot !== 'secondary')) return;
    this.spawnDroppedWeapon(
      bot.weaponId,
      Math.max(1, bot.ammoInMag || def.magazineSize),
      def.reserveMax,
      bot.weaponId === 'm4a1' || bot.weaponId === 'usp',
      bot.position
    );
  }

  private spawnDroppedWeapon(
    weaponId: WeaponId,
    ammoInMag: number,
    ammoReserve: number,
    silenced: boolean,
    originPos: THREE.Vector3,
    throwDir?: THREE.Vector3
  ): void {
    const def = WEAPON_DATABASE[weaponId];
    if (!def || (def.slot !== 'primary' && def.slot !== 'secondary')) return;

    const mesh = buildWeaponModel(weaponId, silenced);
    mesh.scale.setScalar(1.65);
    mesh.rotation.set(0, Math.random() * Math.PI * 2, Math.PI / 2);

    const pos = new THREE.Vector3(originPos.x, Math.max(0.25, originPos.y + 0.85), originPos.z);
    const vel = new THREE.Vector3();
    if (throwDir) {
      vel.copy(throwDir).multiplyScalar(6.2);
      vel.y = Math.max(1.8, vel.y + 1.8);
    } else {
      vel.set((Math.random() - 0.5) * 2.4, 2.5, (Math.random() - 0.5) * 2.4);
    }

    mesh.position.copy(pos);
    this.scene.add(mesh);

    this.droppedWeapons.push({
      id: `${Date.now()}-${Math.random()}`,
      weaponId,
      ammoInMag,
      ammoReserve,
      silenced,
      mesh,
      pos,
      vel,
      pickupCooldown: throwDir ? 0.65 : 0.2,
    });

    if (this.droppedWeapons.length > 18) {
      const oldest = this.droppedWeapons.shift();
      if (oldest) {
        this.scene.remove(oldest.mesh);
        this.disposeObject3D(oldest.mesh);
      }
    }
  }

  private updateDroppedWeapons(dt: number): void {
    if (!this.currentMap) return;
    for (let i = this.droppedWeapons.length - 1; i >= 0; i--) {
      const dw = this.droppedWeapons[i];
      if (dw.pickupCooldown > 0) dw.pickupCooldown = Math.max(0, dw.pickupCooldown - dt);

      const floorY = this.getFloorYAt(dw.pos.x, dw.pos.z, dw.pos.y) + 0.08;
      if (
        dw.pos.y > floorY ||
        Math.abs(dw.vel.y) > 0.04 ||
        Math.abs(dw.vel.x) > 0.04 ||
        Math.abs(dw.vel.z) > 0.04
      ) {
        dw.vel.y -= 18 * dt;
        dw.pos.addScaledVector(dw.vel, dt);

        if (dw.pos.y <= floorY) {
          dw.pos.y = floorY;
          dw.vel.y = Math.abs(dw.vel.y) > 1.2 ? Math.abs(dw.vel.y) * 0.25 : 0;
          dw.vel.x *= 0.55;
          dw.vel.z *= 0.55;
        }

        for (const c of this.currentMap.colliders) {
          if (
            dw.pos.y > c.minY + 0.14 &&
            dw.pos.y < c.maxY &&
            dw.pos.x > c.minX - 0.2 &&
            dw.pos.x < c.maxX + 0.2 &&
            dw.pos.z > c.minZ - 0.2 &&
            dw.pos.z < c.maxZ + 0.2
          ) {
            dw.vel.x *= -0.35;
            dw.vel.z *= -0.35;
            dw.pos.addScaledVector(dw.vel, dt * 2);
            break;
          }
        }
        dw.mesh.position.copy(dw.pos);
      }

      // Auto-pickup when walking over a ground weapon with empty slot
      if (this.playerHealth.alive && !this.isSpectatorMode && dw.pickupCooldown <= 0) {
        const horizDist = Math.hypot(
          dw.pos.x - this.playerController.position.x,
          dw.pos.z - this.playerController.position.z
        );
        if (horizDist < 1.35 && Math.abs(dw.pos.y - this.playerController.position.y) < 1.5) {
          const def = WEAPON_DATABASE[dw.weaponId];
          let picked = false;
          if (def.slot === 'primary' && !this.inventory.primary) {
            this.inventory.primary = {
              id: dw.weaponId,
              ammoInMag: dw.ammoInMag,
              ammoReserve: dw.ammoReserve,
              silenced: dw.silenced,
            };
            this.inventory.activeSlot = 'primary';
            picked = true;
          } else if (def.slot === 'secondary' && !this.inventory.secondary) {
            this.inventory.secondary = {
              id: dw.weaponId,
              ammoInMag: dw.ammoInMag,
              ammoReserve: dw.ammoReserve,
              silenced: dw.silenced,
            };
            if (this.inventory.activeSlot === 'knife') {
              this.inventory.activeSlot = 'secondary';
            }
            picked = true;
          }

          if (picked) {
            audioManager.playReloadStage('weapon_switch');
            this.weaponSelectTimer = 2.2;
            this.weaponController.equip(this.inventory.getActiveWeapon());
            this.scene.remove(dw.mesh);
            this.disposeObject3D(dw.mesh);
            this.droppedWeapons.splice(i, 1);
          }
        }
      }
    }
  }

  private updateTargetIdentification(): void {
    if (!this.playerHealth.alive || !this.currentMap || this.isSpectatorMode) {
      this.currentTargetId = null;
      return;
    }

    this.camera.getWorldPosition(this._eyePos);
    this.camera.getWorldDirection(this._tmpFwd);

    let bestBot: BotContext | null = null;
    let bestDist = 42;

    for (const bot of this.bots) {
      if (!bot.health.alive) continue;
      this._tmpToBot.set(
        bot.position.x - this._eyePos.x,
        bot.position.y + 1.25 - this._eyePos.y,
        bot.position.z - this._eyePos.z
      );
      const dist = this._tmpToBot.length();
      if (dist < 0.6 || dist >= bestDist) continue;

      this._tmpToBot.divideScalar(dist);
      const dot = this._tmpFwd.dot(this._tmpToBot);
      if (dot < 0.96) continue;
      const perp = Math.sqrt(Math.max(0, 1 - dot * dot)) * dist;
      if (perp > 0.62) continue;

      this._raycaster.set(this._eyePos, this._tmpToBot);
      this._raycaster.far = dist;
      const wallHits = this._raycaster.intersectObjects(this.currentMap.raycastMeshes, false);
      if (wallHits.length > 0 && wallHits[0].distance < dist - 0.35) continue;

      bestDist = dist;
      bestBot = bot;
    }

    if (bestBot) {
      const isFriend = this.roundManager.mode !== 'dm' && bestBot.team === this.playerTeam;
      this.currentTargetId = {
        name: bestBot.name,
        team: bestBot.team,
        health: bestBot.health.health,
        isFriend,
      };
      const now = performance.now();
      if (!isFriend && now - this.lastRadioSpotTime > 7000) {
        this.lastRadioSpotTime = now;
        this.pushRadioMessage('You', this.playerTeam, 'Enemy spotted.');
        audioManager.playVoiceLine('enemy_spotted');
      }
    } else {
      this.currentTargetId = null;
    }
  }

  private handleElimination(
    killerName: string,
    killerTeam: 'T' | 'CT',
    victimName: string,
    victimTeam: 'T' | 'CT',
    weaponName: string,
    headshot: boolean
  ): void {
    this.killFeed.unshift({
      id: `${Date.now()}-${Math.random()}`,
      killerName,
      killerTeam,
      victimName,
      victimTeam,
      weaponName,
      headshot,
      timestamp: performance.now(),
    });
    if (this.killFeed.length > 5) this.killFeed.pop();
    if (killerName !== 'Gravity' && killerName !== 'You') {
      this.roundFirstBloodClaimed = true;
    }
  }

  private recordPlayerKill(isHeadshot: boolean): void {
    const isFirstBlood = !this.roundFirstBloodClaimed;
    this.roundFirstBloodClaimed = true;

    this.multiKillCount = this.multiKillTimer > 0 ? this.multiKillCount + 1 : 1;
    this.multiKillTimer = 4.5;

    if (this.multiKillCount >= 5) {
      audioManager.playVoiceLine('monster_kill');
      this.pushRadioMessage('Announcer', this.playerTeam, 'MONSTER KILL!');
    } else if (this.multiKillCount === 4) {
      audioManager.playVoiceLine('mega_kill');
      this.pushRadioMessage('Announcer', this.playerTeam, 'MEGA KILL!');
    } else if (this.multiKillCount === 3) {
      audioManager.playVoiceLine('multi_kill');
      this.pushRadioMessage('Announcer', this.playerTeam, 'MULTI KILL!');
    } else if (this.multiKillCount === 2) {
      audioManager.playVoiceLine('double_kill');
      this.pushRadioMessage('Announcer', this.playerTeam, 'DOUBLE KILL!');
    } else if (isHeadshot) {
      audioManager.playVoiceLine('headshot');
    } else if (isFirstBlood) {
      audioManager.playVoiceLine('first_blood');
    }
  }

  private throwGrenade(type: 'hegrenade' | 'flashbang' | 'smokegrenade'): void {
    if (type === 'hegrenade' && this.inventory.grenades.he <= 0) return;
    if (type === 'flashbang' && this.inventory.grenades.flash <= 0) return;
    if (type === 'smokegrenade' && this.inventory.grenades.smoke <= 0) return;

    if (type === 'hegrenade') this.inventory.grenades.he -= 1;
    if (type === 'flashbang') this.inventory.grenades.flash -= 1;
    if (type === 'smokegrenade') this.inventory.grenades.smoke -= 1;

    this.pushRadioMessage('You', this.playerTeam, 'Fire in the hole!');
    audioManager.playVoiceLine('fire_in_hole');

    const mesh = buildWeaponModel(type);
    mesh.scale.setScalar(1.3);
    const pos = new THREE.Vector3();
    const dir = new THREE.Vector3();
    this.camera.getWorldPosition(pos);
    this.camera.getWorldDirection(dir);
    pos.addScaledVector(dir, 0.7);
    mesh.position.copy(pos);
    this.scene.add(mesh);

    const vel = dir.multiplyScalar(17.5);
    vel.y += 3.5;

    this.thrownGrenades.push({
      type,
      mesh,
      pos,
      vel,
      fuse: type === 'smokegrenade' ? 1.5 : 1.7,
      ownerName: 'You',
      ownerTeam: this.playerTeam,
    });

    // Switch back to rifle/pistol if out of grenades
    if (!this.inventory.getAvailableGrenadeId()) {
      this.inventory.activeSlot = this.inventory.primary ? 'primary' : 'secondary';
    }
    this.weaponController.equip(this.inventory.getActiveWeapon());
  }

  private updateGrenades(dt: number): void {
    if (!this.currentMap) return;
    for (let i = this.thrownGrenades.length - 1; i >= 0; i--) {
      const g = this.thrownGrenades[i];
      g.fuse -= dt;
      g.vel.y -= 18 * dt;
      g.pos.addScaledVector(g.vel, dt);

      const floorY = this.getFloorYAt(g.pos.x, g.pos.z, g.pos.y) + 0.08;
      if (g.pos.y <= floorY) {
        g.pos.y = floorY;
        g.vel.y = Math.abs(g.vel.y) * 0.45;
        g.vel.x *= 0.72;
        g.vel.z *= 0.72;
      }

      // Bounce against walls / elevated structures above current floor slab
      for (const c of this.currentMap.colliders) {
        if (
          g.pos.y > c.minY + 0.14 &&
          g.pos.y < c.maxY &&
          g.pos.x > c.minX - 0.15 &&
          g.pos.x < c.maxX + 0.15 &&
          g.pos.z > c.minZ - 0.15 &&
          g.pos.z < c.maxZ + 0.15
        ) {
          g.vel.x *= -0.5;
          g.vel.z *= -0.5;
          g.pos.addScaledVector(g.vel, dt * 2);
          break;
        }
      }

      g.mesh.position.copy(g.pos);
      g.mesh.rotation.x += dt * 8;
      g.mesh.rotation.y += dt * 6;

      if (g.fuse <= 0) {
        this.detonateGrenade(g);
        this.scene.remove(g.mesh);
        this.disposeObject3D(g.mesh);
        this.thrownGrenades.splice(i, 1);
      }
    }
  }

  private detonateGrenade(g: ThrownGrenade): void {
    const distToPlayer = g.pos.distanceTo(this.playerController.position);
    if (g.type === 'hegrenade') {
      audioManager.playExplosion(Math.max(0.15, 1 - distToPlayer / 45));
      this.particleEffects.spawnExplosion(g.pos, 1.0, true);

      // Area damage
      if (this.playerHealth.alive && distToPlayer < 8.5) {
        const dmg = Math.round((1 - distToPlayer / 8.5) * 92);
        const res = this.playerHealth.applyDamage(dmg, 0.65, false);
        this.damageIndicatorTimer = 0.45;
        this.bloodOverlayAlpha = Math.max(this.bloodOverlayAlpha, res.killed ? 1.0 : 0.68);
        if (res.killed) {
          audioManager.playDeathCue();
          this.playerDeaths += 1;
          this.playerRespawnTimer = 3.0;
          this.triggerPlayerDeath(g.ownerName, 'HE Grenade', g.pos);
          this.handleElimination(g.ownerName, g.ownerTeam, 'You', this.playerTeam, 'HE Grenade', false);
        }
      }
      this.bots.forEach((b) => {
        if (!b.health.alive) return;
        const d = b.position.distanceTo(g.pos);
        if (d < 8.5) {
          const res = b.health.applyDamage(Math.round((1 - d / 8.5) * 95), 0.65, false);
          this.spawnBloodBurst(b.position.clone().add(new THREE.Vector3(0, 1.0, 0)), b.position.clone().sub(g.pos).normalize(), 8, false);
          if (res.killed) {
            audioManager.playDeathCue(b.position);
            b.deathStyle = 2;
            this.spawnDeathBloodPool(b.position);
            this.spawnBotDroppedWeapon(b);
            b.deaths += 1;
            b.respawnTimer = 3.0;
            this.handleElimination(g.ownerName, g.ownerTeam, b.name, b.team, 'HE Grenade', false);
            if (g.ownerName === 'You') {
              this.playerKills += 1;
              this.inventory.addMoney(300);
              if (this.roundManager.mode === 'tdm') {
                if (this.playerTeam === 'T') this.roundManager.tScore += 1;
                else this.roundManager.ctScore += 1;
              }
              this.recordPlayerKill(false);
            }
          }
        }
      });
    } else if (g.type === 'flashbang') {
      audioManager.playFlashbang();
      this.particleEffects.spawnFlashPop(g.pos);
      if (distToPlayer < 22) {
        this.flashAlpha = Math.min(1, 1.15 - distToPlayer / 22);
      }
    } else if (g.type === 'smokegrenade') {
      audioManager.playKnifeSlash();
      this.spawnSmokeCloud(g.pos, 14);
    }
  }

  private spawnSmokeCloud(pos: THREE.Vector3, life: number): void {
    this.particleEffects.spawnSmokeCloud(pos, life);
  }

  private spawnTracer(start: THREE.Vector3, end: THREE.Vector3, colorHex: number): void {
    const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
    const mat = new THREE.LineBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.75,
    });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.tracers.push({ line, life: 0.08 });
  }

  private spawnBulletDecal(
    point: THREE.Vector3,
    faceNormal: THREE.Vector3 | undefined,
    hitObj: THREE.Object3D
  ): void {
    if (!faceNormal) return;
    if (!this.bulletDecalMat) {
      this.bulletDecalMat = new THREE.MeshStandardMaterial({
        map: textures.createBulletHoleTexture(),
        transparent: true,
        depthWrite: false,
        roughness: 0.9,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });
    }
    const worldNormal = faceNormal.clone().transformDirection(hitObj.matrixWorld).normalize();
    const decal = new THREE.Mesh(this.bulletDecalGeo, this.bulletDecalMat);
    decal.position.copy(point).addScaledVector(worldNormal, 0.014);
    decal.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), worldNormal);
    decal.rotateZ(Math.random() * Math.PI * 2);
    decal.userData.excludeFromAO = true;
    this.scene.add(decal);
    this.bulletDecals.push(decal);
    if (this.bulletDecals.length > 48) {
      const oldest = this.bulletDecals.shift();
      if (oldest) this.scene.remove(oldest);
    }
  }

  private spawnImpactSparks(pos: THREE.Vector3, count: number, colorHex = 0xffc864): void {
    this.particleEffects.spawnSparks(pos, count, colorHex);
  }

  private updateEffects(dt: number, elapsed = 0): void {
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      const t = this.tracers[i];
      t.life -= dt;
      (t.line.material as THREE.LineBasicMaterial).opacity = Math.max(0, t.life / 0.08);
      if (t.life <= 0) {
        this.scene.remove(t.line);
        t.line.geometry.dispose();
        (t.line.material as THREE.Material).dispose();
        this.tracers.splice(i, 1);
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.vel.y -= 14 * dt;
      p.mesh.position.addScaledVector(p.vel, dt);
      const scale = Math.max(0.01, p.life / p.maxLife);
      p.mesh.scale.setScalar(scale);
      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        this.particles.splice(i, 1);
      }
    }

    for (let i = 0; i < this.bloodPools.length; i++) {
      const bp = this.bloodPools[i];
      bp.age = Math.min(1.6, bp.age + dt);
      const growth = 0.18 + 0.82 * (1 - Math.pow(1 - bp.age / 1.6, 2));
      bp.mesh.scale.setScalar(growth);
    }

    this.particleEffects.update(dt, elapsed);
  }

  private spawnBloodBurst(pos: THREE.Vector3, shotDir: THREE.Vector3, count: number, isHeadshot: boolean): void {
    if (this.bloodDropMats.length === 0) {
      this.bloodDropMats = [
        new THREE.MeshBasicMaterial({ color: 0x7a080d }),
        new THREE.MeshBasicMaterial({ color: 0xa61016 }),
        new THREE.MeshBasicMaterial({ color: 0x4d0407 }),
      ];
    }
    for (let i = 0; i < count; i++) {
      const mat = this.bloodDropMats[i % this.bloodDropMats.length];
      const mesh = new THREE.Mesh(this.bloodDropGeo, mat);
      mesh.position.copy(pos);
      const scaleMult = isHeadshot ? 1.35 : 1.0;
      mesh.scale.setScalar(scaleMult);
      this.scene.add(mesh);

      const speed = 1.8 + Math.random() * 4.4;
      this.particles.push({
        mesh,
        vel: new THREE.Vector3(
          shotDir.x * speed + (Math.random() - 0.5) * 2.8,
          Math.random() * (isHeadshot ? 4.2 : 2.6) + 0.4,
          shotDir.z * speed + (Math.random() - 0.5) * 2.8
        ),
        life: 0.38 + Math.random() * 0.28,
        maxLife: 0.62,
      });
    }
  }

  private spawnWallBloodSplatter(hitPoint: THREE.Vector3, shotDir: THREE.Vector3): void {
    if (!this.currentMap) return;
    if (this.bloodSplatterMats.length === 0) {
      for (let v = 0; v < 3; v++) {
        this.bloodSplatterMats.push(
          new THREE.MeshStandardMaterial({
            map: textures.createBloodSplatterTexture(v),
            transparent: true,
            depthWrite: false,
            roughness: 0.32,
            metalness: 0.05,
            polygonOffset: true,
            polygonOffsetFactor: -3,
            polygonOffsetUnits: -3,
          })
        );
      }
    }

    this._rayDir.copy(shotDir).normalize();
    this._raycaster.set(hitPoint, this._rayDir);
    this._raycaster.far = 3.2;
    const hits = this._raycaster.intersectObjects(this.currentMap.raycastMeshes, false);
    const h = hits[0];
    if (!h || !h.face?.normal) return;

    const worldNormal = h.face.normal.clone().transformDirection(h.object.matrixWorld).normalize();
    const mat = this.bloodSplatterMats[this.bloodDecals.length % this.bloodSplatterMats.length];
    const decal = new THREE.Mesh(this.bloodSplatterGeo, mat);
    decal.position.copy(h.point).addScaledVector(worldNormal, 0.018);
    decal.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), worldNormal);
    decal.rotateZ(Math.random() * Math.PI * 2);
    decal.scale.setScalar(0.75 + Math.random() * 0.65);
    decal.userData.excludeFromAO = true;
    this.scene.add(decal);
    this.bloodDecals.push(decal);
    if (this.bloodDecals.length > 32) {
      const oldest = this.bloodDecals.shift();
      if (oldest) this.scene.remove(oldest);
    }
  }

  private spawnDeathBloodPool(pos: THREE.Vector3): void {
    if (!this.bloodPoolMat) {
      this.bloodPoolMat = new THREE.MeshStandardMaterial({
        map: textures.createBloodPoolTexture(),
        transparent: true,
        depthWrite: false,
        roughness: 0.18,
        metalness: 0.08,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });
    }
    const pool = new THREE.Mesh(this.bloodPoolGeo, this.bloodPoolMat);
    pool.rotation.x = -Math.PI / 2;
    pool.rotation.z = Math.random() * Math.PI * 2;
    pool.position.set(pos.x, pos.y + 0.016, pos.z);
    pool.scale.setScalar(0.18);
    pool.userData.excludeFromAO = true;
    this.scene.add(pool);
    this.bloodPools.push({ mesh: pool, age: 0 });
    if (this.bloodPools.length > 24) {
      const oldest = this.bloodPools.shift();
      if (oldest) this.scene.remove(oldest.mesh);
    }
  }

  private triggerPlayerDeath(killerName: string, weaponName: string, killerPos?: THREE.Vector3): void {
    this.weaponController.viewRoot.visible = false;
    this.weaponController.zoomLevel = 0;
    this.camera.fov = settingsManager.get().fov;
    this.camera.updateProjectionMatrix();
    this.spectatorMode = 'DEATH_CAM';
    this.deathCamProgress = 0;
    this.deathCamStartPos.copy(this.camera.position);
    this.deathCamYaw = this.playerController.yaw;
    this.deathCamPitch = this.playerController.pitch;
    this.killedByPos = killerPos ? killerPos.clone() : null;
    this.killedByName = killerName;
    this.killedByWeapon = weaponName;
    this.bloodOverlayAlpha = 1.0;
    this.currentTargetId = null;
    this.overviewOffset.set(0, 0, 0);
    if (this.inventory.primary) {
      this.spawnDroppedWeapon(
        this.inventory.primary.id,
        this.inventory.primary.ammoInMag,
        this.inventory.primary.ammoReserve,
        Boolean(this.inventory.primary.silenced),
        this.playerController.position
      );
    } else if (this.inventory.secondary) {
      this.spawnDroppedWeapon(
        this.inventory.secondary.id,
        this.inventory.secondary.ammoInMag,
        this.inventory.secondary.ammoReserve,
        Boolean(this.inventory.secondary.silenced),
        this.playerController.position
      );
    }
    this.spawnDeathBloodPool(this.playerController.position);
    this._eyePos.copy(this.playerController.position).add(new THREE.Vector3(0, 1.35, 0));
    this._rayDir.set(0, 1, 0);
    this.spawnBloodBurst(this._eyePos, this._rayDir, 10, false);
  }

  private getSpectateCandidates(): BotContext[] {
    const alive = this.bots.filter((b) => b.health.alive);
    if (alive.length === 0) return [];
    const teammates = alive.filter((b) => b.team === this.playerTeam);
    return teammates.length > 0 && this.roundManager.mode !== 'dm' ? teammates : alive;
  }

  private getActiveSpectatorTarget(): BotContext | null {
    if (this.spectatorMode !== 'CHASE_CAM' && this.spectatorMode !== 'FIRST_PERSON') return null;
    const list = this.getSpectateCandidates();
    if (list.length === 0) return null;
    return list[((this.spectatorTargetIndex % list.length) + list.length) % list.length];
  }

  private cycleSpectatorMode(): void {
    if (this.spectatorMode === 'DEATH_CAM') {
      this.spectatorMode = 'UPPER_OVERVIEW';
    } else if (this.spectatorMode === 'UPPER_OVERVIEW') {
      this.spectatorMode = this.getSpectateCandidates().length > 0 ? 'CHASE_CAM' : 'UPPER_OVERVIEW';
    } else if (this.spectatorMode === 'CHASE_CAM') {
      this.spectatorMode = this.getSpectateCandidates().length > 0 ? 'FIRST_PERSON' : 'UPPER_OVERVIEW';
    } else {
      this.spectatorMode = 'UPPER_OVERVIEW';
    }
    this.emitHudSnapshot();
  }

  private cycleSpectatorTarget(delta: number): void {
    const list = this.getSpectateCandidates();
    if (list.length === 0) return;
    this.spectatorTargetIndex = (this.spectatorTargetIndex + delta + list.length) % list.length;
    if (this.spectatorMode === 'DEATH_CAM') {
      this.spectatorMode = 'CHASE_CAM';
    }
    this.emitHudSnapshot();
  }

  private updateSpectatorCamera(dt: number): void {
    if (!this.currentMap) return;
    for (const b of this.bots) {
      b.rig.head.visible = true;
    }

    this.camera.up.set(0, 1, 0);

    if (this.spectatorMode === 'DEATH_CAM') {
      this.deathCamProgress = Math.min(1, this.deathCamProgress + dt * 0.95);
      const ease = 1 - Math.pow(1 - this.deathCamProgress, 3);
      const groundY = this.playerController.position.y + 0.24;

      let targetYaw = this.deathCamYaw;
      if (this.killedByPos) {
        const dx = this.killedByPos.x - this.playerController.position.x;
        const dz = this.killedByPos.z - this.playerController.position.z;
        const toKillerYaw = Math.atan2(-dx, -dz);
        let diff = ((toKillerYaw - this.deathCamYaw + Math.PI) % (Math.PI * 2)) - Math.PI;
        if (diff < -Math.PI) diff += Math.PI * 2;
        targetYaw = this.deathCamYaw + diff * 0.65;
      }

      this.camera.position.set(
        this.deathCamStartPos.x,
        THREE.MathUtils.lerp(this.deathCamStartPos.y, groundY, ease),
        this.deathCamStartPos.z
      );
      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = THREE.MathUtils.lerp(this.deathCamYaw, targetYaw, ease);
      this.camera.rotation.x = THREE.MathUtils.lerp(this.deathCamPitch, 0.24, ease);
      this.camera.rotation.z = THREE.MathUtils.lerp(0, 0.68, ease);
    } else if (this.spectatorMode === 'UPPER_OVERVIEW') {
      const bounds = this.currentMap.bounds;
      const centerX = (bounds.minX + bounds.maxX) * 0.5;
      const centerZ = (bounds.minZ + bounds.maxZ) * 0.5;
      const halfW = (bounds.maxX - bounds.minX) * 0.45;
      const halfD = (bounds.maxZ - bounds.minZ) * 0.45;

      // Allow free pan over map in Upper Overview with WASD / Arrow keys
      const panSpeed = 24 * dt;
      let fwd = 0;
      let right = 0;
      const kb = settingsManager.get().keybinds;
      if (this.keys[kb.forward] || this.keys['ArrowUp']) fwd += 1;
      if (this.keys[kb.backward] || this.keys['ArrowDown']) fwd -= 1;
      if (this.keys[kb.right] || this.keys['ArrowRight']) right += 1;
      if (this.keys[kb.left] || this.keys['ArrowLeft']) right -= 1;

      if (fwd !== 0 || right !== 0) {
        const sinY = Math.sin(this.overviewYaw);
        const cosY = Math.cos(this.overviewYaw);
        this.overviewOffset.x += (-sinY * fwd + cosY * right) * panSpeed;
        this.overviewOffset.z += (-cosY * fwd - sinY * right) * panSpeed;
        this.overviewOffset.x = THREE.MathUtils.clamp(this.overviewOffset.x, -halfW, halfW);
        this.overviewOffset.z = THREE.MathUtils.clamp(this.overviewOffset.z, -halfD, halfD);
      }

      const focusX = centerX + this.overviewOffset.x;
      const focusZ = centerZ + this.overviewOffset.z;
      const camX = focusX + Math.sin(this.overviewYaw) * this.overviewHeight * 0.42;
      const camZ = focusZ + Math.cos(this.overviewYaw) * this.overviewHeight * 0.42;

      this.camera.position.set(camX, this.overviewHeight, camZ);
      this.camera.lookAt(focusX, 1.0, focusZ);
    } else {
      const target = this.getActiveSpectatorTarget();
      if (!target) {
        this.spectatorMode = 'UPPER_OVERVIEW';
        return;
      }

      if (this.spectatorMode === 'FIRST_PERSON') {
        target.rig.head.visible = false;
        const eyeY = target.position.y + (target.isCrouching ? 1.06 : 1.56);
        this.camera.position.set(
          target.position.x - Math.sin(target.yaw) * 0.14,
          eyeY,
          target.position.z - Math.cos(target.yaw) * 0.14
        );
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = target.yaw;
        this.camera.rotation.x = 0;
        this.camera.rotation.z = 0;
      } else {
        const dist = 3.6;
        const camX = target.position.x + Math.sin(target.yaw) * dist;
        const camZ = target.position.z + Math.cos(target.yaw) * dist;
        const camY = target.position.y + 2.25;
        this.camera.position.set(camX, camY, camZ);
        this.camera.lookAt(target.position.x, target.position.y + 1.35, target.position.z);
      }
    }

    this.camera.getWorldDirection(this._rayDir);
    audioManager.updateListener(this.camera.position, this._rayDir, this._camUp);
  }

  private spawnAmbientParticles(map: BuiltMap): void {
    if (this.ambientParticles) {
      this.scene.remove(this.ambientParticles);
      this.ambientParticles.geometry.dispose();
      (this.ambientParticles.material as THREE.Material).dispose();
      this.ambientParticles = null;
    }

    this.ambientParticleMode = map.ambientParticleMode;
    this.ambientBounds = map.bounds;

    const count = this.isSoftwareGl ? 70 : 160;
    const positions = new Float32Array(count * 3);
    const width = map.bounds.maxX - map.bounds.minX;
    const depth = map.bounds.maxZ - map.bounds.minZ;

    for (let i = 0; i < count; i++) {
      positions[i * 3] = map.bounds.minX + Math.random() * width;
      positions[i * 3 + 1] = 0.4 + Math.random() * 11.5;
      positions[i * 3 + 2] = map.bounds.minZ + Math.random() * depth;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const palette: Record<typeof map.ambientParticleMode, { color: number; size: number; opacity: number }> = {
      dust: { color: 0xf3d8a8, size: 0.11, opacity: 0.52 },
      snow: { color: 0xf2f8ff, size: 0.15, opacity: 0.78 },
      mist: { color: 0xcce6c5, size: 0.17, opacity: 0.42 },
      sparks: { color: 0xffb969, size: 0.1, opacity: 0.58 },
    };
    const cfg = palette[map.ambientParticleMode];

    const mat = new THREE.PointsMaterial({
      color: cfg.color,
      size: cfg.size,
      transparent: true,
      opacity: cfg.opacity,
      depthWrite: false,
    });

    this.ambientParticles = new THREE.Points(geo, mat);
    this.scene.add(this.ambientParticles);
  }

  private updateAmbientParticles(dt: number, elapsed: number): void {
    if (!this.ambientParticles) return;
    const posAttr = this.ambientParticles.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;
    const { minX, maxX, minZ, maxZ } = this.ambientBounds;

    for (let i = 0; i < posAttr.count; i++) {
      const ix = i * 3;
      const iy = ix + 1;
      const iz = ix + 2;

      if (this.ambientParticleMode === 'snow') {
        arr[ix] += Math.sin(elapsed * 0.7 + i) * 0.35 * dt;
        arr[iy] -= 1.45 * dt;
        arr[iz] += Math.cos(elapsed * 0.6 + i) * 0.25 * dt;
        if (arr[iy] < 0.1) arr[iy] = 11.5;
      } else if (this.ambientParticleMode === 'sparks') {
        arr[ix] += Math.sin(elapsed * 1.4 + i) * 0.3 * dt;
        arr[iy] += 0.65 * dt;
        arr[iz] += Math.cos(elapsed * 1.1 + i) * 0.3 * dt;
        if (arr[iy] > 11.5) arr[iy] = 0.4;
      } else if (this.ambientParticleMode === 'mist') {
        arr[ix] += 0.45 * dt;
        arr[iy] += Math.sin(elapsed * 0.5 + i) * 0.12 * dt;
        arr[iz] += 0.18 * dt;
      } else {
        // Warm wind-blown dust motes
        arr[ix] += 0.55 * dt;
        arr[iy] += Math.sin(elapsed * 0.8 + i) * 0.15 * dt;
        arr[iz] += Math.cos(elapsed * 0.6 + i) * 0.2 * dt;
      }

      if (arr[ix] > maxX) arr[ix] = minX;
      if (arr[ix] < minX) arr[ix] = maxX;
      if (arr[iz] > maxZ) arr[iz] = minZ;
      if (arr[iz] < minZ) arr[iz] = maxZ;
    }

    posAttr.needsUpdate = true;
  }

  private isPlayerInBuyZone(): boolean {
    if (!this.currentMap) return false;
    for (const bz of this.currentMap.buyZones) {
      if (bz.team !== this.playerTeam) continue;
      const d = Math.hypot(this.playerController.position.x - bz.x, this.playerController.position.z - bz.z);
      if (d <= bz.radius) return true;
    }
    return false;
  }

  private getPlayerBombsite(): 'A' | 'B' | null {
    if (!this.currentMap) return null;
    for (const site of this.currentMap.bombsites) {
      const d = Math.hypot(this.playerController.position.x - site.x, this.playerController.position.z - site.z);
      if (d <= site.radius) return site.label;
    }
    return null;
  }

  private emitHudSnapshot(): void {
    const inst = this.inventory.getActiveWeapon();
    const def = WEAPON_DATABASE[inst.id];
    const inBombsite = this.getPlayerBombsite();

    let objectiveHint = '';
    if (this.roundManager.mode === 'bomb_defusal' && this.playerHealth.alive) {
      if (this.playerTeam === 'T' && this.inventory.hasC4 && !this.roundManager.bombPlanted && inBombsite) {
        objectiveHint = `Hold [E] to plant C4 at Bombsite ${inBombsite}`;
      } else if (this.playerTeam === 'CT' && this.roundManager.bombPlanted && this.plantedC4Pos) {
        if (this.playerController.position.distanceTo(this.plantedC4Pos) < 2.8) {
          objectiveHint = 'Hold [E] to defuse C4';
        }
      }
    }

    const scoreboard: ScoreboardRow[] = [
      {
        id: 'player',
        name: 'You',
        team: this.playerTeam,
        alive: this.playerHealth.alive,
        kills: this.playerKills,
        deaths: this.playerDeaths,
        money: this.inventory.money,
        isPlayer: true,
        hasBomb: this.inventory.hasC4,
        hasDefuseKit: this.inventory.hasDefuseKit,
      },
      ...this.bots.map((b) => ({
        id: b.id,
        name: b.name,
        team: b.team,
        alive: b.health.alive,
        kills: b.kills,
        deaths: b.deaths,
        money: b.money,
        isPlayer: false,
        hasBomb: b.hasC4,
        hasDefuseKit: b.hasDefuseKit,
      })),
    ];

    const radarBlips: RadarBlip[] = [];
    if (this.playerHealth.alive) {
      radarBlips.push({
        x: this.playerController.position.x,
        z: this.playerController.position.z,
        team: this.playerTeam,
        isPlayer: true,
        yaw: this.playerController.yaw,
      });
    }
    for (const b of this.bots) {
      if (!b.health.alive) continue;
      if (b.team === this.playerTeam) {
        radarBlips.push({ x: b.position.x, z: b.position.z, team: b.team });
      }
    }
    if (this.plantedC4Pos) {
      radarBlips.push({ x: this.plantedC4Pos.x, z: this.plantedC4Pos.z, team: 'BOMB' });
    }

    this.onHudUpdate({
      health: this.playerHealth.health,
      armor: this.playerHealth.armor,
      hasHelmet: this.playerHealth.hasHelmet,
      hasDefuseKit: this.inventory.hasDefuseKit,
      hasC4: this.inventory.hasC4,
      money: this.inventory.money,
      inBuyZone: this.isPlayerInBuyZone(),
      inBuyPeriod: this.roundManager.buyPeriodTimer > 0,
      inBombsite,
      activeSlot: this.inventory.activeSlot,
      activeWeaponId: inst.id,
      activeWeaponName: def.shortName,
      ammoInMag: inst.ammoInMag,
      ammoReserve: inst.ammoReserve,
      isReloading: this.weaponController.isReloading,
      reloadProgress: this.weaponController.getReloadProgress(),
      zoomLevel: this.weaponController.zoomLevel,
      silenced: Boolean(inst.silenced),
      burstMode: Boolean(inst.burstMode),
      crosshairSpread: this.weaponController.getCurrentSpread(
        inst,
        this.playerController.moveSpeedRatio,
        this.playerController.isCrouching,
        this.playerController.onGround
      ),
      weaponSelectTimer: this.weaponSelectTimer,
      grenades: { ...this.inventory.grenades },
      slots: {
        primary: this.inventory.primary?.id ?? null,
        secondary: this.inventory.secondary?.id ?? null,
        knife: 'knife',
        grenade: this.inventory.getAvailableGrenadeId(),
        c4: this.inventory.hasC4,
      },
      roundNumber: this.roundManager.roundNumber,
      roundPhase: this.roundManager.phase,
      roundTimer: this.roundManager.roundTimer,
      bombTimer: this.roundManager.bombTimer,
      bombPlantedSite: this.roundManager.bombSite,
      tScore: this.roundManager.tScore,
      ctScore: this.roundManager.ctScore,
      playerTeam: this.playerTeam,
      playerAlive: this.playerHealth.alive,
      isSpectator: this.isSpectatorMode,
      spectatorMode: this.spectatorMode,
      spectatorTargetName: this.getActiveSpectatorTarget()?.name ?? null,
      spectatorTargetTeam: this.getActiveSpectatorTarget()?.team ?? null,
      spectatorTargetHealth: this.getActiveSpectatorTarget()?.health.health ?? 0,
      killedByName: this.killedByName,
      killedByWeapon: this.killedByWeapon,
      respawnTimer: Math.max(0, this.playerRespawnTimer),
      plantProgress: this.plantProgress,
      defuseProgress: this.defuseProgress,
      roundBanner: this.roundManager.roundBanner,
      killFeed: [...this.killFeed],
      radioLog: [...this.radioLog],
      targetId: this.currentTargetId,
      scoreboard,
      hitMarkerTimer: this.hitMarkerTimer,
      damageIndicatorTimer: this.damageIndicatorTimer,
      bloodOverlayAlpha: this.bloodOverlayAlpha,
      flashAlpha: this.flashAlpha,
      smokeOverlayAlpha: this.smokeOverlayAlpha,
      isPointerLocked: this.isPointerLocked,
      fps: this.currentFps,
      playerPos: {
        x: this.playerController.position.x,
        y: this.playerController.position.y,
        z: this.playerController.position.z,
        yaw: this.playerController.yaw,
      },
      radarBlips,
      bombsites: (this.currentMap?.bombsites || []).map((s) => ({ label: s.label, x: s.x, z: s.z })),
      gameMode: this.roundManager.mode,
      mapId: this.currentMap?.id || 'de_dust2',
      objectiveHint,
    });
  }

  private switchSlot(slot: WeaponSlot): void {
    if (!this.inventory.setActiveSlot(slot)) return;
    this.weaponSelectTimer = 2.2;
    this.weaponController.equip(this.inventory.getActiveWeapon());
    this.emitHudSnapshot();
  }

  // Input Event Handlers
  private onResize = (): void => {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.lightingSystem.resize(w, h);
  };

  private onPointerLockChange = (): void => {
    this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
    if (this.engineMode === 'MATCH' && !this.isPointerLocked && !this.buyMenuOpen) {
      this.onPauseChange(true);
    }
    this.emitHudSnapshot();
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keys[e.code] = true;
    if (this.engineMode !== 'MATCH') return;

    const kb = settingsManager.get().keybinds;

    if (e.code === kb.buy) {
      e.preventDefault();
      this.onToggleBuyMenu();
      return;
    }

    if (this.buyMenuOpen || this.pauseMenuOpen) return;

    // Post-death / Spectator controls: SPACE enters Upper Overview & cycles views
    if (!this.playerHealth.alive || this.isSpectatorMode) {
      if (e.code === 'Space') {
        e.preventDefault();
        this.cycleSpectatorMode();
      }
      return;
    }

    if (e.code === kb.reload) {
      this.weaponController.startReload(this.inventory.getActiveWeapon());
      this.emitHudSnapshot();
    } else if (e.code === kb.inspect) {
      this.weaponController.startInspect();
    } else if (e.code === 'KeyQ') {
      if (this.inventory.quickSwitch()) {
        this.weaponSelectTimer = 2.2;
        this.weaponController.equip(this.inventory.getActiveWeapon());
        this.emitHudSnapshot();
      }
    } else if (e.code === 'Digit1') {
      this.switchSlot('primary');
    } else if (e.code === 'Digit2') {
      this.switchSlot('secondary');
    } else if (e.code === 'Digit3') {
      this.switchSlot('knife');
    } else if (e.code === 'Digit4') {
      this.switchSlot('grenade');
    } else if (e.code === 'Digit5') {
      this.switchSlot('c4');
    } else if (e.code === kb.drop) {
      if (this.inventory.activeSlot === 'primary' && this.inventory.primary) {
        const dropped = this.inventory.primary;
        this.camera.getWorldPosition(this._eyePos);
        this.camera.getWorldDirection(this._tmpThrowDir);
        this.spawnDroppedWeapon(
          dropped.id,
          dropped.ammoInMag,
          dropped.ammoReserve,
          Boolean(dropped.silenced),
          this._eyePos,
          this._tmpThrowDir
        );
        this.inventory.primary = null;
        this.inventory.activeSlot = this.inventory.secondary ? 'secondary' : 'knife';
        this.weaponSelectTimer = 2.2;
        this.weaponController.equip(this.inventory.getActiveWeapon());
        this.emitHudSnapshot();
      } else if (this.inventory.activeSlot === 'secondary' && this.inventory.secondary) {
        const dropped = this.inventory.secondary;
        this.camera.getWorldPosition(this._eyePos);
        this.camera.getWorldDirection(this._tmpThrowDir);
        this.spawnDroppedWeapon(
          dropped.id,
          dropped.ammoInMag,
          dropped.ammoReserve,
          Boolean(dropped.silenced),
          this._eyePos,
          this._tmpThrowDir
        );
        this.inventory.secondary = null;
        this.inventory.activeSlot = this.inventory.primary ? 'primary' : 'knife';
        this.weaponSelectTimer = 2.2;
        this.weaponController.equip(this.inventory.getActiveWeapon());
        this.emitHudSnapshot();
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys[e.code] = false;
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (this.engineMode !== 'MATCH' || !this.isPointerLocked || this.buyMenuOpen || this.pauseMenuOpen) return;
    if (!this.playerHealth.alive || this.isSpectatorMode) {
      if (this.spectatorMode === 'UPPER_OVERVIEW') {
        this.overviewYaw -= e.movementX * 0.0025;
      }
      return;
    }
    this.playerController.applyMouseDelta(e.movementX, e.movementY, this.weaponController.zoomLevel);
    this.weaponController.addSway(e.movementX, e.movementY);
  };

  private onMouseDown = (e: MouseEvent): void => {
    if (this.engineMode !== 'MATCH' || this.buyMenuOpen || this.pauseMenuOpen) return;

    if (!this.playerHealth.alive || this.isSpectatorMode) {
      if (e.target === this.renderer.domElement && !this.isPointerLocked && e.button === 0) {
        this.requestPointerLock();
      }
      if (e.button === 0) {
        this.cycleSpectatorTarget(1);
      } else if (e.button === 2) {
        this.cycleSpectatorTarget(-1);
      }
      return;
    }

    if (!this.isPointerLocked) {
      // Only lock if user clicked directly on canvas
      if (e.target === this.renderer.domElement) {
        this.requestPointerLock();
      }
      return;
    }
    if (e.button === 0) {
      this.mouseDownLeft = true;
      const inst = this.inventory.getActiveWeapon();
      if (this.roundManager.phase !== 'FREEZETIME' && this.playerHealth.alive) {
        this.firePlayerWeapon();
        // 3-round burst for Glock/FAMAS in burst mode
        if (inst.burstMode && inst.ammoInMag > 0) {
          const weaponId = inst.id;
          const fireBurstFollowup = () => {
            if (
              this.engineMode === 'MATCH' &&
              this.playerHealth.alive &&
              this.isPointerLocked &&
              !this.pauseMenuOpen &&
              !this.buyMenuOpen &&
              this.inventory.getActiveWeapon().id === weaponId
            ) {
              this.firePlayerWeapon();
            }
          };
          setTimeout(fireBurstFollowup, 90);
          setTimeout(fireBurstFollowup, 180);
        }
      }
    } else if (e.button === 2) {
      const inst = this.inventory.getActiveWeapon();
      if (inst.id === 'knife' && this.roundManager.phase !== 'FREEZETIME' && this.playerHealth.alive) {
        this.fireKnifeHeavyStab();
      } else {
        this.weaponController.tryToggleAltFire(inst);
      }
      this.emitHudSnapshot();
    }
  };

  private onMouseUp = (e: MouseEvent): void => {
    if (e.button === 0) {
      this.mouseDownLeft = false;
    }
  };

  private onWheel = (e: WheelEvent): void => {
    if (this.engineMode !== 'MATCH' || this.buyMenuOpen || this.pauseMenuOpen) return;
    if (!this.playerHealth.alive || this.isSpectatorMode) {
      if (this.spectatorMode === 'UPPER_OVERVIEW') {
        this.overviewHeight = THREE.MathUtils.clamp(this.overviewHeight + (e.deltaY > 0 ? 3.5 : -3.5), 16, 120);
      }
      return;
    }
    if (!this.isPointerLocked) return;
    this.inventory.cycleSlot(e.deltaY > 0 ? 1 : -1);
    this.weaponSelectTimer = 2.2;
    this.weaponController.equip(this.inventory.getActiveWeapon());
    this.emitHudSnapshot();
  };

  private onContextMenu = (e: MouseEvent): void => {
    if (this.engineMode === 'MATCH') e.preventDefault();
  };
}
