import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import "./BoostScreen.css";

/**
 * BoostScreen component managing daily boosters and displaying the boost UI with navigation links.
 * Updates localStorage and dispatches events for Dashboard to react.
 */
const BoostScreen = () => {
  // State for total taps (static) and daily boosters
  const [totalTaps] = useState(0);
  const [dailyBoosters, setDailyBoosters] = useState(() => {
    const saved = localStorage.getItem("dailyBoosters");
    return saved
      ? JSON.parse(saved)
      : {
          tapperBoost: { usesLeft: 3, isActive: false, endTime: null },
          fullEnergy: { usesLeft: 3, isActive: false },
        };
  });

  // Static extra boosters for UI display
  const extraBoosters = [
    {
      id: "boost1",
      title: "Boost",
      value: "1000",
      level: "Not Owned",
      icon: `${process.env.PUBLIC_URL}/extra-booster-icon.png`,
      actionIcon: `${process.env.PUBLIC_URL}/front-arrow.png`,
    },
    {
      id: "boost2",
      title: "Multiplier",
      value: "5000",
      level: "Level 1",
      icon: `${process.env.PUBLIC_URL}/extra-booster-icon.png`,
      actionIcon: `${process.env.PUBLIC_URL}/front-arrow.png`,
    },
  ];

  // Sync daily boosters with localStorage and handle Tapper Boost timer
  useEffect(() => {
    const interval = setInterval(() => {
      setDailyBoosters((prev) => {
        const updated = { ...prev };
        if (updated.tapperBoost.isActive && Date.now() >= updated.tapperBoost.endTime) {
          updated.tapperBoost.isActive = false;
        }
        localStorage.setItem("dailyBoosters", JSON.stringify(updated));
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Handles claiming a daily booster, updates state, and dispatches events for Dashboard.
   * @param {string} type - The booster type ("tapperBoost" or "fullEnergy").
   */
  const handleClaimBooster = (type) => {
    setDailyBoosters((prev) => {
      const updated = { ...prev };
      const booster = updated[type];

      if (booster.usesLeft > 0 && !booster.isActive) {
        if (type === "tapperBoost") {
          updated.tapperBoost = {
            ...booster,
            usesLeft: booster.usesLeft - 1,
            isActive: true,
            endTime: Date.now() + 20000, // 20 seconds
          };
        } else if (type === "fullEnergy") {
          updated.fullEnergy = {
            ...booster,
            usesLeft: booster.usesLeft - 1,
            isActive: false, // Instant effect
          };
          window.dispatchEvent(new Event("fullEnergyClaimed"));
        }
      }
      localStorage.setItem("dailyBoosters", JSON.stringify(updated));
      return updated;
    });
  };

  /**
   * Renders the timer text for a booster based on its state.
   * @param {string} type - The booster type ("tapperBoost" or "fullEnergy").
   * @returns {string} - The timer or uses left text.
   */
  const renderTimer = (type) => {
    const booster = dailyBoosters[type];
    if (type === "tapperBoost" && booster.isActive) {
      const remaining = Math.max(0, Math.floor((booster.endTime - Date.now()) / 1000));
      return `Active: ${remaining}s`;
    }
    return `${booster.usesLeft}/3 uses left`;
  };

  return (
    <div className="boost-screen">
      <div className="boost-body">
        {/* Total Taps Section */}
        <div className="total-taps-section">
          <p>Your Total Taps:</p>
          <div className="taps-display">
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Taps Icon" className="taps-icon" />
            <span className="total-taps-value">{totalTaps.toLocaleString()}</span>
          </div>
          <p className="bt-boost-info">How BT-boosters work?</p>
        </div>

        {/* Daily Boosters Section */}
        <div className="daily-boosters-section">
          <p className="daily-boosters-title">Your Daily Boosters:</p>
          <div className="daily-boosters-container">
            {[
              {
                type: "tapperBoost",
                title: "Tapper Boost",
                icon: `${process.env.PUBLIC_URL}/tapperboost.png`,
              },
              {
                type: "fullEnergy",
                title: "Full Energy",
                icon: `${process.env.PUBLIC_URL}/electric-icon.png`,
              },
            ].map((booster) => (
              <div
                className="booster-frame"
                key={booster.type}
                onClick={() => handleClaimBooster(booster.type)}
              >
                <img src={booster.icon} alt={booster.title} className="booster-icon" />
                <div className="booster-info">
                  <p className="booster-title">{booster.title}</p>
                  <p className="booster-value">{renderTimer(booster.type)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Extra Boosters Section */}
        <div className="extra-boosters-section">
          <p className="extra-boosters-title">Extra Boosters:</p>
          <div className="extra-boosters-container">
            {extraBoosters.map((booster) => (
              <div className="extra-booster-card" key={booster.id}>
                <div className="booster-left">
                  <img src={booster.icon} alt={booster.title} className="booster-icon" />
                  <div className="booster-info">
                    <p className="booster-title">{booster.title}</p>
                    <div className="booster-meta">
                      <img
                        src={`${process.env.PUBLIC_URL}/logo.png`}
                        alt="Coin Icon"
                        className="small-icon"
                      />
                      <span>{booster.value}</span>
                    </div>
                  </div>
                </div>
                <img src={booster.actionIcon} alt="Action Icon" className="action-icon" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default BoostScreen;