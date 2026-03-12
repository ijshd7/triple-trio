import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  cloneState,
  getPlayer,
  advanceTurn,
  checkGameOver,
  recalculateScores,
  removeCardFromHand,
} from './GameState';
import { CARDS } from '../data/cards';
import { GamePhase, PlayerSide, RuleType } from '../data/types';

describe('createInitialState', () => {
  it('creates state with 5 cards each and Blue first', () => {
    const blueHand = CARDS.slice(0, 5);
    const redHand = CARDS.slice(5, 10);
    const state = createInitialState(blueHand, redHand, [], false, false);
    expect(state.players[0].hand).toHaveLength(5);
    expect(state.players[1].hand).toHaveLength(5);
    expect(state.players[0].score).toBe(5);
    expect(state.players[1].score).toBe(5);
    expect(state.currentTurn).toBe(PlayerSide.Blue);
    expect(state.turnNumber).toBe(1);
    expect(state.phase).toBe(GamePhase.Playing);
    expect(state.winner).toBeNull();
  });

  it('uses element layout when Elemental rule is active', () => {
    const state = createInitialState(
      CARDS.slice(0, 5),
      CARDS.slice(5, 10),
      [RuleType.Elemental],
      false,
      false
    );
    expect(state.board[0][0].element).not.toBe(0); // Not Element.None
  });
});

describe('cloneState', () => {
  it('creates independent copy', () => {
    const state = createInitialState(
      CARDS.slice(0, 5),
      CARDS.slice(5, 10),
      [],
      false,
      false
    );
    const cloned = cloneState(state);
    expect(cloned).not.toBe(state);
    expect(cloned.board).not.toBe(state.board);
    expect(cloned.players).not.toBe(state.players);
    expect(cloned.currentTurn).toBe(state.currentTurn);
  });
});

describe('getPlayer', () => {
  it('returns correct player by side', () => {
    const state = createInitialState(
      CARDS.slice(0, 5),
      CARDS.slice(5, 10),
      [],
      false,
      false
    );
    expect(getPlayer(state, PlayerSide.Blue)).toBe(state.players[0]);
    expect(getPlayer(state, PlayerSide.Red)).toBe(state.players[1]);
  });
});

describe('advanceTurn', () => {
  it('swaps turn and increments turn number', () => {
    const state = createInitialState(
      CARDS.slice(0, 5),
      CARDS.slice(5, 10),
      [],
      false,
      false
    );
    const next = advanceTurn(state);
    expect(next.currentTurn).toBe(PlayerSide.Red);
    expect(next.turnNumber).toBe(2);
  });
});

describe('checkGameOver', () => {
  it('returns unchanged state when game not over', () => {
    const state = createInitialState(
      CARDS.slice(0, 5),
      CARDS.slice(5, 10),
      [],
      false,
      false
    );
    const result = checkGameOver(state);
    expect(result).toBe(state);
    expect(result.phase).toBe(GamePhase.Playing);
  });

  it('sets GameOver when turnNumber > 9', () => {
    const state = createInitialState(
      CARDS.slice(0, 5),
      CARDS.slice(5, 10),
      [],
      false,
      false
    );
    state.turnNumber = 10;
    const result = checkGameOver(state);
    expect(result.phase).toBe(GamePhase.GameOver);
    expect(result.winner).not.toBeNull();
  });
});

describe('recalculateScores', () => {
  it('updates scores based on board and hand', () => {
    const state = createInitialState(
      CARDS.slice(0, 5),
      CARDS.slice(5, 10),
      [],
      false,
      false
    );
    const result = recalculateScores(state);
    expect(result.players[0].score).toBe(5); // 0 on board + 5 in hand
    expect(result.players[1].score).toBe(5);
  });
});

describe('removeCardFromHand', () => {
  it('removes card at index', () => {
    const state = createInitialState(
      CARDS.slice(0, 5),
      CARDS.slice(5, 10),
      [],
      false,
      false
    );
    const result = removeCardFromHand(state, PlayerSide.Blue, 0);
    expect(result.players[0].hand).toHaveLength(4);
    expect(result.players[0].hand[0].name).not.toBe(
      state.players[0].hand[0].name
    );
  });
});
