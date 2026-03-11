import { CardDef, Element, Rarity } from './types';

/* ──────────────────────────────────────────────────────────────
   Card Database for Triple Trio
   15 starter cards spanning all rarities
   ────────────────────────────────────────────────────────────── */

export const CARDS: CardDef[] = [
  // Common cards (IDs 1-6) — 8-14 total value
  {
    id: 1,
    name: 'Goblin',
    values: { top: 2, right: 3, bottom: 4, left: 1 },
    element: Element.None,
    rarity: Rarity.Common,
    artworkKey: 'card_001',
    lore: 'A weak creature often found in forests.',
  },
  {
    id: 2,
    name: 'Bat',
    values: { top: 1, right: 2, bottom: 2, left: 3 },
    element: Element.None,
    rarity: Rarity.Common,
    artworkKey: 'card_002',
  },
  {
    id: 3,
    name: 'Slime',
    values: { top: 3, right: 2, bottom: 2, left: 2 },
    element: Element.None,
    rarity: Rarity.Common,
    artworkKey: 'card_003',
  },
  {
    id: 4,
    name: 'Skeleton',
    values: { top: 2, right: 4, bottom: 3, left: 2 },
    element: Element.None,
    rarity: Rarity.Common,
    artworkKey: 'card_004',
  },
  {
    id: 5,
    name: 'Zombie',
    values: { top: 3, right: 2, bottom: 4, left: 1 },
    element: Element.None,
    rarity: Rarity.Common,
    artworkKey: 'card_005',
  },
  {
    id: 6,
    name: 'Rat',
    values: { top: 1, right: 3, bottom: 2, left: 4 },
    element: Element.None,
    rarity: Rarity.Common,
    artworkKey: 'card_006',
  },

  // Uncommon cards (IDs 7-10) — 15-19 total value
  {
    id: 7,
    name: 'Wolf',
    values: { top: 4, right: 5, bottom: 3, left: 3 },
    element: Element.None,
    rarity: Rarity.Uncommon,
    artworkKey: 'card_007',
  },
  {
    id: 8,
    name: 'Griffin',
    values: { top: 5, right: 4, bottom: 3, left: 4 },
    element: Element.None,
    rarity: Rarity.Uncommon,
    artworkKey: 'card_008',
  },
  {
    id: 9,
    name: 'Gargoyle',
    values: { top: 4, right: 3, bottom: 5, left: 4 },
    element: Element.Fire,
    rarity: Rarity.Uncommon,
    artworkKey: 'card_009',
  },
  {
    id: 10,
    name: 'Wraith',
    values: { top: 3, right: 5, bottom: 4, left: 3 },
    element: Element.None,
    rarity: Rarity.Uncommon,
    artworkKey: 'card_010',
  },

  // Rare cards (IDs 11-13) — 20-24 total value
  {
    id: 11,
    name: 'Dragon',
    values: { top: 6, right: 5, bottom: 5, left: 5 },
    element: Element.Fire,
    rarity: Rarity.Rare,
    artworkKey: 'card_011',
  },
  {
    id: 12,
    name: 'Lich',
    values: { top: 5, right: 6, bottom: 4, left: 5 },
    element: Element.None,
    rarity: Rarity.Rare,
    artworkKey: 'card_012',
  },
  {
    id: 13,
    name: 'Hydra',
    values: { top: 4, right: 5, bottom: 6, left: 5 },
    element: Element.Water,
    rarity: Rarity.Rare,
    artworkKey: 'card_013',
  },

  // Epic card (ID 14) — 25-29 total value
  {
    id: 14,
    name: 'Chimera',
    values: { top: 7, right: 6, bottom: 6, left: 6 },
    element: Element.None,
    rarity: Rarity.Epic,
    artworkKey: 'card_014',
  },

  // Legendary card (ID 15) — 30-35 total value
  {
    id: 15,
    name: 'Bahamut',
    values: { top: 9, right: 8, bottom: 8, left: 8 },
    element: Element.None,
    rarity: Rarity.Legendary,
    artworkKey: 'card_015',
  },
];

/**
 * Look up a card by its ID.
 * @param id The card ID to find
 * @returns The card definition, or undefined if not found
 */
export function getCardById(id: number): CardDef | undefined {
  return CARDS.find((c) => c.id === id);
}
