import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./ClanScreen.css";

const ClanScreen = () => {
  const [topClans, setTopClans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clanPending, setClanPending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTopClansAndStatus = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No access token found");
        setLoading(false);
        return;
      }

      try {
        const clansResponse = await fetch("https://bt-coins.onrender.com/user/clan/top_clans", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!clansResponse.ok) throw new Error("Failed to fetch top clans");
        const clansData = await clansResponse.json();
        setTopClans(Array.isArray(clansData) ? clansData : []);

        const profileResponse = await fetch("https://bt-coins.onrender.com/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!profileResponse.ok) throw new Error("Failed to fetch profile");
        const profileData = await profileResponse.json();
        setClanPending(profileData.clan_status === "pending");
      } catch (err) {
        setError(err.message);
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTopClansAndStatus();
  }, []);

  const handleCreateClan = () => navigate("/create-clan");
  const handleJoinClan = () => navigate("/join-clan-screen");

  return (
    <div className="clan-screen">
      <div className="clan-header">
        <img
          src={`${process.env.PUBLIC_URL}/clan.png`}
          alt="Clan Icon"
          className="clan-image-icon"
        />
        <p className="clan-title">Start your clan journey</p>
        <div className="clan-cta-buttons">
          {!clanPending && (
            <button className="clan-cta active" onClick={handleCreateClan}>
              Create New
            </button>
          )}
          <button
            className={`clan-cta ${clanPending ? "solo" : "inactive"}`}
            onClick={handleJoinClan}
          >
            Join Clan
          </button>
        </div>
        {clanPending && <p className="pending-message">Your Clan is Awaiting Verification</p>}
      </div>

      <div className="top-clans-section">
        <p className="section-title">Top Clans</p>
        <div className="see-all" onClick={() => navigate("/join-clan-screen")}>
          <span>See all</span>
          <img
            src={`${process.env.PUBLIC_URL}/front-arrow.png`}
            alt="See All Icon"
            className="see-all-icon"
          />
        </div>
      </div>
      <div className="clan-cards">
        {loading ? (
          <p className="loading-message">Loading clans...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : topClans.length === 0 ? (
          <p className="no-clans">No top clans available yet.</p>
        ) : (
          topClans.map((clan, index) => (
            <div className="clan-card" key={clan.id}>
              <img
                src={`https://bt-coins.onrender.com/bored-tap/user_app/image?image_id=${clan.image_id}`}
                alt={`${clan.name} Icon`}
                className="clan-card-icon"
              />
              <div className="clan-card-details">
                <p className="clan-card-name">{clan.name || "Unknown Clan"}</p>
                <div className="clan-card-stats">
                  <img
                    src={`${process.env.PUBLIC_URL}/logo.png`}
                    alt="Members Icon"
                    className="members-icon"
                  />
                  <span className="clan-card-members">{clan.members?.toLocaleString() || "0"}</span>
                </div>
              </div>
              <div className="clan-card-rank">
                {index === 0 ? (
                  <img
                    src={`${process.env.PUBLIC_URL}/first-icon.png`}
                    alt="1st Place"
                    className="rank-icon"
                  />
                ) : index === 1 ? (
                  <img
                    src={`${process.env.PUBLIC_URL}/second-icon.png`}
                    alt="2nd Place"
                    className="rank-icon"
                  />
                ) : index === 2 ? (
                  <img
                    src={`${process.env.PUBLIC_URL}/third-icon.png`}
                    alt="3rd Place"
                    className="rank-icon"
                  />
                ) : (
                  <span className="position-number">#{index + 1}</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default ClanScreen;