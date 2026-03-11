/* ──────────────────────────────────────────────────────────────
   Sound Manager for Triple Trio
   Plays SFX during animations; no-ops if audio not loaded
   ────────────────────────────────────────────────────────────── */

export const SFX_KEYS = {
  CARD_PLACE: 'sfx-card-place',
  CARD_FLIP: 'sfx-card-flip',
  CARD_CAPTURE: 'sfx-card-capture',
  VICTORY: 'sfx-victory',
  DEFEAT: 'sfx-defeat',
} as const;

/**
 * Play an SFX if it has been loaded. No-op if not loaded or audio locked.
 */
export function playSfx(scene: Phaser.Scene, key: string): void {
  try {
    if (!scene.sound.locked) {
      scene.sound.play(key);
    }
  } catch {
    // Audio not loaded or failed
  }
}
