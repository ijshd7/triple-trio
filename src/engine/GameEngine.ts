import {
  GameState,
  GamePhase,
  RuleType,
  CardDef,
  MoveResult,
  GameEvent,
  AIMove,
} from '../data/types';
import {
  createInitialState,
  cloneState,
  getPlayer,
  removeCardFromHand,
  recalculateScores,
  advanceTurn,
  checkGameOver,
} from './GameState';
import { placeCardOnBoard, isCellEmpty } from './Board';
import { RuleEngine } from './RuleEngine';

/* ──────────────────────────────────────────────────────────────
   Game Engine for Triple Trio
   Main API: placeCard() orchestrates the full turn sequence
   ────────────────────────────────────────────────────────────── */

export interface GameEngineConfig {
  blueHand: CardDef[];
  redHand: CardDef[];
  activeRules: RuleType[];
  blueIsAI: boolean;
  redIsAI: boolean;
}

export class GameEngine {
  private state: GameState;
  private readonly ruleEngine: RuleEngine;

  constructor(config: GameEngineConfig) {
    this.state = createInitialState(
      config.blueHand,
      config.redHand,
      config.activeRules,
      config.blueIsAI,
      config.redIsAI
    );
    this.ruleEngine = new RuleEngine(config.activeRules);
  }

  /**
   * Get the current game state.
   */
  getState(): GameState {
    return this.state;
  }

  /**
   * Clone the engine with an independent copy of the current state.
   * Used by AI to simulate moves without affecting the real game.
   */
  clone(): GameEngine {
    const cloned = new GameEngine({
      blueHand: [],
      redHand: [],
      activeRules: this.state.activeRules,
      blueIsAI: false,
      redIsAI: false,
    });
    cloned.state = cloneState(this.state);
    return cloned;
  }

