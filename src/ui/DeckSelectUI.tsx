import { useState } from 'react';
import { EventBus } from '../game/EventBus';
import { CARDS } from '../data/cards';
import type { CardDef } from '../data/types';
import { Element, Rarity } from '../data/types';

/* ──────────────────────────────────────────────────────────────
   DeckSelectUI - Card selection for pre-game hand
   User selects 5 cards, confirms to start game
   ────────────────────────────────────────────────────────────── */

function formatValue(v: number): string {
  return v === 10 ? 'A' : String(v);
}

const RARITY_LABELS: Record<Rarity, string> = {
  [Rarity.Common]: 'Common',
  [Rarity.Uncommon]: 'Uncommon',
  [Rarity.Rare]: 'Rare',
  [Rarity.Epic]: 'Epic',
  [Rarity.Legendary]: 'Legendary',
};

interface DeckCardProps {
  card: CardDef;
  selected: boolean;
  onClick: () => void;
  disabled: boolean;
}

function DeckCard({ card, selected, onClick, disabled }: DeckCardProps) {
  const v = card.values;
  return (
    <button
      type="button"
      className={`deck-select-card ${selected ? 'selected' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <div className="deck-select-card-name">{card.name}</div>
      <div className="deck-select-card-rarity">
        {RARITY_LABELS[card.rarity]}
        {card.element !== Element.None && ` · ${Element[card.element]}`}
      </div>
      <div className="deck-select-card-values">
        <span className="value-top">{formatValue(v.top)}</span>
        <span className="value-right">{formatValue(v.right)}</span>
        <span className="value-bottom">{formatValue(v.bottom)}</span>
        <span className="value-left">{formatValue(v.left)}</span>
      </div>
    </button>
  );
}

export function DeckSelectUI() {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const toggleCard = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 5) {
        next.add(id);
      }
      return next;
    });
  };

  const confirm = () => {
    if (selected.size !== 5) return;
    const blueHand = CARDS.filter((c) => selected.has(c.id));
    EventBus.emit('deck-confirm', blueHand);
  };

  return (
    <div className="deck-select-overlay">
      <div className="deck-select-grid">
        {CARDS.map((card) => (
          <DeckCard
            key={card.id}
            card={card}
            selected={selected.has(card.id)}
            onClick={() => toggleCard(card.id)}
            disabled={!selected.has(card.id) && selected.size >= 5}
          />
        ))}
      </div>
      <div className="deck-select-footer">
        <span className="deck-select-count">
          {selected.size} / 5 cards selected
        </span>
        <button
          type="button"
          className="button deck-select-confirm"
          onClick={confirm}
          disabled={selected.size !== 5}
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
