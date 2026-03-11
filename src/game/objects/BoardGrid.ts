import { GameObjects } from 'phaser';
import { Board, CardInstance } from '../../data/types';
import { CardSprite } from './CardSprite';

/* ──────────────────────────────────────────────────────────────
   BoardGrid - 3x3 grid rendering + cell click handling
   Layout: 120x120 cells, centered at (512, 384)
   ────────────────────────────────────────────────────────────── */

const CELL_SIZE = 120;
const BOARD_OFFSET_X = 512 - (CELL_SIZE * 3) / 2;
const BOARD_OFFSET_Y = 384 - (CELL_SIZE * 3) / 2;

export type CellClickCallback = (row: number, col: number) => void;

export class BoardGrid extends GameObjects.Container {
  private cells: GameObjects.Rectangle[][] = [];
  private cardSprites: Map<string, CardSprite> = new Map();
  private onCellClick: CellClickCallback | null = null;

  constructor(scene: Phaser.Scene, onCellClick?: CellClickCallback) {
    super(scene, 0, 0);
    this.onCellClick = onCellClick ?? null;
    this.createGrid();
  }

  private createGrid(): void {
    for (let row = 0; row < 3; row++) {
      this.cells[row] = [];
      for (let col = 0; col < 3; col++) {
        const x = BOARD_OFFSET_X + col * CELL_SIZE + CELL_SIZE / 2;
        const y = BOARD_OFFSET_Y + row * CELL_SIZE + CELL_SIZE / 2;

        const cellBg = this.scene.add.rectangle(x, y, CELL_SIZE - 4, CELL_SIZE - 4, 0x1e3a5f, 1);
        cellBg.setStrokeStyle(2, 0x3b82f6);
        cellBg.setInteractive({ useHandCursor: true });

        const row_ = row;
        const col_ = col;
        cellBg.on('pointerdown', () => {
          this.onCellClick?.(row_, col_);
        });

        cellBg.on('pointerover', () => {
          cellBg.setStrokeStyle(3, 0x60a5fa);
        });
        cellBg.on('pointerout', () => {
          cellBg.setStrokeStyle(2, 0x3b82f6);
        });

        this.add(cellBg);
        this.cells[row][col] = cellBg;
      }
    }
  }

  /**
   * Sync the grid with the current board state.
   * Adds/updates/removes CardSprites as needed.
   */
  syncBoard(board: Board): void {
    const seen = new Set<string>();

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cell = board[row][col];
        const key = `${row},${col}`;

        if (cell.card) {
          seen.add(key);
          const existing = this.cardSprites.get(key);
          if (existing) {
            existing.setOwner(cell.card.owner);
          } else {
            this.addCard(cell.card, row, col);
          }
        } else {
          const existing = this.cardSprites.get(key);
          if (existing) {
            existing.destroy();
            this.cardSprites.delete(key);
          }
        }
      }
    }

    // Remove any sprites that are no longer on the board
    for (const [key, sprite] of this.cardSprites) {
      if (!seen.has(key)) {
        sprite.destroy();
        this.cardSprites.delete(key);
      }
    }
  }

  private addCard(instance: CardInstance, row: number, col: number): void {
    const x = BOARD_OFFSET_X + col * CELL_SIZE + CELL_SIZE / 2;
    const y = BOARD_OFFSET_Y + row * CELL_SIZE + CELL_SIZE / 2;

    const sprite = new CardSprite(
      this.scene,
      x,
      y,
      instance.card,
      instance.owner
    );
    this.add(sprite);
    this.cardSprites.set(`${row},${col}`, sprite);
  }

  /**
   * Get cell center coordinates for animation (e.g. card placement).
   */
  static getCellCenter(row: number, col: number): { x: number; y: number } {
    return {
      x: BOARD_OFFSET_X + col * CELL_SIZE + CELL_SIZE / 2,
      y: BOARD_OFFSET_Y + row * CELL_SIZE + CELL_SIZE / 2,
    };
  }
}
