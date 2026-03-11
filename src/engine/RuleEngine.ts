import { Board, CardDef, PlayerSide, RuleType } from '../data/types';
import { BasicRule, CaptureResult, CaptureRule } from './rules/BasicRule';
import { cloneBoard } from './Board';

/* ──────────────────────────────────────────────────────────────
   Rule Engine for Triple Trio
   Composes capture rules and applies captures to the board
   ────────────────────────────────────────────────────────────── */

/**
 * Evaluates all active rules and applies captures.
 * In Phase 1, only BasicRule is active.
 * Phase 3 will add Same, Plus, and Elemental rules with specific evaluation order.
 */
export class RuleEngine {
  private readonly rules: CaptureRule[];

  constructor(_activeRules: RuleType[]) {
    this.rules = this.buildRules(_activeRules);
  }

  /**
   * Build the rule instances based on active rules.
   * Phase 1: Only BasicRule (always included).
   * Phase 3: Will conditionally add Same, Plus, Elemental with order: Elemental > Same > Plus > Basic.
   */
  private buildRules(_activeRules: RuleType[]): CaptureRule[] {
    const rules: CaptureRule[] = [];

    // BasicRule is always active regardless of the activeRules list
    rules.push(new BasicRule());

    // Phase 3: Uncomment and expand:
    // if (_activeRules.includes(RuleType.Same)) rules.push(new SameRule());
    // if (_activeRules.includes(RuleType.Plus)) rules.push(new PlusRule());
    // if (_activeRules.includes(RuleType.Elemental)) rules.push(new ElementalRule());

    return rules;
  }

  /**
   * Evaluate all active rules for a placed card.
   * Returns a deduped list of cells to capture (by row,col).
   * In Phase 1, only BasicRule is active so no deduplication needed.
   */
  evaluate(
    board: Board,
    placedRow: number,
    placedCol: number,
    placedCard: CardDef,
    placingPlayer: PlayerSide
  ): CaptureResult[] {
    const capturesByCell = new Map<string, CaptureResult>();

    // Run each rule and collect captures
    for (const rule of this.rules) {
      const ruleCapturesResult = rule.evaluate(board, placedRow, placedCol, placedCard, placingPlayer);

      for (const capture of ruleCapturesResult) {
        const key = `${capture.row},${capture.col}`;
        // Only add if not already captured by a previous rule
        if (!capturesByCell.has(key)) {
          capturesByCell.set(key, capture);
        }
      }
    }

    return Array.from(capturesByCell.values());
  }

  /**
   * Apply captures to the board: flip ownership of captured cells.
   * Returns a new board with updated ownership.
   */
  applyCaptures(board: Board, captures: CaptureResult[]): Board {
    let newBoard = cloneBoard(board);

    for (const capture of captures) {
      const cell = newBoard[capture.row][capture.col];
      if (cell.card !== null) {
        cell.card.owner = capture.newOwner;
      }
    }

    return newBoard;
  }
}
