import { Board, GameState, PlayerSide } from '../data/types';
import { countCardsOwnedOnBoard } from '../engine/Board';
import { getPlayer } from '../engine/GameState';

/* ──────────────────────────────────────────────────────────────
   Board Evaluator for Minimax AI
   Scores position: cards owned, edge/wall safety, hand strength
   Positive = good for maximizing player (AI), negative = good for opponent
   ────────────────────────────────────────────────────────────── */

const CORNER_BONUS = 2;
const EDGE_BONUS = 1;
const CENTER_BONUS = 0;

function getPositionBonus(row: number, col: number): number {
  const isCorner = (row === 0 || row === 2) && (col === 0 || col === 2);
  const isEdge = row === 0 || row === 2 || col === 0 || col === 2;
  if (isCorner) return CORNER_BONUS;
  if (isEdge) return EDGE_BONUS;
  return CENTER_BONUS;
}

/**
 * Sum of card values (1-10 each, max 40 per card).
 */
function cardStrength(card: { values: { top: number; right: number; bottom: number; left: number } }): number {
  return card.values.top + card.values.right + card.values.bottom + card.values.left;
}

/**
 * Evaluate board from the perspective of the maximizing player (AI).
 * Higher = better for AI.
 */
export function evaluateBoard(state: GameState, aiSide: PlayerSide): number {
  const opponentSide = aiSide === PlayerSide.Blue ? PlayerSide.Red : PlayerSide.Blue;

  const aiCardsOnBoard = countCardsOwnedOnBoard(state.board, aiSide);
  const opponentCardsOnBoard = countCardsOwnedOnBoard(state.board, opponentSide);
  const cardDiff = aiCardsOnBoard - opponentCardsOnBoard;

  let positionBonus = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const cell = state.board[row][col];
      if (cell.card) {
        const mult = cell.card.owner === aiSide ? 1 : -1;
        positionBonus += mult * getPositionBonus(row, col);
      }
    }
  }

  const aiPlayer = getPlayer(state, aiSide);
  const oppPlayer = getPlayer(state, opponentSide);
  const aiHandStrength = aiPlayer.hand.reduce((sum, c) => sum + cardStrength(c), 0);
  const oppHandStrength = oppPlayer.hand.reduce((sum, c) => sum + cardStrength(c), 0);
  const handDiff = (aiHandStrength - oppHandStrength) / 40;

  return cardDiff * 10 + positionBonus * 3 + handDiff * 2;
}
