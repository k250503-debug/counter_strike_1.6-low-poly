import { create } from 'zustand';
import { settingsManager } from '../game/SettingsManager';
import {
  BotDifficulty,
  CharacterClassId,
  GameMode,
  GameScreen,
  GameSettings,
  HudSnapshot,
  MapId,
  Team,
} from '../game/types';

export type ActiveModal = 'NONE' | 'MULTIPLAYER' | 'SETTINGS' | 'CONTROLS' | 'ABOUT';

export interface PerformanceTelemetry {
  fps: number;
  frameMs: number;
  drawCalls: number;
  triangles: number;
  adaptiveScale: number;
}

export interface PhysicsColliderEntry {
  id: string;
  center: [number, number, number];
  halfExtents: [number, number, number];
}

export interface PhysicsImpulseProp {
  id: string;
  kind: 'crate' | 'barrel' | 'grenade';
  position: [number, number, number];
  velocity: [number, number, number];
  color: number;
  radius: number;
}

interface GameStoreState {
  screen: GameScreen;
  modal: ActiveModal;
  selectedTeam: Team;
  selectedMap: MapId;
  selectedMode: GameMode;
  selectedClass: CharacterClassId;
  botDifficulty: BotDifficulty;
  activeMenuMap: MapId;
  buyMenuOpen: boolean;
  pauseMenuOpen: boolean;
  hud: HudSnapshot | null;
  settings: GameSettings;
  perf: PerformanceTelemetry;
  physicsColliders: PhysicsColliderEntry[];
  physicsMapKey: string;
  webglLost: boolean;

  setScreen: (screen: GameScreen) => void;
  setModal: (modal: ActiveModal) => void;
  setSelectedTeam: (team: Team) => void;
  setSelectedMap: (mapId: MapId) => void;
  setSelectedMode: (mode: GameMode) => void;
  setSelectedClass: (classId: CharacterClassId) => void;
  setBotDifficulty: (difficulty: BotDifficulty) => void;
  setActiveMenuMap: (mapId: MapId) => void;
  setBuyMenuOpen: (open: boolean) => void;
  setPauseMenuOpen: (open: boolean) => void;
  setHud: (hud: HudSnapshot | null) => void;
  syncSettings: (settings: GameSettings) => void;
  setPerf: (perf: PerformanceTelemetry) => void;
  setPhysicsWorld: (mapKey: string, colliders: PhysicsColliderEntry[]) => void;
  setWebglLost: (lost: boolean) => void;
}

export const useGameStore = create<GameStoreState>((set) => ({
  screen: 'MENU',
  modal: 'NONE',
  selectedTeam: 'CT',
  selectedMap: 'de_dust2',
  selectedMode: 'bomb_defusal',
  selectedClass: 'classic_ct',
  botDifficulty: settingsManager.get().botDifficulty,
  activeMenuMap: 'de_dust2',
  buyMenuOpen: false,
  pauseMenuOpen: false,
  hud: null,
  settings: settingsManager.get(),
  perf: {
    fps: 60,
    frameMs: 16.6,
    drawCalls: 0,
    triangles: 0,
    adaptiveScale: 1.0,
  },
  physicsColliders: [],
  physicsMapKey: 'init',
  webglLost: false,

  setScreen: (screen) => set({ screen }),
  setModal: (modal) => set({ modal }),
  setSelectedTeam: (selectedTeam) => set({ selectedTeam }),
  setSelectedMap: (selectedMap) => set({ selectedMap }),
  setSelectedMode: (selectedMode) => set({ selectedMode }),
  setSelectedClass: (selectedClass) => set({ selectedClass }),
  setBotDifficulty: (botDifficulty) => set({ botDifficulty }),
  setActiveMenuMap: (activeMenuMap) => set({ activeMenuMap }),
  setBuyMenuOpen: (buyMenuOpen) => set({ buyMenuOpen }),
  setPauseMenuOpen: (pauseMenuOpen) => set({ pauseMenuOpen }),
  setHud: (hud) => set({ hud }),
  syncSettings: (settings) => set({ settings: { ...settings } }),
  setPerf: (perf) => set({ perf }),
  setPhysicsWorld: (physicsMapKey, physicsColliders) => set({ physicsMapKey, physicsColliders }),
  setWebglLost: (webglLost) => set({ webglLost }),
}));
