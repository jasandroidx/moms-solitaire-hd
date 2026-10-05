## 2025-10-01 - Avoid JSON.parse(JSON.stringify()) for Game State Snapshots
**Learning:** In Solitaire game engines where move history is saved on every action, using `JSON.parse(JSON.stringify(state))` creates huge serialization overhead and GC pressure (~50 µs per clone). Tailored object and array cloning (`.map(cloneCard)`) runs in ~1.1 µs per clone (~40x speedup).
**Action:** Always prefer explicit shallow/deep property copying functions for structured game state over generic JSON serialization in performance-critical history tracking or state cloning loops.

## 2025-10-02 - Avoid `.map().join()` for High-Frequency State Key Generation
**Learning:** In state-space graph search algorithms (e.g. `isSolvable`), key serialization runs thousands of times per second. Chaining `.map().join()` across tableau columns and stock arrays creates dozens of temporary intermediate arrays and strings per state. Replacing this with an imperative string builder loop yields a ~2.6x speedup for key generation and increases solver search throughput by ~15.7%.
**Action:** Use direct loops and string concatenation for state hashing/key generation in tight search loops instead of array transformation chains.

## 2025-05-18 - Read Geometry Before Clearing/Mutating DOM in Render Loops
**Learning:** Calling `getBoundingClientRect()` inside a render method *after* clearing DOM containers (`clearPile`) forces the browser to flush pending styles and recalculate layout synchronously (layout thrashing). Reading element metrics before mutating any DOM nodes allows the browser to batch layout calculations efficiently.
**Action:** Always read DOM geometry/layout properties at the start of render functions before mutating or clearing child nodes.
