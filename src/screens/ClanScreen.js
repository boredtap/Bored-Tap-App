import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./ClanScreen.css";

const ClanScreen = () => {
  const navigate = useNavigate();
  const [topClans, setTopClans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClanData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          navigate("/splash");
          return;
        }

        const profileResponse = await fetch("https://bt-coins.onrender.com/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!profileResponse.ok) throw new Error("Failed to fetch user profile");
        const profileData = await profileResponse.json();

        if (profileData.clanId) {
          navigate("/clan-details");
          return;
        }

        const topClansResponse = await fetch("https://bt-coins.onrender.com/user/clan/top_clans", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!topClansResponse.ok) throw new Error("Failed to fetch top clans");
        const topClansData = await topClansResponse.json();
        console.log("Raw top clans data:", topClansData);

        const mappedTopClans = topClansData.map((clan, index) => ({
          id: clan.id || index + 1, // Use 'id' from API
          name: clan.name,
          members: clan.members ? clan.members.toLocaleString() : "0", // Updated to 'members'
          rank: clan.rank || `#${index + 1}`, // Add rank for preview
          total_coins: clan.total_coins || 0, // Add total_coins for preview
          rankIcon: `${process.env.PUBLIC_URL}/${
            index === 0 ? "first-icon.png" : index === 1 ? "second-icon.png" : "third-icon.png"
          }`,
          cardIcon: clan.imageUrl || `${process.env.PUBLIC_URL}/default-clan-icon.png`,
        }));

        setTopClans(mappedTopClans);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error("Error:", err.message);
      }
    };

    fetchClanData();
  }, [navigate]);

  const handleCreateClick = () => {
    navigate("/clan-create-screen");
  };

  const handleJoinClick = () => {
    navigate("/clan-list-screen"); // Fixed to match route in App.js
  };

  const handleClanClick = (clanId) => {
    const clan = topClans.find((c) => c.id === clanId);
    navigate(`/clan-preview/${clanId}`, { state: { clan } });
  };

  return (
    <div className="clan-screen">
      <div className="clan-header">
        <img src={`${process.env.PUBLIC_URL}/clan.png`} alt="Clan Icon" className="clan-image-icon" />
        <p className="clan-title">Start your clan journey</p>
        <div className="clan-cta-buttons">
          <button className="clan-cta active" onClick={handleCreateClick}>
            Create New
          </button>
          <button className="clan-cta inactive" onClick={handleJoinClick}>
            Join Clan
          </button>
        </div>
      </div>

       {/* Top Clans Section */}
       <div className="top-clans-section">
        <p className="section-title">Top Clans</p>
        <div className="see-all" onClick={() => navigate("/clan-list-screen")}>
          <span>See all</span>
          <img
            src={`${process.env.PUBLIC_URL}/front-arrow.png`}
            alt="See All Icon"
            className="see-all-icon"
          />
        </div>
      </div>


      {loading ? (
        <p className="loading-message">Loading clans...</p>
      ) : error ? (
        <p className="error-message">Error: {error}</p>
      ) : topClans.length > 0 ? (
        <div className="clan-cards">
          {topClans.map((clan) => (
            <div className="clan-card" key={clan.id} onClick={() => handleClanClick(clan.id)}>
              <img src={clan.cardIcon} alt="Clan Profile" className="clan-card-icon" />
              <div className="clan-card-details">
                <p className="clan-card-name">{clan.name}</p>
                <div className="clan-card-stats">
                  <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Members Icon" className="members-icon" />
                  <span className="clan-card-members">{clan.members}</span>
                </div>
              </div>
              <img src={clan.rankIcon} alt="Rank Icon" className="rank-icon" />
            </div>
          ))}
        </div>
      ) : (
        <p className="no-clans-message">No top clans available yet. Be the first to create one!</p>
      )}

      <Navigation />
    </div>
  );
};

export default ClanScreen;