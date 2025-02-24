import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./Dashboard.css";

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
  const [electricBoost, setElectricBoost] = useState(1000);
  const [tapAnimation, setTapAnimation] = useState(false);
  const [boostAnimation, setBoostAnimation] = useState(false);
  const [tapEffects, setTapEffects] = useState([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [tapValue, setTapValue] = useState(1);
  const [energyCap, setEnergyCap] = useState(1000);
  const [rechargeRate, setRechargeRate] = useState(1000);
  const [tapperBoostActive, setTapperBoostActive] = useState(false);
  const [dailyBoostUses, setDailyBoostUses] = useState({ tapper: 0, fullEnergy: 0 });

  const tapCountSinceLastUpdate = useRef(0);
  const updateBackendTimeout = useRef(null);
  const rechargeInterval = useRef(null);
  const isTapping = useRef(false);
  let isHandlingTap = false;

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
          }
        }
      } catch (err) {
        console.error("Error syncing Telegram data:", err);
      }
    };
    initializeDashboard();
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/splash");
        return;
      }

      try {
        const profileResponse = await fetch("https://bt-coins.onrender.com/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!profileResponse.ok) throw new Error("Failed to fetch profile");

        const profileData = await profileResponse.json();
        setProfile(profileData);
        setTotalTaps(profileData.total_coins);
        setCurrentStreak(profileData.streak.current_streak || 0);

        const boostersResponse = await fetch("https://bt-coins.onrender.com/user/boosters", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!boostersResponse.ok) throw new Error("Failed to fetch boosters");

        const boostersData = await boostersResponse.json();
        setTapValue(boostersData.boostLevel + 1);
        setEnergyCap(1000 + boostersData.multiplierLevel * 500);
        setRechargeRate(1000 / (boostersData.rechargeSpeedLevel + 1));

        const savedBoost = localStorage.getItem("electricBoost");
        const lastUpdateTime = localStorage.getItem("lastBoostUpdateTime");
        if (savedBoost && lastUpdateTime) {
          const timeElapsed = Math.floor((Date.now() - parseInt(lastUpdateTime)) / 1000);
          const rechargedAmount = Math.min(timeElapsed * (1000 / rechargeRate), energyCap - parseInt(savedBoost));
          setElectricBoost(Math.min(parseInt(savedBoost) + rechargedAmount, energyCap));
        } else {
          localStorage.setItem("electricBoost", energyCap);
          localStorage.setItem("lastBoostUpdateTime", Date.now());
        }

        const savedUses = JSON.parse(localStorage.getItem("dailyBoostUses") || "{}");
        const lastReset = localStorage.getItem("lastBoostReset");
        const now = new Date();
        const today = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
        if (lastReset !== today) {
          localStorage.setItem("dailyBoostUses", JSON.stringify({ tapper: 0, fullEnergy: 0 }));
          localStorage.setItem("lastBoostReset", today);
          setDailyBoostUses({ tapper: 0, fullEnergy: 0 });
        } else {
          setDailyBoostUses(savedUses);
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching data:", err);
      }
    };

    fetchProfile();
  }, [navigate]);

  // Effect for recharging electric boost
  useEffect(() => {
    // Clear any existing interval to prevent duplicates
    if (rechargeInterval.current) {
      clearInterval(rechargeInterval.current);
    }

    // Set up a new interval for recharging
    rechargeInterval.current = setInterval(() => {
      setElectricBoost((prev) => {
        if (prev < energyCap) {
          const newBoost = Math.min(prev + 1, energyCap);
          localStorage.setItem("electricBoost", newBoost);
          localStorage.setItem("lastBoostUpdateTime", Date.now());
          return newBoost;
        } else {
          clearInterval(rechargeInterval.current);
          return energyCap;
        }
      });
    }, rechargeRate);

    // Cleanup function to clear the interval on dependency change or unmount
    return () => clearInterval(rechargeInterval.current);
  }, [energyCap, rechargeRate]);
  
  const stopRecharge = () => {
    if (rechargeInterval.current) clearInterval(rechargeInterval.current);
  };

  const handleTap = (event) => {
    setTapAnimation(true);
    setBoostAnimation(true);
    setTimeout(() => {
      setTapAnimation(false);
      setBoostAnimation(false);
    }, 500);
    updateBackend();

    if (isHandlingTap) return;
    isHandlingTap = true;
    setTimeout(() => { isHandlingTap = false; }, 300);

    if (electricBoost === 0) return;

    const fingersCount = event.touches?.length || 1;
    const effectiveTapValue = tapperBoostActive ? tapValue * 2 : tapValue;
    setTotalTaps((prev) => prev + fingersCount * effectiveTapValue);
    setElectricBoost((prev) => {
      const newBoost = Math.max(prev - fingersCount, 0);
      localStorage.setItem("electricBoost", newBoost);
      localStorage.setItem("lastBoostUpdateTime", Date.now());
      return newBoost;
    });

    const tapX = event.touches?.[0]?.clientX || event.clientX;
    const tapY = event.touches?.[0]?.clientY || event.clientY;
    const newTapEffect = { id: Date.now(), x: tapX, y: tapY, count: fingersCount * effectiveTapValue };
    setTapEffects((prevEffects) => [...prevEffects, newTapEffect]);

    setTapAnimation(true);
    setTimeout(() => setTapAnimation(false), 500);
    setTimeout(() => setTapEffects((prev) => prev.filter((e) => e.id !== newTapEffect.id)), 1000);

    isTapping.current = true;
    if (updateBackendTimeout.current) clearTimeout(updateBackendTimeout.current);
    updateBackendTimeout.current = setTimeout(() => {
      isTapping.current = false;
      updateBackend();
    }, 1000);

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
            setTotalTaps(data.total_coins);
          }
        }
      } catch (err) {
        console.error("Error updating backend:", err);
      } finally {
        tapCountSinceLastUpdate.current = 0;
      }
    }
  };

  // TODO: Integrate activateTapperBoost into UI or logic (e.g., via a button)
  const activateTapperBoost = () => {
    if (dailyBoostUses.tapper >= 3) {
      console.log("Tapper Boost limit reached for today");
      return;
    }
    const lastUse = localStorage.getItem("lastTapperUse");
    const now = Date.now();
    if (lastUse && now - parseInt(lastUse) < 3600000) {
      console.log("Tapper Boost on cooldown");
      return;
    }

    setTapperBoostActive(true);
    setDailyBoostUses((prev) => {
      const newUses = { ...prev, tapper: prev.tapper + 1 };
      localStorage.setItem("dailyBoostUses", JSON.stringify(newUses));
      return newUses;
    });
    localStorage.setItem("lastTapperUse", now);
    setTimeout(() => setTapperBoostActive(false), 20000);
  };

  // TODO: Integrate activateFullEnergy into UI or logic (e.g., via a button)
  const activateFullEnergy = () => {
    if (dailyBoostUses.fullEnergy >= 3) {
      console.log("Full Energy limit reached for today");
      return;
    }
    const lastUse = localStorage.getItem("lastFullEnergyUse");
    const now = Date.now();
    if (lastUse && now - parseInt(lastUse) < 3600000) {
      console.log("Full Energy on cooldown");
      return;
    }

    setElectricBoost(energyCap);
    localStorage.setItem("electricBoost", energyCap);
    localStorage.setItem("lastBoostUpdateTime", now);
    setDailyBoostUses((prev) => {
      const newUses = { ...prev, fullEnergy: prev.fullEnergy + 1 };
      localStorage.setItem("dailyBoostUses", JSON.stringify(newUses));
      return newUses;
    });
    localStorage.setItem("lastFullEnergyUse", now);
  };

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
          <span>{totalTaps}</span>
        </div>
        <div
          className={`big-tap-icon ${tapAnimation ? "tap-animation" : ""}`}
          onTouchStart={(e) => {
            stopRecharge();
            handleTap(e);
          }}
          onClick={(e) => {
            stopRecharge();
            handleTap(e);
          }}
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
          <span>{electricBoost}/{energyCap}</span>
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