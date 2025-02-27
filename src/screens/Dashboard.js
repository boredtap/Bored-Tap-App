


import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./Dashboard.css";

// Recharge times mapped to "Recharging Speed" levels (ms per point)
const RECHARGE_TIMES = [3000, 2000, 1000, 500];

/**
 * Dashboard component displaying the main UI with tapping interaction and navigation links.
 * Syncs with Telegram WebApp for user data and backend for profile, streak, and coin updates.
 */
const Dashboard = () => {
  const navigate = useNavigate();

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
  const [electricBoost, setElectricBoost] = useState(1000);
  const [maxElectricBoost, setMaxElectricBoost] = useState(1000); // Dynamic for Multiplier
  const [baseTapMultiplier, setBaseTapMultiplier] = useState(1); // Base for Boost
  const [tapMultiplier, setTapMultiplier] = useState(1); // Combined multiplier
  const [rechargeTime, setRechargeTime] = useState(RECHARGE_TIMES[0]); // Dynamic recharge
  const [autoTapActive, setAutoTapActive] = useState(false); // Auto-bot state

  // State for total taps and tap effects
  const [totalTaps, setTotalTaps] = useState(0);
  const [tapEffects, setTapEffects] = useState([]); // Multiple tap effects allowed

  // Refs for tap and recharge management
  const tapCountSinceLastUpdate = useRef(0);
  const lastTapTime = useRef(Date.now()); // Track time of last tap
  const rechargeInterval = useRef(null); // Store recharge interval ID
  const autoTapInterval = useRef(null); // Store auto-tap interval ID

  // Define resetBoosters before it's used
  const resetBoosters = () => {
    const resetState = {
      tapperBoost: { usesLeft: 3, isActive: false, endTime: null, resetTime: null },
      fullEnergy: { usesLeft: 3, isActive: false, resetTime: null },
    };
    localStorage.clear(); // Wipe all localStorage keys
    localStorage.setItem("dailyBoosters", JSON.stringify(resetState)); // Reinitialize only dailyBoosters
    setBaseTapMultiplier(1);
    setTapMultiplier(1);
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
    setTelegramData({
      telegram_user_id: "",
      username: "User",
      image_url: `${process.env.PUBLIC_URL}/profile-picture.png`,
    });
  };

  // Fetch user profile from backend on component mount
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
        // Detect account deletion by checking reset stats
        if (data.total_coins === 0 && data.level === 1) {
          resetBoosters(); // Full reset if account is deleted
        } else {
          setProfile(data);
          setTotalTaps(data.total_coins || 0);
          setCurrentStreak(data.streak?.current_streak || 0);

          // Load electric boost and last tap time from localStorage
          const savedBoost = localStorage.getItem("electricBoost");
          const savedTapTime = localStorage.getItem("lastTapTime");
          const initialBoost = savedBoost !== null ? parseInt(savedBoost, 10) : maxElectricBoost;
          lastTapTime.current = savedTapTime !== null ? parseInt(savedTapTime, 10) : Date.now();

          // Calculate initial recharge or auto-tap gains based on time elapsed
          const now = Date.now();
          const timeSinceLastTap = now - lastTapTime.current;
          if (timeSinceLastTap >= rechargeTime) {
            const pointsToAdd = Math.floor(timeSinceLastTap / rechargeTime);
            const newBoost = Math.min(initialBoost + pointsToAdd, maxElectricBoost);
            setElectricBoost(newBoost);
            localStorage.setItem("electricBoost", newBoost.toString());
          } else {
            setElectricBoost(initialBoost);
          }

          // Apply offline auto-tap gains if active
          if (autoTapActive && timeSinceLastTap > 1000) {
            const autoTaps = Math.floor(timeSinceLastTap / 1000) * baseTapMultiplier;
            setTotalTaps((prev) => prev + autoTaps);
            tapCountSinceLastUpdate.current += autoTaps;
          }
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        navigate("/splash"); // Redirect on failure
      }
    };
    fetchProfile();

    // Set Telegram data without reset trigger here
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
  }, [navigate, maxElectricBoost, rechargeTime, autoTapActive, baseTapMultiplier]);

  // Sync tap count with backend every 2 seconds or on unmount
  const updateBackend = useCallback(async () => {
    if (tapCountSinceLastUpdate.current === 0) return;

    const tapsToSync = tapCountSinceLastUpdate.current;
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
          setTotalTaps(data["current coins"]); // Trust backend total
          setProfile((prev) => ({
            ...prev,
            level: data["current level"] || prev.level,
          }));
          tapCountSinceLastUpdate.current = 0;
        }
      } else {
        console.error("Failed to sync coins:", await response.text());
      }
    } catch (err) {
      console.error("Error syncing with backend:", err);
    }
  }, []);

  // Set up backend sync interval and cleanup
  useEffect(() => {
    const interval = setInterval(updateBackend, 2000); // Sync every 2 seconds
    return () => {
      clearInterval(interval);
      updateBackend(); // Sync remaining taps on unmount
    };
  }, [updateBackend]);

  // Handle electric boost recharge
  useEffect(() => {
    const checkRecharge = () => {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTime.current;

      // Start recharging only after rechargeTime has passed since last tap
      if (timeSinceLastTap >= rechargeTime && electricBoost < maxElectricBoost) {
        if (!rechargeInterval.current) {
          rechargeInterval.current = setInterval(() => {
            setElectricBoost((prev) => {
              const newBoost = Math.min(prev + 1, maxElectricBoost);
              localStorage.setItem("electricBoost", newBoost.toString());
              if (newBoost === maxElectricBoost) {
                clearInterval(rechargeInterval.current);
                rechargeInterval.current = null;
              }
              return newBoost;
            });
          }, rechargeTime); // Recharge 1 point every rechargeTime ms
        }
      } else if (rechargeInterval.current && timeSinceLastTap < rechargeTime) {
        // Stop recharge if tapping resumes before rechargeTime
        clearInterval(rechargeInterval.current);
        rechargeInterval.current = null;
      }
    };

    const interval = setInterval(checkRecharge, 1000); // Check every second
    return () => {
      clearInterval(interval);
      if (rechargeInterval.current) {
        clearInterval(rechargeInterval.current);
        rechargeInterval.current = null;
      }
    };
  }, [electricBoost, maxElectricBoost, rechargeTime]);

  // Handle Tapper Boost activation
  useEffect(() => {
    const handleTapperBoostActivated = () => {
      const boosters = JSON.parse(localStorage.getItem("dailyBoosters") || "{}");
      if (boosters.tapperBoost?.isActive) {
        setTapMultiplier((prev) => prev * 2); // Double the current multiplier
        const remainingTime = boosters.tapperBoost.endTime - Date.now();
        if (remainingTime > 0) {
          setTimeout(() => {
            setTapMultiplier((prev) => prev / 2); // Revert after remaining time
          }, remainingTime);
        }
      }
    };

    const handleTapperBoostDeactivated = () => {
      setTapMultiplier((prev) => prev / 2); // Revert multiplier
    };

    window.addEventListener("tapperBoostActivated", handleTapperBoostActivated);
    window.addEventListener("tapperBoostDeactivated", handleTapperBoostDeactivated);
    return () => {
      window.removeEventListener("tapperBoostActivated", handleTapperBoostActivated);
      window.removeEventListener("tapperBoostDeactivated", handleTapperBoostDeactivated);
    };
  }, []);

  // Handle Full Energy claim
  useEffect(() => {
    const handleFullEnergyClaimed = () => {
      setElectricBoost(maxElectricBoost); // Instantly set to current max
      localStorage.setItem("electricBoost", maxElectricBoost.toString());
    };

    window.addEventListener("fullEnergyClaimed", handleFullEnergyClaimed);
    return () => window.removeEventListener("fullEnergyClaimed", handleFullEnergyClaimed);
  }, [maxElectricBoost]);

  // Handle Extra Boosters
  // eslint-disable-next-line react-hooks/exhaustive-deps
  
  useEffect(() => {
    const handleBoostUpgraded = (event) => {
      const newLevel = event.detail.level;
      setBaseTapMultiplier(1 + newLevel); // Permanent increase by +1 per level
      setTapMultiplier((prev) => prev > baseTapMultiplier ? prev : 1 + newLevel); // Update if not boosted
    };

    const handleMultiplierUpgraded = (event) => {
      const newLevel = event.detail.level;
      const newMax = 1000 + newLevel * 500; // Increase by 500 per level
      setMaxElectricBoost(newMax);
      setElectricBoost((prev) => Math.min(prev, newMax)); // Adjust current boost if needed
      localStorage.setItem("electricBoost", Math.min(electricBoost, newMax).toString());
    };

    const handleRechargeSpeedUpgraded = (event) => {
      const newLevel = event.detail.level;
      const newRechargeTime = RECHARGE_TIMES[Math.min(newLevel, RECHARGE_TIMES.length - 1)];
      setRechargeTime(newRechargeTime);
      if (rechargeInterval.current) {
        clearInterval(rechargeInterval.current);
        rechargeInterval.current = null; // Restart with new interval on next check
      }
    };

    const handleAutoTapActivated = (event) => {
      setAutoTapActive(true);
      if (!autoTapInterval.current) {
        autoTapInterval.current = setInterval(() => {
          setTotalTaps((prev) => prev + baseTapMultiplier); // Auto-tap with base multiplier
          tapCountSinceLastUpdate.current += baseTapMultiplier;
          setElectricBoost((prev) => {
            const newBoost = Math.max(prev - 1, 0);
            localStorage.setItem("electricBoost", newBoost.toString());
            return newBoost;
          });
        }, 1000); // 1 tap per second
      }
    };

    window.addEventListener("boostUpgraded", handleBoostUpgraded);
    window.addEventListener("multiplierUpgraded", handleMultiplierUpgraded);
    window.addEventListener("rechargeSpeedUpgraded", handleRechargeSpeedUpgraded);
    window.addEventListener("autoTapActivated", handleAutoTapActivated);
    return () => {
      window.removeEventListener("boostUpgraded", handleBoostUpgraded);
      window.removeEventListener("multiplierUpgraded", handleMultiplierUpgraded);
      window.removeEventListener("rechargeSpeedUpgraded", handleRechargeSpeedUpgraded);
      window.removeEventListener("autoTapActivated", handleAutoTapActivated);
      if (autoTapInterval.current) {
        clearInterval(autoTapInterval.current);
        autoTapInterval.current = null;
      }
    };
  }, [baseTapMultiplier, electricBoost]);

  /**
   * Handles tap events on the big tap icon, increments total taps with multiplier, and shows a tap effect.
   * @param {Object} event - The tap or click event object.
   */
  const handleTap = (event) => {
    event.preventDefault(); // Prevent default behavior

    if (electricBoost <= 0) return; // Prevent taps if no boost remains

    // Clear any existing recharge interval when tapping
    if (rechargeInterval.current) {
      clearInterval(rechargeInterval.current);
      rechargeInterval.current = null;
    }

    // Update last tap time for recharge logic
    lastTapTime.current = Date.now();
    localStorage.setItem("lastTapTime", lastTapTime.current);

    // Increment total taps with multiplier
    const tapValue = tapMultiplier; // Combined multiplier (base + temp boosts)
    setTotalTaps((prev) => prev + tapValue);
    tapCountSinceLastUpdate.current += tapValue;

    // Decrease electric boost by 1 only, regardless of tap value
    setElectricBoost((prev) => {
      const newBoost = Math.max(prev - 1, 0);
      localStorage.setItem("electricBoost", newBoost.toString());
      return newBoost;
    });

    // Get tap coordinates relative to the tap icon
    const tapIcon = event.currentTarget.getBoundingClientRect();
    const tapX = (event.touches ? event.touches[0].clientX : event.clientX) - tapIcon.left;
    const tapY = (event.touches ? event.touches[0].clientY : event.clientY) - tapIcon.top;

    // Add a new tap effect without replacing existing ones, showing the boosted value
    const newTapEffect = { id: Date.now(), x: tapX, y: tapY };
    setTapEffects((prev) => [...prev, newTapEffect]);

    // Trigger slight bounce animation
    const tapElement = event.currentTarget;
    tapElement.classList.add("tap-animation");
    setTimeout(() => tapElement.classList.remove("tap-animation"), 200);

    // Remove the tap effect after 1 second
    setTimeout(() => {
      setTapEffects((prev) => prev.filter((effect) => effect.id !== newTapEffect.id));
    }, 1000);
  };

  return (
    <div className="dashboard-container">
      {/* Profile and Streak Section */}
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
          className="big-tap-icon"
          onTouchStart={handleTap}
          onMouseDown={handleTap}
        >
          <img className="tap-logo-big" src={`${process.env.PUBLIC_URL}/logo.png`} alt="Big Tap Icon" />
          {/* Tap Effects */}
          {tapEffects.map((effect) => (
            <div
              key={effect.id}
              className="tap-effect"
              style={{ top: `${effect.y}px`, left: `${effect.x}px` }}
            >
              +{tapMultiplier} {/* Display the boosted value */}
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