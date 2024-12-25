import React from "react";
import AppBar from "../components/AppBar";
import Navigation from "../components/Navigation";
import "./ClanScreen.css";

const ClanScreen = () => {
  const topClans = [
    { id: 1, name: "TON Station", members: "675,127,478,606", rankIcon: "first-icon.png", cardIcon: "diamondbg.png" },
    { id: 2, name: "Crypto Warriors", members: "454,763,128,509", rankIcon: "second-icon.png", cardIcon: "hiddencode.png" },
    { id: 3, name: "Blockchain Knights", members: "234,561,786,204", rankIcon: "third-icon.png", cardIcon: "h20.png" },
  ];

  return (
    <div className="clan-screen">
      {/* AppBar */}
      <AppBar title="Clan" />

      {/* Centralized Top Section */}
      <div className="clan-header">
        <img
          src={`${process.env.PUBLIC_URL}/clan.png`}
          alt="Clan Icon"
          className="clan-image-icon"
        />
        <p className="clan-title">Start your clan journey</p>
        <div className="clan-cta-buttons">
          <button className="clan-cta active">Create New</button>
          <button className="clan-cta inactive">Join Clan</button>
        </div>
      </div>

      {/* Top Clans Section */}
      <div className="top-clans-section">
        <p className="section-title">Top Clans</p>
        <div className="see-all">
          <span>See all</span>
          <img src={`${process.env.PUBLIC_URL}/front-arrow.png`} alt="See All Icon" />
        </div>
      </div>

      {/* Clan Cards */}
      <div className="clan-cards">
        {topClans.map((clan) => (
          <div className="clan-card" key={clan.id}>
            <img
              src={`${process.env.PUBLIC_URL}/${clan.cardIcon}`}
              alt="Clan Profile"
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
            <img
              src={`${process.env.PUBLIC_URL}/${clan.rankIcon}`}
              alt="Rank Icon"
              className="rank-icon"
            />
          </div>
        ))}
      </div>

      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default ClanScreen;
