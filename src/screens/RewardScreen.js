import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import "./RewardScreen.css";

const RewardScreen = () => {
  const [activeTab, setActiveTab] = useState("on_going"); // Must match backend response
  const [totalTaps, setTotalTaps] = useState(0);
  const [rewardsData, setRewardsData] = useState({
    on_going: [],
    claimed: [],
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

        // Fetch user profile
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
        setTotalTaps(profileData.total_coins);

        // Fetch rewards for both ongoing and claimed
        const ongoingRewardsResponse = await fetch(
          "https://bt-coins.onrender.com/earn/my-rewards?status=on_going",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
        const claimedRewardsResponse = await fetch(
          "https://bt-coins.onrender.com/earn/my-rewards?status=claimed",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!ongoingRewardsResponse.ok || !claimedRewardsResponse.ok) {
          throw new Error("Failed to fetch rewards data");
        }

        const ongoingRewards = await ongoingRewardsResponse.json();
        const claimedRewards = await claimedRewardsResponse.json();

        setRewardsData({
          on_going: ongoingRewards,
          claimed: claimedRewards,
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

  const handleClaimReward = async (rewardId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(`https://bt-coins.onrender.com/earn/my-rewards/${rewardId}/claim`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      if (response.ok) {
        alert("Reward claimed successfully!");
        setRewardsData((prevData) => ({
          ...prevData,
          on_going: prevData.on_going.filter((reward) => reward.reward_id !== rewardId),
          claimed: [...prevData.claimed, result], // Add claimed reward
        }));
      } else {
        alert(`Failed to claim reward: ${result.message}`);
      }
    } catch (err) {
      console.error("Error claiming reward:", err);
    }
  };

  const rewards = rewardsData[activeTab] || [];

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
              {tab.replace("_", " ").toUpperCase()}
            </span>
          ))}
        </div>

        {/* Reward Cards */}
        <div className="reward-cards">
          {rewards.length > 0 ? (
            rewards.map((reward) => (
              <div className="reward-card" key={reward.reward_id}>
                <div className="reward-left">
                  <img
                    src={`https://bt-coins.onrender.com/admin/reward/reward_image/${reward.reward_image_id}`}
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
                  </div>
                </div>
                {activeTab === "on_going" ? (
                  <button
                    className="reward-cta"
                    style={{
                      backgroundColor: "orange",
                      color: "white",
                    }}
                    onClick={() => handleClaimReward(reward.reward_id)}
                  >
                    Claim
                  </button>
                ) : (
                  <div
                    className="reward-share-icon"
                    style={{ backgroundColor: "white" }}
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
