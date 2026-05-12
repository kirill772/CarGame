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
    this.neon   = neon   ?? (Math.random() < 0.5 ? COLORS.neonCyan : COLORS.neonMagenta);
    this._blink = rand(0, 1000);

    // назначаем случайный skin и carId для renderCar3D
    const trafficColors = ["#1a2040","#20102a","#101830","#0e1a28","#1a1010","#181a10"];
    this.skin  = this.neon;
    this.carId = null; // трафик использует generic стиль
    this.color0 = color0 ?? pick(trafficColors);
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

    // Используем renderCar3D с skin машины трафика (едет вниз = facing down)
    renderCar3D(ctx, 0, 0, this.carId, this.skin, 1.0, "down");

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
