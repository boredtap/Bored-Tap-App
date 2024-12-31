import React from "react";
import Navigation from "../components/Navigation";
import "./DetailedClanScreen.css";

const DetailedClanScreen = () => {
  const clanData = {
    icon: "diamondbg.png", // Example clan icon
    name: "TON Station",
    position: "#1",
    topIcon: "first-icon.png", // Icon for the position
    joinIcon: "plus-icon.png", // Icon for join button
    closeRank: "#1",
    clanCoin: "675,127,478,606",
    members: "7,308,114",
    coinIcon: "logo.png",
    seeAllIcon: "front-arrow.png",
  };

  return (
    <div className="detailed-clan-screen">

      {/* Clan Icon */}
      <div className="clan-icon-section">
        <img
          src={`${process.env.PUBLIC_URL}/${clanData.icon}`}
          alt="Clan Icon"
          className="clan-icon"
        />
      </div>

      {/* Clan Name */}
      <p className="clan-name">{clanData.name}</p>

      {/* Clan Position */}
      <div className="clan-position">
        <span className="position-text">{clanData.position}</span>
        <img
          src={`${process.env.PUBLIC_URL}/${clanData.topIcon}`}
          alt="Top Icon"
          className="top-icon"
        />
      </div>

      {/* Join Button */}
      <div className="join-btn-frame">
        <img
          src={`${process.env.PUBLIC_URL}/${clanData.joinIcon}`}
          alt="Join Icon"
          className="join-icon"
        />
        <span className="join-btn-text">Join</span>
      </div>

      {/* Your Clan Section */}
      <div className="your-clan-section">
        <p className="your-clan-text">Your Clan</p>
        <div className="see-all-section">
          <span className="see-all-text">See all</span>
          <img
            src={`${process.env.PUBLIC_URL}/${clanData.seeAllIcon}`}
            alt="See All Icon"
            className="see-all-icon"
          />
        </div>
      </div>

      {/* Data Card */}
      <div className="data-card">
        <div className="data-row">
          <span className="data-title">Close Rank</span>
          <span className="data-value">{clanData.closeRank}</span>
        </div>
        <div className="data-row">
            <span className="data-title">Clan's Coin Earn</span>
            <div className="data-value">
                <img
                src={`${process.env.PUBLIC_URL}/${clanData.coinIcon}`}
                alt="Coin Icon"
                className="coin-icon"
                />
                {clanData.clanCoin}
            </div>
            </div>
        <div className="data-row">
          <span className="data-title">Members</span>
          <span className="data-value">{clanData.members}</span>
        </div>
      </div>

      {/* Clan Top Earners Section */}
      <div className="top-earners-section">
        <p className="top-earners-text">Clan Top Earners</p>
        <div className="see-all-section">
          <span className="see-all-text">See all</span>
          <img
            src={`${process.env.PUBLIC_URL}/${clanData.seeAllIcon}`}
            alt="See All Icon"
            className="see-all-icon"
          />
        </div>
      </div>

      {/* Join Clan Text */}
      <p className="join-clan-info">
        Join clan to see top earners
      </p>

      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default DetailedClanScreen;
