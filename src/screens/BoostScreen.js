import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import "./BoostScreen.css";

/**
 * BoostScreen component displaying daily and extra boosters statically,
 * with no interactive boost functions.
 */
const BoostScreen = () => {
  // State for total taps, daily boosters, extra boosters, and overlay
  const [totalTaps, setTotalTaps] = useState(0);
  const [dailyBoosters, setDailyBoosters] = useState({
    tapperBoost: { usesLeft: 3, isActive: false },
    fullEnergy: { usesLeft: 3, isActive: false },
  });
  const [extraBoosters, setExtraBoosters] = useState([]);
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedBooster, setSelectedBooster] = useState(null);

  // Fetch initial data from backend (display purposes only)
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

  // Open overlay for selected booster (display only, no action)
  const openOverlay = (booster) => {
    setSelectedBooster(booster);
    setShowOverlay(true);
  };

  // Close overlay
  const closeOverlay = () => {
    setShowOverlay(false);
    setSelectedBooster(null);
  };

  // Get booster description
  const getDescription = (name) => {
    switch (name) {
      case "Boost":
        return "Increase the amount of BT-Coin you can earn per one tap";
      case "Multiplier":
        return "Increase your power limit, so you can tap more per session";
      case "Recharge Speed":
        return "Increase speed of recharge";
      case "Autobot Tapping":
        return "Buy auto-bot to tap for you while you’re away";
      default:
        return "";
    }
  };

  // Get booster effect
  const getEffect = (name) => {
    switch (name) {
      case "Boost":
        return "+1 per tap for each level";
      case "Multiplier":
        return "+500 for each level";
      case "Recharge Speed":
        return "-4 hours recharge time";
      case "Autobot Tapping":
        return "Connect wallet before purchase";
      default:
        return "";
    }
  };

  // Render uses left for daily boosters statically
  const renderUsesLeft = (type) => {
    const booster = dailyBoosters[type];
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
              <div className="booster-frame" key={booster.type}>
                <img src={booster.icon} alt={booster.title} className="booster-icon" />
                <div className="booster-info">
                  <p className="booster-title">{booster.title}</p>
                  <p className="booster-value">{renderUsesLeft(booster.type)}</p>
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
              <div className="extra-booster-card" key={booster.booster_id} onClick={() => openOverlay(booster)}>
                <div className="booster-left">
                  <img
                    src={booster.image_url}
                    alt={booster.name}
                    className="booster-icon"
                    onError={(e) => (e.target.src = `${process.env.PUBLIC_URL}/extra-booster-icon.png`)}
                  />
                  <div className="booster-info">
                    <p className="booster-title">{booster.name}</p>
                    <div className="booster-cost-level">
                      <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Coin Icon" className="small-icon" />
                      <span>{booster.upgrade_cost.toLocaleString()} . {booster.level} Lvl.</span>
                    </div>
                  </div>
                </div>
                <img src={`${process.env.PUBLIC_URL}/front-arrow.png`} alt="Details Icon" className="action-icon" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overlay for Booster Details */}
      {showOverlay && selectedBooster && (
        <div className="overlay-container">
          <div className="boost-overlay">
            <div className="overlay-header">
              <h2 className="overlay-title">{selectedBooster.name}</h2>
              <img
                src={`${process.env.PUBLIC_URL}/cancel.png`}
                alt="Cancel"
                className="overlay-cancel"
                onClick={closeOverlay}
              />
            </div>
            <div className="overlay-divider"></div>
            <div className="overlay-content">
              <img src={selectedBooster.image_url} alt={selectedBooster.name} className="overlay-boost-icon" />
              <p className="overlay-description">{getDescription(selectedBooster.name)}</p>
              {selectedBooster.name !== "Autobot Tapping" ? (
                <>
                  <p className="overlay-effect">{getEffect(selectedBooster.name)}</p>
                  <div className="overlay-value-container">
                    <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Coin Icon" className="overlay-coin-icon" />
                    <span className="overlay-value">{selectedBooster.upgrade_cost.toLocaleString()}</span>
                    <span className="overlay-level"> / Level {selectedBooster.level + 1}</span>
                  </div>
                </>
              ) : (
                <>
                  <p className="overlay-effect">{getEffect(selectedBooster.name)}</p>
                  <div className="overlay-value-container">
                    <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Coin Icon" className="overlay-coin-icon" />
                    <span className="overlay-value">{selectedBooster.upgrade_cost.toLocaleString()}</span>
                  </div>
                </>
              )}
              <button
                className="overlay-cta"
                disabled={totalTaps < selectedBooster.upgrade_cost}
              >
                {totalTaps < selectedBooster.upgrade_cost
                  ? "Insufficient funds"
                  : selectedBooster.name === "Autobot Tapping"
                  ? "Purchase"
                  : "Upgrade"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Navigation />
    </div>
  );
};

export default BoostScreen;