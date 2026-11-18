import { ChevronLeft, ChevronRight, Crosshair, Globe, Info, Keyboard, LogOut, MapPin, Play, Settings } from 'lucide-react';
import { audioManager } from '../game/AudioManager';
import { MAPS_METADATA } from '../game/WeaponDatabase';
import { MapId } from '../game/types';

interface MainMenuProps {
  activeMenuMap: MapId;
  onSelectMenuMap: (mapId: MapId) => void;
  onCycleMenuMap: (delta: number) => void;
  onPlay: () => void;
  onMultiplayer: () => void;
  onSettings: () => void;
  onControls: () => void;
  onAbout: () => void;
  onExit: () => void;
}

export function MainMenu({
  activeMenuMap,
  onSelectMenuMap,
  onCycleMenuMap,
  onPlay,
  onMultiplayer,
  onSettings,
  onControls,
  onAbout,
  onExit,
}: MainMenuProps) {
  const items = [
    { label: 'PLAY', icon: Play, onClick: onPlay, primary: true },
    { label: 'MULTIPLAYER', icon: Globe, onClick: onMultiplayer },
    { label: 'SETTINGS', icon: Settings, onClick: onSettings },
    { label: 'CONTROLS', icon: Keyboard, onClick: onControls },
    { label: 'ABOUT', icon: Info, onClick: onAbout },
    { label: 'EXIT', icon: LogOut, onClick: onExit },
  ];

  const activeMeta = MAPS_METADATA.find((m) => m.id === activeMenuMap) ?? MAPS_METADATA[0];

  const handleAction = (fn: () => void) => {
    audioManager.unlock();
    audioManager.startMenuMusic();
    audioManager.playBuyClick();
    fn();
  };

  return (
    <div className="fixed inset-0 z-10 flex flex-col justify-between p-6 md:p-12 pointer-events-none">
      {/* Subtle directional scrim for crisp white typography contrast while keeping 3D firefight vivid */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />

      {/* Header Brand Lockup */}
      <div className="relative z-10 max-w-xl pointer-events-auto">
        <div className="flex items-center gap-3 text-white/80 text-xs tracking-[0.22em] uppercase mb-2">
          <Crosshair className="w-4 h-4 text-[#f5b841]" />
          <span>Tactical First-Person Shooter</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Bespoke CS 1.6 Soldier-Crosshair Stencil Emblem */}
          <svg
            viewBox="0 0 64 64"
            className="w-14 h-14 md:w-16 md:h-16 shrink-0 drop-shadow-[0_2px_10px_rgba(245,184,65,0.45)]"
            aria-hidden="true"
          >
            <circle cx="32" cy="32" r="28" fill="rgba(12,15,18,0.65)" stroke="#f5b841" strokeWidth="2.5" />
            <line x1="32" y1="2" x2="32" y2="11" stroke="#f5b841" strokeWidth="2.5" />
            <line x1="32" y1="53" x2="32" y2="62" stroke="#f5b841" strokeWidth="2.5" />
            <line x1="2" y1="32" x2="11" y2="32" stroke="#f5b841" strokeWidth="2.5" />
            <line x1="53" y1="32" x2="62" y2="32" stroke="#f5b841" strokeWidth="2.5" />
            {/* Iconic CT Rifleman Stencil Silhouette */}
            <path
              d="M35 16c2.6 0 4.6 2 4.6 4.5 0 2.3-1.7 4.2-4 4.5l4.4 5.5 11.5-2.6 1 2.2-12 4.4-2.3 1.2 1.8 14.3h-4.5l-2.6-10.8-4.4 10.8h-4.5l4.8-14.6-4.2-5.6c-.8-1.1-.6-2.7.5-3.6l5-4.3c-.4-.7-.7-1.5-.7-2.4 0-2.5 2-4.5 4.6-4.5z"
              fill="#f5b841"
            />
          </svg>
          <div>
            <h1 className="font-display text-5xl md:text-7xl font-bold tracking-tight text-white uppercase leading-[0.92]">
              Counter<span className="text-[#f5b841]">-</span>Strike <span className="text-[#f5b841]">1.6</span>
            </h1>
            <div className="mt-1.5 flex items-center gap-3">
              <span className="h-[2px] w-10 bg-[#f5b841]" />
              <p className="text-xs md:text-sm text-white/75 tracking-[0.18em] uppercase">
                Tactical Cinematic Remaster
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Transparent Glass Navigation Panel */}
      <div className="relative z-10 w-full max-w-xs pointer-events-auto my-auto">
        <div className="cs-panel p-3 flex flex-col gap-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => handleAction(item.onClick)}
                className={`group w-full flex items-center justify-between px-4 py-3 text-left border transition-all duration-150 cursor-pointer ${
                  item.primary
                    ? 'bg-white/12 border-white/45 hover:bg-[#f5b841]/25 hover:border-[#f5b841]'
                    : 'bg-white/[0.04] border-white/15 hover:bg-white/12 hover:border-white/45'
                }`}
              >
                <span className="font-display text-xl tracking-wider font-semibold text-white group-hover:translate-x-1 transition-transform">
                  {item.label}
                </span>
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    item.primary ? 'text-[#f5b841]' : 'text-white/60 group-hover:text-white'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer: Left Audio/Deploy Hint + Right Live 8-Map Backdrop Selector */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 pointer-events-auto">
        <span className="text-xs text-white/60">
          Click anywhere or select Play to engage audio & deploy
        </span>

        <div className="cs-panel px-3 py-2.5 flex flex-col gap-2 max-w-xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-[#f5b841] shrink-0" />
              <span className="font-mono-tabular text-[11px] uppercase tracking-wider text-white/60">
                Live Scene
              </span>
              <span className="font-display text-sm tracking-wide font-semibold text-white truncate">
                {activeMeta.name}
              </span>
              <span className="hidden sm:inline text-xs text-white/55 truncate">
                — {activeMeta.environment}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                aria-label="Previous map backdrop"
                onClick={() => handleAction(() => onCycleMenuMap(-1))}
                className="p-1 border border-white/20 bg-white/[0.05] hover:bg-white/15 hover:border-white/50 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                aria-label="Next map backdrop"
                onClick={() => handleAction(() => onCycleMenuMap(1))}
                className="p-1 border border-white/20 bg-white/[0.05] hover:bg-white/15 hover:border-white/50 text-white/80 hover:text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
            {MAPS_METADATA.map((map) => {
              const isActive = map.id === activeMenuMap;
              return (
                <button
                  key={map.id}
                  type="button"
                  onClick={() => handleAction(() => onSelectMenuMap(map.id))}
                  className={`px-2 py-1 text-[11px] font-display uppercase tracking-wider border transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#f5b841]/25 border-[#f5b841] text-white font-semibold'
                      : 'bg-white/[0.04] border-white/15 text-white/65 hover:bg-white/12 hover:border-white/40 hover:text-white'
                  }`}
                >
                  {map.displayName}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

