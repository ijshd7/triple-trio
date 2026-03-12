/* ──────────────────────────────────────────────────────────────
   Data Types for Triple Trio
   All TypeScript interfaces and enums — no implementation logic
   ────────────────────────────────────────────────────────────── */

// ──────────────────────────────────────────────────────────────
// ENUMS
// ──────────────────────────────────────────────────────────────

export enum Element {
  None,
  Fire,
  Ice,
  Thunder,
  Earth,
  Water,
  Wind,
  Holy,
  Poison,
}

export enum PlayerSide {
  Blue = 'blue',
  Red = 'red',
}

export enum Rarity {
  Common = 1,
  Uncommon = 2,
  Rare = 3,
  Epic = 4,
  Legendary = 5,
}

export enum RuleType {
  Basic = 'basic',
  Same = 'same',
  Plus = 'plus',
  Elemental = 'elemental',
}

export enum GamePhase {
  DeckSelect,
  Playing,
  GameOver,
}

export enum Direction {
  Top = 0,
  Right = 1,
  Bottom = 2,
  Left = 3,
}

// ──────────────────────────────────────────────────────────────
// CARD & BOARD TYPES
// ──────────────────────────────────────────────────────────────

export interface CardValues {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface CardDef {
  id: number;
  name: string;
  values: CardValues;
  element: Element;
  rarity: Rarity;
  artworkKey: string;
  lore?: string;
}

export interface CardInstance {
  card: CardDef;
  owner: PlayerSide;
}

export interface BoardCell {
  row: number;
  col: number;
  card: CardInstance | null;
  element: Element;
}

export type Board = BoardCell[][];

// ──────────────────────────────────────────────────────────────
// PLAYER & GAME STATE
// ──────────────────────────────────────────────────────────────

export interface Player {
  side: PlayerSide;
  hand: CardDef[];
  score: number;
  isAI: boolean;
}

export interface GameState {
  board: Board;
  players: [Player, Player];
  currentTurn: PlayerSide;
  turnNumber: number;
  activeRules: RuleType[];
  phase: GamePhase;
  winner: PlayerSide | 'draw' | null;
}

// ──────────────────────────────────────────────────────────────
// EVENTS & RESULTS
// ──────────────────────────────────────────────────────────────

export type GameEvent =
  | {
      type: 'card-placed';
      row: number;
      col: number;
      card: CardDef;
      owner: PlayerSide;
    }
  | {
      type: 'card-captured';
      row: number;
      col: number;
      newOwner: PlayerSide;
      byRule: RuleType;
    }
  | {
      type: 'combo-captured';
      row: number;
      col: number;
      newOwner: PlayerSide;
    }
  | {
      type: 'turn-changed';
      newTurn: PlayerSide;
    }
  | {
      type: 'game-over';
      winner: PlayerSide | 'draw';
      blueScore: number;
      redScore: number;
    }
  | {
      type: 'elemental-modifier';
      row: number;
      col: number;
      card: CardDef;
      modifier: number;
    };

export interface MoveResult {
  newState: GameState;
  events: GameEvent[];
}

export interface AIMove {
  handIndex: number;
  row: number;
  col: number;
}
