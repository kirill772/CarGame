// GarageManager.js
// Кинематичный гараж: Three.js сцена, выбор машины карусель, апгрейды, скины.

import { CarsData } from "../data/CarsData.js";
import { ECONOMY } from "../constants.js";
import { clamp, fmtInt } from "../utils.js";
import { Car3DRenderer } from "./Car3DRenderer.js";

const UPG_KEYS = ["maxSpeed", "acceleration", "handling", "nitroPower", "durability"];
const UPG_LABELS = {
  maxSpeed:     { label: "Макс. скорость", icon: "⚡", color: "#00e5ff" },
  acceleration: { label: "Разгон",          icon: "🚀", color: "#ff2bd6" },
  handling:     { label: "Управление",      icon: "🎯", color: "#a6ff00" },
  nitroPower:   { label: "Сила нитро",      icon: "🔥", color: "#ffd000" },
  durability:   { label: "Прочность",       icon: "🛡️", color: "#19ff9b" },
};

export class GarageManager {
  constructor({ save, onSpendCoins, onEvent }) {
    this.save = save;
    this.onSpendCoins = onSpendCoins;
    this.onEvent = onEvent;
    this._renderer = null;
    this._animId = null;
    this._carIndex = CarsData.findIndex(c => c.id === save.garage.selectedCarId);
    if (this._carIndex < 0) this._carIndex = 0;
    this._transitioning = false;
  }

  get _currentCar() { return CarsData[this._carIndex]; }

  renderHTML() {
    const car    = this._currentCar;
    const coins  = this.save.wallet.coins;
    const owned  = !!this.save.ownedCars[car.id];
    const upg    = this._getUpgrades(car.id);
    const skin   = this.save.garage.selectedSkin ?? "#00e5ff";
    const isSelected = this.save.garage.selectedCarId === car.id;

    const statsBar = UPG_KEYS.map(key => {
      const lvl   = upg[key] ?? 1;
      const base  = car.stats[key] ?? 5;
      const total = Math.min(10, base + (lvl - 1));
      const pct   = (total / 10) * 100;
      const meta  = UPG_LABELS[key];
      const cost  = ECONOMY.upgradeCosts[clamp(lvl + 1, 1, 5)];
      const canUp = owned && coins >= cost && lvl < 5;
      return `
        <div class="garage-stat-row">
          <div class="garage-stat-left">
            <span class="garage-stat-icon">${meta.icon}</span>
            <span class="garage-stat-label">${meta.label}</span>
            <span class="garage-stat-lvl">ур.${lvl}/5</span>
          </div>
          <div class="garage-stat-bar-wrap">
            <div class="garage-stat-bar" style="width:${pct}%;background:${meta.color};box-shadow:0 0 8px ${meta.color}88;"></div>
          </div>
          <button class="garage-upg-btn" data-action="upgrade" data-key="${key}"
            ${canUp ? "" : "disabled"}
            style="--upg-color:${meta.color}">
            ${lvl < 5 ? `⬆ ${fmtInt(cost)}` : "MAX"}
          </button>
        </div>`;
    }).join("");

    const skinDots = [
      "#00e5ff","#ff2bd6","#a6ff00","#ffd000","#19ff9b",
      "#ff6b00","#ff3b5c","#9a4dff","#00ffa8","#b3c9ff","#ffffff",
    ].map(c => `
      <button class="skin-dot ${c === skin ? "active" : ""}"
        data-action="skin" data-color="${c}"
        style="--dot-color:${c}" title="${c}"></button>
    `).join("");

    const carPrice = car.price === 0 ? "Бесплатно" : fmtInt(car.price) + " NC";
    const canBuy   = !owned && coins >= car.price;

    return `
      <div class="garage-root">

        <!-- ── 3D вьюпорт ── -->
        <div class="garage-viewport-wrap">
          <!-- стрелки карусели -->
          <button class="garage-arrow left"  data-action="prevCar">&#8249;</button>
          <button class="garage-arrow right" data-action="nextCar">&#8250;</button>

          <!-- 3D канвас -->
          <div id="garage-3d-mount" class="garage-3d-mount"></div>

          <!-- шильдик машины -->
          <div class="garage-car-badge">
            <div class="garage-car-name">${car.name}</div>
            <div class="garage-car-price ${owned ? "owned" : ""}">
              ${owned ? (isSelected ? "✔ Выбрана" : "В гараже") : carPrice}
            </div>
          </div>

          <!-- индикатор-точки -->
          <div class="garage-dots">
            ${CarsData.map((_, i) => `<span class="garage-dot ${i === this._carIndex ? "active" : ""}"></span>`).join("")}
          </div>
        </div>

        <!-- ── правая панель ── -->
        <div class="garage-side-panel">

          <!-- кнопки действий -->
          <div class="garage-actions">
            ${owned
              ? `<button class="garage-action-btn primary ${isSelected ? "selected" : ""}"
                   data-action="selectCar" data-car="${car.id}">
                   ${isSelected ? "✔ Выбрана" : "Выбрать"}
                 </button>`
              : `<button class="garage-action-btn buy ${canBuy ? "" : "disabled-btn"}"
                   data-action="buyCar" data-car="${car.id}" ${canBuy ? "" : "disabled"}>
                   Купить ${carPrice}
                 </button>`
            }
          </div>

          <!-- скины -->
          <div class="garage-section">
            <div class="garage-section-title">Неоновый цвет</div>
            <div class="garage-skins">${skinDots}</div>
          </div>

          <!-- статы -->
          <div class="garage-section">
            <div class="garage-section-title">Характеристики
              <span class="garage-coins-badge">💰 ${fmtInt(coins)} NC</span>
            </div>
            <div class="garage-stats">${owned ? statsBar : `<div class="garage-locked">🔒 Купи машину, чтобы прокачивать</div>`}</div>
          </div>

          <button class="garage-close-btn" data-action="close">✕ Закрыть</button>
        </div>

      </div>`;
  }

