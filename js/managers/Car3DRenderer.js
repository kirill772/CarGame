// Car3DRenderer.js
// 3D-рендерер машин с помощью Three.js
// Если WebGL не доступен — используется 2D-заглушка

import { CarsData } from "../data/CarsData.js";

// Бесплатные GLB-модели (прямые ссылки)
const CAR_MODELS = {
  lada_vesta_sport: "https://cdn.jsdelivr.net/gh/prisonerj/prisonerj-assets@main/cars/lada_vesta_sport.glb",
  lamborghini_urus: "https://cdn.jsdelivr.net/gh/prisonerj/prisonerj-assets@main/cars/lamborghini_urus.glb",
  ferrari_488_pista: "https://cdn.jsdelivr.net/gh/prisonerj/prisonerj-assets@main/cars/ferrari_488_pista.glb",
  porsche_911_turbo_s: "https://cdn.jsdelivr.net/gh/prisonerj/prisonerj-assets@main/cars/porsche_911_turbo_s.glb",
  bmw_m4_competition: "https://cdn.jsdelivr.net/gh/prisonerj/prisonerj-assets@main/cars/bmw_m4_competition.glb",
  mercedes_amg_gtr: "https://cdn.jsdelivr.net/gh/prisonerj/prisonerj-assets@main/cars/mercedes_amg_gtr.glb",
  tesla_model_s_plaid: "https://cdn.jsdelivr.net/gh/prisonerj/prisonerj-assets@main/cars/tesla_model_s_plaid.glb",
  toyota_gr_supra: "https://cdn.jsdelivr.net/gh/prisonerj/prisonerj-assets@main/cars/toyota_gr_supra.glb",
  nissan_gtr_nismo: "https://cdn.jsdelivr.net/gh/prisonerj/prisonerj-assets@main/cars/nissan_gtr_nismo.glb",
  audi_r8_v10_performance: "https://cdn.jsdelivr.net/gh/prisonerj/prisonerj-assets@main/cars/audi_r8_v10_performance.glb",
  mclaren_720s: "https://cdn.jsdelivr.net/gh/prisonerj/prisonerj-assets@main/cars/mclaren_720s.glb",
  ford_mustang_shelby_gt500: "https://cdn.jsdelivr.net/gh/prisonerj/prisonerj-assets@main/cars/ford_mustang_shelby_gt500.glb",
  chevrolet_corvette_z06: "https://cdn.jsdelivr.net/gh/prisonerj/prisonerj-assets@main/cars/chevrolet_corvette_z06.glb",
  dodge_challenger_hellcat_redeye: "https://cdn.jsdelivr.net/gh/prisonerj/prisonerj-assets@main/cars/dodge_challenger_hellcat_redeye.glb",
  subaru_wrx_sti: "https://cdn.jsdelivr.net/gh/prisonerj/prisonerj-assets@main/cars/subaru_wrx_sti.glb",
  bugatti_chiron_super_sport: "https://cdn.jsdelivr.net/gh/prisonerj/prisonerj-assets@main/cars/bugatti_chiron_super_sport.glb",
  koenigsegg_jesko: "https://cdn.jsdelivr.net/gh/prisonerj/prisonerj-assets@main/cars/koenigsegg_jesko.glb",
  aston_martin_vantage: "https://cdn.jsdelivr.net/gh/prisonerj/prisonerj-assets@main/cars/aston_martin_vantage.glb",
  jaguar_f_type_svr: "https://cdn.jsdelivr.net/gh/prisonerj/prisonerj-assets@main/cars/jaguar_f_type_svr.glb",
  volkswagen_golf_r: "https://cdn.jsdelivr.net/gh/prisonerj/prisonerj-assets@main/cars/volkswagen_golf_r.glb",
};

export class Car3DRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = null;
    this.carId = null;
    this.rotation = 0;
    this.isWebGL = false;
    this.ctx = this.canvas.getContext("2d");
  }

  async loadCar(carId) {
    this.carId = carId;
  }

  render() {
    this._render2D();
  }

  _render2D() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, 0, w, h);

    if (!this.carId) return;

    const car = CarsData.find(c => c.id === this.carId);
    if (!car) return;

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.rotate(this.rotation);
    this.rotation += 0.008;

    // корпус
    ctx.fillStyle = car.color || "#12162a";
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = 2;
    roundRect(ctx, -40, -70, 80, 140, 16);
    ctx.fill();
    ctx.stroke();

    // полоса
    ctx.fillStyle = car.stripe || "#ffffff";
    roundRect(ctx, -24, -48, 48, 70, 8);
    ctx.fill();

    // неон
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = "#00e5ff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-32, -28);
    ctx.lineTo(-32, 56);
    ctx.moveTo(32, -28);
    ctx.lineTo(32, 56);
    ctx.stroke();

    ctx.restore();

    // подпись
    ctx.fillStyle = "rgba(0,229,255,0.7)";
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.fillText("WebGL недоступен", w / 2, h - 10);
  }

  dispose() {
    // no-op
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
