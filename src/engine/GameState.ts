import { GamePhase, GameState, Player, PlayerSide, RuleType, CardDef } from '../data/types';
import { createBoard, cloneBoard, countCardsOwnedOnBoard, DEFAULT_ELEMENT_LAYOUT } from './Board';

/* ──────────────────────────────────────────────────────────────
   Game State Management for Triple Trio
   Pure functions for state creation, cloning, scoring, and turn logic
   ────────────────────────────────────────────────────────────── */

/**
 * Create the initial game state.
 * Both players start with 5 cards in hand, scoring 5 points each.
 * Blue always goes first.
 * When Elemental rule is active, uses default element layout on board.
 */
export function createInitialState(
  blueHand: CardDef[],
  redHand: CardDef[],
  activeRules: RuleType[],
  blueIsAI: boolean,
  redIsAI: boolean
): GameState {
  const elementLayout = activeRules.includes(RuleType.Elemental)
    ? DEFAULT_ELEMENT_LAYOUT
    : undefined;
  return {
    board: createBoard(elementLayout),
    players: [
      {
        side: PlayerSide.Blue,
        hand: [...blueHand],
        score: 5,
        isAI: blueIsAI,
      },
      {
        side: PlayerSide.Red,
        hand: [...redHand],
        score: 5,
        isAI: redIsAI,
      },
    ],
    currentTurn: PlayerSide.Blue,
    turnNumber: 1,
    activeRules: [...activeRules],
    phase: GamePhase.Playing,
    winner: null,
  };
}

/**
 * Deep clone a game state.
 * Creates fully independent state for AI simulation.
 */
export function cloneState(state: GameState): GameState {
  return {
    board: cloneBoard(state.board),
    players: [
      {
        side: state.players[0].side,
        hand: [...state.players[0].hand],
        score: state.players[0].score,
        isAI: state.players[0].isAI,
      },
      {
        side: state.players[1].side,
        hand: [...state.players[1].hand],
        score: state.players[1].score,
        isAI: state.players[1].isAI,
      },
    ] as [Player, Player],
    currentTurn: state.currentTurn,
    turnNumber: state.turnNumber,
    activeRules: [...state.activeRules],
    phase: state.phase,
    winner: state.winner,
  };
}

/**
 * Get a player by side.
 * players[0] is always Blue, players[1] is always Red.
 */
export function getPlayer(state: GameState, side: PlayerSide): Player {
  return state.players[side === PlayerSide.Blue ? 0 : 1];
}

/**
 * Get the opponent of a given player side.
 */
export function getOpponent(state: GameState, side: PlayerSide): Player {
  return state.players[side === PlayerSide.Blue ? 1 : 0];
}

/**
 * Recalculate scores for both players.
 * Score = cards owned on board + cards remaining in hand.
 */
export function recalculateScores(state: GameState): GameState {
  const newState = cloneState(state);
  newState.players[0].score =
    countCardsOwnedOnBoard(state.board, PlayerSide.Blue) + state.players[0].hand.length;
  newState.players[1].score =
    countCardsOwnedOnBoard(state.board, PlayerSide.Red) + state.players[1].hand.length;
  return newState;
}

/**
 * Remove a card from a player's hand (by index) and return new state.
 */
export function removeCardFromHand(
  state: GameState,
  side: PlayerSide,
  handIndex: number
): GameState {
  const newState = cloneState(state);
  const playerIdx = side === PlayerSide.Blue ? 0 : 1;
  newState.players[playerIdx].hand = newState.players[playerIdx].hand.filter(
    (_card, idx) => idx !== handIndex
  );
  return newState;
}

/**
 * Advance to the next player's turn and increment turn number.
 */
export function advanceTurn(state: GameState): GameState {
  const newState = cloneState(state);
  newState.currentTurn = state.currentTurn === PlayerSide.Blue ? PlayerSide.Red : PlayerSide.Blue;
  newState.turnNumber = state.turnNumber + 1;
  return newState;
}

/**
 * Check if the game is over and set the winner.
 * Game ends when turnNumber > 9 (all 9 cells filled) or board is completely full.
 */
export function checkGameOver(state: GameState): GameState {
  // Check if all cells are filled or we've exceeded 9 turns
  let filledCells = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (state.board[row][col].card !== null) {
        filledCells++;
      }
    }
  }

  if (state.turnNumber > 9 || filledCells >= 9) {
    const newState = cloneState(state);
    newState.phase = GamePhase.GameOver;

    const blueScore = newState.players[0].score;
    const redScore = newState.players[1].score;

    if (blueScore > redScore) {
      newState.winner = PlayerSide.Blue;
    } else if (redScore > blueScore) {
      newState.winner = PlayerSide.Red;
    } else {
      newState.winner = 'draw';
    }

    return newState;
  }

  return state;
}
