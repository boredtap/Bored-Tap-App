import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./ClanDetailsScreen.css"; // Assuming you renamed it from DetailedClanScreen.css

// Utility function for fetching images (inline for simplicity; move to separate file if preferred)
const fetchClanImage = async (imageId, token) => {
  if (!imageId) return `${process.env.PUBLIC_URL}/default-clan-icon.png`;
  try {
    const response = await fetch(
      `https://bt-coins.onrender.com/bored-tap/user_app/image?image_id=${imageId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );
    if (!response.ok) throw new Error("Failed to fetch image");
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error("Error fetching clan image:", err);
    return `${process.env.PUBLIC_URL}/default-clan-icon.png`;
  }
};

const ClanDetailsScreen = () => {
  const navigate = useNavigate();
  const [clanData, setClanData] = useState(null);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState("Member");
  const [topEarners, setTopEarners] = useState([]); // New state for top earners

  useEffect(() => {
    const fetchClanDetails = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          navigate("/splash");
          return;
        }

        const response = await fetch("https://bt-coins.onrender.com/user/clan/my_clan", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to fetch clan details");
        const data = await response.json();
        console.log("Raw clan data:", data);

        const profileResponse = await fetch("https://bt-coins.onrender.com/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!profileResponse.ok) throw new Error("Failed to fetch user profile");
        const profileData = await profileResponse.json();

        const imageUrl = await fetchClanImage(data.image_id, token); // Fetch image

        setClanData({
          id: data.id,
          icon: imageUrl, // Use fetched image URL
          name: data.name,
          position: data.rank || "#?",
          topIcon: `${process.env.PUBLIC_URL}/${
            data.rank === "#1"
              ? "first-icon.png"
              : data.rank === "#2"
              ? "second-icon.png"
              : data.rank === "#3"
              ? "third-icon.png"
              : "default-rank.png"
          }`,
          ctaLeaveIcon: `${process.env.PUBLIC_URL}/exit.png`, // Changed to exit.png
          ctaInviteIcon: `${process.env.PUBLIC_URL}/invitee.png`,
          closeRank: data.rank || "#?",
          clanCoin: data.total_coins ? data.total_coins.toLocaleString() : "0",
          members: data.members ? data.members.toLocaleString() : "0",
          coinIcon: `${process.env.PUBLIC_URL}/logo.png`,
          seeAllIcon: `${process.env.PUBLIC_URL}/front-arrow.png`,
        });

        setUserRole(data.creator_id === profileData.telegram_user_id ? "Owner" : "Member");

        // Fetch top earners
        const topEarnersResponse = await fetch(
          `https://bt-coins.onrender.com/user/clan/clan/${data.id}/top_earners?page_number=1&page_size=10`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
        if (!topEarnersResponse.ok) throw new Error("Failed to fetch top earners");
        const topEarnersData = await topEarnersResponse.json();
        setTopEarners(topEarnersData);
      } catch (err) {
        setError(err.message);
        console.error("Error:", err.message);
      }
    };

    fetchClanDetails();
  }, [navigate]);

  const handleLeaveClan = async () => {
    if (!clanData?.id) return;

    try {
      const token = localStorage.getItem("accessToken");
      const action = userRole === "Owner" ? "close" : null;
      const url = `https://bt-coins.onrender.com/user/clan/exit_clan${action ? `?creator_exit_action=${action}` : ""}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to exit clan");
      const result = await response.json();

      if (result.status === true || result.status === "Ownership transfer feature coming soon 😊") {
        navigate("/clan-screen");
      }
    } catch (err) {
      setError(err.message);
      console.error("Error exiting clan:", err.message);
    }
  };

  const handleInvite = () => {
    alert("Invite feature coming soon!");
  };

  // Removed loading state; render nothing until data loads to avoid white bg
  if (error) return <div className="clan-details-screen"><p>Error: {error}</p><Navigation /></div>;
  if (!clanData) return <div className="clan-details-screen"><Navigation /></div>;

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
          <img src={clanData.ctaLeaveIcon} alt="Exit Icon" className="cta-icon" />
          <span>Exit</span>
        </div>
        <div className="cta-button" onClick={handleInvite}>
          <img src={clanData.ctaInviteIcon} alt="Invite Icon" className="cta-icon" />
          <span>Invite</span>
        </div>
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
          <span className="data-title">Earning</span>
          <span className="data-value">x10% tapping</span>
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
        <div className="top-earners-section1">
          <p className="top-earners-text1">Clan Top Earners</p>
          <div className="top-earners-cards-container1">
            {topEarners.map((earner, index) => (
              <div className="top-earner-card1" key={index}>
                <div className="top-earner-left">
                  <img src={earner.image_url} alt={`${earner.username}'s Profile`} className="top-earner-icon round-frame" />
                  <div className="top-earner-info">
                    <p className="top-earner-username">
                      {earner.username} <span className="level">.Lvl {earner.level}</span>
                    </p>
                    <p className="top-earner-coins">{earner.total_coins.toLocaleString()} BT Coin</p>
                  </div>
                </div>
                <div className="top-earner-right">
                  {index === 0 ? (
                    <img src={`${process.env.PUBLIC_URL}/first-icon.png`} alt="1st Place" className="top-earner-right-icon" />
                  ) : index === 1 ? (
                    <img src={`${process.env.PUBLIC_URL}/second-icon.png`} alt="2nd Place" className="top-earner-right-icon" />
                  ) : index === 2 ? (
                    <img src={`${process.env.PUBLIC_URL}/third-icon.png`} alt="3rd Place" className="top-earner-right-icon" />
                  ) : (
                    <span className="position-number">#{index + 1}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
       
      <Navigation />
    </div>
  );
};

export default ClanDetailsScreen;