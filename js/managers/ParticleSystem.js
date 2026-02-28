// ParticleSystem.js
// Пул частиц: дым, искры, неоновые следы, взрывы, дождь.

import { Particle } from "../classes/Particle.js";
import { rand, pick } from "../utils.js";

export class ParticleSystem {
  constructor(maxParticles = 800) {
    this.pool = [];
    for (let i = 0; i < maxParticles; i++) this.pool.push(new Particle());
  }

  _alloc() {
    for (let i = 0; i < this.pool.length; i++) {
      const p = this.pool[i];
      if (!p.active) return p;
    }
    return null;
  }

  update(dt) {
    for (const p of this.pool) if (p.active) p.update(dt);
  }

  render(ctx) {
    for (const p of this.pool) if (p.active) p.render(ctx);
  }

  emitDriftSmoke(x, y, intensity = 1, skin = "#00e5ff") {
    const count = Math.floor(2 + intensity * 5);
    for (let i = 0; i < count; i++) {
      const p = this._alloc();
      if (!p) return;
      p.spawn({
        x: x + rand(-16, 16),
        y: y + rand(22, 38),
        vx: rand(-60, 60),
        vy: rand(40, 140),
        life: rand(0.30, 0.60),
        size0: rand(3, 6),
        size1: rand(12, 22),
        color: pick([skin, "#ffffff", "#b3c9ff"]),
        alpha0: rand(0.10, 0.22),
        alpha1: 0,
        additive: true,
      });
    }
  }

  emitSparks(x, y, intensity = 1) {
    const count = Math.floor(4 + intensity * 10);
    for (let i = 0; i < count; i++) {
      const p = this._alloc();
      if (!p) return;
      p.spawn({
        x: x + rand(-10, 10),
        y: y + rand(-10, 10),
        vx: rand(-260, 260),
        vy: rand(-260, 40),
        life: rand(0.18, 0.38),
        size0: rand(1.2, 2.6),
        size1: rand(0.8, 1.6),
        color: pick(["#ffd000", "#ff2bd6", "#00e5ff", "#ffffff"]),
        alpha0: rand(0.55, 0.9),
        alpha1: 0,
        additive: true,
      });
    }
  }

  emitNeonTrail(x, y, color, intensity = 1) {
    const count = Math.floor(1 + intensity * 2);
    for (let i = 0; i < count; i++) {
      const p = this._alloc();
      if (!p) return;
      p.spawn({
        x: x + rand(-12, 12),
        y: y + rand(30, 44),
        vx: rand(-20, 20),
        vy: rand(110, 230),
        life: rand(0.20, 0.32),
        size0: rand(3, 4.5),
        size1: rand(9, 14),
        color,
        alpha0: rand(0.10, 0.20),
        alpha1: 0,
        additive: true,
      });
    }
  }

  emitExplosion(x, y, color = "#ff2bd6") {
    for (let i = 0; i < 60; i++) {
      const p = this._alloc();
      if (!p) return;
      p.spawn({
        x: x + rand(-12, 12),
        y: y + rand(-12, 12),
        vx: rand(-420, 420),
        vy: rand(-420, 420),
        life: rand(0.35, 0.80),
        size0: rand(2, 6),
        size1: rand(10, 28),
        color: pick([color, "#ffd000", "#00e5ff", "#ffffff"]),
        alpha0: rand(0.25, 0.6),
        alpha1: 0,
        additive: true,
      });
    }
  }

  emitRain(width, height, intensity = 1) {
    const count = Math.floor(8 + intensity * 18);
    for (let i = 0; i < count; i++) {
      const p = this._alloc();
      if (!p) return;
      p.spawn({
        x: rand(0, width),
        y: rand(-40, 0),
        vx: rand(-25, 25),
        vy: rand(520, 860),
        life: rand(0.55, 0.85),
        size0: rand(1.2, 2.0),
        size1: rand(1.0, 1.8),
        color: "#b3c9ff",
        alpha0: rand(0.07, 0.12),
        alpha1: 0,
        additive: false,
      });
    }
  }
}
