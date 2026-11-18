export type Team = 'T' | 'CT' | 'SPECTATOR';

export type GameScreen =
  | 'MENU'
  | 'MAP_SELECT'
  | 'MULTIPLAYER'
  | 'TEAM_SELECT'
  | 'CLASS_SELECT'
  | 'PLAYING'
  | 'EXIT_STANDBY';

export type GameMode = 'bomb_defusal' | 'tdm' | 'dm' | 'practice';

export type BotDifficulty = 'easy' | 'normal' | 'hard' | 'expert';

export type MapId =
  | 'de_dust2'
  | 'de_inferno'
  | 'de_nuke'
  | 'de_train'
  | 'de_aztec'
  | 'de_dust'
  | 'de_cbble'
  | 'de_mirage'
  | 'cs_office'
  | 'cs_assault'
  | 'cs_italy'
  | 'cs_militia';

export type CharacterClassId =
  | 'classic_t'
  | 'desert_t'
  | 'urban_t'
  | 'military_t'
  | 'classic_ct'
  | 'specops_ct'
  | 'urban_ct'
  | 'assault_ct';

export interface CharacterClassDef {
  id: CharacterClassId;
  team: 'T' | 'CT';
  name: string;
  unit: string;
  description: string;
  primaryColor: number;
  secondaryColor: number;
  accentColor: number;
  skinColor: number;
  headgear: 'balaclava' | 'shemagh' | 'ski_mask' | 'bandana' | 'helmet_goggles' | 'helmet_visor' | 'gas_mask' | 'riot_visor';
  defaultWeapon: WeaponId;
}

export type WeaponCategory =
  | 'pistols'
  | 'shotguns'
  | 'smgs'
  | 'rifles'
  | 'machineguns'
  | 'equipment';

export type WeaponSlot = 'primary' | 'secondary' | 'knife' | 'grenade' | 'c4';

export type WeaponId =
  | 'knife'
  | 'glock18'
  | 'usp'
  | 'deagle'
  | 'p228'
  | 'fiveseven'
  | 'elite'
  | 'm3'
  | 'xm1014'
  | 'mp5'
  | 'tmp'
  | 'mac10'
  | 'ump45'
  | 'p90'
  | 'ak47'
  | 'm4a1'
  | 'aug'
  | 'sg552'
  | 'galil'
  | 'famas'
  | 'scout'
  | 'awp'
  | 'g3sg1'
  | 'sg550'
  | 'm249'
  | 'hegrenade'
  | 'flashbang'
  | 'smokegrenade'
  | 'c4'
  | 'kevlar'
  | 'kevlar_helmet'
  | 'defuse_kit';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  shortName: string;
  category: WeaponCategory;
  slot: WeaponSlot | 'gear';
  price: number;
  team: 'BOTH' | 'T' | 'CT';
  damage: number;
  armorPenetration: number; // 0..1
  fireRateRPM: number;
  automatic: boolean;
  magazineSize: number;
  reserveMax: number;
  reloadTime: number; // seconds
  baseSpread: number;
  moveSpread: number;
  recoilKick: number;
  recoilHorizontal: number;
  moveSpeedMultiplier: number;
  range: number;
  pellets?: number;
  zoomFov?: number; // e.g. 45 or 20 for scoped
  hasSecondZoom?: boolean;
  silencerAvailable?: boolean;
  burstAvailable?: boolean;
  description: string;
  caliber: string;
}

export interface WeaponInstance {
  id: WeaponId;
  ammoInMag: number;
  ammoReserve: number;
  silenced?: boolean;
  burstMode?: boolean;
}

export type RoundPhase =
  | 'FREEZETIME'
  | 'BUY_AND_LIVE'
  | 'LIVE'
  | 'BOMB_PLANTED'
  | 'ROUND_END'
  | 'MATCH_END';

export interface KillFeedEntry {
  id: string;
  killerName: string;
  killerTeam: 'T' | 'CT';
  victimName: string;
  victimTeam: 'T' | 'CT';
  weaponName: string;
  headshot: boolean;
  timestamp: number;
}

export interface ScoreboardRow {
  id: string;
  name: string;
  team: 'T' | 'CT';
  alive: boolean;
  kills: number;
  deaths: number;
  money: number;
  isPlayer: boolean;
  hasBomb?: boolean;
  hasDefuseKit?: boolean;
}

