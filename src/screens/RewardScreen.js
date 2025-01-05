import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import "./RewardScreen.css";

const RewardScreen = () => {
  const [activeTab, setActiveTab] = useState("New Reward");
  const [totalTaps, setTotalTaps] = useState(0);
  const [rewardsData, setRewardsData] = useState({});
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
        const profileResponse = await fetch("https://bored-tap-api.onrender.com/user/profile", {
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

        // Placeholder for fetch rewards (once URL is available)
        // const rewardsResponse = await fetch("REWARDS_API_URL", {
        //   method: "GET",
        //   headers: {
        //     Authorization: `Bearer ${token}`,
        //     "Content-Type": "application/json",
        //   },
        // });
        // const rewards = await rewardsResponse.json();
        // setRewardsData(rewards);

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

  const rewards = rewardsData[activeTab] || []; // Use backend data once available, for now use placeholder

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
          {rewards.map((reward, index) => (
            <div className="reward-card" key={index}>
              <div className="reward-left">
                <img
                  src={`${process.env.PUBLIC_URL}${reward.icon}`}
                  alt={reward.title}
                  className="reward-icon"
                />
                <div className="reward-info">
                  <p className="reward-title">{reward.title}</p>
                  <div className="reward-meta">
                    <img
                      src={`${process.env.PUBLIC_URL}/logo.png`}
                      alt="Coin Icon"
                      className="small-icon"
                    />
                    <span>{reward.description}</span>
                  </div>
                </div>
              </div>
              {activeTab === "New Reward" ? (
                <button
                  className="reward-cta"
                  style={{
                    backgroundColor: reward.button.bgColor,
                    color: reward.button.textColor,
                  }}
                >
                  {reward.button.label}
                </button>
              ) : (
                <div
                  className="reward-share-icon"
                  style={{ backgroundColor: reward.button.bgColor }}
                >
                  <img
                    src={`${process.env.PUBLIC_URL}${reward.button.icon}`}
                    alt="Share Icon"
                    className="share-icon"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default RewardScreen;