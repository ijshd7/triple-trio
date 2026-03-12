import { describe, it, expect } from 'vitest';
import { GameEngine } from './GameEngine';
import { CARDS } from '../data/cards';
import { GamePhase, PlayerSide } from '../data/types';

describe('GameEngine', () => {
  const blueHand = CARDS.slice(0, 5);
  const redHand = CARDS.slice(5, 10);

  describe('constructor and getState', () => {
    it('creates initial state with both hands', () => {
      const engine = new GameEngine({
        blueHand,
        redHand,
        activeRules: [],
        blueIsAI: false,
        redIsAI: false,
      });
      const state = engine.getState();
      expect(state.phase).toBe(GamePhase.Playing);
      expect(state.currentTurn).toBe(PlayerSide.Blue);
      expect(state.players[0].hand).toHaveLength(5);
      expect(state.players[1].hand).toHaveLength(5);
    });
  });

  describe('placeCard', () => {
    it('places card and returns events', () => {
      const engine = new GameEngine({
        blueHand,
        redHand,
        activeRules: [],
        blueIsAI: false,
        redIsAI: false,
      });
      const result = engine.placeCard(0, 1, 1);
      expect(result.events).toContainEqual(
        expect.objectContaining({ type: 'card-placed', row: 1, col: 1 })
      );
      expect(result.newState.board[1][1].card).not.toBeNull();
      expect(result.newState.currentTurn).toBe(PlayerSide.Red);
    });

    it('completes full 9-turn game', () => {
      const engine = new GameEngine({
        blueHand,
        redHand,
        activeRules: [],
        blueIsAI: false,
        redIsAI: false,
      });
      for (let i = 0; i < 9; i++) {
        const moves = engine.getValidMoves();
        expect(moves.length).toBeGreaterThan(0);
        const { handIndex, row, col } = moves[0];
        engine.placeCard(handIndex, row, col);
      }
      const final = engine.getState();
      expect(final.phase).toBe(GamePhase.GameOver);
      expect(final.winner).not.toBeNull();
    });

    it('throws on invalid move', () => {
      const engine = new GameEngine({
        blueHand,
        redHand,
        activeRules: [],
        blueIsAI: false,
        redIsAI: false,
      });
      expect(() => engine.placeCard(0, 1, 1)).not.toThrow();
      expect(() => engine.placeCard(0, 1, 1)).toThrow(); // Cell occupied
      expect(() => engine.placeCard(0, 5, 5)).toThrow(); // Out of bounds
    });
  });

  describe('clone', () => {
    it('creates independent copy', () => {
      const engine = new GameEngine({
        blueHand,
        redHand,
        activeRules: [],
        blueIsAI: false,
        redIsAI: false,
      });
      engine.placeCard(0, 1, 1);
      const cloned = engine.clone();
      cloned.placeCard(0, 0, 0);
      const origState = engine.getState();
      const clonedState = cloned.getState();
      expect(origState.board[0][0].card).toBeNull();
      expect(clonedState.board[0][0].card).not.toBeNull();
    });
  });

  describe('isValidMove and getValidMoves', () => {
    it('isValidMove returns false for occupied cell', () => {
      const engine = new GameEngine({
        blueHand,
        redHand,
        activeRules: [],
        blueIsAI: false,
        redIsAI: false,
      });
      expect(engine.isValidMove(0, 1, 1)).toBe(true);
      engine.placeCard(0, 1, 1);
      expect(engine.isValidMove(0, 1, 1)).toBe(false);
    });

    it('getValidMoves returns all valid moves', () => {
      const engine = new GameEngine({
        blueHand,
        redHand,
        activeRules: [],
        blueIsAI: false,
        redIsAI: false,
      });
      const moves = engine.getValidMoves();
      expect(moves.length).toBeGreaterThan(0);
      expect(moves.length).toBeLessThanOrEqual(5 * 9); // 5 cards * 9 cells
    });
  });
});
