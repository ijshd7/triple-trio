import { GameObjects } from 'phaser';
import { CardDef, CardInstance, PlayerSide } from '../../data/types';

/* ──────────────────────────────────────────────────────────────
   CardSprite - Phaser Container for a Triple Trio card
   Frame (blue/red) + placeholder art + four directional values
   ────────────────────────────────────────────────────────────── */

const CARD_WIDTH = 100;
const CARD_HEIGHT = 140;
const VALUE_OFFSET = 12;

function formatValue(v: number): string {
  return v === 10 ? 'A' : String(v);
}

export class CardSprite extends GameObjects.Container {
  private frame: GameObjects.Rectangle;
  private artPlaceholder: GameObjects.Rectangle;
  private topText: GameObjects.Text;
  private rightText: GameObjects.Text;
  private bottomText: GameObjects.Text;
  private leftText: GameObjects.Text;
  private nameText: GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    card: CardDef,
    owner: PlayerSide,
    options?: { faceDown?: boolean }
  ) {
    super(scene, x, y);

    const frameColor = owner === PlayerSide.Blue ? 0x2563eb : 0xdc2626;
    const borderColor = owner === PlayerSide.Blue ? 0x1d4ed8 : 0xb91c1c;

    this.frame = scene.add.rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, frameColor, 1);
    this.frame.setStrokeStyle(3, borderColor);
    this.add(this.frame);

    if (options?.faceDown) {
      this.artPlaceholder = scene.add.rectangle(0, 0, CARD_WIDTH - 16, CARD_HEIGHT - 40, 0x374151, 1);
      this.add(this.artPlaceholder);
      this.topText = scene.add.text(0, 0, '?', { fontSize: '14px', color: '#9ca3af' }).setOrigin(0.5);
      this.rightText = scene.add.text(0, 0, '?', { fontSize: '14px', color: '#9ca3af' }).setOrigin(0.5);
      this.bottomText = scene.add.text(0, 0, '?', { fontSize: '14px', color: '#9ca3af' }).setOrigin(0.5);
      this.leftText = scene.add.text(0, 0, '?', { fontSize: '14px', color: '#9ca3af' }).setOrigin(0.5);
      this.nameText = scene.add.text(0, -CARD_HEIGHT / 2 + 18, '???', { fontSize: '10px', color: '#9ca3af' }).setOrigin(0.5);
    } else {
      this.artPlaceholder = scene.add.rectangle(0, 0, CARD_WIDTH - 16, CARD_HEIGHT - 40, 0x1f2937, 1);
      this.add(this.artPlaceholder);

      const v = card.values;
      this.topText = scene.add.text(0, -CARD_HEIGHT / 2 + VALUE_OFFSET, formatValue(v.top), {
        fontSize: '16px',
        color: '#ffffff',
      }).setOrigin(0.5);
      this.rightText = scene.add.text(CARD_WIDTH / 2 - VALUE_OFFSET, 0, formatValue(v.right), {
        fontSize: '16px',
        color: '#ffffff',
      }).setOrigin(0.5);
      this.bottomText = scene.add.text(0, CARD_HEIGHT / 2 - VALUE_OFFSET, formatValue(v.bottom), {
        fontSize: '16px',
        color: '#ffffff',
      }).setOrigin(0.5);
      this.leftText = scene.add.text(-CARD_WIDTH / 2 + VALUE_OFFSET, 0, formatValue(v.left), {
        fontSize: '16px',
        color: '#ffffff',
      }).setOrigin(0.5);
      this.nameText = scene.add.text(0, -CARD_HEIGHT / 2 + 18, card.name, {
        fontSize: '10px',
        color: '#d1d5db',
      }).setOrigin(0.5);
    }

    this.add(this.topText);
    this.add(this.rightText);
    this.add(this.bottomText);
    this.add(this.leftText);
    this.add(this.nameText);

    this.setSize(CARD_WIDTH, CARD_HEIGHT);
    this.setInteractive({ useHandCursor: true });
  }

  static get width(): number {
    return CARD_WIDTH;
  }

  static get height(): number {
    return CARD_HEIGHT;
  }

  /**
   * Update owner (e.g. after capture) - changes frame color.
   */
  setOwner(owner: PlayerSide): void {
    const frameColor = owner === PlayerSide.Blue ? 0x2563eb : 0xdc2626;
    const borderColor = owner === PlayerSide.Blue ? 0x1d4ed8 : 0xb91c1c;
    this.frame.setFillStyle(frameColor);
    this.frame.setStrokeStyle(3, borderColor);
  }
}
