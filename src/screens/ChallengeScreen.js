import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import "./ChallengeScreen.css";

const ChallengeScreen = () => {
  const [activeTab, setActiveTab] = useState("Open Challenges");
  const [totalTaps, setTotalTaps] = useState(0);
  const [challengesData, setChallengesData] = useState({
    "Open Challenges": [],
    "Completed Challenges": [],
  });
  const [challengeImages, setChallengeImages] = useState({});
  const [loading, setLoading] = useState(true); // Add loading state
  const [error, setError] = useState(null);

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

        // Set challenges data
        const allChallenges = [
          ...ongoingChallenges.map(challenge => ({
            title: challenge.name,
            description: challenge.description,
            reward: challenge.reward,
            time: challenge.remaining_time,
            status: "ongoing",
            id: challenge.challenge_id,
            imageId: challenge.image_id,
          })),
          ...completedChallenges.map(challenge => ({
            title: challenge.name,
            description: challenge.description,
            reward: challenge.reward,
            time: "Completed",
            status: "completed",
            id: challenge.challenge_id,
            imageId: challenge.image_id,
          })),
        ];

        setChallengesData({
          "Open Challenges": allChallenges.filter(ch => ch.status === "ongoing"),
          "Completed Challenges": allChallenges.filter(ch => ch.status === "completed"),
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

            setChallengeImages(prev => ({
              ...prev,
              [challenge.imageId]: imageUrl,
            }));
          } catch (err) {
            console.error(`Error fetching image for challenge ${challenge.id}:`, err);
            setChallengeImages(prev => ({
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

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleClaimClick = (challenge) => {
    console.log(`Claiming reward for challenge: ${challenge.title}`);
    // Add logic to claim reward here if needed
  };

  const challenges = challengesData[activeTab] || [];

  return (
    <div className="challenge-screen">
      {/* Body */}
      <div className="challenge-body">
        {/* Total Taps */}
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
          <p className="tap-rewards">
            Earn BT-coin rewards by completing simple tasks.
          </p>
          <p className="task-link">How tasks work?</p>
        </div>

        {/* Pagination (Tabs) - Moved above challenge cards */}
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

        {/* Challenge Cards */}
        <div className="challenge-cards">
          {loading ? (
            <p className="loading-message">Fetching Challenges...</p>
          ) : error ? (
            <p className="error-message">Error: {error}</p>
          ) : challenges.length > 0 ? (
            challenges.map((challenge) => (
              <div className="challenge-card" key={challenge.id}>
                <div className="challenge-left">
                  <img
                    src={challengeImages[challenge.imageId] || `${process.env.PUBLIC_URL}/logo.png`}
                    alt={challenge.title}
                    className="challenge-icon" // Matches reward-icon size (32x32px)
                  />
                  <div className="challenge-info">
                    <p className="challenge-title">{challenge.title}</p>
                    <p className="challenge-description">{challenge.description}</p>
                    <div className="challenge-meta">
                      <img
                        src={`${process.env.PUBLIC_URL}/logo.png`}
                        alt="Coin Icon"
                        className="small-icon" // Matches small-icon size (16x16px)
                      />
                      <span>{challenge.reward}</span>
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
                  className="challenge-cta"
                  onClick={() => handleClaimClick(challenge)}
                  disabled={challenge.status === "completed"}
                >
                  {challenge.status === "ongoing" ? "Claim" : "Completed"}
                </button>
              </div>
            ))
          ) : (
            <p className="no-challenges">No challenges available yet.</p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default ChallengeScreen;