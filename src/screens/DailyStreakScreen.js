import React, { useState } from "react";
import AppBar from "../components/AppBar";
import Navigation from "../components/Navigation";
import CTAButton from "../components/CTAButton"; // Import reusable component
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
  const [claimedDays, setClaimedDays] = useState([]); // Track claimed days

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

  const handleClaim = () => {
    if (!claimedDays.includes(currentDay)) {
      setClaimedDays([...claimedDays, currentDay]);
    }
  };

  return (
    <div className="daily-streak-screen">
      <AppBar title="Daily Streak" />

      {/* Top Section */}
      <div className="streak-header">
        <img
          src={`${process.env.PUBLIC_URL}/streak.png`}
          alt="Streak Icon"
          className="streak-icon"
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
              onClick={() => handleClaim()}
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
