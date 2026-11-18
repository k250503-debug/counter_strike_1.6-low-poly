import { GameSettings } from './types';

const STORAGE_KEY = 'cs16_remake_settings_v1';

export const DEFAULT_SETTINGS: GameSettings = {
  mouseSensitivity: 1.2,
  graphicsQuality: 'high',
  resolutionScale: 1.0,
  fullscreen: false,
  soundVolume: 0.75,
  musicVolume: 0.35,
  crosshairColor: 'green',
  crosshairSize: 'medium',
  crosshairDynamic: true,
  botDifficulty: 'normal',
  showFps: true,
  fov: 82,
  keybinds: {
    forward: 'KeyW',
    backward: 'KeyS',
    left: 'KeyA',
    right: 'KeyD',
    jump: 'Space',
    crouch: 'ControlLeft',
    walk: 'ShiftLeft',
    reload: 'KeyR',
    use: 'KeyE',
    buy: 'KeyB',
    drop: 'KeyG',
    scoreboard: 'Tab',
  },
};

export class SettingsManager {
  private settings: GameSettings;
  private listeners: Set<(s: GameSettings) => void> = new Set();

  constructor() {
    this.settings = this.load();
  }

  private load(): GameSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_SETTINGS);
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        keybinds: {
          ...DEFAULT_SETTINGS.keybinds,
          ...(parsed.keybinds || {}),
        },
      };
    } catch {
      return structuredClone(DEFAULT_SETTINGS);
    }
  }

  public get(): GameSettings {
    return this.settings;
  }

  public update(partial: Partial<GameSettings>): GameSettings {
    this.settings = {
      ...this.settings,
      ...partial,
      keybinds: {
        ...this.settings.keybinds,
        ...(partial.keybinds || {}),
      },
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // Ignore storage quota errors
    }
    this.listeners.forEach((cb) => cb(this.settings));
    return this.settings;
  }

  public reset(): GameSettings {
    this.settings = structuredClone(DEFAULT_SETTINGS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      // Ignore
    }
    this.listeners.forEach((cb) => cb(this.settings));
    return this.settings;
  }

  public subscribe(cb: (s: GameSettings) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
}

export const settingsManager = new SettingsManager();
