import React, { useState, useEffect, useCallback, useContext } from "react";
import Navigation from "../components/Navigation";
import "./BoostScreen.css";
import { BoostContext } from "../context/BoosterContext";

const BOOST_DURATION = 20000; // 20 seconds for Tapper Boost
const DAILY_RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

const BoostScreen = () => {
  const [activeOverlay, setActiveOverlay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { totalTaps, setTotalTaps, setDailyBoosters, dailyBoosters, tapMultiplier, activateTapperBoost, activateFullEnergy, activateOtherBoosters, setExtraBoosters, boostersData, setElectricBoost, setAutoTapActive } = useContext(BoostContext)

  // const [dailyBoosters, setDailyBoosters] = useState(() => {
  //   const savedBoosters = localStorage.getItem("dailyBoosters");
  //   return savedBoosters
  //     ? JSON.parse(savedBoosters)
  //     : {
  //         tapperBoost: { usesLeft: 3, isActive: false, endTime: null, resetTime: null },
  //         fullEnergy: { usesLeft: 3, isActive: false, resetTime: null },
  //       };
  // });

  const handleOverlayClose = () => setActiveOverlay(null);

  // Reset all local storage and state when account is deleted
  const resetAllLocalData = () => {
    const resetDailyState = {
      tapperBoost: { usesLeft: 3, isActive: false, endTime: null, resetTime: null },
      fullEnergy: { usesLeft: 3, isActive: false, resetTime: null },
    };
    setDailyBoosters(resetDailyState);
    setExtraBoosters([])
    setTotalTaps(0);
    localStorage.removeItem("extraBoosters");
    // Use consistent naming for localStorage keys
    setElectricBoost(1000)
    localStorage.setItem("rechargeTimeIndex", "0");
    setAutoTapActive(false)
    localStorage.removeItem("lastTapTime");
    localStorage.removeItem("telegram_user_id"); // Clear ID to force full reset on next login
  };

  // useEffect(() => {
  //   localStorage.setItem("dailyBoosters", JSON.stringify(dailyBoosters));
  // }, [dailyBoosters]);

  const fetchProfileAndBoosters = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");

      const profileResponse = await fetch("https://bt-coins.onrender.com/user/profile", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!profileResponse.ok) throw new Error("Profile fetch failed");
      const profileData = await profileResponse.json();

      // Detect account deletion by checking if stats are reset to initial state
      if (profileData.total_coins === 0 && profileData.level === 1) {
        resetAllLocalData(); // Wipe all local storage and reset state
      } else {
        setTotalTaps(profileData.total_coins || 0);
      }

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
        level: booster.level === "-" ? "Not Owned" : `Level ${booster.level}`,
        ctaText: booster.level === "-" ? "Buy" : "Upgrade",
        altCTA: (profileData.total_coins || 0) < booster.upgrade_cost ? "Insufficient Funds" : null,
        actionIcon: `${process.env.PUBLIC_URL}/front-arrow.png`,
        icon: `${process.env.PUBLIC_URL}/extra-booster-icon.png`,
        imageId: booster.image_id,
        rawLevel: booster.level === "-" ? 0 : parseInt(booster.level, 10),
        effect: booster.effect, // e.g., "boost", "multiplier", "recharge", "auto-tap"
      }));

      setExtraBoosters(mappedExtraBoosters)

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfileAndBoosters();
  }, [fetchProfileAndBoosters]);

  const handleUpgradeBoost = async (boosterId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`https://bt-coins.onrender.com/user/boost/upgrade/${boosterId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error("Upgrade failed");

      await fetchProfileAndBoosters(); // Ensure boosters are updated before accessing localStorage

      // Retrieve updated boosters from localStorage
      const extraBoosters = JSON.parse(localStorage.getItem("extraBoosters") || "[]");
      const booster = extraBoosters.find((b) => b.id === boosterId);

      if (booster) {
        const previousLevel = Number(booster.rawLevel) || 0;
        const newLevel = previousLevel + 1;

        activateOtherBoosters(booster.effect, newLevel)
      }

      handleOverlayClose();
    } catch (err) {
      setError(err.message);
    }
  };


  const handleClaimDailyBooster = (boosterType) => {
    if (boosterType === "tapperBoost") {
      activateTapperBoost()
    } else if (boosterType === "fullEnergy") {
      activateFullEnergy()
    }

    handleOverlayClose();
  };

  const renderTimer = (boosterType) => {
    const booster = dailyBoosters[boosterType];
    if (boosterType === "tapperBoost" && booster.isActive) {
      const remaining = Math.max(0, (booster.endTime - Date.now()) / 1000);
      return `Active: ${Math.floor(remaining)}s`;
    } else if (booster.usesLeft > 0) {
      return `${booster.usesLeft}/3 uses left`;
    } else if (booster.resetTime) {
      const resetIn = Math.max(0, (booster.resetTime - Date.now()) / 1000);
      const hours = Math.floor(resetIn / 3600);
      const minutes = Math.floor((resetIn % 3600) / 60);
      const seconds = Math.floor(resetIn % 60);
      return `0/3 ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }
    return "0/3";
  };

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
                            : "Instantly refill energy to maximum.",
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
                {boostersData.map((booster) => (
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