// Web Audio synth - no external assets needed.
let ctx: AudioContext | null = null;
function ac(): AudioContext {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function gainOf(volume: number) {
  const g = ac().createGain();
  g.gain.value = volume;
  g.connect(ac().destination);
  return g;
}

export function playClick(volume = 0.5) {
  if (volume <= 0) return;
  const c = ac();
  const t0 = c.currentTime;
  // bright click
  const o = c.createOscillator();
  const g = gainOf(volume * 0.3);
  o.type = "square";
  o.frequency.setValueAtTime(1200, t0);
  o.frequency.exponentialRampToValueAtTime(280, t0 + 0.09);
  g.gain.setValueAtTime(volume * 0.3, t0);
  g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.11);
  o.connect(g);
  o.start(t0);
  o.stop(t0 + 0.12);
  // low thump
  const o2 = c.createOscillator();
  const g2 = gainOf(volume * 0.4);
  o2.type = "sine";
  o2.frequency.setValueAtTime(180, t0);
  o2.frequency.exponentialRampToValueAtTime(60, t0 + 0.15);
  g2.gain.setValueAtTime(volume * 0.4, t0);
  g2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
  o2.connect(g2);
  o2.start(t0);
  o2.stop(t0 + 0.2);
}

export function playSpin(durationMs: number, volume = 0.5): () => void {
  if (volume <= 0) return () => {};
  const c = ac();
  const dur = durationMs / 1000;
  const t0 = c.currentTime;

  // Slot-machine ratchet — square sweep with accelerating tremolo
  const ratchet = c.createOscillator();
  const ratchetGain = gainOf(volume * 0.14);
  ratchet.type = "square";
  ratchet.frequency.setValueAtTime(80, t0);
  ratchet.frequency.linearRampToValueAtTime(360, t0 + dur);
  const trem = c.createOscillator();
  const tremGain = c.createGain();
  trem.type = "square";
  trem.frequency.setValueAtTime(16, t0);
  trem.frequency.linearRampToValueAtTime(42, t0 + dur);
  tremGain.gain.value = volume * 0.2;
  trem.connect(tremGain).connect(ratchetGain.gain);
  ratchet.connect(ratchetGain);
  ratchet.start(t0);
  trem.start(t0);

  // Rising tonal sweep for excitement
  const tone = c.createOscillator();
  const toneGain = gainOf(0);
  tone.type = "sawtooth";
  tone.frequency.setValueAtTime(220, t0);
  tone.frequency.exponentialRampToValueAtTime(880, t0 + dur);
  toneGain.gain.setValueAtTime(0, t0);
  toneGain.gain.linearRampToValueAtTime(volume * 0.1, t0 + 0.2);
  toneGain.gain.linearRampToValueAtTime(volume * 0.18, t0 + dur);
  tone.connect(toneGain);
  tone.start(t0);

  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    const tEnd = c.currentTime;
    try {
      ratchetGain.gain.cancelScheduledValues(tEnd);
      ratchetGain.gain.setValueAtTime(ratchetGain.gain.value, tEnd);
      ratchetGain.gain.exponentialRampToValueAtTime(0.0001, tEnd + 0.18);
      toneGain.gain.cancelScheduledValues(tEnd);
      toneGain.gain.setValueAtTime(toneGain.gain.value || 0.0001, tEnd);
      toneGain.gain.exponentialRampToValueAtTime(0.0001, tEnd + 0.18);
      ratchet.stop(tEnd + 0.22);
      trem.stop(tEnd + 0.22);
      tone.stop(tEnd + 0.22);
    } catch {
      /* ignore */
    }
  };
  setTimeout(stop, durationMs);
  return stop;
}

export function playSiren(volume = 0.5) {
  if (volume <= 0) return;
  const c = ac();
  const o = c.createOscillator();
  const g = gainOf(volume * 0.2);
  o.type = "sine";
  const t = c.currentTime;
  o.frequency.setValueAtTime(700, t);
  o.frequency.linearRampToValueAtTime(1100, t + 0.3);
  o.frequency.linearRampToValueAtTime(700, t + 0.6);
  o.frequency.linearRampToValueAtTime(1100, t + 0.9);
  o.connect(g);
  o.start(t);
  o.stop(t + 1);
}

