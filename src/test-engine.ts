import { GameEngine } from './engine/GameEngine';
import { CARDS } from './data/cards';
import { GamePhase, GameState, GameEvent, PlayerSide } from './data/types';

/* ──────────────────────────────────────────────────────────────
   Console Test for Triple Trio Engine
   Runs a complete 9-turn game with hardcoded moves
   ────────────────────────────────────────────────────────────── */

// ──────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ──────────────────────────────────────────────────────────────

/**
 * Print the current board state as ASCII art.
 */
function printBoard(state: GameState): void {
  console.log('\nBoard:');
  for (let row = 0; row < 3; row++) {
    let line = '';
    for (let col = 0; col < 3; col++) {
      const cell = state.board[row][col];
      if (cell.card === null) {
        line += '[ . ]  ';
      } else {
        const owner = cell.card.owner === PlayerSide.Blue ? 'B' : 'R';
        const name = cell.card.card.name.substring(0, 3);
        line += `[${owner}:${name}]  `;
      }
    }
    console.log(line);
  }
}

/**
 * Print player scores.
 */
function printScores(state: GameState): void {
  const blue = state.players[0];
  const red = state.players[1];
  console.log(`  Blue score: ${blue.score} (${blue.hand.length} cards in hand)`);
  console.log(`  Red score:  ${red.score} (${red.hand.length} cards in hand)`);
}

/**
 * Print all events from a move.
 */
function printEvents(events: GameEvent[]): void {
  for (const event of events) {
    switch (event.type) {
      case 'card-placed':
        console.log(
          `  → Card placed: ${event.card.name} (${event.owner}) at (${event.row},${event.col})`
        );
        break;
      case 'card-captured':
        console.log(`  → Card captured at (${event.row},${event.col}) by ${event.byRule} rule`);
        break;
      case 'turn-changed':
        console.log(`  → Turn changed to ${event.newTurn}`);
        break;
      case 'game-over':
        console.log(`  → Game Over! Winner: ${event.winner} (Blue: ${event.blueScore}, Red: ${event.redScore})`);
        break;
      default:
        break;
    }
  }
}

// ──────────────────────────────────────────────────────────────
// GAME SETUP
// ──────────────────────────────────────────────────────────────

const blueHand = CARDS.slice(0, 5);  // Cards 1-5
const redHand = CARDS.slice(5, 10);  // Cards 6-10

const engine = new GameEngine({
  blueHand,
  redHand,
  activeRules: [],  // Only BasicRule is active (always included)
  blueIsAI: false,
  redIsAI: false,
});

console.log('=== TRIPLE TRIO TEST ===\n');
console.log('Blue hand: ', blueHand.map((c) => c.name).join(', '));
console.log('Red hand:  ', redHand.map((c) => c.name).join(', '));

// ──────────────────────────────────────────────────────────────
// HARDCODED MOVE SEQUENCE
// ──────────────────────────────────────────────────────────────

const moves: Array<[number, number, number]> = [
  // [handIndex, row, col]
  // Turn 1 (Blue): Goblin at (1,1) - center
  [0, 1, 1],
  // Turn 2 (Red): Wolf at (0,1) - top middle
  [0, 0, 1],
  // Turn 3 (Blue): Bat at (1,0) - left middle
  // (Bat has top=1, right=2, bottom=2, left=3)
  // Goblin is to the right: Goblin right=3 vs Bat left=3 — no capture
  [1, 1, 0],
  // Turn 4 (Red): Slime at (2,1) - bottom middle
  // (Slime has top=3, right=2, bottom=2, left=2)
  // Goblin is above: Goblin bottom=4 vs Slime top=3 — Blue captures Slime!
  [1, 2, 1],
  // Turn 5 (Blue): Skeleton at (0,0) - top left
  [2, 0, 0],
  // Turn 6 (Red): Skeleton at (0,2) - top right
  [2, 0, 2],
  // Turn 7 (Blue): Zombie at (2,0) - bottom left
  [3, 2, 0],
  // Turn 8 (Red): Zombie at (2,2) - bottom right
  [3, 2, 2],
  // Turn 9 (Blue): Rat at (1,2) - right middle
  [4, 1, 2],
];

// ──────────────────────────────────────────────────────────────
// PLAY LOOP
// ──────────────────────────────────────────────────────────────

for (let i = 0; i < moves.length; i++) {
  const [handIndex, row, col] = moves[i];
  const state = engine.getState();

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`Turn ${state.turnNumber} (${state.currentTurn})`);
  console.log(`${'═'.repeat(50)}`);

  const currentPlayer = state.players[state.currentTurn === PlayerSide.Blue ? 0 : 1];
  const cardName = currentPlayer.hand[handIndex].name;

  console.log(`Placing hand[${handIndex}] ${cardName} at (${row},${col})`);

  try {
    const result = engine.placeCard(handIndex, row, col);
    printEvents(result.events);
    printBoard(result.newState);
    printScores(result.newState);
  } catch (e) {
    console.error('\n❌ ERROR: Invalid move');
    console.error(e);
    process.exit(1);
  }
}

// ──────────────────────────────────────────────────────────────
// FINAL RESULT
// ──────────────────────────────────────────────────────────────

const final = engine.getState();

console.log(`\n${'═'.repeat(50)}`);

if (final.phase === GamePhase.GameOver) {
  console.log('✅ GAME OVER');
  console.log(`Winner: ${final.winner}`);
  console.log(`Blue:  ${final.players[0].score}`);
  console.log(`Red:   ${final.players[1].score}`);
  console.log(`${'═'.repeat(50)}\n`);
  console.log('✅ Test passed!');
  process.exit(0);
} else {
  console.error('❌ ERROR: Game did not reach GameOver state');
  console.error(`Phase: ${final.phase}, Turn: ${final.turnNumber}`);
  process.exit(1);
}
