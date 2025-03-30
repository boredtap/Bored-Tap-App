import React from "react";
import { useLocation } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./ClanTopEarnersScreen.css";

const ClanTopEarnersScreen = () => {
//   const navigate = useNavigate();
  const location = useLocation();
  const { clanData, topEarners } = location.state || {};

//   const handleBack = () => {
//     navigate(-1); // Go back to previous screen
//   };

  return (
    <div className="clan-top-earners-screen">
      <div className="clan-icon-section">
        <img src={clanData?.icon} alt="Clan Icon" className="clan-icon" />
      </div>
      <div className="top-earners-header">
        <p className="top-earners-title1">Clan Top Earners</p>
        {/* <img
          src={`${process.env.PUBLIC_URL}/back-arrow.png`}
          alt="Back"
          className="back-icon clickable"
          onClick={handleBack}
        /> */}
      </div>
      <div className="top-earners-list">
        {topEarners && topEarners.length > 0 ? (
          topEarners.map((earner, index) => (
            <div className="top-earner-card" key={index}>
              <div className="top-earner-left">
                <img
                  src={earner.image_url}
                  alt={`${earner.username}'s Profile`}
                  className="top-earner-icon round-frame"
                />
                <div className="top-earner-info">
                  <p className="top-earner-username">
                    {earner.username} <span className="level">.Lvl {earner.level}</span>
                  </p>
                  <p className="top-earner-coins">{earner.total_coins.toLocaleString()} BT Coin</p>
                </div>
              </div>
              <div className="top-earner-right">
                {index === 0 ? (
                  <img
                    src={`${process.env.PUBLIC_URL}/first-icon.png`}
                    alt="1st Place"
                    className="top-earner-right-icon"
                  />
                ) : index === 1 ? (
                  <img
                    src={`${process.env.PUBLIC_URL}/second-icon.png`}
                    alt="2nd Place"
                    className="top-earner-right-icon"
                  />
                ) : index === 2 ? (
                  <img
                    src={`${process.env.PUBLIC_URL}/third-icon.png`}
                    alt="3rd Place"
                    className="top-earner-right-icon"
                  />
                ) : (
                  <span className="position-number">#{index + 1}</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <p className="no-earners">No top earners available.</p>
        )}
      </div>
      <Navigation />
    </div>
  );
};

export default ClanTopEarnersScreen;