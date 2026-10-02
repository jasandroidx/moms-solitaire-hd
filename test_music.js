const fs = require('fs');
const assert = require('assert');

// Read index.html and extract Music object code
const html = fs.readFileSync('index.html', 'utf8');
const musicCodeMatch = html.match(/\/\* Generative Web Audio score:[\s\S]*?^};/m);
if(!musicCodeMatch) {
  console.error("Could not find Music object code in index.html");
  process.exit(1);
}

const musicCode = musicCodeMatch[0];

// Mocks
class MockAudioContext {
  constructor() {
    this.currentTime = 0;
    this.state = 'running';
    this.destination = {};
  }
  createOscillator() {
    return {
      type: 'sine',
      frequency: { setValueAtTime: (f, t) => { this._lastFreq = f; } },
      connect: () => {},
      start: (t) => {},
      stop: (t) => {}
    };
  }
  createGain() {
    return {
      gain: {
        setValueAtTime: (v, t) => {},
        linearRampToValueAtTime: (v, t) => {},
        exponentialRampToValueAtTime: (v, t) => {}
      },
      connect: () => {}
    };
  }
}

global.Sfx = {
  ctx: new MockAudioContext(),
  muted: false,
  ensure() { if(!this.ctx) this.ctx = new MockAudioContext(); }
};

global.CUSTOM = { musicOn: true };
global.Radio = { on: false };

// Load Music object definition onto global
eval(musicCode.replace('const Music=', 'global.Music='));

console.log("Testing Music object...");

// Test 1: Normal game state
global.window = {
  ui: {
    musicOn: true,
    won: false,
    messy: false,
    eng: {
      isWon: () => false,
      canAutoComplete: () => false,
      describe: () => ({ foundations: { spades: 2, hearts: 1 } }),
      hint: () => ({ from: 'stock', to: 'waste' })
    }
  }
};

assert.strictEqual(global.Music.getGameState(), 'normal', 'Initial state should be normal');

// Test 2: Stuck state
global.window.ui.eng.hint = () => null;
assert.strictEqual(global.Music.getGameState(), 'stuck', 'State should be stuck when hint is null');

// Test 3: Near win state
global.window.ui.eng.canAutoComplete = () => true;
assert.strictEqual(global.Music.getGameState(), 'nearWin', 'State should be nearWin when canAutoComplete is true');

// Test 4: Win state
global.window.ui.won = true;
assert.strictEqual(global.Music.getGameState(), 'win', 'State should be win when won is true');

// Test 5: Music start and stop
global.window.ui.won = false;
global.window.ui.eng.canAutoComplete = () => false;
global.window.ui.eng.hint = () => ({});

global.Music.start();
assert.ok(global.Music.timer !== null, 'Music timer should be active after start()');

global.Music.tick();
assert.ok(global.Music.step > 0, 'Music step should increment after tick()');

global.Music.stop();
assert.strictEqual(global.Music.timer, null, 'Music timer should be null after stop()');

// Test 6: Toggle silences / Radio silences
global.Radio.on = true;
global.Music.start();
global.Music.tick(); // Should return early without error due to Radio.on
global.Radio.on = false;

global.window.ui.musicOn = false;
global.Music.tick(); // Should return early due to musicOn = false

console.log("All Music generative score tests passed successfully!");
