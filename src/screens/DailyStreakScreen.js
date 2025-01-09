import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import CTAButton from "../components/CTAButton";
import "./DailyStreakScreen.css";

const RewardFrame = ({ day, reward, isActive, isClaimed, onClick }) => {
  return (
    <div
      className={`reward-frame ${isActive ? "active" : ""} ${
        isClaimed ? "claimed" : ""
      }`}
      onClick={isActive && !isClaimed ? onClick : null}
    >
      <p className="frame-day">{day}</p>
      <img
        src={
          isClaimed
            ? `${process.env.PUBLIC_URL}/tick.png`
            : `${process.env.PUBLIC_URL}/logo.png`
        }
        alt="Icon"
        className="frame-icon"
      />
      <p className="frame-reward">{reward}</p>
    </div>
  );
};

const DailyStreakScreen = () => {
  const [currentDay, setCurrentDay] = useState(1); // Current active day
  const [claimedDays, setClaimedDays] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const response = await fetch("https://bored-tap-api.onrender.com/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to fetch profile");
        const data = await response.json();
        setProfile(data);
        setCurrentDay(data.streak.current_streak + 1); // +1 to show the next day as active
        setClaimedDays(data.streak.claimed_days || []);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, []);

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

  const handleClaim = async () => {
    if (!claimedDays.includes(currentDay)) {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch("https://bored-tap-api.onrender.com/perform-streak", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ telegram_user_id: profile.telegram_user_id }),
        });
        if (!response.ok) {
          console.error("Failed to claim reward:", await response.text());
          return;
        }
        const streakData = await response.json();
        // Update local state based on backend response
        setClaimedDays([...claimedDays, currentDay]);
        setProfile(prev => ({
          ...prev,
          total_coins: prev.total_coins + parseInt(rewards[currentDay - 1].reward),
          streak: {
            ...prev.streak,
            current_streak: streakData.current_streak,
            longest_streak: streakData.longest_streak,
            claimed_days: [...(prev.streak.claimed_days || []), currentDay]
          },
        }));
      } catch (err) {
        console.error("Error claiming reward:", err);
      }
    }
  };

  return (
    <div className="daily-streak-screen">

      {/* Top Section */}
      <div className="streak-header">
        <img
          src={`${process.env.PUBLIC_URL}/streak.png`}
          alt="Streak Icon"
          className="streak-icon-big"
        />
        <p className="streak-title">Streak Calendar</p>
        <p className="streak-subtitle">Claim your daily bonuses!</p>
      </div>

      {/* Daily Rewards Section */}
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
        <p className="rewards-note">
          Come back tomorrow to pick up your next reward
        </p>
      </div>

      {/* CTA Button */}
      <div className="cta-container">
        <CTAButton
          isActive={!claimedDays.includes(currentDay)}
          text={claimedDays.includes(currentDay) ? "Come back tomorrow" : "Claim Reward"}
          onClick={handleClaim}
        />
      </div>

      <Navigation />
    </div>
  );
};

export default DailyStreakScreen;