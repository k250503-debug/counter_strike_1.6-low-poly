import { useEffect, useRef, useState } from 'react';
import { BuyMenu } from './components/BuyMenu';
import { ClassSelection } from './components/ClassSelection';
import { HUD } from './components/HUD';
import { MainMenu } from './components/MainMenu';
import { AboutModal, ControlsModal, MultiplayerModal, SettingsModal } from './components/Modals';
import { PauseMenu } from './components/PauseMenu';
import { TeamSelection } from './components/TeamSelection';
import { audioManager } from './game/AudioManager';
import { GameEngine } from './game/GameEngine';
import { settingsManager } from './game/SettingsManager';
import {
  BotDifficulty,
  CharacterClassId,
  GameMode,
  GameScreen,
  HudSnapshot,
  MapId,
  ServerListing,
  Team,
} from './game/types';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [screen, setScreen] = useState<GameScreen>('MENU');
  const [modal, setModal] = useState<'NONE' | 'MULTIPLAYER' | 'SETTINGS' | 'CONTROLS' | 'ABOUT'>('NONE');

  const [selectedTeam, setSelectedTeam] = useState<Team>('CT');
  const [selectedMap, setSelectedMap] = useState<MapId>('de_dust2');
  const [selectedMode, setSelectedMode] = useState<GameMode>('bomb_defusal');
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>(settingsManager.get().botDifficulty);

  const [hud, setHud] = useState<HudSnapshot | null>(null);
  const [buyMenuOpen, setBuyMenuOpen] = useState(false);
  const [pauseMenuOpen, setPauseMenuOpen] = useState(false);
  const [activeMenuMap, setActiveMenuMap] = useState<MapId>('de_dust2');

  const stateRef = useRef({ screen, buyMenuOpen, pauseMenuOpen });
  stateRef.current = { screen, buyMenuOpen, pauseMenuOpen };

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const engine = new GameEngine(container, {
      onHudUpdate: (snap) => setHud(snap),
      onMenuMapChange: (mapId) => setActiveMenuMap(mapId),
      onToggleBuyMenu: () => {
        if (stateRef.current.screen !== 'PLAYING') return;
        setBuyMenuOpen((prev) => {
          const next = !prev;
          engineRef.current?.setUiOverlayState(next, false);
          if (!next) {
            setTimeout(() => engineRef.current?.requestPointerLock(), 30);
          }
          return next;
        });
        setPauseMenuOpen(false);
      },
      onPauseChange: (paused) => {
        if (stateRef.current.screen !== 'PLAYING') return;
        if (stateRef.current.buyMenuOpen) return;
        setPauseMenuOpen(paused);
        engineRef.current?.setUiOverlayState(false, paused);
      },
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  const handleDeploy = (config: {
    classId: CharacterClassId;
    mapId: MapId;
    mode: GameMode;
    botDifficulty: BotDifficulty;
  }) => {
    setSelectedMap(config.mapId);
    setSelectedMode(config.mode);
    setBotDifficulty(config.botDifficulty);
    settingsManager.update({ botDifficulty: config.botDifficulty });

    setBuyMenuOpen(false);
    setPauseMenuOpen(false);
    setScreen('PLAYING');
    engineRef.current?.startMatch({
      mapId: config.mapId,
      mode: config.mode,
      team: selectedTeam,
      classId: config.classId,
    });
  };

  const handleReturnToMainMenu = () => {
    setBuyMenuOpen(false);
    setPauseMenuOpen(false);
    setModal('NONE');
    setScreen('MENU');
    engineRef.current?.setUiOverlayState(false, false);
    engineRef.current?.startMenuBattleScene();
    audioManager.startMenuMusic();
  };

  const handleJoinServer = (srv: ServerListing) => {
    setSelectedMap(srv.mapId);
    setSelectedMode(srv.mode);
    setBotDifficulty(srv.difficulty);
    settingsManager.update({ botDifficulty: srv.difficulty });
    setModal('NONE');
    setScreen('TEAM_SELECT');
  };

  const handleResumeMatch = () => {
    setPauseMenuOpen(false);
    setBuyMenuOpen(false);
    engineRef.current?.setUiOverlayState(false, false);
    engineRef.current?.requestPointerLock();
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0b0d0f]">
      {/* Dedicated isolated WebGL canvas mount container */}
      <div ref={canvasMountRef} className="fixed inset-0 z-0" />

      {/* MAIN MENU */}
      {screen === 'MENU' && (
        <MainMenu
          activeMenuMap={activeMenuMap}
          onSelectMenuMap={(id) => engineRef.current?.setMenuShowcaseMap(id)}
          onCycleMenuMap={(delta) => engineRef.current?.cycleMenuShowcaseMap(delta)}
          onPlay={() => setScreen('TEAM_SELECT')}
          onMultiplayer={() => setModal('MULTIPLAYER')}
          onSettings={() => setModal('SETTINGS')}
          onControls={() => setModal('CONTROLS')}
          onAbout={() => setModal('ABOUT')}
          onExit={() => {
            audioManager.stopMenuMusic();
            setScreen('EXIT_STANDBY');
          }}
        />
      )}

      {/* TEAM SELECTION */}
      {screen === 'TEAM_SELECT' && (
        <TeamSelection
          onSelectTeam={(team) => {
            setSelectedTeam(team);
            setScreen('CLASS_SELECT');
          }}
          onBack={() => setScreen('MENU')}
        />
      )}

      {/* CLASS & MAP SELECTION */}
      {screen === 'CLASS_SELECT' && (
        <ClassSelection
          team={selectedTeam}
          selectedMap={selectedMap}
          selectedMode={selectedMode}
          botDifficulty={botDifficulty}
          onBack={() => setScreen('TEAM_SELECT')}
          onDeploy={handleDeploy}
        />
      )}

      {/* IN-GAME HUD, BUY MENU & PAUSE MENU */}
      {screen === 'PLAYING' && hud && (
        <>
          <HUD
            hud={hud}
            onOpenBuyMenu={() => {
              setPauseMenuOpen(false);
              setBuyMenuOpen(true);
              engineRef.current?.setUiOverlayState(true, false);
            }}
            onClickToLock={() => engineRef.current?.requestPointerLock()}
          />

          {buyMenuOpen && (
            <BuyMenu
              hud={hud}
              onBuy={(id) => engineRef.current?.buyItem(id) ?? { ok: false, reason: 'Engine offline' }}
              onClose={() => {
                setBuyMenuOpen(false);
                engineRef.current?.setUiOverlayState(false, false);
                engineRef.current?.requestPointerLock();
              }}
            />
          )}

          {pauseMenuOpen && !buyMenuOpen && modal === 'NONE' && (
            <PauseMenu
              onResume={handleResumeMatch}
              onBuyMenu={() => {
                setPauseMenuOpen(false);
                setBuyMenuOpen(true);
                engineRef.current?.setUiOverlayState(true, false);
              }}
              onChangeTeam={() => {
                setPauseMenuOpen(false);
                engineRef.current?.setUiOverlayState(false, false);
                engineRef.current?.startMenuBattleScene();
                setScreen('TEAM_SELECT');
              }}
              onSettings={() => setModal('SETTINGS')}
              onControls={() => setModal('CONTROLS')}
              onMainMenu={handleReturnToMainMenu}
            />
          )}
        </>
      )}

      {/* STANDBY EXIT SCREEN */}
      {screen === 'EXIT_STANDBY' && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/75 p-4">
          <div className="cs-panel p-8 max-w-md w-full text-center flex flex-col gap-4">
            <h2 className="font-display text-3xl font-bold uppercase tracking-wider text-white">
              Session Disconnected
            </h2>
            <p className="text-sm text-white/75">
              Counter-Strike 1.6 simulation suspended. Re-enter the tactical arena whenever ready.
            </p>
            <button
              onClick={handleReturnToMainMenu}
              className="w-full py-3 bg-[#f5b841] hover:bg-[#ffca5c] text-black font-display text-xl font-bold uppercase tracking-wider cursor-pointer"
            >
              Return to Main Menu
            </button>
          </div>
        </div>
      )}

      {/* MODALS */}
      {modal === 'MULTIPLAYER' && (
        <MultiplayerModal
          onJoinServer={handleJoinServer}
          onClose={() => setModal('NONE')}
        />
      )}

      {modal === 'SETTINGS' && (
        <SettingsModal
          onApply={() => engineRef.current?.applySettings()}
          onClose={() => setModal('NONE')}
        />
      )}

      {modal === 'CONTROLS' && <ControlsModal onClose={() => setModal('NONE')} />}

      {modal === 'ABOUT' && <AboutModal onClose={() => setModal('NONE')} />}
    </div>
  );
}
