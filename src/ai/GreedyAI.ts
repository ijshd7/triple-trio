import { AIMove, PlayerSide } from '../data/types';
import { GameEngine } from '../engine/GameEngine';
import { AIPlayer } from './AIPlayer';

/* ──────────────────────────────────────────────────────────────
   Greedy AI (Easy) for Triple Trio
   Score = captures × 10 + position bonus (corners > edges > center)
   Tiebreaker: prefer playing weaker cards first (save strong cards)
   ────────────────────────────────────────────────────────────── */

const CORNER_BONUS = 3;
const EDGE_BONUS = 2;
const CENTER_BONUS = 0;

function getPositionBonus(row: number, col: number): number {
  const isCorner = (row === 0 || row === 2) && (col === 0 || col === 2);
  const isEdge = row === 0 || row === 2 || col === 0 || col === 2;
  if (isCorner) return CORNER_BONUS;
  if (isEdge) return EDGE_BONUS;
  return CENTER_BONUS;
}

function cardStrength(card: { values: { top: number; right: number; bottom: number; left: number } }): number {
  return card.values.top + card.values.right + card.values.bottom + card.values.left;
}

export class GreedyAI implements AIPlayer {

  chooseMove(engine: GameEngine): AIMove {
    const moves = engine.getValidMoves();
    if (moves.length === 0) throw new Error('No valid moves');

    let bestMove: AIMove = moves[0];
    let bestScore = -Infinity;

    for (const move of moves) {
      const cloned = engine.clone();
      const result = cloned.placeCard(move.handIndex, move.row, move.col);

      const captures = result.events.filter((e) => e.type === 'card-captured').length;
      const posBonus = getPositionBonus(move.row, move.col);
      const score = captures * 10 + posBonus;

      const state = engine.getState();
      const currentPlayer = state.players[state.currentTurn === PlayerSide.Blue ? 0 : 1];
      const cardStrengthVal = cardStrength(currentPlayer.hand[move.handIndex]);

      if (score > bestScore || (score === bestScore && cardStrengthVal < cardStrength(currentPlayer.hand[bestMove.handIndex]))) {
        bestScore = score;
        bestMove = move;
      }
    }

    return bestMove;
  }
}
