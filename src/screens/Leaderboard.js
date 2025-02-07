import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import "./Leaderboard.css";

const Leaderboard = () => {
  const [activeTab, setActiveTab] = useState("Daily");
  const [leaderboardData, setLeaderboardData] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  // const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("No access token found");
        return;
      }

      try {
        // Define the periods that match your backend's pagination categories
        const periods = ["Daily", "Weekly", "Monthly", "All Time"];
        const fetchedData = {};
        for (let period of periods) {
          // Convert "All Time" to "all_time" (others become lowercase)
          const category = period.toLowerCase().replace(" ", "_");
          const response = await fetch(`https://bored-tap-api.onrender.com/user/leaderboard?category=${category}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          if (!response.ok) {
            throw new Error(`Failed to fetch ${period} leaderboard`);
          }
          const data = await response.json();
          // The backend returns an array containing one array of entries.
          // We assume the inner array holds the actual leaderboard entries.
          fetchedData[period] = Array.isArray(data) && data.length > 0 ? data[0] : [];
        }

        setLeaderboardData(fetchedData);

        // Fetch current user data for the floating card
        const userResponse = await fetch("https://bored-tap-api.onrender.com/user/profile", {
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
          username: userData.username,
          level: userData.level,
          position: userData.rank, // Assuming 'rank' is included in the profile data (as a number or numeric string)
          value: userData.total_coins, // Assuming 'total_coins' represents the BT Coin value
          image_url: userData.image_url, // This field will be provided by the backend
        });
      } catch (err) {
        console.error("Error fetching leaderboard data:", err);
      }
      // finally {
      //   setLoading(false);
      // }
    };

    fetchLeaderboardData();
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  // if (loading) {
  //   return <div className="loading">Loading leaderboard...</div>;
  // }

  const currentLeaderboard = leaderboardData[activeTab] || [];

  return (
    <div className="leaderboard-screen">
      {/* Header Section */}
      <div className="leaderboard-header">
        <img
          src={`${process.env.PUBLIC_URL}/leaderboard12-icon.png`}
          alt="Leaderboard Icon"
          className="leaderboard-icon"
        />
      </div>

      {/* Pagination Tabs */}
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

      {/* Leaderboard Cards */}
      {currentLeaderboard.length === 0 ? (
        <p className="no-leaderboard">No leaderboard entries available yet.</p>
      ) : (
        <div className="leaderboard-cards">
          {currentLeaderboard.map((entry, index) => (
            <div
              className={`leaderboard-card ${index > 2 ? "transparent-card" : ""}`}
              key={entry.telegram_user_id || index}
            >
              <div className="leaderboard-left">
                <img
                  src={entry.image_url || `${process.env.PUBLIC_URL}/profile-picture.png`}
                  alt="Profile"
                  className="leaderboard-logo"
                />
                <div className="leaderboard-info">
                  <p className="leaderboard-title">
                    {entry.username} <span className="level">.Lvl {entry.level}</span>
                  </p>
                  <p className="leaderboard-value">{entry.coins_earned} BT Coin</p>
                </div>
              </div>
              <div className="leaderboard-right">
                {index === 0 ? (
                  <img
                    src={`${process.env.PUBLIC_URL}/first-icon.png`}
                    alt="1st Icon"
                    className="leaderboard-right-icon"
                  />
                ) : index === 1 ? (
                  <img
                    src={`${process.env.PUBLIC_URL}/second-icon.png`}
                    alt="2nd Icon"
                    className="leaderboard-right-icon"
                  />
                ) : index === 2 ? (
                  <img
                    src={`${process.env.PUBLIC_URL}/third-icon.png`}
                    alt="3rd Icon"
                    className="leaderboard-right-icon"
                  />
                ) : (
                  <span className="position-number">#{index + 1}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Card for the Current User */}
      {currentUser && (
        <div className="floating-card">
          <div className="leaderboard-left">
            <img
              src={currentUser.image_url || `${process.env.PUBLIC_URL}/profile-picture.png`}
              alt="Profile"
              className="leaderboard-logo"
            />
            <div className="leaderboard-info">
              <p className="leaderboard-title black-text">
                {currentUser.username} <span className="level black-text">.Lvl {currentUser.level}</span>
              </p>
              <p className="leaderboard-value black-text">
                {currentUser.value} BT Coin
              </p>
            </div>
          </div>
          <div className="leaderboard-right">
            {parseInt(currentUser.position, 10) &&
            parseInt(currentUser.position, 10) <= 3 ? (
              <img
                src={
                  parseInt(currentUser.position, 10) === 1
                    ? `${process.env.PUBLIC_URL}/first-icon.png`
                    : parseInt(currentUser.position, 10) === 2
                    ? `${process.env.PUBLIC_URL}/second-icon.png`
                    : `${process.env.PUBLIC_URL}/third-icon.png`
                }
                alt={`Top ${currentUser.position} Icon`}
                className="leaderboard-right-icon"
              />
            ) : (
              <span className="position-number black-text">#{currentUser.position}</span>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default Leaderboard;
