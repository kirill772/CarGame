// InputManager.js
// Клавиатура + тач (виртуальный джойстик) + gamepad.

import { clamp, isTouchDevice } from "../utils.js";

export class InputManager {
  constructor({ uiRefs }) {
    this.keys = new Set();
    this.uiRefs = uiRefs;

    this.touch = {
      enabled: false,
      active: false,
      id: null,
      baseX: 0,
      baseY: 0,
      steer: 0,
      throttle: 0,
      brake: 0,
      nitro: false,
    };

    this.gamepad = {
      index: null,
      steer: 0,
      throttle: 0,
      brake: 0,
      nitro: false,
      drift: false,
    };

    this._pauseLatch = false;

    this._bindKeyboard();
    this._bindTouch();
    this._bindGamepad();
  }

  _bindKeyboard() {
    window.addEventListener("keydown", (e) => {
      this.keys.add(e.code);
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code)) e.preventDefault();
    }, { passive: false });

    window.addEventListener("keyup", (e) => {
      this.keys.delete(e.code);
    });
  }

  _bindTouch() {
    const { touchControls, stickBase, stickKnob, btnTouchNitro, btnTouchBrake } = this.uiRefs;

    const enable = isTouchDevice();
    this.touch.enabled = enable;
    if (enable) touchControls.classList.remove("hidden");
    else touchControls.classList.add("hidden");

    const updateKnob = (clientX, clientY) => {
      const dx = clientX - this.touch.baseX;
      const dy = clientY - this.touch.baseY;

      const maxR = 52;
      const len = Math.hypot(dx, dy);
      const k = len > maxR ? maxR / len : 1;

      const nx = dx * k;
      const ny = dy * k;

      stickKnob.style.transform = `translate(${nx}px, ${ny}px) translate(-50%,-50%)`;

      const steer = clamp(nx / maxR, -1, 1);
      const forward = clamp(-ny / maxR, 0, 1);
      const backward = clamp(ny / maxR, 0, 1);

      this.touch.steer = steer;
      this.touch.throttle = forward;
      this.touch.brake = Math.max(this.touch.brake, backward);
    };

    const onDown = (ev) => {
      if (!this.touch.enabled) return;
      ev.preventDefault();

      const t = ev.changedTouches[0];
      this.touch.active = true;
      this.touch.id = t.identifier;

      const rect = stickBase.getBoundingClientRect();
      this.touch.baseX = rect.left + rect.width / 2;
      this.touch.baseY = rect.top + rect.height / 2;

      updateKnob(t.clientX, t.clientY);
    };

    const onMove = (ev) => {
      if (!this.touch.active) return;
      const t = [...ev.changedTouches].find(x => x.identifier === this.touch.id);
      if (!t) return;
      ev.preventDefault();
      updateKnob(t.clientX, t.clientY);
    };

    const onUp = (ev) => {
      const t = [...ev.changedTouches].find(x => x.identifier === this.touch.id);
      if (!t) return;
      ev.preventDefault();
      this.touch.active = false;
      this.touch.id = null;
      this.touch.steer = 0;
      this.touch.throttle = 0;
      this.touch.brake = 0;
      stickKnob.style.transform = `translate(-50%,-50%)`;
    };

    stickBase.addEventListener("touchstart", onDown, { passive: false });
    stickBase.addEventListener("touchmove", onMove, { passive: false });
    stickBase.addEventListener("touchend", onUp, { passive: false });
    stickBase.addEventListener("touchcancel", onUp, { passive: false });

    btnTouchNitro.addEventListener("touchstart", (e) => { e.preventDefault(); this.touch.nitro = true; }, { passive: false });
    btnTouchNitro.addEventListener("touchend", (e) => { e.preventDefault(); this.touch.nitro = false; }, { passive: false });
    btnTouchNitro.addEventListener("touchcancel", (e) => { e.preventDefault(); this.touch.nitro = false; }, { passive: false });

    btnTouchBrake.addEventListener("touchstart", (e) => { e.preventDefault(); this.touch.brake = 1; }, { passive: false });
    btnTouchBrake.addEventListener("touchend", (e) => { e.preventDefault(); this.touch.brake = 0; }, { passive: false });
    btnTouchBrake.addEventListener("touchcancel", (e) => { e.preventDefault(); this.touch.brake = 0; }, { passive: false });
  }

  _bindGamepad() {
    window.addEventListener("gamepadconnected", (e) => {
      this.gamepad.index = e.gamepad.index;
    });

    window.addEventListener("gamepaddisconnected", (e) => {
      if (this.gamepad.index === e.gamepad.index) this.gamepad.index = null;
    });
  }

  poll() {
    this._pollGamepad();

    const left = this.keys.has("ArrowLeft") || this.keys.has("KeyA");
    const right = this.keys.has("ArrowRight") || this.keys.has("KeyD");
    const up = this.keys.has("ArrowUp") || this.keys.has("KeyW");
    const down = this.keys.has("ArrowDown") || this.keys.has("KeyS");

    const steerK = (right ? 1 : 0) - (left ? 1 : 0);
    const throttleK = up ? 1 : 0;
    const brakeK = down ? 1 : 0;

    const nitroK = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight");
    const driftK = this.keys.has("ControlLeft") || this.keys.has("ControlRight");

    const pauseDown = this.keys.has("Space");
    const pausePressed = pauseDown && !this._pauseLatch;
    this._pauseLatch = pauseDown;

    const steer = chooseAxis(this.gamepad.steer, this.touch.steer, steerK);
    const throttle = chooseAxis(this.gamepad.throttle, this.touch.throttle, throttleK);
    const brake = chooseAxis(this.gamepad.brake, this.touch.brake, brakeK);

    const nitro = this.gamepad.nitro || this.touch.nitro || nitroK;
    const drift = this.gamepad.drift || driftK;

    return {
      steer: clamp(steer, -1, 1),
      throttle: clamp(throttle, 0, 1),
      brake: clamp(brake, 0, 1),
      nitro,
      drift,
      pausePressed,
      _nitroSeconds: 0,
    };
  }

  _pollGamepad() {
    if (this.gamepad.index === null) return;
    const pads = navigator.getGamepads?.();
    const gp = pads?.[this.gamepad.index];
    if (!gp) return;

    const ax0 = deadZone(gp.axes[0] ?? 0);
    const ax1 = deadZone(gp.axes[1] ?? 0);

    const lt = gp.buttons[6]?.value ?? 0;
    const rt = gp.buttons[7]?.value ?? 0;

    this.gamepad.steer = ax0;
    this.gamepad.throttle = clamp(rt > 0.05 ? rt : (-ax1 > 0.2 ? -ax1 : 0), 0, 1);
    this.gamepad.brake = clamp(lt > 0.05 ? lt : (ax1 > 0.2 ? ax1 : 0), 0, 1);

    this.gamepad.nitro = gp.buttons[0]?.pressed || gp.buttons[1]?.pressed;
    this.gamepad.drift = gp.buttons[4]?.pressed || gp.buttons[5]?.pressed;
  }
}

function deadZone(v, dz = 0.12) {
  if (Math.abs(v) < dz) return 0;
  return v;
}

function chooseAxis(a, b, c) {
  const aa = Math.abs(a), bb = Math.abs(b), cc = Math.abs(c);
  if (aa >= bb && aa >= cc) return a;
  if (bb >= aa && bb >= cc) return b;
  return c;
}
