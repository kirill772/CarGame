// GameCar3D.js
// Красивые процедурные машины на трассе (Canvas 2D, высокая детализация).

import { CarsData } from "../data/CarsData.js";

// ─── кэш стилей машин ────────────────────────────────────────────────────────
const _styleCache = new Map();

function getCarStyle(carId) {
  if (_styleCache.has(carId)) return _styleCache.get(carId);
  const car = CarsData.find(c => c.id === carId);
  const style = {
    body:   parseHexSafe(car?.color,  "#1a2040"),
    stripe: parseHexSafe(car?.stripe, "#ffffff"),
    neon:   "#00e5ff",
  };
  _styleCache.set(carId, style);
  return style;
}

function parseHexSafe(hex, fallback) {
  if (!hex || typeof hex !== "string") return fallback;
  const h = hex.trim();
  return /^#[0-9a-fA-F]{6}$/.test(h) ? h : fallback;
}

// ─── главная функция рендера ──────────────────────────────────────────────────

/**
 * Рисует машину на 2D-канвасе в точке (x,y) с масштабом scale.
 * carId  — id из CarsData
 * skin   — неоновый цвет (override)
 * scale  — масштаб (1 = базовый размер, применяется уже снаружи через ctx.scale)
 * facing — "up" | "down" (down = трафик, up = игрок/соперник)
 */
export function renderCar3D(ctx, x, y, carId, skin, scale = 1, facing = "up") {
  const s = getCarStyle(carId);
  const neon = skin || s.neon;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  if (facing === "down") ctx.scale(1, -1); // трафик едет в другую сторону

  _drawCar(ctx, s.body, s.stripe, neon);

  ctx.restore();
}

