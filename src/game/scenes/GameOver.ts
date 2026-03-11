import { EventBus } from '../EventBus';
import { Scene } from 'phaser';
import { PlayerSide } from '../../data/types';

export class GameOver extends Scene {
  private gameOverData: { winner?: PlayerSide | 'draw'; blueScore?: number; redScore?: number } = {};

  constructor() {
    super('GameOver');
  }

  init(data: { winner?: PlayerSide | 'draw'; blueScore?: number; redScore?: number }) {
    this.gameOverData = data;
  }

  create() {
    const { winner = 'draw', blueScore = 0, redScore = 0 } = this.gameOverData;

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
      .text(512, 400, `Final Score: ${blueScore} - ${redScore}`, {
        fontSize: '24px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    this.add
      .text(512, 500, 'Click to return to menu', {
        fontSize: '16px',
        color: '#64748b',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.scene.start('MainMenu'));

    EventBus.emit('current-scene-ready', this);
  }
}
