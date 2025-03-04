import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./DetailedClanScreen.css";

const DetailedClanScreen = () => {
  const { clanId } = useParams();
  const [clanData, setClanData] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClanDetails = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No access token found");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`https://bt-coins.onrender.com/user/clan/${clanId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to fetch clan details");
        const data = await response.json();

        setClanData({
          id: clanId,
          icon: "diamondbg.png",
          name: data.name || "TON Station",
          position: "#1",
          topIcon: "first-icon.png",
          joinIcon: "plus-icon.png",
          ctaLeaveIcon: "leave-icon.png",
          ctaInviteIcon: "invite-icon.png",
          closeRank: "#1",
          clanCoin: "675,127,478,606",
          members: "7,308,114",
          coinIcon: "logo.png",
          seeAllIcon: "front-arrow.png",
        });

        const profileResponse = await fetch("https://bt-coins.onrender.com/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!profileResponse.ok) throw new Error("Failed to fetch profile");
        const profileData = await profileResponse.json();
        setIsMember(profileData.clan_id === clanId);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching clan details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClanDetails();
  }, [clanId]);

  const handleJoinClan = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const response = await fetch(`https://bt-coins.onrender.com/user/clan/join_clan?clan_id=${clanId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to join clan");
      setIsMember(true);
    } catch (err) {
      setError(err.message);
      console.error("Error joining clan:", err);
    }
  };

  const handleLeaveClan = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      // Assuming a leave endpoint exists (not provided, so mocked)
      const response = await fetch(`https://bt-coins.onrender.com/user/clan/leave_clan?clan_id=${clanId}`, {
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

  if (loading) return <div className="loading-message">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!clanData) return null;

  return (
    <div className="detailed-clan-screen">
      <div className="clan-icon-section">
        <img
          src={`${process.env.PUBLIC_URL}/${clanData.icon}`}
          alt="Clan Icon"
          className="clan-icon"
        />
      </div>

      <p className="clan-name">{clanData.name}</p>

      <div className="clan-position">
        <span className="position-text">{clanData.position}</span>
        <img
          src={`${process.env.PUBLIC_URL}/${clanData.topIcon}`}
          alt="Top Icon"
          className="top-icon"
        />
      </div>

      {isMember ? (
        <div className="clan-actions">
          <div className="cta-button" onClick={handleLeaveClan}>
            <img
              src={`${process.env.PUBLIC_URL}/${clanData.ctaLeaveIcon}`}
              alt="Leave Icon"
              className="cta-icon"
            />
            <span>Leave</span>
          </div>
          <div className="cta-button" onClick={handleInvite}>
            <img
              src={`${process.env.PUBLIC_URL}/${clanData.ctaInviteIcon}`}
              alt="Invite Icon"
              className="cta-icon"
            />
            <span>Invite</span>
          </div>
        </div>
      ) : (
        <div className="join-btn-frame" onClick={handleJoinClan}>
          <img
            src={`${process.env.PUBLIC_URL}/${clanData.joinIcon}`}
            alt="Join Icon"
            className="join-icon"
          />
          <span className="join-btn-text">Join</span>
        </div>
      )}

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

      <div className="data-card">
        {isMember && (
          <>
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
          </>
        )}
        <div className="data-row">
          <span className="data-title">{isMember ? "Clan's Coin Earn" : "Close Rank"}</span>
          {isMember ? (
            <div className="data-value">
              <img
                src={`${process.env.PUBLIC_URL}/${clanData.coinIcon}`}
                alt="Coin Icon"
                className="coin-icon"
              />
              {clanData.clanCoin}
            </div>
          ) : (
            <span className="data-value">{clanData.closeRank}</span>
          )}
        </div>
        <div className="data-row">
          <span className="data-title">Members</span>
          <span className="data-value">{clanData.members}</span>
        </div>
      </div>

      {isMember && (
        <>
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
          <p className="join-clan-info">Top earners list here</p>
        </>
      )}

      {!isMember && (
        <p className="join-clan-info">Join clan to see top earners</p>
      )}

      <Navigation />
    </div>
  );
};

export default DetailedClanScreen;