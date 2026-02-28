// PlayerCar.js
// Игрок: физика (инерция, дрифт), нитро, здоровье, щит.

import { PLAYER } from "../constants.js";
import { clamp, lerp, approach } from "../utils.js";
import { renderCar3D } from "../managers/GameCar3D.js";

export class PlayerCar {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = 0;
    this.z = 0;

    this.vx = 0;
    this.speed = 0;

    this.health = PLAYER.healthMax;
    this.nitro = PLAYER.nitroMax;

    this.shieldTime = 0;
    this.magnetTime = 0;
    this.slowmoTime = 0;

    this.noCrashTime = 0;

    this.skin = "#00e5ff";
    this.body = "#12162a";
    this.stripe = "#ffffff";

    this._driftHeat = 0;
    this._engineRpm = 0;
  }

  applyCarConfig({ baseStats, upgradesMult, skin, carData }) {
    this.skin = skin;
    // кастомные цвета и полоска из CarsData
    if (carData) {
      this.body = carData.color || "#12162a";
      this.stripe = carData.stripe || "#ffffff";
    }

    const s = baseStats;
    this.maxSpeed = PLAYER.baseMaxSpeed * (0.60 + (s.maxSpeed / 10) * 0.90) * upgradesMult.maxSpeed;
    this.accel = PLAYER.baseAcceleration * (0.55 + (s.acceleration / 10) * 0.95) * upgradesMult.acceleration;
    this.handling = PLAYER.baseHandling * (0.55 + (s.handling / 10) * 0.90) * upgradesMult.handling;
    this.nitroPower = PLAYER.baseNitro * (0.65 + (s.nitroPower / 10) * 0.85) * upgradesMult.nitroPower;
    this.durability = PLAYER.baseDurability * (0.70 + (s.durability / 10) * 0.70) * upgradesMult.durability;
  }

  update(dt, input, trackCurve) {
    if (this.shieldTime > 0) this.shieldTime -= dt;
    if (this.magnetTime > 0) this.magnetTime -= dt;
    if (this.slowmoTime > 0) this.slowmoTime -= dt;

    const throttle = input.throttle;
    const brake = input.brake;

    const targetAccel = throttle * this.accel - brake * (this.accel * 0.78);
    this.speed += targetAccel * dt;

    const nitroActive = input.nitro && this.nitro > 1;
    if (nitroActive) {
      const boost = (1.0 + this.nitroPower * 0.55);
      this.speed += this.accel * 0.55 * boost * dt;
      this.nitro = Math.max(0, this.nitro - 36 * dt);
      input._nitroSeconds += dt;
    } else {
      this.nitro = Math.min(PLAYER.nitroMax, this.nitro + 10 * dt * (1 + (input.perks?.nitroRegen ?? 0) * 0.08));
    }

    const maxV = this.maxSpeed * (nitroActive ? 1.18 : 1.0);
    this.speed = clamp(this.speed, 0, maxV);
    this.speed *= Math.pow(PLAYER.drag, dt * 60);

    const steer = input.steer;
    const curveInfluence = -trackCurve * 0.9;
    const steerPower = this.handling * (0.88 + (this.speed / (this.maxSpeed + 1)) * 0.48);
    const desiredVx = (steer + curveInfluence) * 780 * steerPower;

    const drift = input.drift && this.speed > this.maxSpeed * 0.45;
    const grip = drift ? PLAYER.driftGrip : 1.0;

    this.vx = lerp(this.vx, desiredVx, clamp(dt * 6.8, 0, 1));
    this.vx *= Math.pow(PLAYER.lateralFriction, dt * 55) * (0.84 + 0.16 * grip);

    this.x += this.vx * dt;

    const norm = this.maxSpeed > 0 ? this.speed / this.maxSpeed : 0;
    this._engineRpm = lerp(this._engineRpm, norm, clamp(dt * 6.5, 0, 1));

    if (drift) this._driftHeat = approach(this._driftHeat, 1, dt * 1.8);
    else this._driftHeat = approach(this._driftHeat, 0, dt * 1.4);

    this.noCrashTime += dt;
  }

  crash(intensity = 1) {
    if (this.shieldTime > 0) {
      this.speed *= 0.92;
      this.noCrashTime = 0;
      return { hpLoss: 0, shielded: true };
    }

    const hpLoss = (PLAYER.crashHpLoss * intensity) / Math.max(0.6, this.durability);
    this.health = Math.max(0, this.health - hpLoss);

    this.speed *= (1 - (1 - PLAYER.crashSpeedLoss) * intensity);
    this.vx *= -PLAYER.bounce;

    this.noCrashTime = 0;
    return { hpLoss, shielded: false };
  }

  render(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // тень
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;

    // 3D-отрисовка машины
    renderCar3D(ctx, 0, 0, this.carId, this.skin, 1.8);

    // щит
    if (this.shieldTime > 0) {
      ctx.strokeStyle = `rgba(0,229,255,${0.3 + Math.sin(Date.now() * 0.008) * 0.2})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 55, 0, Math.PI * 2);
      ctx.stroke();
    }

    // эффект повреждения
    if (this.health < PLAYER.healthMax * 0.4) {
      ctx.fillStyle = `rgba(255,0,0,${0.12 + Math.sin(Date.now() * 0.012) * 0.08})`;
      ctx.beginPath();
      ctx.arc(0, 0, 50, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  get driftHeat() {
    return this._driftHeat;
  }

  get engineRpm() {
    return this._engineRpm;
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
