# Triple Trio - Technical Plan

## Context

Triple Trio is a proof-of-concept card game inspired by Final Fantasy VIII's Triple Triad. The goal is a functional prototype built quickly by a solo developer using AI-generated assets. The existing repo is a PhaserJS 3.90 + React 19 + TypeScript + Vite template with a bridge pattern (EventBus) connecting React and Phaser.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                    React UI Layer                    │
│  (PlayerHand, ScoreDisplay, RuleDisplay, Menus)     │
└──────────────────────┬──────────────────────────────┘
                       │ EventBus
┌──────────────────────▼──────────────────────────────┐
│                 Phaser Rendering Layer               │
│  (Game Scene, CardSprite, BoardGrid, Animations)     │
└──────────────────────┬──────────────────────────────┘
                       │ Direct calls
┌──────────────────────▼──────────────────────────────┐
│              Pure Game Engine (no Phaser/React)       │
│  (GameEngine, RuleEngine, Board, AI)                 │
└─────────────────────────────────────────────────────┘
```

**Data flow:** The `GameEngine` is the single source of truth. Phaser calls `engine.placeCard()`, receives a `MoveResult` containing a new `GameState` + a list of `GameEvent` objects. Phaser plays animations from those events, then emits EventBus events so React can re-render UI.

---

## 2. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Game engine | Pure TypeScript | Testable, no framework dependency |
| Rendering | Phaser 3.90 | Already in template, great tween system |
| UI overlays | React 19 | Already in template, good for menus/hands |
| Build | Vite 6.3 | Already configured, fast HMR |
| Storage | localStorage / JSON | No backend needed for MVP |
| Deployment | Static hosting (Vercel/Netlify) or simple VPS | Single SPA bundle |
| Asset gen | AI image/audio tools (see Section 8) | Fast, low-cost |

---

## 3. Data Models

All interfaces in `src/data/types.ts`:

```typescript
enum Element { None, Fire, Ice, Thunder, Earth, Water, Wind, Holy, Poison }
enum PlayerSide { Blue = 'blue', Red = 'red' }
enum Rarity { Common = 1, Uncommon, Rare, Epic, Legendary }
enum RuleType { Basic = 'basic', Same = 'same', Plus = 'plus', Elemental = 'elemental' }
enum GamePhase { DeckSelect, Playing, GameOver }
enum Direction { Top, Right, Bottom, Left }

interface CardValues { top: number; right: number; bottom: number; left: number; }  // 1-10 (10 = "A")

interface CardDef {
  id: number; name: string; values: CardValues;
  element: Element; rarity: Rarity;
  artworkKey: string; lore?: string;
}

interface CardInstance { card: CardDef; owner: PlayerSide; }

interface BoardCell {
  row: number; col: number;            // 0-2
  card: CardInstance | null;
  element: Element;                    // Element.None for normal tiles
}

type Board = BoardCell[][];            // [row][col], 3x3

interface Player {
  side: PlayerSide;
  hand: CardDef[];                     // Shrinks as cards are placed
  score: number;                       // Cards owned on board + remaining in hand
  isAI: boolean;
}

interface GameState {
  board: Board;
  players: [Player, Player];           // [Blue, Red]
  currentTurn: PlayerSide;
  turnNumber: number;                  // 1-9
  activeRules: RuleType[];
  phase: GamePhase;
  winner: PlayerSide | 'draw' | null;
}

// Events returned by engine to drive animations
type GameEvent =
  | { type: 'card-placed'; row: number; col: number; card: CardDef; owner: PlayerSide }
  | { type: 'card-captured'; row: number; col: number; newOwner: PlayerSide; byRule: RuleType }
  | { type: 'combo-captured'; row: number; col: number; newOwner: PlayerSide }
  | { type: 'turn-changed'; newTurn: PlayerSide }
  | { type: 'game-over'; winner: PlayerSide | 'draw'; blueScore: number; redScore: number }
  | { type: 'elemental-modifier'; row: number; col: number; card: CardDef; modifier: number };

