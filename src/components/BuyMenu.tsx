import { useEffect, useState } from 'react';
import { Lock, ShoppingCart, X } from 'lucide-react';
import { WEAPON_DATABASE } from '../game/WeaponDatabase';
import { HudSnapshot, WeaponCategory, WeaponId } from '../game/types';
import { CharacterPreviewCanvas } from './CharacterPreviewCanvas';

interface BuyMenuProps {
  hud: HudSnapshot;
  onBuy: (weaponId: WeaponId) => { ok: boolean; reason?: string };
  onClose: () => void;
}

const CATEGORIES: { id: WeaponCategory; num: number; label: string }[] = [
  { id: 'pistols', num: 1, label: 'Pistols' },
  { id: 'shotguns', num: 2, label: 'Shotguns' },
  { id: 'smgs', num: 3, label: 'SMGs' },
  { id: 'rifles', num: 4, label: 'Rifles' },
  { id: 'machineguns', num: 5, label: 'Machine Guns' },
  { id: 'equipment', num: 6, label: 'Equipment' },
];

const EQUIPMENT_IDS: WeaponId[] = [
  'kevlar',
  'kevlar_helmet',
  'hegrenade',
  'flashbang',
  'smokegrenade',
  'defuse_kit',
];

export function BuyMenu({ hud, onBuy, onClose }: BuyMenuProps) {
  const [category, setCategory] = useState<WeaponCategory>('rifles');
  const [selectedId, setSelectedId] = useState<WeaponId>(
    hud.playerTeam === 'T' ? 'ak47' : 'm4a1'
  );
  const [feedback, setFeedback] = useState<string>('');

  const items = Object.values(WEAPON_DATABASE).filter((w) => {
    if (category === 'equipment') return EQUIPMENT_IDS.includes(w.id);
    return w.category === category;
  });

  const selectedDef = WEAPON_DATABASE[selectedId];

  const canAfford = hud.money >= selectedDef.price;
  const teamAllowed = selectedDef.team === 'BOTH' || selectedDef.team === hud.playerTeam;
  const buyWindowOk = hud.gameMode !== 'bomb_defusal' || (hud.inBuyZone && hud.inBuyPeriod);

  const attemptBuy = (id: WeaponId) => {
    const res = onBuy(id);
    if (res.ok) {
      setFeedback(`Purchased ${WEAPON_DATABASE[id].shortName}`);
    } else {
      setFeedback(res.reason || 'Purchase unavailable');
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'KeyB') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.code.startsWith('Digit')) {
        const idx = Number(e.code.replace('Digit', '')) - 1;
        if (idx >= 0 && idx < items.length) {
          const item = items[idx];
          setSelectedId(item.id);
          attemptBuy(item.id);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [items, onClose]);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center p-4 bg-black/55">
      <div className="cs-panel w-full max-w-5xl p-5 flex flex-col gap-4 max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/15 pb-3">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5 text-[#f5b841]" />
            <div>
              <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-white">
                Buy Menu
              </h2>
              <div className="text-xs text-white/65">
                {buyWindowOk
                  ? 'Select category and weapon · Press [1-9] for quick purchase'
                  : !hud.inBuyPeriod
                  ? 'Buy period has ended for this round'
                  : 'Return to team buy zone to purchase gear'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="font-mono-tabular text-xl font-bold text-[#6ee77a]">
              ${hud.money}
            </div>
            <button
              onClick={onClose}
              className="cs-btn px-3 py-1.5 text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Close [B]
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setCategory(cat.id);
                const first = Object.values(WEAPON_DATABASE).find((w) =>
                  cat.id === 'equipment' ? EQUIPMENT_IDS.includes(w.id) : w.category === cat.id
                );
                if (first) setSelectedId(first.id);
              }}
              className={`px-3 py-2 text-xs font-display uppercase tracking-wider border text-left transition-colors cursor-pointer ${
                category === cat.id
                  ? 'bg-[#f5b841]/25 border-[#f5b841] text-white'
                  : 'bg-white/[0.04] border-white/15 text-white/75 hover:text-white'
              }`}
            >
              {cat.num}. {cat.label}
            </button>
          ))}
        </div>

        {/* Main Split: Weapon List + 3D Weapon Preview & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 overflow-y-auto">
          {/* List */}
          <div className="md:col-span-6 flex flex-col gap-1.5">
            {items.map((w, idx) => {
              const allowed = w.team === 'BOTH' || w.team === hud.playerTeam;
              const affordable = hud.money >= w.price;
              const active = selectedId === w.id;
              return (
                <button
                  key={w.id}
                  onClick={() => {
                    setSelectedId(w.id);
                  }}
                  onDoubleClick={() => attemptBuy(w.id)}
                  className={`px-3.5 py-2.5 border flex items-center justify-between text-left transition-all cursor-pointer ${
                    active
                      ? 'bg-white/14 border-[#f5b841]'
                      : 'bg-white/[0.03] border-white/12 hover:bg-white/[0.08]'
                  } ${!allowed ? 'opacity-45' : ''}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono-tabular text-xs text-white/50">{idx + 1}.</span>
                    <div>
                      <div className="text-sm font-medium text-white">{w.shortName}</div>
                      <div className="text-[11px] text-white/55">{w.caliber}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!allowed && <Lock className="w-3.5 h-3.5 text-white/50" />}
                    <span
                      className={`font-mono-tabular text-sm font-semibold ${
                        affordable ? 'text-[#6ee77a]' : 'text-red-400'
                      }`}
                    >
                      ${w.price}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* 3D Preview & Purchase */}
          <div className="md:col-span-6 border border-white/15 bg-black/35 p-4 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-2xl font-bold text-white uppercase">
                  {selectedDef.name}
                </h3>
                <span className="font-mono-tabular text-lg font-bold text-[#6ee77a]">
                  ${selectedDef.price}
                </span>
              </div>
              <p className="text-xs text-white/70 mt-1">{selectedDef.description}</p>
            </div>

            <div className="h-44 border border-white/10 bg-gradient-to-b from-white/[0.03] to-black/30 overflow-hidden">
              {selectedDef.slot === 'gear' ? (
                <div className="w-full h-full flex items-center justify-center text-white/70 font-display text-xl uppercase tracking-widest">
                  {selectedDef.shortName} · Tactical Gear
                </div>
              ) : (
                <CharacterPreviewCanvas mode="weapon" weaponId={selectedDef.id} />
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs font-mono-tabular bg-black/30 p-2.5 border border-white/10">
              <div>
                <div className="text-white/50">DMG</div>
                <div className="text-white font-semibold">{selectedDef.damage || '—'}</div>
              </div>
              <div>
                <div className="text-white/50">MAG / RES</div>
                <div className="text-white font-semibold">
                  {selectedDef.magazineSize > 0
                    ? `${selectedDef.magazineSize} / ${selectedDef.reserveMax}`
                    : '—'}
                </div>
              </div>
              <div>
                <div className="text-white/50">TEAM</div>
                <div className="text-white font-semibold">{selectedDef.team}</div>
              </div>
            </div>

            {feedback && (
              <div className="text-xs text-[#f5b841] font-medium">{feedback}</div>
            )}

            <button
              onClick={() => attemptBuy(selectedDef.id)}
              disabled={!canAfford || !teamAllowed || !buyWindowOk}
              className={`w-full py-2.5 font-display text-lg font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                canAfford && teamAllowed && buyWindowOk
                  ? 'bg-[#f5b841] hover:bg-[#ffca5c] text-black'
                  : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              {!teamAllowed
                ? `Restricted (${selectedDef.team} Only)`
                : !buyWindowOk
                ? 'Buy Period Closed'
                : !canAfford
                ? 'Insufficient Funds'
                : `Purchase ${selectedDef.shortName} ($${selectedDef.price})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
