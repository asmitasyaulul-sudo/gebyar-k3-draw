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
  const o = c.createOscillator();
  const g = gainOf(volume * 0.25);
  o.type = "square";
  o.frequency.setValueAtTime(880, c.currentTime);
  o.frequency.exponentialRampToValueAtTime(220, c.currentTime + 0.08);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
  o.connect(g);
  o.start();
  o.stop(c.currentTime + 0.1);
}

export function playSpin(durationMs: number, volume = 0.5): () => void {
  if (volume <= 0) return () => {};
  const c = ac();
  const o = c.createOscillator();
  const g = gainOf(volume * 0.15);
  o.type = "sawtooth";
  o.frequency.setValueAtTime(120, c.currentTime);
  o.frequency.linearRampToValueAtTime(420, c.currentTime + durationMs / 1000);
  o.connect(g);
  o.start();
  const stop = () => {
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.2);
    o.stop(c.currentTime + 0.25);
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
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, i) => {
    const o = c.createOscillator();
    const g = gainOf(volume * 0.2);
    o.type = "triangle";
    o.frequency.value = freq;
    const t = c.currentTime + i * 0.12;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(volume * 0.2, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.55);
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
