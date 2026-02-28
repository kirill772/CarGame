// AchievementsData.js
// 50+ достижений. Часть — с прогрессом, часть — событийные.

export const AchievementsData = [
  { id: "dist_1km", title: "Разогрев", desc: "Проедь суммарно 1 км", type: "totalDistance", target: 1000, reward: 30 },
  { id: "dist_5km", title: "Уже быстрее", desc: "Проедь суммарно 5 км", type: "totalDistance", target: 5000, reward: 60 },
  { id: "dist_20km", title: "Ночной рейсер", desc: "Проедь суммарно 20 км", type: "totalDistance", target: 20000, reward: 140 },
  { id: "dist_100km", title: "Легенда неона", desc: "Проедь суммарно 100 км", type: "totalDistance", target: 100000, reward: 500 },

  { id: "ovt_10", title: "Слалом", desc: "Сделай 10 обгонов", type: "totalOvertakes", target: 10, reward: 40 },
  { id: "ovt_50", title: "Поток", desc: "Сделай 50 обгонов", type: "totalOvertakes", target: 50, reward: 110 },
  { id: "ovt_200", title: "Вне закона", desc: "Сделай 200 обгонов", type: "totalOvertakes", target: 200, reward: 340 },

  { id: "nitro_10s", title: "Впрыск", desc: "Используй нитро суммарно 10 секунд", type: "totalNitroSeconds", target: 10, reward: 45 },
  { id: "nitro_60s", title: "Турбо-режим", desc: "Используй нитро суммарно 60 секунд", type: "totalNitroSeconds", target: 60, reward: 140 },
  { id: "nitro_300s", title: "Неон в крови", desc: "Используй нитро суммарно 300 секунд", type: "totalNitroSeconds", target: 300, reward: 520 },

  { id: "crash_1", title: "Ой", desc: "Разбейся 1 раз", type: "totalCrashes", target: 1, reward: 10 },
  { id: "crash_25", title: "Жёсткий опыт", desc: "Разбейся 25 раз", type: "totalCrashes", target: 25, reward: 120 },
  { id: "crash_100", title: "Металл устал", desc: "Разбейся 100 раз", type: "totalCrashes", target: 100, reward: 260 },

  { id: "race_1", title: "Первый старт", desc: "Пройди 1 гонку в карьере", type: "totalRaces", target: 1, reward: 60 },
  { id: "race_10", title: "Контракт подписан", desc: "Пройди 10 гонок в карьере", type: "totalRaces", target: 10, reward: 240 },
  { id: "win_1", title: "Победа!", desc: "Выиграй 1 гонку в карьере", type: "totalWins", target: 1, reward: 120 },
  { id: "win_10", title: "Чемпион", desc: "Выиграй 10 гонок в карьере", type: "totalWins", target: 10, reward: 520 },

  { id: "coins_500", title: "Первые монеты", desc: "Заработай 500 Neon Coins", type: "totalCoinsEarned", target: 500, reward: 80 },
  { id: "coins_5000", title: "Кошелёк светится", desc: "Заработай 5000 Neon Coins", type: "totalCoinsEarned", target: 5000, reward: 360 },
  { id: "coins_50000", title: "Неоновый магнат", desc: "Заработай 50000 Neon Coins", type: "totalCoinsEarned", target: 50000, reward: 1200 },

  { id: "buy_first_car", title: "Новый ключ", desc: "Купи новую машину", type: "event", event: "buyCar", reward: 150 },
  { id: "upgrade_1", title: "Тюнинг-старт", desc: "Сделай 1 апгрейд", type: "event", event: "upgrade", reward: 60 },
  { id: "upgrade_15", title: "Мастер гаража", desc: "Сделай 15 апгрейдов", type: "counterEvent", event: "upgrade", target: 15, reward: 240 },
  { id: "skin_change", title: "Новый свет", desc: "Смени неоновый цвет", type: "event", event: "skin", reward: 50 },

  { id: "endless_neon_city", title: "Городской поток", desc: "Endless на трассе “Неоновый город”", type: "event", event: "endlessTrack_neon_city", reward: 70 },
  { id: "endless_mountain_pass", title: "Серпантин", desc: "Endless на трассе “Горное шоссе”", type: "event", event: "endlessTrack_mountain_pass", reward: 70 },
  { id: "endless_cyber_tokyo", title: "Синтвейв Токио", desc: "Endless на трассе “Кибер-Токио”", type: "event", event: "endlessTrack_cyber_tokyo", reward: 70 },
  { id: "endless_desert_run", title: "Пески и неон", desc: "Endless на трассе “Пустыня”", type: "event", event: "endlessTrack_desert_run", reward: 70 },
  { id: "endless_night_highway", title: "Ночной хайвей", desc: "Endless на трассе “Ночной хайвей”", type: "event", event: "endlessTrack_night_highway", reward: 70 },
  { id: "endless_mega_city", title: "Мегаполис", desc: "Endless на трассе “Кибер-мегаполис”", type: "event", event: "endlessTrack_mega_city", reward: 70 },

  { id: "pu_nitro", title: "Баллон", desc: "Подбери “Нитро”", type: "event", event: "powerup_nitro", reward: 35 },
  { id: "pu_shield", title: "Силовое поле", desc: "Подбери “Щит”", type: "event", event: "powerup_shield", reward: 35 },
  { id: "pu_repair", title: "Пит-стоп", desc: "Подбери “Ремонт”", type: "event", event: "powerup_repair", reward: 35 },
  { id: "pu_slowmo", title: "Слоумо", desc: "Подбери “Слоумо”", type: "event", event: "powerup_slowmo", reward: 35 },
  { id: "pu_magnet", title: "Притяжение", desc: "Подбери “Магнит”", type: "event", event: "powerup_magnet", reward: 35 },

  { id: "survive_60", title: "Минутка", desc: "Продержись 60 секунд в Endless", type: "bestSurvive", target: 60, reward: 90 },
  { id: "survive_180", title: "Три минуты", desc: "Продержись 180 секунд в Endless", type: "bestSurvive", target: 180, reward: 200 },
  { id: "survive_600", title: "Ночной марафон", desc: "Продержись 600 секунд в Endless", type: "bestSurvive", target: 600, reward: 520 },

  { id: "play_10m", title: "Влился", desc: "Сыграй суммарно 10 минут", type: "totalPlayTime", target: 10 * 60, reward: 60 },
  { id: "play_60m", title: "В деле", desc: "Сыграй суммарно 60 минут", type: "totalPlayTime", target: 60 * 60, reward: 260 },
  { id: "play_240m", title: "Завис", desc: "Сыграй суммарно 240 минут", type: "totalPlayTime", target: 240 * 60, reward: 800 },

  { id: "endless_5km_best", title: "5 км без права на ошибку", desc: "Достигни 5 км в Endless", type: "endlessBestDistance", target: 5000, reward: 140 },
  { id: "endless_15km_best", title: "15 км", desc: "Достигни 15 км в Endless", type: "endlessBestDistance", target: 15000, reward: 360 },
  { id: "endless_30km_best", title: "30 км", desc: "Достигни 30 км в Endless", type: "endlessBestDistance", target: 30000, reward: 700 },

  { id: "coins_spend_1000", title: "Инвестор", desc: "Потрать 1000 монет", type: "counterEvent", event: "spendCoins", target: 1000, reward: 120 },
  { id: "coins_spend_10000", title: "Большая сделка", desc: "Потрать 10000 монет", type: "counterEvent", event: "spendCoins", target: 10000, reward: 520 },

  { id: "perfect_ride_120", title: "Чистый неон", desc: "120 секунд без столкновений", type: "bestNoCrash", target: 120, reward: 200 },
  { id: "perfect_ride_240", title: "Сверхконтроль", desc: "240 секунд без столкновений", type: "bestNoCrash", target: 240, reward: 420 },

  { id: "garage_spin", title: "Покрутим", desc: "Поверни машину в гараже", type: "event", event: "garageRotate", reward: 30 },
  { id: "shop_open", title: "Шоппинг", desc: "Открой магазин", type: "event", event: "openShop", reward: 20 },
  { id: "ach_open", title: "Коллекционер", desc: "Открой список достижений", type: "event", event: "openAchievements", reward: 20 },

  { id: "tracks_all", title: "Тур по трассам", desc: "Сыграй Endless на всех 6 трассах", type: "counterEvent", event: "endlessTrack", target: 6, reward: 300 },
  { id: "nitro_chain", title: "Цепной ускоритель", desc: "Используй нитро 5 раз за заезд", type: "counterEvent", event: "nitroUse", target: 5, reward: 120 },
  { id: "overtake_chain", title: "Комбо обгонов", desc: "Сделай 8 обгонов за 10 сек", type: "event", event: "overtakeCombo", reward: 180 },
  { id: "rivals_battle", title: "Битва с соперниками", desc: "Финишируй в топ-3 в карьере", type: "event", event: "careerPodium", reward: 120 },
  { id: "career_master", title: "Карьерист", desc: "Выиграй гонку на каждой трассе", type: "counterEvent", event: "careerWinTrack", target: 6, reward: 600 },
];
