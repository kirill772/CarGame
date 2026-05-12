// Speedometer.js
// Аналоговый спидометр со стрелкой и цифровой индикацией

import { CANVAS_H, CANVAS_W } from "../constants.js";
import { lerp, clamp } from "../utils.js";

export class Speedometer {
  constructor() {
    this.x = CANVAS_W * 0.5;
    this.y = CANVAS_H * 0.92;
    this.radius = 68;
    this.targetSpeed = 0;
    this.currentSpeed = 0;
    this.maxSpeed = 220; // км/ч
    this.nitroAlpha = 0;
    // коэффициент перевода из px/с в км/ч
    this.kmhFactor = 0.082; // 1 px/s ≈ 0.082 km/h ≈ 80 km/h at 980 px/s
  }

  update(dt, speed, maxSpeed, nitro) {
    this.maxSpeed = Math.round(maxSpeed * this.kmhFactor);
    this.targetSpeed = speed * this.kmhFactor;
    // плавная стрелка
    this.currentSpeed = lerp(this.currentSpeed, this.targetSpeed, dt * 6);
    // пульсация нитро
    if (nitro > 0) {
      this.nitroAlpha = Math.min(1, this.nitroAlpha + dt * 8);
    } else {
      this.nitroAlpha = Math.max(0, this.nitroAlpha - dt * 5);
    }
  }

  render(ctx) {
    // Позиция динамическая — центр-низ актуального canvas
    const cw = ctx.canvas.width;
    const ch = ctx.canvas.height;
    ctx.save();
    ctx.translate(cw * 0.5, ch - 75);

    // тень
    ctx.shadowColor = "rgba(0,0,0,0.4)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    // внешний круг
    ctx.fillStyle = "rgba(8,12,28,0.92)";
    ctx.strokeStyle = "rgba(0,229,255,0.18)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    // внутренняя тень
    const grad = ctx.createRadialGradient(0, -20, 0, 0, 0, this.radius * 0.9);
    grad.addColorStop(0, "rgba(0,229,255,0.03)");
    grad.addColorStop(1, "rgba(0,0,0,0.2)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.9, 0, Math.PI * 2);
    ctx.fill();

    // разметка: цифры и риски
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let k = 0; k <= 8; k++) {
      const angle = Math.PI + (k / 8) * Math.PI;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const inner = this.radius * 0.78;
      const outer = this.radius * 0.88;
      const num = Math.round((k / 8) * this.maxSpeed);

      // риски
      ctx.strokeStyle = k % 2 === 0 ? "rgba(0,229,255,0.6)" : "rgba(0,229,255,0.25)";
      ctx.lineWidth = k % 2 === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(cos * inner, sin * inner);
      ctx.lineTo(cos * outer, sin * outer);
      ctx.stroke();

      // цифры
      if (k % 2 === 0) {
        ctx.fillStyle = "rgba(0,229,255,0.9)";
        const tx = cos * (this.radius * 0.62);
        const ty = sin * (this.radius * 0.62);
        ctx.fillText(num, tx, ty);
      }
    }

    // нитро-подсветка (если активно)
    if (this.nitroAlpha > 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = `rgba(255,100,0,${this.nitroAlpha * 0.6})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius * 0.92, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // стрелка
    const speedRatio = clamp(this.currentSpeed / this.maxSpeed, 0, 1);
    const needleAngle = Math.PI + speedRatio * Math.PI;
    const needleLength = this.radius * 0.68;
    const needleX = Math.cos(needleAngle) * needleLength;
    const needleY = Math.sin(needleAngle) * needleLength;

    ctx.save();
    ctx.shadowColor = "rgba(255,100,0,0.8)";
    ctx.shadowBlur = 8 + this.nitroAlpha * 12;
    ctx.strokeStyle = this.nitroAlpha > 0 ? `rgba(255,120,0,${0.8 + this.nitroAlpha * 0.2})` : "rgba(255,255,255,0.9)";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(needleX, needleY);
    ctx.stroke();
    ctx.restore();

    // центральная гайка
    ctx.fillStyle = "rgba(0,229,255,0.9)";
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();

    // цифровой спидометр
    ctx.fillStyle = "rgba(0,229,255,0.92)";
    ctx.font = "bold 18px monospace";
    ctx.textAlign = "center";
    ctx.fillText(Math.round(this.currentSpeed), 0, this.radius * 0.38);

    // единицы
    ctx.font = "11px monospace";
    ctx.fillStyle = "rgba(0,229,255,0.6)";
    ctx.fillText("км/ч", 0, this.radius * 0.52);

    ctx.restore();
  }
}
