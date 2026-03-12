import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { PlayerSide } from '../../data/types';
import { stopMusic } from '../SoundManager';

export class GameOver extends Scene {
  private gameOverData: {
    winner?: PlayerSide | 'draw';
    blueScore?: number;
    redScore?: number;
  } = {};

  constructor() {
    super('GameOver');
  }

  init(data: {
    winner?: PlayerSide | 'draw';
    blueScore?: number;
    redScore?: number;
  }) {
    this.gameOverData = data;
  }

  create() {
    const { winner = 'draw', blueScore = 0, redScore = 0 } = this.gameOverData;

    stopMusic(this);
    this.cameras.main.fadeIn(400);
    this.cameras.main.setBackgroundColor(0x0f172a);

    const winnerText =
      winner === 'draw'
        ? 'Draw!'
        : winner === PlayerSide.Blue
          ? 'Blue Wins!'
          : 'Red Wins!';

    this.add
      .text(512, 320, winnerText, {
        fontFamily: 'Arial Black',
        fontSize: 48,
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 6,
        align: 'center',
      })
      .setOrigin(0.5);

    this.add
      .text(512, 380, 'Final Score', {
        fontSize: '18px',
        color: '#64748b',
      })
      .setOrigin(0.5);

    this.add
      .text(512, 420, `${blueScore} - ${redScore}`, {
        fontFamily: 'Arial Black',
        fontSize: '36px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    this.add
      .text(512, 460, 'Blue · Red', {
        fontSize: '14px',
        color: '#475569',
      })
      .setOrigin(0.5);

    this.add
      .text(512, 520, 'Click to return to menu', {
        fontSize: '16px',
        color: '#64748b',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.cameras.main.once(
          Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
          () => this.scene.start('MainMenu')
        );
      });

    EventBus.emit('current-scene-ready', this);
  }
}