  /**
   * Main API: Place a card on the board at the given cell.
   * Returns a MoveResult with the new state and all events that occurred.
   *
   * Orchestrates 13 steps:
   * 1. Validate phase, bounds, cell empty, hand index
   * 2. Build events array
   * 3. Extract card from hand
   * 4. Emit card-placed event
   * 5. Place card on board
   * 6. Remove card from hand
   * 7. Evaluate captures
   * 8. Apply captures + emit capture events
   * 9. Recalculate scores
   * 10. Check game over
   * 11. If not over, advance turn + emit turn-changed
   * 12. Update state
   * 13. Return result
   */
  placeCard(handIndex: number, row: number, col: number): MoveResult {
    // ──────────────────────────────────────────────────────────────
    // 1. VALIDATE
    // ──────────────────────────────────────────────────────────────
    if (this.state.phase !== GamePhase.Playing) {
      throw new Error('Game is not in Playing phase');
    }

    if (row < 0 || row > 2 || col < 0 || col > 2) {
      throw new Error(`Cell (${row}, ${col}) is out of bounds`);
    }

    if (!isCellEmpty(this.state.board, row, col)) {
      throw new Error(`Cell (${row}, ${col}) is already occupied`);
    }

    const currentPlayer = getPlayer(this.state, this.state.currentTurn);
    if (handIndex < 0 || handIndex >= currentPlayer.hand.length) {
      throw new Error(`Hand index ${handIndex} is invalid`);
    }

    // ──────────────────────────────────────────────────────────────
    // 2. BUILD EVENTS ARRAY
    // ──────────────────────────────────────────────────────────────
    const events: GameEvent[] = [];

    // ──────────────────────────────────────────────────────────────
    // 3. EXTRACT CARD
    // ──────────────────────────────────────────────────────────────
    const placedCard = currentPlayer.hand[handIndex];

    // ──────────────────────────────────────────────────────────────
    // 4. EMIT CARD-PLACED EVENT
    // ──────────────────────────────────────────────────────────────
    events.push({
      type: 'card-placed',
      row,
      col,
      card: placedCard,
      owner: this.state.currentTurn,
    });

    // ──────────────────────────────────────────────────────────────
    // 5. PLACE CARD ON BOARD
    // ──────────────────────────────────────────────────────────────
    const cardInstance = { card: placedCard, owner: this.state.currentTurn };
    let newBoard = placeCardOnBoard(this.state.board, row, col, cardInstance);

    // ──────────────────────────────────────────────────────────────
    // 6. REMOVE CARD FROM HAND
    // ──────────────────────────────────────────────────────────────
    let newState = removeCardFromHand(
      this.state,
      this.state.currentTurn,
      handIndex
    );
    newState.board = newBoard;

    // ──────────────────────────────────────────────────────────────
    // 7. EVALUATE CAPTURES
    // ──────────────────────────────────────────────────────────────
    const captures = this.ruleEngine.evaluate(
      newBoard,
      row,
      col,
      placedCard,
      this.state.currentTurn
    );

    // ──────────────────────────────────────────────────────────────
    // 8. APPLY CAPTURES + EMIT CAPTURE EVENTS
    // ──────────────────────────────────────────────────────────────
    for (const capture of captures) {
      events.push({
        type: 'card-captured',
        row: capture.row,
        col: capture.col,
        newOwner: capture.newOwner,
        byRule: capture.byRule,
      });
    }

    newBoard = this.ruleEngine.applyCaptures(newBoard, captures);
    newState.board = newBoard;

    // ──────────────────────────────────────────────────────────────
    // 9. RECALCULATE SCORES
    // ──────────────────────────────────────────────────────────────
    newState = recalculateScores(newState);

    // ──────────────────────────────────────────────────────────────
    // 10. CHECK GAME OVER
    // ──────────────────────────────────────────────────────────────
    newState = checkGameOver(newState);

    if (newState.phase === GamePhase.GameOver) {
      // Game is over — emit game-over event
      // winner is guaranteed non-null here by checkGameOver's contract
      const blueScore = newState.players[0].score;
      const redScore = newState.players[1].score;
      events.push({
        type: 'game-over',
        winner: newState.winner!,
        blueScore,
        redScore,
      });
    } else {
      // ──────────────────────────────────────────────────────────
      // 11. ADVANCE TURN + EMIT TURN-CHANGED
      // ──────────────────────────────────────────────────────────
      newState = advanceTurn(newState);
      events.push({
        type: 'turn-changed',
        newTurn: newState.currentTurn,
      });
    }

    // ──────────────────────────────────────────────────────────────
    // 12. UPDATE STATE
    // ──────────────────────────────────────────────────────────────
    this.state = newState;

    // ──────────────────────────────────────────────────────────────
    // 13. RETURN RESULT
    // ──────────────────────────────────────────────────────────────
    return { newState, events };
  }

  /**
   * Check if a move is valid without throwing an error.
   * Used by AI and UI validation logic.
   */
  isValidMove(handIndex: number, row: number, col: number): boolean {
    if (this.state.phase !== GamePhase.Playing) {
      return false;
    }

    if (row < 0 || row > 2 || col < 0 || col > 2) {
      return false;
    }

    if (!isCellEmpty(this.state.board, row, col)) {
      return false;
    }

    const currentPlayer = getPlayer(this.state, this.state.currentTurn);
    return handIndex >= 0 && handIndex < currentPlayer.hand.length;
  }

  /**
   * Get all valid moves for the current turn.
   * Used by AI to enumerate possible moves.
   */
  getValidMoves(): AIMove[] {
    const currentPlayer = getPlayer(this.state, this.state.currentTurn);
    const moves: AIMove[] = [];

    for (
      let handIndex = 0;
      handIndex < currentPlayer.hand.length;
      handIndex++
    ) {
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          if (this.isValidMove(handIndex, row, col)) {
            moves.push({ handIndex, row, col });
          }
        }
      }
    }

    return moves;
  }
}
