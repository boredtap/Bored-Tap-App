import React from "react";
import AppBar from "../components/AppBar"; // Import AppBar
import Navigation from "../components/Navigation"; // Import Navigation Component
import "./Dashboard.css"; // Import Dashboard CSS
import "../components/Navigation.css"; // Import Navigation CSS

const Dashboard = () => {
  // Event Handlers
  const handleBackClick = () => console.log("Back clicked");
  const handleTickClick = () => console.log("Tick clicked");
  const handleDropdownClick = () => console.log("Dropdown clicked");
  const handleMoreClick = () => console.log("More clicked");

  return (
    <div className="dashboard-container">
      {/* AppBar Section */}
      <AppBar
        title="Dashboard"
        onBackClick={handleBackClick}
        onTickClick={handleTickClick}
        onDropdownClick={handleDropdownClick}
        onMoreClick={handleMoreClick}
      />

      {/* Top Section */}
      <div className="top-section">
        {/* Profile Section */}
        <div className="profile">
          <img src={`${process.env.PUBLIC_URL}/profile-picture.png`} alt="Profile Placeholder" />
          <div className="profile-text">
            <span>Ridwan007</span>
            <span style={{ color: "#C7913D" }}>.Lvl 1 Warrior</span>
          </div>
        </div>

        {/* Refresh Section */}
        <div className="refresh-section">
          <div className="icon">
            <img
              src={`${process.env.PUBLIC_URL}/refresh-icon.png`}
              alt="Refresh Icon"
              className="refresh-icon-img"
            />
          </div>
          <div className="refresh-text">
            <span>Current Streak</span>
            <span style={{ color: "#C7913D" }}>Day 10</span>
          </div>
        </div>
      </div>

      {/* Frames Section */}
      <div className="frames-section">
        {[
          { name: "Rewards", icon: "reward.png" },
          { name: "Challenge", icon: "challenge.png" },
          { name: "Clan", icon: "clan.png" },
          { name: "Leaderboard", icon: "leaderboard.png" },
        ].map((frame, index) => (
          <div className="frame" key={index}>
            <img
              src={`${process.env.PUBLIC_URL}/${frame.icon}`}
              alt={`${frame.name} Icon`}
              className="frame-icon"
            />
            <span>{frame.name}</span>
          </div>
        ))}
      </div>

      {/* Total Taps Section */}
      <div className="total-taps-section">
        <p className="total-taps-text">Your Total Taps:</p>
        <div className="total-taps-count">
          <img
            className="tap-logo-small"
            src={`${process.env.PUBLIC_URL}/logo.png`}
            alt="Small Icon"
          />
          <span>3,289,198</span>
        </div>
        <div className="big-tap-icon">
          <img
            className="tap-logo-big"
            src={`${process.env.PUBLIC_URL}/logo.png`}
            alt="Big Tap Icon"
          />
        </div>
      </div>

      {/* Electric & Boost Section */}
      <div className="electric-boost-section">
        <div className="electric-value">
          <img
            src={`${process.env.PUBLIC_URL}/electric-icon.png`}
            alt="Electric Icon"
            className="electric-icon"
          />
          <span>0/1000</span>
        </div>
        <button className="boost-btn">
          <img
            src={`${process.env.PUBLIC_URL}/boost-icon.png`}
            alt="Boost Icon"
            className="boost-icon"
          />
          Boost
        </button>
      </div>

      {/* Navigation Section */}
      <Navigation />
    </div>
  );
};

export default Dashboard;
