import { useEffect, useState } from 'react';
import { Bomb, Heart, Shield, ShoppingCart, Skull, Wrench } from 'lucide-react';
import { settingsManager } from '../game/SettingsManager';
import { GameSettings, HudSnapshot } from '../game/types';

interface HUDProps {
  hud: HudSnapshot;
  onOpenBuyMenu: () => void;
  onClickToLock: () => void;
}

function formatClock(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, '0')}`;
}

export function HUD({ hud, onOpenBuyMenu, onClickToLock }: HUDProps) {
  const [settings, setSettings] = useState<GameSettings>(settingsManager.get());
  const [showScoreboard, setShowScoreboard] = useState(false);

  useEffect(() => {
    const unsub = settingsManager.subscribe(setSettings);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === settingsManager.get().keybinds.scoreboard) {
        e.preventDefault();
        setShowScoreboard(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === settingsManager.get().keybinds.scoreboard) {
        setShowScoreboard(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      unsub();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const crosshairColors: Record<GameSettings['crosshairColor'], string> = {
    green: '#4ade80',
    amber: '#f5b841',
    cyan: '#38bdf8',
    white: '#f8fafc',
    red: '#f87171',
  };
  const chColor = crosshairColors[settings.crosshairColor];
  const chLen = settings.crosshairSize === 'small' ? 7 : settings.crosshairSize === 'large' ? 14 : 10;
  const chGap =
    (settings.crosshairSize === 'small' ? 4 : settings.crosshairSize === 'large' ? 7 : 5) +
    (settings.crosshairDynamic ? Math.min(26, hud.crosshairSpread * 380) : 0);

  const isScoped =
    hud.zoomLevel > 0 &&
    (hud.activeWeaponId === 'awp' ||
      hud.activeWeaponId === 'scout' ||
      hud.activeWeaponId === 'g3sg1' ||
      hud.activeWeaponId === 'sg550');

  const buyAllowed =
    hud.gameMode !== 'bomb_defusal' || (hud.inBuyZone && hud.inBuyPeriod);

  return (
    <div className="fixed inset-0 z-10 pointer-events-none select-none">
      {/* Flashbang whiteout & Smoke cloud overlay */}
      {hud.flashAlpha > 0.01 && (
        <div
          className="fixed inset-0 bg-white pointer-events-none"
          style={{ opacity: Math.min(0.96, hud.flashAlpha) }}
        />
      )}
      {hud.smokeOverlayAlpha > 0.01 && (
        <div
          className="fixed inset-0 bg-[#9aa2ab] pointer-events-none"
          style={{ opacity: Math.min(0.82, hud.smokeOverlayAlpha) }}
        />
      )}

      {/* Blood Splatter & Damage Vignette */}
      {(hud.damageIndicatorTimer > 0 || hud.bloodOverlayAlpha > 0.02) && (
        <div
          className="fixed inset-0 pointer-events-none transition-opacity duration-75"
          style={{
            opacity: Math.max(hud.bloodOverlayAlpha, hud.damageIndicatorTimer > 0 ? 0.65 : 0),
            boxShadow: 'inset 0 0 135px rgba(155, 10, 14, 0.85)',
            background:
              'radial-gradient(circle at 50% 50%, rgba(120,0,0,0) 48%, rgba(110,6,10,0.42) 86%, rgba(65,2,4,0.72) 100%)',
          }}
        >
          <svg
            viewBox="0 0 1000 600"
            preserveAspectRatio="none"
            className="w-full h-full opacity-75"
          >
            <g fill="#7f090e">
              <circle cx="72" cy="84" r="24" />
              <circle cx="105" cy="64" r="11" />
              <circle cx="52" cy="126" r="9" />
              <ellipse cx="920" cy="95" rx="28" ry="18" transform="rotate(-24 920 95)" />
              <circle cx="884" cy="122" r="8" />
              <circle cx="948" cy="138" r="12" />
              <ellipse cx="118" cy="522" rx="34" ry="20" transform="rotate(18 118 522)" />
              <circle cx="76" cy="492" r="10" />
              <circle cx="164" cy="544" r="7" />
              <ellipse cx="892" cy="508" rx="30" ry="22" transform="rotate(-16 892 508)" />
              <circle cx="934" cy="472" r="9" />
              <circle cx="848" cy="536" r="11" />
            </g>
          </svg>
        </div>
      )}

      {/* Sniper Scope Overlay */}
      {isScoped && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative w-[100vmin] h-[100vmin] rounded-full border-[50vw] border-black box-content flex items-center justify-center">
            <div className="w-full h-[1px] bg-black/85 absolute" />
            <div className="h-full w-[1px] bg-black/85 absolute" />
            <div className="w-2 h-2 rounded-full bg-red-600" />
          </div>
        </div>
      )}

      {/* TOP LEFT: FPS Label + Classic Emerald-Green Circular Radar + Left-Edge Buy/Kit Icons */}
      <div className="absolute top-3 left-3 flex flex-col items-start gap-2">
        {settings.showFps && (
          <div className="font-mono-tabular text-[11px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] leading-none">
            {hud.fps} fps
          </div>
        )}

        {/* Classic CS 1.6 Emerald-Green Circular Radar */}
        <div className="relative w-28 h-28 rounded-full cs-green-radar overflow-hidden">
          {/* Range ring & cross axes */}
          <div className="absolute inset-3 rounded-full border border-[#a7e6ac]/20 pointer-events-none" />
          <div className="absolute inset-0 flex items-center justify-center opacity-35 pointer-events-none">
            <div className="w-full h-[1px] bg-[#b5f2ba]/60" />
            <div className="h-full w-[1px] bg-[#b5f2ba]/60 absolute" />
          </div>
          {/* Upward FOV Cone Wedge */}
          <svg
            viewBox="0 0 112 112"
            className="absolute inset-0 w-full h-full pointer-events-none opacity-25"
          >
            <polygon points="56,56 26,8 86,8" fill="#c7ffd0" />
          </svg>

          {/* Bombsites on radar */}
          {hud.bombsites.map((s) => {
            const dx = s.x - hud.playerPos.x;
            const dz = s.z - hud.playerPos.z;
            const cos = Math.cos(hud.playerPos.yaw);
            const sin = Math.sin(hud.playerPos.yaw);
            const rx = (dx * cos - dz * sin) * 1.15;
            const ry = (dx * sin + dz * cos) * 1.15;
            const clampedX = Math.max(-46, Math.min(46, rx));
            const clampedY = Math.max(-46, Math.min(46, ry));
            return (
              <span
                key={s.label}
                className="absolute text-[9px] font-bold text-[#f5b841] drop-shadow-[0_1px_1px_rgba(0,0,0,0.95)]"
                style={{
                  left: `calc(50% + ${clampedX}px - 4px)`,
                  top: `calc(50% + ${clampedY}px - 6px)`,
                }}
              >
                {s.label}
              </span>
            );
          })}
          {/* Teammates & Planted Bomb */}
          {hud.radarBlips.map((b, i) => {
            if (b.isPlayer) {
              return (
                <div
                  key="self"
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rotate-45 shadow-[0_0_4px_rgba(255,255,255,0.85)]"
                />
              );
            }
            const dx = b.x - hud.playerPos.x;
            const dz = b.z - hud.playerPos.z;
            const cos = Math.cos(hud.playerPos.yaw);
            const sin = Math.sin(hud.playerPos.yaw);
            const rx = Math.max(-46, Math.min(46, (dx * cos - dz * sin) * 1.15));
            const ry = Math.max(-46, Math.min(46, (dx * sin + dz * cos) * 1.15));
            return (
              <div
                key={i}
                className={`absolute w-1.5 h-1.5 rounded-full ${
                  b.team === 'BOMB'
                    ? 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.95)]'
                    : b.team === 'CT'
                    ? 'bg-[#86c5ff]'
                    : 'bg-[#ffd85a]'
                }`}
                style={{
                  left: `calc(50% + ${rx}px - 3px)`,
                  top: `calc(50% + ${ry}px - 3px)`,
                }}
              />
            );
          })}
        </div>

        {/* Left-Edge Utility Icons (Buy Zone Cart + Defuse Kit / C4) */}
        <div className="flex flex-col items-start gap-1.5 mt-1">
          <button
            onClick={onOpenBuyMenu}
            className={`pointer-events-auto px-2 py-1 flex items-center gap-1.5 text-xs transition-colors cursor-pointer bg-black/35 border ${
              buyAllowed
                ? 'border-[#4ade80]/70 text-[#59f06e] hover:bg-black/55'
                : 'border-white/15 text-white/45'
            }`}
            title="Open Buy Menu [B]"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="font-mono-tabular text-[11px] font-semibold">[B]</span>
          </button>

          {hud.hasDefuseKit && (
            <div
              className="px-2 py-1 bg-black/35 border border-[#59f06e]/50 flex items-center gap-1.5 text-[#59f06e]"
              title="Defusal Kit"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span className="font-mono-tabular text-[10px]">KIT</span>
            </div>
          )}
          {hud.hasC4 && (
            <div
              className="px-2 py-1 bg-black/35 border border-red-500/60 flex items-center gap-1.5 text-red-400"
              title="C4 Explosive"
            >
              <Bomb className="w-3.5 h-3.5" />
              <span className="font-mono-tabular text-[10px]">C4</span>
            </div>
          )}
        </div>
      </div>

      {/* TOP CENTER: Team Scores + Round Status */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
        <div className="cs-hud-box px-3 py-1 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-[#f0a854] font-semibold">T</span>
            <span className="font-mono-tabular text-base font-bold text-[#f0a854]">{hud.tScore}</span>
          </div>

          <div className="px-2.5 py-0.5 border-x border-white/15 flex items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-wider text-white/75 font-mono-tabular">
              R{hud.roundNumber}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-mono-tabular text-base font-bold text-[#7eb6ff]">{hud.ctScore}</span>
            <span className="text-[11px] uppercase tracking-wider text-[#7eb6ff] font-semibold">CT</span>
          </div>
        </div>

        <div className="text-[10px] tracking-wider uppercase text-white/75 bg-black/40 px-2 py-0.5 border border-white/10">
          {hud.roundPhase === 'BOMB_PLANTED'
            ? `C4 Armed · Site ${hud.bombPlantedSite}`
            : hud.roundPhase === 'FREEZETIME'
            ? 'Freeze Time · Prepare'
            : hud.mapId}
        </div>
      </div>

      {/* TOP RIGHT: Active Weapon + Crimson-Bordered Kill Feed */}
      <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 max-w-sm">
        <div className="bg-black/45 border border-white/15 px-2.5 py-1 flex items-center gap-2">
          <span className="font-display text-sm tracking-wider uppercase cs-amber-glow">
            {hud.activeWeaponName}
          </span>
          {hud.silenced && (
            <span className="text-[10px] text-white/70 border-l border-white/20 pl-2">SILENCED</span>
          )}
          {hud.burstMode && (
            <span className="text-[10px] text-white/70 border-l border-white/20 pl-2">BURST</span>
          )}
        </div>

        {/* Classic CS 1.6 Crimson-Bordered Kill Feed */}
        <div className="flex flex-col items-end gap-1">
          {hud.killFeed.map((kf) => (
            <div
              key={kf.id}
              className="cs-killfeed-row px-2.5 py-1 text-[11px] flex items-center gap-1.5 whitespace-nowrap"
            >
              <span className={kf.killerTeam === 'T' ? 'text-[#e85f52] font-semibold' : 'text-[#7eb6ff] font-semibold'}>
                {kf.killerName}
              </span>
              <span className="text-white/75 font-mono-tabular text-[10px]">[{kf.weaponName}]</span>
              {kf.headshot && <Skull className="w-3 h-3 text-red-400" />}
              <span className={kf.victimTeam === 'T' ? 'text-[#e85f52] font-semibold' : 'text-[#7eb6ff] font-semibold'}>
                {kf.victimName}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT EDGE: Vertical Weapon Selection Strip (fades in on weapon switch/buy) */}
      {hud.playerAlive && hud.weaponSelectTimer > 0 && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col items-end gap-1.5 pointer-events-none">
          {(
            [
              hud.slots.primary
                ? { slot: 'primary' as const, key: '1', label: 'PRIMARY', name: hud.slots.primary.toUpperCase() }
                : null,
              hud.slots.secondary
                ? { slot: 'secondary' as const, key: '2', label: 'PISTOL', name: hud.slots.secondary.toUpperCase() }
                : null,
              { slot: 'knife' as const, key: '3', label: 'KNIFE', name: 'KNIFE' },
              hud.slots.grenade
                ? { slot: 'grenade' as const, key: '4', label: 'GRENADE', name: hud.slots.grenade.toUpperCase() }
                : null,
              hud.slots.c4
                ? { slot: 'c4' as const, key: '5', label: 'C4', name: 'C4' }
                : null,
            ] as const
          )
            .filter((item): item is NonNullable<typeof item> => item !== null)
            .map((item) => {
              const active = hud.activeSlot === item.slot;
              return (
                <div
                  key={item.slot}
                  className={`px-2.5 py-1 border font-mono-tabular text-[11px] flex items-center gap-2 min-w-[132px] justify-between ${
                    active
                      ? 'border-[#f5b841] bg-[#f5b841]/20 cs-amber-glow'
                      : 'border-white/15 bg-black/45 text-[#f5b841]/65'
                  }`}
                >
                  <span className="font-bold">{item.key}</span>
                  <span className="tracking-wider font-display text-xs">
                    {active ? item.name : item.label}
                  </span>
                </div>
              );
            })}
        </div>
      )}

      {/* BOTTOM LEFT: Radio Log + Floating GoldSrc Amber Health & Armor */}
      <div className="absolute bottom-3 left-3 flex flex-col items-start gap-2">
        {hud.radioLog.length > 0 && (
          <div className="flex flex-col items-start gap-0.5 mb-1 max-w-md">
            {hud.radioLog.map((r) => (
              <div
                key={r.id}
                className="text-xs font-medium text-[#f5b841] drop-shadow-[0_1px_2px_rgba(0,0,0,0.98)] leading-snug"
              >
                {r.sender} (RADIO): {r.message}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2 bg-black/30 px-2.5 py-1 border border-white/10">
            <Heart className={`w-5 h-5 ${hud.health <= 25 ? 'text-red-500' : 'text-[#f5b841]'}`} />
            <span
              className={`font-mono-tabular text-3xl font-bold leading-none ${
                hud.health <= 25 ? 'text-red-400' : 'cs-amber-glow'
              }`}
            >
              {hud.health}
            </span>
          </div>

          <div className="flex items-center gap-2 bg-black/30 px-2.5 py-1 border border-white/10">
            <Shield className="w-5 h-5 text-[#f5b841]" />
            <span className="font-mono-tabular text-3xl font-bold leading-none cs-amber-glow">
              {hud.armor}
            </span>
            {hud.hasHelmet && (
              <span className="text-[11px] font-mono-tabular font-bold text-[#f5b841] border-l border-white/20 pl-1.5">
                +H
              </span>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM CENTER: Iconic GoldSrc Amber Round / C4 Timer */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/35 px-3 py-1 border border-white/10">
        {hud.roundPhase === 'BOMB_PLANTED' ? (
          <>
            <Bomb className="w-4 h-4 text-red-400" />
            <span className="font-mono-tabular text-2xl font-bold leading-none text-red-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
              {formatClock(hud.bombTimer)}
            </span>
          </>
        ) : (
          <span className="font-mono-tabular text-2xl font-bold leading-none cs-amber-glow">
            {formatClock(hud.roundTimer)}
          </span>
        )}
      </div>

      {/* BOTTOM RIGHT: Money + Magazine / Reserve Ammo & Grenade Counts */}
      <div className="absolute bottom-3 right-3 flex flex-col items-end gap-1.5">
        <div className="font-mono-tabular text-xl font-bold leading-none cs-amber-glow drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]">
          $ {hud.money}
        </div>

        <div className="flex items-center gap-2">
          {(hud.grenades.he > 0 || hud.grenades.flash > 0 || hud.grenades.smoke > 0) && (
            <div className="bg-black/35 border border-white/10 px-2 py-1 text-[11px] font-mono-tabular text-[#f5b841] flex items-center gap-2">
              {hud.grenades.he > 0 && <span>HE:{hud.grenades.he}</span>}
              {hud.grenades.flash > 0 && <span>FB:{hud.grenades.flash}</span>}
              {hud.grenades.smoke > 0 && <span>SM:{hud.grenades.smoke}</span>}
            </div>
          )}

          <div className="bg-black/35 border border-white/10 px-3 py-1 flex items-baseline gap-2">
            {hud.activeSlot === 'knife' || hud.activeSlot === 'c4' || hud.activeSlot === 'grenade' ? (
              <span className="font-mono-tabular text-2xl font-bold leading-none cs-amber-glow">
                {hud.activeWeaponName}
              </span>
            ) : (
              <>
                <span
                  className={`font-mono-tabular text-3xl font-bold leading-none ${
                    hud.ammoInMag === 0 ? 'text-red-400' : 'cs-amber-glow'
                  }`}
                >
                  {hud.ammoInMag}
                </span>
                <span className="text-[#f5b841]/55 text-lg font-bold">|</span>
                <span className="font-mono-tabular text-xl font-bold leading-none cs-amber-glow">
                  {hud.ammoReserve}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* CENTER: Crosshair, Target Identification, Reload Bar, Plant/Defuse Bar */}
      {hud.playerAlive && !isScoped && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative flex items-center justify-center">
            {/* Top */}
            <div
              className="absolute w-[2px]"
              style={{
                height: `${chLen}px`,
                backgroundColor: chColor,
                bottom: `${chGap}px`,
              }}
            />
            {/* Bottom */}
            <div
              className="absolute w-[2px]"
              style={{
                height: `${chLen}px`,
                backgroundColor: chColor,
                top: `${chGap}px`,
              }}
            />
            {/* Left */}
            <div
              className="absolute h-[2px]"
              style={{
                width: `${chLen}px`,
                backgroundColor: chColor,
                right: `${chGap}px`,
              }}
            />
            {/* Right */}
            <div
              className="absolute h-[2px]"
              style={{
                width: `${chLen}px`,
                backgroundColor: chColor,
                left: `${chGap}px`,
              }}
            />
            {/* Hitmarker X */}
            {hud.hitMarkerTimer > 0 && (
              <div className="absolute w-4 h-4 pointer-events-none">
                <div className="absolute inset-0 rotate-45 flex items-center justify-center">
                  <div className="w-4 h-[1.5px] bg-white" />
                </div>
                <div className="absolute inset-0 -rotate-45 flex items-center justify-center">
                  <div className="w-4 h-[1.5px] bg-white" />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Center Target Identification ("You have spotted a friend." / "Enemy spotted") */}
      {hud.playerAlive && hud.targetId && (
        <div
          className={`fixed left-1/2 -translate-x-1/2 top-[56%] text-sm font-semibold tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.98)] pointer-events-none ${
            hud.targetId.isFriend ? 'text-[#7ee368]' : 'text-[#f07058]'
          }`}
        >
          {hud.targetId.isFriend
            ? `You have spotted a friend · ${hud.targetId.name} (${hud.targetId.health} HP)`
            : `Enemy spotted · ${hud.targetId.name}`}
        </div>
      )}

      {/* Reload / Plant / Defuse Progress */}
      {(hud.isReloading || hud.plantProgress > 0 || hud.defuseProgress > 0) && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 cs-hud-box px-4 py-2 flex flex-col items-center gap-1 min-w-[200px]">
          <span className="text-xs uppercase tracking-wider text-white">
            {hud.plantProgress > 0
              ? 'Planting C4 Explosive...'
              : hud.defuseProgress > 0
              ? 'Defusing C4 Explosive...'
              : 'Reloading...'}
          </span>
          <div className="w-full h-1.5 bg-white/15 overflow-hidden">
            <div
              className="h-full bg-[#f5b841]"
              style={{
                width: `${Math.round(
                  (hud.plantProgress || hud.defuseProgress || hud.reloadProgress) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Objective Hint */}
      {hud.objectiveHint && hud.plantProgress === 0 && hud.defuseProgress === 0 && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 cs-hud-box px-4 py-1.5 text-xs font-semibold text-[#f5b841] tracking-wider uppercase">
          {hud.objectiveHint}
        </div>
      )}

      {/* Eliminated / CS 1.6 Spectator & Upper Overview Bar */}
      {!hud.playerAlive && (
        <>
          <div className="absolute top-24 left-1/2 -translate-x-1/2 cs-panel px-6 py-2.5 text-center min-w-[300px]">
            <div className="font-display text-lg uppercase tracking-wider text-red-400">
              {hud.isSpectator ? 'Spectator Mode' : 'Eliminated'}
            </div>
            {!hud.isSpectator && hud.killedByName && (
              <div className="text-xs text-white/85 mt-0.5">
                Killed by <span className="text-[#f5b841] font-semibold">{hud.killedByName}</span>{' '}
                {hud.killedByWeapon && <span className="text-white/55">[{hud.killedByWeapon}]</span>}
              </div>
            )}
            {!hud.isSpectator && (hud.gameMode === 'tdm' || hud.gameMode === 'dm') && (
              <div className="text-xs text-white/75 font-mono-tabular mt-0.5">
                Respawning in {hud.respawnTimer.toFixed(1)}s
              </div>
            )}
          </div>

          <div className="absolute bottom-14 left-1/2 -translate-x-1/2 cs-hud-box px-5 py-2.5 flex flex-col items-center gap-1 min-w-[380px] border border-white/25 bg-black/65">
            <div className="flex items-center gap-3 text-xs tracking-wider uppercase">
              <span className="text-[#f5b841] font-bold">
                {hud.spectatorMode === 'DEATH_CAM'
                  ? 'Death Cam'
                  : hud.spectatorMode === 'UPPER_OVERVIEW'
                  ? 'Upper Tactical Overview'
                  : hud.spectatorMode === 'CHASE_CAM'
                  ? 'Chase Camera'
                  : 'First-Person Camera'}
              </span>
              {hud.spectatorTargetName && (hud.spectatorMode === 'CHASE_CAM' || hud.spectatorMode === 'FIRST_PERSON') && (
                <span className="border-l border-white/20 pl-3 flex items-center gap-2">
                  <span className={hud.spectatorTargetTeam === 'T' ? 'text-[#f0a854] font-semibold' : 'text-[#7eb6ff] font-semibold'}>
                    {hud.spectatorTargetName}
                  </span>
                  <span className="font-mono-tabular text-white/75">{hud.spectatorTargetHealth} HP</span>
                </span>
              )}
            </div>
            <div className="text-[11px] text-white/70 font-mono-tabular flex items-center gap-3">
              <span>
                <strong className="text-white">[SPACE]</strong>{' '}
                {hud.spectatorMode === 'DEATH_CAM' ? 'Enter Upper View' : 'Switch Camera Mode'}
              </span>
              {hud.spectatorMode === 'UPPER_OVERVIEW' ? (
                <span>[WASD] Pan · [Scroll] Zoom</span>
              ) : (
                <span>[LMB / RMB] Next / Prev Player</span>
              )}
            </div>
          </div>
        </>
      )}

      {/* Round Banner */}
      {hud.roundBanner && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 cs-panel px-8 py-3 text-center">
          <div
            className={`font-display text-3xl font-bold uppercase tracking-wider ${
              hud.roundBanner.winner === 'T'
                ? 'text-[#f0a854]'
                : hud.roundBanner.winner === 'CT'
                ? 'text-[#7eb6ff]'
                : 'text-[#f5b841]'
            }`}
          >
            {hud.roundBanner.title}
          </div>
          <div className="text-xs text-white/80 mt-0.5">{hud.roundBanner.subtitle}</div>
        </div>
      )}

      {/* Click to Lock Pointer prompt if not locked and alive */}
      {!hud.isPointerLocked && hud.playerAlive && (
        <button
          onClick={onClickToLock}
          className="pointer-events-auto absolute bottom-20 left-1/2 -translate-x-1/2 cs-panel px-5 py-2 text-xs uppercase tracking-wider text-white hover:border-[#f5b841] cursor-pointer"
        >
          Click Canvas to Aim & Shoot · [B] Buy Menu · [ESC] Pause
        </button>
      )}

      {/* TAB Scoreboard */}
      {showScoreboard && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/45">
          <div className="cs-panel w-full max-w-3xl p-5">
            <div className="flex items-center justify-between border-b border-white/15 pb-3 mb-3">
              <div className="font-display text-2xl font-bold uppercase tracking-wider">
                Scoreboard · {hud.mapId}
              </div>
              <div className="font-mono-tabular text-sm text-white/80">
                T <span className="text-[#f0a854] font-bold">{hud.tScore}</span> —{' '}
                <span className="text-[#7eb6ff] font-bold">{hud.ctScore}</span> CT
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(['T', 'CT'] as const).map((team) => {
                const rows = hud.scoreboard
                  .filter((r) => r.team === team)
                  .sort((a, b) => b.kills - a.kills);
                return (
                  <div key={team} className="border border-white/15 bg-black/30 p-3">
                    <div
                      className={`font-display text-lg font-bold uppercase tracking-wider mb-2 ${
                        team === 'T' ? 'text-[#f0a854]' : 'text-[#7eb6ff]'
                      }`}
                    >
                      {team === 'T' ? 'Terrorists' : 'Counter-Terrorists'}
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-white/50 border-b border-white/10 text-left">
                          <th className="py-1">Player</th>
                          <th className="py-1 text-right">Kills</th>
                          <th className="py-1 text-right">Deaths</th>
                          <th className="py-1 text-right">$</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr
                            key={r.id}
                            className={`border-b border-white/5 ${
                              r.isPlayer ? 'text-[#f5b841] font-semibold' : 'text-white/85'
                            } ${!r.alive ? 'opacity-50' : ''}`}
                          >
                            <td className="py-1.5">
                              {r.name} {!r.alive && '· Dead'}
                            </td>
                            <td className="py-1.5 text-right font-mono-tabular">{r.kills}</td>
                            <td className="py-1.5 text-right font-mono-tabular">{r.deaths}</td>
                            <td className="py-1.5 text-right font-mono-tabular">${r.money}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
