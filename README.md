# Mom's Solitaire HD

Custom Klondike solitaire crafted especially for Mom's Acer Chromebook.

---

## 🚀 Easy Setup on Mom's Chromebook (No `index.html` searching!)

To make opening the game super easy for Mom so she can just click an icon:

### Option A: Install as a Progressive Web App (PWA) (Recommended)
1. Open the game in Chrome on her Acer Chromebook (either hosted URL or local web server).
2. Click the **📲 Install App** button in the top menu bar (or click Chrome's **Install / ➕** icon in the address bar).
3. Confirm **Install**.
4. Right-click (or two-finger tap) the newly installed **Mom's Solitaire** app icon on her Chromebook Shelf/Launcher and select **Pin to Shelf**.
5. Mom can now launch the game with one click anytime directly from her shelf or launcher with a cute app icon!

### Option B: Create a Desktop / Shelf Shortcut
1. Open `index.html` in Chrome on her Chromebook.
2. Click Chrome's **3 dots menu (⋮)** in the upper right.
3. Go to **Save and share** > **Create shortcut...** (or **More tools** > **Create shortcut...**).
4. Name it **Mom's Solitaire** and check **Open as window**.
5. Click **Create**, then right-click the icon on the bottom shelf and choose **Pin to shelf**.

---

## 🎮 Chromebook Usability & Features
- **Touch & Trackpad Friendly**: Tap a card, then tap its destination—or drag and drop with forgiving snap targets.
- **Double-Tap / Double-Click**: Rapidly double-tap any card to instantly move it to its Foundation pile!
- **Big Cards Mode**: Click **Big Cards** in the menu for enhanced visibility.
- **Audio & Ambiance**: Synthesized WebAudio sounds, custom voice lines, radio player, and weather ambiances.

---

## 🛠️ Developer Notes
- `bonus/bonus.mp4` is stored split (GitHub API blob limit) — after cloning, run `sh bonus/assemble.sh` once to reassemble it.
- Engine unit tests can be verified using: `node test_daily_deal.js`.
