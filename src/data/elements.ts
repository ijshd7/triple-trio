import { Element } from './types';

/* ──────────────────────────────────────────────────────────────
   Element definitions for Triple Trio
   Used for Elemental rule: cell element affects card strength
   ────────────────────────────────────────────────────────────── */

/** Human-readable names for each element */
export const ELEMENT_NAMES: Record<Element, string> = {
  [Element.None]: 'None',
  [Element.Fire]: 'Fire',
  [Element.Ice]: 'Ice',
  [Element.Thunder]: 'Thunder',
  [Element.Earth]: 'Earth',
  [Element.Water]: 'Water',
  [Element.Wind]: 'Wind',
  [Element.Holy]: 'Holy',
  [Element.Poison]: 'Poison',
};

/**
 * Get the elemental modifier for a card placed on a cell.
 * - Matching element (card.element === cell.element): +1 to all values
 * - Elemental cell with non-matching card: -1 to all values
 * - Cell with Element.None: no modifier (0)
 */
export function getElementalModifier(
  cellElement: Element,
  cardElement: Element
): number {
  if (cellElement === Element.None) {
    return 0;
  }
  if (cardElement === cellElement) {
    return 1;
  }
  return -1;
}
