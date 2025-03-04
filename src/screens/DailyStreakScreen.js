import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import CTAButton from "../components/CTAButton";
import "./DailyStreakScreen.css";

/**
 * RewardFrame component for displaying individual daily streak rewards.
 * @param {string} day - The day label (e.g., "Day 1")
 * @param {string} reward - The reward value (e.g., "500")
 * @param {boolean} isActive - Whether this day is currently claimable
 * @param {boolean} isClaimed - Whether this day has been claimed
 * @param {Function} onClick - Click handler for claiming the reward
 */
const RewardFrame = ({ day, reward, isActive, isClaimed, onClick }) => {
  return (
    <div
      className={`reward-frame ${isActive ? "active" : ""} ${isClaimed ? "claimed" : ""}`}
      onClick={isActive && !isClaimed ? onClick : undefined}
      style={isActive && !isClaimed ? { cursor: "pointer" } : { cursor: "not-allowed" }}
    >
      <p className="frame-day">{day}</p>
      <img
        src={isClaimed ? `${process.env.PUBLIC_URL}/tick.png` : `${process.env.PUBLIC_URL}/logo.png`}
        alt={isClaimed ? "Claimed" : "Reward"}
        className="frame-icon"
      />
      <p className="frame-reward">{reward}</p>
    </div>
  );
};

/**
 * DailyStreakScreen component for managing and displaying the daily streak feature.
 * Persists streak state across navigation, syncs with backend, and manages reward claiming.
 */
const DailyStreakScreen = () => {
  const [currentDay, setCurrentDay] = useState(() => {
    return parseInt(localStorage.getItem("currentDay")) || 1;
  });
  const [claimedDays, setClaimedDays] = useState(() => {
    return JSON.parse(localStorage.getItem("claimedDays")) || [];
  });
  const [profile, setProfile] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [countdownTime, setCountdownTime] = useState("11:59 PM");
  // State to show the "Come back tomorrow" message only after claiming
  const [showClaimMessage, setShowClaimMessage] = useState(false);

  // Fetch user profile on mount and sync with local storage
  useEffect(() => {
    /**
     * Fetches user profile data from the backend to initialize streak information.
     * Syncs with local storage to maintain state across navigation, prioritizing local state post-claim.
     */
    const fetchProfile = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const response = await fetch("https://bt-coins.onrender.com/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to fetch profile");
        const data = await response.json();
        setProfile(data);

        const storedClaimedDays = JSON.parse(localStorage.getItem("claimedDays")) || [];
        const backendClaimedDays = data.streak.claimed_days || [];
        const backendLastClaimedDay = Math.max(...backendClaimedDays, 0);

        if (storedClaimedDays.length <= backendClaimedDays.length) {
          setClaimedDays(backendClaimedDays);
          setCurrentDay(backendLastClaimedDay + 1);
          localStorage.setItem("claimedDays", JSON.stringify(backendClaimedDays));
          localStorage.setItem("currentDay", backendLastClaimedDay + 1);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, []);

  // Predefined rewards for each day
  const rewards = [
    { day: "Day 1", reward: "500" },
    { day: "Day 2", reward: "1000" },
    { day: "Day 3", reward: "1500" },
    { day: "Day 4", reward: "2000" },
    { day: "Day 5", reward: "2500" },
    { day: "Day 6", reward: "3000" },
    { day: "Day 7", reward: "3500" },
    { day: "Ultimate", reward: "5000" },
  ];

  /**
   * Handles claiming a daily reward, updating state and persisting to local storage.
   */
  const handleClaim = async () => {
    if (!claimedDays.includes(currentDay)) {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          console.error("No access token found");
          return;
        }
        const response = await fetch("https://bt-coins.onrender.com/perform-streak", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ telegram_user_id: profile?.telegram_user_id }),
        });
        if (!response.ok) throw new Error("Failed to claim reward");
        const streakData = await response.json();
  
        if (streakData.message === "Streak not updated") {
          const timeMatch = streakData.Countdown.match(/(\d{2}:\d{2})/);
          const time = timeMatch ? timeMatch[0] : "12:59 PM";
          setCountdownTime(time);
          setShowOverlay(true);
          return;
        }
  
        // Update state and persist to local storage
        const newClaimedDays = [...claimedDays, currentDay];
        const newCurrentDay = currentDay + 1;
        setClaimedDays(newClaimedDays);
        setCurrentDay(newCurrentDay);
        localStorage.setItem("claimedDays", JSON.stringify(newClaimedDays));
        localStorage.setItem("currentDay", newCurrentDay);
  
        setProfile((prev) => ({
          ...prev,
          total_coins: streakData.total_coins || prev.total_coins,
          streak: {
            ...prev.streak,
            current_streak: streakData.current_streak,
            longest_streak: streakData.longest_streak,
            claimed_days: newClaimedDays,
          },
        }));
        // Show claim message after successful claim
        setShowClaimMessage(true);
      } catch (err) {
        console.error("Error claiming reward:", err);
        setShowOverlay(true);
      }
    }
  };

  // Close the ineligibility overlay
  const handleCloseOverlay = () => setShowOverlay(false);

  return (
    <div className="daily-streak-screen">
      {/* Header with streak icon and text */}
      <div className="streak-header">
        <img
          src={`${process.env.PUBLIC_URL}/streak.png`}
          alt="Streak Icon"
          className="streak-icon-big"
        />
        <p className="streak-title">Streak Calendar</p>
        <p className="streak-subtitle">Claim your daily bonuses!</p>
      </div>

      {/* Daily rewards section */}
      <div className="daily-rewards">
        <p className="daily-rewards-title">Daily Rewards</p>
        <div className="rewards-grid">
          {rewards.map((reward, index) => (
            <RewardFrame
              key={index}
              day={reward.day}
              reward={reward.reward}
              isActive={index + 1 === currentDay}
              isClaimed={claimedDays.includes(index + 1)}
              onClick={handleClaim}
            />
          ))}
        </div>
        {showClaimMessage && (
          <p className="rewards-note">Come back tomorrow to pick up your next reward</p>
        )}
      </div>

      {/* CTA button */}
      <div className="cta-container">
        <CTAButton
          isActive={!claimedDays.includes(currentDay)}
          text={claimedDays.includes(currentDay) ? "Come Back Tomorrow" : "Claim Reward"}
          onClick={handleClaim}
        />
      </div>

      {/* Overlay for ineligibility */}
      {showOverlay && (
        <div className="overlay-container">
          <div className={`streak-overlay ${showOverlay ? "slide-in" : "slide-out"}`}>
            <div className="overlay-header">
              <h2 className="overlay-title">Daily Streak</h2>
              <img
                src={`${process.env.PUBLIC_URL}/cancel.png`}
                alt="Close"
                className="overlay-cancel"
                onClick={handleCloseOverlay}
              />
            </div>
            <div className="overlay-divider"></div>
            <div className="overlay-content">
              <img
                src={`${process.env.PUBLIC_URL}/streak.png`}
                alt="Streak Icon"
                className="overlay-streak-icon"
              />
              <p className="overlay-text">Streak Not Updated</p>
              <p className="overlay-subtext">Check again by this time tomorrow</p>
              <p className="overlay-time">{countdownTime}</p>
              <button className="overlay-cta-button" onClick={handleCloseOverlay}>
                Ok
              </button>
            </div>
          </div>
        </div>
      )}

      <Navigation />
    </div>
  );
};

export default DailyStreakScreen;