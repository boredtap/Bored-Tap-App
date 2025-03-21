import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./ClanScreen.css";
import { fetchImage } from "../utils/fetchImage";
import { BASE_URL } from "../utils/BaseVariables"; // Import BASE_URL

const ClanScreen = () => {
  const navigate = useNavigate();
  const [topClans, setTopClans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clanStatus, setClanStatus] = useState(null);

  useEffect(() => {
    const fetchClanData = async () => {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/splash");
        return;
      }

      try {
        const myClanResponse = await fetch(`${BASE_URL}/user/clan/my_clan`, { // Updated URL
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (myClanResponse.ok) {
          const myClanData = await myClanResponse.json();
          if (myClanData.id) {
            if (myClanData.status === "active") {
              navigate("/clan-details-screen");
              return;
            } else if (myClanData.status === "pending") {
              setClanStatus("pending");
            }
          } else {
            setClanStatus(null);
          }
        } else {
          setClanStatus(null);
        }

        const topClansResponse = await fetch(`${BASE_URL}/user/clan/top_clans`, { // Updated URL
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!topClansResponse.ok) throw new Error("Failed to fetch top clans");
        const topClansData = await topClansResponse.json();
        console.log("Raw top clans data:", topClansData);

        const initialClans = topClansData.map((clan, index) => ({
          id: clan.id || index + 1,
          name: clan.name,
          rank: clan.rank || `#${index + 1}`,
          total_coins: clan.total_coins ? clan.total_coins.toLocaleString() : "0",
          rankIcon: `${process.env.PUBLIC_URL}/${
            index === 0 ? "first-icon.png" : index === 1 ? "second-icon.png" : index === 2 ? "third-icon.png" : "front-arrow.png"
          }`,
          cardIcon: `${process.env.PUBLIC_URL}/default-clan-icon.png`,
          image_id: clan.image_id,
        }));

        setTopClans(initialClans);
        setLoading(false);

        const imagePromises = initialClans.map((clan) =>
          clan.image_id
            ? fetchImage(clan.image_id, token, "clan_image", `${process.env.PUBLIC_URL}/default-clan-icon.png`)
            : Promise.resolve(`${process.env.PUBLIC_URL}/default-clan-icon.png`)
        );
        const imageUrls = await Promise.all(imagePromises);

        setTopClans((prev) =>
          prev.map((clan, index) => ({
            ...clan,
            cardIcon: imageUrls[index],
          }))
        );
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error("Error fetching clan data:", err.message);
      }
    };

    fetchClanData();
  }, [navigate]);

  const handleCreateClick = () => {
    navigate("/clan-create-screen");
  };

  const handleJoinClick = () => {
    navigate("/clan-list-screen");
  };

  const handleClanClick = (clanId) => {
    const clan = topClans.find((c) => c.id === clanId);
    navigate(`/clan-preview/${clanId}`, { state: { clan } });
  };

  return (
    <div className="clan-screen">
      <div className="clan-header">
        <img src={`${process.env.PUBLIC_URL}/clan.png`} alt="Clan Icon" className="clan-image-icon" />
        <p className="clan-title">
          Start your <br /> clan journey
        </p>
        <div className="clan-cta-buttons">
          {clanStatus === "pending" ? (
            <>
              <button className="clan-cta inactive" onClick={handleJoinClick}>
                Join Clan
              </button>
              <p className="pending-message">Your clan is awaiting verification</p>
            </>
          ) : (
            <>
              <button className="clan-cta active" onClick={handleCreateClick}>
                Create New
              </button>
              <button className="clan-cta inactive" onClick={handleJoinClick}>
                Join Clan
              </button>
            </>
          )}
        </div>
      </div>

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
            <div className="clan-card2" key={clan.id} onClick={() => handleClanClick(clan.id)}>
              <img
                src={clan.cardIcon}
                alt={`${clan.name} Icon`}
                className="clan-card-icon"
                loading="lazy"
                onError={(e) => (e.target.src = `${process.env.PUBLIC_URL}/default-clan-icon.png`)}
              />
              <div className="clan-card-details">
                <p className="clan-card-name">{clan.name}</p>
                <div className="clan-card-stats">
                  <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Coins Icon" className="members-icon" />
                  <span className="clan-card-members">{clan.total_coins}</span>
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