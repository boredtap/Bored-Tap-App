import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import "./RewardScreen.css";

const RewardScreen = () => {
  const [activeTab, setActiveTab] = useState("on_going"); // Default tab matches backend response
  const [totalTaps, setTotalTaps] = useState(0); // User's total taps from profile
  const [rewardsData, setRewardsData] = useState({ on_going: [], claimed: [] }); // Rewards data
  const [rewardImages, setRewardImages] = useState({}); // Cache for reward images
  const [loading, setLoading] = useState(true); // Loading state for data fetching

  // Fetch user profile and rewards data on component mount
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
          throw new Error(`Profile fetch failed: ${profileResponse.status}`);
        }

        const profileData = await profileResponse.json();
        setTotalTaps(profileData.total_coins);

        // Fetch rewards for both "on_going" and "claimed" statuses
        const rewardTypes = ["on_going", "claimed"];
        const fetchedRewards = {};

        for (const type of rewardTypes) {
          const response = await fetch(`https://bt-coins.onrender.com/earn/my-rewards?status=${type}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch ${type} rewards`);
          }

          fetchedRewards[type] = await response.json();
        }

        setRewardsData(fetchedRewards);
      } catch (err) {
        console.error("Error fetching user profile or rewards:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfileAndRewards();
  }, []);

  // Fetch reward images when rewards data updates
  useEffect(() => {
    const fetchRewardImages = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
  
      const allRewards = [...rewardsData.on_going, ...rewardsData.claimed];
      const missingImages = allRewards.filter(
        (reward) => reward.reward_image_id && !rewardImages[reward.reward_image_id]
      );
  
      if (missingImages.length === 0) return;
  
      const newImages = {};
      for (const reward of missingImages) {
        try {
          const response = await fetch(`https://bt-coins.onrender.com/reward_image/${reward.reward_image_id}`, {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          });
  
          if (!response.ok) throw new Error("Failed to fetch image");
  
          const imageBlob = await response.blob();
          newImages[reward.reward_image_id] = URL.createObjectURL(imageBlob);
        } catch (error) {
          console.error(`Error fetching image for ${reward.reward_image_id}:`, error);
          newImages[reward.reward_image_id] = `${process.env.PUBLIC_URL}/default-reward-icon.png`;
        }
      }
  
      setRewardImages((prevImages) => ({ ...prevImages, ...newImages }));
    };
  
    if (rewardsData.on_going.length > 0 || rewardsData.claimed.length > 0) {
      fetchRewardImages();
    }
  }, [rewardsData, rewardImages]); // Added rewardImages to dependency array

  // Handle tab switching
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  // Handle claiming a reward
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
          claimed: [...prevData.claimed, result],
        }));
      } else {
        alert(`Failed to claim reward: ${result.message}`);
      }
    } catch (err) {
      console.error("Error claiming reward:", err);
    }
  };

  const rewards = rewardsData[activeTab] || [];
  const tabLabels = { on_going: "On-going Reward", claimed: "Claimed Reward" }; // Custom tab names

  return (
    <div className="reward-screen">
      <div className="reward-body">
        {/* Total Taps Display */}
        <div className="total-taps">
          <p>Your Total Taps:</p>
          <div className="taps-display">
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Logo" className="taps-logo" />
            <span className="taps-number">{totalTaps.toLocaleString()}</span>
          </div>
        </div>

        {/* Pagination Tabs */}
        <div className="pagination">
          {Object.keys(rewardsData).map((tab) => (
            <span
              key={tab}
              className={`pagination-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => handleTabClick(tab)}
            >
              {tabLabels[tab]} {/* Use custom labels */}
            </span>
          ))}
        </div>

        {/* Reward Cards */}
        <div className="reward-cards">
          {loading ? (
            <p className="loading-message">Fetching Rewards...</p>
          ) : rewards.length > 0 ? (
            rewards.map((reward) => (
              <div className="reward-card" key={reward.reward_id}>
                <div className="reward-left">
                  <img
                    src={rewardImages[reward.reward_image_id] || `${process.env.PUBLIC_URL}/default-reward-icon.png`}
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
                    style={{ backgroundColor: "orange", color: "black" }} // Black text for "Claim"
                    onClick={() => handleClaimReward(reward.reward_id)}
                  >
                    Claim
                  </button>
                ) : (
                  <div
                    className="reward-share-icon"
                    style={{ backgroundColor: "#000" }} // Black background for claimed
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

      {/* Navigation Bar */}
      <Navigation />
    </div>
  );
};

export default RewardScreen;