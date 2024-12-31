import React, { useState } from "react";
import Navigation from "../components/Navigation";
import "./BoostScreen.css";

const BoostScreen = () => {
  const [activeOverlay, setActiveOverlay] = useState(null);

  const extraBoosters = [
    {
      id: 1,
      icon: `${process.env.PUBLIC_URL}/boostx2.png`,
      title: "Boost X2",
      valueIcon: `${process.env.PUBLIC_URL}/logo.png`,
      value: "50,000",
      level: "Level 2",
      description: "Increase the amount of BT-Coin you can earn per one tap",
      subText: "+1 per tap for each level",
      ctaText: "Upgrade",
      actionIcon: `${process.env.PUBLIC_URL}/front-arrow.png`, // Path to right-side icon
    },
    {
      id: 2,
      icon: `${process.env.PUBLIC_URL}/multiply.png`,
      title: "Multiplier",
      valueIcon: `${process.env.PUBLIC_URL}/logo.png`,
      value: "150,000",
      level: "Level 3",
      description: "Increase your power limit, so you can tap more per session",
      subText: "+500 for each level",
      ctaText: "Upgrade",
      actionIcon: `${process.env.PUBLIC_URL}/front-arrow.png`,
    },
    {
      id: 3,
      icon: `${process.env.PUBLIC_URL}/autobot.png`,
      title: "Auto-Bot Tapping",
      valueIcon: `${process.env.PUBLIC_URL}/logo.png`,
      value: "2,000,000",
      level: "Level 5",
      description: "Purchase auto-bot to tap for you while you’re away",
      subText: "Connect wallet before purchase",
      ctaText: "Purchase",
      altCTA: "Connect Wallet",
      actionIcon: `${process.env.PUBLIC_URL}/front-arrow.png`,
    },
    {
      id: 4,
      icon: `${process.env.PUBLIC_URL}/electric-icon.png`,
      title: "Recharge Speed",
      valueIcon: `${process.env.PUBLIC_URL}/logo.png`,
      value: "50,000",
      level: "Level 2",
      description: "Increase speed of recharge",
      subText: "+1 per second",
      ctaText: "Upgrade",
      altCTA: "Insufficient Funds",
      actionIcon: `${process.env.PUBLIC_URL}/front-arrow.png`,
    },
  ];
  

  const dailyBoosters = [
    {
      id: 5,
      icon: `${process.env.PUBLIC_URL}/tapperboost.png`,
      title: "Tapper Boost",
      value: "Free",
      description: "Multiply your tap income by X5 for 20 seconds.",
      ctaText: "Claim",
    },
    {
      id: 6,
      icon: `${process.env.PUBLIC_URL}/electric-icon.png`,
      title: "Full Energy",
      value: "Free",
      description: "Fill your energy to 100% instantly 3 times per day",
      ctaText: "Claim",
    },
  ];

  const handleOverlayClose = () => setActiveOverlay(null);

  const renderOverlay = () => {
    if (!activeOverlay) return null;
  
    const { title, description, subText, /*valueIcon,*/ value, level, ctaText, altCTA } = activeOverlay;
  
    const isDisabled = altCTA && value === "Insufficient Funds";
  
    return (
      <div className="overlay">
        <div className="overlay-card">
          <div className="overlay-header">
            <h2>{title}</h2>
            <button className="overlay-close" onClick={handleOverlayClose}>✖</button>
          </div>
          {/* Added a CSS class to adjust division line spacing */}
          <hr className="division-line" />
          <img src={activeOverlay.icon} alt={title} className="overlay-icon" />
          <p className="overlay-description">{description}</p>
          {subText && <p className="overlay-subtext">{subText}</p>}
          <div className="overlay-value-container">
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Value Icon" className="value-icon-large" />
            <p className="overlay-value">{value}</p>
            <p className="overlay-level">{level}</p>
          </div>
          <button className="overlay-cta" disabled={isDisabled}>
            {isDisabled ? altCTA : ctaText}
          </button>
        </div>
      </div>
    );
  };
  return (
    <div className="boost-screen">

      {/* Total Taps Section */}
      <div className="total-taps-section">
        <p className="total-taps-text">Your Total Taps:</p>
        <div className="total-taps-container">
          <img
            src={`${process.env.PUBLIC_URL}/logo.png`}
            alt="Taps Icon"
            className="taps-icon"
          />
          <p className="total-taps-value">3,289,198</p>
        </div>
        <p className="bt-boost-info">How BT-boosters work?</p>
      </div>

      {/* Daily Boosters Section */}
      <div className="daily-boosters-section">
        <p className="daily-boosters-title">Your daily boosters:</p>
        <div className="daily-boosters-container">
          {dailyBoosters.map((booster) => (
            <div
              className="booster-frame"
              key={booster.id}
              onClick={() => setActiveOverlay(booster)}
            >
              <img
                src={booster.icon}
                alt={booster.title}
                className="booster-icon"
              />
              <div className="booster-info">
                <p className="booster-title">{booster.title}</p>
                <p className="booster-value">{booster.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Extra Boosters Section */}
      <div className="extra-boosters-section">
        <p className="extra-boosters-title">Extra boosters:</p>
        <div className="extra-boosters-container">
          {extraBoosters.map((booster) => (
            <div
              className="extra-booster-card"
              key={booster.id}
              onClick={() => setActiveOverlay(booster)}
            >
              <div className="booster-left">
                <img
                  src={booster.icon}
                  alt={booster.title}
                  className="booster-icon-large"
                />
                <div className="booster-info">
                  <p className="booster-title">{booster.title}</p>
                  <div className="booster-stats">
                    <img
                      src={booster.valueIcon}
                      alt="Value Icon"
                      className="value-icon-small"
                    />
                    <span className="booster-value">{booster.value}</span>
                    <span className="booster-level">{booster.level}</span>
                  </div>
                </div>
              </div>
              <img
                src={booster.actionIcon}
                alt="Action Icon"
                className="action-icon"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Overlay */}
      {renderOverlay()}

      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default BoostScreen;
