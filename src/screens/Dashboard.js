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

  const [totalTaps, setTotalTaps] = useState(0);
  const [electricBoost, setElectricBoost] = useState(1000);
  const [tapAnimation, setTapAnimation] = useState(false);
  const [boostAnimation, setBoostAnimation] = useState(false); // Handles boost animation
  const [loading, setLoading] = useState(true);
  const [tapEffects, setTapEffects] = useState([]); // Tracks "+1" animations

  const tapCountSinceLastUpdate = useRef(0); // Tracks taps for backend updates
  const updateBackendTimeout = useRef(null); // Timeout for backend updates
  const rechargeTimeout = useRef(null); // Timeout for electric boost recharge

  // Initialization effect: fetch user data and total taps
  useEffect(() => {
    const initializeDashboard = async () => {
      const token = localStorage.getItem("accessToken");
      const storedUser = JSON.parse(localStorage.getItem("telegramUser"));

      if (!token || !storedUser) {
        navigate("/splash");
        return;
      }

      setTelegramData(storedUser);

      try {
        const response = await fetch("https://bored-tap-api.onrender.com/user-data", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const data = await response.json();
        setTotalTaps(data.total_taps || 0);
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [navigate]);

  // Handle tapping events
  const handleTap = (event) => {
    if (electricBoost === 0) return; // Stop tapping if electric boost is depleted

    const fingersCount = event.touches?.length || 1;
    setTotalTaps((prev) => prev + fingersCount);
    setElectricBoost((prev) => Math.max(prev - fingersCount, 0));
    tapCountSinceLastUpdate.current += fingersCount; // Track taps for backend updates

    // Display tap animation
    const tapX = event.touches?.[0]?.clientX || event.clientX;
    const tapY = event.touches?.[0]?.clientY || event.clientY;
    const newTapEffect = { id: Date.now(), x: tapX, y: tapY, count: fingersCount };
    setTapEffects((prevEffects) => [...prevEffects, newTapEffect]);

    playTapSound();

    setTapAnimation(true);
    setBoostAnimation(true); // Start boost animation
    setTimeout(() => {
      setTapAnimation(false);
      setBoostAnimation(false); // Stop boost animation
    }, 500);

    setTimeout(() => {
      setTapEffects((prevEffects) =>
        prevEffects.filter((effect) => effect.id !== newTapEffect.id)
      );
    }, 1000);

    // Start backend update timer
    if (updateBackendTimeout.current) {
      clearTimeout(updateBackendTimeout.current);
    }
    updateBackendTimeout.current = setTimeout(updateBackend, 3000);
  };

  const playTapSound = () => {
    const audio = new Audio(`${process.env.PUBLIC_URL}/tap.mp3`);
    audio.volume = 0.3;
    audio.play().catch((err) => console.error("Audio playback error:", err));
  };

  // Update backend with accumulated taps
  const updateBackend = async () => {
    if (tapCountSinceLastUpdate.current <= 0) return;

    const token = localStorage.getItem("accessToken");
    try {
      const response = await fetch(
        `https://bored-tap-api.onrender.com/update-coins?coins=${tapCountSinceLastUpdate.current}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update backend with taps");
      }

      console.log("Taps updated successfully");
    } catch (err) {
      console.error("Error updating backend:", err);
    } finally {
      tapCountSinceLastUpdate.current = 0;
    }
  };

  // Recharge electric boost after 1 hour if depleted
  useEffect(() => {
    if (electricBoost === 0) {
      rechargeTimeout.current = setTimeout(() => {
        setElectricBoost(1000);
        console.log("Electric boost recharged to 1000/1000");
      }, 60 * 60 * 1000);
    }

    return () => {
      if (rechargeTimeout.current) {
        clearTimeout(rechargeTimeout.current);
      }
    };
  }, [electricBoost]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Profile and Streak Section */}
      <div className="profile-streak-section">
        <div
          className="profile-section"
          onClick={() => navigate("/profile-screen")}
        >
          <img
            src={telegramData.image_url}
            alt="Profile"
            className="profile-picture"
          />
          <div className="profile-info">
            <span className="profile-username">{telegramData.username}</span>
            <span className="profile-level">Lvl {telegramData.level || 1}</span>
          </div>
        </div>

        <div
          className="streak-section"
          onClick={() => navigate("/daily-streak-screen")}
        >
          <img
            src={`${process.env.PUBLIC_URL}/streak.png`}
            alt="Streak Icon"
            className="streak-icon"
          />
          <div className="streak-info">
            <span className="streak-text">Current Streak</span>
            <span className="streak-days">{telegramData.currentStreak || 0} Days</span>
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
          <div
            className="frame"
            key={index}
            onClick={() => navigate(frame.path)}
          >
            <img
              src={`${process.env.PUBLIC_URL}/${frame.icon}`}
              alt={`${frame.name} Icon`}
              className="frame-icon"
            />
            <span>{frame.name}</span>
          </div>
        ))}
      </div>

      {/* Total Taps Section */}
      <div className="total-taps-section">
        <p className="total-taps-text">Your Total Taps:</p>
        <div className="total-taps-count">
          <img
            className="tap-logo-small"
            src={`${process.env.PUBLIC_URL}/logo.png`}
            alt="Small Icon"
          />
          <span>{totalTaps}</span>
        </div>
        <div
          className={`big-tap-icon ${tapAnimation ? "tap-animation" : ""}`}
          onTouchStart={handleTap}
          onClick={handleTap}
        >
          <img
            className="tap-logo-big"
            src={`${process.env.PUBLIC_URL}/logo.png`}
            alt="Big Tap Icon"
          />
        </div>

        {/* Render floating "+1" effects */}
        {tapEffects.map((effect) => (
          <div
            key={effect.id}
            className="tap-effect"
            style={{ top: effect.y, left: effect.x }}
          >
            +{effect.count}
          </div>
        ))}
      </div>

      {/* Electric Boost Section */}
      <div className="electric-boost-section">
        <div className={`electric-value ${boostAnimation ? "boost-animation" : ""}`}>
          <img
            src={`${process.env.PUBLIC_URL}/electric-icon.png`}
            alt="Electric Icon"
            className="electric-icon"
          />
          <span>{electricBoost}/1000</span>
        </div>
        <button className="boost-btn" onClick={() => navigate("/boost-screen")}>
          <img
            src={`${process.env.PUBLIC_URL}/boostx2.png`}
            alt="Boost Icon"
            className="boost-icon"
          />
          Boost
        </button>
      </div>

      <Navigation />
    </div>
  );
};

export default Dashboard;
