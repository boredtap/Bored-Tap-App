import React, { useState, useEffect, useCallback } from "react";
import Navigation from "../components/Navigation";
import "./ChallengeScreen.css";
import { fetchImage } from "../utils/fetchImage";
import { BASE_URL } from "../utils/BaseVariables";

// Parse "DD:HH:MM:SS" string into total seconds
const parseRemainingTime = (timeString) => {
  if (!timeString || typeof timeString !== "string") return 0;
  const [days, hours, minutes, seconds] = timeString.split(":").map(Number);
  return (days * 24 * 60 * 60) + (hours * 60 * 60) + (minutes * 60) + seconds;
};

const ChallengeScreen = () => {
  const [activeTab, setActiveTab] = useState("Open Challenges");
  const [totalTaps, setTotalTaps] = useState(0);
  const [challengesData, setChallengesData] = useState({
    "Open Challenges": [],
    "Completed Challenges": [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPerformOverlay, setShowPerformOverlay] = useState(false);
  const [performResult, setPerformResult] = useState(null);
  const [showRewardOverlay, setShowRewardOverlay] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showShareOverlay, setShowShareOverlay] = useState(false);
  const [shareChallenge, setShareChallenge] = useState(null);
  const [showCopyPopup, setShowCopyPopup] = useState(false);

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
        const profileResponse = await fetch(`${BASE_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        if (!profileResponse.ok) throw new Error("Failed to fetch profile");
        const profileData = await profileResponse.json();
        setTotalTaps(profileData.total_coins || 0);

        const [ongoingResponse, completedResponse] = await Promise.all([
          fetch(`${BASE_URL}/earn/challenge/my-challenges?status=ongoing`, {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          }),
          fetch(`${BASE_URL}/earn/challenge/my-challenges?status=completed`, {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          }),
        ]);

        if (!ongoingResponse.ok || !completedResponse.ok) throw new Error("Failed to fetch challenges");

        const ongoingChallenges = await ongoingResponse.json();
        const completedChallenges = await completedResponse.json();

        const allChallenges = [
          ...ongoingChallenges.map((challenge) => ({
            title: challenge.name || "Unnamed Challenge",
            description: challenge.description || "No description",
            reward: challenge.reward || 0,
            time: parseRemainingTime(challenge.remaining_time),
            totalTime: parseRemainingTime(challenge.remaining_time),
            status: "ongoing",
            id: challenge.challenge_id,
            imageId: challenge.image_id,
            imageUrl: `${process.env.PUBLIC_URL}/logo.png`,
            url: challenge.url || null, // Assuming challenge has a url field
            eligible: false, // Track eligibility for claiming
          })),
          ...completedChallenges.map((challenge) => ({
            title: challenge.name || "Unnamed Challenge",
            description: challenge.description || "No description",
            reward: challenge.reward || 0,
            time: 0,
            totalTime: parseRemainingTime(challenge.remaining_time) || 0,
            status: "completed",
            id: challenge.challenge_id,
            imageId: challenge.image_id,
            imageUrl: `${process.env.PUBLIC_URL}/logo.png`,
            url: null,
            eligible: true, // Completed challenges are already claimed
          })),
        ];

        setChallengesData({
          "Open Challenges": allChallenges.filter((ch) => ch.status === "ongoing"),
          "Completed Challenges": allChallenges.filter((ch) => ch.status === "completed"),
        });

        const imagePromises = allChallenges.map((challenge) =>
          challenge.imageId
            ? fetchImage(challenge.imageId, token, "challenge_image")
            : Promise.resolve(`${process.env.PUBLIC_URL}/logo.png`)
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

  useEffect(() => {
    const interval = setInterval(() => {
      setChallengesData((prev) => ({
        ...prev,
        "Open Challenges": prev["Open Challenges"].map((challenge) => {
          if (challenge.status === "ongoing" && challenge.time > 0) {
            return { ...challenge, time: challenge.time - 1 };
          }
          return challenge;
        }),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handlePerformChallenge = useCallback(async (challenge) => {
    const token = localStorage.getItem("accessToken");
    if (challenge.url) {
      // Handle challenges with URL (similar to Social/Special tasks)
      window.open(challenge.url, "_blank");
      setPerformResult({
        message: "Challenge opened in new tab. Return to claim your reward.",
        success: true,
      });
      setSelectedChallenge(challenge);
      setShowPerformOverlay(true);

      // Mark as eligible locally after redirect
      setTimeout(() => {
        setChallengesData((prev) => ({
          ...prev,
          "Open Challenges": prev["Open Challenges"].map((ch) =>
            ch.id === challenge.id ? { ...ch, eligible: true } : ch
          ),
        }));
      }, 1000); // Short delay to simulate redirect and return
    } else {
      // Handle challenges without URL (similar to In-Game tasks)
      try {
        const response = await fetch(`${BASE_URL}/perform_challenge/${challenge.id}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();
        const isEligible = response.ok && !result.message.includes("not completed");

        setPerformResult({
          message: result.message || (isEligible ? "Challenge performed successfully" : "Challenge not completed"),
          success: isEligible,
        });
        setSelectedChallenge(challenge);
        setShowPerformOverlay(true);

        if (isEligible) {
          setChallengesData((prev) => ({
            ...prev,
            "Open Challenges": prev["Open Challenges"].map((ch) =>
              ch.id === challenge.id ? { ...ch, eligible: true } : ch
            ),
          }));
        }
      } catch (err) {
        console.error("Error performing challenge:", err);
        setPerformResult({ message: "Error performing challenge", success: false });
        setSelectedChallenge(challenge);
        setShowPerformOverlay(true);
      }
    }
  }, []);

  const handleClaimReward = useCallback(async (challenge) => {
    const token = localStorage.getItem("accessToken");
    try {
      const response = await fetch(`${BASE_URL}/earn/challenge/my-challenges/${challenge.id}/claim`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to claim reward: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      setSelectedChallenge({ ...challenge, rewardMessage: result.message });
      setShowRewardOverlay(true);

      // Move challenge to Completed Challenges
      setChallengesData((prev) => ({
        "Open Challenges": prev["Open Challenges"].filter((ch) => ch.id !== challenge.id),
        "Completed Challenges": [
          ...prev["Completed Challenges"],
          { ...challenge, status: "completed", time: 0, eligible: true },
        ],
      }));
    } catch (err) {
      console.error("Error claiming reward:", err);
      alert(`Failed to claim reward: ${err.message}`);
    }
  }, []);

  const handleTabClick = useCallback((tab) => setActiveTab(tab), []);

  const handleClosePerformOverlay = useCallback(() => {
    setShowPerformOverlay(false);
    setPerformResult(null);
    setSelectedChallenge(null);
  }, []);

  const handleCloseRewardOverlay = useCallback(() => {
    setShowRewardOverlay(false);
    setSelectedChallenge(null);
  }, []);

  const handleShareChallenge = useCallback((challenge) => {
    setShareChallenge(challenge);
    setShowShareOverlay(true);
  }, []);

  const handleCloseShareOverlay = useCallback(() => {
    setShowShareOverlay(false);
    setShareChallenge(null);
  }, []);

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return "0d 0h 0m 0s";
    const days = Math.floor(seconds / (3600 * 24));
    const hrs = Math.floor((seconds % (3600 * 24)) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${days}d ${hrs}h ${mins}m ${secs}s`;
  };

  const getProgressPercentage = (challenge) => {
    if (challenge.status === "completed") return 100;
    if (!challenge.totalTime || !Number.isFinite(challenge.time)) return 0;
    return Math.max(0, Math.min(100, ((challenge.totalTime - challenge.time) / challenge.totalTime) * 100));
  };

  const shareLink = `https://t.me/Bored_Tap_Bot?start=challenge_${shareChallenge?.id || ""}`;
  const shareMessage = `I just completed "${shareChallenge?.title}" and earned ${shareChallenge?.reward} BT Coins on Bored Tap! Join me!`;

  const handleTelegramShare = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(shareMessage)}`;
    window.open(telegramUrl, "_blank");
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage + " " + shareLink)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(shareLink);
    setShowCopyPopup(true);
    setTimeout(() => setShowCopyPopup(false), 2000);
  };

  const challenges = challengesData[activeTab] || [];

  return (
    <div className="challenge-screen">
      <div className="challenge-body">
        <div className="total-taps">
          <p>Your Total Taps:</p>
          <div className="taps-display">
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Logo" className="taps-logo" />
            <span className="taps-number">{totalTaps.toLocaleString()}</span>
          </div>
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
          <div className="challenge-cards">
            {loading ? (
              <p className="loading-message">Fetching Challenges...</p>
            ) : error ? (
              <p className="error-message">Error: {error}</p>
            ) : challenges.length > 0 ? (
              challenges.map((challenge) => {
                const isEligible = challenge.eligible && challenge.time <= 0;
                return (
                  <div
                    className="challenge-card clickable"
                    key={challenge.id}
                    onClick={() =>
                      activeTab !== "Completed Challenges" && !isEligible
                        ? handlePerformChallenge(challenge)
                        : null
                    }
                  >
                    <div className="challenge-left">
                      <img
                        src={challenge.imageUrl}
                        alt={challenge.title}
                        className="challenge-icon"
                        onError={(e) => (e.target.src = `${process.env.PUBLIC_URL}/logo.png`)}
                      />
                      <div className="challenge-info">
                        <p className="challenge-title">{challenge.title}</p>
                        <div className="challenge-meta">
                          <div className="reward-section">
                            <img
                              src={`${process.env.PUBLIC_URL}/logo.png`}
                              alt="Coin Icon"
                              className="small-icon"
                            />
                            <span>Reward: {challenge.reward}</span>
                          </div>
                          <span className="challenge-time">
                            {challenge.status === "ongoing" ? formatTime(challenge.time) : "Completed"}
                          </span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${getProgressPercentage(challenge)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    {challenge.status === "ongoing" ? (
                      <button
                        className={`challenge-cta ${isEligible ? "active" : "inactive"}`}
                        disabled={!isEligible}
                        onClick={(e) => {
                          e.stopPropagation();
                          isEligible && handleClaimReward(challenge);
                        }}
                      >
                        Claim
                      </button>
                    ) : (
                      <div
                        className="challenge-share-icon clickable"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareChallenge(challenge);
                        }}
                      >
                        <img
                          src={`${process.env.PUBLIC_URL}/share-icon.png`}
                          alt="Share Icon"
                          className="share-icon"
                        />
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="no-challenge-message">No challenges available for this category.</p>
            )}
          </div>
        </div>
      </div>

      {showPerformOverlay && performResult && (
        <div className="overlay-backdrop">
          <div className="overlay-container7">
            <div className={`task-overlay7 ${showPerformOverlay ? "slide-in" : "slide-out"}`}>
              <div className="overlay-header7">
                <h2 className="overlay-title7">Challenge Status</h2>
                <img
                  src={`${process.env.PUBLIC_URL}/cancel.png`}
                  alt="Cancel"
                  className="overlay-cancel"
                  onClick={handleClosePerformOverlay}
                />
              </div>
              <div className="overlay-divider"></div>
              <div className="overlay-content7">
                <img
                  src={
                    performResult.success
                      ? `${process.env.PUBLIC_URL}/claim.gif`
                      : `${process.env.PUBLIC_URL}/logo.png`
                  }
                  alt="Challenge Icon"
                  className="overlay-task-icon"
                />
                <p className="overlay-text">{performResult.message}</p>
                <button className="overlay-cta clickable" onClick={handleClosePerformOverlay}>
                  Ok
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRewardOverlay && selectedChallenge && (
        <div className="overlay-backdrop">
          <div className="overlay-container7">
            <div className={`task-overlay7 ${showRewardOverlay ? "slide-in" : "slide-out"}`}>
              <div className="overlay-header7">
                <h2 className="overlay-title7">Claim Reward</h2>
                <img
                  src={`${process.env.PUBLIC_URL}/cancel.png`}
                  alt="Cancel"
                  className="overlay-cancel"
                  onClick={handleCloseRewardOverlay}
                />
              </div>
              <div className="overlay-divider"></div>
              <div className="overlay-content7">
                <img
                  src={
                    selectedChallenge.imageUrl || `${process.env.PUBLIC_URL}/logo.png`
                  }
                  alt="Challenge Icon"
                  className="overlay-task-icon"
                  onError={(e) => (e.target.src = `${process.env.PUBLIC_URL}/logo.png`)}
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
                <p className="overlay-message">
                  {selectedChallenge.rewardMessage || "has been added to your coin balance"}
                </p>
                <button className="overlay-cta clickable" onClick={handleCloseRewardOverlay}>
                  Ok
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showShareOverlay && shareChallenge && (
        <div className="overlay-backdrop">
          <div className="overlay-container4">
            <div className={`invite-overlay4 ${showShareOverlay ? "slide-in" : "slide-out"}`}>
              <div className="overlay-header4">
                <h2 className="overlay-title4">Share Challenge</h2>
                <img
                  src={`${process.env.PUBLIC_URL}/cancel.png`}
                  alt="Close"
                  className="overlay-cancel"
                  onClick={handleCloseShareOverlay}
                />
              </div>
              <div className="overlay-divider"></div>
              <div className="overlay-content4">
                <p className="overlay-text">Share via:</p>
                <div className="share-options">
                  <button className="overlay-cta-button clickable" onClick={handleTelegramShare}>
                    Telegram
                  </button>
                  <button className="overlay-cta-button clickable" onClick={handleWhatsAppShare}>
                    WhatsApp
                  </button>
                  <button className="overlay-cta-button clickable" onClick={handleCopyShare}>
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCopyPopup && (
        <div className="copy-popup">
          <img
            src={`${process.env.PUBLIC_URL}/tick-icon.png`}
            alt="Tick Icon"
            className="copy-popup-icon"
          />
          <span className="copy-popup-text">Challenge link copied</span>
        </div>
      )}

      <Navigation />
    </div>
  );
};

export default ChallengeScreen;