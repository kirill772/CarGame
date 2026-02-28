// TrafficCar.js
// Машина трафика. Используется пул объектов.

import { TRAFFIC, COLORS } from "../constants.js";
import { renderCar3D } from "../managers/GameCar3D.js";
import { rand, pick } from "../utils.js";

export class TrafficCar {
  constructor() {
    this.active = false;
    this.reset();
  }

  reset() {
    this.active = false;
    this.x = 0;
    this.z = 0;
    this.speed = 600;
    this.w = 56;
    this.h = 110;

    this.color0 = "#1b1f34";
    this.neon = COLORS.neonCyan;

    this._blink = rand(0, 1000);
  }

  spawn({ x, z, speed, color0, neon }) {
    this.active = true;
    this.x = x;
    this.z = z;
    this.speed = speed;
    this.color0 = color0 ?? pick(["#141a2f", "#1a1230", "#102132", "#1d1e2f"]);
    this.neon = neon ?? (Math.random() < 0.5 ? COLORS.neonCyan : COLORS.neonMagenta);
    this._blink = rand(0, 1000);
  }

  update(dt) {
    if (!this.active) return;
    this._blink += dt;
  }

  render(ctx, toScreenFn, cameraZ) {
    if (!this.active) return;

    const screen = toScreenFn(this.x, this.z, cameraZ);
    if (!screen.visible) return;

    ctx.save();
    ctx.translate(screen.x, screen.y);
    ctx.scale(screen.scale, screen.scale);

    // 3D-машина трафика
    renderCar3D(ctx, 0, 0, this.carId, this.skin, 1.2);

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
