import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import "./BoostScreen.css";

/**
 * BoostScreen component managing daily and extra boosters, displaying UI with timers,
 * and handling upgrades with dynamic image fetching from backend.
 */
const BoostScreen = () => {
  // Constants for timers
  const BOOST_DURATION = 20000; // 20 seconds in milliseconds
  const DAILY_RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  // State for total taps, daily boosters, and extra boosters with images
  const [totalTaps, setTotalTaps] = useState(0);
  const [dailyBoosters, setDailyBoosters] = useState(() => {
    const saved = localStorage.getItem("dailyBoosters");
    return saved
      ? JSON.parse(saved)
      : {
          tapperBoost: { usesLeft: 3, isActive: false, endTime: null, resetTime: null },
          fullEnergy: { usesLeft: 3, isActive: false, resetTime: null },
        };
  });
  const [extraBoosters, setExtraBoosters] = useState([]);

  // Fetch initial data and booster images from backend
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    // Fetch user profile for total taps
    fetch("https://bt-coins.onrender.com/user/profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setTotalTaps(data.total_coins))
      .catch((err) => console.error("Failed to fetch profile:", err));

    // Fetch extra boosters and their images
    fetch("https://bt-coins.onrender.com/user/boost/extra_boosters", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(async (boosters) => {
        const boostersWithImages = await Promise.all(
          boosters.map(async (booster) => {
            try {
              const imageRes = await fetch(
                `https://bt-coins.onrender.com/bored-tap/user_app/image?image_id=${booster.image_id}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              const imageBlob = await imageRes.blob();
              const imageUrl = URL.createObjectURL(imageBlob);
              return { ...booster, image_url: imageUrl };
            } catch (err) {
              console.error(`Failed to fetch image for ${booster.name}:`, err);
              return { ...booster, image_url: `${process.env.PUBLIC_URL}/extra-booster-icon.png` };
            }
          })
        );
        setExtraBoosters(boostersWithImages);
      })
      .catch((err) => console.error("Failed to fetch extra boosters:", err));
  }, []);

  // Sync daily boosters with localStorage and handle timers
  useEffect(() => {
    const interval = setInterval(() => {
      setDailyBoosters((prev) => {
        const updated = { ...prev };
        const now = Date.now();

        // Reset Tapper Boost active state after 20 seconds
        if (updated.tapperBoost.isActive && now >= updated.tapperBoost.endTime) {
          updated.tapperBoost.isActive = false;
        }

        localStorage.setItem("dailyBoosters", JSON.stringify(updated));
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Handles claiming a daily booster, updates state, sets timers, and dispatches events.
   * @param {string} type - The booster type ("tapperBoost" or "fullEnergy").
   */
  const handleClaimDailyBooster = (type) => {
    setDailyBoosters((prev) => {
      const updated = { ...prev };
      const booster = updated[type];
      const now = Date.now();

      if (booster.usesLeft > 0 && !booster.isActive) {
        if (type === "tapperBoost") {
          updated.tapperBoost = {
            ...booster,
            usesLeft: booster.usesLeft - 1,
            isActive: true,
            endTime: now + BOOST_DURATION,
            resetTime: booster.usesLeft === 1 ? now + DAILY_RESET_INTERVAL : booster.resetTime,
          };
        } else if (type === "fullEnergy") {
          updated.fullEnergy = {
            ...booster,
            usesLeft: booster.usesLeft - 1,
            isActive: false,
            resetTime: booster.usesLeft === 1 ? now + DAILY_RESET_INTERVAL : booster.resetTime,
          };
          window.dispatchEvent(new Event("fullEnergyClaimed"));
        }
      }
      localStorage.setItem("dailyBoosters", JSON.stringify(updated));
      return updated;
    });
  };

  /**
   * Handles upgrading an extra booster via the backend.
   * @param {string} boosterId - The ID of the extra booster to upgrade.
   */
  const handleUpgradeBooster = async (boosterId) => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const response = await fetch(`https://bt-coins.onrender.com/user/boost/upgrade/${boosterId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.detail || "Failed to upgrade booster");
        return;
      }

      // Refresh extra boosters and total taps after successful upgrade
      const profileRes = await fetch("https://bt-coins.onrender.com/user/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const profileData = await profileRes.json();
      setTotalTaps(profileData.total_coins);

      const boostersRes = await fetch("https://bt-coins.onrender.com/user/boost/extra_boosters", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const boostersData = await boostersRes.json();
      const boostersWithImages = await Promise.all(
        boostersData.map(async (booster) => {
          try {
            const imageRes = await fetch(
              `https://bt-coins.onrender.com/bored-tap/user_app/image?image_id=${booster.image_id}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            const imageBlob = await imageRes.blob();
            const imageUrl = URL.createObjectURL(imageBlob);
            return { ...booster, image_url: imageUrl };
          } catch (err) {
            return { ...booster, image_url: `${process.env.PUBLIC_URL}/extra-booster-icon.png` };
          }
        })
      );
      setExtraBoosters(boostersWithImages);
    } catch (err) {
      console.error("Upgrade error:", err);
      alert("An error occurred while upgrading the booster");
    }
  };

  /**
   * Formats time in hh:mm:ss from milliseconds.
   * @param {number} ms - Time in milliseconds.
   * @returns {string} - Formatted time string.
   */
  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, "0");
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  /**
   * Renders the timer or uses left text for a booster based on its state.
   * @param {string} type - The booster type ("tapperBoost" or "fullEnergy").
   * @returns {string} - The formatted timer or uses left text.
   */
  const renderTimer = (type) => {
    const booster = dailyBoosters[type];
    const now = Date.now();

    if (type === "tapperBoost" && booster.isActive) {
      const remaining = Math.max(0, booster.endTime - now);
      return `Active: ${Math.floor(remaining / 1000)}s`;
    }
    if (booster.usesLeft === 0 && booster.resetTime) {
      const remaining = Math.max(0, booster.resetTime - now);
      return `0/3 (${formatTime(remaining)})`;
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
                onClick={() => handleClaimDailyBooster(booster.type)}
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
              <div className="extra-booster-card" key={booster.booster_id}>
                <div className="booster-left">
                  <img
                    src={booster.image_url}
                    alt={booster.name}
                    className="booster-icon"
                    onError={(e) => (e.target.src = `${process.env.PUBLIC_URL}/extra-booster-icon.png`)}
                  />
                  <div className="booster-info">
                    <p className="booster-title">{booster.name}</p>
                    <div className="booster-meta">
                      <img
                        src={`${process.env.PUBLIC_URL}/logo.png`}
                        alt="Coin Icon"
                        className="small-icon"
                      />
                      <span>
                        {booster.effect} (Level {booster.level === "-" ? "Owned" : booster.level})
                      </span>
                    </div>
                    <p className="upgrade-cost">Cost: {booster.upgrade_cost.toLocaleString()}</p>
                  </div>
                </div>
                <img
                  src={`${process.env.PUBLIC_URL}/front-arrow.png`}
                  alt="Upgrade Icon"
                  className="action-icon"
                  onClick={() => handleUpgradeBooster(booster.booster_id)}
                />
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