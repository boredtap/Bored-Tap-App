import React, { useState, useEffect, useContext, useCallback } from "react";
import Navigation from "../components/Navigation";
import "./RewardScreen.css";
import { BoostContext } from "../context/BoosterContext";
import { fetchImage } from "../utils/fetchImage"; // Adjust path if needed

const fetchWithAuth = async (url, token) => {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) throw new Error(`Failed to fetch ${url}`);
  return response.json();
};

const RewardScreen = () => {
  const [activeTab, setActiveTab] = useState("on_going");
  const { totalTaps } = useContext(BoostContext);
  const [rewardsData, setRewardsData] = useState({ on_going: [], claimed: [] });
  const [loading, setLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);

  useEffect(() => {
    const fetchRewardsData = async () => {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("No access token found");
        setLoading(false);
        return;
      }

      try {
        // Fetch profile (optional, remove if not needed)
        await fetchWithAuth("https://bt-coins.onrender.com/user/profile", token);

        // Fetch rewards
        const rewardTypes = ["on_going", "claimed"];
        const fetchedRewards = await Promise.all(
          rewardTypes.map((type) =>
            fetchWithAuth(`https://bt-coins.onrender.com/earn/my-rewards?status=${type}`, token)
          )
        );

        // Map rewards with placeholders initially
        const initialRewards = {
          on_going: fetchedRewards[0].map((reward) => ({
            ...reward,
            imageUrl: `${process.env.PUBLIC_URL}/default-reward-icon.png`, // Placeholder
          })),
          claimed: fetchedRewards[1].map((reward) => ({
            ...reward,
            imageUrl: `${process.env.PUBLIC_URL}/default-reward-icon.png`, // Placeholder
          })),
        };

        setRewardsData(initialRewards);
        setLoading(false);

        // Fetch images in parallel after render
        const allRewards = [...fetchedRewards[0], ...fetchedRewards[1]];
        const imagePromises = allRewards.map((reward) =>
          reward.reward_image_id
            ? fetchImage(reward.reward_image_id, token, "reward_image")
            : Promise.resolve(`${process.env.PUBLIC_URL}/default-reward-icon.png`)
        );
        const imageUrls = await Promise.all(imagePromises);

        // Update rewards with fetched images in one go
        setRewardsData((prev) => ({
          on_going: prev.on_going.map((reward, index) => ({
            ...reward,
            imageUrl: imageUrls[index],
          })),
          claimed: prev.claimed.map((reward, index) => ({
            ...reward,
            imageUrl: imageUrls[index + prev.on_going.length],
          })),
        }));
      } catch (err) {
        console.error("Error fetching rewards data:", err);
        setRewardsData({ on_going: [], claimed: [] });
        setLoading(false);
      }
    };

    fetchRewardsData();
  }, []);

  const handleTabClick = useCallback((tab) => setActiveTab(tab), []);

  const handleClaimReward = useCallback(
    async (rewardId) => {
      const token = localStorage.getItem("accessToken");
      try {
        const result = await fetchWithAuth(
          `https://bt-coins.onrender.com/earn/my-rewards/${rewardId}/claim`,
          token
        );
        const claimedReward = rewardsData.on_going.find((r) => r.reward_id === rewardId);
        setSelectedReward(claimedReward);
        setShowOverlay(true);

        setRewardsData((prev) => ({
          ...prev,
          on_going: prev.on_going.filter((r) => r.reward_id !== rewardId),
          claimed: [...prev.claimed, { ...result, imageUrl: claimedReward.imageUrl }],
        }));
      } catch (err) {
        console.error("Error claiming reward:", err);
        alert("Failed to claim reward");
      }
    },
    [rewardsData]
  );

  const handleCloseOverlay = useCallback(() => {
    setShowOverlay(false);
    setSelectedReward(null);
  }, []);

  const rewards = rewardsData[activeTab] || [];
  const tabLabels = { on_going: "On-going Reward", claimed: "Claimed Reward" };

  return (
    <div className="reward-screen">
      <div className="reward-body">
        <div className="total-taps">
          <p>Your Total Taps:</p>
          <div className="taps-display">
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Logo" className="taps-logo" />
            <span className="taps-number">{totalTaps?.toLocaleString() ?? 0}</span>
          </div>
        </div>

        <div className="pagination">
          {Object.keys(rewardsData).map((tab) => (
            <span
              key={tab}
              className={`pagination-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => handleTabClick(tab)}
            >
              {tabLabels[tab]}
            </span>
          ))}
        </div>

        <div className="reward-cards-container">
          <div className="reward-cards">
            {loading ? (
              <p className="loading-message">Fetching Rewards...</p>
            ) : rewards.length > 0 ? (
              rewards.map((reward) => (
                <div className="reward-card" key={reward.reward_id}>
                  <div className="reward-left">
                    <img
                      src={reward.imageUrl}
                      alt={reward.reward_title}
                      className="reward-icon"
                      loading="lazy"
                      onError={(e) =>
                        (e.target.src = `${process.env.PUBLIC_URL}/default-reward-icon.png`)
                      }
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
                      style={{ backgroundColor: "#f9b54c", color: "black" }}
                      onClick={() => handleClaimReward(reward.reward_id)}
                    >
                      Claim
                    </button>
                  ) : (
                    <div className="reward-share-icon" style={{ backgroundColor: "#000" }}>
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
      </div>

      {showOverlay && selectedReward && (
        <div className="overlay-backdrop">
          <div className="overlay-container5">
            <div className={`reward-overlay5 ${showOverlay ? "slide-in" : "slide-out"}`}>
              <div className="overlay-header5">
                <h2 className="overlay-title5">Claim Reward</h2>
                <img
                  src={`${process.env.PUBLIC_URL}/cancel.png`}
                  alt="Cancel"
                  className="overlay-cancel"
                  onClick={handleCloseOverlay}
                />
              </div>
              <div className="overlay-divider"></div>
              <div className="overlay-content5">
                <img
                  src={`${process.env.PUBLIC_URL}/claim.gif`}
                  alt="Reward Icon"
                  className="overlay2-reward-icon"
                />
                <p className="overlay-text">Your reward of</p>
                <div className="overlay-reward-value">
                  <img
                    src={`${process.env.PUBLIC_URL}/logo.png`}
                    alt="Coin Icon"
                    className="overlay-coin-icon"
                  />
                  <span>{selectedReward.reward}</span>
                </div>
                <p className="overlay-message">has been added to your coin balance</p>
                <button className="overlay-cta" onClick={handleCloseOverlay}>
                  Ok
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Navigation />
    </div>
  );
};

export default RewardScreen;