import { AIMove, GamePhase, PlayerSide } from '../data/types';
import { GameEngine } from '../engine/GameEngine';
import { evaluateBoard } from './BoardEvaluator';
import { AIPlayer } from './AIPlayer';

/* ──────────────────────────────────────────────────────────────
   Minimax AI (Hard) for Triple Trio
   Depth-limited (depth 3) with alpha-beta pruning
   ────────────────────────────────────────────────────────────── */

const MAX_DEPTH = 3;

export class MinimaxAI implements AIPlayer {
  constructor(private readonly side: PlayerSide) {}

  chooseMove(engine: GameEngine): AIMove {
    const moves = engine.getValidMoves();
    if (moves.length === 0) throw new Error('No valid moves');

    let bestMove: AIMove = moves[0];
    let bestScore = -Infinity;

    for (const move of moves) {
      const cloned = engine.clone();
      cloned.placeCard(move.handIndex, move.row, move.col);
      const score = this.minimax(cloned, MAX_DEPTH - 1, -Infinity, Infinity);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }

  private minimax(
    engine: GameEngine,
    depth: number,
    alpha: number,
    beta: number
  ): number {
    const state = engine.getState();

    if (state.phase === GamePhase.GameOver || depth <= 0) {
      return evaluateBoard(state, this.side);
    }

    const moves = engine.getValidMoves();
    if (moves.length === 0) {
      return evaluateBoard(state, this.side);
    }

    const isAITurn = state.currentTurn === this.side;

    if (isAITurn) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const cloned = engine.clone();
        cloned.placeCard(move.handIndex, move.row, move.col);
        const eval_ = this.minimax(cloned, depth - 1, alpha, beta);
        maxEval = Math.max(maxEval, eval_);
        alpha = Math.max(alpha, eval_);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        const cloned = engine.clone();
        cloned.placeCard(move.handIndex, move.row, move.col);
        const eval_ = this.minimax(cloned, depth - 1, alpha, beta);
        minEval = Math.min(minEval, eval_);
        beta = Math.min(beta, eval_);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }
}
