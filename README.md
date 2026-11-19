# Tic Tac Toe Arena - YouTube Playables Edition

A fresh, ultra-fast, zero-dependency HTML5 multi-player game built specifically for **YouTube Playables** and modern web browsers.

---

## 🎮 Key Features

- **2, 3, and 4 Players**:
  - **Pass & Play**: Play locally on the same screen with 2, 3, or 4 friends!
  - **Distinct Marks**: `✕` (Player 1), `◯` (Player 2), `▲` (Player 3), `■` (Player 4).
- **Smart AI Bots**:
  - Battle 1, 2, or 3 intelligent bot opponents in VS AI mode.
  - **Easy, Medium, Hard**: Minimax alpha-beta pruning for 3×3 and Gomoku-style heuristic multi-threat assessment for larger grids.
- **Multiple Arenas & Dynamic Win Streaks**:
  - `3 × 3` (3 in a row)
  - `4 × 4` (4 in a row)
  - `5 × 5` (4 in a row)
  - `6 × 6` (4 in a row)
  - `9 × 9` (5 in a row Gomoku style)
  - `11 × 11` (5 in a row Mega Arena)
- **100% Synthetic Web Audio API**:
  - Move placement pop, 4-tone victory fanfare, dramatic draw chime, and UI clicks.
  - Zero external audio files to fail loading; works instantly offline.
- **5 High-Contrast Themes + Dark/Light Mode**:
  - ⚡ Neon Classic (Cyan / Pink / Gold)
  - 🟢 Matrix Cyber (Cyber Green / Cyan)
  - 🔥 Lava Flame (Obsidian / Flame Orange / Yellow)
  - ❄️ Ice Frost (Navy / Ice Blue / White)
  - 🌌 Galaxy Violet (Deep Cosmic / Electric Violet / Gold)
- **Victory & Draw Animations**:
  - Dynamic 60fps canvas confetti explosion.
  - Shake impact animation on stalemate draw.
  - Winning strike line highlight.

---

## 🚀 YouTube Playables Integration

This game complies with the official **YouTube Playables SDK** standard:

- **SDK Loading**: Linked via `<script src="https://www.youtube.com/playables/api/v1/playables.js"></script>` in `index.html`.
- **Lifecycle Calls**:
  - `window.ytgame.gameLoaded()`: Triggered as soon as scripts and DOM are ready.
  - `window.ytgame.gameReady()`: Triggered when entering the gameplay arena.
  - `window.ytgame.onAudioEnabledChange()`: Automatically respects YouTube player mute/unmute settings.
  - `window.ytgame.onPause()` & `window.ytgame.onResume()`: Handles YouTube iframe backgrounding.
  - `window.ytgame.sendScore()`: Reports game score for leaderboards.
- **Graceful Fallback**: If running outside of YouTube (e.g. standalone browser, Brave, Chrome), it functions seamlessly with zero console errors.

---

## 💻 How to Run Locally

### Option 1: Direct Double Click
Simply double-click `index.html` to open it in **Brave**, **Chrome**, **Edge**, or **Safari**. No server or installation required!

### Option 2: Local HTTP Server (Node.js)
```bash
# In this directory:
npm start
# OR:
npx serve .
```
Then open `http://localhost:3000` in your browser.

---

## 📦 Submitting to YouTube Playables

To submit or upload to the YouTube Playables portal:
1. Select all files in this folder (`index.html`, `css/`, `js/`, `package.json`, `README.md`).
2. Right-click and choose **Compress to ZIP** (or create `game-bundle.zip`).
3. Make sure `index.html` is at the **root** of the ZIP archive.
4. Upload to YouTube Playables Console.

