import { AIMove } from '../data/types';
import { GameEngine } from '../engine/GameEngine';

/* ──────────────────────────────────────────────────────────────
   AI Player interface for Triple Trio
   ────────────────────────────────────────────────────────────── */

export interface AIPlayer {
  chooseMove(engine: GameEngine): AIMove;
}
