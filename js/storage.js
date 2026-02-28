// storage.js
// Сохранение прогресса в localStorage в JSON.

import { AUDIO, ECONOMY } from "./constants.js";
import { dayStamp } from "./utils.js";

const KEY = "neon_rush_save_v1";

export function makeDefaultSave() {
  return {
    version: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),

    wallet: {
      coins: 0,
    },

    garage: {
      selectedCarId: "lada_vesta_sport",
      selectedSkin: "#00e5ff",
      rotateYaw: 0,
    },

    ownedCars: {
      lada_vesta_sport: true,
    },

    upgrades: {
      lada_vesta_sport: {
        maxSpeed: 1,
        acceleration: 1,
        handling: 1,
        nitroPower: 1,
        durability: 1,
      },
    },

    perks: {
      coinBonus: 0,
      repairBonus: 0,
      nitroRegen: 0,
    },

    records: {
      endlessBestDistance: 0,
      careerBestTimeByTrack: {},
      endlessBestByTrack: {},
    },

    achievements: {},

    daily: {
      stamp: dayStamp(),
      missions: makeDailyMissions(),
      completed: {},
    },

    settings: {
      master: AUDIO.defaultMaster,
      music: AUDIO.defaultMusic,
      sfx: AUDIO.defaultSfx,
      showParticles: true,
      lowGraphics: false,
      vibration: true,
    },

    stats: {
      totalDistance: 0,
      totalCoinsEarned: 0,
      totalCrashes: 0,
      totalOvertakes: 0,
      totalNitroSeconds: 0,
      totalRaces: 0,
      totalWins: 0,
      totalPlayTime: 0,
      bestSurvive: 0,
      bestNoCrash: 0,
    },

    meta: {
      tutorialShown: false,
      lastSessionAt: 0,
      lastKnownCoinsPerSecondEndless: ECONOMY.coinsPerSecondEndless,
    },
  };
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return makeDefaultSave();
    const obj = JSON.parse(raw);

    if (!obj.version) obj.version = 1;
    if (!obj.wallet) obj.wallet = { coins: 0 };
    if (!obj.settings) obj.settings = { master: AUDIO.defaultMaster, music: AUDIO.defaultMusic, sfx: AUDIO.defaultSfx };
    if (!obj.stats) obj.stats = makeDefaultSave().stats;
    if (!obj.records) obj.records = makeDefaultSave().records;

    const stamp = dayStamp();
    if (!obj.daily || obj.daily.stamp !== stamp) {
      obj.daily = { stamp, missions: makeDailyMissions(), completed: {} };
    }

    return obj;
  } catch (e) {
    console.warn("Save load failed:", e);
    return makeDefaultSave();
  }
}

export function saveNow(save) {
  try {
    save.updatedAt = Date.now();
    localStorage.setItem(KEY, JSON.stringify(save));
  } catch (e) {
    console.warn("Save write failed:", e);
  }
}

export function hardResetSave() {
  localStorage.removeItem(KEY);
}

export function makeDailyMissions() {
  return [
    { id: "daily_distance_3km", title: "Проедь 3 км", type: "distance", target: 3000, reward: 90 },
    { id: "daily_overtake_20", title: "Сделай 20 обгонов", type: "overtake", target: 20, reward: 110 },
    { id: "daily_no_crash_90s", title: "90 секунд без аварий", type: "survive", target: 90, reward: 120 },
  ];
}
