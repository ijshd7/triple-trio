import { Board, CardDef, PlayerSide, RuleType } from '../../data/types';
import { CaptureResult, CaptureRule } from './BasicRule';

/* ──────────────────────────────────────────────────────────────
   Elemental Rule for Triple Trio
   The Elemental rule does not produce captures directly.
   When active, it enables ±1 modifiers in Basic/Same/Plus rules:
   - Card element matches cell element: +1 to all values
   - Card on elemental cell without match: -1 to all values
   This rule exists for the rules registry; modifier logic is in
   BasicRule, SameRule, and PlusRule via useElemental flag.
   ────────────────────────────────────────────────────────────── */

export class ElementalRule implements CaptureRule {
  readonly ruleType = RuleType.Elemental;

  evaluate(
    _board: Board,
    _placedRow: number,
    _placedCol: number,
    _placedCard: CardDef,
    _placingPlayer: PlayerSide
  ): CaptureResult[] {
    return [];
  }
}
