import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Layers, MapPin, Shield } from 'lucide-react';
import { MAPS_METADATA } from '../game/WeaponDatabase';
import { BotDifficulty, GameMode, MapId } from '../game/types';
import { MapPreviewCanvas } from './MapPreviewCanvas';

interface MapSelectionProps {
  selectedMap: MapId;
  selectedMode: GameMode;
  botDifficulty: BotDifficulty;
  onBack: () => void;
  onConfirm: (config: { mapId: MapId; mode: GameMode; botDifficulty: BotDifficulty }) => void;
}

type CategoryFilter = 'ALL' | 'Bomb Defusal' | 'Hostage Rescue';

const MODES: { id: GameMode; label: string; short: string }[] = [
  { id: 'bomb_defusal', label: 'Bomb Defusal (5v5)', short: 'Classic economy, C4 plant & defuse' },
  { id: 'tdm', label: 'Team Deathmatch', short: 'Fast 3s respawns, score race' },
  { id: 'dm', label: 'Deathmatch (FFA)', short: 'Free-for-all combat' },
  { id: 'practice', label: 'Practice Bots', short: 'Sandbox with full starting funds' },
];

export function MapSelection({
  selectedMap,
  selectedMode,
  botDifficulty,
  onBack,
  onConfirm,
}: MapSelectionProps) {
  const [mapId, setMapId] = useState<MapId>(selectedMap);
  const [mode, setMode] = useState<GameMode>(selectedMode);
  const [difficulty, setDifficulty] = useState<BotDifficulty>(botDifficulty);
  const [filter, setFilter] = useState<CategoryFilter>('ALL');

  const filteredMaps = useMemo(() => {
    if (filter === 'ALL') return MAPS_METADATA;
    return MAPS_METADATA.filter((m) => m.modeTag === filter);
  }, [filter]);

  const activeMap = MAPS_METADATA.find((m) => m.id === mapId) ?? MAPS_METADATA[0];
  const defusalCount = MAPS_METADATA.filter((m) => m.modeTag === 'Bomb Defusal').length;
  const hostageCount = MAPS_METADATA.filter((m) => m.modeTag === 'Hostage Rescue').length;

  return (
    <div className="fixed inset-0 z-10 flex flex-col justify-between p-4 md:p-6 bg-[#0a0d11]/92 overflow-y-auto">
      {/* Header */}
      <div className="max-w-7xl w-full mx-auto flex flex-wrap items-center justify-between gap-3 bg-[#11161d] border border-white/15 px-5 py-3 shrink-0">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-[#f5b841] shrink-0" />
          <div>
            <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wider text-white leading-none">
              Theater &amp; Map Selection
            </h2>
            <p className="text-xs text-white/65 mt-1">
              {MAPS_METADATA.length} full-scale Counter-Strike 1.6 environments · {defusalCount} Bomb Defusal · {hostageCount} Hostage Rescue
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-white/[0.05] hover:bg-white/12 border border-white/20 hover:border-white/45 text-xs uppercase tracking-wider text-white flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Main Menu
        </button>
      </div>

      {/* Main Split Workspace: Left Catalog + Right 3D Architectural Preview */}
      <div className="max-w-7xl w-full mx-auto flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 my-3">
        {/* Left: Category Filters & Scrollable Map Roster */}
        <div className="lg:col-span-5 bg-[#11161d] border border-white/15 p-3.5 flex flex-col min-h-[380px] max-h-[calc(100vh-210px)]">
          {/* Category Filter Tabs */}
          <div className="grid grid-cols-3 gap-1.5 pb-3 border-b border-white/12 shrink-0">
            {(
              [
                { id: 'ALL', label: `All (${MAPS_METADATA.length})` },
                { id: 'Bomb Defusal', label: `Bomb Defusal (${defusalCount})` },
                { id: 'Hostage Rescue', label: `Hostage (${hostageCount})` },
              ] as { id: CategoryFilter; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-2 py-1.5 text-[11px] font-display uppercase tracking-wider border transition-colors whitespace-nowrap cursor-pointer ${
                  filter === tab.id
                    ? 'bg-[#f5b841]/25 border-[#f5b841] text-white font-semibold'
                    : 'bg-white/[0.03] border-white/15 text-white/65 hover:text-white hover:border-white/35'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Scrollable Map Cards */}
          <div className="flex-1 overflow-y-auto pr-1 mt-2.5 flex flex-col gap-2">
            {filteredMaps.map((m) => {
              const isSelected = m.id === mapId;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMapId(m.id)}
                  className={`w-full text-left p-3 border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-white/12 border-[#f5b841]'
                      : 'bg-white/[0.03] border-white/12 hover:bg-white/[0.07] hover:border-white/35'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 shrink-0"
                        style={{ backgroundColor: m.accentHex }}
                      />
                      <span className="font-mono-tabular text-sm font-bold text-white">
                        {m.name}
                      </span>
                      <span className="font-display text-sm uppercase tracking-wide text-white/75 truncate">
                        {m.displayName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-mono-tabular uppercase tracking-wider ${
                          m.modeTag === 'Bomb Defusal' ? 'text-[#f5b841]' : 'text-[#7eb6ff]'
                        }`}
                      >
                        {m.modeTag}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-[#f5b841]" />}
                    </div>
                  </div>
                  <p className="text-xs text-white/65 mt-1.5 leading-snug line-clamp-2">
                    {m.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Large 3D Map Preview & Tactical Briefing */}
        <div className="lg:col-span-7 bg-[#11161d] border border-white/15 p-3.5 flex flex-col gap-3 min-h-[420px] max-h-[calc(100vh-210px)]">
          {/* Map Title Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/12 pb-2.5 shrink-0">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-display text-2xl font-bold uppercase tracking-wide text-white leading-none">
                  {activeMap.displayName}
                </h3>
                <span className="font-mono-tabular text-xs text-white/60">
                  {activeMap.name}
                </span>
              </div>
              <div className="text-xs text-white/70 mt-1">
                {activeMap.modeTag} · {activeMap.environment}
                {activeMap.dimensions ? ` · ${activeMap.dimensions}` : ''}
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono-tabular text-white/70">
              <Layers className="w-3.5 h-3.5 text-[#f5b841]" />
              <span>Interactive Full-Scale 3D Preview</span>
            </div>
          </div>

          {/* Interactive 3D Map Viewport */}
          <div className="flex-1 min-h-[240px] border border-white/15 overflow-hidden">
            <MapPreviewCanvas mapId={mapId} />
          </div>

          {/* Callouts & Match Rules Bar */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 shrink-0">
            <div className="md:col-span-7 bg-black/35 border border-white/10 p-2.5">
              <div className="text-[11px] font-mono-tabular uppercase tracking-wider text-white/55 mb-1">
                Key Tactical Areas
              </div>
              <p className="text-xs text-white/85 leading-relaxed">
                {(activeMap.calloutsHighlight || []).join(' · ')}
              </p>
              <p className="text-xs text-white/60 mt-1 leading-snug">
                {activeMap.description}
              </p>
            </div>

            <div className="md:col-span-5 bg-black/35 border border-white/10 p-2.5 flex flex-col justify-between gap-2">
              <div>
                <div className="text-[11px] font-mono-tabular uppercase tracking-wider text-white/55 mb-1">
                  Game Mode
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {MODES.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMode(m.id)}
                      className={`px-2 py-1 text-[11px] text-left border transition-colors truncate cursor-pointer ${
                        mode === m.id
                          ? 'bg-[#f5b841]/25 border-[#f5b841] text-white font-semibold'
                          : 'bg-white/[0.03] border-white/12 text-white/70 hover:text-white'
                      }`}
                      title={m.short}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
                <span className="text-[11px] font-mono-tabular uppercase text-white/60 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-[#f5b841]" />
                  Bots
                </span>
                <div className="flex gap-1">
                  {(['easy', 'normal', 'hard', 'expert'] as BotDifficulty[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`px-2 py-0.5 text-[10px] font-mono-tabular uppercase border cursor-pointer ${
                        difficulty === d
                          ? 'bg-[#f5b841]/25 border-[#f5b841] text-white font-semibold'
                          : 'bg-white/[0.04] border-white/15 text-white/65 hover:text-white'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="max-w-7xl w-full mx-auto flex flex-wrap items-center justify-between gap-3 bg-[#11161d] border border-white/15 px-5 py-3 shrink-0">
        <div className="text-xs text-white/70">
          Selected Theater:{' '}
          <span className="font-mono-tabular font-semibold text-white">{activeMap.name}</span> ({activeMap.displayName}) ·{' '}
          <span className="text-[#f5b841]">{activeMap.modeTag}</span>
        </div>

        <button
          type="button"
          onClick={() => onConfirm({ mapId, mode, botDifficulty: difficulty })}
          className="px-7 py-2.5 bg-[#f5b841] hover:bg-[#ffca5c] text-black font-display text-xl font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
        >
          <span>Select Team &amp; Loadout</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
