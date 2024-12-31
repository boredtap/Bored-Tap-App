import React, { useState } from "react";
import Navigation from "../components/Navigation";
import "./ChallengeScreen.css";

const ChallengeScreen = () => {
  const [activeTab, setActiveTab] = useState("Open Challenges");

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleClaimClick = (challenge) => {
    console.log(`Claiming reward for challenge: ${challenge}`);
  };

  const challengesData = {
    "Open Challenges": [
      {
        title: "Tap Marathon",
        description: "Achieve 50,000 taps within 24hrs.",
        reward: "2000",
        time: "10:46:34",
        progress: 100,
        button: { label: "Claim", bgColor: "#fff", textColor: "#000" },
        iconSize: 50,
        smallIconSize: 16,
      },
      {
        title: "Daily Leaderboard Race",
        description: "Attain Top 3 on weekly leaderboard.",
        reward: "5000",
        time: "1 day 21hr 20mins",
        progress: 35,
        button: { label: "Claim", bgColor: "#000", textColor: "orange" },
        iconSize: 50,
        smallIconSize: 16,
      },
      {
        title: "Invite Blitz",
        description: "Invite 3 friends within 12hrs.",
        reward: "10,000",
        time: "10:46:34",
        progress: 20,
        button: { label: "Claim", bgColor: "#000", textColor: "orange" },
        iconSize: 50,
        smallIconSize: 16,
      },
    ],
    "Completed Challenges": [
      {
        title: "Tap Marathon",
        description: "Achieve 50,000 taps within 24hrs.",
        reward: "2000",
        status: "Win",
        progress: 100,
        button: { label: "✔", bgColor: "#000", textColor: "orange" },
        iconSize: 50,
        smallIconSize: 16,
      },
      {
        title: "Daily Leaderboard Race",
        description: "Attain Top 3 on weekly leaderboard.",
        reward: "5000",
        status: "Win",
        progress: 100,
        button: { label: "✔", bgColor: "#000", textColor: "orange" },
        iconSize: 50,
        smallIconSize: 16,
      },
      {
        title: "Invite Blitz",
        description: "Invite 3 friends within 12hrs.",
        reward: "10,000",
        status: "Expired",
        progress: 0,
        button: { label: "✔", bgColor: "#000", textColor: "orange" },
        iconSize: 50,
        smallIconSize: 16,
      },
    ],
  };

  const challenges = challengesData[activeTab];

  return (
    <div className="challenge-screen">

      {/* Body */}
      <div className="challenge-body">
        {/* Total Taps */}
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
          <p className="tap-rewards">
            Earn BT-coin rewards by completing simple tasks.
          </p>
          <p className="task-link">How tasks work?</p>
        </div>

        {/* Pagination */}
        <div className="pagination">
          {Object.keys(challengesData).map((tab) => (
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

        {/* Challenge Cards */}
        <div className="challenge-cards">
          {challenges.map((challenge, index) => (
            <div className="challenge-card" key={index}>
              <div className="challenge-left">
                <img
                  src={`${process.env.PUBLIC_URL}/logo.png`}
                  alt={challenge.title}
                  className="challenge-icon"
                  style={{
                    width: challenge.iconSize,
                    height: challenge.iconSize,
                  }}
                />
                <div className="challenge-info">
                  <p className="challenge-title">{challenge.title}</p>
                  <p className="challenge-description">{challenge.description}</p>
                  <div className="challenge-meta">
                    <img
                      src={`${process.env.PUBLIC_URL}/logo.png`}
                      alt="Coin Icon"
                      className="small-icon"
                      style={{
                        width: challenge.smallIconSize,
                        height: challenge.smallIconSize,
                      }}
                    />
                    <span>{challenge.reward}</span>
                    <span className="challenge-time">{challenge.time || challenge.status}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${challenge.progress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <button
                className="challenge-cta"
                style={{
                  backgroundColor: challenge.button.bgColor,
                  color: challenge.button.textColor,
                }}
                onClick={() => handleClaimClick(challenge.title)}
              >
                {challenge.button.label}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default ChallengeScreen;
