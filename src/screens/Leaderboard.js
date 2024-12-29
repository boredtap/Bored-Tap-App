import React, { useState } from "react";
import Navigation from "../components/Navigation";
import "./Leaderboard.css";

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState("Daily");

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleBackClick = () => {
    console.log("Navigating back from Leaderboard Screen...");
  };

  const handleMoreClick = () => {
    console.log("Opening more options...");
  };

  const LeaderboardData = {
    Daily: [
      { username: "Ridwan007", level: 10, value: "2,000" },
      { username: "KingAsh", level: 15, value: "10,000" },
      { username: "FemiXtra", level: 12, value: "5,000" },
      { username: "AdaGlow", level: 9, value: "8,000" },
      { username: "Sammy", level: 7, value: "6,500" },
      { username: "Grace", level: 4, value: "4,300" },
    ],
    Weekly: [
      { username: "BellaQueen", level: 18, value: "15,000" },
      { username: "KingAsh", level: 15, value: "12,000" },
      { username: "Ridwan007", level: 10, value: "9,500" },
      { username: "AdaGlow", level: 9, value: "8,300" },
      { username: "Grace", level: 7, value: "5,200" },
      { username: "Sammy", level: 6, value: "4,100" },
    ],
    Monthly: [
      { username: "EhisKing", level: 22, value: "30,000" },
      { username: "Ridwan007", level: 10, value: "25,000" },
      { username: "FemiXtra", level: 12, value: "18,500" },
      { username: "BellaQueen", level: 15, value: "16,700" },
      { username: "Sammy", level: 7, value: "10,200" },
      { username: "AdaGlow", level: 9, value: "8,300" },
    ],
    "All Time": [
      { username: "KingAsh", level: 30, value: "100,000" },
      { username: "Ridwan007", level: 25, value: "90,000" },
      { username: "BellaQueen", level: 20, value: "80,000" },
      { username: "AdaGlow", level: 18, value: "70,000" },
      { username: "FemiXtra", level: 12, value: "60,000" },
      { username: "Sammy", level: 10, value: "50,000" },
    ],
  };

  const currentLeaderboard = LeaderboardData[activeTab];

  return (
    <div className="leaderboard-screen">

      {/* Header Section */}
      <div className="leaderboard-header">
        <img
          src={`${process.env.PUBLIC_URL}/leaderboard12-icon.png`}
          alt="Leaderboard Icon"
          className="leaderboard-icon"
        />
      </div>

      {/* Pagination */}
      <div className="pagination">
        {Object.keys(LeaderboardData).map((tab) => (
          <span
            key={tab}
            className={`pagination-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => handleTabClick(tab)}
          >
            {tab}
          </span>
        ))}
      </div>

      {/* Leaderboard Cards */}
      <div className="leaderboard-cards">
        {currentLeaderboard.map((entry, index) => (
          <div
            className={`leaderboard-card ${
              index > 2 ? "transparent-card" : ""
            }`}
            key={index}
          >
            <div className="leaderboard-left">
              <img
                src={`${process.env.PUBLIC_URL}/profile-picture.png`}
                alt="Profile"
                className="leaderboard-logo"
              />
              <div className="leaderboard-info">
                <p className="leaderboard-title">
                  {entry.username} <span className="level">.Lvl {entry.level}</span>
                </p>
                <p className="leaderboard-value">{entry.value} BT Coin</p>
              </div>
            </div>
            <div className="leaderboard-right">
              {index === 0 ? (
                <img
                  src={`${process.env.PUBLIC_URL}/first-icon.png`}
                  alt="1st Icon"
                  className="leaderboard-right-icon"
                />
              ) : index === 1 ? (
                <img
                  src={`${process.env.PUBLIC_URL}/second-icon.png`}
                  alt="2nd Icon"
                  className="leaderboard-right-icon"
                />
              ) : index === 2 ? (
                <img
                  src={`${process.env.PUBLIC_URL}/third-icon.png`}
                  alt="3rd Icon"
                  className="leaderboard-right-icon"
                />
              ) : (
                <span className="position-number">#{index + 1}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Floating Card */}
      <div className="floating-card">
        <div className="leaderboard-left">
          <img
            src={`${process.env.PUBLIC_URL}/profile-picture.png`}
            alt="Profile"
            className="leaderboard-logo"
          />
          <div className="leaderboard-info">
            <p className="leaderboard-title black-text">
              Current User <span className="level black-text">.Lvl 5</span>
            </p>
            <p className="leaderboard-value gray-text">#29,417</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default Leaderboard;