export interface RadarBlip {
  x: number; // normalized or world
  z: number;
  team: 'T' | 'CT' | 'BOMB';
  isPlayer?: boolean;
  yaw?: number;
}

export interface RadioEntry {
  id: string;
  sender: string;
  team: 'T' | 'CT';
  message: string;
  timestamp: number;
}

export interface HudSnapshot {
  health: number;
  armor: number;
  hasHelmet: boolean;
  hasDefuseKit: boolean;
  hasC4: boolean;
  money: number;
  inBuyZone: boolean;
  inBuyPeriod: boolean;
  inBombsite: 'A' | 'B' | null;
  activeSlot: WeaponSlot;
  activeWeaponId: WeaponId;
  activeWeaponName: string;
  ammoInMag: number;
  ammoReserve: number;
  isReloading: boolean;
  reloadProgress: number;
  zoomLevel: 0 | 1 | 2;
  silenced: boolean;
  burstMode: boolean;
  crosshairSpread: number;
  weaponSelectTimer: number;
  grenades: {
    he: number;
    flash: number;
    smoke: number;
  };
  slots: {
    primary: WeaponId | null;
    secondary: WeaponId | null;
    knife: WeaponId;
    grenade: WeaponId | null;
    c4: boolean;
  };
  roundNumber: number;
  roundPhase: RoundPhase;
  roundTimer: number;
  bombTimer: number;
  bombPlantedSite: 'A' | 'B' | null;
  tScore: number;
  ctScore: number;
  playerTeam: 'T' | 'CT' | 'SPECTATOR';
  playerAlive: boolean;
  isSpectator: boolean;
  spectatorMode: 'DEATH_CAM' | 'UPPER_OVERVIEW' | 'CHASE_CAM' | 'FIRST_PERSON';
  spectatorTargetName: string | null;
  spectatorTargetTeam: 'T' | 'CT' | null;
  spectatorTargetHealth: number;
  killedByName: string | null;
  killedByWeapon: string | null;
  respawnTimer: number;
  plantProgress: number;
  defuseProgress: number;
  roundBanner: {
    title: string;
    subtitle: string;
    winner: 'T' | 'CT' | 'DRAW' | null;
  } | null;
  killFeed: KillFeedEntry[];
  radioLog: RadioEntry[];
  targetId: {
    name: string;
    team: 'T' | 'CT';
    health: number;
    isFriend: boolean;
  } | null;
  scoreboard: ScoreboardRow[];
  hitMarkerTimer: number;
  damageIndicatorTimer: number;
  bloodOverlayAlpha: number;
  flashAlpha: number;
  smokeOverlayAlpha: number;
  isPointerLocked: boolean;
  fps: number;
  playerPos: { x: number; y: number; z: number; yaw: number };
  radarBlips: RadarBlip[];
  bombsites: { label: 'A' | 'B'; x: number; z: number }[];
  gameMode: GameMode;
  mapId: MapId;
  objectiveHint: string;
}

export interface GameSettings {
  mouseSensitivity: number; // 0.2 - 5.0
  graphicsQuality: 'low' | 'medium' | 'high';
  resolutionScale: number; // 0.5 - 1.0
  fullscreen: boolean;
  soundVolume: number; // 0 - 1
  musicVolume: number; // 0 - 1
  crosshairColor: 'green' | 'amber' | 'cyan' | 'white' | 'red';
  crosshairSize: 'small' | 'medium' | 'large';
  crosshairDynamic: boolean;
  botDifficulty: BotDifficulty;
  showFps: boolean;
  fov: number; // 75 - 105
  keybinds: {
    forward: string;
    backward: string;
    left: string;
    right: string;
    jump: string;
    crouch: string;
    walk: string;
    reload: string;
    use: string;
    buy: string;
    drop: string;
    inspect: string;
    scoreboard: string;
  };
}

export interface MapMeta {
  id: MapId;
  name: string;
  displayName: string;
  modeTag: 'Bomb Defusal' | 'Hostage Rescue';
  environment: string;
  description: string;
  accentHex: string;
  calloutsHighlight?: string[];
  dimensions?: string;
}

export interface ServerListing {
  id: string;
  name: string;
  mapId: MapId;
  mode: GameMode;
  players: number;
  maxPlayers: number;
  ping: number;
  region: string;
  difficulty: BotDifficulty;
}
