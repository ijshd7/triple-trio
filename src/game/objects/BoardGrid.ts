import { GameObjects } from 'phaser';
import { Board, CardInstance, Element } from '../../data/types';
import { CardSprite } from './CardSprite';

/* ──────────────────────────────────────────────────────────────
   BoardGrid - 3x3 grid rendering + cell click handling
   Layout: 120x120 cells, centered at (512, 384)
   Element cells have distinct background colors when Elemental rule is active
   ────────────────────────────────────────────────────────────── */

const CELL_SIZE = 120;
const BOARD_OFFSET_X = 512 - (CELL_SIZE * 3) / 2;
const BOARD_OFFSET_Y = 384 - (CELL_SIZE * 3) / 2;

const ELEMENT_COLORS: Record<Element, number> = {
  [Element.None]: 0x1e3a5f,
  [Element.Fire]: 0x7f1d1d,
  [Element.Ice]: 0x0c4a6e,
  [Element.Thunder]: 0x4c1d95,
  [Element.Earth]: 0x422006,
  [Element.Water]: 0x164e63,
  [Element.Wind]: 0x14532d,
  [Element.Holy]: 0x713f12,
  [Element.Poison]: 0x3f1d38,
};

const ELEMENT_TEXTURE_KEYS: Record<Element, string> = {
  [Element.None]: 'cell-normal',
  [Element.Fire]: 'cell-fire',
  [Element.Ice]: 'cell-ice',
  [Element.Thunder]: 'cell-thunder',
  [Element.Earth]: 'cell-earth',
  [Element.Water]: 'cell-water',
  [Element.Wind]: 'cell-wind',
  [Element.Holy]: 'cell-holy',
  [Element.Poison]: 'cell-poison',
};

export type CellClickCallback = (row: number, col: number) => void;

export class BoardGrid extends GameObjects.Container {
  private cells: (GameObjects.Image | GameObjects.Rectangle)[][] = [];
  private cardSprites: Map<string, CardSprite> = new Map();
  private onCellClick: CellClickCallback | null = null;

  constructor(scene: Phaser.Scene, onCellClick?: CellClickCallback) {
    super(scene, 0, 0);
    this.onCellClick = onCellClick ?? null;
    this.createGrid();
  }

  private createGrid(): void {
    const hasCellTexture = this.scene.textures.exists('cell-normal');
    const defaultColor = ELEMENT_COLORS[Element.None];

    for (let row = 0; row < 3; row++) {
      this.cells[row] = [];
      for (let col = 0; col < 3; col++) {
        const x = BOARD_OFFSET_X + col * CELL_SIZE + CELL_SIZE / 2;
        const y = BOARD_OFFSET_Y + row * CELL_SIZE + CELL_SIZE / 2;

        let cellBg: GameObjects.Image | GameObjects.Rectangle;
        if (hasCellTexture) {
          cellBg = this.scene.add.image(x, y, 'cell-normal');
          cellBg.setDisplaySize(CELL_SIZE - 4, CELL_SIZE - 4);
        } else {
          cellBg = this.scene.add.rectangle(
            x,
            y,
            CELL_SIZE - 4,
            CELL_SIZE - 4,
            defaultColor,
            1
          );
          (cellBg as GameObjects.Rectangle).setStrokeStyle(2, 0x3b82f6);
        }
        cellBg.setInteractive({ useHandCursor: true });

        const row_ = row;
        const col_ = col;
        cellBg.on('pointerdown', () => {
          this.onCellClick?.(row_, col_);
        });

        cellBg.on('pointerover', () => {
          if (cellBg instanceof GameObjects.Rectangle) {
            cellBg.setStrokeStyle(3, 0x60a5fa);
          }
        });
        cellBg.on('pointerout', () => {
          if (cellBg instanceof GameObjects.Rectangle) {
            cellBg.setStrokeStyle(2, 0x3b82f6);
          }
        });

        this.add(cellBg);
        this.cells[row][col] = cellBg;
      }
    }
  }

  /**
   * Sync the grid with the current board state.
   * Adds/updates/removes CardSprites as needed.
   * Updates cell background colors based on element.
   */
  syncBoard(board: Board): void {
    const seen = new Set<string>();

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const cell = board[row][col];
        const key = `${row},${col}`;

        const cellBg = this.cells[row]?.[col];
        if (cellBg) {
          const textureKey = ELEMENT_TEXTURE_KEYS[cell.element] ?? 'cell-normal';
          const color =
            ELEMENT_COLORS[cell.element] ?? ELEMENT_COLORS[Element.None];
          if (
            cellBg instanceof GameObjects.Image &&
            this.scene.textures.exists(textureKey)
          ) {
            cellBg.setTexture(textureKey);
          } else if (cellBg instanceof GameObjects.Rectangle) {
            cellBg.setFillStyle(color);
          }
        }

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
   * Get the CardSprite at a cell, if any.
   */
  getCardSprite(row: number, col: number): CardSprite | undefined {
    return this.cardSprites.get(`${row},${col}`);
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
