import {
  Board,
  CardDef,
  Direction,
  PlayerSide,
  RuleType,
} from '../../data/types';
import { getAdjacentCells, getCardValue, OPPOSITE_DIRECTION } from '../Board';
import { getElementalModifier } from '../../data/elements';
import { CaptureResult, CaptureRule } from './BasicRule';

/* ──────────────────────────────────────────────────────────────
   Plus Rule for Triple Trio
   Captures when 2+ adjacent pairs have equal sums (with elemental modifiers)
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

export class PlusRule implements CaptureRule {
  readonly ruleType = RuleType.Plus;
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

    const pairsWithSums: Array<{ row: number; col: number; sum: number }> = [];

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
      const sum = placedValue + neighborValue;

      pairsWithSums.push({ row: cell.row, col: cell.col, sum });
    }

    if (pairsWithSums.length >= 2) {
      const sumCounts = new Map<number, number>();
      for (const { sum } of pairsWithSums) {
        sumCounts.set(sum, (sumCounts.get(sum) ?? 0) + 1);
      }

      const targetSum = [...sumCounts.entries()].find(
        ([, count]) => count >= 2
      )?.[0];
      if (targetSum !== undefined) {
        for (const { row, col, sum } of pairsWithSums) {
          if (sum === targetSum) {
            captures.push({
              row,
              col,
              newOwner: placingPlayer,
              byRule: RuleType.Plus,
            });
          }
        }
      }
    }

    return captures;
  }
}
