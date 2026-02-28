// Particle.js
// Частица для дыма/искр/неоновых следов/взрывов/дождя.

import { clamp, colorWithAlpha, lerp } from "../utils.js";

export class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 0;
    this.lifeMax = 0;
    this.size0 = 1;
    this.size1 = 1;
    this.color = "#ffffff";
    this.alpha0 = 1;
    this.alpha1 = 0;
    this.additive = true;
  }

  spawn(opts) {
    this.active = true;
    this.x = opts.x ?? 0;
    this.y = opts.y ?? 0;
    this.vx = opts.vx ?? 0;
    this.vy = opts.vy ?? 0;
    this.life = 0;
    this.lifeMax = Math.max(0.01, opts.life ?? 0.5);
    this.size0 = opts.size0 ?? 2;
    this.size1 = opts.size1 ?? 10;
    this.color = opts.color ?? "#00e5ff";
    this.alpha0 = opts.alpha0 ?? 0.9;
    this.alpha1 = opts.alpha1 ?? 0;
    this.additive = opts.additive ?? true;
  }

  update(dt) {
    if (!this.active) return;

    this.life += dt;
    if (this.life >= this.lifeMax) {
      this.active = false;
      return;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.vy += 60 * dt;
    this.vx *= 0.985;
    this.vy *= 0.985;
  }

  render(ctx) {
    if (!this.active) return;

    const t = clamp(this.life / this.lifeMax, 0, 1);
    const size = lerp(this.size0, this.size1, t);
    const alpha = lerp(this.alpha0, this.alpha1, t);

    ctx.save();
    ctx.globalCompositeOperation = this.additive ? "lighter" : "source-over";
    ctx.fillStyle = colorWithAlpha(this.color, alpha);
    ctx.beginPath();
    ctx.arc(this.x, this.y, size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
