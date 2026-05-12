// UIManager.js
// DOM-экраны, HUD, тосты, плавные переходы.

import { fmtInt } from "../utils.js";
import { TRACKS, GAME_MODES, UI } from "../constants.js";

export class UIManager {
  constructor({ save, onAction }) {
    this.save = save;
    this.onAction = onAction;

    this.canvas = document.getElementById("game");
    this.fade = document.getElementById("fade");

    this.topbar = document.getElementById("topbar");
    this.coinsValue = document.getElementById("coinsValue");

    this.screenMenu = document.getElementById("screenMenu");
    this.screenOverlayList = document.getElementById("screenOverlayList");
    this.overlayTitle = document.getElementById("overlayTitle");
    this.overlayBody = document.getElementById("overlayBody");
    this.btnOverlayBack = document.getElementById("btnOverlayBack");

    this.hud = document.getElementById("hud");
    this.hpBar = document.getElementById("hpBar");
    this.nitroBar = document.getElementById("nitroBar");
    this.speedValue = document.getElementById("speedValue");
    this.posValue = document.getElementById("posValue");
    this.lapValue = document.getElementById("lapValue");
    this.trackValue = document.getElementById("trackValue");
    this.modeValue = document.getElementById("modeValue");

    this.pause = document.getElementById("pause");
    this.btnResume = document.getElementById("btnResume");
    this.btnRestart = document.getElementById("btnRestart");
    this.btnQuit = document.getElementById("btnQuit");

    this.toast = document.getElementById("toast");

    this.touchControls = document.getElementById("touchControls");
    this.stickBase = document.getElementById("stickBase");
    this.stickKnob = document.getElementById("stickKnob");
    this.btnTouchNitro = document.getElementById("btnTouchNitro");
    this.btnTouchBrake = document.getElementById("btnTouchBrake");

    this.minimap = document.getElementById("minimap");

    document.getElementById("btnCareer").addEventListener("click", () => this.onAction("startCareer"));
    document.getElementById("btnEndless").addEventListener("click", () => this.onAction("startEndless"));
    document.getElementById("btnGarage").addEventListener("click", () => this.onAction("openGarage"));
    document.getElementById("btnShop").addEventListener("click", () => this.onAction("openShop"));
    document.getElementById("btnAchievements").addEventListener("click", () => this.onAction("openAchievements"));
    document.getElementById("btnSettings").addEventListener("click", () => this.onAction("openSettings"));

    this.btnOverlayBack.addEventListener("click", () => this.onAction("closeOverlay"));

    this.btnResume.addEventListener("click", () => this.onAction("resume"));
    this.btnRestart.addEventListener("click", () => this.onAction("restart"));
    this.btnQuit.addEventListener("click", () => this.onAction("quitToMenu"));

    this._toastTimer = 0;
    this._fadeBusy = false;
  }

  getTouchRefs() {
    return {
      touchControls: this.touchControls,
      stickBase: this.stickBase,
      stickKnob: this.stickKnob,
      btnTouchNitro: this.btnTouchNitro,
      btnTouchBrake: this.btnTouchBrake,
    };
  }

  setCoins(n) {
    this.coinsValue.textContent = fmtInt(n);
  }

  setTopbarVisible(on) {
    this.topbar.classList.toggle("hidden", !on);
  }

  showMenu() {
    this.screenMenu.classList.remove("hidden");
    this.screenOverlayList.classList.add("hidden");
    this.hud.classList.add("hidden");
    this.pause.classList.add("hidden");
    this.setTopbarVisible(true);
  }

  hideMenu() {
    this.screenMenu.classList.add("hidden");
  }

  showHUD(on) {
    this.hud.classList.toggle("hidden", !on);
  }

  showPause(on) {
    this.pause.classList.toggle("hidden", !on);
  }

  showOverlay(title, html, fullscreen = false) {
    this.overlayTitle.textContent = title;
    this.overlayBody.innerHTML = html;
    // для гаража — убираем grid-сетку overlay, расширяем panel
    const panel = this.screenOverlayList.querySelector(".panel");
    if (panel) {
      if (fullscreen) {
        panel.style.width = "min(1200px,100%)";
        panel.style.maxHeight = "90vh";
        panel.style.padding   = "18px";
        this.overlayBody.style.maxHeight = "80vh";
        this.overlayBody.style.gridTemplateColumns = "1fr";
      } else {
        panel.style.width    = "";
        panel.style.maxHeight = "";
        panel.style.padding   = "";
        this.overlayBody.style.maxHeight = "";
        this.overlayBody.style.gridTemplateColumns = "";
      }
    }
    this.screenOverlayList.classList.remove("hidden");
    this.screenMenu.classList.add("hidden");
    this.setTopbarVisible(true);
  }

  hideOverlay() {
    this.screenOverlayList.classList.add("hidden");
  }

  setHUD({ hp01, nitro01, speedKmh, posText, lapText, trackId, mode }) {
    this.hpBar.style.width = `${Math.max(0, Math.min(1, hp01)) * 100}%`;
    this.nitroBar.style.width = `${Math.max(0, Math.min(1, nitro01)) * 100}%`;
    this.speedValue.textContent = `${Math.round(speedKmh)}`;
    this.posValue.textContent = posText;
    this.lapValue.textContent = lapText;

    const trackName = (TRACKS.find(t => t.id === trackId)?.name) ?? "—";
    this.trackValue.textContent = trackName;
    this.modeValue.textContent = mode === GAME_MODES.CAREER ? "Карьера" : "Endless";
  }

  toastMsg(text) {
    this.toast.textContent = text;
    this.toast.classList.remove("hidden");
    this._toastTimer = UI.toastTime;
  }

  update(dt) {
    if (this._toastTimer > 0) {
      this._toastTimer -= dt;
      if (this._toastTimer <= 0) this.toast.classList.add("hidden");
    }
  }

  async fadeOutIn(asyncFn) {
    if (this._fadeBusy) return;
    this._fadeBusy = true;
    this.fade.style.opacity = "1";
    await sleep(180);
    try {
      await asyncFn?.();
    } finally {
      this.fade.style.opacity = "0";
      await sleep(180);
      this._fadeBusy = false;
    }
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
