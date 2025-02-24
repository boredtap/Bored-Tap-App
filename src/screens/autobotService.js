// autobotService.js
const BASE_MAX_ELECTRIC_BOOST = 1000;
const RECHARGE_TIMES = {
  0: 3000,
  1: 2500,
  2: 2000,
  3: 1500,
  4: 1000,
  5: 500,
};
const AUTOBOT_RATE = 10000 / 3600; // Coins per second
const AUTOBOT_MAX_HOURS = 24;

let electricBoost = parseInt(localStorage.getItem("electricBoost")) || BASE_MAX_ELECTRIC_BOOST;
let totalTaps = 0;
let maxElectricBoost = BASE_MAX_ELECTRIC_BOOST;
let rechargeIntervalMs = (RECHARGE_TIMES[0] / BASE_MAX_ELECTRIC_BOOST) * 1000;
let tapBoostLevel = 0;
let hasAutobot = false;
let lastActiveTime = Date.now();
let listeners = [];

const applyExtraBoosterEffects = (boosters) => {
  let newMaxElectricBoost = BASE_MAX_ELECTRIC_BOOST;
  let newRechargeTime = RECHARGE_TIMES[0];
  let newTapBoostLevel = 0;
  let autobotOwned = false;

  boosters.forEach((booster) => {
    switch (booster.title.toLowerCase()) {
      case "boost":
        newTapBoostLevel = booster.rawLevel;
        break;
      case "multiplier":
        newMaxElectricBoost += 500 * booster.rawLevel;
        break;
      case "recharging speed":
        newRechargeTime = RECHARGE_TIMES[booster.rawLevel] || RECHARGE_TIMES[0];
        break;
      case "auto-bot tapping":
        autobotOwned = booster.rawLevel !== "-";
        break;
      default:
        break;
    }
  });

  maxElectricBoost = newMaxElectricBoost;
  rechargeIntervalMs = (newRechargeTime / newMaxElectricBoost) * 1000;
  tapBoostLevel = newTapBoostLevel;
  hasAutobot = autobotOwned;
  electricBoost = Math.min(electricBoost, maxElectricBoost);
};

const updateAutobotEarnings = () => {
  if (!hasAutobot) return;

  const now = Date.now();
  const elapsedSeconds = (now - lastActiveTime) / 1000;
  const maxSeconds = AUTOBOT_MAX_HOURS * 3600;
  const effectiveSeconds = Math.min(elapsedSeconds, maxSeconds);
  const earnedCoins = Math.floor(effectiveSeconds * AUTOBOT_RATE);

  if (earnedCoins > 0) {
    totalTaps += earnedCoins;
    localStorage.setItem("autobotCoins", totalTaps);
    notifyListeners();
  }
};

const rechargeEnergy = (isFullEnergyActive) => {
  if (electricBoost < maxElectricBoost && !isFullEnergyActive) {
    electricBoost = Math.min(electricBoost + 1, maxElectricBoost);
    localStorage.setItem("electricBoost", electricBoost);
    notifyListeners();
  }
};

const notifyListeners = () => {
  listeners.forEach((listener) => listener({ electricBoost, totalTaps }));
};

const updateLoop = () => {
  const savedBoosters = JSON.parse(localStorage.getItem("dailyBoosters") || "{}");
  const isFullEnergyActive = savedBoosters.fullEnergy?.isActive || false;

  updateAutobotEarnings();
  rechargeEnergy(isFullEnergyActive);

  requestAnimationFrame(updateLoop);
};

requestAnimationFrame(updateLoop);

export const autobotService = {
  initialize: (boosters) => {
    applyExtraBoosterEffects(boosters);
    totalTaps = parseInt(localStorage.getItem("autobotCoins")) || 0;
  },
  getState: () => ({
    electricBoost,
    maxElectricBoost,
    rechargeIntervalMs,
    tapBoostLevel,
    hasAutobot,
  }),
  setTapCoins: (coins) => {
    totalTaps = coins;
    localStorage.setItem("autobotCoins", totalTaps);
    notifyListeners();
  },
  tap: (fingersCount, tapperBoostActive) => {
    const multiplier = (tapperBoostActive ? 2 : 1) + tapBoostLevel;
    totalTaps += fingersCount * multiplier;
    electricBoost = Math.max(electricBoost - fingersCount, 0);
    localStorage.setItem("electricBoost", electricBoost);
    localStorage.setItem("autobotCoins", totalTaps);
    lastActiveTime = Date.now();
    localStorage.setItem("lastActiveTime", lastActiveTime);
    notifyListeners();
    return fingersCount * multiplier;
  },
  fullEnergyTap: (fingersCount, tapperBoostActive) => {
    const multiplier = (tapperBoostActive ? 2 : 1) + tapBoostLevel;
    totalTaps += fingersCount * multiplier;
    electricBoost = maxElectricBoost;
    localStorage.setItem("electricBoost", electricBoost);
    localStorage.setItem("autobotCoins", totalTaps);
    lastActiveTime = Date.now();
    localStorage.setItem("lastActiveTime", lastActiveTime);
    notifyListeners();
    return fingersCount * multiplier;
  },
  subscribe: (callback) => {
    listeners.push(callback);
    return () => {
      listeners = listeners.filter((l) => l !== callback);
    };
  },
};