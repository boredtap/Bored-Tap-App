import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./Dashboard.css";

/**
 * Dashboard component displaying the main UI with tapping interaction, daily booster effects,
 * and extra booster mechanics synced with the backend.
 */
const Dashboard = () => {
  const navigate = useNavigate();

  // Constants for game mechanics
  const INITIAL_ELECTRIC_BOOST = 1000;
  const BASE_MAX_ELECTRIC_BOOST = 1000;
  // eslint-disable-next-line no-unused-vars
  const BOOST_DURATION = 20000; // 20 seconds in milliseconds, used in BoostScreen.js
  // eslint-disable-next-line no-unused-vars
  const DAILY_RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds, used in BoostScreen.js
  const RECHARGE_TIMES = useMemo(() => [3000, 2500, 2000, 1500, 1000], []); // Recharge speeds by level (ms), memoized
  const AUTOBOT_TAP_INTERVAL = 1000; // 1 second in milliseconds

  // Static mock data for UI display (partially replaced by backend), memoized for stability
  const telegramDataFallback = useMemo(
    () => ({
      username: "User",
      image_url: `${process.env.PUBLIC_URL}/profile-picture.png`,
    }),
    []
  );
  const profileFallback = useMemo(() => ({ level: 1, level_name: "Beginner" }), []);
  const currentStreak = 0;

  // Initial daily boosters state
  const INITIAL_DAILY_BOOSTERS = useMemo(
    () => ({
      tapperBoost: { usesLeft: 3, isActive: false, endTime: null, resetTime: null },
      fullEnergy: { usesLeft: 3, isActive: false, resetTime: null },
    }),
    []
  );

  // State for game mechanics
  const [totalTaps, setTotalTaps] = useState(0);
  const [tapEffects, setTapEffects] = useState([]);
  const [electricBoost, setElectricBoost] = useState(INITIAL_ELECTRIC_BOOST);
  const [maxElectricBoost, setMaxElectricBoost] = useState(BASE_MAX_ELECTRIC_BOOST);
  const [tapValue] = useState(1);
  const [dailyBoosters, setDailyBoosters] = useState(() => {
    const saved = localStorage.getItem("dailyBoosters");
    return saved ? JSON.parse(saved) : INITIAL_DAILY_BOOSTERS;
  });
  const [isTapping, setIsTapping] = useState(false);
  const [tapAnimation, setTapAnimation] = useState(false);
  const [tapBoostLevel, setTapBoostLevel] = useState(0);
  const [rechargingSpeedLevel, setRechargingSpeedLevel] = useState(0);
  const [hasAutobot, setHasAutobot] = useState(false);
  const [telegramData, setTelegramData] = useState(telegramDataFallback);
  const [profile, setProfile] = useState(profileFallback);

  /**
   * Resets all states to initial values on token absence or error.
   */
  const resetToInitialState = useCallback(() => {
    setTotalTaps(0);
    setElectricBoost(INITIAL_ELECTRIC_BOOST);
    setDailyBoosters(INITIAL_DAILY_BOOSTERS);
    setMaxElectricBoost(BASE_MAX_ELECTRIC_BOOST);
    setTapBoostLevel(0);
    setRechargingSpeedLevel(0);
    setHasAutobot(false);
    setTelegramData(telegramDataFallback);
    setProfile(profileFallback);
    localStorage.setItem("dailyBoosters", JSON.stringify(INITIAL_DAILY_BOOSTERS));
  }, [INITIAL_DAILY_BOOSTERS, profileFallback, telegramDataFallback]);

  // Fetch initial user data and extra boosters from backend
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      resetToInitialState();
      navigate("/splash");
      return;
    }

    // Fetch user profile
    fetch("https://bt-coins.onrender.com/user/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setTotalTaps(data.total_coins);
        setTelegramData({
          username: data.username,
          image_url: data.image_url,
        });
        setProfile({
          level: data.level,
          level_name: data.level_name,
        });
      })
      .catch(() => resetToInitialState());

    // Fetch extra boosters
    fetch("https://bt-coins.onrender.com/user/boost/extra_boosters", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((boosters) => {
        applyExtraBoosterEffects(boosters);
      })
      .catch((err) => console.error("Failed to fetch extra boosters:", err));
  }, [navigate, resetToInitialState]);

  /**
   * Syncs total taps with backend periodically.
   */
  const syncTapsWithBackend = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const response = await fetch(`https://bt-coins.onrender.com/update-coins?coins=${totalTaps}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to sync taps");
    } catch (err) {
      console.error("Sync error:", err);
    }
  }, [totalTaps]);

  // Sync taps every 30 seconds
  useEffect(() => {
    const syncInterval = setInterval(syncTapsWithBackend, 30000);
    return () => clearInterval(syncInterval);
  }, [syncTapsWithBackend]);

  // Apply extra booster effects based on backend data
  const applyExtraBoosterEffects = (boosters) => {
    boosters.forEach((booster) => {
      switch (booster.name) {
        case "multiplier":
          setMaxElectricBoost(BASE_MAX_ELECTRIC_BOOST + booster.level * 500);
          break;
        case "boost":
          setTapBoostLevel(booster.level);
          break;
        case "recharging speed":
          setRechargingSpeedLevel(booster.level);
          break;
        case "Auto-bot Tapping":
          setHasAutobot(true);
          break;
        default:
          break;
      }
    });
  };

  // Sync daily boosters with localStorage and handle timers
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem("dailyBoosters");
      if (saved) setDailyBoosters(JSON.parse(saved));
    };

    const handleFullEnergyClaimed = () => {
      setElectricBoost(maxElectricBoost);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("fullEnergyClaimed", handleFullEnergyClaimed);

    // Timer for Tapper Boost duration and daily reset
    const interval = setInterval(() => {
      setDailyBoosters((prev) => {
        const updated = { ...prev };
        const now = Date.now();

        // Reset Tapper Boost after BOOST_DURATION
        if (updated.tapperBoost.isActive && now >= updated.tapperBoost.endTime) {
          updated.tapperBoost.isActive = false;
        }

        // Reset uses after DAILY_RESET_INTERVAL when depleted
        if (updated.tapperBoost.usesLeft === 0 && updated.tapperBoost.resetTime && now >= updated.tapperBoost.resetTime) {
          updated.tapperBoost.usesLeft = 3;
          updated.tapperBoost.resetTime = null;
        }
        if (updated.fullEnergy.usesLeft === 0 && updated.fullEnergy.resetTime && now >= updated.fullEnergy.resetTime) {
          updated.fullEnergy.usesLeft = 3;
          updated.fullEnergy.resetTime = null;
        }

        localStorage.setItem("dailyBoosters", JSON.stringify(updated));
        return updated;
      });
    }, 1000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("fullEnergyClaimed", handleFullEnergyClaimed);
      clearInterval(interval);
    };
  }, [maxElectricBoost]);

  // Autobot effect: Auto-taps every second when enabled
  useEffect(() => {
    if (!hasAutobot) return;

    const autobotInterval = setInterval(() => {
      const multiplier = dailyBoosters.tapperBoost.isActive ? 2 : 1;
      const tapIncrease = tapValue * (1 + tapBoostLevel) * multiplier;
      setTotalTaps((prev) => prev + tapIncrease);
    }, AUTOBOT_TAP_INTERVAL);

    return () => clearInterval(autobotInterval);
  }, [hasAutobot, tapBoostLevel, dailyBoosters.tapperBoost.isActive, tapValue]);

  // Electric boost recharge based on recharge speed level
  useEffect(() => {
    if (isTapping || electricBoost >= maxElectricBoost) return;

    const rechargeRate = RECHARGE_TIMES[rechargingSpeedLevel] || RECHARGE_TIMES[0];
    const rechargeInterval = setInterval(() => {
      setElectricBoost((prev) => Math.min(prev + 1, maxElectricBoost));
    }, rechargeRate);

    return () => clearInterval(rechargeInterval);
  }, [isTapping, electricBoost, maxElectricBoost, rechargingSpeedLevel, RECHARGE_TIMES]);

  /**
   * Handles tap events, applies Tapper Boost and extra Boost multipliers, and shows tap effects.
   * @param {Object} event - The tap or click event object.
   */
  const handleTap = (event) => {
    event.preventDefault();

    if (electricBoost <= 0) return;

    setIsTapping(true);

    const tapperMultiplier = dailyBoosters.tapperBoost.isActive ? 2 : 1;
    const extraMultiplier = 1 + tapBoostLevel;
    const tapIncrease = tapValue * tapperMultiplier * extraMultiplier;

    setTotalTaps((prev) => prev + tapIncrease);
    setElectricBoost((prev) => Math.max(prev - 1, 0));

    const tapIcon = event.currentTarget.getBoundingClientRect();
    const tapX = (event.touches ? event.touches[0].clientX : event.clientX) - tapIcon.left;
    const tapY = (event.touches ? event.touches[0].clientY : event.clientY) - tapIcon.top;

    const newTapEffect = { id: Date.now(), x: tapX, y: tapY, count: tapIncrease };
    setTapEffects((prevEffects) => [...prevEffects, newTapEffect]);

    setTapAnimation(true);
    setTimeout(() => {
      setTapEffects((prev) => prev.filter((e) => e.id !== newTapEffect.id));
      setTapAnimation(false);
    }, 1000);
  };

  /**
   * Handles tap end to stop tapping state for recharge.
   */
  const handleTapEnd = () => {
    setIsTapping(false);
  };

  return (
    <div className="dashboard-container">
      {/* Profile and Streak Section */}
      <div className="profile1-streak-section">
        <div className="profile1-section" onClick={() => navigate("/profile-screen")}>
          <img src={telegramData.image_url} alt="Profile" className="profile1-picture" />
          <div className="profile1-info">
            <span className="profile1-username">{telegramData.username}</span>
            <span className="profile1-level">Lv. {profile.level}. {profile.level_name}</span>
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

      {/* Navigation Frames */}
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

      {/* Total Taps Section */}
      <div className="total-taps-section">
        <p className="total-taps-text">Your Total Taps:</p>
        <div className="total-taps-count">
          <img className="tap-logo-small" src={`${process.env.PUBLIC_URL}/logo.png`} alt="Small Icon" />
          <span>{totalTaps.toLocaleString()}</span>
        </div>
        <div
          className={`big-tap-icon ${tapAnimation ? "tap-animation" : ""}`}
          onTouchStart={handleTap}
          onTouchEnd={handleTapEnd}
          onMouseDown={handleTap}
          onMouseUp={handleTapEnd}
        >
          <img className="tap-logo-big" src={`${process.env.PUBLIC_URL}/logo.png`} alt="Big Tap Icon" />
          {tapEffects.map((effect) => (
            <div
              key={effect.id}
              className="tap-effect"
              style={{ top: `${effect.y}px`, left: `${effect.x}px` }}
            >
              +{effect.count}
            </div>
          ))}
        </div>
      </div>

      {/* Electric Boost Section */}
      <div className="electric-boost-section">
        <div className="electric-value">
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