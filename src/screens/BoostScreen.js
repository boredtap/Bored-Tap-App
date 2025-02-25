import React, { useState, useEffect, useCallback } from "react";
import Navigation from "../components/Navigation";
import "./BoostScreen.css";

// Configurable constants for booster duration and daily reset
const BOOST_DURATION = 20000; // 20 seconds per booster use
const DAILY_RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours for reset

const BoostScreen = () => {
  // State to manage the active overlay for displaying booster details
  const [activeOverlay, setActiveOverlay] = useState(null);
  
  // State to track and display the user's total taps
  const [totalTaps, setTotalTaps] = useState(0);
  
  // State to hold both daily and extra boosters data
  const [boostersData, setBoostersData] = useState({ dailyBoosters: [], extraBoosters: [] });
  
  // State for loading and error handling during data fetching
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize daily boosters from local storage, defaulting to 3 uses each if not present
  const [dailyBoosters, setDailyBoosters] = useState(() => {
    const savedBoosters = localStorage.getItem("dailyBoosters");
    return savedBoosters
      ? JSON.parse(savedBoosters)
      : {
          tapperBoost: { usesLeft: 3, isActive: false, endTime: null, resetTime: null },
          fullEnergy: { usesLeft: 3, isActive: false, endTime: null, resetTime: null },
        };
  });

  // Function to close the overlay when user cancels or completes action
  const handleOverlayClose = () => setActiveOverlay(null);

  // Effect to persist daily boosters state to local storage on change
  useEffect(() => {
    localStorage.setItem("dailyBoosters", JSON.stringify(dailyBoosters));
  }, [dailyBoosters]);

  // Callback function to fetch user profile and extra boosters data from backend
  const fetchProfileAndBoosters = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");

      // Fetch user profile to get total taps
      const profileResponse = await fetch("https://bt-coins.onrender.com/user/profile", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!profileResponse.ok) throw new Error("Profile fetch failed");
      const profileData = await profileResponse.json();
      setTotalTaps(profileData.total_coins || 0);

      // Fetch extra boosters data
      const extraBoostersResponse = await fetch("https://bt-coins.onrender.com/user/boost/extra_boosters", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!extraBoostersResponse.ok) throw new Error("Extra boosters fetch failed");
      const extraBoostersData = await extraBoostersResponse.json();

      // Map extra boosters for display, handling ownership and costs
      const mappedExtraBoosters = extraBoostersData.map((booster) => ({
        id: booster.booster_id,
        title: booster.name,
        description: booster.description,
        value: booster.upgrade_cost.toString(),
        level: booster.level === "-" ? "Not Owned" : `Level ${booster.level}`,
        ctaText: booster.level === "-" ? "Buy" : "Upgrade",
        altCTA: totalTaps < booster.upgrade_cost ? "Insufficient Funds" : null,
        actionIcon: `${process.env.PUBLIC_URL}/front-arrow.png`,
        icon: `${process.env.PUBLIC_URL}/extra-booster-icon.png`,
        imageId: booster.image_id,
        rawLevel: booster.level,
        effect: booster.effect,
      }));

      setBoostersData({ extraBoosters: mappedExtraBoosters });
      localStorage.setItem("extraBoosters", JSON.stringify(mappedExtraBoosters));
    } catch (err) {
      setError(err.message);
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  }, [totalTaps]);

  // Effect to trigger data fetch on component mount
  useEffect(() => {
    fetchProfileAndBoosters();
  }, [fetchProfileAndBoosters]);

  // Function to handle upgrading extra boosters via backend API
  const handleUpgradeBoost = async (boosterId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`https://bt-coins.onrender.com/user/boost/upgrade/${boosterId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Upgrade failed");
      await fetchProfileAndBoosters();
      window.dispatchEvent(new Event("boosterUpgraded")); // Notify other components like Dashboard
      handleOverlayClose();
    } catch (err) {
      setError(err.message);
      console.error("Upgrade error:", err);
    }
  };

  // Function to handle claiming daily boosters, updating uses and activation
  const handleClaimDailyBooster = (boosterType) => {
    const booster = dailyBoosters[boosterType];
    if (booster.usesLeft > 0 && !booster.isActive) {
      const now = Date.now();
      setDailyBoosters((prev) => ({
        ...prev,
        [boosterType]: {
          usesLeft: booster.usesLeft - 1,
          isActive: true,
          endTime: now + BOOST_DURATION,
          resetTime: booster.usesLeft === 1 ? now + DAILY_RESET_INTERVAL : booster.resetTime,
        },
      }));
    }
    handleOverlayClose();
  };

  // Effect for real-time booster timer and reset logic, checking every second
  useEffect(() => {
    const intervalId = setInterval(() => {
      setDailyBoosters((prev) => {
        const updated = { ...prev };
        ["tapperBoost", "fullEnergy"].forEach((type) => {
          const booster = updated[type];
          if (booster.isActive && Date.now() >= booster.endTime) {
            booster.isActive = false;
          }
          if (booster.usesLeft === 0 && booster.resetTime && Date.now() >= booster.resetTime) {
            booster.usesLeft = 3;
            booster.resetTime = null;
          }
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Function to render the timer display for daily boosters based on their state
  const renderTimer = (boosterType) => {
    const booster = dailyBoosters[boosterType];
    if (booster.isActive) {
      const remaining = Math.max(0, (booster.endTime - Date.now()) / 1000);
      return `Active: ${Math.floor(remaining)}s`;
    } else if (booster.usesLeft === 0 && booster.resetTime) {
      const resetIn = Math.max(0, (booster.resetTime - Date.now()) / 1000);
      return `Resets in ${Math.floor(resetIn / 3600)}h ${Math.floor((resetIn % 3600) / 60)}m`;
    }
    return `${booster.usesLeft}/3 uses left`;
  };

  // Function to render the overlay for detailed booster information and actions
  const renderOverlay = () => {
    if (!activeOverlay) return null;
    const { type, title, description, value, level, ctaText, altCTA, id, icon } = activeOverlay;
    const isExtraBooster = type === "extra";
    const isDisabled = altCTA && value !== "Free";

    return (
      <div className="overlay-container">
        <div className={`boost-overlay ${activeOverlay ? "slide-in" : "slide-out"}`}>
          <div className="overlay-header">
            <h2 className="overlay-title">{title}</h2>
            <img
              src={`${process.env.PUBLIC_URL}/cancel.png`}
              alt="Cancel"
              className="overlay-cancel"
              onClick={handleOverlayClose}
            />
          </div>
          <div className="overlay-divider"></div>
          <div className="overlay-content">
            <img src={icon} alt={title} className="overlay-boost-icon" />
            <p className="overlay-description">{description}</p>
            <div className="overlay-value-container">
              <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Coin Icon" className="overlay-coin-icon" />
              <span className="overlay-value">{value}</span>
            </div>
            {level && <p className="overlay-level">{level}</p>}
            <button
              className="overlay-cta"
              disabled={isDisabled}
              onClick={isExtraBooster ? () => handleUpgradeBoost(id) : () => handleClaimDailyBooster(type)}
            >
              {isDisabled ? altCTA : ctaText}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="boost-screen">
      <div className="boost-body">
        <div className="total-taps-section">
          <p>Your Total Taps:</p>
          <div className="taps-display">
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Taps Icon" className="taps-icon" />
            <span className="total-taps-value">{totalTaps.toLocaleString()}</span>
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
                    isActive: dailyBoosters.tapperBoost.isActive,
                  },
                  {
                    type: "fullEnergy",
                    title: "Full Energy",
                    icon: `${process.env.PUBLIC_URL}/electric-icon.png`,
                    usesLeft: dailyBoosters.fullEnergy.usesLeft,
                    timer: renderTimer("fullEnergy"),
                    isActive: dailyBoosters.fullEnergy.isActive,
                  },
                ].map((booster) => (
                  <div
                    className="booster-frame"
                    key={booster.type}
                    onClick={() =>
                      booster.usesLeft > 0 &&
                      !booster.isActive &&
                      setActiveOverlay({
                        type: booster.type,
                        title: booster.title,
                        description:
                          booster.type === "tapperBoost"
                            ? "Multiply your tap income by X2 for 20 seconds."
                            : "Instantly refill energy to max for 20 seconds.",
                        value: "Free",
                        ctaText: "Claim",
                        icon: booster.icon,
                      })
                    }
                  >
                    <img src={booster.icon} alt={booster.title} className="booster-icon" />
                    <div className="booster-info">
                      <p className="booster-title">{booster.title}</p>
                      <p className="booster-value">{booster.timer}</p>
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
          </>
        )}
      </div>

      {renderOverlay()}
      <Navigation />
    </div>
  );
};

export default BoostScreen;