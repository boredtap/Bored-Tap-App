import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import "./ChallengeScreen.css";

// ChallengeScreen component displays open and completed challenges with user-friendly navigation
const ChallengeScreen = () => {
  // State for active tab (Open Challenges or Completed Challenges)
  const [activeTab, setActiveTab] = useState("Open Challenges");
  // State for user's total taps (coins)
  const [totalTaps, setTotalTaps] = useState(0);
  // State for challenges data, categorized by status
  const [challengesData, setChallengesData] = useState({
    "Open Challenges": [],
    "Completed Challenges": [],
  });
  // State for challenge images, mapped by imageId
  const [challengeImages, setChallengeImages] = useState({});
  // State for loading status during data fetching
  const [loading, setLoading] = useState(true);
  // State for error handling during data fetching
  const [error, setError] = useState(null);
  // State for managing overlay visibility
  const [showOverlay, setShowOverlay] = useState(false);
  // State for storing the selected challenge for the overlay
  const [selectedChallenge, setSelectedChallenge] = useState(null);

  // Effect to fetch user profile, challenges, and images on component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // Set loading to true at the start
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No access token found");
        setLoading(false);
        return;
      }

      try {
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
        setTotalTaps(profileData.total_coins || 0);

        // Fetch ongoing challenges
        const ongoingChallengesResponse = await fetch(
          "https://bt-coins.onrender.com/earn/challenge/my-challenges?status=ongoing",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!ongoingChallengesResponse.ok) {
          throw new Error("Failed to fetch ongoing challenges");
        }

        const ongoingChallenges = await ongoingChallengesResponse.json();

        // Fetch completed challenges
        const completedChallengesResponse = await fetch(
          "https://bt-coins.onrender.com/earn/challenge/my-challenges?status=completed",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!completedChallengesResponse.ok) {
          throw new Error("Failed to fetch completed challenges");
        }

        const completedChallenges = await completedChallengesResponse.json();

        // Combine and map challenges data
        const allChallenges = [
          ...ongoingChallenges.map((challenge) => ({
            title: challenge.name,
            description: challenge.description,
            reward: challenge.reward,
            time: challenge.remaining_time,
            status: "ongoing",
            id: challenge.challenge_id,
            imageId: challenge.image_id,
          })),
          ...completedChallenges.map((challenge) => ({
            title: challenge.name,
            description: challenge.description,
            reward: challenge.reward,
            time: "Completed",
            status: "completed",
            id: challenge.challenge_id,
            imageId: challenge.image_id,
          })),
        ];

        // Set challenges data by category
        setChallengesData({
          "Open Challenges": allChallenges.filter((ch) => ch.status === "ongoing"),
          "Completed Challenges": allChallenges.filter((ch) => ch.status === "completed"),
        });

        // Fetch all challenge images
        const imagePromises = allChallenges.map(async (challenge) => {
          try {
            const imageResponse = await fetch(
              `https://bt-coins.onrender.com/earn/challenge/challenge_image/${challenge.imageId}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (!imageResponse.ok) {
              throw new Error(`Failed to fetch image for challenge ${challenge.id}`);
            }

            const imageBlob = await imageResponse.blob();
            const imageUrl = URL.createObjectURL(imageBlob);

            setChallengeImages((prev) => ({
              ...prev,
              [challenge.imageId]: imageUrl,
            }));
          } catch (err) {
            console.error(`Error fetching image for challenge ${challenge.id}:`, err);
            setChallengeImages((prev) => ({
              ...prev,
              [challenge.imageId]: `${process.env.PUBLIC_URL}/logo.png`, // Fallback image
            }));
          }
        });

        await Promise.all(imagePromises);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false); // Set loading to false when done
      }
    };

    fetchData();
  }, []);

  // Handler for switching tabs
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  // Handler for clicking the "Claim" button
  const handleClaimClick = (challenge) => {
    setSelectedChallenge(challenge);
    setShowOverlay(true);
  };

  // Handler for closing the overlay
  const handleCloseOverlay = () => {
    setShowOverlay(false);
    setSelectedChallenge(null);
  };

  // Get challenges for the active tab
  const challenges = challengesData[activeTab] || [];

  return (
    <div className="challenge-screen">
      {/* Main content wrapper for alignment */}
      <div className="challenge-content">
        {/* Total Taps Section */}
        <div className="total-taps">
          <p>Your Total Taps:</p>
          <div className="taps-display">
            <img
              src={`${process.env.PUBLIC_URL}/logo.png`}
              alt="Logo"
              className="taps-logo"
            />
            <span className="taps-number">{totalTaps?.toLocaleString() ?? 0}</span>
          </div>
          <p className="tap-rewards">Earn BT-coin rewards by completing challenges.</p>
        </div>

        {/* Pagination Tabs */}
        <div className="pagination">
          {Object.keys(challengesData).map((tab) => (
            <span
              key={tab}
              className={`pagination-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => handleTabClick(tab)}
            >
              {tab}
            </span>
          ))}
        </div>

        {/* Scrollable Challenge Cards Container */}
        <div className="challenge-cards-container">
          <div className="challenge-cards">
            {loading ? (
              <p className="loading-message">Fetching Challenges...</p>
            ) : error ? (
              <p className="error-message">Error: {error}</p>
            ) : challenges.length > 0 ? (
              challenges.map((challenge) => {
                // Determine if the challenge is claimable (e.g., completed)
                const isClaimable = challenge.status === "completed"; // Adjust based on actual condition
            
                return (
                  <div className="challenge-card" key={challenge.id}>
                    <div className="challenge-left">
                      <img
                        src={challengeImages[challenge.imageId] || `${process.env.PUBLIC_URL}/logo.png`}
                        alt={challenge.title}
                        className="challenge-icon"
                      />
                      <div className="challenge-info">
                        <p className="challenge-title">{challenge.title}</p>
                        <p className="challenge-description">{challenge.description}</p>
                        <div className="challenge-meta">
                          <img
                            src={`${process.env.PUBLIC_URL}/logo.png`}
                            alt="Coin Icon"
                            className="small-icon"
                          />
                          <span>{challenge.reward}</span>
                          <span className="divider">•</span>
                          <span className="challenge-time">{challenge.time}</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: challenge.status === "ongoing" ? "50%" : "100%" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <button
                      className={`challenge-cta ${isClaimable ? "active" : "inactive"}`}
                      onClick={() => handleClaimClick(challenge)}
                      disabled={!isClaimable}
                    >
                      {isClaimable ? "Claim" : "Claim"}
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="no-challenges">No challenges available yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Overlay for Claim Confirmation */}
      {showOverlay && selectedChallenge && (
        <div className="overlay-container">
          <div className={`challenge-overlay ${showOverlay ? "slide-in" : "slide-out"}`}>
            <div className="overlay-header">
              <h2 className="overlay-title">Claim Reward</h2>
              <img
                src={`${process.env.PUBLIC_URL}/cancel.png`}
                alt="Cancel"
                className="overlay-cancel"
                onClick={handleCloseOverlay}
              />
            </div>
            <div className="overlay-divider"></div>
            <div className="overlay-content">
              <img
                src={
                  challengeImages[selectedChallenge.imageId] ||
                  `${process.env.PUBLIC_URL}/default-challenge-icon.png`
                }
                alt="Challenge Icon"
                className="overlay-challenge-icon"
              />
              <p className="overlay-text">Your reward of</p>
              <div className="overlay-reward-value">
                <img
                  src={`${process.env.PUBLIC_URL}/logo.png`}
                  alt="Coin Icon"
                  className="overlay-coin-icon"
                />
                <span>{selectedChallenge.reward}</span>
              </div>
              <p className="overlay-message">has been added to your coin balance</p>
              <button className="overlay-cta" onClick={handleCloseOverlay}>
                Ok
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Component */}
      <Navigation />
    </div>
  );
};

export default ChallengeScreen;