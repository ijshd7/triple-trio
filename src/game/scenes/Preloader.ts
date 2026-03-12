import { Scene } from 'phaser';
import { SFX_KEYS, MUSIC_KEYS } from '../SoundManager';
import { CARDS } from '../../data/cards';
export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  init() {
    this.add.image(512, 384, 'background');
    this.add.rectangle(512, 384, 468, 32).setStrokeStyle(1, 0xffffff);
    const bar = this.add.rectangle(512 - 230, 384, 4, 28, 0xffffff);

    this.load.on('progress', (progress: number) => {
      bar.width = 4 + 460 * progress;
    });
  }

  preload() {
    // Load card artwork from public/cards/
    this.load.setPath('cards');
    for (const card of CARDS) {
      this.load.image(card.artworkKey, `${card.artworkKey}.png`);
    }

    this.load.setPath('assets');
    this.load.image('logo', 'logo.png');
    this.load.image('star', 'star.png');

    // UI textures: card frames, board, cells
    this.load.image('card-frame-blue', 'ui/card-frame-blue.png');
    this.load.image('card-frame-red', 'ui/card-frame-red.png');
    this.load.image('card-back', 'ui/card-back.png');
    this.load.image('board-bg', 'ui/board-bg.png');
    this.load.image('cell-normal', 'ui/cell-normal.png');
    this.load.image('cell-fire', 'ui/cell-fire.png');
    this.load.image('cell-ice', 'ui/cell-ice.png');
    this.load.image('cell-thunder', 'ui/cell-thunder.png');
    this.load.image('cell-earth', 'ui/cell-earth.png');
    this.load.image('cell-water', 'ui/cell-water.png');
    this.load.image('cell-wind', 'ui/cell-wind.png');
    this.load.image('cell-holy', 'ui/cell-holy.png');
    this.load.image('cell-poison', 'ui/cell-poison.png');

    this.load.audio(SFX_KEYS.CARD_PLACE, 'sfx/card-place.ogg');
    this.load.audio(SFX_KEYS.CARD_FLIP, 'sfx/card-flip.ogg');
    this.load.audio(SFX_KEYS.CARD_CAPTURE, 'sfx/card-capture.ogg');
    this.load.audio(SFX_KEYS.VICTORY, 'sfx/victory.ogg');
    this.load.audio(SFX_KEYS.DEFEAT, 'sfx/defeat.ogg');
    this.load.audio(MUSIC_KEYS.BATTLE_THEME, 'music/battle-theme.ogg');
  }

  create() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        this.scene.start('MainMenu');
      }
    );
  }
}
