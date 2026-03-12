import { useEffect, useRef, useCallback, RefObject } from 'react';
import { EffectsOverlayHandle, EffectType } from '@/components/effects-overlay';

const KEY_MAP: Record<string, EffectType> = {
  w: 'coins',   W: 'coins',
  a: 'lightning', A: 'lightning',
  s: 'confetti',  S: 'confetti',
  d: 'fire',    D: 'fire',
};

function getCtx(ref: RefObject<AudioContext | null>): AudioContext {
  if (!ref.current || ref.current.state === 'closed') {
    ref.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  if (ref.current.state === 'suspended') ref.current.resume();
  return ref.current;
}

function playSlotMachine(actx: AudioContext) {
  const now = actx.currentTime;
  const master = actx.createGain();
  master.gain.value = 0.5;
  master.connect(actx.destination);

  for (let i = 0; i < 28; i++) {
    const osc = actx.createOscillator();
    const g = actx.createGain();
    osc.connect(g); g.connect(master);
    osc.type = 'square';
    osc.frequency.value = 150 + Math.random() * 600;
    const t = now + i * 0.045;
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
    osc.start(t); osc.stop(t + 0.04);
  }

  const fanfare = [523.25, 659.25, 783.99, 1046.5];
  fanfare.forEach((freq, i) => {
    const osc = actx.createOscillator();
    const g = actx.createGain();
    osc.connect(g); g.connect(master);
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const t = now + 1.3 + i * 0.14;
    g.gain.setValueAtTime(0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc.start(t); osc.stop(t + 0.4);
  });

  const osc2 = actx.createOscillator();
  const g2 = actx.createGain();
  osc2.connect(g2); g2.connect(master);
  osc2.type = 'sawtooth';
  osc2.frequency.setValueAtTime(200, now + 1.3);
  osc2.frequency.linearRampToValueAtTime(600, now + 1.9);
  g2.gain.setValueAtTime(0.25, now + 1.3);
  g2.gain.exponentialRampToValueAtTime(0.001, now + 2.1);
  osc2.start(now + 1.3); osc2.stop(now + 2.2);
}

function playZap(actx: AudioContext) {
  const now = actx.currentTime;
  const bufSize = actx.sampleRate * 0.15;
  const buf = actx.createBuffer(1, bufSize, actx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1);

  const src = actx.createBufferSource();
  src.buffer = buf;

  const filter = actx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(3000, now);
  filter.frequency.exponentialRampToValueAtTime(200, now + 0.15);
  filter.Q.value = 2;

  const g = actx.createGain();
  g.gain.setValueAtTime(0.7, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

  src.connect(filter); filter.connect(g); g.connect(actx.destination);
  src.start(now); src.stop(now + 0.16);

  const osc = actx.createOscillator();
  const og = actx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(800, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);
  og.gain.setValueAtTime(0.3, now);
  og.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  osc.connect(og); og.connect(actx.destination);
  osc.start(now); osc.stop(now + 0.13);
}

function playPop(actx: AudioContext) {
  const now = actx.currentTime;
  const notes = [523, 659, 784, 880, 1047, 1319];
  notes.forEach((freq, i) => {
    const osc = actx.createOscillator();
    const g = actx.createGain();
    osc.type = i % 2 === 0 ? 'triangle' : 'sine';
    osc.frequency.value = freq;
    const t = now + i * 0.07;
    g.gain.setValueAtTime(0.35, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(g); g.connect(actx.destination);
    osc.start(t); osc.stop(t + 0.2);
  });

  const bufSize = actx.sampleRate * 0.08;
  const buf = actx.createBuffer(1, bufSize, actx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = actx.createBufferSource();
  src.buffer = buf;
  const filter = actx.createBiquadFilter();
  filter.type = 'highpass'; filter.frequency.value = 4000;
  const g = actx.createGain();
  g.gain.setValueAtTime(0.3, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  src.connect(filter); filter.connect(g); g.connect(actx.destination);
  src.start(now); src.stop(now + 0.09);
}

function playCrackle(actx: AudioContext) {
  const now = actx.currentTime;

  for (let i = 0; i < 12; i++) {
    const bufSize = actx.sampleRate * 0.04;
    const buf = actx.createBuffer(1, bufSize, actx.sampleRate);
    const data = buf.getChannelData(0);
    for (let j = 0; j < bufSize; j++) data[j] = Math.random() * 2 - 1;
    const src = actx.createBufferSource();
    src.buffer = buf;

    const filter = actx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800 + Math.random() * 1200;

    const g = actx.createGain();
    const t = now + i * 0.06 + Math.random() * 0.03;
    g.gain.setValueAtTime(0.25 + Math.random() * 0.2, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    src.connect(filter); filter.connect(g); g.connect(actx.destination);
    src.start(t); src.stop(t + 0.045);
  }

  const osc = actx.createOscillator();
  const og = actx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(60, now);
  osc.frequency.exponentialRampToValueAtTime(40, now + 0.6);
  og.gain.setValueAtTime(0.3, now);
  og.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  osc.connect(og); og.connect(actx.destination);
  osc.start(now); osc.stop(now + 0.65);
}

const SOUND_MAP = {
  coins:     playSlotMachine,
  lightning: playZap,
  confetti:  playPop,
  fire:      playCrackle,
};

export function useKeyEffects(overlayRef: RefObject<EffectsOverlayHandle | null>) {
  const audioCtx = useRef<AudioContext | null>(null);

  const handleKey = useCallback((e: KeyboardEvent) => {
    const type = KEY_MAP[e.key];
    if (!type || e.repeat) return;
    overlayRef.current?.triggerEffect(type);
    const ctx = getCtx(audioCtx);
    SOUND_MAP[type](ctx);
  }, [overlayRef]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);
}