  bind(containerEl) {
    this._container = containerEl;
    this._mount3D();
    this._bindEvents(containerEl);
  }

  _mount3D() {
    const mount = this._container.querySelector("#garage-3d-mount");
    if (!mount) return;

    // создаём канвас
    const canvas = document.createElement("canvas");
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width  = Math.round(mount.clientWidth  || 560) * dpr;
    canvas.height = Math.round(mount.clientHeight || 480) * dpr;
    canvas.style.width  = "100%";
    canvas.style.height = "100%";
    canvas.style.borderRadius = "inherit";
    canvas.style.cursor = "grab";
    mount.appendChild(canvas);

    // создаём рендерер
    if (this._renderer) this._renderer.dispose();
    this._renderer = new Car3DRenderer(canvas);
    this._renderer.loadCar(this._currentCar.id);

    // запускаем анимационный цикл
    if (this._animId) cancelAnimationFrame(this._animId);
    const loop = () => {
      this._animId = requestAnimationFrame(loop);
      this._renderer.render();
    };
    loop();
  }

  _bindEvents(root) {
    root.addEventListener("click", e => {
      const btn = e.target.closest("[data-action]");
      if (!btn) return;
      const action = btn.dataset.action;

      if (action === "prevCar") { this._switchCar(-1); return; }
      if (action === "nextCar") { this._switchCar(+1); return; }

      if (action === "selectCar") {
        const id = btn.dataset.car;
        if (!this.save.ownedCars[id]) return;
        this.save.garage.selectedCarId = id;
        this.onEvent?.("garageRotate");
        this._rerender(root);
        return;
      }

      if (action === "buyCar") {
        const car = this._currentCar;
        if (this.save.ownedCars[car.id]) return;
        if (this.save.wallet.coins < car.price) return;
        this.onSpendCoins(car.price);
        this.save.ownedCars[car.id] = true;
        if (!this.save.upgrades[car.id]) {
          this.save.upgrades[car.id] = { maxSpeed:1, acceleration:1, handling:1, nitroPower:1, durability:1 };
        }
        this.save.garage.selectedCarId = car.id;
        this.onEvent?.("buyCar");
        this.onEvent?.("spendCoins", car.price);
        this._rerender(root);
        return;
      }

      if (action === "upgrade") {
        const key    = btn.dataset.key;
        const carId  = this._currentCar.id;
        const upg    = this._getUpgrades(carId);
        const lvl    = upg[key] ?? 1;
        if (lvl >= 5) return;
        const cost = ECONOMY.upgradeCosts[clamp(lvl + 1, 1, 5)];
        if (this.save.wallet.coins < cost) return;
        this.onSpendCoins(cost);
        upg[key] = lvl + 1;
        this.onEvent?.("upgrade");
        this.onEvent?.("spendCoins", cost);
        this.onEvent?.("refreshGarage");
        this._rerender(root);
        return;
      }

      if (action === "skin") {
        const c = btn.dataset.color;
        this.save.garage.selectedSkin = c;
        this.onEvent?.("skin");
        this._rerender(root);
        // обновляем цвет неона в рендерере без перезапуска
        if (this._renderer) this._renderer.loadCar(this._currentCar.id);
        return;
      }

      if (action === "close") {
        this._cleanup();
        // стандартный путь закрытия через UIManager
        const overlayScreen = document.getElementById("screenOverlayList");
        if (overlayScreen) overlayScreen.classList.add("hidden");
        const menu = document.getElementById("screenMenu");
        if (menu) menu.classList.remove("hidden");
        return;
      }
    });

    // свайп/клавиши для смены машины
    let swipeX = 0;
    root.addEventListener("touchstart", e => { swipeX = e.touches[0].clientX; }, { passive: true });
    root.addEventListener("touchend", e => {
      const dx = e.changedTouches[0].clientX - swipeX;
      if (Math.abs(dx) > 55) this._switchCar(dx < 0 ? 1 : -1);
    }, { passive: true });

    document.addEventListener("keydown", this._onKey = (e) => {
      if (e.code === "ArrowLeft")  this._switchCar(-1);
      if (e.code === "ArrowRight") this._switchCar(+1);
    });
  }

  _switchCar(dir) {
    if (this._transitioning) return;
    this._transitioning = true;
    this._carIndex = ((this._carIndex + dir) + CarsData.length) % CarsData.length;

    // анимация смены машины (fade-out/in через класс)
    const mount = this._container?.querySelector("#garage-3d-mount");
    if (mount) {
      mount.style.transition = "opacity 0.18s ease";
      mount.style.opacity = "0";
    }

    setTimeout(() => {
      this._rerender(this._container);
      if (this._renderer) this._renderer.loadCar(this._currentCar.id);
      if (mount) {
        mount.style.opacity = "1";
      }
      this._transitioning = false;
    }, 200);
  }

  _rerender(root) {
    if (!root) return;
    root.innerHTML = this.renderHTML();
    // пересоздаём 3D-вьюпорт (канвас мог исчезнуть)
    this._mount3D();
    this._bindEvents(root);
  }

  _getUpgrades(carId) {
    if (!this.save.upgrades[carId]) {
      this.save.upgrades[carId] = { maxSpeed:1, acceleration:1, handling:1, nitroPower:1, durability:1 };
    }
    return this.save.upgrades[carId];
  }

  _cleanup() {
    if (this._renderer) { this._renderer.dispose(); this._renderer = null; }
    if (this._animId)   { cancelAnimationFrame(this._animId); this._animId = null; }
    if (this._onKey)    { document.removeEventListener("keydown", this._onKey); }
  }
}
