import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./Dashboard.css";

// Configurable constants
const BASE_MAX_ELECTRIC_BOOST = 1000;
const RECHARGE_TIMES = { 0: 3000, 1: 2500, 2: 2000, 3: 1500, 4: 1000, 5: 500 }; // in seconds
const AUTOBOT_TAP_INTERVAL = 1000; // 1 tap per second
const SYNC_INTERVAL = 2000; // Sync every 2 seconds

const Dashboard = () => {
  const navigate = useNavigate();

  // State management
  const [telegramData, setTelegramData] = useState({
    telegram_user_id: "",
    username: "User",
    image_url: "",
  });
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [totalTaps, setTotalTaps] = useState(0);
  const [electricBoost, setElectricBoost] = useState(BASE_MAX_ELECTRIC_BOOST);
  const [maxElectricBoost, setMaxElectricBoost] = useState(BASE_MAX_ELECTRIC_BOOST);
  const [tapBoostLevel, setTapBoostLevel] = useState(0);
  const [hasAutobot, setHasAutobot] = useState(false);
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
          fullEnergy: { usesLeft: 3, isActive: false, endTime: null, resetTime: null },
        };
  });

  // Refs for tracking
  const tapCountSinceLastUpdate = useRef(0);
  const autobotInterval = useRef(null);
  const rechargeInterval = useRef(null);

  // Fetch Telegram data on mount
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
      }
    };
    initTelegram();
  }, []);

  // Fetch profile and initialize boosters inside useEffect
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/splash");
        return;
      }
      try {
        const response = await fetch("https://bt-coins.onrender.com/user/profile", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (!response.ok) throw new Error("Failed to fetch profile");
        const data = await response.json();
        setProfile(data);
        setTotalTaps(data.total_coins);
        setCurrentStreak(data.streak?.current_streak || 0);
        const savedBoosters = localStorage.getItem("extraBoosters");
        if (savedBoosters) applyExtraBoosterEffects(JSON.parse(savedBoosters));
      } catch (err) {
        setError(err.message);
      }
    };

    fetchProfile();
    window.addEventListener("boosterUpgraded", fetchProfile);
    return () => window.removeEventListener("boosterUpgraded", fetchProfile);
  }, [navigate]);

  // Apply extra booster effects
  const applyExtraBoosterEffects = (boosters) => {
    let newMaxElectricBoost = BASE_MAX_ELECTRIC_BOOST;
    let newTapBoostLevel = 0;
    let autobotOwned = false;
    boosters.forEach((booster) => {
      switch (booster.title.toLowerCase()) {
        case "boost":
          newTapBoostLevel = parseInt(booster.rawLevel) || 0;
          break;
        case "multiplier":
          newMaxElectricBoost += 500 * (parseInt(booster.rawLevel) || 0);
          break;
        case "auto-bot tapping":
          autobotOwned = booster.rawLevel !== "-";
          break;
        default:
          break;
      }
    });
    setMaxElectricBoost(newMaxElectricBoost);
    setTapBoostLevel(newTapBoostLevel);
    setHasAutobot(autobotOwned);
    setElectricBoost((prev) => Math.min(prev, newMaxElectricBoost));
  };

  // Simulate offline Autobot gains
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

  // Autobot tapping
  useEffect(() => {
    if (hasAutobot) {
      autobotInterval.current = setInterval(() => {
        const multiplier = (dailyBoosters.tapperBoost.isActive ? 2 : 1) + tapBoostLevel;
        setTotalTaps((prev) => prev + multiplier);
        tapCountSinceLastUpdate.current += multiplier;
      }, AUTOBOT_TAP_INTERVAL);
    }
    return () => clearInterval(autobotInterval.current);
  }, [hasAutobot, dailyBoosters, tapBoostLevel]);

  // Energy recharge
  useEffect(() => {
    const level = parseInt(localStorage.getItem("rechargingSpeedLevel") || "0");
    const rechargeTime = RECHARGE_TIMES[level];
    const rechargeRate = maxElectricBoost / (rechargeTime * 1000); // per ms

    rechargeInterval.current = setInterval(() => {
      setElectricBoost((prev) => {
        if (prev < maxElectricBoost && !dailyBoosters.fullEnergy.isActive) {
          return Math.min(prev + rechargeRate * 1000, maxElectricBoost);
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(rechargeInterval.current);
  }, [maxElectricBoost, dailyBoosters]);

  // Sync coins with backend
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (tapCountSinceLastUpdate.current > 0) updateBackend();
    }, SYNC_INTERVAL);
    return () => clearInterval(syncInterval);
  }, []);

  // Daily booster timers and reset
  useEffect(() => {
    const interval = setInterval(() => {
      setDailyBoosters((prev) => {
        const updated = { ...prev };
        ["tapperBoost", "fullEnergy"].forEach((type) => {
          const booster = updated[type];
          if (booster.isActive && Date.now() >= booster.endTime) {
            booster.isActive = false;
          }
          if (booster.usesLeft === 0 && booster.resetTime && Date.now() >= booster.resetTime) {
            booster.usesLeft = 3;
            booster.resetTime = null;
          }
        });
        return updated;
      });
    }, 1000);
    localStorage.setItem("dailyBoosters", JSON.stringify(dailyBoosters));
    return () => clearInterval(interval);
  }, [dailyBoosters]);

  // Tap handling
  const handleTap = (event) => {
    if (electricBoost === 0 && !dailyBoosters.fullEnergy.isActive) return;
    const fingersCount = event.touches?.length || 1;
    const tapperBoostActive = dailyBoosters.tapperBoost.isActive;
    const fullEnergyActive = dailyBoosters.fullEnergy.isActive;
    const multiplier = (tapperBoostActive ? 2 : 1) + tapBoostLevel;
    const coinsAdded = fingersCount * multiplier;

    setTotalTaps((prev) => prev + coinsAdded);
    tapCountSinceLastUpdate.current += coinsAdded;
    if (fullEnergyActive) {
      setElectricBoost(maxElectricBoost);
    } else {
      setElectricBoost((prev) => Math.max(prev - fingersCount, 0));
    }

    setTapAnimation(true);
    setBoostAnimation(true);
    setTimeout(() => {
      setTapAnimation(false);
      setBoostAnimation(false);
    }, 500);

    const tapX = event.touches?.[0]?.clientX || event.clientX;
    const tapY = event.touches?.[0]?.clientY || event.clientY;
    const newTapEffect = { id: Date.now(), x: tapX, y: tapY, count: coinsAdded };
    setTapEffects((prevEffects) => [...prevEffects, newTapEffect]);
    setTimeout(() => setTapEffects((prev) => prev.filter((e) => e.id !== newTapEffect.id)), 1000);

    playTapSound();
  };

  const playTapSound = () => {
    const audio = new Audio(`${process.env.PUBLIC_URL}/tap.mp3`);
    audio.volume = 0.3;
    audio.play().catch((err) => console.error("Audio playback error:", err));
  };

  // Update backend
  const updateBackend = async () => {
    if (tapCountSinceLastUpdate.current === 0) return;
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `https://bt-coins.onrender.com/update-coins?coins=${tapCountSinceLastUpdate.current}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        }
      );
      if (response.ok) {
        tapCountSinceLastUpdate.current = 0;
      } else {
        console.error("Backend sync failed");
      }
    } catch (err) {
      console.error("Error syncing with backend:", err);
    }
  };

  if (error) return <div className="error">{error}</div>;

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
          className={`big-tap-icon ${tapAnimation ? "tap-animation" : ""}`}
          onTouchStart={handleTap}
          onClick={handleTap}
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