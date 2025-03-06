import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import DetailedClanScreen2 from "./DetailedClanScreen2";
import "./DetailedClanScreen.css";

const DetailedClanScreen = () => {
  const location = useLocation();
  const { clan } = location.state;
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No access token found");
        setLoading(false);
        return;
      }

      try {
        const profileResponse = await fetch("https://bt-coins.onrender.com/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!profileResponse.ok) throw new Error("Failed to fetch profile");
        const profileData = await profileResponse.json();
        setIsMember(profileData.clan_id === clan.id);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [clan.id]);

  const handleJoinClan = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const response = await fetch(`https://bt-coins.onrender.com/user/clan/join_clan?clan_id=${clan.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        if (response.status === 409) {
          setShowOverlay(true);
          return;
        } else {
          throw new Error("Failed to join clan");
        }
      }
      const result = await response.json();
      if (result.status) {
        setIsMember(true);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error joining clan:", err);
    }
  };

  const handleLeaveClan = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const response = await fetch(`https://bt-coins.onrender.com/user/clan/leave_clan?clan_id=${clan.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to leave clan");
      setIsMember(false);
      navigate("/clan"); // Redirect to ClanScreen after leaving
    } catch (err) {
      setError(err.message);
      console.error("Error leaving clan:", err);
    }
  };

  const handleInvite = () => {
    // Placeholder for invite functionality
    console.log("Invite clicked");
  };

  const handleCloseOverlay = () => {
    setShowOverlay(false);
  };

  if (loading) return <div className="loading-message">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  if (isMember) {
    return (
      <DetailedClanScreen2
        clan={clan}
        handleLeaveClan={handleLeaveClan}
        handleInvite={handleInvite}
      />
    );
  }

  return (
    <div className="detailed-clan-screen">
      <div className="clan-icon-section">
        <img
          src={`https://bt-coins.onrender.com/bored-tap/user_app/image?image_id=${clan.image_id}`}
          alt="Clan Icon"
          className="clan-icon"
        />
      </div>

      <p className="clan-name">{clan.name}</p>

      <div className="clan-position">
        <span className="position-text">{clan.rank}</span>
        {clan.rank === "#1" ? (
          <img
            src={`${process.env.PUBLIC_URL}/first-icon.png`}
            alt="1st Place"
            className="top-icon"
          />
        ) : clan.rank === "#2" ? (
          <img
            src={`${process.env.PUBLIC_URL}/second-icon.png`}
            alt="2nd Place"
            className="top-icon"
          />
        ) : clan.rank === "#3" ? (
          <img
            src={`${process.env.PUBLIC_URL}/third-icon.png`}
            alt="3rd Place"
            className="top-icon"
          />
        ) : null}
      </div>

      <div className="join-btn-frame" onClick={handleJoinClan}>
        <img
          src={`${process.env.PUBLIC_URL}/plus-icon.png`}
          alt="Join Icon"
          className="join-icon"
        />
        <span className="join-btn-text">Join</span>
      </div>

      <div className="your-clan-section">
        <p className="your-clan-text">Your Clan</p>
        <div className="see-all-section">
          <span className="see-all-text">See all</span>
          <img
            src={`${process.env.PUBLIC_URL}/front-arrow.png`}
            alt="See All Icon"
            className="see-all-icon"
          />
        </div>
      </div>

      <div className="data-card">
        <div className="data-row">
          <span className="data-title">Clan Rank</span>
          <span className="data-value">
            {clan.rank === "#1" ? (
              <img
                src={`${process.env.PUBLIC_URL}/first-icon.png`}
                alt="1st Place"
                className="rank-icon"
              />
            ) : clan.rank === "#2" ? (
              <img
                src={`${process.env.PUBLIC_URL}/second-icon.png`}
                alt="2nd Place"
                className="rank-icon"
              />
            ) : clan.rank === "#3" ? (
              <img
                src={`${process.env.PUBLIC_URL}/third-icon.png`}
                alt="3rd Place"
                className="rank-icon"
              />
            ) : (
              clan.rank
            )}
          </span>
        </div>
        <div className="data-row">
          <span className="data-title">Clan's Coin Earn</span>
          <div className="data-value">
            <img
              src={`${process.env.PUBLIC_URL}/logo.png`}
              alt="Coin Icon"
              className="coin-icon"
            />
            {clan.total_coins.toLocaleString()}
          </div>
        </div>
        <div className="data-row">
          <span className="data-title">Members</span>
          <span className="data-value">{clan.members.toLocaleString()}</span>
        </div>
      </div>

      <div className="top-earners-section">
        <p className="top-earners-text">Clan Top Earners</p>
        <div className="see-all-section">
          <span className="see-all-text">See all</span>
          <img
            src={`${process.env.PUBLIC_URL}/front-arrow.png`}
            alt="See All Icon"
            className="see-all-icon"
          />
        </div>
      </div>

      <p className="join-clan-message">Join Clan to see top earners</p>

      {showOverlay && (
        <div className="overlay">
          <div className="overlay-content">
            <p>You are already a member of this clan.</p>
            <button onClick={handleCloseOverlay}>Close</button>
          </div>
        </div>
      )}

      <Navigation />
    </div>
  );
};

export default DetailedClanScreen;