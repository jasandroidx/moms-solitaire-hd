/* Mom's Solitaire — GameEngine (pure rules, no DOM).
 * R5: rules separated from rendering. R2: node-testable. R8: variant-ready via VARIANT.
 * Works in browser (classic script) and node (module.exports guard at bottom).
 */
'use strict';

const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'];
const SUIT_SYMBOL = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' };
const RANK_LABEL = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
const RANK_NAME = { 1: 'Ace', 11: 'Jack', 12: 'Queen', 13: 'King' };

function rankLabel(r) { return RANK_LABEL[r] || String(r); }
function rankName(r) { return RANK_NAME[r] || String(r); }
function suitName(s) { return s[0].toUpperCase() + s.slice(1); }
function cardName(c) { return rankName(c.rank) + ' of ' + suitName(c.suit); }

// R8: the game definition. A future FreeCell is a new VARIANT object, not a rewrite.
const KLONDIKE = {
  name: 'klondike',
  tableauCount: 7,
  foundations: ['spades', 'hearts', 'diamonds', 'clubs'],
  buildDownBy: 1,
  alternateColors: true,
  emptyColumnAccepts: 13, // Kings only
};

function makeDeck() {
  const deck = [];
  let id = 0;
  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({ id: id++, suit, rank, red: suit === 'hearts' || suit === 'diamonds', faceUp: false });
    }
  }
  return deck;
}

