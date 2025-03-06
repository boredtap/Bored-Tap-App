import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./ClanDetailsScreen.css"; 

const ClanDetailsScreen = () => {
  const navigate = useNavigate();
  const [clanData, setClanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState("Member"); // Default to Member

  useEffect(() => {
    const fetchClanDetails = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          navigate("/splash");
          return;
        }

        // Fetch clan details
        const response = await fetch("https://bt-coins.onrender.com/user/clan/my_clan", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to fetch clan details");
        const data = await response.json();
        console.log("Raw clan data:", data); // Debug log

        // Fetch user profile to determine role
        const profileResponse = await fetch("https://bt-coins.onrender.com/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!profileResponse.ok) throw new Error("Failed to fetch user profile");
        const profileData = await profileResponse.json();

        // Map clan data
        setClanData({
          id: data.id,
          icon: data.imageUrl || `${process.env.PUBLIC_URL}/default-clan-icon.png`, // Adjust if image_id needs a URL
          name: data.name,
          position: data.rank || "#?",
          topIcon: `${process.env.PUBLIC_URL}/${
            data.rank === "#1" ? "first-icon.png" : data.rank === "#2" ? "second-icon.png" : data.rank === "#3" ? "third-icon.png" : "default-rank.png"
          }`,
          ctaLeaveIcon: `${process.env.PUBLIC_URL}/leave-icon.png`,
          ctaInviteIcon: `${process.env.PUBLIC_URL}/invite-icon.png`,
          closeRank: data.rank || "#?", // Placeholder
          clanCoin: data.total_coins ? data.total_coins.toLocaleString() : "0",
          members: data.members ? data.members.toLocaleString() : "0",
          coinIcon: `${process.env.PUBLIC_URL}/logo.png`,
          seeAllIcon: `${process.env.PUBLIC_URL}/front-arrow.png`,
        });

        // Determine user role (Owner if creator, Member otherwise)
        // Assuming profileData has creator info or we infer from clan data
        setUserRole(data.creator_id === profileData.telegram_user_id ? "Owner" : "Member");

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error("Error:", err.message);
      }
    };

    fetchClanDetails();
  }, [navigate]);

  const handleLeaveClan = async () => {
    if (!clanData?.id) return;

    try {
      const token = localStorage.getItem("accessToken");
      const action = userRole === "Owner" ? "close" : null; // Owners close clan, Members just leave
      const url = `https://bt-coins.onrender.com/user/clan/exit_clan${action ? `?creator_exit_action=${action}` : ""}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to leave clan");
      const result = await response.json();

      if (result.status === true || result.status === "Ownership transfer feature coming soon 😊") {
        navigate("/clan-screen"); // Redirect back to ClanScreen after leaving
      }
    } catch (err) {
      setError(err.message);
      console.error("Error leaving clan:", err.message);
    }
  };

  const handleInvite = () => {
    // Placeholder for invite functionality
    alert("Invite feature coming soon!");
    // Future: POST /clan/invite with friendIds
  };

  if (loading) return <div className="detailed-clan-screen"><p>Loading...</p><Navigation /></div>;
  if (error) return <div className="detailed-clan-screen"><p>Error: {error}</p><Navigation /></div>;
  if (!clanData) return <div className="detailed-clan-screen"><p>No clan data available</p><Navigation /></div>;

  return (
    <div className="clan-details-screen">
      <div className="clan-icon-section">
        <img src={clanData.icon} alt="Clan Icon" className="clan-icon" />
      </div>
      <p className="clan-name">{clanData.name}</p>
      <div className="clan-position">
        <span className="position-text">{clanData.position}</span>
        <img src={clanData.topIcon} alt="Top Icon" className="top-icon" />
      </div>
      <div className="clan-actions">
        <div className="cta-button" onClick={handleLeaveClan}>
          <img src={clanData.ctaLeaveIcon} alt="Leave Icon" className="cta-icon" />
          <span>Leave</span>
        </div>
        <div className="cta-button" onClick={handleInvite}>
          <img src={clanData.ctaInviteIcon} alt="Invite Icon" className="cta-icon" />
          <span>Invite</span>
        </div>
      </div>
      <div className="your-clan-section">
        <p className="your-clan-text">Your Clan</p>
        <div className="see-all-section">
          <span className="see-all-text">See all</span>
          <img src={clanData.seeAllIcon} alt="See All Icon" className="see-all-icon" />
        </div>
      </div>
      <div className="data-card">
        <div className="data-row">
          <span className="data-title">Earning</span>
          <span className="data-value">x10% tapping</span> {/* Static for now, update if API provides */}
        </div>
        <div className="data-row">
          <span className="data-title">Clan Rank</span>
          <span className="data-value">{clanData.position}</span>
        </div>
        <div className="data-row">
          <span className="data-title">In-clan Rank</span>
          <span className="data-value">{userRole}</span>
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
      {/* Top Earners placeholder - add when API provides */}
      <div className="top-earners-section">
        <p className="top-earners-text">Clan Top Earners</p>
        <div className="see-all-section">
          <span className="see-all-text">See all</span>
          <img src={clanData.seeAllIcon} alt="See All Icon" className="see-all-icon" />
        </div>
      </div>
      <p className="clan-preview-info">Top earners feature coming soon!</p>
      <Navigation />
    </div>
  );
};

export default ClanDetailsScreen;