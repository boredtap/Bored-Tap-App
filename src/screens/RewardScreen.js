import React, { useState, useEffect, useContext, useCallback, useRef } from "react";
import Navigation from "../components/Navigation";
import "./RewardScreen.css";
import { BoostContext } from "../context/BoosterContext";
import { fetchImage } from "../utils/fetchImage";
import { BASE_URL } from "../utils/BaseVariables";
import BanSuspensionOverlay from "../components/BanSuspensionOverlay";

const fetchWithAuth = async (url, token) => {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    const errorData = await response.json();
    if (response.status === 401 && errorData.detail === "User banned.") {
      throw new Error("banned");
    } else if (response.status === 401 && errorData.detail.startsWith("User has been suspended")) {
      const timeMatch = errorData.detail.match(/Remaining time: (.*)$/);
      let remainingTime = 0;
      if (timeMatch) {
        const timeStr = timeMatch[1];
        const [daysPart, timePart] = timeStr.split(", ");
        const days = parseInt(daysPart.split(" ")[0], 10);
        const [hours, minutes, seconds] = timePart.split(":").map(Number);
        remainingTime = (days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds) * 1000;
      }
      throw new Error("suspended", { cause: remainingTime });
    }
    throw new Error(`Failed to fetch ${url}`);
  }
  return response.json();
};

