/**
 * Scene music — lazy Audio elements, linear crossfades.
 * Drop files under assets/music/ (see TRACK_SRC). Missing files fail silently in console.
 *
 * Browsers block autoplay until a user gesture; the game starts after keypress so play() usually works.
 */

const DEFAULT_FADE_MS = 800;

/** @type {Record<string, string>} */
const TRACK_SRC = {
  map: 'assets/music/map.mp3',
  battle: 'assets/music/battle.mp3',
  grandma: 'assets/music/grandma.mp3',
  coffee: 'assets/music/coffee.mp3',
  joe: 'assets/music/joe.mp3',
};

/** Desired playback volume per track id when fully faded in (0–1) */
const baseVolume = new Map(
  Object.keys(TRACK_SRC).map((id) => [id, id === 'map' ? 0.45 : 0.55]),
);

/** @type {Map<string, HTMLAudioElement>} */
const pool = new Map();

let activeId = null;
/** @type {{ audio: HTMLAudioElement, fromVol: number, toVol: number, t0: number, dur: number } | null} */
let fadeIn = null;
/** @type {{ audio: HTMLAudioElement, fromVol: number, toVol: number, t0: number, dur: number } | null} */
let fadeOut = null;
let raf = 0;

function ensureAudio(id) {
  if (!TRACK_SRC[id]) return null;
  let a = pool.get(id);
  if (!a) {
    a = new Audio(TRACK_SRC[id]);
    a.loop = true;
    a.preload = 'auto';
    pool.set(id, a);
    a.addEventListener('error', () => {
      console.warn('[soundtrack] missing or blocked:', TRACK_SRC[id]);
    });
  }
  return a;
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

function tickFades(now = performance.now()) {
  if (fadeOut) {
    const u = fadeOut.dur <= 0 ? 1 : clamp01((now - fadeOut.t0) / fadeOut.dur);
    fadeOut.audio.volume = clamp01(fadeOut.fromVol + (fadeOut.toVol - fadeOut.fromVol) * u);
    if (u >= 1) {
      fadeOut.audio.pause();
      fadeOut.audio.currentTime = 0;
      fadeOut = null;
    }
  }
  if (fadeIn) {
    const u = fadeIn.dur <= 0 ? 1 : clamp01((now - fadeIn.t0) / fadeIn.dur);
    fadeIn.audio.volume = clamp01(fadeIn.fromVol + (fadeIn.toVol - fadeIn.fromVol) * u);
    if (u >= 1) fadeIn = null;
  }
  if (fadeIn || fadeOut) raf = requestAnimationFrame(() => tickFades());
  else raf = 0;
}

function startFadeLoop() {
  if (!raf) raf = requestAnimationFrame(() => tickFades());
}

/**
 * Jump or crossfade to a track.
 * @param {string} id
 * @param {number} [fadeMs]
 */
function transitionTo(id, fadeMs = DEFAULT_FADE_MS) {
  const audio = ensureAudio(id);
  if (!audio) return;

  if (activeId === id && !fadeOut) {
    audio.volume = clamp01(baseVolume.get(id) ?? 0.5);
    return;
  }

  const dur = Math.max(0, fadeMs | 0);

  if (activeId && activeId !== id) {
    const prev = pool.get(activeId);
    if (prev && !prev.paused) {
      fadeOut = {
        audio: prev,
        fromVol: prev.volume,
        toVol: 0,
        t0: performance.now(),
        dur,
      };
    }
  }

  fadeIn = null;
  const targetBase = baseVolume.get(id) ?? 0.5;
  audio.volume = dur <= 0 ? targetBase : 0;
  audio.play().catch(() => {});
  fadeIn = {
    audio,
    fromVol: audio.volume,
    toVol: targetBase,
    t0: performance.now(),
    dur,
  };
  activeId = id;
  startFadeLoop();
}

/** @param {string} id */
function playTrack(id) {
  transitionTo(id, 0);
}

/** @param {string} id */
function stopTrack(id) {
  const a = pool.get(id);
  if (!a) return;
  if (activeId === id) activeId = null;
  a.pause();
  a.currentTime = 0;
}

function stopAll(fadeMs = 400) {
  if (!activeId) return;
  const prev = pool.get(activeId);
  activeId = null;
  fadeIn = null;
  if (prev && !prev.paused) {
    fadeOut = {
      audio: prev,
      fromVol: prev.volume,
      toVol: 0,
      t0: performance.now(),
      dur: fadeMs,
    };
    startFadeLoop();
  }
}

/** @param {string} id */
function setVolume(id, v) {
  baseVolume.set(id, clamp01(v));
  if (activeId === id) {
    const a = pool.get(id);
    if (a) a.volume = clamp01(v);
  }
}

/**
 * Derive track from game state. Call when mode / indoor location changes.
 * @param {{ mode: string, indLoc?: string }} G
 */
function desiredTrackForState(G) {
  const m = G.mode;
  const loc = G.indLoc || '';

  if (m === 'TITLE' || m === 'INTRO') return null;
  if (m === 'EXPLORE' || m === 'NPC_TALK') return 'map';
  if (m === 'BATTLE') return 'battle';
  if (m === 'CAVE' || m === 'BOARDING') return 'map';
  if (m === 'FAREWELL') return 'grandma';
  if (m === 'CAB_FAREWELL') return 'map';
  if (m === 'AIRPORT') return 'map';
  if (m === 'TAKEOFF' || m === 'KOBE_PILOT' || m === 'CREDITS') return null;

  if (m === 'INDOOR' || m === 'INDOOR_TALK') {
    if (loc === 'cafe') return 'coffee';
    if (loc === 'house') return 'grandma';
    if (loc === 'jo_house' || loc === 'may_apt') return 'joe';
    return 'map';
  }

  return 'map';
}

let lastApplied = '';

/**
 * Idempotent: only crossfades when the logical track changes.
 * @param {{ mode: string, indLoc?: string }} G
 * @param {number} [fadeMs]
 */
function syncMusic(G, fadeMs = DEFAULT_FADE_MS) {
  const want = desiredTrackForState(G);
  const key = want ?? '__silent__';
  if (key === lastApplied) return;
  lastApplied = key;
  if (want === null) stopAll(fadeMs);
  else transitionTo(want, fadeMs);
}

// Classic script global — works from file://; ES `import` does not.
globalThis.soundtrack = {
  TRACK_SRC,
  playTrack,
  stopTrack,
  stopAll,
  setVolume,
  transitionTo,
  syncMusic,
  desiredTrackForState,
};
