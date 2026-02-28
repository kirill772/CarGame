// ShopManager.js
// Магазин: покупка машин + перманентные улучшения + скины.

import { CarsData } from "../data/CarsData.js";
import { ECONOMY } from "../constants.js";
import { clamp, fmtInt } from "../utils.js";
import { Car3DRenderer } from "./Car3DRenderer.js";

const SKINS = [
  "#00e5ff", "#ff2bd6", "#a6ff00", "#ffd000", "#19ff9b",
  "#b3c9ff", "#ff6b00", "#ff3b5c", "#9a4dff", "#00ffa8", "#00b7ff",
];

export class ShopManager {
  constructor({ save, onSpendCoins, onBuyCar, onSkin, onSelectCar, onEvent }) {
    this.save = save;
    this.onSpendCoins = onSpendCoins;
    this.onBuyCar = onBuyCar;
    this.onSkin = onSkin;
    this.onSelectCar = onSelectCar;
    this.onEvent = onEvent;
  }

  renderHTML() {
    const coins = this.save.wallet.coins;

    const carsHTML = CarsData.map(car => {
      const owned = !!this.save.ownedCars[car.id];
      const canBuy = coins >= car.price;
      const selected = this.save.garage.selectedCarId === car.id;

      return `
        <div class="card">
          <div class="row">
            <h3>${car.name}</h3>
            <span class="badge">${owned ? "Куплено" : fmtInt(car.price) + " $"}</span>
          </div>
          <div style="height:200px;margin:8px 0;position:relative;">
            <div id="shop-car-3d-${car.id}" class="car-3d-container" style="width:100%;height:100%;border-radius:8px;background:rgba(0,0,0,.35);cursor:grab;"></div>
          </div>
          <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:12px 0;">
            <div class="stat-icon" title="Скорость">
              <div class="stat-icon-img speed"></div>
              <div class="stat-icon-val">${car.stats.maxSpeed}</div>
            </div>
            <div class="stat-icon" title="Разгон">
              <div class="stat-icon-img accel"></div>
              <div class="stat-icon-val">${car.stats.acceleration}</div>
            </div>
            <div class="stat-icon" title="Управление">
              <div class="stat-icon-img handling"></div>
              <div class="stat-icon-val">${car.stats.handling}</div>
            </div>
            <div class="stat-icon" title="Нитро">
              <div class="stat-icon-img nitro"></div>
              <div class="stat-icon-val">${car.stats.nitroPower}</div>
            </div>
            <div class="stat-icon" title="Прочность">
              <div class="stat-icon-img durability"></div>
              <div class="stat-icon-val">${car.stats.durability}</div>
            </div>
          </div>
          <div class="row" style="margin-top:10px;">
            <button class="btn small ${selected ? "primary" : ""}" data-action="selectCar" data-car="${car.id}" ${owned ? "" : "disabled"}>${selected ? "Выбрана" : "Выбрать"}</button>
            <button class="btn small primary" data-action="buyCar" data-car="${car.id}" ${(!owned && canBuy) ? "" : "disabled"}>${owned ? "Уже куплено" : "Купить"}</button>
          </div>
        </div>
      `;
    }).join("");

    const perks = [
      { id: "coinBonus", title: "Бонус монет", desc: "+% к доходу", max: 5 },
      { id: "repairBonus", title: "Ремонт+", desc: "Ремонт лечит больше", max: 5 },
      { id: "nitroRegen", title: "Реген нитро", desc: "Нитро восстанавливается быстрее", max: 5 },
    ];

    const perksHTML = perks.map(p => {
      const lvl = this.save.perks[p.id] ?? 0;
      const next = clamp(lvl + 1, 0, p.max);
      const cost = ECONOMY.upgradeCosts[next] * 2;
      const can = coins >= cost && lvl < p.max;

      return `
        <div class="card">
          <div class="row">
            <h3>${p.title}</h3>
            <span class="badge">ур. ${lvl}/${p.max}</span>
          </div>
          <div class="muted small">${p.desc}</div>
          <div class="row" style="margin-top:10px;">
            <button class="btn small primary" data-action="buyPerk" data-perk="${p.id}" ${can ? "" : "disabled"}>Улучшить (${fmtInt(cost)})</button>
          </div>
        </div>
      `;
    }).join("");

    const skinsHTML = SKINS.map(c => {
      const selected = (this.save.garage.selectedSkin ?? "#00e5ff") === c;
      return `
        <div class="card">
          <div class="row">
            <h3>Неон</h3>
            <span class="badge" style="border-color:${c};color:${c}">${selected ? "Выбран" : c}</span>
          </div>
          <div style="height:14px;border-radius:999px;background:linear-gradient(90deg, rgba(255,255,255,.08), ${c}); border:1px solid rgba(255,255,255,.12)"></div>
          <div class="row" style="margin-top:10px;">
            <button class="btn small ${selected ? "primary" : ""}" data-action="skin" data-color="${c}">${selected ? "ОК" : "Выбрать"}</button>
          </div>
        </div>
      `;
    }).join("");

    return `
      <div class="card" style="grid-column:1/-1;">
        <div class="row">
          <h3>Магазин</h3>
          <span class="badge">Баланс: ${fmtInt(coins)} NC</span>
        </div>
        <div class="muted small">Покупай машины, перки и неоновые скины.</div>
      </div>

      <div class="card" style="grid-column:1/-1;"><h3>Машины</h3></div>
      ${carsHTML}

      <div class="card" style="grid-column:1/-1;"><h3>Перманентные улучшения</h3></div>
      ${perksHTML}

      <div class="card" style="grid-column:1/-1;"><h3>Скины (неоновая подсветка)</h3></div>
      ${skinsHTML}

      <button class="btn primary" data-action="close" style="grid-column:1/-1; margin-top:16px;">Закрыть</button>
    `;
  }

