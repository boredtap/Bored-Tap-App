import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import "./BoostScreen.css";

const BoostScreen = () => {
  const [activeOverlay, setActiveOverlay] = useState(null);
  const [totalTaps, setTotalTaps] = useState(0);
  const [boostersData, setBoostersData] = useState({ dailyBoosters: [], extraBoosters: [] });

  useEffect(() => {
    const fetchProfileAndBoosters = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          console.error("No access token found");
          return;
        }

        // Fetch user profile which includes total taps
        const profileResponse = await fetch("https://bored-tap-api.onrender.com/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!profileResponse.ok) {
          throw new Error(`HTTP error! status: ${profileResponse.status}`);
        }

        const profileData = await profileResponse.json();
        setTotalTaps(profileData.total_coins); // Assuming total_coins is the field for total taps in the profile

        // Fetch boosters data
        const boostersResponse = await fetch("https://bored-tap-api.onrender.com/boosters", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!boostersResponse.ok) {
          throw new Error(`HTTP error! status: ${boostersResponse.status}`);
        }

        const boostersData = await boostersResponse.json();
        setBoostersData(boostersData);
      } catch (err) {
        console.error("Error fetching profile or boosters data:", err);
      }
    };

    fetchProfileAndBoosters();
  }, []);

  const handleOverlayClose = () => setActiveOverlay(null);

  const renderOverlay = () => {
    if (!activeOverlay) return null;

    const { title, description, subText, value, level, ctaText, altCTA } = activeOverlay;

    const isDisabled = altCTA && value === "Insufficient Funds";

    return (
      <div className="overlay">
        <div className="overlay-card">
          <div className="overlay-header">
            <h2>{title}</h2>
            <button className="overlay-close" onClick={handleOverlayClose}>✖</button>
          </div>
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
          <p className="total-taps-value">{totalTaps.toLocaleString()}</p>
        </div>
        <p className="bt-boost-info">How BT-boosters work?</p>
      </div>

      {/* Daily Boosters Section */}
      <div className="daily-boosters-section">
        <p className="daily-boosters-title">Your daily boosters:</p>
        <div className="daily-boosters-container">
          {boostersData.dailyBoosters.map((booster) => (
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
          {boostersData.extraBoosters.map((booster) => (
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