function _drawCar(ctx, bodyColor, stripeColor, neonColor) {
  const W = 38, H = 72; // базовые размеры
  const hw = W / 2, hh = H / 2;

  // ── тень под машиной ────────────────────────────────────────────────────────
  ctx.save();
  const shadow = ctx.createRadialGradient(0, hh * 0.55, 0, 0, hh * 0.55, hw * 1.6);
  shadow.addColorStop(0, "rgba(0,0,0,0.55)");
  shadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(0, hh * 0.62, hw * 1.55, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── неоновое свечение под кузовом (additive) ────────────────────────────────
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const nGlow = ctx.createRadialGradient(0, 10, 0, 0, 10, hw * 1.9);
  nGlow.addColorStop(0, hexToRgba(neonColor, 0.28));
  nGlow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = nGlow;
  ctx.fillRect(-hw * 1.9, -10, W * 1.9 * 2, H * 0.7);
  ctx.restore();

  // ── корпус (нижняя часть) ───────────────────────────────────────────────────
  ctx.save();
  const bodyGrad = ctx.createLinearGradient(-hw, 0, hw, 0);
  bodyGrad.addColorStop(0,   shadeColor(bodyColor, -30));
  bodyGrad.addColorStop(0.3, bodyColor);
  bodyGrad.addColorStop(0.7, bodyColor);
  bodyGrad.addColorStop(1,   shadeColor(bodyColor, -20));
  ctx.fillStyle = bodyGrad;
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 1;
  _rrect(ctx, -hw, -hh * 0.88, W, H * 0.88, 8);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // ── боковые полосы (stripe) ─────────────────────────────────────────────────
  ctx.save();
  ctx.fillStyle = stripeColor;
  ctx.globalAlpha = 0.75;
  // левая
  _rrect(ctx, -hw + 2, -hh * 0.5, 5, H * 0.62, 3);
  ctx.fill();
  // правая
  _rrect(ctx, hw - 7, -hh * 0.5, 5, H * 0.62, 3);
  ctx.fill();
  ctx.restore();

  // ── кабина / крыша ──────────────────────────────────────────────────────────
  ctx.save();
  const cabGrad = ctx.createLinearGradient(-hw * 0.75, 0, hw * 0.75, 0);
  cabGrad.addColorStop(0,   shadeColor(bodyColor, -25));
  cabGrad.addColorStop(0.4, shadeColor(bodyColor,  +8));
  cabGrad.addColorStop(1,   shadeColor(bodyColor, -15));
  ctx.fillStyle = cabGrad;
  ctx.strokeStyle = "rgba(255,255,255,0.10)";
  ctx.lineWidth = 1;
  _rrect(ctx, -hw * 0.74, -hh * 0.88, W * 0.74 * 2, H * 0.56, 7);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // ── стёкла (лобовое + заднее) ───────────────────────────────────────────────
  ctx.save();
  const glassGrad = ctx.createLinearGradient(0, -hh * 0.78, 0, -hh * 0.35);
  glassGrad.addColorStop(0, "rgba(120,200,255,0.55)");
  glassGrad.addColorStop(1, "rgba(60,100,180,0.25)");
  ctx.fillStyle = glassGrad;
  // лобовое
  _rrect(ctx, -hw * 0.60, -hh * 0.80, W * 0.60 * 2, H * 0.22, 5);
  ctx.fill();
  // заднее (более тёмное)
  ctx.fillStyle = "rgba(40,70,130,0.55)";
  _rrect(ctx, -hw * 0.58, -hh * 0.22, W * 0.58 * 2, H * 0.18, 5);
  ctx.fill();
  ctx.restore();

  // ── фары (спереди) ──────────────────────────────────────────────────────────
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  // левая фара
  const h1 = ctx.createRadialGradient(-hw * 0.52, -hh * 0.82, 0, -hw * 0.52, -hh * 0.82, 9);
  h1.addColorStop(0, "rgba(255,255,240,0.95)");
  h1.addColorStop(1, "rgba(255,255,200,0)");
  ctx.fillStyle = h1;
  ctx.beginPath(); ctx.ellipse(-hw * 0.52, -hh * 0.82, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
  // правая фара
  const h2 = ctx.createRadialGradient(hw * 0.52, -hh * 0.82, 0, hw * 0.52, -hh * 0.82, 9);
  h2.addColorStop(0, "rgba(255,255,240,0.95)");
  h2.addColorStop(1, "rgba(255,255,200,0)");
  ctx.fillStyle = h2;
  ctx.beginPath(); ctx.ellipse(hw * 0.52, -hh * 0.82, 9, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // ── стопы (сзади) ────────────────────────────────────────────────────────────
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const t1 = ctx.createRadialGradient(-hw * 0.50, hh * 0.82, 0, -hw * 0.50, hh * 0.82, 7);
  t1.addColorStop(0, "rgba(255,30,0,0.90)");
  t1.addColorStop(1, "rgba(255,0,0,0)");
  ctx.fillStyle = t1;
  ctx.beginPath(); ctx.ellipse(-hw * 0.50, hh * 0.82, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
  const t2 = ctx.createRadialGradient(hw * 0.50, hh * 0.82, 0, hw * 0.50, hh * 0.82, 7);
  t2.addColorStop(0, "rgba(255,30,0,0.90)");
  t2.addColorStop(1, "rgba(255,0,0,0)");
  ctx.fillStyle = t2;
  ctx.beginPath(); ctx.ellipse(hw * 0.50, hh * 0.82, 7, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // ── неоновые линии по бокам (подсветка днища) ───────────────────────────────
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = neonColor;
  ctx.lineWidth   = 2.5;
  ctx.shadowColor = neonColor;
  ctx.shadowBlur  = 8;
  ctx.lineCap     = "round";
  // левый бок
  ctx.beginPath();
  ctx.moveTo(-hw + 1, -hh * 0.55);
  ctx.lineTo(-hw + 1,  hh * 0.60);
  ctx.stroke();
  // правый бок
  ctx.beginPath();
  ctx.moveTo(hw - 1, -hh * 0.55);
  ctx.lineTo(hw - 1,  hh * 0.60);
  ctx.stroke();
  // передний неон
  ctx.beginPath();
  ctx.moveTo(-hw * 0.68, -hh * 0.84);
  ctx.lineTo( hw * 0.68, -hh * 0.84);
  ctx.stroke();
  ctx.restore();

  // ── колёса (4 штуки) ─────────────────────────────────────────────────────────
  _drawWheels(ctx, hw, hh, neonColor);

  // ── хром / верхний блик ──────────────────────────────────────────────────────
  ctx.save();
  ctx.globalAlpha = 0.12;
  const shine = ctx.createLinearGradient(-hw, -hh, -hw * 0.2, -hh * 0.3);
  shine.addColorStop(0, "#ffffff");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = shine;
  _rrect(ctx, -hw, -hh * 0.88, W, H * 0.88, 8);
  ctx.fill();
  ctx.restore();
}

function _drawWheels(ctx, hw, hh, neon) {
  const wPos = [
    [-hw - 4,  hh * 0.50],
    [ hw + 4,  hh * 0.50],
    [-hw - 4, -hh * 0.42],
    [ hw + 4, -hh * 0.42],
  ];
  wPos.forEach(([wx, wy]) => {
    // резина
    ctx.save();
    ctx.fillStyle = "#111118";
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(wx, wy, 8, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    // диск
    ctx.fillStyle = "#555566";
    ctx.beginPath(); ctx.ellipse(wx, wy, 5, 9, 0, 0, Math.PI * 2); ctx.fill();
    // неоновый ободок
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = neon;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = neon;
    ctx.shadowBlur  = 6;
    ctx.beginPath(); ctx.ellipse(wx, wy, 6.5, 11, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    ctx.restore();
  });
}

// ─── вспомогательные ─────────────────────────────────────────────────────────

function _rrect(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, Math.min(w, h) / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hexToRgba(hex, a) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

function shadeColor(hex, amt) {
  let r = parseInt(hex.slice(1,3),16);
  let g = parseInt(hex.slice(3,5),16);
  let b = parseInt(hex.slice(5,7),16);
  r = Math.max(0, Math.min(255, r + amt));
  g = Math.max(0, Math.min(255, g + amt));
  b = Math.max(0, Math.min(255, b + amt));
  return `rgb(${r},${g},${b})`;
}
