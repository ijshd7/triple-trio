import { CardSprite } from '../objects/CardSprite';
import { PlayerSide } from '../../data/types';

/* ──────────────────────────────────────────────────────────────
   Card Animations for Triple Trio
   Phaser Tweens returning Promises for async turn flow
   ────────────────────────────────────────────────────────────── */

const PLACE_DURATION = 300;
const FLIP_DURATION = 300;
const CAPTURE_GLOW_DURATION = 200;
const COMBO_STAGGER = 200;

/** Hand position for placement animation (bottom center, card area) */
export function getHandPosition(handIndex: number, handSize: number): { x: number; y: number } {
  const cardWidth = CardSprite.width;
  const spacing = 12;
  const totalWidth = handSize * cardWidth + (handSize - 1) * spacing;
  const startX = 512 - totalWidth / 2 + cardWidth / 2 + spacing / 2;
  const x = startX + handIndex * (cardWidth + spacing);
  const y = 680;
  return { x, y };
}

/**
 * Animate card sliding from hand to cell with optional scale bounce.
 */
export function animatePlace(
  scene: Phaser.Scene,
  card: CardSprite,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): Promise<void> {
  card.setPosition(fromX, fromY);
  card.setScale(0.8);

  return new Promise((resolve) => {
    scene.tweens.add({
      targets: card,
      x: toX,
      y: toY,
      scale: 1,
      duration: PLACE_DURATION,
      ease: 'Back.easeOut',
      onComplete: () => resolve(),
    });
  });
}

/**
 * Animate card flip: scaleX 1→0, swap owner, scaleX 0→1.
 */
export function animateFlip(
  scene: Phaser.Scene,
  card: CardSprite,
  newOwner: PlayerSide
): Promise<void> {
  return new Promise((resolve) => {
    scene.tweens.add({
      targets: card,
      scaleX: 0,
      duration: FLIP_DURATION / 2,
      ease: 'Power2',
      onComplete: () => {
        card.setOwner(newOwner);
        scene.tweens.add({
          targets: card,
          scaleX: 1,
          duration: FLIP_DURATION / 2,
          ease: 'Power2',
          onComplete: () => resolve(),
        });
      },
    });
  });
}

/**
 * Animate capture glow on a cell.
 */
export function animateCaptureGlow(
  scene: Phaser.Scene,
  card: CardSprite
): Promise<void> {
  const glow = scene.add.rectangle(
    card.x,
    card.y,
    CardSprite.width + 20,
    CardSprite.height + 20,
    0xffffff,
    0
  );
  glow.setStrokeStyle(4, 0xfbbf24);
  glow.setOrigin(0.5);
  glow.setDepth(1000);
  scene.add.existing(glow);

  return new Promise((resolve) => {
    scene.tweens.add({
      targets: glow,
      alpha: 0.4,
      duration: CAPTURE_GLOW_DURATION / 2,
      yoyo: true,
      onComplete: () => {
        glow.destroy();
        resolve();
      },
    });
  });
}

/**
 * Animate placement + capture glow for a single card.
 */
export function animatePlaceWithGlow(
  scene: Phaser.Scene,
  card: CardSprite,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number
): Promise<void> {
  return animatePlace(scene, card, fromX, fromY, toX, toY).then(() =>
    animateCaptureGlow(scene, card)
  );
}

/**
 * Run staggered flip animations for combo chain.
 * Optionally call onEachCard before each card's animation (e.g. for SFX).
 */
export async function animateComboChain(
  scene: Phaser.Scene,
  cards: Array<{ sprite: CardSprite; newOwner: PlayerSide }>,
  onEachCard?: () => void
): Promise<void> {
  for (let i = 0; i < cards.length; i++) {
    await new Promise((r) => scene.time.delayedCall(i * COMBO_STAGGER, r));
    onEachCard?.();
    await Promise.all([
      animateFlip(scene, cards[i].sprite, cards[i].newOwner),
      animateCaptureGlow(scene, cards[i].sprite),
    ]);
  }
}
