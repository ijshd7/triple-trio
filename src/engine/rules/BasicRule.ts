import {
  Board,
  CardDef,
  Direction,
  PlayerSide,
  RuleType,
} from '../../data/types';
import { getAdjacentCells, getCardValue, OPPOSITE_DIRECTION } from '../Board';
import { getElementalModifier } from '../../data/elements';

/* ──────────────────────────────────────────────────────────────
   Basic Rule for Triple Trio
   Captures adjacent opposing cards when placed card has higher value
   Uses elemental modifiers when Elemental rule is active
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

function getValue(
  board: Board,
  row: number,
  col: number,
  card: CardDef,
  direction: Direction,
  useElemental: boolean
): number {
  const base = getCardValue(card, direction);
  if (!useElemental) return base;
  const cell = board[row][col];
  const modifier = getElementalModifier(cell.element, card.element);
  return Math.max(1, Math.min(10, base + modifier));
}

/**
 * Basic Rule: Compare placed card value to each adjacent opposing card.
 * If placed card's value > opposing card's value, capture it.
 */
export class BasicRule implements CaptureRule {
  readonly ruleType = RuleType.Basic;
  private readonly useElemental: boolean;

  constructor(activeRules: RuleType[]) {
    this.useElemental = activeRules.includes(RuleType.Elemental);
  }

  evaluate(
    board: Board,
    placedRow: number,
    placedCol: number,
    placedCard: CardDef,
    placingPlayer: PlayerSide
  ): CaptureResult[] {
    const captures: CaptureResult[] = [];
    const neighbors = getAdjacentCells(board, placedRow, placedCol);

    for (const { cell, direction } of neighbors) {
      if (cell.card === null || cell.card.owner === placingPlayer) {
        continue;
      }

      const placedValue = getValue(
        board,
        placedRow,
        placedCol,
        placedCard,
        direction,
        this.useElemental
      );
      const oppositeDir = OPPOSITE_DIRECTION[direction];
      const neighborValue = getValue(
        board,
        cell.row,
        cell.col,
        cell.card.card,
        oppositeDir,
        this.useElemental
      );

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
