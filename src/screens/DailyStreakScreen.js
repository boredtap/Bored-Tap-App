import React, { useState, useEffect, useRef } from "react";
import Navigation from "../components/Navigation";
import CTAButton from "../components/CTAButton";
import "./DailyStreakScreen.css";
import { BASE_URL } from "../utils/BaseVariables"; // Import BASE_URL

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

const DailyStreakScreen = () => {
  const [currentDay, setCurrentDay] = useState(() => {
    return parseInt(localStorage.getItem("currentDay")) || 1;
  });
  const [claimedDays, setClaimedDays] = useState(() => {
    return JSON.parse(localStorage.getItem("claimedDays")) || [];
  });
  const [profile, setProfile] = useState(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [countdownTime, setCountdownTime] = useState(() => {
    return localStorage.getItem("countdownTime") || "23:59:59";
  });
  const [showClaimMessage, setShowClaimMessage] = useState(false);
  const [ctaButtonText, setCtaButtonText] = useState(() => {
    return localStorage.getItem("ctaButtonText") || "Claim Reward";
  });
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
  const ctaButtonRef = useRef(null);
  const isClaimed = claimedDays.includes(currentDay);

  // Countdown timer effect
  useEffect(() => {
    if (ctaButtonText === "Come Back Tomorrow") {
      const timer = setInterval(() => {
        const [hours, minutes, seconds] = countdownTime.split(":").map(Number);
        let totalSeconds = hours * 3600 + minutes * 60 + seconds;

        if (totalSeconds > 0) {
          totalSeconds--;
          const newHours = Math.floor(totalSeconds / 3600);
          const newMinutes = Math.floor((totalSeconds % 3600) / 60);
          const newSeconds = totalSeconds % 60;
          const newTime = `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}:${String(newSeconds).padStart(2, "0")}`;
          setCountdownTime(newTime);
          localStorage.setItem("countdownTime", newTime);
        } else {
          clearInterval(timer);
          setCtaButtonText("Claim Reward");
          localStorage.setItem("ctaButtonText", "Claim Reward");
          setCountdownTime("23:59:59");
          localStorage.setItem("countdownTime", "23:59:59");
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [countdownTime, ctaButtonText]);

  const resetStreakState = () => {
    setCurrentDay(1);
    setClaimedDays([]);
    setShowClaimMessage(false);
    setCtaButtonText("Claim Reward");
    setCountdownTime("23:59:59");
    localStorage.removeItem("currentDay");
    localStorage.removeItem("claimedDays");
    localStorage.setItem("ctaButtonText", "Claim Reward");
    localStorage.setItem("countdownTime", "23:59:59");
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        resetStreakState();
        return;
      }

      try {
        const response = await fetch(`${BASE_URL}/user/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("accessToken");
            resetStreakState();
          }
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        setProfile(data);

        const storedClaimedDays = JSON.parse(localStorage.getItem("claimedDays")) || [];
        const backendClaimedDays = data.streak?.claimed_days || [];
        const backendLastClaimedDay = Math.max(...backendClaimedDays, 0);

        if (storedClaimedDays.length <= backendClaimedDays.length) {
          setClaimedDays(backendClaimedDays);
          setCurrentDay(backendLastClaimedDay + 1);
          localStorage.setItem("claimedDays", JSON.stringify(backendClaimedDays));
          localStorage.setItem("currentDay", backendLastClaimedDay + 1);
        }

        if (!data.streak || (data.streak.current_streak === 0 && backendClaimedDays.length === 0)) {
          resetStreakState();
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, []);

  const handleClaim = async () => {
    const isLastDay = currentDay === rewards.length;
    if (!claimedDays.includes(currentDay)) {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          console.error("No access token found");
          return;
        }
        const response = await fetch(`${BASE_URL}/perform-streak`, {
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
          const timeMatch = streakData.Count.match(/(\d{2} hrs:\d{2} mins:\d{2} secs)/);
          const time = timeMatch ? timeMatch[0].replace(/ hrs| mins| secs/g, "") : "23:59:59";
          setCountdownTime(time);
          localStorage.setItem("countdownTime", time);
          setShowOverlay(true);
          return;
        }

        const newClaimedDays = [...claimedDays, currentDay];
        let newCurrentDay = currentDay + 1;
        if (isLastDay) {
          newCurrentDay = currentDay + 1;
        }
        localStorage.setItem("claimedDays", JSON.stringify(newClaimedDays));
        localStorage.setItem("currentDay", newCurrentDay);
        localStorage.setItem("ctaButtonText", "Come Back Tomorrow");
        localStorage.setItem("countdownTime", "23:59:59");

        setClaimedDays(newClaimedDays);
        setCurrentDay(newCurrentDay);
        setCtaButtonText("Come Back Tomorrow");
        setCountdownTime("23:59:59");
        setShowClaimMessage(true);

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
      } catch (err) {
        console.error("Error claiming reward:", err);
        setShowOverlay(true);
      }
    }
  };

  const handleCloseOverlay = () => setShowOverlay(false);

  return (
    <div className="daily-streak-screen">
      <div className="streak-header">
        <img
          src={`${process.env.PUBLIC_URL}/streak.png`}
          alt="Streak Icon"
          className="streak-icon-big"
        />
        <p className="streak-title">Streak Calendar</p>
        <p className="streak-subtitle">Claim your daily bonuses!</p>
      </div>

      <div className="daily-rewards">
        <p className="daily-rewards-title">Daily Rewards</p>
        <div className="rewards-grid">
          {rewards.map((reward, index) => {
            const displayedDay = index + 1;
            return (
              <RewardFrame
                key={displayedDay}
                day={displayedDay === rewards.length ? "Ultimate" : `Day ${displayedDay}`}
                reward={reward.reward}
                isActive={displayedDay === currentDay}
                isClaimed={claimedDays.includes(displayedDay)}
                onClick={handleClaim}
              />
            );
          })}
        </div>
        {showClaimMessage && (
          <p className="rewards-note">Come back in {countdownTime} for your next reward</p>
        )}
      </div>

      <div className="cta-container clickable">
        <CTAButton
          ref={ctaButtonRef}
          isActive={!isClaimed && ctaButtonText === "Claim Reward"}
          text={ctaButtonText}
          onClick={handleClaim}
        />
      </div>

      {showOverlay && (
        <div className="overlay-container6">
          <div className={`streak-overlay6 ${showOverlay ? "slide-in" : "slide-out"}`}>
            <div className="overlay-header6">
              <h2 className="overlay-title6">Daily Streak</h2>
              <img
                src={`${process.env.PUBLIC_URL}/cancel.png`}
                alt="Close"
                className="overlay-cancel"
                onClick={handleCloseOverlay}
              />
            </div>
            <div className="overlay-divider"></div>
            <div className="overlay-content6">
              <img
                src={`${process.env.PUBLIC_URL}/streak.png`}
                alt="Streak Icon"
                className="overlay-streak-icon"
              />
              <p className="overlay-text">Streak Not Updated</p>
              <p className="overlay-subtext">Check again in</p>
              <p className="overlay-time">{countdownTime}</p>
              <button className="overlay-cta-button clickable" onClick={handleCloseOverlay}>
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