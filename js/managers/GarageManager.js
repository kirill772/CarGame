// GarageManager.js
// Гараж: выбор машины, апгрейды, скин.

import { CarsData } from "../data/CarsData.js";
import { ECONOMY } from "../constants.js";
import { clamp, fmtInt } from "../utils.js";
import { Car3DRenderer } from "./Car3DRenderer.js";

const UPG_KEYS = ["maxSpeed", "acceleration", "handling", "nitroPower", "durability"];

export class GarageManager {
  constructor({ save, onSpendCoins, onEvent }) {
    this.save = save;
    this.onSpendCoins = onSpendCoins;
    this.onEvent = onEvent;

    this._yaw = save.garage.rotateYaw ?? 0;
    this._drag = false;
    this._lastX = 0;

    this._canvasId = "garageCanvas";
  }

  renderHTML() {
    const carId = this.save.garage.selectedCarId;
    const car = CarsData.find(c => c.id === carId) || CarsData[0];
    const coins = this.save.wallet.coins;

    const upgrades = this.save.upgrades[car.id] || (this.save.upgrades[car.id] = makeDefaultUpgrades());
    const skin = this.save.garage.selectedSkin ?? "#00e5ff";

    const upHTML = UPG_KEYS.map(key => {
      const lvl = upgrades[key] ?? 1;
      const next = clamp(lvl + 1, 1, 5);
      const cost = ECONOMY.upgradeCosts[next];
      const can = coins >= cost && lvl < 5;

      return `
        <div class="card">
          <div class="row">
            <h3>${prettyKey(key)}</h3>
            <span class="badge">ур. ${lvl}/5</span>
          </div>
          <div class="muted small">Текущий множитель: x${(1 + (lvl - 1) * ECONOMY.upgradeDeltaPerLevel).toFixed(2)}</div>
          <div class="row" style="margin-top:10px;">
            <button class="btn small primary" data-action="upgrade" data-key="${key}" ${can ? "" : "disabled"}>Улучшить (${fmtInt(cost)})</button>
          </div>
        </div>
      `;
    }).join("");

    return `
      <div class="card" style="grid-column:1/-1;">
        <div id="garage-car-3d" class="car-3d-container" style="width:100%;height:320px;border-radius:16px;background:rgba(0,0,0,.35);outline:1px solid rgba(0,229,255,.12);cursor:grab;"></div>
      </div>

      <div class="card" style="grid-column:1/-1;">
        <h3>Апгрейды (по машине)</h3>
        <div class="muted small">Каждый параметр можно прокачать до 5 уровня за Neon Coins.</div>
      </div>

      ${upHTML}

      <button class="btn primary" data-action="close" style="grid-column:1/-1; margin-top:16px;">Закрыть</button>
    `;
  }

  bind(containerEl) {
    const div = containerEl.querySelector("#garage-car-3d");
    if (div && Car3DRenderer) {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = div.clientWidth * window.devicePixelRatio;
        canvas.height = div.clientHeight * window.devicePixelRatio;
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        div.appendChild(canvas);
        const renderer = new Car3DRenderer(canvas);
        const carId = this.save.garage.selectedCarId;
        renderer.loadCar(carId);
        const animate = () => {
          renderer.render();
          requestAnimationFrame(animate);
        };
        animate();
      } catch (e) {
        console.error("3D renderer error in garage:", e);
        div.innerHTML = "<div style='padding:40px;color:rgba(0,229,255,0.6);text-align:center;'>3D недоступен</div>";
      }
    } else if (div) {
      div.innerHTML = "<div style='padding:40px;color:rgba(0,229,255,0.6);text-align:center;'>3D недоступен</div>";
    }

    // закрытие
    containerEl.querySelectorAll("[data-action='close']").forEach(btn => {
      btn.addEventListener("click", () => {
        const overlay = document.getElementById("overlay");
        const overlayBody = document.getElementById("overlayBody");
        const overlayTitle = document.getElementById("overlayTitle");
        if (overlay && overlayBody && overlayTitle) {
          overlay.style.display = "none";
          overlayBody.innerHTML = "";
          overlayTitle.textContent = "";
        }
        const menu = document.getElementById("menu");
        if (menu) menu.style.display = "flex";
      });
    });

