import { useState } from 'react';
import { ArrowLeft, Check, Crosshair, MapPin, Play } from 'lucide-react';
import { CHARACTER_CLASSES, MAPS_METADATA } from '../game/WeaponDatabase';
import { BotDifficulty, CharacterClassId, GameMode, MapId, Team } from '../game/types';
import { CharacterPreviewCanvas } from './CharacterPreviewCanvas';

interface ClassSelectionProps {
  team: Team;
  selectedMap: MapId;
  selectedMode: GameMode;
  botDifficulty: BotDifficulty;
  onBack: () => void;
  onDeploy: (config: {
    classId: CharacterClassId;
    mapId: MapId;
    mode: GameMode;
    botDifficulty: BotDifficulty;
  }) => void;
}

const T_CLASS_IDS: CharacterClassId[] = ['classic_t', 'desert_t', 'urban_t', 'military_t'];
const CT_CLASS_IDS: CharacterClassId[] = ['classic_ct', 'specops_ct', 'urban_ct', 'assault_ct'];

const MODES: { id: GameMode; label: string; desc: string }[] = [
  { id: 'bomb_defusal', label: 'Bomb Defusal (5v5)', desc: 'Classic round economy, C4 plant & defuse' },
  { id: 'tdm', label: 'Team Deathmatch', desc: 'Fast 3s respawns, team score race' },
  { id: 'dm', label: 'Deathmatch (FFA)', desc: 'Free-for-all combat against all bots' },
  { id: 'practice', label: 'Practice with Bots', desc: 'Tactical sandbox with full starting funds' },
];

