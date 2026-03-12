import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { GameEngine } from '../../engine/GameEngine';
import { BoardGrid } from '../objects/BoardGrid';
import {
  GameState,
  GamePhase,
  RuleType,
  CardDef,
  PlayerSide,
  GameEvent,
} from '../../data/types';
import { CARDS } from '../../data/cards';
import { getPlayer } from '../../engine/GameState';
import {
  getHandPosition,
  animatePlace,
  animateFlip,
  animateCaptureGlow,
  animateComboChain,
} from '../animations/CardAnimations';
import { BoardGrid as BoardGridStatic } from '../objects/BoardGrid';
import { playSfx } from '../SoundManager';
import { SFX_KEYS } from '../SoundManager';
import { GreedyAI } from '../../ai/GreedyAI';
import { MinimaxAI } from '../../ai/MinimaxAI';
import { AIPlayer } from '../../ai/AIPlayer';

export type AIDifficulty = 'easy' | 'hard';

/* ──────────────────────────────────────────────────────────────
   Game Scene - Main gameplay with board rendering + engine wiring
   Phase 5: AI opponent (Easy/Hard)
   ────────────────────────────────────────────────────────────── */

export class Game extends Scene {
  private engine: GameEngine | null = null;
  private boardGrid: BoardGrid | null = null;
  private selectedHandIndex: number | null = null;
  private isAnimating = false;
  private redAI: AIPlayer | null = null;
  private readonly boundOnCardSelected = (idx: number) =>
    this.onCardSelected(idx);

  constructor() {
    super('Game');
  }

  init(data: {
    blueHand?: CardDef[];
    redHand?: CardDef[];
    difficulty?: AIDifficulty;
  }) {
    const blueHand = data.blueHand ?? CARDS.slice(0, 5);
    const redHand = data.redHand ?? CARDS.slice(5, 10);
    const difficulty = data.difficulty ?? 'easy';

    this.redAI =
      difficulty === 'hard' ? new MinimaxAI(PlayerSide.Red) : new GreedyAI();

    this.engine = new GameEngine({
      blueHand,
      redHand,
      activeRules: [
        RuleType.Basic,
        RuleType.Same,
        RuleType.Plus,
        RuleType.Elemental,
      ],
      blueIsAI: false,
      redIsAI: true,
    });
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0f172a);

    if (!this.engine) return;

    const state = this.engine.getState();

    this.boardGrid = new BoardGrid(this, (row, col) => {
      void this.onCellClick(row, col);
    });
    this.add.existing(this.boardGrid);

    this.boardGrid.syncBoard(state.board);

    this.add
      .text(512, 50, 'Triple Trio', {
        fontSize: '28px',
        color: '#f8fafc',
      })
      .setOrigin(0.5);

    EventBus.on('card-selected', this.boundOnCardSelected, this);
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

  private async onCellClick(row: number, col: number) {
    if (!this.engine || this.selectedHandIndex === null || this.isAnimating)
      return;

    if (!this.engine.isValidMove(this.selectedHandIndex, row, col)) {
      return;
    }

    const handIndex = this.selectedHandIndex;
    const handSize = getPlayer(
      this.engine.getState(),
      this.engine.getState().currentTurn
    ).hand.length;
    this.selectedHandIndex = null;
    EventBus.emit('card-selection-changed', null);
    this.isAnimating = true;

    const result = this.engine.placeCard(handIndex, row, col);
    const { newState, events } = result;

    this.syncFromState(newState);

    const cellCenter = BoardGridStatic.getCellCenter(row, col);
    const handPos = getHandPosition(handIndex, handSize);

    const placedCard = this.boardGrid?.getCardSprite(row, col);
    if (placedCard) {
      playSfx(this, SFX_KEYS.CARD_PLACE);
      await animatePlace(
        this,
        placedCard,
        handPos.x,
        handPos.y,
        cellCenter.x,
        cellCenter.y
      );
    }

    const captureEvents = events.filter(
      (e): e is GameEvent & { type: 'card-captured' } =>
        e.type === 'card-captured'
    );

    if (captureEvents.length > 1) {
      const cards: Array<{
        sprite: import('../objects/CardSprite').CardSprite;
        newOwner: PlayerSide;
      }> = [];
      for (const ev of captureEvents) {
        const card = this.boardGrid?.getCardSprite(ev.row, ev.col);
        if (card) {
          const oldOwner =
            ev.newOwner === PlayerSide.Blue ? PlayerSide.Red : PlayerSide.Blue;
          card.setOwner(oldOwner);
          cards.push({ sprite: card, newOwner: ev.newOwner });
        }
      }
      await animateComboChain(this, cards, () => {
        playSfx(this, SFX_KEYS.CARD_FLIP);
        playSfx(this, SFX_KEYS.CARD_CAPTURE);
      });
    } else {
      for (const ev of captureEvents) {
        const card = this.boardGrid?.getCardSprite(ev.row, ev.col);
        if (card) {
          const oldOwner =
            ev.newOwner === PlayerSide.Blue ? PlayerSide.Red : PlayerSide.Blue;
          card.setOwner(oldOwner);
          playSfx(this, SFX_KEYS.CARD_FLIP);
          await animateFlip(this, card, ev.newOwner);
          playSfx(this, SFX_KEYS.CARD_CAPTURE);
          await animateCaptureGlow(this, card);
        }
      }
    }

    this.isAnimating = false;

    if (newState.phase === GamePhase.GameOver) {
      const playerWon = newState.winner === PlayerSide.Blue;
      playSfx(
        this,
        newState.winner === 'draw'
          ? SFX_KEYS.DEFEAT
          : playerWon
            ? SFX_KEYS.VICTORY
            : SFX_KEYS.DEFEAT
      );
      this.scene.start('GameOver', {
        winner: newState.winner,
        blueScore: newState.players[0].score,
        redScore: newState.players[1].score,
      });
    } else {
      EventBus.emit('game-state-changed', newState);
      if (newState.currentTurn === PlayerSide.Red && this.redAI) {
        this.time.delayedCall(500, () => this.executeAITurn());
      }
    }
  }

