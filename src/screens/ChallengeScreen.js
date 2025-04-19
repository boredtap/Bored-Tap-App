import React, { useState, useEffect, useCallback, useRef } from "react";
import Navigation from "../components/Navigation";
import "./ChallengeScreen.css";
import { fetchImage } from "../utils/fetchImage";
import { BASE_URL } from "../utils/BaseVariables";

const parseRemainingTime = (timeString) => {
  if (!timeString || typeof timeString !== "string") return 0;
  const [days, hours, minutes, seconds] = timeString.split(":").map(Number);
  return days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds;
};

const ChallengeScreen = () => {
  const [activeTab, setActiveTab] = useState("Open Challenges");
  const [totalTaps, setTotalTaps] = useState(0);
  const [challengesData, setChallengesData] = useState({
    "Open Challenges": [],
    "Completed Challenges": [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPerformOverlay, setShowPerformOverlay] = useState(false);
  const [performResult, setPerformResult] = useState(null);
  const [showRewardOverlay, setShowRewardOverlay] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [showShareOverlay, setShowShareOverlay] = useState(false);
  const [shareChallenge, setShareChallenge] = useState(null);
  const [showCopyPopup, setShowCopyPopup] = useState(false);
  const [pagination, setPagination] = useState({
    pageSize: 10,
    pageNumber: 1,
    hasMore: true,
  });
  const observer = useRef(null);
  const loadMoreRef = useRef(null);

  const clearChallengeEligibility = () => {
    console.log("Skipping clearChallengeEligibility to preserve unclaimed challenge eligibility");
  };

  useEffect(() => {
    const checkSessionAndUser = async () => {
      const telegramUser = JSON.parse(localStorage.getItem("telegramUser"));
      const storedSessionId = localStorage.getItem("sessionId");
      const currentSessionId = Date.now().toString();
      const token = localStorage.getItem("accessToken");

      if (!storedSessionId || storedSessionId !== currentSessionId) {
        console.log("New session detected, skipping eligibility clear");
        clearChallengeEligibility();
        localStorage.setItem("sessionId", currentSessionId);
      }

      if (telegramUser && token) {
        try {
          const response = await fetch(`${BASE_URL}/user/profile`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          if (response.ok) {
            const data = await response.json();
            const storedTelegramId = localStorage.getItem("lastTelegramId");
            const isFreshAccount = data.total_coins === 0 && data.level === 1;

            if (
              !storedTelegramId ||
              storedTelegramId !== telegramUser.id ||
              isFreshAccount
            ) {
              console.log(
                `New user or fresh account detected (telegramId: ${telegramUser.id}, isFresh: ${isFreshAccount}), skipping eligibility clear`
              );
              clearChallengeEligibility();
              localStorage.setItem("lastTelegramId", telegramUser.id);
            }
          }
        } catch (err) {
          console.error("Error checking user profile:", err);
        }
      }
    };

    checkSessionAndUser();

    const handleBeforeUnload = () => {
      console.log("App closing, skipping eligibility clear");
      clearChallengeEligibility();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const fetchChallenges = useCallback(
    async (status, pageNumber, append = false) => {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No access token found");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${BASE_URL}/earn/challenge/my-challenges?status=${status}&page_size=${pagination.pageSize}&page_number=${pageNumber}`,
          {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          }
        );
        if (!response.ok) throw new Error(`Failed to fetch ${status} challenges`);

        const data = await response.json();
        const challenges = data.challenges || data;
        const totalCount = data.total_count || data.length;

        const newChallenges = challenges.map((challenge) => {
          const isEligibleInStorage =
            status === "ongoing" &&
            localStorage.getItem(`challenge_${challenge.challenge_id}_eligible`) === "true";
          console.log(
            `Challenge ${challenge.challenge_id} eligibility: backend=${challenge.is_eligible}, localStorage=${isEligibleInStorage}`
          );

          return {
            title: challenge.name || "Unnamed Challenge",
            description: challenge.description || "No description",
            reward: challenge.reward || 0,
            time: parseRemainingTime(challenge.remaining_time),
            totalTime: parseRemainingTime(challenge.remaining_time),
            status: status,
            id: challenge.challenge_id,
            imageId: challenge.image_id,
            imageUrl: `${process.env.PUBLIC_URL}/logo.png`,
            url: challenge.challenge_url || null,
            eligible: status === "ongoing" ? isEligibleInStorage || challenge.is_eligible : false,
            completed: status === "completed",
          };
        });

        setChallengesData((prev) => ({
          ...prev,
          [status === "ongoing" ? "Open Challenges" : "Completed Challenges"]: append
            ? [...prev[status === "ongoing" ? "Open Challenges" : "Completed Challenges"], ...newChallenges]
            : newChallenges,
        }));

        const imagePromises = newChallenges.map((challenge) =>
          challenge.imageId && challenge.imageId !== "None"
            ? fetchImage(challenge.imageId, token, "challenge_image")
            : Promise.resolve(`${process.env.PUBLIC_URL}/logo.png`)
        );
        const imageUrls = await Promise.all(imagePromises);

        setChallengesData((prev) => ({
          ...prev,
          [status === "ongoing" ? "Open Challenges" : "Completed Challenges"]: (
            append
              ? prev[status === "ongoing" ? "Open Challenges" : "Completed Challenges"]
              : []
          ).concat(
            newChallenges.map((challenge, index) => ({
              ...challenge,
              imageUrl: imageUrls[index],
            }))
          ),
        }));

        setPagination((prev) => ({
          ...prev,
          hasMore: challenges.length === prev.pageSize && totalCount > pageNumber * prev.pageSize,
        }));
      } catch (err) {
        setError(err.message);
        console.error(`Error fetching ${status} challenges:`, err);
      } finally {
        setLoading(false);
      }
    },
    [pagination.pageSize]
  );

  useEffect(() => {
    const fetchInitialData = async () => {
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

        await Promise.all([
          fetchChallenges("ongoing", 1),
          fetchChallenges("completed", 1),
        ]);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching initial data:", err);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!pagination.hasMore || loading) return;

    const currentObserver = observer.current;
    const handleIntersection = (entries) => {
      if (entries[0].isIntersecting) {
        setPagination((prev) => {
          const nextPage = prev.pageNumber + 1;
          fetchChallenges(activeTab === "Open Challenges" ? "ongoing" : "completed", nextPage, true);
          return { ...prev, pageNumber: nextPage };
        });
      }
    };

    observer.current = new IntersectionObserver(handleIntersection, { threshold: 0.1 });
    if (loadMoreRef.current) observer.current.observe(loadMoreRef.current);

    return () => {
      if (currentObserver) currentObserver.disconnect();
    };
  }, [activeTab, pagination.hasMore, loading, fetchChallenges]);

  useEffect(() => {
    const interval = setInterval(() => {
      setChallengesData((prev) => ({
        ...prev,
        "Open Challenges": prev["Open Challenges"].map((challenge) => ({
          ...challenge,
          time: challenge.time > 0 ? challenge.time - 1 : 0,
        })),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handlePerformChallenge = useCallback(
    async (challenge) => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No access token found");
        return;
      }

      try {
        if (challenge.url) {
          console.log(`Navigating to challenge ${challenge.id} URL: ${challenge.url}`);
          window.open(challenge.url, "_blank");

          localStorage.setItem(`challenge_${challenge.id}_eligible`, "true");
          console.log(`Marked challenge ${challenge.id} as eligible in localStorage`);

          setChallengesData((prev) => ({
            ...prev,
            "Open Challenges": prev["Open Challenges"].map((ch) =>
              ch.id === challenge.id ? { ...ch, eligible: true } : ch
            ),
          }));

          setPerformResult({
            message: "Challenge opened in new tab. You can now claim your reward.",
            success: true,
          });
          setSelectedChallenge(challenge);
          setShowPerformOverlay(true);
        } else {
          const response = await fetch(`${BASE_URL}/perform_challenge/${challenge.id}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to perform challenge: ${response.status} - ${errorText}`);
          }

          const result = await response.json();
          const isEligible = result.message && !result.message.includes("not completed");

          setPerformResult({
            message: result.message || (isEligible ? "Challenge performed successfully" : "Challenge not completed"),
            success: isEligible,
          });
          setSelectedChallenge(challenge);
          setShowPerformOverlay(true);

          if (isEligible) {
            localStorage.setItem(`challenge_${challenge.id}_eligible`, "true");
            console.log(`Marked challenge ${challenge.id} as eligible in localStorage`);

            setChallengesData((prev) => ({
              ...prev,
              "Open Challenges": prev["Open Challenges"].map((ch) =>
                ch.id === challenge.id ? { ...ch, eligible: true } : ch
              ),
            }));
          }
        }
      } catch (err) {
        console.error("Error performing challenge:", err);
        setPerformResult({ message: `Error performing challenge: ${err.message}`, success: false });
        setSelectedChallenge(challenge);
        setShowPerformOverlay(true);
      }
    },
    []
  );

  const handleClaimReward = useCallback(
    async (challenge) => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No access token found");
        return;
      }

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
          throw new Error(`Failed to claim reward: ${errorText}`);
        }

        const result = await response.json();
        setSelectedChallenge({ ...challenge, rewardMessage: result.message });
        setShowRewardOverlay(true);

        localStorage.removeItem(`challenge_${challenge.id}_eligible`);
        console.log(`Cleared eligibility for challenge ${challenge.id} from localStorage`);

        setChallengesData((prev) => ({
          "Open Challenges": prev["Open Challenges"].filter((ch) => ch.id !== challenge.id),
          "Completed Challenges": [
            ...prev["Completed Challenges"],
            { ...challenge, status: "completed", time: 0, eligible: false, completed: true },
          ],
        }));
      } catch (err) {
        console.error("Error claiming reward:", err);
        alert(`Failed to claim reward: ${err.message}`);
      }
    },
    []
  );

  const handleTabClick = useCallback((tab) => {
    setActiveTab(tab);
    setPagination((prev) => ({ ...prev, pageNumber: 1, hasMore: true }));
    fetchChallenges(tab === "Open Challenges" ? "ongoing" : "completed", 1);
  }, [fetchChallenges]);

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
    return challenge.eligible || challenge.completed ? 100 : 0;
  };

  const shareLink = `https://t.me/Bored_Tap_Bot?start=challenge_${shareChallenge?.id || ""}`;
  const shareMessage = `I just completed "${shareChallenge?.title}" and earned ${shareChallenge?.reward.toLocaleString()} BT Coins on Bored Tap! Join me!`;

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
            {error && <p className="error-message">Error: {error}</p>}
            {challenges.length > 0 ? (
              challenges.map((challenge) => (
                <div
                  className="challenge-card clickable"
                  key={challenge.id}
                  onClick={() =>
                    activeTab !== "Completed Challenges" && !challenge.eligible && !challenge.completed
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
                          <span>Reward: {challenge.reward.toLocaleString()}</span>
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
                      className={`challenge-cta ${challenge.eligible ? "active" : "inactive"}`}
                      disabled={!challenge.eligible}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (challenge.eligible) handleClaimReward(challenge);
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
              ))
            ) : (
              <p className="no-challenge-message">No challenges available for this category.</p>
            )}
            {loading && <p className="loading-message">Loading more...</p>}
            <div ref={loadMoreRef} style={{ height: "20px" }} />
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
                  src={selectedChallenge.imageUrl || `${process.env.PUBLIC_URL}/logo.png`}
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
                  <span>{selectedChallenge.reward.toLocaleString()}</span>
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