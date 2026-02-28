// GameCar3D.js
// 3D-рендерер машин на трассе (игрок, трафик, соперники)

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

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

const cache = new Map();

export async function loadGameCarModel(carId) {
  if (cache.has(carId)) return cache.get(carId);
  const url = CAR_MODELS[carId];
  if (!url) return null;
  try {
    const gltf = await new GLTFLoader().loadAsync(url);
    const model = gltf.scene;
    model.scale.set(0.6, 0.6, 0.6);
    // кешируем
    cache.set(carId, model);
    return model;
  } catch (e) {
    console.warn("Failed to load car model:", carId, e);
    return null;
  }
}

// Простая 3D-отрисовка машины на 2D-канвасе (без Three.js для производительности)
export function renderCar3D(ctx, x, y, carId, skin = "#00e5ff", scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // корпус
  ctx.fillStyle = "#12162a";
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.lineWidth = 2;
  roundRect(ctx, -20, -36, 40, 72, 8);
  ctx.fill();
  ctx.stroke();

  // полоса
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, -12, -24, 24, 36, 4);
  ctx.fill();

  // неон
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = skin;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-16, -18);
  ctx.lineTo(-16, 30);
  ctx.moveTo(16, -18);
  ctx.lineTo(16, 30);
  ctx.stroke();

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
