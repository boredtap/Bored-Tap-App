import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import "./RewardScreen.css";

const RewardScreen = () => {
  const [activeTab, setActiveTab] = useState("On-Going Reward");
  const [totalTaps, setTotalTaps] = useState(0);
  const [rewardsData, setRewardsData] = useState({
    "On-Going Reward": [],
    "Claimed Reward": []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfileAndRewards = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          console.error("No access token found");
          return;
        }

        // Fetch user profile for total taps
        const profileResponse = await fetch("https://bt-coins.onrender.com/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!profileResponse.ok) {
          throw new Error(`HTTP error! status: ${profileResponse.status}`);
        }

        const profileData = await profileResponse.json();
        setTotalTaps(profileData.total_coins); // Assuming total_coins is the field for total taps in the profile

        // Fetch rewards for both ongoing and claimed
        const ongoingRewardsResponse = await fetch("https://bt-coins.onrender.com/earn/my-rewards", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const claimedRewardsResponse = await fetch("https://bt-coins.onrender.com/earn/my-rewards?status=claimed", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!ongoingRewardsResponse.ok || !claimedRewardsResponse.ok) {
          throw new Error("Failed to fetch rewards data");
        }

        const ongoingRewards = await ongoingRewardsResponse.json();
        const claimedRewards = await claimedRewardsResponse.json();

        setRewardsData({
          "On-Going Reward": ongoingRewards,
          "Claimed Reward": claimedRewards
        });

      } catch (err) {
        console.error("Error fetching user profile or rewards:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfileAndRewards();
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const rewards = rewardsData[activeTab] || []; // Use backend data

  if (loading) {
    return <div className="loading">Loading rewards...</div>;
  }

  return (
    <div className="reward-screen">
      {/* Body */}
      <div className="reward-body">
        {/* Total Taps Section */}
        <div className="total-taps">
          <p>Your Total Taps:</p>
          <div className="taps-display">
            <img
              src={`${process.env.PUBLIC_URL}/logo.png`}
              alt="Logo"
              className="taps-logo"
            />
            <span className="taps-number">{totalTaps.toLocaleString()}</span>
          </div>
          <p className="task-link">How BT-boosters work?</p>
        </div>

        {/* Pagination */}
        <div className="pagination">
          {Object.keys(rewardsData).map((tab) => (
            <span
              key={tab}
              className={`pagination-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => handleTabClick(tab)}
            >
              {tab}
            </span>
          ))}
        </div>

        {/* Reward Cards */}
        <div className="reward-cards">
          {rewards.length > 0 ? (
            rewards.map((reward, index) => (
              <div className="reward-card" key={index}>
                <div className="reward-left">
                  <img
                    src={`${process.env.PUBLIC_URL}/default-reward-icon.png`} // Default icon path
                    alt={reward.title || "Reward"}
                    className="reward-icon"
                  />
                  <div className="reward-info">
                    <p className="reward-title">{reward.title || "Untitled Reward"}</p>
                    <div className="reward-meta">
                      <img
                        src={`${process.env.PUBLIC_URL}/logo.png`}
                        alt="Coin Icon"
                        className="small-icon"
                      />
                      <span>{reward.description || "No description available"}</span>
                    </div>
                  </div>
                </div>
                {activeTab === "On-Going Reward" ? (
                  <button
                    className="reward-cta"
                    style={{
                      backgroundColor: "#FFA500", // Example color, adjust as needed
                      color: "white",
                    }}
                  >
                    Claim
                  </button>
                ) : (
                  <div
                    className="reward-share-icon"
                    style={{ backgroundColor: "#4CAF50" }} // Example color, adjust as needed
                  >
                    <img
                      src={`${process.env.PUBLIC_URL}/share-icon.png`} // Assuming you have a share icon
                      alt="Share Icon"
                      className="share-icon"
                    />
                  </div>
                )}
              </div>
            ))
          ) : (
            <p>No rewards available for this category.</p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default RewardScreen;