  private async executeAITurn() {
    if (!this.engine || this.isAnimating || !this.redAI) return;

    const state = this.engine.getState();
    if (
      state.phase !== GamePhase.Playing ||
      state.currentTurn !== PlayerSide.Red
    )
      return;

    this.isAnimating = true;

    const move = this.redAI.chooseMove(this.engine);
    const handSize = getPlayer(state, PlayerSide.Red).hand.length;

    const result = this.engine.placeCard(move.handIndex, move.row, move.col);
    const { newState, events } = result;

    this.syncFromState(newState);

    const cellCenter = BoardGridStatic.getCellCenter(move.row, move.col);
    const handPos = getHandPosition(move.handIndex, handSize);

    const placedCard = this.boardGrid?.getCardSprite(move.row, move.col);
    if (placedCard) {
      playSfx(this, SFX_KEYS.CARD_PLACE);
      await animatePlace(
        this,
        placedCard,
        handPos.x,
        handPos.y,
        cellCenter.x,
        cellCenter.y
      );
    }

    const captureEvents = events.filter(
      (e): e is GameEvent & { type: 'card-captured' } =>
        e.type === 'card-captured'
    );

    if (captureEvents.length > 1) {
      const cards: Array<{
        sprite: import('../objects/CardSprite').CardSprite;
        newOwner: PlayerSide;
      }> = [];
      for (const ev of captureEvents) {
        const card = this.boardGrid?.getCardSprite(ev.row, ev.col);
        if (card) {
          const oldOwner =
            ev.newOwner === PlayerSide.Blue ? PlayerSide.Red : PlayerSide.Blue;
          card.setOwner(oldOwner);
          cards.push({ sprite: card, newOwner: ev.newOwner });
        }
      }
      await animateComboChain(this, cards, () => {
        playSfx(this, SFX_KEYS.CARD_FLIP);
        playSfx(this, SFX_KEYS.CARD_CAPTURE);
      });
    } else {
      for (const ev of captureEvents) {
        const card = this.boardGrid?.getCardSprite(ev.row, ev.col);
        if (card) {
          const oldOwner =
            ev.newOwner === PlayerSide.Blue ? PlayerSide.Red : PlayerSide.Blue;
          card.setOwner(oldOwner);
          playSfx(this, SFX_KEYS.CARD_FLIP);
          await animateFlip(this, card, ev.newOwner);
          playSfx(this, SFX_KEYS.CARD_CAPTURE);
          await animateCaptureGlow(this, card);
        }
      }
    }

    this.isAnimating = false;

    if (newState.phase === GamePhase.GameOver) {
      const playerWon = newState.winner === PlayerSide.Blue;
      playSfx(
        this,
        newState.winner === 'draw'
          ? SFX_KEYS.DEFEAT
          : playerWon
            ? SFX_KEYS.VICTORY
            : SFX_KEYS.DEFEAT
      );
      this.scene.start('GameOver', {
        winner: newState.winner,
        blueScore: newState.players[0].score,
        redScore: newState.players[1].score,
      });
    } else {
      EventBus.emit('game-state-changed', newState);
    }
  }

  private syncFromState(state: GameState) {
    this.boardGrid?.syncBoard(state.board);
    EventBus.emit('game-state-changed', state);
  }

  shutdown() {
    EventBus.off('card-selected', this.boundOnCardSelected, this);
  }
}
