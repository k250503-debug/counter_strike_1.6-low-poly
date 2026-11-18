import { ArrowLeft, Eye, Shuffle } from 'lucide-react';
import { Team } from '../game/types';
import { CharacterPreviewCanvas } from './CharacterPreviewCanvas';

interface TeamSelectionProps {
  onSelectTeam: (team: Team) => void;
  onBack: () => void;
}

export function TeamSelection({ onSelectTeam, onBack }: TeamSelectionProps) {
  return (
    <div className="fixed inset-0 z-10 flex flex-col justify-between p-6 md:p-10 bg-black/45">
      {/* Header */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between cs-panel px-5 py-3">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-bold tracking-wider uppercase text-white">
            Select Team
          </h2>
          <p className="text-xs text-white/70">
            Choose your faction to proceed to operative class & map deployment
          </p>
        </div>
        <button
          onClick={onBack}
          className="cs-btn px-4 py-2 text-xs font-medium uppercase tracking-wider text-white flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
      </div>

      {/* Left Terrorist / Right Counter-Terrorist Split */}
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 my-auto py-4">
        {/* LEFT: TERRORIST */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectTeam('T')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onSelectTeam('T');
          }}
          className="group cs-panel p-5 flex flex-col justify-between text-left hover:border-[#f0a854] transition-all cursor-pointer h-[440px]"
        >
          <div className="flex items-baseline justify-between border-b border-white/15 pb-3">
            <span className="font-display text-3xl font-bold tracking-wider uppercase text-[#f0a854]">
              1. Terrorist
            </span>
            <span className="text-xs uppercase tracking-widest text-white/60">Offensive Force</span>
          </div>

          <div className="relative flex-1 my-2 overflow-hidden bg-gradient-to-b from-white/[0.03] to-black/30 border border-white/10">
            <CharacterPreviewCanvas mode="character" classId="classic_t" />
            <span className="pointer-events-none absolute bottom-2 left-2.5 text-[10px] uppercase tracking-wider text-white/50">
              Drag to rotate · Scroll to zoom
            </span>
          </div>

          <p className="text-sm text-white/80 leading-relaxed">
            Infiltrate tactical strongholds, seize bombsites A or B, plant the C4 explosive, and
            eliminate Counter-Terrorist responders.
          </p>
        </div>

        {/* RIGHT: COUNTER-TERRORIST */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectTeam('CT')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onSelectTeam('CT');
          }}
          className="group cs-panel p-5 flex flex-col justify-between text-left hover:border-[#7eb6ff] transition-all cursor-pointer h-[440px]"
        >
          <div className="flex items-baseline justify-between border-b border-white/15 pb-3">
            <span className="font-display text-3xl font-bold tracking-wider uppercase text-[#7eb6ff]">
              2. Counter-Terrorist
            </span>
            <span className="text-xs uppercase tracking-widest text-white/60">Tactical Defense</span>
          </div>

          <div className="relative flex-1 my-2 overflow-hidden bg-gradient-to-b from-white/[0.03] to-black/30 border border-white/10">
            <CharacterPreviewCanvas mode="character" classId="classic_ct" />
            <span className="pointer-events-none absolute bottom-2 left-2.5 text-[10px] uppercase tracking-wider text-white/50">
              Drag to rotate · Scroll to zoom
            </span>
          </div>

          <p className="text-sm text-white/80 leading-relaxed">
            Hold key chokepoints, neutralize hostile squads, and defuse planted C4 charges before
            detonation.
          </p>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="max-w-6xl w-full mx-auto flex flex-wrap items-center justify-between gap-3 cs-panel px-5 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTeam(Math.random() < 0.5 ? 'T' : 'CT')}
            className="cs-btn px-5 py-2.5 text-sm font-display tracking-wider uppercase text-white flex items-center gap-2 cursor-pointer"
          >
            <Shuffle className="w-4 h-4 text-[#f5b841]" />
            Auto Select
          </button>
          <button
            onClick={() => onSelectTeam('SPECTATOR')}
            className="cs-btn px-5 py-2.5 text-sm font-display tracking-wider uppercase text-white/85 flex items-center gap-2 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-white/70" />
            Spectator
          </button>
        </div>

        <button
          onClick={onBack}
          className="cs-btn px-5 py-2.5 text-sm font-display tracking-wider uppercase text-white/80 cursor-pointer"
        >
          Back
        </button>
      </div>
    </div>
  );
}
