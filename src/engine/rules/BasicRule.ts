import { Board, CardDef, PlayerSide, RuleType } from '../../data/types';
import { getAdjacentCells, getCardValue, OPPOSITE_DIRECTION } from '../Board';

/* ──────────────────────────────────────────────────────────────
   Basic Rule for Triple Trio
   Captures adjacent opposing cards when placed card has higher value
   ────────────────────────────────────────────────────────────── */

/**
 * Result of a capture operation by a single rule.
 */
export interface CaptureResult {
  row: number;
  col: number;
  newOwner: PlayerSide;
  byRule: RuleType;
}

/**
 * Interface that all capture rules must implement.
 */
export interface CaptureRule {
  readonly ruleType: RuleType;
  evaluate(
    board: Board,
    placedRow: number,
    placedCol: number,
    placedCard: CardDef,
    placingPlayer: PlayerSide
  ): CaptureResult[];
}

/**
 * Basic Rule: Compare placed card value to each adjacent opposing card.
 * If placed card's value > opposing card's value, capture it.
 */
export class BasicRule implements CaptureRule {
  readonly ruleType = RuleType.Basic;

  evaluate(
    board: Board,
    placedRow: number,
    placedCol: number,
    placedCard: CardDef,
    placingPlayer: PlayerSide
  ): CaptureResult[] {
    const captures: CaptureResult[] = [];

    // Get all adjacent cells (in bounds)
    const neighbors = getAdjacentCells(board, placedRow, placedCol);

    for (const { cell, direction } of neighbors) {
      // Only capture cells that have a card owned by the opponent
      if (cell.card === null || cell.card.owner === placingPlayer) {
        continue;
      }

      // Get the placed card's value facing this direction
      const placedValue = getCardValue(placedCard, direction);

      // Get the neighbor card's value facing back toward the placed card
      const oppositeDir = OPPOSITE_DIRECTION[direction];
      const neighborValue = getCardValue(cell.card.card, oppositeDir);

      // If placed card is stronger, capture the neighbor
      if (placedValue > neighborValue) {
        captures.push({
          row: cell.row,
          col: cell.col,
          newOwner: placingPlayer,
          byRule: RuleType.Basic,
        });
      }
    }

    return captures;
  }
}
