import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import useSound from "use-sound";
import debounce from "lodash/debounce";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [play] = useSound(`${process.env.PUBLIC_URL}/tap-sound.mp3`, { volume: 0.5 });
  
  const [telegramData, setTelegramData] = useState({
    telegram_user_id: "",
    username: "User",
    image_url: "",
  });
  
  const currentStreak = 0;
  const level = 1;
  
  const [totalTaps, setTotalTaps] = useState(0);
  const [electricBoost, setElectricBoost] = useState(1000);
  const [tapAnimations, setTapAnimations] = useState([]);
  const [boostAnimation, setBoostAnimation] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Refs for tracking tap updates
  const lastTapTime = useRef(Date.now());
  const pendingTaps = useRef(0);
  const authToken = localStorage.getItem("accessToken");

  // Initialize dashboard with user data and authentication
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        const storedUser = localStorage.getItem("telegramUser");
        if (!storedUser || !authToken) {
          navigate("/");
          return;
        }

        const userData = JSON.parse(storedUser);
        setTelegramData(userData);

        // Fetch user's current tap count from backend
        const response = await fetch("https://bored-tap-api.onrender.com/user/stats", {
          headers: {
            "Authorization": `Bearer ${authToken}`,
            "Content-Type": "application/json"
          }
        });

        if (response.ok) {
          const data = await response.json();
          setTotalTaps(data.total_taps || 0);
          setElectricBoost(data.electric_boost || 1000);
        }
      } catch (err) {
        console.error("Error initializing dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [navigate, authToken]);

  // Debounced function to update taps to backend
  const updateTapsToBackend = debounce(async (newTotalTaps) => {
    try {
      await fetch("https://bored-tap-api.onrender.com/update-taps", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          total_taps: newTotalTaps,
          telegram_user_id: telegramData.telegram_user_id
        })
      });
    } catch (err) {
      console.error("Error updating taps:", err);
    }
  }, 3000);

  // Handle tap with multi-touch support
  const handleTap = (event) => {
    event.preventDefault();
    const touches = event.touches?.length || 1;
    const currentTime = Date.now();
    
    // Play tap sound
    play();

    // Create animations for each touch
    const newAnimations = Array(touches).fill().map((_, index) => ({
      id: `${currentTime}-${index}`,
      x: event.touches ? event.touches[index].clientX : event.clientX,
      y: event.touches ? event.touches[index].clientY : event.clientY
    }));

    setTapAnimations(prev => [...prev, ...newAnimations]);
    
    // Remove animations after they complete
    setTimeout(() => {
      setTapAnimations(prev => prev.filter(anim => !newAnimations.includes(anim)));
    }, 500);

    // Update taps and electric boost
    setTotalTaps(prev => prev + touches);
    setElectricBoost(prev => Math.max(0, prev - touches));
    pendingTaps.current += touches;
    lastTapTime.current = currentTime;

    // Update backend if enough time has passed
    if (currentTime - lastTapTime.current >= 3000) {
      updateTapsToBackend(totalTaps + pendingTaps.current);
      pendingTaps.current = 0;
    }
  };

  // Electric boost recharge effect
  useEffect(() => {
    const rechargeInterval = setInterval(() => {
      setElectricBoost(1000);
    }, 60 * 60 * 1000); // 1 hour

    return () => clearInterval(rechargeInterval);
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="profile-streak-section">
        <div className="profile-section" onClick={() => navigate("/profile-screen")}>
          <img
            src={telegramData.image_url || `${process.env.PUBLIC_URL}/profile-picture.png`}
            alt="Profile"
            className="profile-picture"
          />
          <div className="profile-info">
            <span className="profile-username">{telegramData.username}</span>
            <span className="profile-level">Lvl {level}</span>
          </div>
        </div>

        <div className="streak-section" onClick={() => navigate("/daily-streak-screen")}>
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
          className="big-tap-icon"
          onTouchStart={handleTap}
          onClick={handleTap}
        >
          <img
            className="tap-logo-big"
            src={`${process.env.PUBLIC_URL}/logo.png`}
            alt="Big Tap Icon"
          />
          {tapAnimations.map(animation => (
            <div
              key={animation.id}
              className="tap-bonus"
              style={{
                left: animation.x,
                top: animation.y,
                position: 'absolute',
                animation: 'tapAnimation 0.5s ease-out'
              }}
            >
              +1
            </div>
          ))}
        </div>
      </div>

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