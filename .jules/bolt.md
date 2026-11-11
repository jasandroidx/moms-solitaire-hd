## 2025-10-01 - Avoid JSON.parse(JSON.stringify()) for Game State Snapshots
**Learning:** In Solitaire game engines where move history is saved on every action, using `JSON.parse(JSON.stringify(state))` creates huge serialization overhead and GC pressure (~50 µs per clone). Tailored object and array cloning (`.map(cloneCard)`) runs in ~1.1 µs per clone (~40x speedup).
**Action:** Always prefer explicit shallow/deep property copying functions for structured game state over generic JSON serialization in performance-critical history tracking or state cloning loops.

## 2025-10-02 - Avoid `.map().join()` for High-Frequency State Key Generation
**Learning:** In state-space graph search algorithms (e.g. `isSolvable`), key serialization runs thousands of times per second. Chaining `.map().join()` across tableau columns and stock arrays creates dozens of temporary intermediate arrays and strings per state. Replacing this with an imperative string builder loop yields a ~2.6x speedup for key generation and increases solver search throughput by ~15.7%.
**Action:** Use direct loops and string concatenation for state hashing/key generation in tight search loops instead of array transformation chains.

## 2025-10-03 - Compact State Encoding & Copy-on-Write Card Cloning in DFS Solver
**Learning:** In graph search algorithms for card games where card properties (`id`, `suit`, `rank`, `red`) are immutable, cloning all card objects on every state clone creates massive allocation overhead (~52 objects/clone). Replacing deep card cloning with shallow column array cloning (`col.slice()`) and copy-on-write flip helpers eliminates ~98% of temporary object allocations. Additionally, using `String.fromCharCode(card.id + (card.faceUp ? 128 : 0))` packs card ID and state into a single character, shrinking state key string length by ~64% (from ~180 to ~65 chars) and dramatically speeding up `Set.has`/`add` lookups. Combined, these changes boost solver throughput by ~1.93x (from ~97k states/sec to ~188k states/sec).
**Action:** Use ASCII character packing for state key strings and copy-on-write reference sharing for immutable state elements during state-space searches.

## 2025-10-04 - Avoid Array Slicing (`.slice()`) for Move Traversal in Solver
**Learning:** Calling `movSeq(col)` during solver state expansion allocated temporary array slices (`col.slice(i)`) 7 times per visited state. In deep DFS searches traversing thousands of states per second, allocating temporary arrays in search loops triggers frequent garbage collection pauses. Replacing `movSeq()` array slicing with an index lookup (`movSeqIdx()`) returning the array index directly eliminates array allocations during tableau move evaluations.
**Action:** Return index positions instead of array slices when inspecting array sub-sequences in hot state-space graph search loops.
