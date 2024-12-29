import React from "react";
import Navigation from "../components/Navigation";
import "./TopClanScreen.css";

const TopClanScreen = () => {
  const topClans = [
    { name: "TON Station", coins: "675,127,478,606", position: "#1", icon: "first-icon.png", clanIcon: "diamondbg.png" },
    { name: "Crypto Hive", coins: "589,234,567,890", position: "#2", icon: "second-icon.png", clanIcon: "clan2.png" },
    { name: "Blockchain Warriors", coins: "512,098,123,456", position: "#3", icon: "third-icon.png", clanIcon: "clan3.png" },
    { name: "Coin Lords", coins: "478,098,765,432", position: "#4", icon: null, clanIcon: "clan4.png" },
    { name: "Diamond Hands", coins: "434,567,890,123", position: "#5", icon: null, clanIcon: "clan5.png" },
    { name: "The Miners", coins: "389,098,234,567", position: "#6", icon: null, clanIcon: "clan6.png" },
    { name: "Chain Masters", coins: "310,234,890,123", position: "#7", icon: null, clanIcon: "clan7.png" },
    { name: "Nexus Clan", coins: "289,567,123,456", position: "#8", icon: null, clanIcon: "clan8.png" },
  ];

  return (
    <div className="top-clan-screen">

      {/* Top Section */}
      <div className="top-section">
        <img
          src={`${process.env.PUBLIC_URL}/clan.png`}
          alt="Top Clans Icon"
          className="top-clan-icon"
        />
        <p className="top-clan-title">Top Clans</p>
      </div>

      {/* Top Clans List */}
      <div className="clans-card-list">
        {topClans.map((clan, index) => (
          <div
            className={`clan-card ${
              index < 3 ? "highlighted-card" : "plain-card"
            }`}
            key={index}
          >
            <div className="clan-left">
              <img
                src={`${process.env.PUBLIC_URL}/${clan.clanIcon}`}
                alt="Clan Icon"
                className="clan-icon"
              />
              <div className="clan-info">
                <p className="clan-name">{clan.name}</p>
                <div className="clan-coins">
                  <img
                    src={`${process.env.PUBLIC_URL}/logo.png`}
                    alt="Coin Icon"
                    className="coin-icon"
                  />
                  <span>{clan.coins}</span>
                </div>
              </div>
            </div>
            <div className="clan-right">
              {clan.icon ? (
                <img
                  src={`${process.env.PUBLIC_URL}/${clan.icon}`}
                  alt="Rank Icon"
                  className="rank-icon"
                />
              ) : (
                <span className="rank-text">{clan.position}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default TopClanScreen;