export function playCelebration(volume = 0.6) {
  if (volume <= 0) return;
  const c = ac();
  // Bright ascending C-major arpeggio with sine + triangle layers
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
  notes.forEach((freq, i) => {
    ([
      { type: "triangle" as OscillatorType, gain: 0.22 },
      { type: "sine" as OscillatorType, gain: 0.14 },
    ]).forEach((layer) => {
      const o = c.createOscillator();
      const g = gainOf(0);
      o.type = layer.type;
      o.frequency.value = freq;
      const t = c.currentTime + i * 0.1;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(volume * layer.gain, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      o.connect(g);
      o.start(t);
      o.stop(t + 0.65);
    });
  });
}

export function playApplause(volume = 0.5) {
  if (volume <= 0) return;
  const c = ac();
  const buffer = c.createBuffer(1, c.sampleRate * 1.5, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    const env = Math.min(1, i / 4000) * Math.max(0, 1 - i / data.length);
    data[i] = (Math.random() * 2 - 1) * env * 0.6;
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const g = gainOf(volume * 0.6);
  src.connect(g);
  src.start();
}

/* --------- Custom music (user-uploaded) --------- */
let musicEl: HTMLAudioElement | null = null;
let musicUrl: string | null = null;
const musicListeners = new Set<(playing: boolean) => void>();

function emitMusic(playing: boolean) {
  musicListeners.forEach((cb) => {
    try {
      cb(playing);
    } catch {
      /* ignore */
    }
  });
}

export function subscribeMusic(cb: (playing: boolean) => void) {
  musicListeners.add(cb);
  return () => musicListeners.delete(cb);
}

export function isMusicPlaying() {
  return !!musicEl && !musicEl.paused;
}

function ensureMusicEl(url: string, volume: number, loop: boolean) {
  if (!musicEl || musicUrl !== url) {
    if (musicEl) {
      try {
        musicEl.pause();
      } catch {
        /* ignore */
      }
    }
    musicEl = new Audio(url);
    musicUrl = url;
    musicEl.addEventListener("ended", () => emitMusic(false));
    musicEl.addEventListener("pause", () => emitMusic(false));
    musicEl.addEventListener("play", () => emitMusic(true));
  }
  musicEl.loop = loop;
  musicEl.volume = Math.max(0, Math.min(1, volume));
  return musicEl;
}

export function playCustomMusic(url: string, volume = 0.6, loop = true) {
  try {
    const el = ensureMusicEl(url, volume, loop);
    void el.play().catch(() => {});
  } catch {
    /* ignore */
  }
}

export function pauseCustomMusic() {
  if (musicEl) {
    try {
      musicEl.pause();
    } catch {
      /* ignore */
    }
  }
}

export function toggleCustomMusic(url: string, volume = 0.6, loop = true) {
  if (isMusicPlaying()) {
    pauseCustomMusic();
  } else {
    playCustomMusic(url, volume, loop);
  }
}

export function setCustomMusicVolume(volume: number) {
  if (musicEl) musicEl.volume = Math.max(0, Math.min(1, volume));
}

export function stopCustomMusic() {
  if (musicEl) {
    try {
      musicEl.pause();
      musicEl.currentTime = 0;
    } catch {
      /* ignore */
    }
    musicEl = null;
    musicUrl = null;
    emitMusic(false);
  }
}

export function fadeOutCustomMusic(ms = 600) {
  if (!musicEl) return;
  const el = musicEl;
  const start = el.volume;
  const steps = 12;
  let i = 0;
  const iv = window.setInterval(() => {
    i++;
    el.volume = Math.max(0, start * (1 - i / steps));
    if (i >= steps) {
      clearInterval(iv);
      try {
        el.pause();
      } catch {
        /* ignore */
      }
      if (musicEl === el) {
        musicEl = null;
        musicUrl = null;
      }
      emitMusic(false);
    }
  }, ms / steps);
}
