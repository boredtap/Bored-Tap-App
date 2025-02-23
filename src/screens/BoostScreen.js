import React, { useState, useEffect, useCallback } from "react";
import Navigation from "../components/Navigation";
import "./BoostScreen.css";

// BoostScreen component displays daily and extra boosters with upgrade functionality
const BoostScreen = () => {
  const [activeOverlay, setActiveOverlay] = useState(null);
  const [totalTaps, setTotalTaps] = useState(0);
  const [boostersData, setBoostersData] = useState({ dailyBoosters: [], extraBoosters: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memoize fetchProfileAndBoosters to prevent re-creation on every render
  const fetchProfileAndBoosters = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No access token found");
        return;
      }

      const profileResponse = await fetch("https://bt-coins.onrender.com/user/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!profileResponse.ok) {
        throw new Error(`Profile fetch failed: ${profileResponse.status}`);
      }

      const profileData = await profileResponse.json();
      setTotalTaps(profileData.total_coins || 0);

      const dailyBoostersResponse = await fetch("https://bt-coins.onrender.com/user/boost/daily_boosters", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!dailyBoostersResponse.ok) {
        throw new Error(`Daily boosters fetch failed: ${dailyBoostersResponse.status}`);
      }

      const dailyBoostersData = await dailyBoostersResponse.json();
      const mappedDailyBoosters = dailyBoostersData.map((booster) => ({
        id: booster.booster_id,
        title: booster.name,
        description: booster.description,
        value: booster.effect,
        level: `Level ${booster.level}`,
        ctaText: "Activate",
        icon: `${process.env.PUBLIC_URL}/daily-booster-icon.png`,
        imageId: booster.image_id,
      }));

      const extraBoostersResponse = await fetch("https://bt-coins.onrender.com/user/boost/extra_boosters", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!extraBoostersResponse.ok) {
        throw new Error(`Extra boosters fetch failed: ${extraBoostersResponse.status}`);
      }

      const extraBoostersData = await extraBoostersResponse.json();
      const mappedExtraBoosters = extraBoostersData.map((booster) => ({
        id: booster.booster_id,
        title: booster.name,
        description: booster.description,
        value: booster.upgrade_cost.toString(),
        level: `Level ${booster.level}`,
        ctaText: "Upgrade",
        altCTA: totalTaps < booster.upgrade_cost ? "Insufficient Funds" : null,
        actionIcon: `${process.env.PUBLIC_URL}/upgrade-icon.png`,
        icon: `${process.env.PUBLIC_URL}/extra-booster-icon.png`,
        imageId: booster.image_id,
      }));

      setBoostersData({
        dailyBoosters: mappedDailyBoosters,
        extraBoosters: mappedExtraBoosters,
      });
    } catch (err) {
      setError(err.message);
      console.error("Error fetching profile or boosters data:", err);
    } finally {
      setLoading(false);
    }
  }, [totalTaps]); // Dependencies for fetchProfileAndBoosters

  // Fetch data on mount and when totalTaps changes
  useEffect(() => {
    fetchProfileAndBoosters();
  }, [totalTaps, fetchProfileAndBoosters]); // Include fetchProfileAndBoosters in dependencies

  // Handle closing the overlay
  const handleOverlayClose = () => setActiveOverlay(null);

  // Handle upgrading an extra booster via the overlay CTA
  const handleUpgradeBoost = async (boosterId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `https://bt-coins.onrender.com/user/boost/upgrade/${boosterId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();
      if (response.ok) {
        console.log("Booster upgraded successfully:", result.message);
        fetchProfileAndBoosters(); // Refresh data after upgrade
        handleOverlayClose();
      } else {
        console.error("Error upgrading booster:", result.message);
      }
    } catch (err) {
      console.error("Error upgrading booster:", err);
    }
  };

  // Render overlay based on activeOverlay state
  const renderOverlay = () => {
    if (!activeOverlay) return null;

    const { title, description, value, level, ctaText, altCTA, id } = activeOverlay;
    const isExtraBooster = boostersData.extraBoosters.some((b) => b.id === id);
    const isDisabled = altCTA && value === "Insufficient Funds";

    return (
      <div className="overlay-container">
        <div className="overlay-card">
          <div className="overlay-header">
            <h2 className="overlay-title">{title}</h2>
            <button className="overlay-close" onClick={handleOverlayClose}>
              ✖
            </button>
          </div>
          <hr className="division-line" />
          <img src={activeOverlay.icon} alt={title} className="overlay-icon" />
          <p className="overlay-description">{description}</p>
          <div className="overlay-value-container">
            <img
              src={`${process.env.PUBLIC_URL}/logo.png`}
              alt="Value Icon"
              className="value-icon-large"
            />
            <p className="overlay-value">{value}</p>
            <p className="overlay-level">{level}</p>
          </div>
          <button
            className="overlay-cta"
            disabled={isDisabled}
            onClick={isExtraBooster && !isDisabled ? () => handleUpgradeBoost(id) : handleOverlayClose}
          >
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

      {loading ? (
        <p className="loading-message">Fetching Boosters...</p>
      ) : error ? (
        <p className="error-message">Error: {error}</p>
      ) : (
        <>
          {/* Daily Boosters Section */}
          <div className="daily-boosters-section">
            <p className="daily-boosters-title">Your Daily Boosters:</p>
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
            <p className="extra-boosters-title">Extra Boosters:</p>
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
                          src={`${process.env.PUBLIC_URL}/logo.png`}
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
        </>
      )}

      {/* Overlay */}
      {renderOverlay()}

      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default BoostScreen;