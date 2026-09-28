const assert = require('assert');
const { GameEngine, KLONDIKE, makeDeck, shuffle, isSolvable } = require('./engine.js');

console.log('--- Testing Engine & Solver ---');

// 1. Check GameEngine.prototype.newGame customDeck
const eng = new GameEngine(KLONDIKE);
const customDeck = makeDeck(); // ordered deck
eng.newGame(1, null, customDeck);
assert.strictEqual(eng.state.stock.length, 24);
assert.strictEqual(eng.state.tableau.length, 7);
console.log('✓ GameEngine supports custom deck successfully.');

// 2. Check solver on a trivial winning state
const winningState = {
  stock: [],
  waste: [],
  foundations: { spades: [], hearts: [], diamonds: [], clubs: [] },
  tableau: [
    [{ id: 1, suit: 'spades', rank: 1, red: false, faceUp: true }],
    [], [], [], [], [], []
  ]
};
assert.strictEqual(isSolvable(winningState, 1, 500), true);
console.log('✓ Solver identifies trivial winnable state.');

// 3. Check solver on solvable deal search
let attempts = 0;
let foundWinnable = false;
const t0 = Date.now();
while (Date.now() - t0 < 3000 && !foundWinnable) {
  attempts++;
  const d = shuffle(makeDeck());
  const testEngine = new GameEngine(KLONDIKE);
  const state = testEngine.newGame(1, null, d);
  if (isSolvable(state, 1, 400)) {
    foundWinnable = true;
  }
}
assert.strictEqual(foundWinnable, true, 'Should find at least 1 winnable deal in 3 seconds');
console.log(`✓ Solver found a winnable deal in ${attempts} attempt(s).`);

// 4. Test timeout behavior
const dummyState = eng.newGame(1);
const tTimeoutStart = Date.now();
const res = isSolvable(dummyState, 1, 10); // 10ms strict timeout
const duration = Date.now() - tTimeoutStart;
assert.strictEqual(duration < 100, true, 'Solver should respect short timeout limit');
console.log(`✓ Solver respects timeout limit (${duration}ms).`);

console.log('All solver unit tests passed successfully!');
