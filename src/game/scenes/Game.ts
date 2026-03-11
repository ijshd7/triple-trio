import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { GameEngine } from '../../engine/GameEngine';
import { BoardGrid } from '../objects/BoardGrid';
import {
  GameState,
  GamePhase,
  RuleType,
  CardDef,
} from '../../data/types';
import { CARDS } from '../../data/cards';
import { getPlayer } from '../../engine/GameState';

/* ──────────────────────────────────────────────────────────────
   Game Scene - Main gameplay with board rendering + engine wiring
   Phase 2: Playable hotseat with basic capture, no animations
   Hand is rendered by React PlayerHand; Phaser handles board only
   ────────────────────────────────────────────────────────────── */

export class Game extends Scene {
  private engine: GameEngine | null = null;
  private boardGrid: BoardGrid | null = null;
  private selectedHandIndex: number | null = null;

  constructor() {
    super('Game');
  }

  init(data: { blueHand?: CardDef[]; redHand?: CardDef[] }) {
    const blueHand = data.blueHand ?? CARDS.slice(0, 5);
    const redHand = data.redHand ?? CARDS.slice(5, 10);

    this.engine = new GameEngine({
      blueHand,
      redHand,
      activeRules: [RuleType.Basic],
      blueIsAI: false,
      redIsAI: false,
    });
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0f172a);

    if (!this.engine) return;

    const state = this.engine.getState();

    this.boardGrid = new BoardGrid(this, (row, col) => this.onCellClick(row, col));
    this.add.existing(this.boardGrid);

    this.boardGrid.syncBoard(state.board);

    this.add
      .text(512, 50, 'Triple Trio', {
        fontSize: '28px',
        color: '#f8fafc',
      })
      .setOrigin(0.5);

    this.add
      .text(512, 730, `${state.players[0].score} - ${state.players[1].score}`, {
        fontSize: '20px',
        color: '#94a3b8',
      })
      .setOrigin(0.5)
      .setName('score-display');

    this.add
      .text(900, 50, `Turn: ${state.currentTurn}`, {
        fontSize: '16px',
        color: '#cbd5e1',
      })
      .setOrigin(0.5)
      .setName('turn-display');

    EventBus.on('card-selected', this.onCardSelected, this);
    EventBus.emit('game-state-changed', state);
    EventBus.emit('current-scene-ready', this);
  }

  private onCardSelected(handIndex: number) {
    if (!this.engine) return;
    const state = this.engine.getState();
    if (state.phase !== GamePhase.Playing) return;

    const currentPlayer = getPlayer(state, state.currentTurn);
    if (handIndex < 0 || handIndex >= currentPlayer.hand.length) return;

    this.selectedHandIndex = handIndex;
    EventBus.emit('card-selection-changed', handIndex);
  }

  private onCellClick(row: number, col: number) {
    if (!this.engine || this.selectedHandIndex === null) return;

    if (!this.engine.isValidMove(this.selectedHandIndex, row, col)) {
      return;
    }

    const result = this.engine.placeCard(this.selectedHandIndex, row, col);
    this.selectedHandIndex = null;
    EventBus.emit('card-selection-changed', null);

    this.syncFromState(result.newState);

    if (result.newState.phase === GamePhase.GameOver) {
      this.scene.start('GameOver', {
        winner: result.newState.winner,
        blueScore: result.newState.players[0].score,
        redScore: result.newState.players[1].score,
      });
    }
  }

  private syncFromState(state: GameState) {
    this.boardGrid?.syncBoard(state.board);

    const scoreDisplay = this.children.getByName('score-display') as Phaser.GameObjects.Text;
    if (scoreDisplay) {
      scoreDisplay.setText(`${state.players[0].score} - ${state.players[1].score}`);
    }

    const turnDisplay = this.children.getByName('turn-display') as Phaser.GameObjects.Text;
    if (turnDisplay) {
      turnDisplay.setText(`Turn: ${state.currentTurn}`);
    }

    EventBus.emit('game-state-changed', state);
  }

  shutdown() {
    EventBus.off('card-selected', this.onCardSelected, this);
  }
}
