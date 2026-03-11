import { Board, CardDef, Direction, PlayerSide, RuleType } from '../../data/types';
import { getAdjacentCells, getCardValue, OPPOSITE_DIRECTION } from '../Board';
import { getElementalModifier } from '../../data/elements';
import { CaptureResult, CaptureRule } from './BasicRule';

/* ──────────────────────────────────────────────────────────────
   Same Rule for Triple Trio
   Captures when 2+ adjacent pairs have equal values (with elemental modifiers)
   ────────────────────────────────────────────────────────────── */

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

export class SameRule implements CaptureRule {
  readonly ruleType = RuleType.Same;
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

    const matchingPairs: Array<{ row: number; col: number }> = [];

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

      if (placedValue === neighborValue) {
        matchingPairs.push({ row: cell.row, col: cell.col });
      }
    }

    if (matchingPairs.length >= 2) {
      for (const { row, col } of matchingPairs) {
        captures.push({
          row,
          col,
          newOwner: placingPlayer,
          byRule: RuleType.Same,
        });
      }
    }

    return captures;
  }
}
