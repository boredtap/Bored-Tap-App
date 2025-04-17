import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import "./Leaderboard.css";
import { BASE_URL } from "../utils/BaseVariables";

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState("Daily");
  const [leaderboardData, setLeaderboardData] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false); // Added loading state
  const [error, setError] = useState(null); // Added error state

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No access token found");
        setLoading(false);
        return;
      }

      try {
        const periods = ["Daily", "Weekly", "Monthly", "All Time"];
        const fetchedData = {};

        for (const period of periods) {
          const category = period.toLowerCase().replace(" ", "_");
          const response = await fetch(
            `${BASE_URL}/user/leaderboard?category=${category}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch ${period} leaderboard`);
          }

          const data = await response.json();
          fetchedData[period] = Array.isArray(data) ? data : [];
        }

        setLeaderboardData(fetchedData);

        const userResponse = await fetch(`${BASE_URL}/user/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!userResponse.ok) {
          throw new Error("Failed to fetch user profile");
        }

        const userData = await userResponse.json();
        setCurrentUser({
          username: userData.username || "Unknown",
          level: userData.level || 1,
          position: userData.rank || null,
          value: userData.total_coins || 0,
          image_url: userData.image_url || `${process.env.PUBLIC_URL}/profile-picture.png`,
          telegram_user_id: userData.telegram_user_id || "",
        });
      } catch (err) {
        setError("Error fetching leaderboard data");
        console.error("Error fetching leaderboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const currentLeaderboard = leaderboardData[activeTab] || [];

  return (
    <div className="leaderboard-screen">
      <div className="leaderboard-header">
        <img
          src={`${process.env.PUBLIC_URL}/leader.png`}
          alt="Leaderboard Icon"
          className="leaderboard-icon"
        />
      </div>

      <div className="pagination">
        {Object.keys(leaderboardData).map((tab) => (
          <span
            key={tab}
            className={`pagination-tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => handleTabClick(tab)}
          >
            {tab}
          </span>
        ))}
      </div>

      <div className="leaderboard-body">
        {error && <p className="error-message">Error: {error}</p>}
        {loading ? (
          <p className="loading-message">Loading leaderboard...</p>
        ) : currentLeaderboard.length === 0 ? (
          <p className="no-leaderboard">No leaderboard entries available yet.</p>
        ) : (
          <div className="leaderboard-cards-container">
            <div className="leaderboard-cards">
              {currentLeaderboard.map((entry, index) => (
                <div
                  className={`leaderboard-card ${index > 2 ? "transparent-card" : ""}`}
                  key={entry.telegram_user_id || index}
                >
                  <div className="leaderboard-left">
                    <img
                      src={entry.image_url || `${process.env.PUBLIC_URL}/profile-picture.png`}
                      alt={`${entry.username}'s Profile`}
                      className="leaderboard-logo round-frame"
                    />
                    <div className="leaderboard-info">
                      <p className="leaderboard-title">
                        {entry.username} <span className="level">.Lvl {entry.level || 1}</span>
                      </p>
                      <p className="leaderboard-value">{(entry.coins_earned || 0).toLocaleString()} BT Coin</p>
                    </div>
                  </div>
                  <div className="leaderboard-right">
                    {index === 0 ? (
                      <img
                        src={`${process.env.PUBLIC_URL}/first-icon.png`}
                        alt="1st Place"
                        className="leaderboard-right-icon"
                      />
                    ) : index === 1 ? (
                      <img
                        src={`${process.env.PUBLIC_URL}/second-icon.png`}
                        alt="2nd Place"
                        className="leaderboard-right-icon"
                      />
                    ) : index === 2 ? (
                      <img
                        src={`${process.env.PUBLIC_URL}/third-icon.png`}
                        alt="3rd Place"
                        className="leaderboard-right-icon"
                      />
                    ) : (
                      <span className="position-number">#{index + 1}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {currentUser && (
        <div className="floating-card">
          <div className="leaderboard-left">
            <img
              src={currentUser.image_url}
              alt={`${currentUser.username}'s Profile`}
              className="leaderboard-logo round-frame"
            />
            <div className="leaderboard-info">
              <p className="leaderboard-title black-text">
                {currentUser.username} <span className="level black-text">.Lvl {currentUser.level}</span>
              </p>
              <p className="leaderboard-value black-text">{currentUser.value.toLocaleString()} BT Coin</p>
            </div>
          </div>
          <div className="leaderboard-right">
            {(() => {
              const currentUserIndex = currentLeaderboard.findIndex(
                (entry) => entry.telegram_user_id === currentUser.telegram_user_id
              );
              const rank = currentUserIndex !== -1 ? currentUserIndex + 1 : null;

              if (rank) {
                if (rank <= 3) {
                  return (
                    <img
                      src={
                        rank === 1
                          ? `${process.env.PUBLIC_URL}/first-icon.png`
                          : rank === 2
                          ? `${process.env.PUBLIC_URL}/second-icon.png`
                          : `${process.env.PUBLIC_URL}/third-icon.png`
                      }
                      alt={`Top ${rank} Icon`}
                      className="leaderboard-right-icon"
                    />
                  );
                } else {
                  return <span className="position-number black-text">#{rank}</span>;
                }
              } else {
                return <span className="position-number black-text">#--</span>;
              }
            })()}
          </div>
        </div>
      )}

      <Navigation />
    </div>
  );
};

export default Leaderboard;