function shuffle(deck, rng) {
  const rand = rng || Math.random;
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function cloneState(s) {
  return JSON.parse(JSON.stringify(s));
}

class GameEngine {
  constructor(variant) {
    this.variant = variant || KLONDIKE;
    this.history = [];
    this.state = null;
  }

  newGame(drawCount, rng) {
    this.history = [];
    const deck = shuffle(makeDeck(), rng);
    const v = this.variant;
    const tableau = [];
    for (let c = 0; c < v.tableauCount; c++) {
      const col = [];
      for (let i = 0; i <= c; i++) col.push(deck.pop());
      col[col.length - 1].faceUp = true;
      tableau.push(col);
    }
    const foundations = {};
    for (const s of v.foundations) foundations[s] = [];
    this.state = {
      stock: deck, waste: [], foundations, tableau,
      drawCount: drawCount || 1, moves: 0,
    };
    return this.state;
  }

  // ---- history ----
  _pushHistory() {
    this.history.push(cloneState(this.state));
    if (this.history.length > 300) this.history.shift();
  }
  undo() {
    if (!this.history.length) return false;
    this.state = this.history.pop();
    return true;
  }
  canUndo() { return this.history.length > 0; }

  // ---- helpers ----
  topOf(col) { return col[col.length - 1]; }

  // face-up run at the top of a tableau column (the draggable sequence)
  movableSequence(colIdx) {
    const col = this.state.tableau[colIdx];
    let i = col.length - 1;
    while (i > 0 && col[i].faceUp && col[i - 1].faceUp &&
           col[i - 1].rank === col[i].rank + 1 && col[i - 1].red !== col[i].red) i--;
    if (!col[i] || !col[i].faceUp) return [];
    return col.slice(i);
  }

  canPlaceOnTableau(cards, colIdx) {
    if (!cards.length) return false;
    const v = this.variant;
    const col = this.state.tableau[colIdx];
    const first = cards[0];
    if (!col.length) return first.rank === v.emptyColumnAccepts;
    const top = this.topOf(col);
    return top.faceUp && top.red !== first.red && top.rank === first.rank + v.buildDownBy;
  }

  canPlaceOnFoundation(card) {
    const f = this.state.foundations[card.suit];
    if (!f.length) return card.rank === 1;
    return this.topOf(f).rank === card.rank - 1;
  }

  // a card is safe to auto-foundation when both opposite-color lower cards are already home
  isSafeForFoundation(card) {
    if (card.rank <= 2) return true;
    const need = card.rank - 1;
    const opp = card.red ? ['spades', 'clubs'] : ['hearts', 'diamonds'];
    return opp.every(s => {
      const f = this.state.foundations[s];
      return f.length && this.topOf(f).rank >= need;
    });
  }

  _afterMove() {
    // flip newly exposed tableau cards (tracked so the UI can react to flips)
    const flipped = [];
    for (const col of this.state.tableau) {
      const t = this.topOf(col);
      if (t && !t.faceUp) { t.faceUp = true; flipped.push(t); }
    }
    this.state.moves++;
    this.state.lastFlips = flipped;
  }

  // ---- moves (each returns {ok, ...}) ----
  draw() {
    const s = this.state;
    this._pushHistory();
    if (!s.stock.length) {
      // recycle waste back to stock (reverses order, face down)
      while (s.waste.length) { const c = s.waste.pop(); c.faceUp = false; s.stock.push(c); }
      this._afterMove();
      return { ok: true, recycled: true };
    }
    const drawn = [];
    for (let i = 0; i < s.drawCount && s.stock.length; i++) {
      const c = s.stock.pop(); c.faceUp = true; s.waste.push(c); drawn.push(c);
    }
    this._afterMove();
    s.lastFlips = (s.lastFlips || []).concat(drawn);
    return { ok: true, recycled: false };
  }

  // from: {zone:'waste'} | {zone:'tableau', col}
  moveToFoundation(from) {
    const s = this.state;
    let card;
    if (from.zone === 'waste') card = this.topOf(s.waste);
    else card = this.topOf(s.tableau[from.col]);
    if (!card || !card.faceUp || !this.canPlaceOnFoundation(card)) return { ok: false };
    this._pushHistory();
    if (from.zone === 'waste') s.waste.pop(); else s.tableau[from.col].pop();
    s.foundations[card.suit].push(card);
    this._afterMove();
    return { ok: true, card };
  }

  // move the top movable sequence of a tableau column (or the waste top) onto a tableau column
  moveToTableau(from, toCol) {
    const s = this.state;
    let cards;
    if (from.zone === 'waste') { const t = this.topOf(s.waste); cards = t && t.faceUp ? [t] : []; }
    else cards = this.movableSequence(from.col);
    if (!cards.length) return { ok: false };
    if (from.zone === 'tableau' && from.col === toCol) return { ok: false };
    if (!this.canPlaceOnTableau(cards, toCol)) return { ok: false };
    this._pushHistory();
    if (from.zone === 'waste') s.waste.pop();
    else s.tableau[from.col].splice(s.tableau[from.col].length - cards.length, cards.length);
    s.tableau[toCol].push(...cards);
    this._afterMove();
    return { ok: true, cards };
  }

  // R1/R4: tap a card with no selection -> best legal spot (foundation first, then tableau)
  tapCard(loc) {
    const s = this.state;
    let card, seq;
    if (loc.zone === 'waste') { card = this.topOf(s.waste); seq = card && card.faceUp ? [card] : []; }
    else if (loc.zone === 'foundation') return { ok: false };
    else { seq = this.movableSequence(loc.col); card = seq[0]; }
    if (!card) return { ok: false };
    // single cards prefer foundation
    if (seq.length === 1 && this.canPlaceOnFoundation(card)) return this.moveToFoundation(loc);
    // then tableau
    for (let c = 0; c < s.tableau.length; c++) {
      if (loc.zone === 'tableau' && loc.col === c) continue;
      if (this.canPlaceOnTableau(seq, c)) return { ...this.moveToTableau(loc, c), toCol: c };
    }
    // last resort: foundation even for sequences of 1 already tried; nothing
    return { ok: false };
  }

  // ---- hints (R1: glow the suggestion) ----
  hint() {
    const s = this.state;
    const locOf = (zone, col) => ({ zone, col });
    // 1. tableau top -> foundation (safe first, then any legal)
    for (const safeOnly of [true, false]) {
      for (let c = 0; c < s.tableau.length; c++) {
        const t = this.topOf(s.tableau[c]);
        if (t && t.faceUp && this.canPlaceOnFoundation(t) && (!safeOnly || this.isSafeForFoundation(t)))
          return { from: locOf('tableau', c), to: { zone: 'foundation', suit: t.suit }, text: cardName(t) + ' to foundation', card: t };
      }
      const w = this.topOf(s.waste);
      if (w && this.canPlaceOnFoundation(w) && (!safeOnly || this.isSafeForFoundation(w)))
        return { from: locOf('waste'), to: { zone: 'foundation', suit: w.suit }, text: cardName(w) + ' to foundation', card: w };
    }
    // 2. waste -> tableau
    {
      const w = this.topOf(s.waste);
      if (w) for (let c = 0; c < s.tableau.length; c++)
        if (this.canPlaceOnTableau([w], c))
          return { from: locOf('waste'), to: locOf('tableau', c), text: cardName(w) + ' to column ' + (c + 1), card: w };
    }
    // 3. tableau -> tableau that flips a face-down card
    for (let c = 0; c < s.tableau.length; c++) {
      const seq = this.movableSequence(c);
      if (!seq.length) continue;
      const col = s.tableau[c];
      const flips = col.length > seq.length && !col[col.length - seq.length - 1].faceUp;
      if (!flips) continue;
      for (let d = 0; d < s.tableau.length; d++) {
        if (d === c) continue;
        if (this.canPlaceOnTableau(seq, d))
          return { from: locOf('tableau', c), to: locOf('tableau', d), text: cardName(seq[0]) + ' to column ' + (d + 1), card: seq[0] };
      }
    }
    // 4. any tableau -> tableau
    for (let c = 0; c < s.tableau.length; c++) {
      const seq = this.movableSequence(c);
      if (!seq.length) continue;
      for (let d = 0; d < s.tableau.length; d++) {
        if (d === c) continue;
        if (this.canPlaceOnTableau(seq, d))
          return { from: locOf('tableau', c), to: locOf('tableau', d), text: cardName(seq[0]) + ' to column ' + (d + 1), card: seq[0] };
      }
    }
    // 5. draw
    if (s.stock.length || s.waste.length) return { from: { zone: 'stock' }, to: { zone: 'waste' }, text: 'Draw from the stock', card: null };
    return null;
  }

  // ---- auto-complete ----
  canAutoComplete() {
    const s = this.state;
    if (s.stock.length || s.waste.length) return false;
    return s.tableau.every(col => col.every(c => c.faceUp));
  }

  autoStep() {
    const s = this.state;
    for (let c = 0; c < s.tableau.length; c++) {
      const col = s.tableau[c];
      if (!col.length) continue;
      const t = this.topOf(col);
      if (this.canPlaceOnFoundation(t) && this.isSafeForFoundation(t)) {
        const r = this.moveToFoundation({ zone: 'tableau', col: c });
        return r.ok ? { ok: true, card: t } : { ok: false };
      }
    }
    return { ok: false };
  }

  isWon() {
    const s = this.state;
    return this.variant.foundations.every(suit => s.foundations[suit].length === 13);
  }

  // expose for tests / UI labels
  describe() {
    const s = this.state;
    return {
      stock: s.stock.length, waste: s.waste.length,
      foundations: Object.fromEntries(Object.entries(s.foundations).map(([k, v]) => [k, v.length])),
      tableau: s.tableau.map(c => c.length),
      moves: s.moves, won: this.isWon(),
    };
  }
}

// node export guard — in the browser this file is a classic script (no module system)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { GameEngine, KLONDIKE, SUITS, SUIT_SYMBOL, makeDeck, shuffle, cardName, rankLabel };
}
