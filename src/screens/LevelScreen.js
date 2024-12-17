import React from "react";
import AppBar from "../components/AppBar";
import Navigation from "../components/Navigation";
import "./LevelScreen.css";

const LevelScreen = () => {
  const handleBackClick = () => {
    console.log("Navigating back from Level Screen...");
  };

  const handleMoreClick = () => {
    console.log("Opening more options...");
  };

  const handleDropdownClick = () => {
    console.log("Opening dropdown menu...");
  };

  const levelData = [
    { label: "Novice", value: "0", icon: `${process.env.PUBLIC_URL}/level-icon.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 1 },
    { label: "Explorer", value: "5000", icon: `${process.env.PUBLIC_URL}/level-icon.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 2 },
    { label: "Apprentice", value: "25000", icon: `${process.env.PUBLIC_URL}/level-icon.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 3 },
    { label: "Warrior", value: "100000", icon: `${process.env.PUBLIC_URL}/level-icon.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 4 },
    { label: "Master", value: "500000", icon: `${process.env.PUBLIC_URL}/level-icon.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 5 },
    { label: "Champion", value: "1000000", icon: `${process.env.PUBLIC_URL}/level-icon.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 6 },
    { label: "Tactician", value: "20000000", icon: `${process.env.PUBLIC_URL}/level-icon.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 7 },
    { label: "Specialist", value: "100000000", icon: `${process.env.PUBLIC_URL}/level-icon.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 8 },
    { label: "Conqueror", value: "500000000", icon: `${process.env.PUBLIC_URL}/level-icon.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 9 },
    { label: "Legend", value: "1000000000", icon: `${process.env.PUBLIC_URL}/level-icon.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 10 },
  ];

  return (
    <div className="level-screen">
      {/* AppBar */}
      <AppBar
        title="Level Progress"
        onBackClick={handleBackClick}
        onMoreClick={handleMoreClick}
        onDropdownClick={handleDropdownClick}
      />

      {/* Centralized Level Icon */}
      <div className="level-header">
        <img
          src={`${process.env.PUBLIC_URL}/level.png`}
          alt="Level Icon"
          className="level-icon"
        />
        <div className="level-text">Lvl 4 Warrior</div>
      </div>

      {/* Progress and Coins */}
      <div className="progress-info">
        <span className="next-level">Next level: 5</span>
        <div className="coin-info">
          <img
            src={`${process.env.PUBLIC_URL}/logo.png`}
            alt="Coin Icon"
            className="coin-icon"
          />
          <span className="coin-text">500,000 (327,938 left)</span>
        </div>
      </div>

      {/* Loading Bar */}
      <div className="loading-bar">
        <div className="loader" style={{ width: "35%" }}></div>
      </div>

      {/* Data Cards */}
      <div className="level-data-cards">
        {levelData.map((item, index) => (
          <div
            key={index}
            className="level-data-card"
            style={{
              backgroundColor: index >= 4 ? "transparent" : "#414141",
              border: index >= 4 ? "0px solid #fff" : "none",
            }}
          >
            <div className="level-data-left">
              <img src={item.icon} alt={item.label} className="level-card-icon" />
              <div className="level-info">
                <div className="level-label">{item.label}</div>
                <div className="level-small-icon">
                  <img src={item.smallIcon} alt="Coin Icon" className="small-coin-icon" />
                  <span>{item.value}</span>
                </div>
              </div>
            </div>
            <div className="level-data-right">
              <div className="card-number">{item.cardNumber}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default LevelScreen;
