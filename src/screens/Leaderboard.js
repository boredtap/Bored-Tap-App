import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import "./Leaderboard.css";
import { BASE_URL } from "../utils/BaseVariables"; // Import BASE_URL

/**
 * Leaderboard component displaying user rankings across different time periods (Daily, Weekly, Monthly, All Time).
 * Fetches leaderboard data and the current user's position, with tabbed navigation and a floating card for the user's rank.
 */
const Leaderboard = () => {
  // State for managing the active leaderboard period (e.g., Daily, Weekly)
  const [activeTab, setActiveTab] = useState("Daily");
  // State for storing leaderboard data, organized by period
  const [leaderboardData, setLeaderboardData] = useState({});
  // State for the current user's profile and rank
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch leaderboard data and user profile when the component mounts
  useEffect(() => {
    /**
     * Asynchronously fetches leaderboard data for all periods and the current user's profile.
     * Updates state with fetched data or logs errors if requests fail.
     */
    const fetchLeaderboardData = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("No access token found");
        return;
      }

      try {
        // Define periods for leaderboard data
        const periods = ["Daily", "Weekly", "Monthly", "All Time"];
        const fetchedData = {};

        // Fetch leaderboard data for each period
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

        // Fetch current user's profile
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
        console.error("Error fetching leaderboard data:", err);
      }
    };

    fetchLeaderboardData();
  }, []);

  // Handle tab switching for different leaderboard periods
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  // Get the current leaderboard data based on the selected tab
  const currentLeaderboard = leaderboardData[activeTab] || [];

  return (
    <div className="leaderboard-screen">
      {/* Header section with leaderboard icon */}
      <div className="leaderboard-header">
        <img
          src={`${process.env.PUBLIC_URL}/leader.png`}
          alt="Leaderboard Icon"
          className="leaderboard-icon"
        />
      </div>

      {/* Pagination tabs for switching between periods */}
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

      {/* Leaderboard entries or loading/error message */}
      <div className="leaderboard-body">
        {currentLeaderboard.length === 0 ? (
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
                      <p className="leaderboard-value">{entry.coins_earned || 0} BT Coin</p>
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

      {/* Floating card for current user's rank */}
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
              <p className="leaderboard-value black-text">{currentUser.value} BT Coin</p>
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