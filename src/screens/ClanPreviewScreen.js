import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./ClanPreviewScreen.css";

const ClanPreviewScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [clanData, setClanData] = useState(null);
  const [joining, setJoining] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClanPreview = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          navigate("/splash");
          return;
        }

        const clanId = location.pathname.split("/").pop();
        if (!clanId) throw new Error("No clan ID provided");

        const passedClan = location.state?.clan;
        if (!passedClan) {
          const response = await fetch("https://bt-coins.onrender.com/user/clan/all_clans", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          if (!response.ok) throw new Error("Failed to fetch clans");
          const clansData = await response.json();
          const clan = clansData.find((c) => c.id === clanId); // Use 'id' not 'clanId'
          if (!clan) throw new Error("Clan not found");

          setClanData({
            id: clan.id,
            icon: `${process.env.PUBLIC_URL}/default-clan-icon.png`, // No imageUrl, use default
            name: clan.name,
            position: clan.rank || "#?", // Use provided rank or placeholder
            topIcon: `${process.env.PUBLIC_URL}/${
              clan.rank === "#1"
                ? "first-icon.png"
                : clan.rank === "#2"
                ? "second-icon.png"
                : clan.rank === "#3"
                ? "third-icon.png"
                : "default-rank.png"
            }`,
            joinIcon: `${process.env.PUBLIC_URL}/plus-icon.png`,
            closeRank: clan.rank || "#?", // Placeholder, no closeRank in data
            clanCoin: clan.total_coins.toLocaleString(), // Use total_coins
            members: clan.members.toLocaleString(),
            coinIcon: `${process.env.PUBLIC_URL}/logo.png`,
            seeAllIcon: `${process.env.PUBLIC_URL}/front-arrow.png`,
          });
        } else {
          setClanData({
            id: passedClan.id,
            icon: passedClan.icon,
            name: passedClan.name,
            position: passedClan.rank || "#?",
            topIcon: passedClan.rankIcon, // From ClanListScreen
            joinIcon: `${process.env.PUBLIC_URL}/plus-icon.png`,
            closeRank: passedClan.rank || "#?",
            clanCoin: "0", // No total_coins in passed data yet, adjust if added
            members: passedClan.members,
            coinIcon: `${process.env.PUBLIC_URL}/logo.png`,
            seeAllIcon: `${process.env.PUBLIC_URL}/front-arrow.png`,
          });
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error("Error fetching clan preview:", err.message);
      }
    };

    fetchClanPreview();
  }, [navigate, location]);

  const handleJoinClan = async () => {
    if (!clanData?.id || joining) return;
  
    setJoining(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `https://bt-coins.onrender.com/user/clan/join_clan?clan_id=${clanData.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          response.status === 409 ? "You are already in a clan!" : `Failed to join clan: ${errorText}`
        );
      }
      const result = await response.json();
      console.log("Join response:", result); // Debug log
  
      // Adjust success condition based on actual response
      if (result.status === true || result.success) { // Broaden condition
        navigate("/clan-details-screen");
      } else {
        throw new Error("Join request completed but no success confirmation");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error joining clan:", err.message);
    } finally {
      setJoining(false);
    }
  };


  if (loading) return <div className="clan-preview"><p>Loading...</p><Navigation /></div>;
  if (error) return <div className="clan-preview"><p>Error: {error}</p><Navigation /></div>;
  if (!clanData) return <div className="clan-preview"><p>No clan data available</p><Navigation /></div>;

  return (
    <div className="clan-preview">
      <div className="clan-icon-section">
        <img src={clanData.icon} alt="Clan Icon" className="clan-icon" />
      </div>
      <p className="clan-name">{clanData.name}</p>
      <div className="clan-position">
        <span className="position-text">{clanData.position}</span>
        <img src={clanData.topIcon} alt="Top Icon" className="top-icon" />
      </div>
      <div className={`join-btn-frame ${joining ? "disabled" : ""}`} onClick={handleJoinClan}>
        <img src={clanData.joinIcon} alt="Join Icon" className="join-icon" />
        <span className="join-btn-text">{joining ? "Joining..." : "Join"}</span>
      </div>
      <div className="your-clan-section">
        <p className="your-clan-text">Your Clan</p>
        {/* <div className="see-all-section">
          <span className="see-all-text">See all</span>
          <img src={clanData.seeAllIcon} alt="See All Icon" className="see-all-icon" />
        </div> */}
      </div>
      <div className="data-card">
        <div className="data-row">
          <span className="data-title">Close Rank</span>
          <span className="data-value">{clanData.closeRank}</span>
        </div>
        <div className="data-row">
          <span className="data-title">Clan's Coin Earn</span>
          <div className="data-value">
            <img src={clanData.coinIcon} alt="Coin Icon" className="coin-icon" />
            {clanData.clanCoin}
          </div>
        </div>
        <div className="data-row">
          <span className="data-title">Members</span>
          <span className="data-value">{clanData.members}</span>
        </div>
      </div>
      <div className="top-earners-section">
        <p className="top-earners-text">Clan Top Earners</p>
        <div className="see-all-section">
          <span className="see-all-text">See all</span>
          <img src={clanData.seeAllIcon} alt="See All Icon" className="see-all-icon" />
        </div>
      </div>
      <p className="clan-preview-info">Join clan to see top earners</p>
      <Navigation />
    </div>
  );
};

export default ClanPreviewScreen;