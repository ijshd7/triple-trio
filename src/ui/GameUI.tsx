import { useEffect, useState } from 'react';
import { EventBus } from '../game/EventBus';
import { GameState } from '../data/types';
import { PlayerHand } from './PlayerHand';
import { RuleDisplay } from './RuleDisplay';
import { ScoreDisplay } from './ScoreDisplay';
import { TurnIndicator } from './TurnIndicator';

/* ──────────────────────────────────────────────────────────────
   GameUI - Wrapper for game overlay (PlayerHand, RuleDisplay, etc.)
   Subscribes to game-state-changed from Phaser Game scene
   ────────────────────────────────────────────────────────────── */

interface GameUIProps {
  visible: boolean;
}

export function GameUI({ visible }: GameUIProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);

  useEffect(() => {
    const onStateChanged = (state: GameState) => {
      setGameState(state);
    };
    EventBus.on('game-state-changed', onStateChanged);
    return () => {
      EventBus.off('game-state-changed', onStateChanged);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="game-ui-overlay">
      {gameState && <RuleDisplay activeRules={gameState.activeRules} />}
      <ScoreDisplay gameState={gameState} />
      <TurnIndicator gameState={gameState} />
      <PlayerHand gameState={gameState} />
    </div>
  );
}
