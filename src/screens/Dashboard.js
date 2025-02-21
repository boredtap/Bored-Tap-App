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

  // Refs for managing backend updates and electric recharge
  const tapCountSinceLastUpdate = useRef(0);
  const updateBackendTimeout = useRef(null);
  const rechargeInterval = useRef(null);
  const isTapping = useRef(false);
  let isHandlingTap = false; // Debounce flag for tap handling

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

  // Effect for fetching profile data and restoring electricBoost
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
          if (response.status === 401) {
            throw new Error("Unauthorized. Please log in again.");
          }
          throw new Error("Failed to fetch profile data.");
        }

        const data = await response.json();
        setProfile(data);
        setTotalTaps(data.total_coins);
        setCurrentStreak(data.streak.current_streak || 0);

        // Restore electricBoost from localStorage
        const savedBoost = localStorage.getItem("electricBoost");
        const lastUpdateTime = localStorage.getItem("lastBoostUpdateTime");
        if (savedBoost && lastUpdateTime) {
          const timeElapsed = Math.floor((Date.now() - parseInt(lastUpdateTime)) / 1000); // seconds
          const rechargedAmount = Math.min(timeElapsed, 1000 - parseInt(savedBoost));
          setElectricBoost(parseInt(savedBoost) + rechargedAmount);
        } else {
          // Initialize localStorage if not present
          localStorage.setItem("electricBoost", 1000);
          localStorage.setItem("lastBoostUpdateTime", Date.now());
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, [navigate]);

  // Function to start or resume electric boost recharging
  const startRecharge = () => {
    if (rechargeInterval.current) clearInterval(rechargeInterval.current);
    rechargeInterval.current = setInterval(() => {
      setElectricBoost((prev) => {
        if (prev < 1000) {
          const newBoost = prev + 1;
          localStorage.setItem("electricBoost", newBoost);
          localStorage.setItem("lastBoostUpdateTime", Date.now());
          return newBoost;
        } else {
          clearInterval(rechargeInterval.current);
          return 1000;
        }
      });
    }, 1000); // Recharge 1 per second
  };

  // Stop recharging when tapping starts
  const stopRecharge = () => {
    if (rechargeInterval.current) clearInterval(rechargeInterval.current);
  };

  // Handle tap events with improved debounce
  const handleTap = (event) => {
    setTapAnimation(true);
    setBoostAnimation(true); // Trigger boost animation
    setTimeout(() => {
      setTapAnimation(false);
      setBoostAnimation(false); // Reset both animations
    }, 500); // Adjust duration as needed
    updateBackend(); // Update backend on every tap
    if (isHandlingTap) return;
    isHandlingTap = true;
    setTimeout(() => { isHandlingTap = false; }, 300); // Increased to 300ms for better debounce

    if (electricBoost === 0) return;

    const fingersCount = event.touches?.length || 1;
    setTotalTaps((prev) => prev + fingersCount);
    setElectricBoost((prev) => {
      const newBoost = Math.max(prev - fingersCount, 0);
      localStorage.setItem("electricBoost", newBoost);
      localStorage.setItem("lastBoostUpdateTime", Date.now());
      return newBoost;
    });

    // Tap effect for visual feedback
    const tapX = event.touches?.[0]?.clientX || event.clientX;
    const tapY = event.touches?.[0]?.clientY || event.clientY;
    const newTapEffect = { id: Date.now(), x: tapX, y: tapY, count: fingersCount };
    setTapEffects((prevEffects) => [...prevEffects, newTapEffect]);

    // Trigger animations
    setTapAnimation(true);
    setTimeout(() => setTapAnimation(false), 500);
    setTimeout(() => setTapEffects((prev) => prev.filter((e) => e.id !== newTapEffect.id)), 1000);

    // Set tapping state and update backend
    isTapping.current = true;
    if (updateBackendTimeout.current) clearTimeout(updateBackendTimeout.current);
    updateBackendTimeout.current = setTimeout(() => {
      isTapping.current = false;
      updateBackend();
      startRecharge();
    }, 1000);

    playTapSound();
  };

  const playTapSound = () => {
    const audio = new Audio(`${process.env.PUBLIC_URL}/tap.mp3`);
    audio.volume = 0.3;
    audio.play().catch((err) => console.error("Audio playback error:", err));
  };

  // Update backend with total taps
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
        } else {
          console.error("Failed to update backend:", data.detail);
        }
      } catch (err) {
        console.error("Error updating backend:", err);
      } finally {
        tapCountSinceLastUpdate.current = 0;
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

  const { level = 1 } = profile || {};

  return (
    <div className="dashboard-container">
      {/* Profile and Streak Section */}
      <div className="profile1-streak-section">
        <div className="profile1-section" onClick={() => navigate("/profile-screen")}>
          <img src={telegramData.image_url} alt="Profile" className="profile1-picture" />
          <div className="profile1-info">
            <span className="profile1-username">{telegramData.username}</span>
            <span className="profile1-level">Lvl {level}</span>
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

      {/* Electric Boost Section */}
      <div className="electric-boost-section">
        <div className={`electric-value ${boostAnimation ? "boost-animation" : ""}`}>
          <img src={`${process.env.PUBLIC_URL}/electric-icon.png`} alt="Electric Icon" className="electric-icon" />
          <span>{electricBoost}/1000</span>
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