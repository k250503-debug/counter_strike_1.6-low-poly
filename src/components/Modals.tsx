import { useState } from 'react';
import { Globe, Monitor, RotateCcw, Volume2, X } from 'lucide-react';
import { settingsManager } from '../game/SettingsManager';
import { SIMULATED_SERVERS } from '../game/WeaponDatabase';
import { BotDifficulty, GameSettings, ServerListing } from '../game/types';

export function MultiplayerModal({
  onJoinServer,
  onClose,
}: {
  onJoinServer: (srv: ServerListing) => void;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<'ALL' | 'bomb_defusal' | 'tdm' | 'dm'>('ALL');
  const rows = SIMULATED_SERVERS.filter((s) => filter === 'ALL' || s.mode === filter);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/55">
      <div className="cs-panel w-full max-w-4xl p-5 flex flex-col gap-4 max-h-[85vh]">
        <div className="flex items-center justify-between border-b border-white/15 pb-3">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-[#f5b841]" />
            <h2 className="font-display text-2xl font-bold uppercase tracking-wider">
              Server Browser · Tactical Skirmish
            </h2>
          </div>
          <button onClick={onClose} className="cs-btn px-3 py-1.5 text-xs uppercase cursor-pointer flex items-center gap-1">
            <X className="w-3.5 h-3.5" /> Close
          </button>
        </div>

        <div className="flex items-center gap-2">
          {(['ALL', 'bomb_defusal', 'tdm', 'dm'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs uppercase border cursor-pointer ${
                filter === f
                  ? 'bg-[#f5b841]/25 border-[#f5b841] text-white'
                  : 'bg-white/[0.04] border-white/15 text-white/70 hover:text-white'
              }`}
            >
              {f === 'ALL' ? 'All Servers' : f === 'bomb_defusal' ? 'Bomb Defusal' : f.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto border border-white/15 bg-black/35">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/15 text-white/60 uppercase">
                <th className="p-3">Server Name</th>
                <th className="p-3">Map</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Players</th>
                <th className="p-3">Ping</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((srv) => (
                <tr key={srv.id} className="border-b border-white/10 hover:bg-white/[0.05]">
                  <td className="p-3 font-medium text-white">{srv.name}</td>
                  <td className="p-3 font-mono-tabular text-[#f5b841]">{srv.mapId}</td>
                  <td className="p-3 uppercase text-white/75">{srv.mode.replace('_', ' ')}</td>
                  <td className="p-3 font-mono-tabular">
                    {srv.players}/{srv.maxPlayers}
                  </td>
                  <td className="p-3 font-mono-tabular text-[#6ee77a]">{srv.ping}ms</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onJoinServer(srv)}
                      className="px-3.5 py-1.5 bg-[#f5b841] hover:bg-[#ffca5c] text-black font-bold uppercase text-[11px] cursor-pointer"
                    >
                      Connect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function SettingsModal({
  onApply,
  onClose,
}: {
  onApply: () => void;
  onClose: () => void;
}) {
  const [s, setS] = useState<GameSettings>(settingsManager.get());

  const update = (partial: Partial<GameSettings>) => {
    const next = settingsManager.update(partial);
    setS({ ...next });
    onApply();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      update({ fullscreen: true });
    } else {
      document.exitFullscreen?.().catch(() => {});
      update({ fullscreen: false });
    }
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/55">
      <div className="cs-panel w-full max-w-3xl p-5 flex flex-col gap-4 max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/15 pb-3">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wider">Game Settings</h2>
          <button onClick={onClose} className="cs-btn px-3 py-1.5 text-xs uppercase cursor-pointer flex items-center gap-1">
            <X className="w-3.5 h-3.5" /> Close
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Mouse & Gameplay */}
          <div className="border border-white/15 bg-black/30 p-4 flex flex-col gap-3">
            <div className="font-display text-base uppercase tracking-wider text-[#f5b841]">
              Aiming & Bots
            </div>

            <label className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span>Mouse Sensitivity</span>
                <span className="font-mono-tabular">{s.mouseSensitivity.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={4.0}
                step={0.1}
                value={s.mouseSensitivity}
                onChange={(e) => update({ mouseSensitivity: parseFloat(e.target.value) })}
              />
            </label>

            <label className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span>Field of View (FOV)</span>
                <span className="font-mono-tabular">{s.fov}°</span>
              </div>
              <input
                type="range"
                min={70}
                max={105}
                step={1}
                value={s.fov}
                onChange={(e) => update({ fov: parseInt(e.target.value, 10) })}
              />
            </label>

            <div className="flex flex-col gap-1">
              <span>Bot Difficulty</span>
              <div className="grid grid-cols-4 gap-1">
                {(['easy', 'normal', 'hard', 'expert'] as BotDifficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => update({ botDifficulty: d })}
                    className={`py-1.5 uppercase border cursor-pointer ${
                      s.botDifficulty === d
                        ? 'bg-[#f5b841]/25 border-[#f5b841] text-white'
                        : 'bg-white/[0.04] border-white/15 text-white/70'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Audio */}
          <div className="border border-white/15 bg-black/30 p-4 flex flex-col gap-3">
            <div className="font-display text-base uppercase tracking-wider text-[#f5b841] flex items-center gap-2">
              <Volume2 className="w-4 h-4" /> Audio
            </div>

            <label className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span>Sound Effects Volume</span>
                <span className="font-mono-tabular">{Math.round(s.soundVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={s.soundVolume}
                onChange={(e) => update({ soundVolume: parseFloat(e.target.value) })}
              />
            </label>

            <label className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span>Menu Music Volume</span>
                <span className="font-mono-tabular">{Math.round(s.musicVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={s.musicVolume}
                onChange={(e) => update({ musicVolume: parseFloat(e.target.value) })}
              />
            </label>
          </div>

          {/* Video */}
          <div className="border border-white/15 bg-black/30 p-4 flex flex-col gap-3">
            <div className="font-display text-base uppercase tracking-wider text-[#f5b841] flex items-center gap-2">
              <Monitor className="w-4 h-4" /> Graphics & Display
            </div>

            <div className="flex flex-col gap-1">
              <span>Graphics Quality</span>
              <div className="grid grid-cols-3 gap-1">
                {(['low', 'medium', 'high'] as const).map((q) => (
                  <button
                    key={q}
                    onClick={() => update({ graphicsQuality: q })}
                    className={`py-1.5 uppercase border cursor-pointer ${
                      s.graphicsQuality === q
                        ? 'bg-[#f5b841]/25 border-[#f5b841] text-white'
                        : 'bg-white/[0.04] border-white/15 text-white/70'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span>Resolution Scale</span>
                <span className="font-mono-tabular">{Math.round(s.resolutionScale * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={1.0}
                step={0.1}
                value={s.resolutionScale}
                onChange={(e) => update({ resolutionScale: parseFloat(e.target.value) })}
              />
            </label>

            <div className="flex items-center justify-between">
              <button onClick={toggleFullscreen} className="cs-btn px-3 py-1.5 uppercase cursor-pointer">
                Toggle Fullscreen
              </button>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={s.showFps}
                  onChange={(e) => update({ showFps: e.target.checked })}
                />
                <span>Show FPS Counter</span>
              </label>
            </div>
          </div>

          {/* Crosshair */}
          <div className="border border-white/15 bg-black/30 p-4 flex flex-col gap-3">
            <div className="font-display text-base uppercase tracking-wider text-[#f5b841]">
              Crosshair Customization
            </div>

            <div className="flex flex-col gap-1">
              <span>Color</span>
              <div className="grid grid-cols-5 gap-1">
                {(['green', 'amber', 'cyan', 'white', 'red'] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => update({ crosshairColor: c })}
                    className={`py-1.5 uppercase border cursor-pointer ${
                      s.crosshairColor === c
                        ? 'bg-white/20 border-[#f5b841] text-white'
                        : 'bg-white/[0.04] border-white/15 text-white/70'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <span>Size</span>
              <div className="grid grid-cols-3 gap-1">
                {(['small', 'medium', 'large'] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => update({ crosshairSize: sz })}
                    className={`py-1.5 uppercase border cursor-pointer ${
                      s.crosshairSize === sz
                        ? 'bg-[#f5b841]/25 border-[#f5b841] text-white'
                        : 'bg-white/[0.04] border-white/15 text-white/70'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={s.crosshairDynamic}
                onChange={(e) => update({ crosshairDynamic: e.target.checked })}
              />
              <span>Dynamic Recoil/Movement Spread</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/15">
          <button
            onClick={() => {
              const reset = settingsManager.reset();
              setS({ ...reset });
              onApply();
            }}
            className="cs-btn px-4 py-2 text-xs uppercase flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#f5b841] text-black font-display text-lg font-bold uppercase tracking-wider cursor-pointer"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function ControlsModal({ onClose }: { onClose: () => void }) {
  const [s, setS] = useState<GameSettings>(settingsManager.get());
  const [listeningKey, setListeningKey] = useState<keyof GameSettings['keybinds'] | null>(null);

  const rebind = (field: keyof GameSettings['keybinds']) => {
    setListeningKey(field);
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      const next = settingsManager.update({
        keybinds: { ...s.keybinds, [field]: e.code },
      });
      setS({ ...next });
      setListeningKey(null);
      window.removeEventListener('keydown', handler);
    };
    window.addEventListener('keydown', handler, { once: true });
  };

  const rows: { key: keyof GameSettings['keybinds']; label: string }[] = [
    { key: 'forward', label: 'Move Forward' },
    { key: 'backward', label: 'Move Backward' },
    { key: 'left', label: 'Strafe Left' },
    { key: 'right', label: 'Strafe Right' },
    { key: 'jump', label: 'Jump' },
    { key: 'crouch', label: 'Crouch' },
    { key: 'walk', label: 'Walk (Silent)' },
    { key: 'reload', label: 'Reload Weapon' },
    { key: 'use', label: 'Plant / Defuse C4' },
    { key: 'buy', label: 'Buy Menu' },
    { key: 'drop', label: 'Drop Primary' },
    { key: 'scoreboard', label: 'Scoreboard' },
  ];

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/55">
      <div className="cs-panel w-full max-w-2xl p-5 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-white/15 pb-3">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wider">
            Controls & Keybindings
          </h2>
          <button onClick={onClose} className="cs-btn px-3 py-1.5 text-xs uppercase cursor-pointer flex items-center gap-1">
            <X className="w-3.5 h-3.5" /> Close
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {rows.map((r) => (
            <div
              key={r.key}
              className="flex items-center justify-between border border-white/12 bg-black/30 px-3 py-2"
            >
              <span className="text-white/85">{r.label}</span>
              <button
                onClick={() => rebind(r.key)}
                className="font-mono-tabular px-2.5 py-1 border border-white/25 bg-white/[0.06] hover:border-[#f5b841] cursor-pointer"
              >
                {listeningKey === r.key ? 'Press key...' : s.keybinds[r.key]}
              </button>
            </div>
          ))}
        </div>

        <div className="border border-white/12 bg-black/30 p-3 text-xs text-white/75 grid grid-cols-2 gap-2">
          <div><span className="text-[#f5b841] font-mono-tabular">Left Click:</span> Fire / Throw / Slash</div>
          <div><span className="text-[#f5b841] font-mono-tabular">Right Click:</span> Scope / Silencer / Burst</div>
          <div><span className="text-[#f5b841] font-mono-tabular">1 - 5 Keys:</span> Select Weapon Slot</div>
          <div><span className="text-[#f5b841] font-mono-tabular">Mouse Wheel:</span> Cycle Weapons</div>
        </div>
      </div>
    </div>
  );
}

export function AboutModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/55">
      <div className="cs-panel w-full max-w-xl p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-white/15 pb-3">
          <h2 className="font-display text-2xl font-bold uppercase tracking-wider">
            About This Remake
          </h2>
          <button onClick={onClose} className="cs-btn px-3 py-1.5 text-xs uppercase cursor-pointer flex items-center gap-1">
            <X className="w-3.5 h-3.5" /> Close
          </button>
        </div>

        <p className="text-sm text-white/80 leading-relaxed">
          <strong className="text-white">Counter-Strike 1.6 — Low-Poly Cinematic Remake</strong> is a
          browser-native tactical first-person shooter combining classic Counter-Strike round
          economy, recoil control, bombsite strategy, and transparent HUD aesthetics with modern
          procedural low-poly 3D graphics and Web Audio sound synthesis.
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs text-white/75 border-t border-white/15 pt-3">
          <div>· 8 Playable Classic Maps</div>
          <div>· 25+ Weapons & Equipment</div>
          <div>· Articulated 1st-Person Hands</div>
          <div>· 4 Difficulty Tactical Bots</div>
          <div>· Bomb Defusal, TDM, DM, Practice</div>
          <div>· Procedural Web Audio Acoustics</div>
        </div>
      </div>
    </div>
  );
}
