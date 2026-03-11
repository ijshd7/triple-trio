import { Board, CardDef, PlayerSide, RuleType } from '../data/types';
import { cloneBoard } from './Board';
import { BasicRule, CaptureResult, CaptureRule } from './rules/BasicRule';
import { SameRule } from './rules/SameRule';
import { PlusRule } from './rules/PlusRule';
import { ElementalRule } from './rules/ElementalRule';
import { resolveComboCascade } from './CaptureResolver';

/* ──────────────────────────────────────────────────────────────
   Rule Engine for Triple Trio
   Composes capture rules and applies captures to the board
   Evaluation order: Same → Plus → Basic; combo cascade after Same/Plus
   ────────────────────────────────────────────────────────────── */

export class RuleEngine {
  private readonly rules: CaptureRule[];
  private readonly basicRule: BasicRule;
  private readonly hasSameOrPlus: boolean;

  constructor(activeRules: RuleType[]) {
    this.rules = this.buildRules(activeRules);
    this.basicRule = new BasicRule(activeRules);
    this.hasSameOrPlus =
      activeRules.includes(RuleType.Same) || activeRules.includes(RuleType.Plus);
  }

  /**
   * Build rule instances. Order: Same, Plus, Basic.
   * Elemental is a modifier applied within other rules when active.
   */
  private buildRules(activeRules: RuleType[]): CaptureRule[] {
    const rules: CaptureRule[] = [];

    if (activeRules.includes(RuleType.Same)) {
      rules.push(new SameRule(activeRules));
    }
    if (activeRules.includes(RuleType.Plus)) {
      rules.push(new PlusRule(activeRules));
    }
    rules.push(new BasicRule(activeRules));

    if (activeRules.includes(RuleType.Elemental)) {
      rules.push(new ElementalRule());
    }

    return rules;
  }

  /**
   * Evaluate all active rules for a placed card.
   * If Same or Plus produce captures, runs combo cascade.
   */
  evaluate(
    board: Board,
    placedRow: number,
    placedCol: number,
    placedCard: CardDef,
    placingPlayer: PlayerSide
  ): CaptureResult[] {
    const capturesByCell = new Map<string, CaptureResult>();
    let sameOrPlusCaptures: CaptureResult[] = [];

    for (const rule of this.rules) {
      const ruleCaptures = rule.evaluate(
        board,
        placedRow,
        placedCol,
        placedCard,
        placingPlayer
      );

      for (const capture of ruleCaptures) {
        const key = `${capture.row},${capture.col}`;
        if (!capturesByCell.has(key)) {
          capturesByCell.set(key, capture);
          if (
            this.hasSameOrPlus &&
            (capture.byRule === RuleType.Same || capture.byRule === RuleType.Plus)
          ) {
            sameOrPlusCaptures.push(capture);
          }
        }
      }
    }

    let finalCaptures = Array.from(capturesByCell.values());

    if (sameOrPlusCaptures.length > 0) {
      const boardAfterInitial = this.applyCaptures(board, finalCaptures);
      const { captures: cascadeCaptures } = resolveComboCascade(
        boardAfterInitial,
        sameOrPlusCaptures,
        this.basicRule
      );

      const cascadeByCell = new Map<string, CaptureResult>();
      for (const c of finalCaptures) {
        cascadeByCell.set(`${c.row},${c.col}`, c);
      }
      for (const c of cascadeCaptures) {
        const key = `${c.row},${c.col}`;
        if (!cascadeByCell.has(key)) {
          cascadeByCell.set(key, c);
        }
      }
      finalCaptures = Array.from(cascadeByCell.values());
    }

    return finalCaptures;
  }

  /**
   * Apply captures to the board: flip ownership of captured cells.
   */
  applyCaptures(board: Board, captures: CaptureResult[]): Board {
    const newBoard = cloneBoard(board);
    for (const capture of captures) {
      const cell = newBoard[capture.row][capture.col];
      if (cell.card !== null) {
        cell.card.owner = capture.newOwner;
      }
    }
    return newBoard;
  }
}
