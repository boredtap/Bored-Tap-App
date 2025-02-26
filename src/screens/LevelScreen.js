import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import "./LevelScreen.css";

/**
 * LevelScreen component for displaying user level progress and available levels.
 * Fetches user profile data to dynamically show current level, coins, and progress.
 */
const LevelScreen = () => {
  // State for user profile data
  const [profile, setProfile] = useState(null);

  // Predefined level data with thresholds
  const levelData = [
    { label: "Novice", value: 0, icon: `${process.env.PUBLIC_URL}/novice.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 1 },
    { label: "Explorer", value: 5000, icon: `${process.env.PUBLIC_URL}/explorer.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 2 },
    { label: "Apprentice", value: 25000, icon: `${process.env.PUBLIC_URL}/apprentice.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 3 },
    { label: "Warrior", value: 100000, icon: `${process.env.PUBLIC_URL}/warrior.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 4 },
    { label: "Master", value: 500000, icon: `${process.env.PUBLIC_URL}/master.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 5 },
    { label: "Champion", value: 1000000, icon: `${process.env.PUBLIC_URL}/champion.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 6 },
    { label: "Tactician", value: 20000000, icon: `${process.env.PUBLIC_URL}/tactician.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 7 },
    { label: "Specialist", value: 100000000, icon: `${process.env.PUBLIC_URL}/specialist.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 8 },
    { label: "Conqueror", value: 500000000, icon: `${process.env.PUBLIC_URL}/conqueror.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 9 },
    { label: "Legend", value: 1000000000, icon: `${process.env.PUBLIC_URL}/legend.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 10 },
  ];

  // Fetch user profile on mount
  useEffect(() => {
    /**
     * Fetches user profile data from the backend to determine current level and coins.
     */
    const fetchProfile = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

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
        setProfile(data);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, []);

  // Determine current level and progress
  const currentLevel = profile ? profile.level || 1 : 1;
  const currentCoins = profile ? profile.total_coins || 0 : 0;
  const currentLevelIndex = levelData.findIndex((level) => level.cardNumber === currentLevel);
  const nextLevelIndex = currentLevelIndex + 1 < levelData.length ? currentLevelIndex + 1 : currentLevelIndex;
  const currentLevelData = levelData[currentLevelIndex] || levelData[0];
  const nextLevelData = levelData[nextLevelIndex] || levelData[levelData.length - 1];
  const coinsToNextLevel = nextLevelData.value - currentCoins;
  const progressPercentage = ((currentCoins - currentLevelData.value) / (nextLevelData.value - currentLevelData.value)) * 100;

  return (
    <div className="level-screen">
      {/* Centralized Level Icon and Current Level */}
      <div className="level-header">
        <img
          src={currentLevelData.icon}
          alt={`${currentLevelData.label} Icon`}
          className="level-icon"
        />
        <div className="level-text">Lvl. {currentLevel} {currentLevelData.label}</div>
      </div>

      {/* Progress and Coins */}
      <div className="progress-info">
        <span className="next-level">Next level: {nextLevelData.cardNumber}</span>
        <div className="coin-info">
          <img
            src={`${process.env.PUBLIC_URL}/logo.png`}
            alt="Coin Icon"
            className="coin-icon"
          />
          <span className="coin-text">
            {currentCoins.toLocaleString()} ({coinsToNextLevel > 0 ? coinsToNextLevel.toLocaleString() : 0} left)
          </span>
        </div>
      </div>

      {/* Loading Bar */}
      <div className="loading-bar">
        <div
          className="loader"
          style={{ width: `${Math.min(Math.max(progressPercentage, 0), 100)}%` }}
        ></div>
      </div>

      {/* Data Cards */}
      <div className="level-data-cards">
        {levelData.map((item, index) => (
          <div
            key={index}
            className="level-data-card"
            style={{
              backgroundColor: item.cardNumber > currentLevel ? "transparent" : "#414141",
              border: item.cardNumber > currentLevel ? "0px solid #fff" : "none",
            }}
          >
            <div className="level-data-left">
              <img src={item.icon} alt={item.label} className="level-card-icon" />
              <div className="level-info">
                <div className="level-label">{item.label}</div>
                <div className="level-small-icon">
                  <img src={item.smallIcon} alt="Coin Icon" className="small-coin-icon" />
                  <span>{item.value.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="level-data-right">
              <div className="card-number">{item.cardNumber}</div>
            </div>
          </div>
        ))}
      </div>

      <Navigation />
    </div>
  );
};

export default LevelScreen;