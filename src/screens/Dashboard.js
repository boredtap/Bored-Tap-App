import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./Dashboard.css";

// Configurable constants
const MAX_ELECTRIC_BOOST = 1000; // Max energy capacity

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
  const [electricBoost, setElectricBoost] = useState(MAX_ELECTRIC_BOOST);
  const [tapAnimation, setTapAnimation] = useState(false);
  const [boostAnimation, setBoostAnimation] = useState(false);
  const [tapEffects, setTapEffects] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);

  // Booster states (shared with BoostScreen via localStorage)
  const [dailyBoosters, setDailyBoosters] = useState({
    tapperBoost: { usesLeft: 3, timers: [], isActive: false },
    fullEnergy: { usesLeft: 3, timers: [], isActive: false },
  });

  // Refs for managing backend updates and electric recharge
  const tapCountSinceLastUpdate = useRef(0);
  const updateBackendTimeout = useRef(null);
  const rechargeInterval = useRef(null);
  const isTapping = useRef(false);

  // Effect for fetching Telegram data
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        if (window.Telegram?.WebApp) {
          const user = window.Telegram.WebApp.initDataUnsafe.user;
          if (user) {
            const telegramInfo = {
              telegram_user_id: user.id,
              username: user.username || `User${user.id}`,
              image_url: user.photo_url || `${process.env.PUBLIC_URL}/profile-picture.png`,
            };
            setTelegramData(telegramInfo);
          } else {
            console.error("Telegram user data not available");
          }
        }
      } catch (err) {
        console.error("Error syncing Telegram data:", err);
      }
    };
    initializeDashboard();
  }, []);

  // Effect for fetching profile data and initializing boosters
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
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) throw new Error("Unauthorized. Please log in again.");
          throw new Error("Failed to fetch profile data.");
        }

        const data = await response.json();
        setProfile(data);
        setTotalTaps(data.total_coins);
        setCurrentStreak(data.streak?.current_streak || 0);

        // Restore electricBoost from localStorage
        const savedBoost = localStorage.getItem("electricBoost");
        const lastUpdateTime = localStorage.getItem("lastBoostUpdateTime");
        if (savedBoost && lastUpdateTime) {
          const timeElapsed = Math.floor((Date.now() - parseInt(lastUpdateTime)) / 1000);
          const rechargedAmount = Math.min(timeElapsed, MAX_ELECTRIC_BOOST - parseInt(savedBoost));
          setElectricBoost(parseInt(savedBoost) + rechargedAmount);
        } else {
          localStorage.setItem("electricBoost", MAX_ELECTRIC_BOOST);
          localStorage.setItem("lastBoostUpdateTime", Date.now());
        }

        // Load daily boosters from localStorage
        const savedBoosters = localStorage.getItem("dailyBoosters");
        if (savedBoosters) {
          setDailyBoosters(JSON.parse(savedBoosters));
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, [navigate]);

  // Save boosters to localStorage on change
  useEffect(() => {
    localStorage.setItem("dailyBoosters", JSON.stringify(dailyBoosters));
  }, [dailyBoosters]);

  // Real-time booster timer updates
  useEffect(() => {
    const intervalId = setInterval(() => {
      setDailyBoosters((prev) => {
        const updated = { ...prev };

        ["tapperBoost", "fullEnergy"].forEach((type) => {
          const booster = updated[type];
          if (booster.isActive && booster.timers.length > 0) {
            const activeTimer = booster.timers[0];
            if (Date.now() >= activeTimer.endTime) {
              booster.isActive = false;
              booster.timers.shift(); // Remove expired 20s timer
            }
          }
          // Reset when 24h timer expires
          if (booster.usesLeft === 0 && booster.timers.length > 0) {
            const resetTimer = booster.timers[0];
            if (Date.now() >= resetTimer.endTime) {
              booster.usesLeft = 3;
              booster.timers = [];
              booster.isActive = false;
            }
          }
        });

        return updated;
      });
    }, 1000); // Updates every second
    return () => clearInterval(intervalId);
  }, []);

  // Start or resume electric boost recharging
  const startRecharge = () => {
    if (rechargeInterval.current) clearInterval(rechargeInterval.current);
    rechargeInterval.current = setInterval(() => {
      setElectricBoost((prev) => {
        if (prev < MAX_ELECTRIC_BOOST && !dailyBoosters.fullEnergy.isActive) {
          const newBoost = prev + 1;
          localStorage.setItem("electricBoost", newBoost);
          localStorage.setItem("lastBoostUpdateTime", Date.now());
          return newBoost;
        } else {
          clearInterval(rechargeInterval.current);
          return prev;
        }
      });
    }, 1000); // Recharge 1 per second
  };

  // Stop recharging when tapping starts
  const stopRecharge = () => {
    if (rechargeInterval.current) clearInterval(rechargeInterval.current);
  };

  // Handle tap events with booster logic
  const handleTap = (event) => {
    if (electricBoost === 0) return;

    stopRecharge();

    const fingersCount = event.touches?.length || 1;
    const tapMultiplier = dailyBoosters.tapperBoost.isActive ? 2 : 1; // Double taps if Tapper Boost active

    // Update local state
    setTotalTaps((prev) => prev + fingersCount * tapMultiplier);
    setElectricBoost((prev) => {
      const newBoost = Math.max(prev - fingersCount, 0);
      localStorage.setItem("electricBoost", newBoost);
      localStorage.setItem("lastBoostUpdateTime", Date.now());
      return newBoost;
    });

    // Increment tap count for backend update
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

    // Schedule backend update every 2 seconds
    if (updateBackendTimeout.current) clearTimeout(updateBackendTimeout.current);
    updateBackendTimeout.current = setTimeout(() => {
      updateBackend();
      if (!isTapping.current) startRecharge();
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
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();
        if (response.ok) {
          console.log("Backend updated successfully:", data);
          if (data.total_coins !== undefined) {
            setTotalTaps(data.total_coins); // Sync with backend total
          }
        } else {
          console.error("Failed to update backend:", data.detail);
        }
      } catch (err) {
        console.error("Error updating backend:", err);
      } finally {
        tapCountSinceLastUpdate.current = 0; // Reset after update
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
      {/* Profile and Streak Section */}
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

      {/* Frames Section */}
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

      {/* Electric Boost Section */}
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