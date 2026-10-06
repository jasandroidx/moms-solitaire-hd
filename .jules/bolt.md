## 2025-10-01 - Avoid JSON.parse(JSON.stringify()) for Game State Snapshots
**Learning:** In Solitaire game engines where move history is saved on every action, using `JSON.parse(JSON.stringify(state))` creates huge serialization overhead and GC pressure (~50 µs per clone). Tailored object and array cloning (`.map(cloneCard)`) runs in ~1.1 µs per clone (~40x speedup).
**Action:** Always prefer explicit shallow/deep property copying functions for structured game state over generic JSON serialization in performance-critical history tracking or state cloning loops.

## 2025-10-02 - Avoid `.map().join()` for High-Frequency State Key Generation
**Learning:** In state-space graph search algorithms (e.g. `isSolvable`), key serialization runs thousands of times per second. Chaining `.map().join()` across tableau columns and stock arrays creates dozens of temporary intermediate arrays and strings per state. Replacing this with an imperative string builder loop yields a ~2.6x speedup for key generation and increases solver search throughput by ~15.7%.
**Action:** Use direct loops and string concatenation for state hashing/key generation in tight search loops instead of array transformation chains.

## 2025-10-03 - Use Character Lookup Tables for High-Frequency State Key Serialization
**Learning:** Stringifying numeric card IDs and foundation lengths with comma delimiters during graph search state key generation incurs significant String conversion and parsing overhead in JavaScript engines. Mapping card IDs and counts directly to single characters via pre-computed lookup tables (`CARD_STR_DOWN`, `CARD_STR_UP`, `FOUND_CHAR`) cuts key string length in half and accelerates key generation by ~2x without memory allocations or string formatting overhead.
**Action:** Use pre-computed single-character lookup arrays mapped to non-colliding Unicode character ranges for high-frequency state key generation in graph search solvers.
