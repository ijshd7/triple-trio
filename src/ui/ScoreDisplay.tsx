import { GameState } from '../data/types';

/* ──────────────────────────────────────────────────────────────
   ScoreDisplay - Shows Blue vs Red score during gameplay
   ────────────────────────────────────────────────────────────── */

interface ScoreDisplayProps {
  gameState: GameState | null;
}

export function ScoreDisplay({ gameState }: ScoreDisplayProps) {
  if (!gameState) return null;

  const blueScore = gameState.players[0].score;
  const redScore = gameState.players[1].score;

  return (
    <div className="score-display">
      <span className="score-blue">{blueScore}</span>
      <span className="score-separator">-</span>
      <span className="score-red">{redScore}</span>
    </div>
  );
}
