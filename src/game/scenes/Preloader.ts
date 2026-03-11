import { Scene } from 'phaser';
import { SFX_KEYS } from '../SoundManager';

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
    this.load.setPath('assets');

    this.load.image('logo', 'logo.png');
    this.load.image('star', 'star.png');

    this.load.audio(SFX_KEYS.CARD_PLACE, 'sfx/card-place.ogg');
    this.load.audio(SFX_KEYS.CARD_FLIP, 'sfx/card-flip.ogg');
    this.load.audio(SFX_KEYS.CARD_CAPTURE, 'sfx/card-capture.ogg');
    this.load.audio(SFX_KEYS.VICTORY, 'sfx/victory.ogg');
    this.load.audio(SFX_KEYS.DEFEAT, 'sfx/defeat.ogg');
  }

    create ()
    {
        //  When all the assets have loaded, it's often worth creating global objects here that the rest of the game can use.
        //  For example, you can define global animations here, so we can use them in other scenes.

        //  Move to the MainMenu. You could also swap this for a Scene Transition, such as a camera fade.
        this.scene.start('MainMenu');
    }
}