    // улучшения
    containerEl.querySelectorAll("[data-action='upgrade']").forEach(btn => {
      btn.addEventListener("click", () => {
        const carId = this.save.garage.selectedCarId;
        const upgrades = this.save.upgrades[carId] || (this.save.upgrades[carId] = makeDefaultUpgrades());
        const key = btn.getAttribute("data-key");
        const lvl = upgrades[key] ?? 1;
        if (lvl >= 5) return;

        const next = clamp(lvl + 1, 1, 5);
        const cost = ECONOMY.upgradeCosts[next];
        if (this.save.wallet.coins < cost) return;

        this.onSpendCoins(cost);
        upgrades[key] = next;
        this.onEvent?.("upgrade");
        this.onEvent?.("spendCoins", cost);
        this.onEvent?.("refreshGarage");
      });
    });
  }

  _renderGarage(ctx, w, h) {
    const carId = this.save.garage.selectedCarId;
    const car = CarsData.find(c => c.id === carId) || CarsData[0];
    const skin = this.save.garage.selectedSkin ?? "#00e5ff";

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,255,255,0.02)";
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.5;
    const cy = h * 0.62;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.beginPath();
    ctx.ellipse(0, 50, 260, 70, 0, 0, Math.PI * 2);
    ctx.fill();

    const yaw = this._yaw;
    const side = Math.sin(yaw);
    const face = Math.cos(yaw);

    const bodyW = 300;
    const bodyH = 130;
    const skew = side * 70;
    const scaleX = 0.72 + 0.28 * Math.abs(face);

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(15,18,32,0.95)";
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 2;

    roundRect(ctx, -bodyW * 0.5 * scaleX + skew * 0.35, -bodyH * 0.5, bodyW * scaleX, bodyH, 26);
    ctx.fill();
    ctx.stroke();

    ctx.globalCompositeOperation = "lighter";
    const grad = ctx.createLinearGradient(-200, -60, 200, 60);
    grad.addColorStop(0, "rgba(0,229,255,0.06)");
    grad.addColorStop(0.5, "rgba(255,255,255,0.04)");
    grad.addColorStop(1, "rgba(255,43,214,0.05)");
    ctx.fillStyle = grad;
    roundRect(ctx, -bodyW * 0.35 * scaleX + skew * 0.25, -bodyH * 0.30, bodyW * 0.70 * scaleX, bodyH * 0.60, 22);
    ctx.fill();

    ctx.strokeStyle = skin;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-bodyW * 0.32 * scaleX + skew * 0.35, -bodyH * 0.22);
    ctx.lineTo(bodyW * 0.32 * scaleX + skew * 0.35, -bodyH * 0.22);
    ctx.moveTo(-bodyW * 0.32 * scaleX + skew * 0.35, bodyH * 0.22);
    ctx.lineTo(bodyW * 0.32 * scaleX + skew * 0.35, bodyH * 0.22);
    ctx.stroke();

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(0,0,0,0.75)";
    const wheelOff = 130 * scaleX;
    drawWheel(ctx, -wheelOff + skew * 0.15, 58, 22, 10);
    drawWheel(ctx, wheelOff + skew * 0.15, 58, 22, 10);

    ctx.restore();

    ctx.fillStyle = "rgba(232,240,255,0.85)";
    ctx.font = "700 16px ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial";
    ctx.fillText(car.name, 14, 26);

    ctx.fillStyle = "rgba(156,176,211,0.85)";
    ctx.font = "12px ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial";
    ctx.fillText("Перетащи, чтобы вращать • Апгрейды справа", 14, 46);
  }
}

function makeDefaultUpgrades() {
  return { maxSpeed: 1, acceleration: 1, handling: 1, nitroPower: 1, durability: 1 };
}

function prettyKey(k) {
  const map = {
    maxSpeed: "Макс. скорость",
    acceleration: "Разгон",
    handling: "Управление",
    nitroPower: "Сила нитро",
    durability: "Прочность",
  };
  return map[k] || k;
}

function drawWheel(ctx, x, y, rx, ry) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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
