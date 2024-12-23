import React, { useState } from "react";
import AppBar from "../components/AppBar";
import Navigation from "../components/Navigation";
import "./JoinClanScreen.css";

const JoinClanScreen = () => {
  const [isSearchActive, setIsSearchActive] = useState(false);

  const clans = [
    { id: 1, name: "TON Station", members: "675,127,478,606", icon: "diamondbg.png", rankIcon: "front-arrow.png" },
    { id: 2, name: "Crypto Warriors", members: "454,763,128,509", icon: "crypto-icon.png", rankIcon: "front-arrow.png" },
    { id: 3, name: "Blockchain Knights", members: "234,561,786,204", icon: "knights-icon.png", rankIcon: "front-arrow.png" },
    { id: 4, name: "DeFi Crusaders", members: "983,128,009,324", icon: "defi-icon.png", rankIcon: "front-arrow.png" },
    { id: 5, name: "DAO Avengers", members: "763,028,561,123", icon: "dao-icon.png", rankIcon: "front-arrow.png" },
    { id: 6, name: "Smart Chain Clan", members: "432,879,231,761", icon: "smartchain-icon.png", rankIcon: "front-arrow.png" },
    { id: 7, name: "Ton Explorers", members: "567,091,234,786", icon: "explorers-icon.png", rankIcon: "front-arrow.png" },
    { id: 8, name: "Validator League", members: "309,478,987,561", icon: "validator-icon.png", rankIcon: "front-arrow.png" },
    { id: 9, name: "Node Builders", members: "123,456,789,101", icon: "node-icon.png", rankIcon: "front-arrow.png" },
    { id: 10, name: "Mining Legends", members: "543,789,456,210", icon: "mining-icon.png", rankIcon: "front-arrow.png" },
  ];

  return (
    <div className="join-clan-screen">
      {/* AppBar */}
      <AppBar title="Clan" />

      {/* Find a Clan Section */}
      <div className="find-clan-section">
        {!isSearchActive ? (
          <>
            <p className="find-clan-title">Find a clan you like</p>
            <div
              className="search-container"
              onClick={() => setIsSearchActive(true)}
            >
              <img
                src={`${process.env.PUBLIC_URL}/search.png`}
                alt="Search Icon"
                className="search-icon"
              />
            </div>
          </>
        ) : (
          <div className="search-bar">
            <img
              src={`${process.env.PUBLIC_URL}/search.png`}
              alt="Search Icon"
              className="search-bar-icon"
            />
            <input
              type="text"
              placeholder="Search for a clan..."
              className="search-input"
              autoFocus
              onBlur={() => setIsSearchActive(false)}
            />
          </div>
        )}
      </div>

      {/* Clan Cards */}
      <div className="clan-cards">
        {clans.map((clan) => (
          <div className="clan-card" key={clan.id}>
            {/* Left Section */}
            <div className="clan-card-left">
              <img
                src={`${process.env.PUBLIC_URL}/${clan.icon}`}
                alt={`${clan.name} Icon`}
                className="clan-card-icon"
              />
              <div className="clan-card-details">
                <p className="clan-card-name">{clan.name}</p>
                <div className="clan-card-stats">
                  <img
                    src={`${process.env.PUBLIC_URL}/logo.png`}
                    alt="Members Icon"
                    className="members-icon"
                  />
                  <span className="clan-card-members">{clan.members}</span>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <img
              src={`${process.env.PUBLIC_URL}/${clan.rankIcon}`}
              alt="Join Icon"
              className="join-icon"
            />
          </div>
        ))}
      </div>

      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default JoinClanScreen;
