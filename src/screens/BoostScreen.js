import React, { useState, useEffect, useCallback } from "react";
import Navigation from "../components/Navigation";
import "./BoostScreen.css";

// Configurable recharge time for Extra Boosters (in minutes)
const RECHARGE_TIME_BASE = 60; // Default: 60 minutes for full recharge
const RECHARGE_TIME_PER_LEVEL = 30; // Reduces by 30 minutes per level (e.g., Level 1 = 30 min)

// TODO: Implement recharge time calculation based on booster levels
// Temporary log to acknowledge usage (remove or replace with actual logic later)
console.log(`Recharge time base: ${RECHARGE_TIME_BASE}, per level: ${RECHARGE_TIME_PER_LEVEL}`);

const BoostScreen = () => {
  const [activeOverlay, setActiveOverlay] = useState(null);
  const [totalTaps, setTotalTaps] = useState(0);
  const [boostersData, setBoostersData] = useState({ dailyBoosters: [], extraBoosters: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Daily boosters state with timers
  const [dailyBoosters, setDailyBoosters] = useState({
    tapperBoost: { usesLeft: 3, timers: [] }, // {id, endTime}
    fullEnergy: { usesLeft: 3, timers: [] },
  });

  // Handle closing the overlay
  const handleOverlayClose = () => {
    setActiveOverlay(null);
  };

  // Load daily boosters from local storage
  useEffect(() => {
    const savedBoosters = localStorage.getItem("dailyBoosters");
    if (savedBoosters) {
      setDailyBoosters(JSON.parse(savedBoosters));
    }
  }, []);

  // Save daily boosters to local storage
  useEffect(() => {
    localStorage.setItem("dailyBoosters", JSON.stringify(dailyBoosters));
  }, [dailyBoosters]);

  // Reset daily boosters at midnight (local timezone)
  useEffect(() => {
    const resetDailyBoosters = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const timeToReset = midnight - now;

      const timeoutId = setTimeout(() => {
        setDailyBoosters({
          tapperBoost: { usesLeft: 3, timers: [] },
          fullEnergy: { usesLeft: 3, timers: [] },
        });
      }, timeToReset);

      return () => clearTimeout(timeoutId);
    };
    resetDailyBoosters();
  }, []);

  // Real-time timer updates
  useEffect(() => {
    const intervalId = setInterval(() => {
      setDailyBoosters((prev) => {
        const updated = { ...prev };
        ["tapperBoost", "fullEnergy"].forEach((type) => {
          updated[type].timers = updated[type].timers.filter(
            (timer) => timer.endTime > Date.now()
          );
        });
        return updated;
      });
    }, 1000); // Update every second
    return () => clearInterval(intervalId);
  }, []);

  // Fetch profile and extra boosters
  const fetchProfileAndBoosters = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");

      // Fetch user profile
      const profileResponse = await fetch("https://bt-coins.onrender.com/user/profile", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!profileResponse.ok) throw new Error("Profile fetch failed");
      const profileData = await profileResponse.json();
      setTotalTaps(profileData.total_coins || 0);

      // Fetch extra boosters
      const extraBoostersResponse = await fetch("https://bt-coins.onrender.com/user/boost/extra_boosters", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!extraBoostersResponse.ok) throw new Error("Extra boosters fetch failed");
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

      setBoostersData((prev) => ({ ...prev, extraBoosters: mappedExtraBoosters }));
    } catch (err) {
      setError(err.message);
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [totalTaps]);

  useEffect(() => {
    fetchProfileAndBoosters();
  }, [fetchProfileAndBoosters]);

  // Handle upgrade for extra boosters
  const handleUpgradeBoost = async (boosterId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`https://bt-coins.onrender.com/user/boost/upgrade/${boosterId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Upgrade failed");
      fetchProfileAndBoosters(); // Refresh data after upgrade
      handleOverlayClose();
    } catch (err) {
      setError(err.message);
      console.error("Upgrade error:", err);
    }
  };

  // Handle claiming daily booster
  const handleClaimDailyBooster = (boosterType) => {
    const booster = dailyBoosters[boosterType];
    if (booster.usesLeft > 0) {
      const endTime = Date.now() + 3600000; // 1-hour cooldown
      setDailyBoosters((prev) => ({
        ...prev,
        [boosterType]: {
          usesLeft: booster.usesLeft - 1,
          timers: [...booster.timers, { id: Date.now(), endTime }],
        },
      }));
      // Apply effect (e.g., tapperBoost: x2 taps for 20s, fullEnergy: fill energy)
    }
    handleOverlayClose();
  };

  // Render timer for daily boosters
  const renderTimer = (boosterType) => {
    const timers = dailyBoosters[boosterType].timers;
    if (timers.length > 0) {
      const remainingTime = timers[0].endTime - Date.now();
      if (remainingTime > 0) {
        const hours = Math.floor(remainingTime / 3600000);
        const minutes = Math.floor((remainingTime % 3600000) / 60000);
        const seconds = Math.floor((remainingTime % 60000) / 1000);
        return `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      }
    }
    return "";
  };

  // Render overlay
  const renderOverlay = () => {
    if (!activeOverlay) return null;
    const { type, title, description, value, level, ctaText, altCTA, id } = activeOverlay;
    const isExtraBooster = type === "extra";
    const isDisabled = altCTA && value !== "Free";

    return (
      <div className="overlay-container">
        <div className="overlay-card">
          <div className="overlay-header">
            <h2 className="overlay-title">{title}</h2>
            <button className="overlay-close" onClick={() => setActiveOverlay(null)}>
              ✖
            </button>
          </div>
          <hr className="division-line" />
          <img src={activeOverlay.icon} alt={title} className="overlay-icon" />
          <p className="overlay-description">{description}</p>
          <div className="overlay-value-container">
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Value Icon" className="value-icon-large" />
            <p className="overlay-value">{value}</p>
            <p className="overlay-level">{level}</p>
          </div>
          <button
            className="overlay-cta"
            disabled={isDisabled}
            onClick={isExtraBooster ? () => handleUpgradeBoost(id) : () => handleClaimDailyBooster(type)}
          >
            {isDisabled ? altCTA : ctaText}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="boost-screen">
      <div className="total-taps-section">
        <p className="total-taps-text">Your Total Taps:</p>
        <div className="total-taps-container">
          <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Taps Icon" className="taps-icon" />
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
          <div className="daily-boosters-section">
            <p className="daily-boosters-title">Your Daily Boosters:</p>
            <div className="daily-boosters-container">
              {[
                {
                  type: "tapperBoost",
                  title: "Tapper Boost",
                  icon: `${process.env.PUBLIC_URL}/tapperboost.png`,
                  usesLeft: dailyBoosters.tapperBoost.usesLeft,
                  timer: renderTimer("tapperBoost"),
                },
                {
                  type: "fullEnergy",
                  title: "Full Energy",
                  icon: `${process.env.PUBLIC_URL}/electric-icon.png`,
                  usesLeft: dailyBoosters.fullEnergy.usesLeft,
                  timer: renderTimer("fullEnergy"),
                },
              ].map((booster) => (
                <div
                  className="booster-frame"
                  key={booster.type}
                  onClick={() =>
                    setActiveOverlay({
                      type: booster.type,
                      title: booster.title,
                      description:
                        booster.type === "tapperBoost"
                          ? "Multiply your tap income by X2 for 20 seconds."
                          : "Fill your energy to 100% instantly 3 times per day.",
                      value: "Free",
                      ctaText: "Claim",
                      icon: booster.icon,
                    })
                  }
                >
                  <img src={booster.icon} alt={booster.title} className="booster-icon" />
                  <div className="booster-info">
                    <p className="booster-title">{booster.title}</p>
                    <p className="booster-value">
                      {booster.usesLeft}/3 {booster.timer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="extra-boosters-section">
            <p className="extra-boosters-title">Extra Boosters:</p>
            <div className="extra-boosters-container">
              {boostersData.extraBoosters.map((booster) => (
                <div
                  className="extra-booster-card"
                  key={booster.id}
                  onClick={() =>
                    setActiveOverlay({
                      type: "extra",
                      title: booster.title,
                      description: booster.description,
                      value: booster.value,
                      level: booster.level,
                      ctaText: booster.ctaText,
                      altCTA: booster.altCTA,
                      id: booster.id,
                      icon: booster.icon,
                    })
                  }
                >
                  <div className="booster-left">
                    <img src={booster.icon} alt={booster.title} className="booster-icon-large" />
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
                  <img src={booster.actionIcon} alt="Action Icon" className="action-icon" />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {renderOverlay()}
      <Navigation />
    </div>
  );
};

export default BoostScreen;