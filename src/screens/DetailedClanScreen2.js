import React from "react";
import AppBar from "../components/AppBar";
import Navigation from "../components/Navigation";
import "./DetailedClanScreen2.css";

const DetailedClanScreen2 = () => {
  const clanData = {
    icon: "diamondbg.png", // Clan icon
    name: "TON Station",
    position: "#1",
    topIcon: "first-icon.png", // Icon for the position
    ctaLeaveIcon: "leave-icon.png", // Icon for Leave button
    ctaInviteIcon: "invite-icon.png", // Icon for Invite button
    closeRank: "#1",
    clanCoin: "675,127,478,606",
    members: "7,308,114",
    coinIcon: "logo.png",
    seeAllIcon: "front-arrow.png",
  };


  return (
    <div className="detailed-clan-screen2">
      {/* AppBar */}
      <AppBar title="Clan" />

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

      {/* Clan Actions */}
      <div className="clan-actions">
        <div className="cta-button">
          <img
            src={`${process.env.PUBLIC_URL}/${clanData.ctaLeaveIcon}`}
            alt="Leave Icon"
            className="cta-icon"
          />
          <span>Leave</span>
        </div>
        <div className="cta-button">
          <img
            src={`${process.env.PUBLIC_URL}/${clanData.ctaInviteIcon}`}
            alt="Invite Icon"
            className="cta-icon"
          />
          <span>Invite</span>
        </div>
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
          <span className="data-title">Earning</span>
          <span className="data-value">x10% tapping</span>
        </div>
        <div className="data-row">
          <span className="data-title">Clan Rank</span>
          <span className="data-value">{clanData.position}</span>
        </div>
        <div className="data-row">
          <span className="data-title">In-clan Rank</span>
          <span className="data-value">Member</span>
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

      


      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default DetailedClanScreen2;
