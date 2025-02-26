import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./Dashboard.css";

// Configurable constants for game mechanics
const BASE_MAX_ELECTRIC_BOOST = 1000;
const RECHARGE_TIMES = { 0: 3000, 1: 2500, 2: 2000, 3: 1500, 4: 1000, 5: 500 }; // Recharge times in seconds
const AUTOBOT_TAP_INTERVAL = 1000; // 1 tap per second
const TAP_DEBOUNCE_DELAY = 200; // Debounce delay to prevent double taps
const LOW_ENERGY_THRESHOLD = 0.1; // 10% of maxElectricBoost triggers warning

const Dashboard = () => {
  const navigate = useNavigate();

  // State management for user data, boosts, and UI feedback
  const [telegramData, setTelegramData] = useState({
    telegram_user_id: "",
    username: "User",
    image_url: "",
  });
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [totalTaps, setTotalTaps] = useState(0);
  const [electricBoost, setElectricBoost] = useState(() => {
    const savedBoost = localStorage.getItem("electricBoost");
    return savedBoost ? parseFloat(savedBoost) : BASE_MAX_ELECTRIC_BOOST;
  });
  const [maxElectricBoost, setMaxElectricBoost] = useState(() => {
    const savedMax = localStorage.getItem("maxElectricBoost");
    return savedMax ? parseInt(savedMax) : BASE_MAX_ELECTRIC_BOOST;
  });
  const [tapBoostLevel, setTapBoostLevel] = useState(() => {
    const savedLevel = localStorage.getItem("tapBoostLevel");
    return savedLevel ? parseInt(savedLevel) : 0;
  });
  const [rechargingSpeedLevel, setRechargingSpeedLevel] = useState(() => {
    const savedLevel = localStorage.getItem("rechargingSpeedLevel");
    return savedLevel ? parseInt(savedLevel) : 0;
  });
  const [hasAutobot, setHasAutobot] = useState(() => {
    const savedAutobot = localStorage.getItem("hasAutobot");
    return savedAutobot === "true";
  });
  const [tapAnimation, setTapAnimation] = useState(false);
  const [boostAnimation, setBoostAnimation] = useState(false);
  const [tapEffects, setTapEffects] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [dailyBoosters, setDailyBoosters] = useState(() => {
    const saved = localStorage.getItem("dailyBoosters");
    return saved
      ? JSON.parse(saved)
      : {
          tapperBoost: { usesLeft: 3, isActive: false, endTime: null, resetTime: null },
          fullEnergy: { usesLeft: 3, resetTime: null },
        };
  });
  const [showLowEnergyWarning, setShowLowEnergyWarning] = useState(false);

  // Refs for tracking intervals, audio, and tap processing
  const tapCountSinceLastUpdate = useRef(0);
  const autobotInterval = useRef(null);
  const rechargeInterval = useRef(null);
  const tapTimeout = useRef(null);
  const tapSoundRef = useRef(new Audio(`${process.env.PUBLIC_URL}/tap.mp3`));
  const isTapProcessed = useRef(false);

  // Initialize Telegram user data on mount
  useEffect(() => {
    const initTelegram = async () => {
      try {
        if (window.Telegram?.WebApp) {
          const user = window.Telegram.WebApp.initDataUnsafe.user;
          if (user) {
            setTelegramData({
              telegram_user_id: user.id,
              username: user.username || `User${user.id}`,
              image_url: user.photo_url || `${process.env.PUBLIC_URL}/profile-picture.png`,
            });
          }
        }
      } catch (err) {
        console.error("Error syncing Telegram data:", err);
        setError("Failed to initialize Telegram data");
      }
    };
    initTelegram();
  }, []);

  // Fetch user profile from backend with auth handling
  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("No access token found. Please log in.");
      navigate("/splash");
      return;
    }
    try {
      const response = await fetch("https://bt-coins.onrender.com/user/profile", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!response.ok) {
        if (response.status === 401) {
          setError("Session expired. Please log in again.");
          localStorage.removeItem("accessToken");
          navigate("/splash");
          return;
        }
        throw new Error(`Failed to fetch profile: ${await response.text()}`);
      }
      const data = await response.json();
      setProfile(data);
      setTotalTaps(data.total_coins || 0);
      setCurrentStreak(data.streak?.current_streak || 0);

      if (data.total_coins === 0) {
        localStorage.removeItem("dailyBoosters");
        localStorage.removeItem("extraBoosters");
        localStorage.removeItem("electricBoost");
        localStorage.removeItem("maxElectricBoost");
        localStorage.removeItem("tapBoostLevel");
        localStorage.removeItem("rechargingSpeedLevel");
        localStorage.removeItem("hasAutobot");
        localStorage.removeItem("lastActiveTime");
        localStorage.removeItem("lastBoostUpdateTime");
        setDailyBoosters({
          tapperBoost: { usesLeft: 3, isActive: false, endTime: null, resetTime: null },
          fullEnergy: { usesLeft: 3, resetTime: null },
        });
        setElectricBoost(BASE_MAX_ELECTRIC_BOOST);
        setMaxElectricBoost(BASE_MAX_ELECTRIC_BOOST);
        setTapBoostLevel(0);
        setRechargingSpeedLevel(0);
        setHasAutobot(false);
        setTotalTaps(0);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [navigate]);

  // Apply extra booster effects
  const applyExtraBoosterEffects = useCallback(
    (boosters) => {
      let newMaxElectricBoost = BASE_MAX_ELECTRIC_BOOST;
      let newTapBoostLevel = 0;
      let newRechargingSpeedLevel = 0;
      let autobotOwned = false;

      boosters.forEach((booster) => {
        switch (booster.title.toLowerCase()) {
          case "boost":
            newTapBoostLevel = parseInt(booster.rawLevel) || 0;
            break;
          case "multiplier":
            newMaxElectricBoost += 500 * (parseInt(booster.rawLevel) || 0);
            break;
          case "recharging speed":
            newRechargingSpeedLevel = parseInt(booster.rawLevel) || 0;
            break;
          case "auto-bot tapping":
            autobotOwned = booster.rawLevel !== "-";
            break;
          default:
            break;
        }
      });

      setMaxElectricBoost(newMaxElectricBoost);
      localStorage.setItem("maxElectricBoost", newMaxElectricBoost);
      setTapBoostLevel(newTapBoostLevel);
      localStorage.setItem("tapBoostLevel", newTapBoostLevel);
      setRechargingSpeedLevel(newRechargingSpeedLevel);
      localStorage.setItem("rechargingSpeedLevel", newRechargingSpeedLevel);
      setHasAutobot(autobotOwned);
      localStorage.setItem("hasAutobot", autobotOwned);
      setElectricBoost((prev) => Math.min(prev, newMaxElectricBoost));
      localStorage.setItem("electricBoost", Math.min(electricBoost, newMaxElectricBoost));
    },
    [electricBoost]
  );

  // Handle profile fetch and booster events
  useEffect(() => {
    fetchProfile();

    const handleBoosterUpgraded = () => {
      const savedBoosters = localStorage.getItem("extraBoosters");
      if (savedBoosters) {
        applyExtraBoosterEffects(JSON.parse(savedBoosters));
        fetchProfile();
      }
    };
    window.addEventListener("boosterUpgraded", handleBoosterUpgraded);

    window.addEventListener("fullEnergyClaimed", () => {
      setElectricBoost(maxElectricBoost);
      localStorage.setItem("electricBoost", maxElectricBoost);
      localStorage.setItem("lastBoostUpdateTime", Date.now());
    });

    const lastUpdateTime = localStorage.getItem("lastBoostUpdateTime");
    const currentBoost = parseFloat(localStorage.getItem("electricBoost")) || BASE_MAX_ELECTRIC_BOOST;
    if (lastUpdateTime && currentBoost < maxElectricBoost) {
      const timeElapsed = (Date.now() - parseInt(lastUpdateTime)) / 1000;
      const level = parseInt(localStorage.getItem("rechargingSpeedLevel") || "0");
      const rechargeTime = RECHARGE_TIMES[level];
      const rechargeRate = maxElectricBoost / rechargeTime;
      const rechargeAmount = timeElapsed * rechargeRate;
      setElectricBoost(Math.min(currentBoost + rechargeAmount, maxElectricBoost));
      localStorage.setItem("electricBoost", Math.min(currentBoost + rechargeAmount, maxElectricBoost));
    }
    localStorage.setItem("lastBoostUpdateTime", Date.now());

    const savedBoosters = localStorage.getItem("extraBoosters");
    if (savedBoosters) applyExtraBoosterEffects(JSON.parse(savedBoosters));

    return () => {
      window.removeEventListener("boosterUpgraded", handleBoosterUpgraded);
      window.removeEventListener("fullEnergyClaimed", () => {});
    };
  }, [fetchProfile, maxElectricBoost, applyExtraBoosterEffects]);

  // Simulate offline autobot gains
  useEffect(() => {
    if (hasAutobot) {
      const lastActive = localStorage.getItem("lastActiveTime");
      if (lastActive) {
        const timePassed = (Date.now() - parseInt(lastActive)) / 1000;
        const tapsEarned = Math.floor(timePassed);
        const coinsEarned = tapsEarned * (1 + tapBoostLevel);
        setTotalTaps((prev) => prev + coinsEarned);
        tapCountSinceLastUpdate.current += coinsEarned;
      }
    }
    localStorage.setItem("lastActiveTime", Date.now());
  }, [hasAutobot, tapBoostLevel]);

  // Memoize updateBackend to include in handleTap dependencies
  const updateBackend = useCallback(async () => {
    if (tapCountSinceLastUpdate.current === 0) return;
    const tapsToSync = tapCountSinceLastUpdate.current;
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No access token found. Please log in.");
        navigate("/splash");
        return;
      }
      const response = await fetch(
        `https://bt-coins.onrender.com/update-coins?coins=${tapsToSync}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        if (response.status === 401) {
          setError("Session expired. Please log in again.");
          localStorage.removeItem("accessToken");
          navigate("/splash");
          return;
        }
        throw new Error(`Failed to sync coins: ${await response.text()}`);
      }
      const data = await response.json();
      if (data.total_coins >= 0) {
        setTotalTaps(data.total_coins);
        tapCountSinceLastUpdate.current = 0;
      }
    } catch (err) {
      console.error("Error syncing with backend:", err);
      setError(err.message);
    }
  }, [navigate, setError, setTotalTaps]); // Dependencies for updateBackend

  // Autobot tapping interval
  useEffect(() => {
    if (hasAutobot) {
      if (autobotInterval.current) clearInterval(autobotInterval.current);
      autobotInterval.current = setInterval(() => {
        const multiplier = (dailyBoosters.tapperBoost.isActive ? 2 : 1) + tapBoostLevel;
        setTotalTaps((prev) => prev + multiplier);
        tapCountSinceLastUpdate.current += multiplier;
        updateBackend();
      }, AUTOBOT_TAP_INTERVAL);
    }
    return () => {
      if (autobotInterval.current) clearInterval(autobotInterval.current);
    };
  }, [hasAutobot, dailyBoosters.tapperBoost.isActive, tapBoostLevel, updateBackend]);

  // Energy recharge with dynamic speed
  useEffect(() => {
    if (rechargeInterval.current) clearInterval(rechargeInterval.current);
    const rechargeTime = RECHARGE_TIMES[rechargingSpeedLevel] || RECHARGE_TIMES[0];
    const rechargeRate = maxElectricBoost / (rechargeTime * 1000);

    rechargeInterval.current = setInterval(() => {
      setElectricBoost((prev) => {
        if (prev < maxElectricBoost) {
          const newBoost = Math.min(prev + rechargeRate * 1000, maxElectricBoost);
          localStorage.setItem("electricBoost", newBoost);
          localStorage.setItem("lastBoostUpdateTime", Date.now());
          setShowLowEnergyWarning(newBoost < maxElectricBoost * LOW_ENERGY_THRESHOLD);
          return newBoost;
        }
        setShowLowEnergyWarning(false);
        return prev;
      });
    }, 1000);
    return () => clearInterval(rechargeInterval.current);
  }, [maxElectricBoost, rechargingSpeedLevel]);

  // Handle tap events with multiplier and animations
  const handleTap = useCallback(
    (event) => {
      event.preventDefault();
      if (electricBoost === 0 || isTapProcessed.current) return;

      isTapProcessed.current = true;
      const fingersCount = event.touches ? event.touches.length : 1;
      const tapperBoostActive = dailyBoosters.tapperBoost.isActive;
      const multiplier = (tapperBoostActive ? 2 : 1) + tapBoostLevel;
      const coinsAdded = fingersCount * multiplier;

      setTotalTaps((prev) => prev + coinsAdded);
      tapCountSinceLastUpdate.current += coinsAdded;

      setElectricBoost((prev) => {
        const newBoost = Math.max(prev - fingersCount, 0);
        localStorage.setItem("electricBoost", newBoost);
        setShowLowEnergyWarning(newBoost < maxElectricBoost * LOW_ENERGY_THRESHOLD);
        return newBoost;
      });
      localStorage.setItem("lastBoostUpdateTime", Date.now());

      setTapAnimation(true);
      setBoostAnimation(true);
      setTimeout(() => {
        setTapAnimation(false);
        setBoostAnimation(false);
      }, 500);

      const tapX = (event.touches ? event.touches[0].clientX : event.clientX) || 0;
      const tapY = (event.touches ? event.touches[0].clientY : event.clientY) || 0;
      const newTapEffect = { id: Date.now(), x: tapX, y: tapY, count: coinsAdded };
      setTapEffects((prevEffects) => [...prevEffects, newTapEffect]);
      setTimeout(() => setTapEffects((prev) => prev.filter((e) => e.id !== newTapEffect.id)), 1000);

      if (tapSoundRef.current.paused) {
        tapSoundRef.current.currentTime = 0;
        tapSoundRef.current.volume = 0.2;
        tapSoundRef.current.play().catch((err) => console.error("Audio playback error:", err));
      }

      tapTimeout.current = setTimeout(() => {
        isTapProcessed.current = false;
        updateBackend();
      }, TAP_DEBOUNCE_DELAY);
    },
    [electricBoost, dailyBoosters, tapBoostLevel, maxElectricBoost, updateBackend] // Include updateBackend
  );

  // Sync on component unmount
  useEffect(() => {
    return () => {
      if (tapCountSinceLastUpdate.current > 0) updateBackend();
    };
  }, [updateBackend]);

  // Manage daily booster timers
  useEffect(() => {
    const intervalId = setInterval(() => {
      setDailyBoosters((prev) => {
        const updated = { ...prev };
        if (updated.tapperBoost.isActive && Date.now() >= updated.tapperBoost.endTime) {
          updated.tapperBoost.isActive = false;
        }
        ["tapperBoost", "fullEnergy"].forEach((type) => {
          const booster = updated[type];
          if (booster.usesLeft === 0 && booster.resetTime && Date.now() >= booster.resetTime) {
            booster.usesLeft = 3;
            booster.resetTime = null;
            if (type === "tapperBoost") {
              booster.isActive = false;
              booster.endTime = null;
            }
          }
        });
        return updated;
      });
    }, 1000);
    localStorage.setItem("dailyBoosters", JSON.stringify(dailyBoosters));
    return () => clearInterval(intervalId);
  }, [dailyBoosters]);

  const handleTapEnd = (event) => event.preventDefault();

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error">{error}</div>
        <button onClick={() => navigate("/splash")}>Back to Login</button>
      </div>
    );
  }

  const { level = 1, level_name = "Beginner" } = profile || {};

  return (
    <div className="dashboard-container">
      <div className="profile1-streak-section">
        <div className="profile1-section" onClick={() => navigate("/profile-screen")}>
          <img src={telegramData.image_url} alt="Profile" className="profile1-picture" />
          <div className="profile1-info">
            <span className="profile1-username">{telegramData.username}</span>
            <span className="profile1-level">Lv. {level}. {level_name}</span>
          </div>
        </div>
        <div className="streak-section" onClick={() => navigate("/daily-streak-screen")}>
          <img src={`${process.env.PUBLIC_URL}/streak.png`} alt="Streak Icon" className="streak-icon" />
          <div className="streak-info">
            <span className="streak-text">Current Streak</span>
            <span className="streak-days">Day {currentStreak}</span>
          </div>
        </div>
      </div>

      <div className="frames-section">
        {[
          { name: "Rewards", icon: "reward.png", path: "/reward-screen" },
          { name: "Challenge", icon: "challenge.png", path: "/challenge-screen" },
          { name: "Clan", icon: "clan.png", path: "/clan-screen" },
          { name: "Leaderboard", icon: "leaderboard.png", path: "/leaderboard-screen" },
        ].map((frame, index) => (
          <div className="frame" key={index} onClick={() => navigate(frame.path)}>
            <img src={`${process.env.PUBLIC_URL}/${frame.icon}`} alt={`${frame.name} Icon`} className="frame-icon" />
            <span>{frame.name}</span>
          </div>
        ))}
      </div>

      <div className="total-taps-section">
        <p className="total-taps-text">Your Total Taps:</p>
        <div className="total-taps-count">
          <img className="tap-logo-small" src={`${process.env.PUBLIC_URL}/logo.png`} alt="Small Icon" />
          <span>{totalTaps.toLocaleString()}</span>
        </div>
        <div
          className={`big-tap-icon ${tapAnimation ? "tap-animation" : ""} ${
            dailyBoosters.tapperBoost.isActive ? "tapper-boost-active" : ""
          }`}
          onTouchStart={handleTap}
          onTouchEnd={handleTapEnd}
          onMouseDown={handleTap}
          onMouseUp={handleTapEnd}
        >
          <img className="tap-logo-big" src={`${process.env.PUBLIC_URL}/logo.png`} alt="Big Tap Icon" />
        </div>
        {tapEffects.map((effect) => (
          <div key={effect.id} className="tap-effect" style={{ top: effect.y, left: effect.x }}>
            +{effect.count}
          </div>
        ))}
      </div>

      <div className="electric-boost-section">
        <div className={`electric-value ${boostAnimation ? "boost-animation" : ""}`}>
          <img src={`${process.env.PUBLIC_URL}/electric-icon.png`} alt="Electric Icon" className="electric-icon" />
          <span>{Math.floor(electricBoost)}/{maxElectricBoost}</span>
          {showLowEnergyWarning && (
            <span className="low-energy-warning">⚠️ Low Energy</span>
          )}
        </div>
        <button className="boost-btn" onClick={() => navigate("/boost-screen")}>
          <img src={`${process.env.PUBLIC_URL}/boostx2.png`} alt="Boost Icon" className="boost-icon" />
          Boost
        </button>
      </div>

      <Navigation />
    </div>
  );
};

export default Dashboard;