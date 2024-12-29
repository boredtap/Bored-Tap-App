import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();

  const [telegramData, setTelegramData] = useState({
    telegram_user_id: "",
    username: "User",
    image_url: "",
  });

  const currentStreak = 0;
  const level = 1;

  const [totalTaps, setTotalTaps] = useState(0);
  const [electricBoost, setElectricBoost] = useState(1000);
  const [tapAnimation, setTapAnimation] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        if (window.Telegram?.WebApp) {
          const user = window.Telegram.WebApp.initDataUnsafe.user;

          if (user) {
            const telegramInfo = {
              telegram_user_id: user.id,
              username: user.username || `User${user.id}`,
              image_url:
                user.photo_url || `${process.env.PUBLIC_URL}/profile-picture.png`,
            };

            setTelegramData(telegramInfo);

            const response = await fetch(
              "https://bored-tap-api.onrender.com/sign-up",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(telegramInfo),
              }
            );

            const data = await response.json();
            if (data.success) {
              console.log("User authenticated");
            } else {
              console.error("Authentication failed:", data.message);
            }
          } else {
            console.error("Telegram user data not available");
          }
        }
      } catch (err) {
        console.error("Error syncing Telegram data:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, []);

  const handleTap = (event) => {
    const fingersCount = event.touches?.length || 1;

    setTotalTaps((prev) => prev + fingersCount);
    setElectricBoost((prev) => (prev > 0 ? prev - fingersCount : prev));

    setTapAnimation(true);
    playTapSound();
    setTimeout(() => setTapAnimation(false), 300);
  };

  const playTapSound = () => {
    const audio = new Audio(`${process.env.PUBLIC_URL}/tap.mp3`);
    audio.volume = 0.4; // Set a comfortable volume
    audio.play().catch((err) => console.error("Audio playback error:", err));
  };

  useEffect(() => {
    if (electricBoost === 0) {
      const rechargeInterval = setInterval(() => {
        setElectricBoost(1000);
      }, 30 * 60 * 1000);
      return () => clearInterval(rechargeInterval);
    }
  }, [electricBoost]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
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
            <span className="profile-level">Lvl {level}</span>
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
          <div className="tap-bonus">+1</div>
        </div>
      </div>

      <div className="electric-boost-section">
        <div className="electric-value">
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
