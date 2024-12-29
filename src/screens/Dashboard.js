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
  const [boostMultiplier, setBoostMultiplier] = useState(1);
  const [loading, setLoading] = useState(true);
  
  const lastTapTime = useRef(Date.now());
  const pendingTaps = useRef(0);
  const authToken = localStorage.getItem("accessToken");
  const boostTimeoutRef = useRef(null);

  // Initialize dashboard
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
          setBoostMultiplier(data.boost_multiplier || 1);
        }
      } catch (err) {
        console.error("Error initializing dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [navigate, authToken]);

  // Update taps to backend
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

  // Handle tap with multi-touch and boost
  const handleTap = (event) => {
    event.preventDefault();
    const touches = event.touches?.length || 1;
    const currentTime = Date.now();
    
    play();

    // Create animations for each touch
    const newAnimations = Array(touches).fill().map((_, index) => ({
      id: `${currentTime}-${index}`,
      x: event.touches ? event.touches[index].clientX : event.clientX,
      y: event.touches ? event.touches[index].clientY : event.clientY,
      value: boostMultiplier // Show boosted value in animation
    }));

    setTapAnimations(prev => [...prev, ...newAnimations]);
    
    // Remove animations after they complete
    setTimeout(() => {
      setTapAnimations(prev => prev.filter(anim => !newAnimations.includes(anim)));
    }, 500);

    // Calculate tap value with boost
    const tapValue = touches * boostMultiplier;

    // Update taps and electric boost
    setTotalTaps(prev => prev + tapValue);
    setElectricBoost(prev => Math.max(0, prev - touches));
    pendingTaps.current += tapValue;
    lastTapTime.current = currentTime;

    // Update backend if enough time has passed
    if (currentTime - lastTapTime.current >= 3000) {
      updateTapsToBackend(totalTaps + pendingTaps.current);
      pendingTaps.current = 0;
    }
  };

  // Handle boost activation
  const handleBoost = async () => {
    if (electricBoost >= 100) { // Require minimum electric boost to activate
      setBoostAnimation(true);
      setBoostMultiplier(2); // Double the tap value
      
      // Reduce electric boost
      setElectricBoost(prev => Math.max(0, prev - 100));

      // Clear existing timeout
      if (boostTimeoutRef.current) {
        clearTimeout(boostTimeoutRef.current);
      }

      // Reset boost after 30 seconds
      boostTimeoutRef.current = setTimeout(() => {
        setBoostMultiplier(1);
        setBoostAnimation(false);
      }, 30000);

      try {
        // Update boost status in backend
        await fetch("https://bored-tap-api.onrender.com/update-boost", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${authToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            telegram_user_id: telegramData.telegram_user_id,
            electric_boost: electricBoost - 100,
            boost_multiplier: 2
          })
        });
      } catch (err) {
        console.error("Error updating boost:", err);
      }
    }
  };

  // Electric boost recharge
  useEffect(() => {
    const rechargeInterval = setInterval(() => {
      setElectricBoost(1000);
      setBoostAnimation(true);
      setTimeout(() => setBoostAnimation(false), 1000);
    }, 60 * 60 * 1000); // 1 hour

    return () => {
      clearInterval(rechargeInterval);
      if (boostTimeoutRef.current) {
        clearTimeout(boostTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      {/* Profile and Streak Section */}
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

      {/* Taps Section */}
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
                position: 'absolute'
              }}
            >
              +{animation.value}
            </div>
          ))}
        </div>
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
        <button 
          className={`boost-btn ${boostMultiplier > 1 ? 'active' : ''}`}
          onClick={handleBoost}
          disabled={electricBoost < 100}
        >
          <img
            src={`${process.env.PUBLIC_URL}/boostx2.png`}
            alt="Boost Icon"
            className="boost-icon"
          />
          {boostMultiplier > 1 ? 'Boosted!' : 'Boost'}
        </button>
      </div>

      <Navigation />
    </div>
  );
};

export default Dashboard;