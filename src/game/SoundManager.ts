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

export const MUSIC_KEYS = {
  BATTLE_THEME: 'music-battle-theme',
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

/**
 * Play background music. No-op if not loaded or audio locked.
 */
export function playMusic(scene: Phaser.Scene, key: string, loop = true): void {
  try {
    if (!scene.sound.locked) {
      scene.sound.play(key, { loop });
    }
  } catch {
    // Audio not loaded or failed
  }
}

/**
 * Stop all music. No-op if not playing.
 */
export function stopMusic(scene: Phaser.Scene): void {
  try {
    scene.sound.stopAll();
  } catch {
    // Ignore
  }
}
