import React, { useState } from "react";
import Navigation from "../components/Navigation";
import "./RewardScreen.css";

const RewardScreen = () => {
  const [activeTab, setActiveTab] = useState("New Reward");

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const rewardsData = {
    "New Reward": [
      {
        title: "1 Billion BT Coins Earned",
        description: "500",
        button: { label: "Claim", bgColor: "#fff", textColor: "#000" },
        icon: "/reward.png", // Fixed inconsistency in paths
      },
      {
        title: "Streak Master",
        description: "300",
        button: { label: "Claim", bgColor: "#fff", textColor: "#000" },
        icon: "/refresh-icon.png",
      },
      {
        title: "Leaderboard Champ",
        description: "200",
        button: { label: "Claim", bgColor: "#fff", textColor: "#000" },
        icon: "/first-icon.png",
      },
      {
        title: "Streak Legend",
        description: "150",
        button: { label: "Claim", bgColor: "#fff", textColor: "#000" },
        icon: "/refresh-icon.png",
      },
    ],
    "Claimed Reward": [
      {
        title: "1 Billion BT Coins Earned",
        description: "500",
        button: { icon: "/share-icon.png", bgColor: "#000" },
        icon: "/reward.png", // Fixed inconsistency in paths
      },
      {
        title: "Streak Master",
        description: "300",
        button: { icon: "/share-icon.png", bgColor: "#000" },
        icon: "/refresh-icon.png",
      },
      {
        title: "Leaderboard Champ",
        description: "200",
        button: { icon: "/share-icon.png", bgColor: "#000" },
        icon: "/first-icon.png",
      },
      {
        title: "Streak Legend",
        description: "150",
        button: { icon: "/share-icon.png", bgColor: "#000" },
        icon: "/refresh-icon.png",
      },
    ],
  };

  const rewards = rewardsData[activeTab] || []; // Added fallback to prevent errors when no rewards exist

  return (
    <div className="reward-screen">

      {/* Body */}
      <div className="reward-body">
        {/* Total Taps Section */}
        <div className="total-taps">
          <p>Your Total Taps:</p>
          <div className="taps-display">
            <img
              src={`${process.env.PUBLIC_URL}/logo.png`}
              alt="Logo"
              className="taps-logo"
            />
            <span className="taps-number">3,289,198</span>
          </div>
          <p className="task-link">How BT-boosters work?</p>
        </div>

        {/* Pagination */}
        <div className="pagination">
          {Object.keys(rewardsData).map((tab) => (
            <span
              key={tab}
              className={`pagination-tab ${
                activeTab === tab ? "active" : ""
              }`}
              onClick={() => handleTabClick(tab)}
            >
              {tab}
            </span>
          ))}
        </div>

        {/* Reward Cards */}
        <div className="reward-cards">
          {rewards.map((reward, index) => (
            <div className="reward-card" key={index}>
              <div className="reward-left">
                <img
                  src={`${process.env.PUBLIC_URL}${reward.icon}`}
                  alt={reward.title}
                  className="reward-icon"
                />
                <div className="reward-info">
                  <p className="reward-title">{reward.title}</p>
                  <div className="reward-meta">
                    <img
                      src={`${process.env.PUBLIC_URL}/logo.png`}
                      alt="Coin Icon"
                      className="small-icon"
                    />
                    <span>{reward.description}</span>
                  </div>
                </div>
              </div>
              {activeTab === "New Reward" ? (
                <button
                  className="reward-cta"
                  style={{
                    backgroundColor: reward.button.bgColor,
                    color: reward.button.textColor,
                  }}
                >
                  {reward.button.label}
                </button>
              ) : (
                <div
                  className="reward-share-icon"
                  style={{ backgroundColor: reward.button.bgColor }}
                >
                  <img
                    src={`${process.env.PUBLIC_URL}${reward.button.icon}`} // Fixed incorrect single quote
                    alt="Share Icon"
                    className="share-icon"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default RewardScreen;
