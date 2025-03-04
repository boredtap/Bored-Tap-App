import React, { useState, useEffect, useCallback, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./Dashboard.css";
import { BoostContext } from "../context/BoosterContext";

// Updated Recharge times per spec (in ms) - now including all 5 levels
const RECHARGE_TIMES = [3000, 2500, 2000, 1500, 1000, 500]; // Level 0 through 5

const Dashboard = () => {
  const navigate = useNavigate();

  const { totalTaps, setTotalTaps, setDailyBoosters, dailyBoosters, tapMultiplier, activateTapperBoost, activateFullEnergy, setTapMultiplier, electricBoost, setElectricBoost, setMaxElectricBoost, maxElectricBoost, setRechargeTime, rechargeTime, autoTapActive, setAutoTapActive, applyAutoBotTaps } = useContext(BoostContext)

  // State for Telegram user data
  const [telegramData, setTelegramData] = useState({
    telegram_user_id: "",
    username: "User",
    image_url: `${process.env.PUBLIC_URL}/profile-picture.png`,
  });

  // State for user profile data
  const [profile, setProfile] = useState({ level: 1, level_name: "Beginner" });

  // State for streak and boost data
  const [currentStreak, setCurrentStreak] = useState(0);

  // State for total taps and tap effects
  const [tapEffects, setTapEffects] = useState([]); // For tap animations

  // Refs for tap and recharge management
  const tapCountSinceLastUpdate = useRef(0);
  const lastTapTime = useRef(Date.now());
  const rechargeInterval = useRef(null);
  const autoTapInterval = useRef(null);
  const boostMultiplierActive = useRef(false);


  // Reset function
  const resetBoosters = () => {
    const resetState = {
      tapperBoost: { usesLeft: 3, isActive: false, endTime: null, resetTime: null },
      fullEnergy: { usesLeft: 3, isActive: false, resetTime: null },
    };
    setDailyBoosters(resetState);

    // Reset booster states in localStorage
    setAutoTapActive(false)
    setMaxElectricBoost(1000);
    setElectricBoost(1000);
    setRechargeTime(RECHARGE_TIMES[0]);
    setTotalTaps(0);
    setProfile({ level: 1, level_name: "Beginner" });
    setCurrentStreak(0);
    tapCountSinceLastUpdate.current = 0;
    lastTapTime.current = Date.now();
    setAutoTapActive(false);
    if (autoTapInterval.current) clearInterval(autoTapInterval.current);
    autoTapInterval.current = null;
    boostMultiplierActive.current = false;
    setTelegramData({
      telegram_user_id: "",
      username: "User",
      image_url: `${process.env.PUBLIC_URL}/profile-picture.png`,
    });
  };

  // Fetch profile on mount
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
        if (!response.ok) throw new Error("Failed to fetch profile");
        const data = await response.json();
        if (data.total_coins === 0 && data.level === 1) {
          resetBoosters();
        } else {
          setProfile(data);
          console.log('here', data.total_coins)
          if (data.total_coins) {
            setTotalTaps(data.total_coins)
          }
          setCurrentStreak(data.streak?.current_streak || 0);

          // Load all saved booster states
          //const baseMultiplier = loadSavedBoosterStates();

          // // Set initial tap multiplier based on base multiplier
          // setTapMultiplier(baseMultiplier);

          // Load last tap time
          const savedTapTime = localStorage.getItem("lastTapTime");
          if (savedTapTime) {
            lastTapTime.current = parseInt(savedTapTime, 10);
          }
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        navigate("/splash");
      }
    };
    fetchProfile();

    if (window.Telegram?.WebApp) {
      const user = window.Telegram.WebApp.initDataUnsafe.user;
      if (user) {
        setTelegramData({
          telegram_user_id: user.id,
          username: user?.username ? user.username : `User${user.id}`,
          image_url: user?.photo_url ? user.photo_url : `${process.env.PUBLIC_URL}/profile-picture.png`,
        });
      }
    }
  }, [navigate]);

  // --- Tapper Boost Integration ---

  useEffect(() => {
    console.log('Tap Multipliter', tapMultiplier)
  }, [tapMultiplier])

  // Backend sync every 2 seconds
  const updateBackend = useCallback(async () => {
    if (tapCountSinceLastUpdate.current === 0) return;
    const tapsToSync = tapCountSinceLastUpdate.current;
    tapCountSinceLastUpdate.current = 0;
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `https://bt-coins.onrender.com/update-coins?coins=${tapsToSync}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data["current coins"] >= 0) {
          //setTotalTaps(data["current coins"]);
          setProfile((prev) => ({
            ...prev,
            level: data["current level"] || prev.level,
          }));
        }
      } else {
        console.error("Failed to sync coins:", await response.text());
      }
    } catch (err) {
      console.error("Error syncing with backend:", err);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(updateBackend, 2000);
    return () => {
      clearInterval(interval);
      updateBackend();
    };
  }, [updateBackend]);

  // Electric boost recharge logic
  useEffect(() => {
    const checkRecharge = () => {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTime.current;

      if (timeSinceLastTap >= rechargeTime && electricBoost < maxElectricBoost) {
        if (!rechargeInterval.current) {
          rechargeInterval.current = setInterval(() => {
            setElectricBoost((prev) => {
              const newBoost = Math.min(prev + 1, maxElectricBoost);
              if (newBoost === maxElectricBoost) {
                clearInterval(rechargeInterval.current);
                rechargeInterval.current = null;
              }
              return newBoost;
            });
          }, rechargeTime);
        }
      } else if (rechargeInterval.current && timeSinceLastTap < rechargeTime) {
        clearInterval(rechargeInterval.current);
        rechargeInterval.current = null;
      }
    };

    const interval = setInterval(checkRecharge, 1000);
    return () => {
      clearInterval(interval);
      if (rechargeInterval.current) {
        clearInterval(rechargeInterval.current);
        rechargeInterval.current = null;
      }
    };
  }, [electricBoost, maxElectricBoost, rechargeTime]);

  // Full Energy claim event listener
  useEffect(() => {
    const handleFullEnergyClaimed = () => {
      console.log("Full Energy Claimed Event - Refilling to", maxElectricBoost);
      setElectricBoost(maxElectricBoost);
    };

    window.addEventListener("fullEnergyClaimed", handleFullEnergyClaimed);
    return () => window.removeEventListener("fullEnergyClaimed", handleFullEnergyClaimed);
  }, [maxElectricBoost]);

  // Extra boosters event listeners
  useEffect(() => {
    // Extra Booster: Boost (permanent tap bonus)
    const handleBoostUpgraded = (event) => {
      console.log("Boost Upgraded Event:", event.detail);
      const newLevel = event.detail?.level || 1;
      // Level 1: 2, Level 2: 3, etc. (level + 1)
      const newPermanent = newLevel + 1;

      console.log("Setting new base multiplier:", newPermanent);

      // Only update tap multiplier if no temporary boost is active
      if (!boostMultiplierActive.current) {
        setTapMultiplier(newPermanent);
      } else {
        setTapMultiplier(newPermanent * 2); // Keep the x2 boost if active
      }
    };

    // Extra Booster: Multiplier (max energy increase)
    const handleMultiplierUpgraded = (event) => {
      console.log("Multiplier Upgraded Event:", event.detail);
    };

    // Extra Booster: Recharge Speed
    const handleRechargeSpeedUpgraded = (event) => {
      console.log("Recharge Speed Upgraded Event:", event.detail);

      // Reset recharge interval with new timing
      if (rechargeInterval.current) {
        clearInterval(rechargeInterval.current);
        rechargeInterval.current = null;
      }
    };

    // Extra Booster: Auto Bot Tapping (1 tap per second)
    const handleAutoTapActivated = (event) => {
      console.log("Auto Tap Activated Event:", event.detail);
    };

    // Generic booster upgraded event
    const handleBoosterUpgraded = () => {
      console.log("Generic Booster Upgraded Event");
    };

    window.addEventListener("boostUpgraded", handleBoostUpgraded);
    window.addEventListener("multiplierUpgraded", handleMultiplierUpgraded);
    window.addEventListener("rechargeSpeedUpgraded", handleRechargeSpeedUpgraded);
    window.addEventListener("autoTapActivated", handleAutoTapActivated);
    window.addEventListener("boosterUpgraded", handleBoosterUpgraded);

    return () => {
      window.removeEventListener("boostUpgraded", handleBoostUpgraded);
      window.removeEventListener("multiplierUpgraded", handleMultiplierUpgraded);
      window.removeEventListener("rechargeSpeedUpgraded", handleRechargeSpeedUpgraded);
      window.removeEventListener("autoTapActivated", handleAutoTapActivated);
      window.removeEventListener("boosterUpgraded", handleBoosterUpgraded);
    };
  }, []);

  // Tap handling function
  const handleTap = (event) => {
    //event.preventDefault();
    if (electricBoost <= 0) return;

    if (rechargeInterval.current) {
      clearInterval(rechargeInterval.current);
      rechargeInterval.current = null;
    }

    lastTapTime.current = Date.now();
    localStorage.setItem("lastTapTime", lastTapTime.current.toString());

    setTotalTaps((prev) => prev + tapMultiplier);
    tapCountSinceLastUpdate.current += tapMultiplier;

    setElectricBoost((prev) => {
      const newBoost = Math.max(prev - 1, 0);
      return newBoost;
    });

    const tapIcon = event.currentTarget.getBoundingClientRect();
    const tapX = (event.touches ? event.touches[0].clientX : event.clientX) - tapIcon.left;
    const tapY = (event.touches ? event.touches[0].clientY : event.clientY) - tapIcon.top;
    const newTapEffect = { id: Date.now(), x: tapX, y: tapY };

    setTapEffects((prev) => [...prev, newTapEffect]);

    const tapElement = event.currentTarget;
    tapElement.classList.add("tap-animation");
    setTimeout(() => tapElement.classList.remove("tap-animation"), 200);

    setTimeout(() => {
      setTapEffects((prev) => prev.filter((effect) => effect.id !== newTapEffect.id));
    }, 1000);
  };

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("accessToken");
      const extraBoostersResponse = await fetch("https://bt-coins.onrender.com/user/boost/extra_boosters", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!extraBoostersResponse.ok) throw new Error("Extra boosters fetch failed");
      const extraBoostersData = await extraBoostersResponse.json();
      console.log('Splash Screen', extraBoostersData)
    }

    fetchData()
  }, [])

  useEffect(() => {
    const handleLoad = () => {
      const oldUser = localStorage.getItem("telegramUser");
      const isFirstVisit = !sessionStorage.getItem("hasVisited");

      if (oldUser && isFirstVisit) {
        applyAutoBotTaps();
        sessionStorage.setItem("hasVisited", "true"); // Mark as visited for this session
      }
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
    }

    return () => {
      window.removeEventListener("load", handleLoad);
    };
  }, []);


  return (
    <div className="dashboard-container">
      <div className="profile1-streak-section">
        <div className="profile1-section" onClick={() => navigate("/profile-screen")}>
          <img src={telegramData.image_url} alt="Profile" className="profile1-picture" />
          <div className="profile1-info">
            <span className="profile1-username">{telegramData.username}</span>
            <span className="profile1-level">
              Lv. {profile.level}. {profile.level_name}
            </span>
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
          <span>{totalTaps?.toLocaleString() ?? 0}</span>
        </div>
        <div className="big-tap-icon" onTouchStart={handleTap}>
          <img className="tap-logo-big" src={`${process.env.PUBLIC_URL}/logo.png`} alt="Big Tap Icon" />
          {tapEffects.map((effect) => (
            <div key={effect.id} className="tap-effect" style={{ top: `${effect.y}px`, left: `${effect.x}px` }}>
              +{tapMultiplier}
            </div>
          ))}
        </div>
      </div>
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