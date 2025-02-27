import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./Dashboard.css";

// Configurable constants
const BASE_MAX_ELECTRIC_BOOST = 1000;
const RECHARGE_TIMES = {
  0: 3000,
  1: 2500,
  2: 2000,
  3: 1500,
  4: 1000,
  5: 500,
};
const AUTOBOT_TAP_INTERVAL = 1000; // 1 tap per second

const Dashboard = () => {
  const navigate = useNavigate();

  // States
  const [telegramData, setTelegramData] = useState({
    telegram_user_id: "",
    username: "User",
    image_url: "",
  });
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [totalTaps, setTotalTaps] = useState(0);
  const [electricBoost, setElectricBoost] = useState(BASE_MAX_ELECTRIC_BOOST);
  const [tapAnimation, setTapAnimation] = useState(false);
  const [boostAnimation, setBoostAnimation] = useState(false);
  const [tapEffects, setTapEffects] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [dailyBoosters, setDailyBoosters] = useState(() => {
    const savedBoosters = localStorage.getItem("dailyBoosters");
    return savedBoosters
      ? JSON.parse(savedBoosters)
      : {
          tapperBoost: { usesLeft: 3, timers: [], isActive: false },
          fullEnergy: { usesLeft: 3, timers: [], isActive: false },
        };
  });
  const [maxElectricBoost, setMaxElectricBoost] = useState(BASE_MAX_ELECTRIC_BOOST);
  const [rechargeIntervalMs, setRechargeIntervalMs] = useState(
    (RECHARGE_TIMES[0] / BASE_MAX_ELECTRIC_BOOST) * 1000
  );
  const [tapBoostLevel, setTapBoostLevel] = useState(0);
  const [hasAutobot, setHasAutobot] = useState(false);

  // Refs
  const tapCountSinceLastUpdate = useRef(0);
  const updateBackendTimeout = useRef(null);
  const isTapping = useRef(false);
  const autobotInterval = useRef(null);
  const rechargeInterval = useRef(null);

  // Fetch Telegram data
  useEffect(() => {
    const initializeDashboard = async () => {
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
    initializeDashboard();
  }, []);

  // Fetch profile data and initialize
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

        if (!response.ok) {
          if (response.status === 401) throw new Error("Unauthorized. Please log in again.");
          throw new Error("Failed to fetch profile data.");
        }

        const data = await response.json();
        setProfile(data);
        setTotalTaps(data.total_coins);
        setCurrentStreak(data.streak?.current_streak || 0);

        const savedBoost = localStorage.getItem("electricBoost");
        if (savedBoost) {
          setElectricBoost(parseInt(savedBoost));
        } else {
          localStorage.setItem("electricBoost", BASE_MAX_ELECTRIC_BOOST);
          localStorage.setItem("lastBoostUpdateTime", Date.now());
        }

        const savedDailyBoosters = localStorage.getItem("dailyBoosters");
        if (savedDailyBoosters) {
          setDailyBoosters(JSON.parse(savedDailyBoosters));
        }

        const savedExtraBoosters = localStorage.getItem("extraBoosters");
        if (savedExtraBoosters) {
          const boosters = JSON.parse(savedExtraBoosters);
          applyExtraBoosterEffects(boosters);
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();

    // Start autobot if owned
    if (hasAutobot && !autobotInterval.current) {
      autobotInterval.current = setInterval(() => {
        const tapperBoostActive = dailyBoosters.tapperBoost.isActive;
        const multiplier = (tapperBoostActive ? 2 : 1) + tapBoostLevel;
        tapCountSinceLastUpdate.current += multiplier;
        setTotalTaps((prev) => prev + multiplier);
      }, AUTOBOT_TAP_INTERVAL);
    }

    // Start energy recharge
    rechargeInterval.current = setInterval(() => {
      const isFullEnergyActive = dailyBoosters.fullEnergy.isActive;
      if (electricBoost < maxElectricBoost && !isFullEnergyActive) {
        setElectricBoost((prev) => Math.min(prev + 1, maxElectricBoost));
        localStorage.setItem("electricBoost", electricBoost + 1);
      }
    }, rechargeIntervalMs);

    // Periodic backend sync
    const syncInterval = setInterval(() => {
      if (tapCountSinceLastUpdate.current > 0) updateBackend();
    }, 2000);

    return () => {
      clearInterval(autobotInterval.current);
      clearInterval(rechargeInterval.current);
      clearInterval(syncInterval);
      if (updateBackendTimeout.current) clearTimeout(updateBackendTimeout.current);
    };
  }, [navigate, dailyBoosters, hasAutobot, tapBoostLevel, maxElectricBoost, rechargeIntervalMs, electricBoost]);

  // Apply Extra Booster effects
  const applyExtraBoosterEffects = (boosters) => {
    let newMaxElectricBoost = BASE_MAX_ELECTRIC_BOOST;
    let newRechargeTime = RECHARGE_TIMES[0];
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
        case "recharging speed":
          newRechargeTime = RECHARGE_TIMES[parseInt(booster.rawLevel)] || RECHARGE_TIMES[0];
          break;
        case "auto-bot tapping":
          autobotOwned = booster.rawLevel !== "-";
          break;
        default:
          break;
      }
    });

    setMaxElectricBoost(newMaxElectricBoost);
    setRechargeIntervalMs((newRechargeTime / newMaxElectricBoost) * 1000);
    setTapBoostLevel(newTapBoostLevel);
    setHasAutobot(autobotOwned);
    setElectricBoost((prev) => Math.min(prev, newMaxElectricBoost));
  };

  // Save daily boosters to localStorage
  useEffect(() => {
    localStorage.setItem("dailyBoosters", JSON.stringify(dailyBoosters));
  }, [dailyBoosters]);

  // Real-time daily booster timer updates
  useEffect(() => {
    const intervalId = setInterval(() => {
      setDailyBoosters((prev) => {
        const updated = { ...prev };
        ["tapperBoost", "fullEnergy"].forEach((type) => {
          const booster = updated[type];
          if (booster.timers.length > 0) {
            const nextTimer = booster.timers[0];
            if (Date.now() >= nextTimer.endTime) {
              if (booster.isActive) {
                booster.isActive = false;
                booster.timers.shift();
              } else if (booster.usesLeft === 0) {
                booster.usesLeft = 3;
                booster.timers = [];
              }
            }
          }
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Handle tap events with booster logic
  const handleTap = (event) => {
    if (electricBoost === 0) return;

    const fingersCount = event.touches?.length || 1;
    const tapperBoostActive = dailyBoosters.tapperBoost.isActive;
    const fullEnergyActive = dailyBoosters.fullEnergy.isActive;
    const multiplier = (tapperBoostActive ? 2 : 1) + tapBoostLevel;
    const coinsAdded = fingersCount * multiplier;

    setTotalTaps((prev) => prev + coinsAdded);
    setElectricBoost((prev) => (fullEnergyActive ? maxElectricBoost : Math.max(prev - fingersCount, 0)));
    localStorage.setItem("electricBoost", fullEnergyActive ? maxElectricBoost : Math.max(electricBoost - fingersCount, 0));
    tapCountSinceLastUpdate.current += coinsAdded;

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

    if (updateBackendTimeout.current) clearTimeout(updateBackendTimeout.current);
    updateBackendTimeout.current = setTimeout(() => {
      updateBackend();
    }, 2000);

    isTapping.current = true;
    playTapSound();
  };

  const playTapSound = () => {
    const audio = new Audio(`${process.env.PUBLIC_URL}/tap.mp3`);
    audio.volume = 0.3;
    audio.play().catch((err) => console.error("Audio playback error:", err));
  };

  const updateBackend = async () => {
    if (tapCountSinceLastUpdate.current > 0) {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch(
          `https://bt-coins.onrender.com/update-coins?coins=${tapCountSinceLastUpdate.current}`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          }
        );

        const data = await response.json();
        if (response.ok) {
          console.log("Backend updated successfully:", data);
          if (data.total_coins !== undefined) {
            setTotalTaps(data.total_coins);
          }
        } else {
          console.error("Failed to update backend:", data.detail);
        }
      } catch (err) {
        console.error("Error updating backend:", err);
      } finally {
        tapCountSinceLastUpdate.current = 0;
        isTapping.current = false;
      }
    }
  };

  if (error) {
    return <div className="error">{error}</div>;
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
          <span>{electricBoost}/{maxElectricBoost}</span>
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