interface MoveResult { newState: GameState; events: GameEvent[]; }
interface AIMove { handIndex: number; row: number; col: number; }
```

---

## 4. Folder Structure

```
src/
  main.tsx                              # (existing) React entry
  App.tsx                               # (modify) Main app with game UI
  PhaserGame.tsx                        # (existing, minor edits)

  game/
    main.ts                             # (modify) Register new scenes
    EventBus.ts                         # (existing, unchanged)
    scenes/
      Boot.ts                           # (modify) Load boot assets
      Preloader.ts                      # (modify) Load all game assets
      MainMenu.ts                       # (replace) Title screen
      Game.ts                           # (replace) Main gameplay scene
      GameOver.ts                       # (modify) Winner display
      DeckSelect.ts                     # (new) Hand selection
    objects/
      CardSprite.ts                     # Card visual (Container: frame + art + values)
      BoardGrid.ts                      # 3x3 grid rendering + cell click handling
    animations/
      CardAnimations.ts                 # Tween factories: place, flip, capture

  engine/                               # Pure game logic (no Phaser/React imports)
    GameEngine.ts                       # Orchestrator: turn loop, validation
    GameState.ts                        # State creation, cloning, scoring
    Board.ts                            # Board operations, adjacency
    RuleEngine.ts                       # Composable rule evaluator
    CaptureResolver.ts                  # Combo/cascade after Same/Plus
    rules/
      BasicRule.ts                      # Compare adjacent values
      SameRule.ts                       # 2+ matching value pairs
      PlusRule.ts                       # 2+ equal sum pairs
      ElementalRule.ts                  # +1/-1 element modifier

  ai/
    AIPlayer.ts                         # AI interface
    GreedyAI.ts                         # Maximize captures per move
    MinimaxAI.ts                        # Depth-limited with alpha-beta
    BoardEvaluator.ts                   # Position scoring for minimax

  data/
    types.ts                            # All TypeScript interfaces/enums
    cards.ts                            # Card database (50-110 cards)
    elements.ts                         # Element definitions

  ui/                                   # React components
    GameUI.tsx                          # Game UI wrapper
    PlayerHand.tsx                      # Clickable card hand
    ScoreDisplay.tsx                    # Score overlay
    RuleDisplay.tsx                     # Active rules indicator
    TurnIndicator.tsx                   # Turn display
    GameOverModal.tsx                   # Win/lose/draw modal
    DeckSelectUI.tsx                    # Pre-game card selection

public/assets/
  cards/                                # AI-generated card art (256x256 PNG)
  ui/                                   # Card frames, board bg, cell textures
  sfx/                                  # Sound effects (OGG)
  music/                                # Background music
  fonts/                                # Bitmap font for card values
```

---

## 5. Rule Engine

**Strategy pattern with composable rules.**

Each rule implements a `CaptureRule` interface with an `evaluate()` method that returns cells to capture.

**Evaluation order in `RuleEngine.evaluate()`:**
1. Apply Elemental modifiers (±1 to card values based on cell element match)
2. Run Same rule (if active) — 2+ adjacent pairs with equal values
3. Run Plus rule (if active) — 2+ adjacent pairs with equal sums
4. Run Basic rule (always active) — placed card value > adjacent opposing value
5. If Same/Plus triggered captures, run combo cascade (re-evaluate newly captured cards with Basic rule, recursively)

**Combo cascading** (`CaptureResolver`): After Same/Plus captures, each newly flipped card is re-evaluated as if just placed, running only Basic captures. Repeat until no new captures occur. Track visited cells to prevent infinite loops.

---

## 6. Turn Logic

```
DeckSelect ──► Playing ──► GameOver ──► MainMenu
                  │
            ┌─────┴─────┐
            ▼            ▼
        Blue Turn    Red Turn (AI)
            │            │
      select card   AI.chooseMove()
      click cell    engine.placeCard()
            │            │
      engine.placeCard() │
            │            │
      ◄── play animations ──►
            │
      advance turn / check game over
