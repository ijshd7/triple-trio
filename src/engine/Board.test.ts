import { describe, it, expect } from 'vitest';
import {
  createBoard,
  cloneBoard,
  getAdjacentCells,
  isCellEmpty,
  placeCardOnBoard,
  getCardValue,
  countCardsOwnedOnBoard,
  OPPOSITE_DIRECTION,
  DEFAULT_ELEMENT_LAYOUT,
} from './Board';
import { Element, Direction, PlayerSide } from '../data/types';
import type { CardDef, CardInstance } from '../data/types';

const mockCard: CardDef = {
  id: 1,
  name: 'Test',
  values: { top: 1, right: 2, bottom: 3, left: 4 },
  element: Element.None,
  rarity: 1,
  artworkKey: 'test',
};

describe('createBoard', () => {
  it('creates a 3x3 board with empty cells', () => {
    const board = createBoard();
    expect(board).toHaveLength(3);
    expect(board[0]).toHaveLength(3);
    expect(board[1]).toHaveLength(3);
    expect(board[2]).toHaveLength(3);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        expect(board[r][c].row).toBe(r);
        expect(board[r][c].col).toBe(c);
        expect(board[r][c].card).toBeNull();
        expect(board[r][c].element).toBe(Element.None);
      }
    }
  });

  it('uses custom element layout when provided', () => {
    const board = createBoard(DEFAULT_ELEMENT_LAYOUT);
    expect(board[0][0].element).toBe(Element.Fire);
    expect(board[0][2].element).toBe(Element.Ice);
    expect(board[2][0].element).toBe(Element.Thunder);
    expect(board[2][2].element).toBe(Element.Water);
    expect(board[1][1].element).toBe(Element.None);
  });
});

describe('cloneBoard', () => {
  it('creates independent copy of board', () => {
    const board = createBoard();
    const instance: CardInstance = { card: mockCard, owner: PlayerSide.Blue };
    board[1][1].card = instance;
    const cloned = cloneBoard(board);
    expect(cloned).not.toBe(board);
    expect(cloned[1][1].card).not.toBeNull();
    expect(cloned[1][1].card?.card).toBe(mockCard);
    expect(cloned[1][1].card?.owner).toBe(PlayerSide.Blue);
  });
});

describe('getAdjacentCells', () => {
  it('returns 4 neighbors for center cell', () => {
    const board = createBoard();
    const neighbors = getAdjacentCells(board, 1, 1);
    expect(neighbors).toHaveLength(4);
  });

  it('returns 2 neighbors for corner cell', () => {
    const board = createBoard();
    const neighbors = getAdjacentCells(board, 0, 0);
    expect(neighbors).toHaveLength(2);
  });

  it('returns 3 neighbors for edge cell', () => {
    const board = createBoard();
    const neighbors = getAdjacentCells(board, 0, 1);
    expect(neighbors).toHaveLength(3);
  });
});

describe('isCellEmpty', () => {
  it('returns true for empty cell', () => {
    const board = createBoard();
    expect(isCellEmpty(board, 1, 1)).toBe(true);
  });

  it('returns false for occupied cell', () => {
    const board = createBoard();
    board[1][1].card = { card: mockCard, owner: PlayerSide.Blue };
    expect(isCellEmpty(board, 1, 1)).toBe(false);
  });
});

describe('placeCardOnBoard', () => {
  it('places card without mutating original board', () => {
    const board = createBoard();
    const instance: CardInstance = { card: mockCard, owner: PlayerSide.Blue };
    const newBoard = placeCardOnBoard(board, 1, 1, instance);
    expect(board[1][1].card).toBeNull();
    expect(newBoard[1][1].card).not.toBeNull();
    expect(newBoard[1][1].card?.owner).toBe(PlayerSide.Blue);
  });
});

describe('getCardValue', () => {
  it('returns correct value for each direction', () => {
    expect(getCardValue(mockCard, Direction.Top)).toBe(1);
    expect(getCardValue(mockCard, Direction.Right)).toBe(2);
    expect(getCardValue(mockCard, Direction.Bottom)).toBe(3);
    expect(getCardValue(mockCard, Direction.Left)).toBe(4);
  });
});

describe('countCardsOwnedOnBoard', () => {
  it('returns 0 for empty board', () => {
    const board = createBoard();
    expect(countCardsOwnedOnBoard(board, PlayerSide.Blue)).toBe(0);
    expect(countCardsOwnedOnBoard(board, PlayerSide.Red)).toBe(0);
  });

  it('counts cards by owner', () => {
    const board = createBoard();
    board[0][0].card = { card: mockCard, owner: PlayerSide.Blue };
    board[1][1].card = { card: mockCard, owner: PlayerSide.Red };
    expect(countCardsOwnedOnBoard(board, PlayerSide.Blue)).toBe(1);
    expect(countCardsOwnedOnBoard(board, PlayerSide.Red)).toBe(1);
  });
});

describe('OPPOSITE_DIRECTION', () => {
  it('maps each direction to its opposite', () => {
    expect(OPPOSITE_DIRECTION[Direction.Top]).toBe(Direction.Bottom);
    expect(OPPOSITE_DIRECTION[Direction.Bottom]).toBe(Direction.Top);
    expect(OPPOSITE_DIRECTION[Direction.Left]).toBe(Direction.Right);
    expect(OPPOSITE_DIRECTION[Direction.Right]).toBe(Direction.Left);
  });
});
