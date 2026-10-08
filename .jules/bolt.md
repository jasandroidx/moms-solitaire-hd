## 2025-10-01 - Avoid JSON.parse(JSON.stringify()) for Game State Snapshots
**Learning:** In Solitaire game engines where move history is saved on every action, using `JSON.parse(JSON.stringify(state))` creates huge serialization overhead and GC pressure (~50 µs per clone). Tailored object and array cloning (`.map(cloneCard)`) runs in ~1.1 µs per clone (~40x speedup).
**Action:** Always prefer explicit shallow/deep property copying functions for structured game state over generic JSON serialization in performance-critical history tracking or state cloning loops.

## 2025-10-02 - Avoid `.map().join()` for High-Frequency State Key Generation
**Learning:** In state-space graph search algorithms (e.g. `isSolvable`), key serialization runs thousands of times per second. Chaining `.map().join()` across tableau columns and stock arrays creates dozens of temporary intermediate arrays and strings per state. Replacing this with an imperative string builder loop yields a ~2.6x speedup for key generation and increases solver search throughput by ~15.7%.
**Action:** Use direct loops and string concatenation for state hashing/key generation in tight search loops instead of array transformation chains.

## 2025-10-03 - Compact State Encoding & Copy-on-Write Card Cloning in DFS Solver
**Learning:** In graph search algorithms for card games where card properties (`id`, `suit`, `rank`, `red`) are immutable, cloning all card objects on every state clone creates massive allocation overhead (~52 objects/clone). Replacing deep card cloning with shallow column array cloning (`col.slice()`) and copy-on-write flip helpers eliminates ~98% of temporary object allocations. Additionally, using `String.fromCharCode(card.id + (card.faceUp ? 128 : 0))` packs card ID and state into a single character, shrinking state key string length by ~64% (from ~180 to ~65 chars) and dramatically speeding up `Set.has`/`add` lookups. Combined, these changes boost solver throughput by ~1.93x (from ~97k states/sec to ~188k states/sec).
**Action:** Use ASCII character packing for state key strings and copy-on-write reference sharing for immutable state elements during state-space searches.

## 2025-10-04 - Skip Canvas ClearRect on Idle Animation Frames
**Learning:** Continuous background `requestAnimationFrame` loops that unconditionally call `cx.clearRect(0, 0, W, H)` consume significant GPU/CPU cycles (wiping millions of pixels 60-120 times per second) even when no active particle or ambient effects are being rendered. Tracking active FX states (`hasActiveFx`) and clean state (`wasDrawn`) allows skipping `cx.clearRect` during idle frames while guaranteeing a single final clear when animations finish.
**Action:** Always guard `canvas.clearRect` in continuous `requestAnimationFrame` loops with an activity check and dirty flag to avoid unnecessary full-screen clears on idle frames.
