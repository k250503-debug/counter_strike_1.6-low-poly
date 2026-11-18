import { Keyboard, LogOut, Play, Settings, ShoppingCart, Users } from 'lucide-react';

interface PauseMenuProps {
  onResume: () => void;
  onBuyMenu: () => void;
  onChangeTeam: () => void;
  onSettings: () => void;
  onControls: () => void;
  onMainMenu: () => void;
}

export function PauseMenu({
  onResume,
  onBuyMenu,
  onChangeTeam,
  onSettings,
  onControls,
  onMainMenu,
}: PauseMenuProps) {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
      <div className="cs-panel w-full max-w-sm p-5 flex flex-col gap-2.5">
        <div className="border-b border-white/15 pb-3 mb-1">
          <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-white">
            Match Paused
          </h2>
          <p className="text-xs text-white/65">Click Resume to lock mouse and return to combat</p>
        </div>

        <button
          onClick={onResume}
          className="w-full py-3 px-4 bg-[#f5b841] hover:bg-[#ffca5c] text-black font-display text-xl font-bold uppercase tracking-wider flex items-center justify-between cursor-pointer"
        >
          <span>Resume Match</span>
          <Play className="w-4 h-4 fill-black" />
        </button>

        <button
          onClick={onBuyMenu}
          className="cs-btn w-full py-2.5 px-4 text-sm uppercase tracking-wider text-white flex items-center justify-between cursor-pointer"
        >
          <span>Buy Menu [B]</span>
          <ShoppingCart className="w-4 h-4 text-[#f5b841]" />
        </button>

        <button
          onClick={onChangeTeam}
          className="cs-btn w-full py-2.5 px-4 text-sm uppercase tracking-wider text-white flex items-center justify-between cursor-pointer"
        >
          <span>Change Team / Map</span>
          <Users className="w-4 h-4 text-white/70" />
        </button>

        <button
          onClick={onSettings}
          className="cs-btn w-full py-2.5 px-4 text-sm uppercase tracking-wider text-white flex items-center justify-between cursor-pointer"
        >
          <span>Settings</span>
          <Settings className="w-4 h-4 text-white/70" />
        </button>

        <button
          onClick={onControls}
          className="cs-btn w-full py-2.5 px-4 text-sm uppercase tracking-wider text-white flex items-center justify-between cursor-pointer"
        >
          <span>Controls</span>
          <Keyboard className="w-4 h-4 text-white/70" />
        </button>

        <button
          onClick={onMainMenu}
          className="cs-btn w-full py-2.5 px-4 text-sm uppercase tracking-wider text-red-300 border-red-400/30 hover:border-red-400 flex items-center justify-between cursor-pointer mt-1"
        >
          <span>Exit to Main Menu</span>
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
