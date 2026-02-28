// constants.js
// В этом файле — константы игры. Комментарии на русском по требованию ТЗ.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;
export const TARGET_FPS = 60;

export const DT_CAP = 1 / 20; // защита от “скачков” deltaTime при сворачивании вкладки

export const GAME_MODES = {
  CAREER: "career",
  ENDLESS: "endless",
};

export const SCREENS = {
  MENU: "menu",
  OVERLAY_LIST: "overlay_list",
  GAME: "game",
};

export const TRACKS = [
  { id: "neon_city", name: "Неоновый город ночью", theme: "city" },
  { id: "mountain_pass", name: "Горное шоссе", theme: "mountain" },
  { id: "cyber_tokyo", name: "Кибер-Токио", theme: "tokyo" },
  { id: "desert_run", name: "Пустыня", theme: "desert" },
  { id: "night_highway", name: "Ночной хайвей", theme: "highway" },
  { id: "mega_city", name: "Кибер-мегаполис", theme: "megacity" },
];

export const ROAD = {
  lanes: 3,
  laneWidth: 130,
  shoulder: 86,
  // перспектива: чем выше по экрану — тем уже дорога
  perspective: {
    topScale: 0.40,
    bottomScale: 1.18,
  },
  // частота сегментов трассы
  segmentLength: 36,
  // как быстро “едет мир” относительно скорости игрока
  scrollFactor: 1.0,
};

export const COLORS = {
  bg0: "#05060a",
  neonCyan: "#00e5ff",
  neonMagenta: "#ff2bd6",
  neonLime: "#a6ff00",
  text: "#e8f0ff",
  muted: "#9cb0d3",
  danger: "#ff3b5c",
  asphalt: "#050816",
  asphalt2: "#070b1e",
};

export const PLAYER = {
  // базовые множители: реальные машины будут задавать “характер”, но это — общий масштаб
  baseMaxSpeed: 980, // px/сек в мире (условно)
  baseAcceleration: 1080,
  baseHandling: 1.0,
  baseNitro: 1.0,
  baseDurability: 1.0,

  healthMax: 100,
  nitroMax: 100,

  // коэффициенты физики
  drag: 0.965,     // сопротивление (чем меньше — тем сильнее гасим скорость)
  lateralFriction: 0.88,
  driftGrip: 0.63, // меньший grip = проще срывать в дрифт
  bounce: 0.55,

  // штрафы при столкновениях
  crashSpeedLoss: 0.55,
  crashHpLoss: 22,
  crashCoinPenalty: 18,
};

export const TRAFFIC = {
  poolSize: 50,           // требование: до 50 машин одновременно
  spawnPerSecond: 0.8,    // реже спавн
  maxActive: 14,          // меньше машин на дороге
  minSpeed: 440,
  maxSpeed: 920,
  minSpawnGap: 320,       // минимальная дистанция между машинами при спавне
};

export const RIVALS = {
  count: 6,
  aiLookAhead: 240,
  aiLaneChangeRate: 1.6,
};

export const POWERUPS = {
  spawnPerSecond: 0.22,
  lifeTime: 12, // секунды
  types: [
    { id: "nitro", name: "Нитро", color: "#00e5ff" },
    { id: "shield", name: "Щит", color: "#a6ff00" },
    { id: "repair", name: "Ремонт", color: "#19ff9b" },
    { id: "slowmo", name: "Слоумо", color: "#ff2bd6" },
    { id: "magnet", name: "Магнит монет", color: "#ffd000" },
  ],
};

export const ECONOMY = {
  // базовые доходы
  coinsPerSecondEndless: 2.0,
  coinsPerKm: 24,
  coinsPerOvertake: 8,
  coinsWinCareer: 260,
  coinsPodiumCareer: 160,

  // улучшения (уровни 1..5). Стоимость растёт.
  upgradeCosts: [0, 120, 260, 520, 920, 1400], // индекс = уровень
  upgradeDeltaPerLevel: 0.08, // +8% к параметру за уровень
};

export const AUDIO = {
  defaultMaster: 0.75,
  defaultMusic: 0.35,
  defaultSfx: 0.85,
};

export const UI = {
  toastTime: 2.6,
};
