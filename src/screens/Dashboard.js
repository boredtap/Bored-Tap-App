import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./Dashboard.css";

// Configurable constants
const BASE_MAX_ELECTRIC_BOOST = 1000; // Base energy capacity

// Recharge time per level for "recharging speed" booster (in seconds)
const RECHARGE_TIMES = {
  0: 3000, // Default
  1: 2500,
  2: 2000,
  3: 1500,
  4: 1000,
  5: 500,
};

const Dashboard = () => {
  const navigate = useNavigate();

  // States for user and dashboard data
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
    return savedBoost ? parseInt(savedBoost) : BASE_MAX_ELECTRIC_BOOST;
  });
  const [tapAnimation, setTapAnimation] = useState(false);
  const [boostAnimation, setBoostAnimation] = useState(false);
  const [tapEffects, setTapEffects] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Daily booster states
  const [dailyBoosters, setDailyBoosters] = useState(() => {
    const savedBoosters = localStorage.getItem("dailyBoosters");
    return savedBoosters
      ? JSON.parse(savedBoosters)
      : {
          tapperBoost: { usesLeft: 3, timers: [], isActive: false },
          fullEnergy: { usesLeft: 3, timers: [], isActive: false },
        };
  });

  // Extra Boosters state
  // eslint-disable-next-line no-unused-vars
  const [extraBoosters, setExtraBoosters] = useState(() => {
    const savedBoosters = localStorage.getItem("extraBoosters");
    return savedBoosters ? JSON.parse(savedBoosters) : [];
  });

  // Dynamic constants based on Extra Boosters
  const [MAX_ELECTRIC_BOOST, setMaxElectricBoost] = useState(BASE_MAX_ELECTRIC_BOOST);
  const [RECHARGE_INTERVAL, setRechargeInterval] = useState(
    RECHARGE_TIMES[0] / BASE_MAX_ELECTRIC_BOOST * 1000 // Default ms per unit
  );
  const [tapBoostLevel, setTapBoostLevel] = useState(0);

  // Refs
  const tapCountSinceLastUpdate = useRef(0);
  const updateBackendTimeout = useRef(null);
  const rechargeInterval = useRef(null);
  const isTapping = useRef(false);

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

        // Restore electricBoost
        const savedBoost = localStorage.getItem("electricBoost");
        if (savedBoost) {
          setElectricBoost(parseInt(savedBoost));
        } else {
          localStorage.setItem("electricBoost", BASE_MAX_ELECTRIC_BOOST);
          localStorage.setItem("lastBoostUpdateTime", Date.now());
        }

        // Load daily boosters
        const savedDailyBoosters = localStorage.getItem("dailyBoosters");
        if (savedDailyBoosters) {
          setDailyBoosters(JSON.parse(savedDailyBoosters));
        }

        // Load extra boosters and apply effects
        const savedExtraBoosters = localStorage.getItem("extraBoosters");
        if (savedExtraBoosters) {
          const boosters = JSON.parse(savedExtraBoosters);
          setExtraBoosters(boosters);
          applyExtraBoosterEffects(boosters);
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, [navigate]);

  // Save boosters and electricBoost to localStorage
  useEffect(() => {
    localStorage.setItem("dailyBoosters", JSON.stringify(dailyBoosters));
    localStorage.setItem("electricBoost", electricBoost);
    localStorage.setItem("lastBoostUpdateTime", Date.now());
  }, [dailyBoosters, electricBoost]);

  // Apply Extra Booster effects
  const applyExtraBoosterEffects = (boosters) => {
    let newMaxElectricBoost = BASE_MAX_ELECTRIC_BOOST;
    let newRechargeTime = RECHARGE_TIMES[0]; // Default full recharge time in seconds
    let newTapBoostLevel = 0;

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
        default:
          break;
      }
    });

    setMaxElectricBoost(newMaxElectricBoost);
    setRechargeInterval((newRechargeTime / newMaxElectricBoost) * 1000); // Convert to ms per unit
    setTapBoostLevel(newTapBoostLevel);

    // Adjust electricBoost if it exceeds new max
    setElectricBoost((prev) => Math.min(prev, newMaxElectricBoost));
  };

  // Dynamic electric boost recharge
  useEffect(() => {
    if (rechargeInterval.current) clearInterval(rechargeInterval.current);
    rechargeInterval.current = setInterval(() => {
      setElectricBoost((prev) => {
        if (prev < MAX_ELECTRIC_BOOST && !dailyBoosters.fullEnergy.isActive) {
          return Math.min(prev + 1, MAX_ELECTRIC_BOOST);
        }
        return prev;
      });
    }, RECHARGE_INTERVAL);
    return () => clearInterval(rechargeInterval.current);
  }, [dailyBoosters.fullEnergy.isActive, MAX_ELECTRIC_BOOST, RECHARGE_INTERVAL]);

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
    if (electricBoost === 0 && !dailyBoosters.fullEnergy.isActive) return;

    const fingersCount = event.touches?.length || 1;
    const tapMultiplier = (dailyBoosters.tapperBoost.isActive ? 2 : 1) + tapBoostLevel;

    setTotalTaps((prev) => prev + fingersCount * tapMultiplier);
    setElectricBoost((prev) => {
      if (dailyBoosters.fullEnergy.isActive) {
        return MAX_ELECTRIC_BOOST;
      }
      return Math.max(prev - fingersCount, 0);
    });
    tapCountSinceLastUpdate.current += fingersCount * tapMultiplier;

    // Visual feedback
    setTapAnimation(true);
    setBoostAnimation(true);
    setTimeout(() => {
      setTapAnimation(false);
      setBoostAnimation(false);
    }, 500);

    const tapX = event.touches?.[0]?.clientX || event.clientX;
    const tapY = event.touches?.[0]?.clientY || event.clientY;
    const newTapEffect = { id: Date.now(), x: tapX, y: tapY, count: fingersCount * tapMultiplier };
    setTapEffects((prevEffects) => [...prevEffects, newTapEffect]);
    setTimeout(() => setTapEffects((prev) => prev.filter((e) => e.id !== newTapEffect.id)), 1000);

    if (updateBackendTimeout.current) clearTimeout(updateBackendTimeout.current);
    updateBackendTimeout.current = setTimeout(() => {
      updateBackend();
    }, 2000);

    isTapping.current = true;
    playTapSound();
  };

  // Play tap sound effect
  const playTapSound = () => {
    const audio = new Audio(`${process.env.PUBLIC_URL}/tap.mp3`);
    audio.volume = 0.3;
    audio.play().catch((err) => console.error("Audio playback error:", err));
  };

  // Update backend with accumulated taps
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

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (rechargeInterval.current) clearInterval(rechargeInterval.current);
      if (updateBackendTimeout.current) clearTimeout(updateBackendTimeout.current);
    };
  }, []);

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
          <span>{electricBoost}/{MAX_ELECTRIC_BOOST}</span>
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