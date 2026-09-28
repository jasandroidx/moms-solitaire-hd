'use strict';
const assert = require('assert');
const { GameEngine, seedPRNG } = require('./engine.js');

console.log('Running Daily Deal tests...');

// Test 1: Seeded PRNG produces deterministic sequences
const dateStr1 = '2025-09-28';
const dateStr2 = '2025-09-29';

const rng1a = seedPRNG(dateStr1);
const rng1b = seedPRNG(dateStr1);
const rng2 = seedPRNG(dateStr2);

const seq1a = Array.from({ length: 10 }, () => rng1a());
const seq1b = Array.from({ length: 10 }, () => rng1b());
const seq2 = Array.from({ length: 10 }, () => rng2());

assert.deepStrictEqual(seq1a, seq1b, 'PRNG with same seed should produce identical sequence');
assert.notDeepStrictEqual(seq1a, seq2, 'PRNG with different seeds should produce different sequence');

// Test 2: GameEngine deals identical initial board state given same seed
const eng1a = new GameEngine();
const eng1b = new GameEngine();
const eng2 = new GameEngine();

eng1a.newGame(1, seedPRNG(dateStr1));
eng1b.newGame(1, seedPRNG(dateStr1));
eng2.newGame(1, seedPRNG(dateStr2));

assert.deepStrictEqual(eng1a.state.tableau, eng1b.state.tableau, 'Tableau should match for same date seed');
assert.deepStrictEqual(eng1a.state.stock, eng1b.state.stock, 'Stock should match for same date seed');

assert.notDeepStrictEqual(eng1a.state.tableau, eng2.state.tableau, 'Tableau should differ for different date seeds');

console.log('All Daily Deal tests passed successfully!');
