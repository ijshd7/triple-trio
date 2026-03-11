import { RuleType } from '../data/types';

/* ──────────────────────────────────────────────────────────────
   RuleDisplay - Shows active rules
   ────────────────────────────────────────────────────────────── */

const RULE_LABELS: Record<RuleType, string> = {
  [RuleType.Basic]: 'Basic',
  [RuleType.Same]: 'Same',
  [RuleType.Plus]: 'Plus',
  [RuleType.Elemental]: 'Elemental',
};

interface RuleDisplayProps {
  activeRules: RuleType[];
}

export function RuleDisplay({ activeRules }: RuleDisplayProps) {
  const hasElemental = activeRules.includes(RuleType.Elemental);

  return (
    <div className="rule-display">
      <div className="rule-display-title">Rules</div>
      <div className="rule-display-badges">
        {activeRules.map((rule) => (
          <span key={rule} className="rule-badge">
            {RULE_LABELS[rule]}
          </span>
        ))}
      </div>
      {hasElemental && (
        <div className="rule-display-elements">
          <span className="rule-element-hint">Elemental cells active</span>
        </div>
      )}
    </div>
  );
}
