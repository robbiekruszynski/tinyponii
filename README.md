# Tinyponii — May & Kobe: Hong Kong

A browser-only pixel adventure built around May and her dog Kobe, set in Hong Kong on the eve of a big move. Explore the neighbourhood, duck into interiors, stumble through encounters, and chase the thread to the airport — all in one self-contained HTML file.

There is no separate build step: open **`game.html`** in a modern browser (desktop or mobile).

**Repository:** [github.com/robbiekruszynski/tinyponii](https://github.com/robbiekruszynski/tinyponii)

---

## How to play

### Desktop

1. Clone or download this repo.
2. Double-click **`game.html`**, or serve the folder locally if your browser is picky about file URLs:

   ```bash
   npx --yes serve .
   ```

   Then open the URL it prints (often `http://localhost:3000`) and choose **`game.html`**.

### Mobile

Same file — **`game.html`** works on phones and tablets. Controls appear automatically when the device reports touch / coarse pointer, or on narrow viewports:

- **Landscape** is recommended: you get a bigger playfield with the touch rail on the side.
- **Portrait**: compact overlay controls sit at the bottom so more of the canvas stays visible.

Tap anywhere on the pad or **A** once if audio stays silent until the browser unlocks sound.

---

## Controls

| Action | Keyboard | Touch |
|--------|-----------|--------|
| Move | **WASD** or **Arrow keys** | D-pad |
| Interact / advance dialogue | **Space** or **Enter** | **A** |
| Battle / menus (up/down where shown) | **↑↓** / **W**/**S** | D-pad up/down |

---

## Tech notes

- **Rendering:** `<canvas>` at 640×480 (pixel-crisp scaling via CSS).
- **Audio:** Music and sting-style cues are driven by the **Web Audio API** inside **`game.html`** (no MP3s required for the default experience).
- **Optional MP3 soundtrack:** The repo also includes **`soundtrack.js`** and **`assets/music/README.txt`** if you want to experiment with looping tracks from files instead of the built-in synth patterns.

---

## Assets

Portrait images and optional art live under **`assets/`**. If you open the game straight from disk without those files present, it tries **GitHub-hosted fallbacks** for character portraits so dialogue still looks reasonable.

Optional extras (e.g. cockpit backdrop) are referenced when present under **`assets/`**; missing images are skipped gracefully.

---

## Repo layout

| Path | Purpose |
|------|---------|
| **`game.html`** | Full game + embedded soundtrack logic |
| **`assets/`** | PNG portraits and optional imagery |
| **`soundtrack.js`** | Alternate MP3-based music helper (not wired into `game.html` by default) |

---

## Credits

Made with affection for May, Kobe, and Hong Kong — Barcelona awaits.