export function ClassSelection({
  team,
  selectedMap,
  selectedMode,
  botDifficulty,
  onBack,
  onDeploy,
}: ClassSelectionProps) {
  const effectiveTeam: 'T' | 'CT' = team === 'T' ? 'T' : 'CT';
  const classIds = effectiveTeam === 'T' ? T_CLASS_IDS : CT_CLASS_IDS;

  const [classId, setClassId] = useState<CharacterClassId>(classIds[0]);
  const [mapId, setMapId] = useState<MapId>(selectedMap);
  const [mode, setMode] = useState<GameMode>(selectedMode);
  const [difficulty, setDifficulty] = useState<BotDifficulty>(botDifficulty);

  const activeClass = CHARACTER_CLASSES[classId];
  const activeMap = MAPS_METADATA.find((m) => m.id === mapId) || MAPS_METADATA[0];

  return (
    <div className="fixed inset-0 z-10 flex flex-col justify-between p-5 md:p-8 bg-black/50 overflow-y-auto">
      {/* Header */}
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between cs-panel px-5 py-3 shrink-0">
        <div className="flex items-center gap-4">
          <span
            className={`font-display text-2xl md:text-3xl font-bold uppercase tracking-wider ${
              effectiveTeam === 'T' ? 'text-[#f0a854]' : 'text-[#7eb6ff]'
            }`}
          >
            {team === 'SPECTATOR'
              ? 'Spectator Deployment'
              : effectiveTeam === 'T'
              ? 'Terrorist Operative Selection'
              : 'Counter-Terrorist Unit Selection'}
          </span>
        </div>
        <button
          onClick={onBack}
          className="cs-btn px-4 py-2 text-xs uppercase tracking-wider text-white flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Change Team
        </button>
      </div>

      {/* Main 3-Column Selection Grid */}
      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5 my-4">
        {/* Left: 4 Character Classes */}
        <div className="lg:col-span-4 cs-panel p-4 flex flex-col gap-2.5">
          <h3 className="font-display text-lg uppercase tracking-wider text-white/80 border-b border-white/15 pb-2">
            1. Select Class Model
          </h3>
          {classIds.map((id, idx) => {
            const c = CHARACTER_CLASSES[id];
            const active = classId === id;
            return (
              <button
                key={id}
                onClick={() => setClassId(id)}
                className={`p-3 text-left border transition-all cursor-pointer ${
                  active
                    ? 'bg-white/15 border-[#f5b841]'
                    : 'bg-white/[0.03] border-white/15 hover:bg-white/[0.08] hover:border-white/35'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-lg font-semibold text-white">
                    {idx + 1}. {c.name}
                  </span>
                  {active && <Check className="w-4 h-4 text-[#f5b841]" />}
                </div>
                <div className="text-xs text-[#f5b841]/90 mt-0.5">{c.unit}</div>
                <p className="text-xs text-white/65 mt-1 leading-snug">{c.description}</p>
              </button>
            );
          })}
        </div>

        {/* Center: Live 3D Character Preview */}
        <div className="lg:col-span-4 cs-panel p-4 flex flex-col justify-between min-h-[360px]">
          <div className="flex items-center justify-between border-b border-white/15 pb-2">
            <div>
              <div className="font-display text-xl font-bold uppercase text-white">
                {activeClass.name}
              </div>
              <div className="text-xs text-white/65">{activeClass.unit}</div>
            </div>
            <Crosshair className="w-4 h-4 text-[#f5b841]" />
          </div>

          <div className="flex-1 my-2 bg-gradient-to-b from-white/[0.03] to-black/35 border border-white/10 overflow-hidden min-h-[260px]">
            <CharacterPreviewCanvas mode="character" classId={classId} />
          </div>

          <div className="text-xs text-white/70 flex items-center justify-between pt-2 border-t border-white/10">
            <span>Drag to rotate · Scroll to zoom</span>
            <span className="font-mono-tabular text-white/90">
              Map: {activeMap.name}
            </span>
          </div>
        </div>

        {/* Right: Map & Game Mode Picker */}
        <div className="lg:col-span-4 cs-panel p-4 flex flex-col gap-3">
          <h3 className="font-display text-lg uppercase tracking-wider text-white/80 border-b border-white/15 pb-2 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#f5b841]" />
            2. Map & Game Mode
          </h3>

          <div className="grid grid-cols-2 gap-1.5">
            {MAPS_METADATA.map((m) => (
              <button
                key={m.id}
                onClick={() => setMapId(m.id)}
                className={`px-3 py-2 text-left border transition-all cursor-pointer ${
                  mapId === m.id
                    ? 'bg-white/15 border-[#f5b841]'
                    : 'bg-white/[0.03] border-white/15 hover:bg-white/[0.08]'
                }`}
              >
                <div className="font-mono-tabular text-xs font-semibold text-white">{m.name}</div>
                <div className="text-[11px] text-white/60 truncate">{m.displayName}</div>
              </button>
            ))}
          </div>

          <p className="text-xs text-white/75 bg-black/30 border border-white/10 p-2.5 leading-snug">
            <span className="font-semibold text-white">{activeMap.environment}:</span>{' '}
            {activeMap.description}
          </p>

          <div className="grid grid-cols-2 gap-1.5">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`px-2.5 py-2 text-left border transition-all cursor-pointer ${
                  mode === m.id
                    ? 'bg-white/15 border-[#f5b841]'
                    : 'bg-white/[0.03] border-white/15 hover:bg-white/[0.08]'
                }`}
              >
                <div className="text-xs font-semibold text-white truncate">{m.label}</div>
                <div className="text-[10px] text-white/60 truncate">{m.desc}</div>
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-white/70 uppercase tracking-wider">Bot Difficulty</span>
            <div className="flex gap-1">
              {(['easy', 'normal', 'hard', 'expert'] as BotDifficulty[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-2.5 py-1 text-[11px] uppercase border cursor-pointer ${
                    difficulty === d
                      ? 'bg-[#f5b841]/25 border-[#f5b841] text-white'
                      : 'bg-white/[0.04] border-white/15 text-white/70 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Deploy Bar */}
      <div className="max-w-7xl w-full mx-auto flex items-center justify-between cs-panel px-5 py-3 shrink-0">
        <div className="text-xs text-white/70">
          Press <span className="font-mono-tabular text-white">[B]</span> in-game to open Buy Menu ·{' '}
          <span className="font-mono-tabular text-white">[WASD]</span> Move ·{' '}
          <span className="font-mono-tabular text-white">[E]</span> Plant/Defuse
        </div>
        <button
          onClick={() => onDeploy({ classId, mapId, mode, botDifficulty: difficulty })}
          className="px-7 py-2.5 bg-[#f5b841] hover:bg-[#ffca5c] text-black font-display text-xl font-bold uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Play className="w-4 h-4 fill-black" />
          Deploy Into Match
        </button>
      </div>
    </div>
  );
}
