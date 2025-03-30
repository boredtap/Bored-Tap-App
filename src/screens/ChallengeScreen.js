import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import "./ChallengeScreen.css";
import { fetchImage } from "../utils/fetchImage"; // Use standard fetchImage
import { BASE_URL } from "../utils/BaseVariables"; // Import BASE_URL

const ChallengeScreen = () => {
  const [activeTab, setActiveTab] = useState("Open Challenges");
  const [totalTaps, setTotalTaps] = useState(0);
  const [challengesData, setChallengesData] = useState({
    "Open Challenges": [],
    "Completed Challenges": [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No access token found");
        setLoading(false);
        return;
      }

      try {
        const profileResponse = await fetch(`${BASE_URL}/user/profile`, { // Updated URL
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!profileResponse.ok) throw new Error("Failed to fetch profile");
        const profileData = await profileResponse.json();
        setTotalTaps(profileData.total_coins || 0);

        const [ongoingResponse, completedResponse] = await Promise.all([
          fetch(`${BASE_URL}/earn/challenge/my-challenges?status=ongoing`, { // Updated URL
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
          fetch(`${BASE_URL}/earn/challenge/my-challenges?status=completed`, { // Updated URL
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }),
        ]);

        if (!ongoingResponse.ok) throw new Error("Failed to fetch ongoing challenges");
        if (!completedResponse.ok) throw new Error("Failed to fetch completed challenges");

        const ongoingChallenges = await ongoingResponse.json();
        const completedChallenges = await completedResponse.json();

        const allChallenges = [
          ...ongoingChallenges.map((challenge) => ({
            title: challenge.name,
            description: challenge.description,
            reward: challenge.reward,
            time: challenge.remaining_time,
            status: "ongoing",
            id: challenge.challenge_id,
            imageId: challenge.image_id,
            imageUrl: `${process.env.PUBLIC_URL}/logo.png`,
          })),
          ...completedChallenges.map((challenge) => ({
            title: challenge.name,
            description: challenge.description,
            reward: challenge.reward,
            time: "Completed",
            status: "completed",
            id: challenge.challenge_id,
            imageId: challenge.image_id,
            imageUrl: `${process.env.PUBLIC_URL}/logo.png`,
          })),
        ];

        console.log("Challenge image IDs:", allChallenges.map((ch) => ch.imageId)); // Debug log

        setChallengesData({
          "Open Challenges": allChallenges.filter((ch) => ch.status === "ongoing"),
          "Completed Challenges": allChallenges.filter((ch) => ch.status === "completed"),
        });
        setLoading(false);

        const imagePromises = allChallenges.map((challenge) =>
          challenge.imageId
            ? fetchImage(
                challenge.imageId,
                token,
                "challenge_image",
                `${process.env.PUBLIC_URL}/default-challenge-icon.png`
              )
            : Promise.resolve(`${process.env.PUBLIC_URL}/default-challenge-icon.png`)
        );
        const imageUrls = await Promise.all(imagePromises);

        setChallengesData((prev) => ({
          "Open Challenges": prev["Open Challenges"].map((challenge, index) => ({
            ...challenge,
            imageUrl: imageUrls[index],
          })),
          "Completed Challenges": prev["Completed Challenges"].map((challenge, index) => ({
            ...challenge,
            imageUrl: imageUrls[index + prev["Open Challenges"].length],
          })),
        }));
      } catch (err) {
        setError(err.message);
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTabClick = (tab) => setActiveTab(tab);

  const handleClaimClick = (challenge) => {
    setSelectedChallenge(challenge);
    setShowOverlay(true);
  };

  const handleCloseOverlay = () => {
    setShowOverlay(false);
    setSelectedChallenge(null);
  };

  const challenges = challengesData[activeTab] || [];

  return (
    <div className="challenge-screen">
      <div className="challenge-content">
        <div className="total-taps">
          <p>Your Total Taps:</p>
          <div className="taps-display">
            <img
              src={`${process.env.PUBLIC_URL}/logo.png`}
              alt="Logo"
              className="taps-logo"
              loading="lazy"
            />
            <span className="taps-number">{totalTaps.toLocaleString()}</span>
          </div>
          <p className="tap-rewards">Earn BT-coin rewards by completing challenges.</p>
        </div>

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

        <div className="challenge-cards-container">
          {loading ? (
            <p className="loading-message">Fetching Challenges...</p>
          ) : error ? (
            <p className="error-message">Error: {error}</p>
          ) : challenges.length > 0 ? (
            challenges.map((challenge) => (
              <div className="challenge-card" key={challenge.id}>
                <div className="challenge-left">
                  <img
                    src={challenge.imageUrl}
                    alt={challenge.title}
                    className="challenge-icon"
                    loading="lazy"
                    onError={(e) => (e.target.src = `${process.env.PUBLIC_URL}/default-challenge-icon.png`)}
                  />
                  <div className="challenge-info">
                    <p className="challenge-title">{challenge.title}</p>
                    <p className="challenge-description">{challenge.description}</p>
                    <div className="challenge-meta">
                      <img
                        src={`${process.env.PUBLIC_URL}/logo.png`}
                        alt="Coin Icon"
                        className="small-icon"
                        loading="lazy"
                      />
                      <span>{challenge.reward}</span>
                      <span className="divider">•</span>
                      <span className="challenge-time">{challenge.time}</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: challenge.status === "ongoing" ? "50%" : "100%" }}
                      />
                    </div>
                  </div>
                </div>
                <button
                  className={`challenge-cta ${challenge.status === "completed" ? "active" : "inactive"}`}
                  onClick={() => handleClaimClick(challenge)}
                  disabled={challenge.status !== "completed"}
                >
                  Claim
                </button>
              </div>
            ))
          ) : (
            <p className="no-challenges">No challenges available yet.</p>
          )}
        </div>
      </div>

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
            <div className="overlay-divider" />
            <div className="overlay-content">
              <img
                src={`${process.env.PUBLIC_URL}/claim.gif`}
                alt="Claim Animation"
                className="overlay2-challenge-icon"
                loading="lazy"
              />
              <p className="overlay-text">Your reward of</p>
              <div className="overlay-reward-value">
                <img
                  src={`${process.env.PUBLIC_URL}/logo.png`}
                  alt="Coin Icon"
                  className="overlay-coin-icon"
                  loading="lazy"
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

      <Navigation />
    </div>
  );
};

export default ChallengeScreen;