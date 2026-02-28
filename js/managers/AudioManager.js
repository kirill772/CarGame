// AudioManager.js
// Web Audio API: простые осцилляторы для двигателя/дрифта/нитро/взрывов.

import { clamp } from "../utils.js";

export class AudioManager {
  constructor(getSettingsFn) {
    this.getSettings = getSettingsFn;

    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;

    this._engineOsc = null;
    this._engineGain = null;

    this._noiseNode = null;
    this._noiseGain = null;

    // Внешние звуки (опционально): если пользователь положит файлы в assets/, мы будем их проигрывать.
    // Важно: при открытии index.html напрямую браузер может блокировать fetch, поэтому используем <audio>.
    this.files = {
      crash: this._makeAudio("./assets/sfx/crash.wav"),
      nitro: this._makeAudio("./assets/sfx/nitro.wav"),
      click: this._makeAudio("./assets/sfx/click.wav"),
    };

    this._started = false;
  }

  async start() {
    if (this._started) return;
    this._started = true;

    const Ctx = window.AudioContext || window.webkitAudioContext;
    this.ctx = new Ctx();

    this.master = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.sfxGain = this.ctx.createGain();

    this.musicGain.connect(this.master);
    this.sfxGain.connect(this.master);
    this.master.connect(this.ctx.destination);

    this._applyGains();

    this._engineOsc = this.ctx.createOscillator();
    this._engineOsc.type = "sawtooth";
    this._engineGain = this.ctx.createGain();
    this._engineGain.gain.value = 0.0;

    const engineFilter = this.ctx.createBiquadFilter();
    engineFilter.type = "lowpass";
    engineFilter.frequency.value = 1000;

    this._engineOsc.connect(engineFilter);
    engineFilter.connect(this._engineGain);
    this._engineGain.connect(this.sfxGain);
    this._engineOsc.start();

    this._noiseNode = this._makeNoise();
    this._noiseGain = this.ctx.createGain();
    this._noiseGain.gain.value = 0.0;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = "highpass";
    noiseFilter.frequency.value = 300;

    this._noiseNode.connect(noiseFilter);
    noiseFilter.connect(this._noiseGain);
    this._noiseGain.connect(this.sfxGain);
  }

  _applyGains() {
    const s = this.getSettings();
    if (!s || !this.master) return;

    this.master.gain.value = clamp(s.master ?? 0.8, 0, 1);
    this.musicGain.gain.value = clamp(s.music ?? 0.3, 0, 1);
    this.sfxGain.gain.value = clamp(s.sfx ?? 0.8, 0, 1);
  }

  syncSettings() {
    this._applyGains();
  }

  resumeIfSuspended() {
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  updateEngine(rpm01, speed01, nitro, paused) {
    if (!this.ctx || !this._engineOsc) return;
    const s = this.getSettings();
    const master = clamp(s.master ?? 1, 0, 1);
    const sfx = clamp(s.sfx ?? 1, 0, 1);
    const vol = (paused ? 0 : 1) * master * sfx;

    const base = 70;
    const freq = base + rpm01 * 380 + speed01 * 120 + (nitro ? 60 : 0);
    this._engineOsc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.02);

    const gain = 0.02 + rpm01 * 0.085 + (nitro ? 0.03 : 0);
    this._engineGain.gain.setTargetAtTime(gain * vol, this.ctx.currentTime, 0.03);
  }

  updateDrift(driftAmount01, paused) {
    if (!this.ctx || !this._noiseGain) return;
    const s = this.getSettings();
    const master = clamp(s.master ?? 1, 0, 1);
    const sfx = clamp(s.sfx ?? 1, 0, 1);
    const vol = (paused ? 0 : 1) * master * sfx;

    const g = clamp(driftAmount01, 0, 1) * 0.22;
    this._noiseGain.gain.setTargetAtTime(g * vol, this.ctx.currentTime, 0.02);
  }

  playBeep(type = "ok") {
    if (!this.ctx) return;

    if (type === "bad") this.files.crash?.play?.().catch?.(() => {});
    else this.files.click?.play?.().catch?.(() => {});

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "square";

    const f = type === "bad" ? 160 : 520;
    osc.frequency.value = f;

    gain.gain.value = 0.0001;
    gain.gain.exponentialRampToValueAtTime(0.15, this.ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.18);
  }

  playExplosion() {
    if (!this.ctx) return;

    this.files.crash?.play?.().catch?.(() => {});

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.25);

    gain.gain.value = 0.001;
    gain.gain.exponentialRampToValueAtTime(0.35, this.ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.33);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  _makeNoise() {
    const bufferSize = 2 * this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const node = this.ctx.createBufferSource();
    node.buffer = buffer;
    node.loop = true;
    node.start(0);
    return node;
  }

  playNitro() {
    this.files.nitro?.play?.().catch?.(() => {});
  }

  _makeAudio(src) {
    try {
      const a = new Audio();
      a.src = src;
      a.preload = "auto";
      a.volume = 0.9;
      return a;
    } catch {
      return null;
    }
  }
}
