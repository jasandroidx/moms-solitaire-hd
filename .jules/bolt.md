## 2025-10-01 - Avoid JSON.parse(JSON.stringify()) for Game State Snapshots
**Learning:** In Solitaire game engines where move history is saved on every action, using `JSON.parse(JSON.stringify(state))` creates huge serialization overhead and GC pressure (~50 µs per clone). Tailored object and array cloning (`.map(cloneCard)`) runs in ~1.1 µs per clone (~40x speedup).
**Action:** Always prefer explicit shallow/deep property copying functions for structured game state over generic JSON serialization in performance-critical history tracking or state cloning loops.

## 2025-10-02 - Avoid `.map().join()` for High-Frequency State Key Generation
**Learning:** In state-space graph search algorithms (e.g. `isSolvable`), key serialization runs thousands of times per second. Chaining `.map().join()` across tableau columns and stock arrays creates dozens of temporary intermediate arrays and strings per state. Replacing this with an imperative string builder loop yields a ~2.6x speedup for key generation and increases solver search throughput by ~15.7%.
**Action:** Use direct loops and string concatenation for state hashing/key generation in tight search loops instead of array transformation chains.

## 2025-10-03 - Cache Bounding Rectangles During Pointer Move/Drag Operations
**Learning:** Calling `getBoundingClientRect()` inside high-frequency DOM event handlers like `pointermove` forces synchronous DOM layout recalculations (layout thrashing) on every drag frame (~60 FPS). Caching pile bounding rectangles at `pointerdown` (`startDrag`) and querying layout properties purely from pointer offsets completely eliminates layout thrashing during card dragging.
**Action:** Cache DOM element dimensions and positions at the start of continuous drag interactions rather than querying layout geometry inside hot event callbacks.
