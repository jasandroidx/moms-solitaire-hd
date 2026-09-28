# Mom's Solitaire — ElevenLabs audio wiring notes

Generated with ElevenLabs (free tier). Files live in `sfx/` next to `index.html`.
The game loads clips via `Vox` (`new Audio('sfx/'+file)`) mapped in `CUSTOM.vox` in `index.html`.
Synthesized `Sfx.*` (click/flip/bad/win/etc.) are WebAudio tones — soft procedural SFX stay; mp3s layer sparsely on top.

## Sparse playback

`Vox.maybe(key, chance)` defaults to **~1 in 10 (0.1)**. It skips if muted, missing, or a long clip is still marked busy (`Vox._busyUntil`), so long VO/SFX don't stack back-to-back.

## Files + chances

| File | `CUSTOM.vox` key | When | Chance |
|------|------------------|------|--------|
| `lah-lah-solitaire-intro.mp3` | `intro` | Splash / logo letter reveal in `showIntro()` | **ALWAYS** (once per session open) |
| `card-place.mp3` | `cardPlace` | Successful tableau/foundation place via `placeSfx()` | ~10% (mutually exclusive vs cheer) |
| `audience-cheer-clap.mp3` | `cheer` | Same `placeSfx()` roll — foundation bias | ~10% place roll, then subset cheer |
| `crowd-ooooh.mp3` | `ooooh` | Foundation place peaks; ace/king flips in `afterMove` | ~10% |
| `crowd-aaaah.mp3` | `aaaah` | Same peaks (coin-flip vs ooooh) | ~10% |
| `deal-whoosh.mp3` | `dealWhoosh` | `messFly` deal + `floatUp` / new deal | ~10% |
| `win-jingle.mp3` | `winJingle` | `onWin` layered with existing `win` VO | **ALWAYS** (wins are rare) |

Skip wiring `marching-band.mp3` (user already has it / synth bed).

## Hook points

- **Intro:** `showIntro()` when `#splash` is shown (logo appearing) → `Vox.play('intro')` once
- **Card place:** drag/tap/pile success → `this.placeSfx(toFoundation)` after `Sfx.flip()`
- **Reactions:** foundation success + ace/king flips → `Vox.maybe('ooooh'|'aaaah', 0.1)`
- **Deal:** `messFly` / `floatUp` → `Vox.maybe('dealWhoosh', 0.1)`
- **Win:** `onWin` → `Vox.play('winJingle')` with `Vox.play('win')`
