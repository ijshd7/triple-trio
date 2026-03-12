import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { CARDS } from '../../data/cards';
import type { CardDef } from '../../data/types';
import type { AIDifficulty } from './Game';

/* ──────────────────────────────────────────────────────────────
   DeckSelect - Pre-game hand selection
   Waits for DeckSelectUI to emit deck-confirm with 5 cards
   ────────────────────────────────────────────────────────────── */

export class DeckSelect extends Scene {
  private difficulty: AIDifficulty = 'easy';

  constructor() {
    super('DeckSelect');
  }

  init(data: { difficulty?: AIDifficulty }) {
    this.difficulty = data.difficulty ?? 'easy';
  }

  create() {
    this.cameras.main.fadeIn(400);
    this.cameras.main.setBackgroundColor(0x0f172a);

    this.add
      .text(512, 80, 'Select Your Hand', {
        fontFamily: 'Arial Black',
        fontSize: 32,
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4,
        align: 'center',
      })
      .setOrigin(0.5);

    this.add
      .text(512, 120, 'Choose 5 cards to play with', {
        fontSize: '16px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    const onDeckConfirm = (blueHand: CardDef[]) => {
      if (blueHand.length !== 5) return;

      const remaining = CARDS.filter(
        (c) => !blueHand.some((b) => b.id === c.id)
      );
      const redHand: CardDef[] = [];
      const shuffled = [...remaining].sort(() => Math.random() - 0.5);
      for (let i = 0; i < 5 && i < shuffled.length; i++) {
        redHand.push(shuffled[i]);
      }

      EventBus.off('deck-confirm', onDeckConfirm);
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once(
        Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
        () => {
          this.scene.start('Game', {
            blueHand,
            redHand,
            difficulty: this.difficulty,
          });
        }
      );
    };

    EventBus.on('deck-confirm', onDeckConfirm);
    EventBus.emit('current-scene-ready', this);
  }
}
