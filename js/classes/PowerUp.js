// PowerUp.js
// Пауэр-ап на дороге: нитро/щит/ремонт/слоумо/магнит.

import { POWERUPS } from "../constants.js";
import { pick, rand } from "../utils.js";

export class PowerUp {
  constructor() {
    this.active = false;
    this.id = "nitro";
    this.color = "#00e5ff";
    this.x = 0;
    this.z = 0;
    this.radius = 20;
    this.life = 0;
    this.lifeMax = POWERUPS.lifeTime;
    this.spin = 0;
  }

  spawn({ x, z, typeId = null }) {
    const t = typeId ? POWERUPS.types.find(p => p.id === typeId) : pick(POWERUPS.types);
    this.active = true;
    this.id = t?.id ?? "nitro";
    this.color = t?.color ?? "#00e5ff";
    this.x = x;
    this.z = z;
    this.life = 0;
    this.lifeMax = POWERUPS.lifeTime;
    this.spin = rand(0, Math.PI * 2);
  }

  update(dt) {
    if (!this.active) return;
    this.life += dt;
    this.spin += dt * 2.3;
    if (this.life >= this.lifeMax) this.active = false;
  }

  render(ctx, toScreenFn, cameraZ) {
    if (!this.active) return;
    const p = toScreenFn(this.x, this.z, cameraZ);
    if (!p.visible) return;

    const pulse = 0.55 + 0.45 * Math.sin(this.spin * 2.0);
    const r = p.scale * (this.radius * (0.85 + pulse * 0.35));

    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    ctx.fillStyle = `rgba(255,255,255,${0.04 * pulse})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 2.4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = this.color;
    ctx.lineWidth = Math.max(1.5, 3.5 * p.scale);
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.translate(p.x, p.y);
    ctx.rotate(this.spin);
    ctx.strokeStyle = "rgba(255,255,255,0.75)";
    ctx.lineWidth = Math.max(1, 2.2 * p.scale);
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, 0);
    ctx.lineTo(r * 0.55, 0);
    ctx.moveTo(0, -r * 0.55);
    ctx.lineTo(0, r * 0.55);
    ctx.stroke();

    ctx.restore();
  }
}
