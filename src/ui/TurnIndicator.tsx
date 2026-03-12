import { GameState, PlayerSide } from '../data/types';

/* ──────────────────────────────────────────────────────────────
   TurnIndicator - Shows whose turn it is
   ────────────────────────────────────────────────────────────── */

interface TurnIndicatorProps {
  gameState: GameState | null;
}

export function TurnIndicator({ gameState }: TurnIndicatorProps) {
  if (!gameState) return null;

  const label =
    gameState.currentTurn === PlayerSide.Blue ? "Blue's turn" : "Red's turn";

  return (
    <div className="turn-indicator">
      <span className="turn-label">{label}</span>
    </div>
  );
}
