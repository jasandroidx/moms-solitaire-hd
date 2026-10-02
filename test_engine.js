'use strict';
const assert = require('assert');
const { GameEngine, KLONDIKE, SUITS, makeDeck, cardName } = require('./engine.js');

console.log('Running GameEngine unit tests...');

// 1. Basic initialization
const eng = new GameEngine();
eng.newGame(1);
assert.strictEqual(eng.state.stock.length, 24);
assert.strictEqual(eng.state.waste.length, 0);
assert.strictEqual(eng.state.tableau.length, 7);

// 2. Test draw
const drawRes = eng.draw();
assert.strictEqual(drawRes.ok, true);
assert.strictEqual(eng.state.stock.length, 23);
assert.strictEqual(eng.state.waste.length, 1);
assert.strictEqual(eng.canUndo(), true);

// 3. Test Undo
assert.strictEqual(eng.undo(), true);
assert.strictEqual(eng.state.stock.length, 24);
assert.strictEqual(eng.state.waste.length, 0);

// 4. Test foundation placement rules
const customDeck = makeDeck();
const aceSpades = customDeck.find(c => c.suit === 'spades' && c.rank === 1);
const twoSpades = customDeck.find(c => c.suit === 'spades' && c.rank === 2);
aceSpades.faceUp = true;
twoSpades.faceUp = true;

eng.state.waste = [aceSpades];
assert.strictEqual(eng.canPlaceOnFoundation(aceSpades), true);

const fRes = eng.moveToFoundation({ zone: 'waste' });
assert.strictEqual(fRes.ok, true);
assert.strictEqual(eng.state.foundations.spades.length, 1);
assert.strictEqual(eng.state.waste.length, 0);

// Try placing 2 of spades on Spades foundation
eng.state.waste = [twoSpades];
assert.strictEqual(eng.canPlaceOnFoundation(twoSpades), true);
const fRes2 = eng.moveToFoundation({ zone: 'waste' });
assert.strictEqual(fRes2.ok, true);
assert.strictEqual(eng.state.foundations.spades.length, 2);

// 5. Test Tableau placement rules (alternate colors, build down)
const tenHearts = customDeck.find(c => c.suit === 'hearts' && c.rank === 10);
const nineSpades = customDeck.find(c => c.suit === 'spades' && c.rank === 9);
tenHearts.faceUp = true;
nineSpades.faceUp = true;

eng.state.tableau[0] = [tenHearts];
eng.state.tableau[1] = [nineSpades];

assert.strictEqual(eng.canPlaceOnTableau([nineSpades], 0), true);
const tRes = eng.moveToTableau({ zone: 'tableau', col: 1 }, 0);
assert.strictEqual(tRes.ok, true);
assert.strictEqual(eng.state.tableau[0].length, 2);
assert.strictEqual(eng.state.tableau[1].length, 0);

// King into empty column
const kingClubs = customDeck.find(c => c.suit === 'clubs' && c.rank === 13);
kingClubs.faceUp = true;
eng.state.tableau[2] = [kingClubs];
assert.strictEqual(eng.canPlaceOnTableau([kingClubs], 1), true); // col 1 is empty

// 6. Test tapCard
eng.state.tableau[3] = [];
const aceHearts = customDeck.find(c => c.suit === 'hearts' && c.rank === 1);
aceHearts.faceUp = true;
eng.state.waste = [aceHearts];
const tapRes = eng.tapCard({ zone: 'waste' });
assert.strictEqual(tapRes.ok, true);
assert.strictEqual(eng.state.foundations.hearts.length, 1);

// 7. Test hint
const hintRes = eng.hint();
assert.notStrictEqual(hintRes, null);

// 8. Test sub-sequence tapCard in tableau
const customDeck2 = makeDeck();
const kingS = customDeck2.find(c => c.suit === 'spades' && c.rank === 13);
const queenH = customDeck2.find(c => c.suit === 'hearts' && c.rank === 12);
const jackS = customDeck2.find(c => c.suit === 'spades' && c.rank === 11);
const kingC = customDeck2.find(c => c.suit === 'clubs' && c.rank === 13);
[kingS, queenH, jackS, kingC].forEach(c => c.faceUp = true);

// Clear tableau for clean isolated test
for (let c = 0; c < 7; c++) eng.state.tableau[c] = [];

eng.state.tableau[0] = [kingS, queenH, jackS];
eng.state.tableau[3] = [kingC]; // King of Clubs (black) can accept Queen of Hearts (red)

// Tapping queenH (idx 1 in col 0) should move [queenH, jackS] to col 3 (on kingC)
const tapQueen = eng.tapCard({ zone: 'tableau', col: 0, idx: 1 });
assert.strictEqual(tapQueen.ok, true);
assert.strictEqual(tapQueen.toCol, 3);
assert.strictEqual(eng.state.tableau[3].length, 3); // kingC, queenH, jackS
assert.strictEqual(eng.state.tableau[0].length, 1); // kingS remains

console.log('All GameEngine unit tests passed successfully!');
