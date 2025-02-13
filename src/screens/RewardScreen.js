import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import "./RewardScreen.css";

const RewardScreen = () => {
  const [activeTab, setActiveTab] = useState("On-Going"); // Updated tab name
  const [totalTaps, setTotalTaps] = useState(0);
  const [rewardsData, setRewardsData] = useState({
    on_going: [],
    claimed: []
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
        setTotalTaps(profileData.total_coins); // Assuming total_coins holds the tap count

        // Fetch rewards for both ongoing and claimed
        const ongoingRewardsResponse = await fetch("https://bt-coins.onrender.com/earn/my-rewards?status=on_going", {
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
          on_going: ongoingRewards,
          claimed: claimedRewards
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

  const rewards = rewardsData[activeTab.toLowerCase().replace(" ", "_")] || []; // Ensure tab names match API

  if (loading) {
    return <div className="loading">Loading rewards...</div>;
  }

  return (
    <div className="reward-screen">
      <div className="reward-body">
        <div className="total-taps">
          <p>Your Total Taps:</p>
          <div className="taps-display">
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Logo" className="taps-logo" />
            <span className="taps-number">{totalTaps.toLocaleString()}</span>
          </div>
          <p className="task-link">How BT-boosters work?</p>
        </div>

        {/* Pagination Tabs */}
        <div className="pagination">
          {Object.keys(rewardsData).map((tab) => (
            <span
              key={tab}
              className={`pagination-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => handleTabClick(tab)}
            >
              {tab.replace("_", " ")} {/* Display friendly tab names */}
            </span>
          ))}
        </div>

        {/* Reward Cards */}
        <div className="reward-cards">
          {rewards.length > 0 ? (
            rewards.map((reward) => (
              <div className="reward-card" key={reward.reward_id}> {/* Use unique ID */}
                <div className="reward-left">
                  <img
                    src={reward.reward_image
                      ? `https://bt-coins.onrender.com/images/${reward.reward_image}`
                      : `${process.env.PUBLIC_URL}/default-reward-icon.png`}
                    alt={reward.reward_title}
                    className="reward-icon"
                  />
                  <div className="reward-info">
                    <p className="reward-title">{reward.reward_title}</p>
                    <div className="reward-meta">
                      <img
                        src={`${process.env.PUBLIC_URL}/logo.png`}
                        alt="Coin Icon"
                        className="small-icon"
                      />
                      <span>Reward: {reward.reward}</span>
                    </div>
                    <div className="reward-meta">
                      <span>Beneficiaries: {reward.beneficiary.join(', ')}</span>
                    </div>
                  </div>
                </div>
                {activeTab === "On-Going" ? (
                  <button
                    className="reward-cta"
                    style={{
                      backgroundColor: "#FFA500",
                      color: "white",
                    }}
                  >
                    Claim
                  </button>
                ) : (
                  <div
                    className="reward-share-icon"
                    style={{ backgroundColor: "#4CAF50" }}
                  >
                    <img
                      src={`${process.env.PUBLIC_URL}/share-icon.png`}
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

      <Navigation />
    </div>
  );
};

export default RewardScreen;
