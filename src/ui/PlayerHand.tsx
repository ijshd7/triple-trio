import { useEffect, useState } from 'react';
import { EventBus } from '../game/EventBus';
import {
  GameState,
  CardDef,
  Element,
  PlayerSide,
  GamePhase,
} from '../data/types';
import { getPlayer } from '../engine/GameState';
import { ELEMENT_NAMES } from '../data/elements';

/* ──────────────────────────────────────────────────────────────
   PlayerHand - React component for clickable card hand
   Displays current player's hand, emits card-selected on click
   ────────────────────────────────────────────────────────────── */

function formatValue(v: number): string {
  return v === 10 ? 'A' : String(v);
}

function buildCardTooltip(card: CardDef): string {
  const v = card.values;
  const values = `↑${formatValue(v.top)} →${formatValue(v.right)} ↓${formatValue(v.bottom)} ←${formatValue(v.left)}`;
  const element =
    card.element !== Element.None ? ` · ${ELEMENT_NAMES[card.element]}` : '';
  const lore = card.lore ? `\n${card.lore}` : '';
  return `${card.name}\n${values}${element}${lore}`;
}

interface CardDisplayProps {
  card: CardDef;
  owner: PlayerSide;
  selected: boolean;
  onClick: () => void;
}

function CardDisplay({ card, owner, selected, onClick }: CardDisplayProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const frameColor = owner === PlayerSide.Blue ? '#2563eb' : '#dc2626';
  return (
    <div
      className="player-hand-card-wrapper"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        type="button"
        className={`player-hand-card ${selected ? 'selected' : ''}`}
        onClick={onClick}
        title={buildCardTooltip(card)}
        style={{
          borderColor: frameColor,
          boxShadow: selected ? `0 0 12px ${frameColor}` : undefined,
        }}
      >
        <div className="player-hand-card-name">{card.name}</div>
        <div className="player-hand-card-values">
          <span className="value-top">{formatValue(card.values.top)}</span>
          <span className="value-right">{formatValue(card.values.right)}</span>
          <span className="value-bottom">
            {formatValue(card.values.bottom)}
          </span>
          <span className="value-left">{formatValue(card.values.left)}</span>
        </div>
      </button>
      {showTooltip && (
        <div className="card-tooltip">
          <div className="card-tooltip-name">{card.name}</div>
          <div className="card-tooltip-values">
            ↑{formatValue(card.values.top)} →{formatValue(card.values.right)} ↓
            {formatValue(card.values.bottom)} ←{formatValue(card.values.left)}
          </div>
          {card.element !== Element.None && (
            <div className="card-tooltip-element">
              {ELEMENT_NAMES[card.element]}
            </div>
          )}
          {card.lore && <div className="card-tooltip-lore">{card.lore}</div>}
        </div>
      )}
    </div>
  );
}

interface PlayerHandProps {
  gameState: GameState | null;
}

export function PlayerHand({ gameState }: PlayerHandProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    const onSelectionChanged = (index: number | null) => {
      setSelectedIndex(index);
    };
    EventBus.on('card-selection-changed', onSelectionChanged);
    return () => {
      EventBus.off('card-selection-changed', onSelectionChanged);
    };
  }, []);

  if (!gameState || gameState.phase !== GamePhase.Playing) {
    return null;
  }

  if (gameState.currentTurn !== PlayerSide.Blue) {
    return (
      <div className="player-hand">
        <div className="player-hand-label">
          Red&apos;s turn (AI thinking...)
        </div>
      </div>
    );
  }

  const currentPlayer = getPlayer(gameState, gameState.currentTurn);
  const hand = currentPlayer.hand;

  return (
    <div className="player-hand">
      <div className="player-hand-label">
        {gameState.currentTurn === PlayerSide.Blue
          ? "Blue's turn"
          : "Red's turn"}{' '}
        — Select a card
      </div>
      <div className="player-hand-cards">
        {hand.map((card, index) => (
          <CardDisplay
            key={`${card.id}-${index}`}
            card={card}
            owner={gameState.currentTurn}
            selected={selectedIndex === index}
            onClick={() => EventBus.emit('card-selected', index)}
          />
        ))}
      </div>
    </div>
  );
}