```

1. Player selects card in hand (React) → EventBus → Phaser knows selected index
2. Player clicks board cell → Phaser calls `engine.placeCard(handIndex, row, col)`
3. Engine validates, runs rules, returns `MoveResult` with `GameEvent[]`
4. Phaser plays animations sequentially (async/await on tweens)
5. After animations, if next turn is AI: delay 500ms → `ai.chooseMove()` → repeat step 3
6. After 9 turns, `game-over` event fires

---

## 7. Animation System

All animations in `CardAnimations.ts`, using Phaser Tweens returning Promises.

| Animation | Technique | Duration |
|-----------|-----------|----------|
| Card placement | Slide from hand to cell (x/y tween + slight scale bounce) | 300ms |
| Card flip | ScaleX: 1→0, swap frame color, 0→1 | 300ms |
| Capture effect | Glow pulse (alpha tween on overlay) | 200ms |
| Combo chain | Staggered delays between cascading flips | 200ms per card |
| Card hover | Slight scale up + shadow | 150ms |

**CardSprite** is a `Phaser.GameObjects.Container` with:
- Frame sprite (blue/red based on owner)
- Card artwork sprite (centered)
- Four text objects for directional values (top/right/bottom/left)
- Optional element icon

---

## 8. AI Opponent

### GreedyAI (Easy)
- For each valid move, simulate `placeCard()` on cloned engine
- Score = captures × 10 + position bonus (corners > edges > center)
- Tiebreaker: prefer playing weaker cards first (save strong cards)
- Complexity: O(hand_size × empty_cells) — instant

### MinimaxAI (Hard)
- Depth-limited (depth 3) with alpha-beta pruning
- Board evaluation: cards owned, edge/wall safety, hand strength remaining
- Game tree is tiny (max 9! ≈ 362K leaves at full depth) — runs in <50ms

---

## 9. Asset Import Pipeline

Assets are generated externally using a separate asset generation application. The workflow is simple: generate assets in that tool, then drag-and-drop them into the repo following the folder structure below.

### Import Structure

Assets must follow this naming convention and folder structure:

**Card artwork:**
- Format: PNG, 256×256
- Naming: `card_001.png` through `card_NNN.png`
- Destination: `public/assets/cards/`

**Card frames:**
- Format: PNG
- Files: `card-frame-blue.png`, `card-frame-red.png`, `card-back.png`
- Destination: `public/assets/ui/`

**Board & cell textures:**
- Format: PNG
- Files: `board-bg.png`, `cell-normal.png`, `cell-fire.png`, `cell-ice.png`, `cell-thunder.png`, `cell-earth.png`, `cell-water.png`, `cell-wind.png`, `cell-holy.png`, `cell-poison.png`
- Destination: `public/assets/ui/`

**Sound effects:**
- Format: OGG/MP3
- Files: `card-place.ogg`, `card-flip.ogg`, `card-capture.ogg`, `victory.ogg`, `defeat.ogg`
- Destination: `public/assets/sfx/`

**Music:**
- Format: OGG/MP3
- File: `battle-theme.ogg`
- Destination: `public/assets/music/`

### Import Steps

1. Generate assets in external tool and export to named files (per structure above)
2. Drag-and-drop PNG/audio files into corresponding `public/assets/` subdirectories
3. For card artwork: add entries to `src/data/cards.ts` with stats, element, and `artworkKey` matching filename
4. Preloader auto-loads all registered cards via loop in `Preloader.ts`

### Asset Compatibility Notes

- All images should be PNG format
- Card artwork: ensure 256×256 resolution for consistency
- Audio files: recommend OGG for smaller file size, or MP3 for broad compatibility
- Bitmap font (for card values 1-9 and A): can be generated separately or use Phaser's built-in text rendering

---

## 10. Development Roadmap

### Phase 1 — Core Engine
**Goal:** Game engine runs a complete game in the console.

- [x] Create `src/data/types.ts` with all interfaces/enums
- [x] Create `src/data/cards.ts` with 10-20 starter cards
- [x] Implement `src/engine/Board.ts` (create, adjacency, place)
- [x] Implement `src/engine/GameState.ts` (init, clone, scoring)
- [x] Implement `src/engine/rules/BasicRule.ts`
- [x] Implement `src/engine/RuleEngine.ts` (Basic only)
- [x] Implement `src/engine/GameEngine.ts` (turn loop, validation)
- [x] Console-based test: run full game with hardcoded moves

**Deliverable:** `GameEngine` that processes `placeCard()` calls and returns correct `MoveResult` events.
**Complexity:** Medium

### Phase 2 — Board Rendering & Interaction
**Goal:** Playable game on screen with basic visuals.

- [x] Create placeholder assets (colored rectangles for frames, grid lines)
- [x] Implement `CardSprite.ts` (Container with frame + value text)
- [x] Implement `BoardGrid.ts` (render grid, handle cell clicks)
- [x] Replace `Game.ts` scene with board rendering + engine wiring
- [x] Implement `PlayerHand.tsx` (React, clickable cards)
- [x] Wire hand selection → EventBus → Phaser board placement
- [x] Basic turn flow: select card → click cell → card appears

**Deliverable:** Playable hotseat game with basic capture, no animations.
**Complexity:** Medium-High

### Phase 3 — Advanced Rules
**Goal:** Full rule engine with Same, Plus, Elemental, combos.

- [x] Implement `SameRule.ts`
- [x] Implement `PlusRule.ts`
- [x] Implement `ElementalRule.ts`
- [x] Implement `CaptureResolver.ts` (combo/cascade)
- [x] Add element assignments to board cells
- [x] Create `elements.ts`
- [x] Add `RuleDisplay.tsx`

**Deliverable:** Complete rule engine with all capture mechanics.
**Complexity:** Medium

### Phase 4 — Animations
**Goal:** Polished visual feedback for all game actions.

- [x] Implement `CardAnimations.ts` (place, flip, capture, combo)
- [x] Card placement: slide from hand to cell
- [x] Card flip: scaleX tween with frame color swap
- [x] Capture glow/pulse effect
- [x] Staggered combo chain animations
- [x] Wire animation promises into Game scene turn flow
- [x] Add SFX triggers during animations

**Deliverable:** Visually polished card interactions with sound.
**Complexity:** Medium

### Phase 5 — AI Opponent
**Goal:** Play against the computer at two difficulty levels.

- [ ] Implement `GameEngine.clone()` and `getValidMoves()`
- [ ] Implement `GreedyAI.ts`
- [ ] Wire AI into Game scene (auto-play after player turn)
- [ ] Implement `MinimaxAI.ts` + `BoardEvaluator.ts`
- [ ] Add difficulty selector (Easy/Hard)

**Deliverable:** Functional AI opponent.
**Complexity:** Low-Medium

### Phase 6 — Asset Import & Polish
**Goal:** Complete, polished MVP with custom art and UI.

- [ ] Generate assets in external asset generator app (separate from this repo)
- [ ] Import card artworks (50+) to `public/assets/cards/` following naming convention
- [ ] Import card frames, board, and cell textures to `public/assets/ui/`
- [ ] Import SFX and music to `public/assets/sfx/` and `public/assets/music/`
- [ ] Populate full `src/data/cards.ts` database with stats and `artworkKey` references
- [ ] Implement `DeckSelect.ts` scene + `DeckSelectUI.tsx`
- [ ] Replace `MainMenu.ts` with title screen
- [ ] Improve `GameOver.ts` with score breakdown
- [ ] Implement `ScoreDisplay.tsx`, `TurnIndicator.tsx`
- [ ] Add background music, screen transitions, card tooltips

**Deliverable:** Complete MVP ready for demo.
**Complexity:** Low (minimal engineering, mostly asset import and data entry)

---

## 11. Layout Geometry (1024x768 canvas)

- **Board:** centered at (512, 384), 3×3 grid of 120×120 cells = 360×360
- **Blue hand (bottom):** 5 cards at y≈680, evenly spaced horizontally
- **Red hand (top):** 5 cards at y≈60, face down (or up with Open rule)
- **Score:** left side at y≈384
- **Turn indicator:** top-right corner
- **Rule badges:** bottom-left corner

---

## 12. Optional Enhancements

### Multiplayer
- WebSocket server (Node.js + Socket.io) relays moves between two clients
- Each client runs own `GameEngine`, server validates
- Protocol: `{ type: 'place', handIndex, row, col }`
- Simple lobby with room codes for matchmaking

### Additional Rules (from FF8)
- **Open** — both hands visible
- **Random** — hands randomly selected from collection
- **Sudden Death** — on draw, replay with owned cards as new hands
- **Wall** — board edges count as value A (10) for Same/Plus

### Procedural Card Generation
- Rarity determines stat budget: Common (8-14), Uncommon (15-19), Rare (20-24), Epic (25-29), Legendary (30-35)
- Random distribution across 4 values within budget
- Random element (60% None, 5% each element)
- Name = adjective + creature type (e.g., "Crimson Wyvern")

### Collection System
- Win cards from opponents (winner picks one from loser's hand)
- Persist collection to localStorage
- Deck builder UI for selecting 5 cards from collection
- Trade rule variants: One, Direct, All, Diff
