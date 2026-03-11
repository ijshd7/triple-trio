import { Board, BoardCell, CardDef, CardInstance, Direction, Element, PlayerSide } from '../data/types';

/* ──────────────────────────────────────────────────────────────
   Board Utilities for Triple Trio
   Pure functions for board creation, adjacency, and manipulation
   ────────────────────────────────────────────────────────────── */

// Direction deltas: [rowDelta, colDelta] indexed by Direction enum value
const DIRECTION_DELTAS: [number, number][] = [
  [-1, 0], // Direction.Top    = 0
  [0, 1],  // Direction.Right  = 1
  [1, 0],  // Direction.Bottom = 2
  [0, -1], // Direction.Left   = 3
];

/**
 * Maps each direction to its opposite direction.
 * Used by capture rules to determine which face of a neighbor card is exposed.
 */
export const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  [Direction.Top]: Direction.Bottom,
  [Direction.Right]: Direction.Left,
  [Direction.Bottom]: Direction.Top,
  [Direction.Left]: Direction.Right,
};

/**
 * Default elemental layout for 3x3 board (FF8-style).
 * Corners and edges have elements; center is None.
 */
export const DEFAULT_ELEMENT_LAYOUT: Element[][] = [
  [Element.Fire, Element.None, Element.Ice],
  [Element.None, Element.None, Element.None],
  [Element.Thunder, Element.None, Element.Water],
];

/**
 * Create an empty 3x3 board with all cells empty.
 * @param elementLayout Optional 3x3 grid of elements; if omitted, all cells are Element.None
 */
export function createBoard(elementLayout?: Element[][]): Board {
  const board: Board = [];
  for (let row = 0; row < 3; row++) {
    board[row] = [];
    for (let col = 0; col < 3; col++) {
      const element =
        elementLayout?.[row]?.[col] ?? Element.None;
      board[row][col] = {
        row,
        col,
        card: null,
        element,
      };
    }
  }
  return board;
}

/**
 * Deep clone a board.
 * Creates new BoardCell and CardInstance objects, but shares CardDef references (immutable).
 */
export function cloneBoard(board: Board): Board {
  const cloned: Board = [];
  for (let row = 0; row < 3; row++) {
    cloned[row] = [];
    for (let col = 0; col < 3; col++) {
      const original = board[row][col];
      cloned[row][col] = {
        row,
        col,
        card: original.card
          ? {
              card: original.card.card,
              owner: original.card.owner,
            }
          : null,
        element: original.element,
      };
    }
  }
  return cloned;
}

/**
 * Get all adjacent cells that are in bounds.
 * Returns an array of neighbors with their relative direction labels.
 */
export function getAdjacentCells(
  board: Board,
  row: number,
  col: number
): Array<{ cell: BoardCell; direction: Direction }> {
  const neighbors: Array<{ cell: BoardCell; direction: Direction }> = [];

  for (let dir = Direction.Top; dir <= Direction.Left; dir++) {
    const [rowDelta, colDelta] = DIRECTION_DELTAS[dir];
    const newRow = row + rowDelta;
    const newCol = col + colDelta;

    // Bounds check: 0 <= row,col <= 2
    if (newRow >= 0 && newRow <= 2 && newCol >= 0 && newCol <= 2) {
      neighbors.push({ cell: board[newRow][newCol], direction: dir });
    }
  }

  return neighbors;
}

/**
 * Check if a cell is empty.
 */
export function isCellEmpty(board: Board, row: number, col: number): boolean {
  return board[row][col].card === null;
}

/**
 * Place a card on the board and return a new board.
 * Does not mutate the original board.
 */
export function placeCardOnBoard(
  board: Board,
  row: number,
  col: number,
  instance: CardInstance
): Board {
  const newBoard = cloneBoard(board);
  newBoard[row][col].card = instance;
  return newBoard;
}

/**
 * Get the value of a card's specified directional face.
 * @param card The card definition
 * @param direction The direction to fetch the value from
 * @returns The card's value facing that direction (1-10)
 */
export function getCardValue(card: CardDef, direction: Direction): number {
  switch (direction) {
    case Direction.Top:
      return card.values.top;
    case Direction.Right:
      return card.values.right;
    case Direction.Bottom:
      return card.values.bottom;
    case Direction.Left:
      return card.values.left;
    default:
      throw new Error(`Invalid direction: ${direction}`);
  }
}

/**
 * Count how many cards on the board are owned by a given player.
 */
export function countCardsOwnedOnBoard(board: Board, side: PlayerSide): number {
  let count = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const cell = board[row][col];
      if (cell.card !== null && cell.card.owner === side) {
        count++;
      }
    }
  }
  return count;
}
