// main.js
// Точка входа. Создаёт Game и запускает главный цикл.

import { CANVAS_W, CANVAS_H, DT_CAP } from "./constants.js";
import { nowMs } from "./utils.js";
import { loadSave, saveNow } from "./storage.js";
import { UIManager } from "./managers/UIManager.js";
import { InputManager } from "./managers/InputManager.js";
import { AudioManager } from "./managers/AudioManager.js";
import { Game } from "./Game.js";

// 2D canvas — для миникарты и спидометра
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Размер HUD canvas = размер окна (не 1280×720, т.к. fullscreen 3D)
function resizeHUD() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeHUD();
window.addEventListener("resize", resizeHUD);

// Убираем из потока (Three.js рисует поверх на #game3d)
canvas.style.position = "absolute";
canvas.style.inset     = "0";
canvas.style.pointerEvents = "none";
canvas.style.zIndex   = "1";
canvas.style.background = "transparent";

const save = loadSave();

const boot = document.getElementById("boot");
const bootFill = document.getElementById("bootFill");
const bootText = document.getElementById("bootText");
function setBoot(p01, text) {
  if (!boot) return;
  const p = Math.max(0, Math.min(1, p01));
  if (bootFill) bootFill.style.width = `${Math.round(p * 100)}%`;
  if (bootText && text) bootText.textContent = text;
}
setBoot(0.08, "Подготовка интерфейса…");

// Сначала создаём game, но пока не передаём ui
let game = null;
const ui = new UIManager({
  save,
  onAction: (action, payload) => {
    if (game) game.onUIAction(action, payload);
  },
});
ui.setCoins(save.wallet.coins);
ui.showMenu();

setBoot(0.32, "Подключение управления…");

const input = new InputManager({ uiRefs: ui.getTouchRefs() });

setBoot(0.56, "Инициализация аудио…");
const audio = new AudioManager(() => save.settings);

setBoot(0.74, "Загрузка мира…");
game = new Game({ canvas, ctx, save, ui, input, audio });

// DevTools консоль: команды для тестов (локально, не защита)
window.NEON = {
  help() {
    return {
      giveCoins: "NEON.giveCoins(10000)  // добавить монеты",
      setCoins: "NEON.setCoins(5000)    // установить баланс",
      resetSave: "NEON.resetSave()       // сбросить прогресс",
      state: "NEON.game, NEON.save       // доступ к объектам",
    };
  },
  giveCoins(n = 0) {
    const v = Math.max(0, Math.floor(Number(n) || 0));
    if (!v) return save.wallet.coins;
    // использовать внутр. метод игры, чтобы UI обновился
    game._addCoins(v);
    return save.wallet.coins;
  },
  setCoins(n = 0) {
    const v = Math.max(0, Math.floor(Number(n) || 0));
    save.wallet.coins = v;
    ui.setCoins(save.wallet.coins);
    return save.wallet.coins;
  },
  resetSave() {
    localStorage.removeItem("neon_rush_save_v1");
    location.reload();
  },
  get game() { return game; },
  get save() { return save; },
};

setBoot(1.0, "Готово");
setTimeout(() => {
  if (boot) boot.style.display = "none";
}, 250);

// Гарантируем, что клики по кнопкам сработают даже если UIManager не успел
const bindBtn = (id, action) => {
  const el = document.getElementById(id);
  if (el && !el.dataset.bound) {
    el.addEventListener("click", () => game.onUIAction(action));
    el.dataset.bound = "1";
  }
};
bindBtn("btnCareer", "startCareer");
bindBtn("btnEndless", "startEndless");
bindBtn("btnGarage", "openGarage");
bindBtn("btnShop", "openShop");
bindBtn("btnAchievements", "openAchievements");
bindBtn("btnSettings", "openSettings");

// автосейв раз в 3 секунды
let autosaveT = 0;

let last = nowMs();
function frame() {
  const t = nowMs();
  let dt = (t - last) / 1000;
  last = t;

  dt = Math.min(DT_CAP, Math.max(0, dt));

  game.update(dt);
  game.render();

  ui.update(dt);

  autosaveT += dt;
  if (autosaveT >= 3.0) {
    autosaveT = 0;
    saveNow(save);
  }

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// первое взаимодействие пользователя должно “разбудить” WebAudio
window.addEventListener("pointerdown", () => {
  audio.start().then(() => audio.resumeIfSuspended());
}, { once: true });

window.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") saveNow(save);
});

window.addEventListener("beforeunload", () => {
  saveNow(save);
});
