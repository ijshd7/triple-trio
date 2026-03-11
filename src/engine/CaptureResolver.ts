import { Board } from '../data/types';
import { cloneBoard } from './Board';
import { BasicRule, CaptureResult } from './rules/BasicRule';

/* ──────────────────────────────────────────────────────────────
   Capture Resolver for Triple Trio
   After Same/Plus captures, runs combo cascade: each newly flipped
   card is re-evaluated with Basic rule only. Repeats until no new
   captures. Tracks visited cells to prevent infinite loops.
   ────────────────────────────────────────────────────────────── */

function applyCaptures(board: Board, captures: CaptureResult[]): Board {
  const newBoard = cloneBoard(board);
  for (const capture of captures) {
    const cell = newBoard[capture.row][capture.col];
    if (cell.card !== null) {
      cell.card.owner = capture.newOwner;
    }
  }
  return newBoard;
}

/**
 * Resolve combo/cascade captures after Same or Plus rule triggers.
 * Each newly captured card is re-evaluated as if just placed, using
 * only the Basic rule. Repeats until no new captures occur.
 *
 * @param board Current board state (with initial Same/Plus captures applied)
 * @param initialCaptures Captures from Same or Plus rule
 * @param basicRule BasicRule instance (with activeRules for elemental)
 * @returns All captures including cascade, and the final board state
 */
export function resolveComboCascade(
  board: Board,
  initialCaptures: CaptureResult[],
  basicRule: BasicRule
): { captures: CaptureResult[]; finalBoard: Board } {
  const allCaptures = [...initialCaptures];
  let currentBoard = applyCaptures(board, initialCaptures);
  const visited = new Set<string>();

  for (const c of initialCaptures) {
    visited.add(`${c.row},${c.col}`);
  }

  let pendingCells = [...initialCaptures];

  while (pendingCells.length > 0) {
    const nextPending: CaptureResult[] = [];

    for (const prevCapture of pendingCells) {
      const { row, col } = prevCapture;
      const cell = currentBoard[row][col];
      if (cell.card === null) continue;

      const card = cell.card.card;
      const owner = cell.card.owner;

      const cascadeCaptures = basicRule.evaluate(
        currentBoard,
        row,
        col,
        card,
        owner
      );

      for (const cap of cascadeCaptures) {
        const key = `${cap.row},${cap.col}`;
        if (!visited.has(key)) {
          visited.add(key);
          allCaptures.push(cap);
          nextPending.push(cap);
        }
      }
    }

    if (nextPending.length > 0) {
      currentBoard = applyCaptures(currentBoard, nextPending);
    }

    pendingCells = nextPending;
  }

  return { captures: allCaptures, finalBoard: currentBoard };
}
