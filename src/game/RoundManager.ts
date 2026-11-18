import { audioManager } from './AudioManager';
import { GameMode, RoundPhase } from './types';

export class RoundManager {
  public mode: GameMode = 'bomb_defusal';
  public roundNumber = 1;
  public phase: RoundPhase = 'BUY_AND_LIVE';
  public roundTimer = 115;
  public buyPeriodTimer = 25;
  public bombTimer = 45;
  public roundEndTimer = 0;
  public freezeTimer = 0;

  public tScore = 0;
  public ctScore = 0;

  public bombPlanted = false;
  public bombSite: 'A' | 'B' | null = null;
  public bombBeepAccum = 0;

  public roundBanner: {
    title: string;
    subtitle: string;
    winner: 'T' | 'CT' | 'DRAW' | null;
  } | null = null;

  public resetMatch(mode: GameMode): void {
    this.mode = mode;
    this.roundNumber = 1;
    this.tScore = 0;
    this.ctScore = 0;
    this.startRound(1);
  }

  public startRound(roundNum: number): void {
    this.roundNumber = roundNum;
    this.bombPlanted = false;
    this.bombSite = null;
    this.bombTimer = 45;
    this.bombBeepAccum = 0;
    this.roundBanner = null;
    this.roundEndTimer = 0;

    if (this.mode === 'tdm' || this.mode === 'dm') {
      this.phase = 'LIVE';
      this.roundTimer = 300; // 5-minute deathmatch
      this.buyPeriodTimer = 300;
      this.freezeTimer = 0;
    } else if (this.mode === 'practice') {
      this.phase = 'BUY_AND_LIVE';
      this.roundTimer = 300;
      this.buyPeriodTimer = 300;
      this.freezeTimer = 0;
    } else {
      this.phase = 'FREEZETIME';
      this.freezeTimer = 2.5;
      this.roundTimer = 115;
      this.buyPeriodTimer = 25;
    }
  }

  public plantBomb(site: 'A' | 'B'): void {
    if (this.bombPlanted || this.phase === 'ROUND_END') return;
    this.bombPlanted = true;
    this.bombSite = site;
    this.phase = 'BOMB_PLANTED';
    this.bombTimer = 45;
    this.bombBeepAccum = 0;
    audioManager.playRadioCue('bomb_planted');
    this.roundBanner = {
      title: 'THE BOMB HAS BEEN PLANTED',
      subtitle: `Detonation at Bombsite ${site} in 45 seconds`,
      winner: null,
    };
  }

  public defuseBomb(onRoundEnd: (winner: 'T' | 'CT' | 'DRAW', reason: string) => void): void {
    if (!this.bombPlanted || this.phase === 'ROUND_END') return;
    this.bombPlanted = false;
    audioManager.playRadioCue('bomb_defused');
    this.finishRound('CT', 'Bomb Has Been Defused', onRoundEnd);
  }

  public finishRound(
    winner: 'T' | 'CT' | 'DRAW',
    reason: string,
    onRoundEnd: (winner: 'T' | 'CT' | 'DRAW', reason: string) => void
  ): void {
    if (this.phase === 'ROUND_END') return;
    this.phase = 'ROUND_END';
    this.roundEndTimer = 4.5;

    if (winner === 'T') {
      this.tScore += 1;
      audioManager.playRadioCue('t_win');
    } else if (winner === 'CT') {
      this.ctScore += 1;
      audioManager.playRadioCue('ct_win');
    } else {
      audioManager.playRadioCue('round_draw');
    }

    const title =
      winner === 'T'
        ? 'TERRORISTS WIN'
        : winner === 'CT'
        ? 'COUNTER-TERRORISTS WIN'
        : 'ROUND DRAW';

    this.roundBanner = {
      title,
      subtitle: reason,
      winner,
    };

    onRoundEnd(winner, reason);
  }

  public update(
    dt: number,
    aliveT: number,
    aliveCT: number,
    onRoundEnd: (winner: 'T' | 'CT' | 'DRAW', reason: string) => void,
    onStartNextRound: () => void,
    onBombExplode: () => void
  ): void {
    if (this.phase === 'FREEZETIME') {
      this.freezeTimer -= dt;
      if (this.freezeTimer <= 0) {
        this.phase = 'BUY_AND_LIVE';
        audioManager.playRadioCue('go');
      }
      return;
    }

    if (this.phase === 'ROUND_END') {
      this.roundEndTimer -= dt;
      if (this.roundEndTimer <= 0) {
        this.startRound(this.roundNumber + 1);
        onStartNextRound();
      }
      return;
    }

    this.buyPeriodTimer = Math.max(0, this.buyPeriodTimer - dt);

    if (this.mode === 'tdm' || this.mode === 'dm') {
      this.roundTimer -= dt;
      if (this.roundTimer <= 0) {
        const winner = this.tScore > this.ctScore ? 'T' : this.ctScore > this.tScore ? 'CT' : 'DRAW';
        this.finishRound(winner, 'Time Limit Reached', onRoundEnd);
      }
      return;
    }

    if (this.phase === 'BOMB_PLANTED') {
      this.bombTimer -= dt;
      // Accelerating classic C4 beep interval
      const interval = Math.max(0.16, (this.bombTimer / 45) * 0.95);
      this.bombBeepAccum += dt;
      if (this.bombBeepAccum >= interval) {
        this.bombBeepAccum = 0;
        audioManager.playBombBeep(this.bombTimer < 10);
      }
      if (this.bombTimer < 42 && this.roundBanner?.winner === null && this.roundBanner.title.includes('PLANTED')) {
        this.roundBanner = null;
      }

      if (this.bombTimer <= 0) {
        this.bombPlanted = false;
        onBombExplode();
        this.finishRound('T', 'Target Successfully Bombed', onRoundEnd);
        return;
      }

      if (aliveCT === 0) {
        this.finishRound('T', 'All Counter-Terrorists Eliminated', onRoundEnd);
      }
      return;
    }

    // Standard LIVE / BUY_AND_LIVE
    this.roundTimer -= dt;
    if (this.phase === 'BUY_AND_LIVE' && this.buyPeriodTimer <= 0) {
      this.phase = 'LIVE';
    }

    if (aliveCT === 0 && aliveT > 0) {
      this.finishRound('T', 'Counter-Terrorists Eliminated', onRoundEnd);
      return;
    }
    if (aliveT === 0 && aliveCT > 0 && !this.bombPlanted) {
      this.finishRound('CT', 'Terrorists Eliminated', onRoundEnd);
      return;
    }
    if (this.roundTimer <= 0) {
      this.finishRound('CT', 'Target Has Been Saved', onRoundEnd);
    }
  }
}