const RewardScreen = () => {
  const [activeTab, setActiveTab] = useState("on_going");
  const { totalTaps } = useContext(BoostContext);
  const [rewardsData, setRewardsData] = useState({ on_going: [], claimed: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [showShareOverlay, setShowShareOverlay] = useState(false);
  const [shareReward, setShareReward] = useState(null);
  const [showCopyPopup, setShowCopyPopup] = useState(false);
  const [userStatus, setUserStatus] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
  const [pagination, setPagination] = useState({
    pageSize: 10,
    pageNumber: 1,
    hasMore: true,
  });
  const observer = useRef(null);
  const loadMoreRef = useRef(null);

  const fetchRewardsData = useCallback(
    async (status, pageNumber, append = false) => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No access token found");
        setLoading(false);
        return;
      }

      try {
        const data = await fetchWithAuth(
          `${BASE_URL}/earn/my-rewards?status=${status}&page_size=${pagination.pageSize}&page_number=${pageNumber}`,
          token
        );
        const rewards = data.rewards || data;
        const totalCount = data.total_count || rewards.length;

        const newRewards = rewards.map((reward) => ({
          ...reward,
          imageUrl: `${process.env.PUBLIC_URL}/logo.png`,
        }));

        setRewardsData((prev) => ({
          ...prev,
          [status]: append ? [...prev[status], ...newRewards] : newRewards,
        }));

        const imagePromises = newRewards.map((reward) =>
          reward.reward_image_id
            ? fetchImage(reward.reward_image_id, token, "reward_image")
            : Promise.resolve(`${process.env.PUBLIC_URL}/logo.png`)
        );
        const imageUrls = await Promise.all(imagePromises);

        setRewardsData((prev) => ({
          ...prev,
          [status]: (append ? prev[status] : []).concat(
            newRewards.map((reward, index) => ({
              ...reward,
              imageUrl: imageUrls[index],
            }))
          ),
        }));

        setPagination((prev) => ({
          ...prev,
          hasMore: rewards.length === prev.pageSize && totalCount > pageNumber * prev.pageSize,
        }));
      } catch (err) {
        if (err.message === "banned") {
          setUserStatus("banned");
        } else if (err.message === "suspended") {
          setUserStatus("suspended");
          setRemainingTime(err.cause);
        } else {
          setError(`Error fetching ${status} rewards`);
          console.error(`Error fetching ${status} rewards:`, err);
        }
      } finally {
        setLoading(false);
      }
    },
    [pagination.pageSize]
  );

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No access token found");
        setLoading(false);
        return;
      }

      try {
        await fetchWithAuth(`${BASE_URL}/user/profile`, token);
        await Promise.all([
          fetchRewardsData("on_going", 1),
          fetchRewardsData("claimed", 1),
        ]);
      } catch (err) {
        if (err.message === "banned") {
          setUserStatus("banned");
        } else if (err.message === "suspended") {
          setUserStatus("suspended");
          setRemainingTime(err.cause);
        } else {
          setError("Error fetching initial data");
          console.error("Error fetching initial data:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [fetchRewardsData]);

  useEffect(() => {
    if (!pagination.hasMore || loading) return;

    const currentObserver = observer.current;
    const handleIntersection = (entries) => {
      if (entries[0].isIntersecting) {
        setPagination((prev) => {
          const nextPage = prev.pageNumber + 1;
          fetchRewardsData(activeTab, nextPage, true);
          return { ...prev, pageNumber: nextPage };
        });
      }
    };

    observer.current = new IntersectionObserver(handleIntersection, { threshold: 0.1 });
    if (loadMoreRef.current) observer.current.observe(loadMoreRef.current);

    return () => {
      if (currentObserver) currentObserver.disconnect();
    };
  }, [activeTab, pagination.hasMore, loading, fetchRewardsData]);

  const handleTabClick = useCallback((tab) => {
    setActiveTab(tab);
    setPagination((prev) => ({ ...prev, pageNumber: 1, hasMore: true }));
    fetchRewardsData(tab, 1);
  }, [fetchRewardsData]);

  const handleClaimReward = useCallback(
    async (rewardId) => {
      const token = localStorage.getItem("accessToken");
      try {
        const result = await fetchWithAuth(
          `${BASE_URL}/earn/my-rewards/${rewardId}/claim`,
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
        if (err.message === "banned") {
          setUserStatus("banned");
        } else if (err.message === "suspended") {
          setUserStatus("suspended");
          setRemainingTime(err.cause);
        } else {
          console.error("Error claiming reward:", err);
          alert("Failed to claim reward");
        }
      }
    },
    [rewardsData]
  );

  const handleCloseOverlay = useCallback(() => {
    setShowOverlay(false);
    setSelectedReward(null);
  }, []);

  const handleShareReward = useCallback((reward) => {
    setShareReward(reward);
    setShowShareOverlay(true);
  }, []);

  const handleCloseShareOverlay = useCallback(() => {
    setShowShareOverlay(false);
    setShareReward(null);
  }, []);

  const shareLink = `https://t.me/Bored_Tap_Bot?start=reward_${shareReward?.reward_id || ""}`;
  const shareMessage = `I just claimed "${shareReward?.reward_title}" worth ${shareReward?.reward.toLocaleString()} BT Coins on Bored Tap! Join me and claim yours!`;

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
            {error && <p className="error-message">Error: {error}</p>}
            {loading && <p className="loading-message">Loading rewards...</p>}
            {rewards.length > 0 ? (
              rewards.map((reward) => (
                <div className="reward-card" key={reward.reward_id}>
                  <div className="reward-left">
                    <img
                      src={reward.imageUrl}
                      alt={reward.reward_title}
                      className="reward-icon"
                      onError={(e) => (e.target.src = `${process.env.PUBLIC_URL}/default-reward-icon.png`)}
                    />
                    <div className="reward-info">
                      <p className="reward-title">{reward.reward_title}</p>
                      <div className="reward-meta">
                        <img
                          src={`${process.env.PUBLIC_URL}/logo.png`}
                          alt="Coin Icon"
                          className="small-icon"
                        />
                        <span>Reward: {reward.reward.toLocaleString()}</span>
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
                    <div
                      className="reward-share-icon clickable"
                      style={{ backgroundColor: "#000" }}
                      onClick={() => handleShareReward(reward)}
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
              <p className="no-rewards-message">No rewards available for this category.</p>
            )}
            {pagination.hasMore && !loading && (
              <div ref={loadMoreRef} style={{ height: "20px" }} />
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
                  <span>{selectedReward.reward.toLocaleString()}</span>
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

      {showShareOverlay && shareReward && (
        <div className="overlay-backdrop">
          <div className="overlay-container4">
            <div className={`invite-overlay4 ${showShareOverlay ? "slide-in" : "slide-out"}`}>
              <div className="overlay-header4">
                <h2 className="overlay-title4">Share Reward</h2>
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
          <span className="copy-popup-text">Reward link copied</span>
        </div>
      )}

      {userStatus && (
        <BanSuspensionOverlay status={userStatus} remainingTime={remainingTime} />
      )}

      <Navigation />
    </div>
  );
};

export default RewardScreen;