  bind(containerEl) {
    // создать 3D-рендереры для каждой машины
    this.renderers = {};
    CarsData.forEach(car => {
      const div = containerEl.querySelector(`#shop-car-3d-${car.id}`);
      if (!div) return;
      const canvas = document.createElement("canvas");
      canvas.width = div.clientWidth * window.devicePixelRatio;
      canvas.height = div.clientHeight * window.devicePixelRatio;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      div.appendChild(canvas);
      const renderer = new Car3DRenderer(canvas);
      renderer.loadCar(car.id);
      this.renderers[car.id] = renderer;
    });

    // анимация всех рендереров
    const animate = () => {
      for (const r of Object.values(this.renderers)) r.render();
      requestAnimationFrame(animate);
    };
    animate();

    containerEl.querySelectorAll("[data-action]").forEach(btn => {
      btn.addEventListener("click", () => {
        const action = btn.getAttribute("data-action");
        if (action === "buyCar") {
          const id = btn.getAttribute("data-car");
          const car = CarsData.find(c => c.id === id);
          if (!car) return;
          if (this.save.ownedCars[id]) return;
          if (this.save.wallet.coins < car.price) return;

          this.onSpendCoins(car.price);
          this.save.ownedCars[id] = true;
          if (!this.save.upgrades[id]) {
            this.save.upgrades[id] = { maxSpeed: 1, acceleration: 1, handling: 1, nitroPower: 1, durability: 1 };
          }
          this.onBuyCar(id);
          this.onEvent?.("buyCar");
          this.onEvent?.("spendCoins", car.price);
          // перерисовать магазин, чтобы кнопка обновилась
          this.onEvent?.("refreshShop");
        }

        if (action === "selectCar") {
          const id = btn.getAttribute("data-car");
          if (!this.save.ownedCars[id]) return;
          this.save.garage.selectedCarId = id;
          this.onSelectCar?.(id);
          // перерисовать, чтобы кнопка “Выбрана” обновилась
          this.onEvent?.("refreshShop");
        }

        if (action === "buyPerk") {
          const perk = btn.getAttribute("data-perk");
          const lvl = this.save.perks[perk] ?? 0;
          if (lvl >= 5) return;

          const next = clamp(lvl + 1, 0, 5);
          const cost = ECONOMY.upgradeCosts[next] * 2;
          if (this.save.wallet.coins < cost) return;

          this.onSpendCoins(cost);
          this.save.perks[perk] = next;
          this.onEvent?.("spendCoins", cost);
        }

        if (action === "skin") {
          const c = btn.getAttribute("data-color");
          this.save.garage.selectedSkin = c;
          this.onSkin?.(c);
          this.onEvent?.("skin");
        }

        if (action === "close") {
          this.onEvent?.("closeOverlay");
        }
      });
    });
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
