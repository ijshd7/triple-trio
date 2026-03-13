import { GameObjects } from 'phaser';
import { CardDef, Element, PlayerSide } from '../../data/types';
import { ELEMENT_NAMES } from '../../data/elements';

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

const FRAME_KEYS = {
  [PlayerSide.Blue]: 'card-frame-blue',
  [PlayerSide.Red]: 'card-frame-red',
} as const;

export class CardSprite extends GameObjects.Container {
  private frame: GameObjects.Image | GameObjects.Rectangle;
  private artSprite: GameObjects.Image | GameObjects.Rectangle;
  private topText: GameObjects.Text;
  private rightText: GameObjects.Text;
  private bottomText: GameObjects.Text;
  private leftText: GameObjects.Text;
  private nameText: GameObjects.Text;
  private tooltipContainer: GameObjects.Container | null = null;

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
    const frameKey = FRAME_KEYS[owner];
    const hasFrameTexture = scene.textures.exists(frameKey);

    if (hasFrameTexture) {
      this.frame = scene.add.image(0, 0, frameKey);
      this.frame.setDisplaySize(CARD_WIDTH, CARD_HEIGHT);
    } else {
      this.frame = scene.add.rectangle(
        0,
        0,
        CARD_WIDTH,
        CARD_HEIGHT,
        frameColor,
        1
      );
      (this.frame).setStrokeStyle(3, borderColor);
    }
    this.add(this.frame);

    if (options?.faceDown) {
      const hasCardBack = scene.textures.exists('card-back');
      if (hasCardBack) {
        this.artSprite = scene.add.image(0, 0, 'card-back');
        this.artSprite.setDisplaySize(CARD_WIDTH - 16, CARD_HEIGHT - 40);
      } else {
        this.artSprite = scene.add.rectangle(
          0,
          0,
          CARD_WIDTH - 16,
          CARD_HEIGHT - 40,
          0x374151,
          1
        );
      }
      this.add(this.artSprite);
      this.topText = scene.add
        .text(0, 0, '?', { fontSize: '14px', color: '#9ca3af' })
        .setOrigin(0.5);
      this.rightText = scene.add
        .text(0, 0, '?', { fontSize: '14px', color: '#9ca3af' })
        .setOrigin(0.5);
      this.bottomText = scene.add
        .text(0, 0, '?', { fontSize: '14px', color: '#9ca3af' })
        .setOrigin(0.5);
      this.leftText = scene.add
        .text(0, 0, '?', { fontSize: '14px', color: '#9ca3af' })
        .setOrigin(0.5);
      this.nameText = scene.add
        .text(0, -CARD_HEIGHT / 2 + 18, '???', {
          fontSize: '10px',
          color: '#9ca3af',
        })
        .setOrigin(0.5);
    } else {
      const artKey = card.artworkKey;
      const hasArtwork = scene.textures.exists(artKey);
      if (hasArtwork) {
        const img = scene.add.image(0, 0, artKey);
        img.setDisplaySize(CARD_WIDTH - 16, CARD_HEIGHT - 40);
        this.artSprite = img;
      } else {
        this.artSprite = scene.add.rectangle(
          0,
          0,
          CARD_WIDTH - 16,
          CARD_HEIGHT - 40,
          0x1f2937,
          1
        );
      }
      this.add(this.artSprite);

      const v = card.values;
      this.topText = scene.add
        .text(0, -CARD_HEIGHT / 2 + VALUE_OFFSET, formatValue(v.top), {
          fontSize: '16px',
          color: '#ffffff',
        })
        .setOrigin(0.5);
      this.rightText = scene.add
        .text(CARD_WIDTH / 2 - VALUE_OFFSET, 0, formatValue(v.right), {
          fontSize: '16px',
          color: '#ffffff',
        })
        .setOrigin(0.5);
      this.bottomText = scene.add
        .text(0, CARD_HEIGHT / 2 - VALUE_OFFSET, formatValue(v.bottom), {
          fontSize: '16px',
          color: '#ffffff',
        })
        .setOrigin(0.5);
      this.leftText = scene.add
        .text(-CARD_WIDTH / 2 + VALUE_OFFSET, 0, formatValue(v.left), {
          fontSize: '16px',
          color: '#ffffff',
        })
        .setOrigin(0.5);
      this.nameText = scene.add
        .text(0, -CARD_HEIGHT / 2 + 18, card.name, {
          fontSize: '10px',
          color: '#d1d5db',
        })
        .setOrigin(0.5);
    }

    this.add(this.topText);
    this.add(this.rightText);
    this.add(this.bottomText);
    this.add(this.leftText);
    this.add(this.nameText);

    if (!options?.faceDown) {
      this.tooltipContainer = this.createTooltip(scene, card);
      this.add(this.tooltipContainer);
      this.on('pointerover', () => {
        if (this.tooltipContainer) this.tooltipContainer.setVisible(true);
        this.setDepth(100);
      });
      this.on('pointerout', () => {
        if (this.tooltipContainer) this.tooltipContainer.setVisible(false);
        this.setDepth(0);
      });
    }

    this.setSize(CARD_WIDTH, CARD_HEIGHT);
    this.setInteractive({ useHandCursor: true });
  }

  private createTooltip(scene: Phaser.Scene, card: CardDef): GameObjects.Container {
    const tooltip = scene.add.container(0, -CARD_HEIGHT / 2 - 50);
    const bg = scene.add.rectangle(0, 0, 120, 70, 0x0f172a, 0.95);
    bg.setStrokeStyle(1, 0x334155);
    tooltip.add(bg);
    const nameText = scene.add
      .text(0, -22, card.name, { fontSize: '12px', color: '#f8fafc' })
      .setOrigin(0.5);
    tooltip.add(nameText);
    const v = card.values;
    const valuesText = scene.add
      .text(
        0,
        -6,
        `↑${formatValue(v.top)} →${formatValue(v.right)} ↓${formatValue(v.bottom)} ←${formatValue(v.left)}`,
        { fontSize: '10px', color: '#94a3b8' }
      )
      .setOrigin(0.5);
    tooltip.add(valuesText);
    if (card.element !== Element.None) {
      const elText = scene.add
        .text(0, 10, ELEMENT_NAMES[card.element], {
          fontSize: '10px',
          color: '#64748b',
        })
        .setOrigin(0.5);
      tooltip.add(elText);
    }
    tooltip.setVisible(false);
    return tooltip;
  }

  static get width(): number {
    return CARD_WIDTH;
  }

  static get height(): number {
    return CARD_HEIGHT;
  }

  /**
   * Update owner (e.g. after capture) - changes frame color/texture.
   */
  setOwner(owner: PlayerSide): void {
    const frameKey = FRAME_KEYS[owner];
    if (this.frame instanceof GameObjects.Image && this.scene.textures.exists(frameKey)) {
      this.frame.setTexture(frameKey);
    } else if (this.frame instanceof GameObjects.Rectangle) {
      const frameColor = owner === PlayerSide.Blue ? 0x2563eb : 0xdc2626;
      const borderColor = owner === PlayerSide.Blue ? 0x1d4ed8 : 0xb91c1c;
      this.frame.setFillStyle(frameColor);
      this.frame.setStrokeStyle(3, borderColor);
    }
  }
}
