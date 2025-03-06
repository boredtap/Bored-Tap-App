import React, { useState, useEffect, useCallback, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./Dashboard.css";
import { BoostContext } from "../context/BoosterContext";

// Updated Recharge times per spec (in ms) - now including all 5 levels
const RECHARGE_TIMES = [5000, 4500, 3500, 2500, 1500, 500]; // Level 0 through 5

const Dashboard = () => {
  const navigate = useNavigate();

  const { totalTaps, setTotalTaps, setDailyBoosters, dailyBoosters, tapMultiplier, activateTapperBoost, activateFullEnergy, setTapMultiplier, electricBoost, setElectricBoost, setMaxElectricBoost, maxElectricBoost, setRechargeTime, rechargeTime, autoTapActive, setAutoTapActive, applyAutoBotTaps, lastActiveTime, setLastActiveTime, adjustElectricBoosts } = useContext(BoostContext);

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

  // State for AutoBot overlay
  const [showAutoBotOverlay, setShowAutoBotOverlay] = useState(false);
  const [autoBotTaps, setAutoBotTaps] = useState(0);

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
    setAutoTapActive(false);
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
          if (data.total_coins) {
            setTotalTaps(data.total_coins);
          }
          setCurrentStreak(data.streak?.current_streak || 0);
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
      setElectricBoost(maxElectricBoost);
    };

    window.addEventListener("fullEnergyClaimed", handleFullEnergyClaimed);
    return () => window.removeEventListener("fullEnergyClaimed", handleFullEnergyClaimed);
  }, [maxElectricBoost]);

  // Extra boosters event listeners
  useEffect(() => {
    const handleBoostUpgraded = (event) => {
      const newLevel = event.detail?.level || 1;
      const newPermanent = newLevel + 1;
      if (!boostMultiplierActive.current) {
        setTapMultiplier(newPermanent);
      } else {
        setTapMultiplier(newPermanent * 2);
      }
    };

    const handleMultiplierUpgraded = (event) => {
      console.log("Multiplier Upgraded Event:", event.detail);
    };

    const handleRechargeSpeedUpgraded = (event) => {
      console.log("Recharge Speed Upgraded Event:", event.detail);
      if (rechargeInterval.current) {
        clearInterval(rechargeInterval.current);
        rechargeInterval.current = null;
      }
    };

    const handleAutoTapActivated = (event) => {
      console.log("Auto Tap Activated Event:", event.detail);
    };

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

  const isTouchEvent = useRef(false);

  const handleTap = (event) => {
    if (event.pointerType === "touch") {
      isTouchEvent.current = true;
    } else if (event.pointerType === "mouse" && isTouchEvent.current) {
      return;
    }

    if (electricBoost <= 0) return;

    if (rechargeInterval.current) {
      clearInterval(rechargeInterval.current);
      rechargeInterval.current = null;
    }

    lastTapTime.current = Date.now();
    localStorage.setItem("lastTapTime", lastTapTime.current.toString());

    const numTaps = event.touches ? event.touches.length : 1;

    setTotalTaps((prev) => prev + tapMultiplier * numTaps);
    tapCountSinceLastUpdate.current += tapMultiplier * numTaps;

    setElectricBoost((prev) => Math.max(prev - numTaps, 0));

    const tapElement = event.currentTarget;
    const tapIconRect = tapElement.getBoundingClientRect();

    const tapX = event.clientX - tapIconRect.left;
    const tapY = event.clientY - tapIconRect.top;
    const id = Date.now() + Math.random();
    const newTapEffect = { id, x: tapX, y: tapY };

    setTapEffects((prev) => [...prev, newTapEffect]);

    setTimeout(() => {
      setTapEffects((prev) => prev.filter((effect) => effect.id !== id));
    }, 1000);

    tapElement.classList.add("tap-animation");
    setTimeout(() => tapElement.classList.remove("tap-animation"), 200);
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
    };

    fetchData();
  }, []);

  useEffect(() => {
    const handleLoad = () => {
      const oldUser = localStorage.getItem("telegramUser");
      const isFirstVisit = !sessionStorage.getItem("hasVisited");

      if (oldUser && isFirstVisit) {
        const offlineTaps = applyAutoBotTaps();
        const newElectricBoost = adjustElectricBoosts();
        console.log("Offline taps", offlineTaps);
        console.log("New Electric Boosts", newElectricBoost);

        if (offlineTaps > 0) {
          setAutoBotTaps(offlineTaps);
          setShowAutoBotOverlay(true); // Show overlay if there are offline taps
        }
        setElectricBoost(newElectricBoost);
        sessionStorage.setItem("hasVisited", "true");
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
  }, [applyAutoBotTaps, adjustElectricBoosts]);

  useEffect(() => {
    const storedTaps = localStorage.getItem("autoBotTaps");
    if (storedTaps !== null) {
      const parsedTaps = parseInt(storedTaps, 10);
      if (parsedTaps > 0) {
        setAutoBotTaps((prev) => parsedTaps + prev);
        setShowAutoBotOverlay(true); // Show overlay on mount if stored taps exist
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("autoBotTaps", autoBotTaps);
  }, [autoBotTaps]);

  // Handle claiming AutoBot taps
  const handleClaimAutoBotTaps = () => {
    setTotalTaps((prev) => prev + autoBotTaps);
    tapCountSinceLastUpdate.current = autoBotTaps

    setAutoBotTaps(0);
    localStorage.setItem("autoBotTaps", "0");
    
    setShowAutoBotOverlay(false);

    updateBackend()
  };

  const handleClearAutoBotTaps = () => {
    setAutoBotTaps(0)
    setShowAutoBotOverlay(false)
    localStorage.setItem("autoBotTaps", "0");
  }

  useEffect(() => {
    const handleUnload = () => {
      updateBackend();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateBackend();
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Render AutoBot overlay
  const renderAutoBotOverlay = () => {
    if (!showAutoBotOverlay || autoBotTaps <= 0) return null;

    return (
      <div className="overlay-container">
        <div className={`boost-overlay ${showAutoBotOverlay ? "slide-in" : "slide-out"}`}>
          <div className="overlay-header">
            <h2 className="overlay2-title">Auto-Bot Earning</h2>
            <img
              src={`${process.env.PUBLIC_URL}/cancel.png`}
              alt="Cancel"
              className="overlay-cancel"
              onClick={handleClearAutoBotTaps}
            />
          </div>
          <div className="overlay-divider"></div>
          <div className="overlay-content">
            <img
              src={`${process.env.PUBLIC_URL}/autobot-icon.png`} // Assuming this is the AutoBot icon; adjust as needed
              alt="AutoBot Icon"
              className="overlay-boost-icon"
            />
            <p className="overlay-description">Your autobot worked for you</p>
            <div className="overlay-value-container">
              <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Coin Icon" className="overlay-coin-icon" />
              <span className="overlay-value">{autoBotTaps.toLocaleString()}</span>
            </div>
            <button className="overlay-cta" onClick={handleClaimAutoBotTaps}>
              Claim
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      {renderAutoBotOverlay()}
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

      {/* // In Dashboard.js, within the frames-section div */}
  <div className="frames-section">
    {[
      { name: "Rewards", icon: "reward.png", path: "/reward-screen" },
      { name: "Challenge", icon: "challenge.png", path: "/challenge-screen" },
      { name: "Clan", icon: "clan.png", path: "/clan-screen" }, // Clan navigation
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
        <div className="big-tap-icon" onPointerDown={handleTap}>
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