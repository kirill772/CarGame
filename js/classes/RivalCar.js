// RivalCar.js
// Соперник для карьеры: простая AI-логика по смене полос и поддержанию скорости.

import { COLORS, RIVALS } from "../constants.js";
import { clamp, rand, pick } from "../utils.js";

export class RivalCar {
  constructor(index = 0) {
    this.index = index;
    this.name = `Rival ${index + 1}`;
    this.x = 0;
    this.z = 0;
    this.speed = 720;
    this.w = 58;
    this.h = 118;

    this.color0 = pick(["#141a2f", "#1a1230", "#102132", "#1d1e2f"]);
    this.neon = pick([COLORS.neonCyan, COLORS.neonMagenta, COLORS.neonLime]);

    this.targetLaneX = 0;
    this._think = rand(0, 1);
    this.finished = false;
    this.lap = 0;
    this.progressZ = 0;
  }

  resetForRace({ startX, startZ, baseSpeed }) {
    this.x = startX;
    this.z = startZ;
    this.speed = baseSpeed;
    this.targetLaneX = startX;
    this._think = rand(0, 1);
    this.finished = false;
    this.lap = 0;
    this.progressZ = 0;
  }

  updateAI(dt, { track, laneXs, obstacles }) {
    if (this.finished) return;

    this._think -= dt;
    if (this._think <= 0) {
      this._think = 0.25 + Math.random() * (1 / RIVALS.aiLaneChangeRate);

      let best = 0;
      let bestScore = -1e9;
      for (let i = 0; i < laneXs.length; i++) {
        const x = laneXs[i];
        const score = this._scoreLane(x, obstacles);
        if (score > bestScore) {
          bestScore = score;
          best = i;
        }
      }
      this.targetLaneX = laneXs[best];
    }

    const k = 5.5;
    this.x += (this.targetLaneX - this.x) * clamp(dt * k, 0, 1);

    const curve = track.sampleCurve(this.z);
    const curvePenalty = 1 - Math.abs(curve) * 0.06;
    this.speed = clamp(this.speed * (0.998 + Math.sin((this.index + performance.now() * 0.001) * 1.7) * 0.0007), 560, 980) * curvePenalty;
  }

  _scoreLane(x, obstacles) {
    let nearest = 999999;
    for (const o of obstacles) {
      if (!o?.active) continue;
      const dx = Math.abs(o.x - x);
      if (dx > 70) continue;
      const dz = o.z - this.z;
      if (dz > 0 && dz < nearest) nearest = dz;
    }
    return nearest;
  }

  render(ctx, toScreenFn, cameraZ) {
    const p = toScreenFn(this.x, this.z, cameraZ);
    if (!p.visible) return;

    const w = this.w * p.scale;
    const h = this.h * p.scale;

    ctx.save();
    ctx.translate(p.x, p.y);

    ctx.fillStyle = this.color0;
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = Math.max(1, 2 * p.scale);
    roundRect(ctx, -w / 2, -h / 2, w, h, 12 * p.scale);
    ctx.fill();
    ctx.stroke();

    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = this.neon;
    ctx.lineWidth = Math.max(1, 3.0 * p.scale);

    ctx.beginPath();
    ctx.moveTo(-w * 0.22, -h * 0.35);
    ctx.lineTo(w * 0.22, -h * 0.35);
    ctx.moveTo(-w * 0.22, h * 0.35);
    ctx.lineTo(w * 0.22, h * 0.35);
    ctx.stroke();

    ctx.restore();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
