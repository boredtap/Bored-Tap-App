import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./ClanDetailsScreen.css";
import { fetchImage } from "../utils/fetchImage";
import { BASE_URL } from "../utils/BaseVariables";

const ClanDetailsScreen = () => {
  const navigate = useNavigate();
  const [clanData, setClanData] = useState(() => {
    try {
      const storedData = localStorage.getItem("clanData");
      const parsedData = storedData ? JSON.parse(storedData) : null;
      // Validate parsed data to ensure it's an object with required fields
      if (parsedData && typeof parsedData === "object" && parsedData.id) {
        return parsedData;
      }
      localStorage.removeItem("clanData"); // Clear invalid data
      return null;
    } catch (err) {
      console.error("Error parsing clanData from localStorage:", err);
      localStorage.removeItem("clanData");
      return null;
    }
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // Set to true initially
  const [topEarners, setTopEarners] = useState([]);
  const [overlayState, setOverlayState] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [hasTransferCandidates, setHasTransferCandidates] = useState(false);
  const [nextLeader, setNextLeader] = useState(null);

  useEffect(() => {
    const fetchClanDetails = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No access token found");
        navigate("/splash");
        setLoading(false);
        return;
      }

      try {
        // Fetch clan details
        const response = await fetch(`${BASE_URL}/user/clan/my_clan`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch clan details: ${response.status}`);
        }
        const data = await response.json();

        // Validate response data
        if (!data || !data.id) {
          throw new Error("Invalid clan data received");
        }

        // Fetch clan image
        const imageUrl = await fetchImage(
          data.image_id,
          token,
          "clan_image",
          `${process.env.PUBLIC_URL}/default-clan-icon.png`
        );

        const updatedClanData = {
          id: data.id,
          icon: imageUrl,
          name: data.name || "Unnamed Clan",
          position: data.rank || "#?",
          topIcon: `${process.env.PUBLIC_URL}/${
            data.rank === "#1"
              ? "first-icon.png"
              : data.rank === "#2"
              ? "second-icon.png"
              : data.rank === "#3"
              ? "third-icon.png"
              : "default-rank.png"
          }`,
          ctaLeaveIcon: `${process.env.PUBLIC_URL}/exit.png`,
          clanCoin: data.total_coins ? data.total_coins.toLocaleString() : "0",
          members: data.members ? data.members.toLocaleString() : "0",
          coinIcon: `${process.env.PUBLIC_URL}/logo.png`,
          seeAllIcon: `${process.env.PUBLIC_URL}/front-arrow.png`,
          inClanRank: data.in_clan_rank
            ? data.in_clan_rank.charAt(0).toUpperCase() + data.in_clan_rank.slice(1)
            : "Member",
          status: data.status || "unknown", // Ensure status is set
        };

        setClanData(updatedClanData);
        localStorage.setItem("clanData", JSON.stringify(updatedClanData));
        setIsCreator(data.in_clan_rank === "creator");

        // Fetch top earners
        const topEarnersResponse = await fetch(
          `${BASE_URL}/user/clan/clan/${data.id}/top_earners?page_number=1&page_size=10`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
        if (!topEarnersResponse.ok) {
          throw new Error(`Failed to fetch top earners: ${topEarnersResponse.status}`);
        }
        const topEarnersData = await topEarnersResponse.json();
        setTopEarners(Array.isArray(topEarnersData) ? topEarnersData : []);

        // Fetch leadership transfer candidates (only for creator)
        if (data.in_clan_rank === "creator") {
          const transferResponse = await fetch(
            `${BASE_URL}/user/clan/clan/${data.id}/leadership_transfer_candidate`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
            }
          );
          if (transferResponse.ok) {
            const transferData = await transferResponse.json();
            if (transferData?.status === "success" && transferData.username) {
              setHasTransferCandidates(true);
              setNextLeader(transferData.username);
            } else {
              setHasTransferCandidates(false);
              setNextLeader(null);
            }
          } else {
            setHasTransferCandidates(false);
            setNextLeader(null);
          }
        }
      } catch (err) {
        setError(err.message || "Failed to fetch clan details");
        console.error("Error in fetchClanDetails:", err);
        setClanData(null); // Clear clanData on error
        localStorage.removeItem("clanData");
      } finally {
        setLoading(false);
      }
    };

    fetchClanDetails();
  }, [navigate]);

  const handleExitClick = () => setOverlayState("confirmExit");

  const handleTransferLeadership = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("No access token found");
      return;
    }
    try {
      const response = await fetch(
        `${BASE_URL}/user/clan/exit_clan?creator_exit_action=transfer`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to transfer leadership: ${response.status}`);
      }
      setOverlayState("transferComplete");
    } catch (err) {
      setError(err.message || "Failed to transfer leadership");
      console.error("Error transferring leadership:", err);
    }
  };

  const handleCloseClan = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("No access token found");
      return;
    }
    try {
      const response = await fetch(
        `${BASE_URL}/user/clan/exit_clan?creator_exit_action=close`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to close clan");
      }
      setOverlayState("closeComplete");
    } catch (err) {
      setError(err.message || "Failed to close clan");
      console.error("Error closing clan:", err);
    }
  };

  const handleLeaveClan = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("No access token found");
      return;
    }
    try {
      const response = await fetch(`${BASE_URL}/user/clan/exit_clan`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to leave clan");
      }
      setOverlayState("leaveComplete");
    } catch (err) {
      setError(err.message || "Failed to leave clan");
      console.error("Error leaving clan:", err);
    }
  };

  const handleOverlayClose = () => {
    setOverlayState(null);
    if (["transferComplete", "closeComplete", "leaveComplete"].includes(overlayState)) {
      localStorage.removeItem("clanData");
      navigate("/clan-screen");
    }
  };

  const handleSeeAll = () => {
    if (clanData) {
      navigate("/clan-top-earners", { state: { clanData, topEarners } });
    }
  };

  const renderOverlay = () => {
    if (!overlayState) return null;

    const overlayContent = {
      confirmExit: isCreator ? (
        <div className="overlay-container6">
          <div className="streak-overlay6 slide-in">
            <div className="overlay-header6">
              <h2 className="overlay-title6">Exiting Clan?</h2>
              <img
                src={`${process.env.PUBLIC_URL}/cancel.png`}
                alt="Close"
                className="overlay-cancel"
                onClick={handleOverlayClose}
              />
            </div>
            <div className="overlay-divider"></div>
            <div className="overlay-content6">
              <img
                src={`${process.env.PUBLIC_URL}/exit.png`}
                alt="Exit Icon"
                className="overlay-streak-icon1"
              />
              <p className="overlay-text">Are you sure you want to exit your clan?</p>
              <p className="overlay-subtext">
                {hasTransferCandidates && nextLeader
                  ? `You can transfer leadership to ${nextLeader} or close your clan entirely.`
                  : "You can close your clan entirely. No eligible leaders found."}
              </p>
              <div className="overlay-cta-container">
                <button
                  className={`overlay-cta-button ${hasTransferCandidates ? "active clickable" : "inactive"}`}
                  onClick={hasTransferCandidates ? handleTransferLeadership : null}
                  disabled={!hasTransferCandidates}
                >
                  {hasTransferCandidates && nextLeader ? `Transfer to ${nextLeader}` : "Transfer Leadership"}
                </button>
                <button className="overlay-cta-button clickable" onClick={handleCloseClan}>
                  Close Clan
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="overlay-container6">
          <div className="streak-overlay6 slide-in">
            <div className="overlay-header6">
              <h2 className="overlay-title6">Leave Clan?</h2>
              <img
                src={`${process.env.PUBLIC_URL}/cancel.png`}
                alt="Close"
                className="overlay-cancel"
                onClick={handleOverlayClose}
              />
            </div>
            <div className="overlay-divider"></div>
            <div className="overlay-content6">
              <img
                src={`${process.env.PUBLIC_URL}/exit.png`}
                alt="Exit Icon"
                className="overlay-streak-icon1"
              />
              <p className="overlay-text">Are you sure you want to leave this clan?</p>
              <button className="overlay-cta-button clickable" onClick={handleLeaveClan}>
                Leave
              </button>
            </div>
          </div>
        </div>
      ),
      transferComplete: (
        <div className="overlay-container8">
          <div className="streak-overlay8 slide-in">
            <div className="overlay-header8">
              <h2 className="overlay-title8">Transfer Completed</h2>
              <img
                src={`${process.env.PUBLIC_URL}/cancel.png`}
                alt="Close"
                className="overlay-cancel"
                onClick={handleOverlayClose}
              />
            </div>
            <div className="overlay-divider"></div>
            <div className="overlay-content8">
              <img
                src={`${process.env.PUBLIC_URL}/transfer.gif`}
                alt="Transfer Icon"
                className="overlay-streak-icon3"
              />
              <p className="overlay-text">Clan leadership transfer is complete</p>
              <p className="overlay-subtext">
                {nextLeader ? `You have transferred your title to ${nextLeader}.` : "You have transferred your title."}
              </p>
              <button className="overlay-cta-button clickable" onClick={handleOverlayClose}>
                Done
              </button>
            </div>
          </div>
        </div>
      ),
      closeComplete: (
        <div className="overlay-container8">
          <div className="streak-overlay8 slide-in">
            <div className="overlay-header8">
              <h2 className="overlay-title8">Clan Closed</h2>
              <img
                src={`${process.env.PUBLIC_URL}/cancel.png`}
                alt="Close"
                className="overlay-cancel"
                onClick={handleOverlayClose}
              />
            </div>
            <div className="overlay-divider"></div>
            <div className="overlay-content8">
              <img
                src={`${process.env.PUBLIC_URL}/close.gif`}
                alt="Close Icon"
                className="overlay-streak-icon4"
              />
              <p className="overlay-text">Your clan is completely closed</p>
              <p className="overlay-subtext">All members' clan earnings have stopped.</p>
              <button className="overlay-cta-button clickable" onClick={handleOverlayClose}>
                Got it
              </button>
            </div>
          </div>
        </div>
      ),
      leaveComplete: (
        <div className="overlay-container8">
          <div className="streak-overlay8 slide-in">
            <div className="overlay-header8">
              <h2 className="overlay-title8">Left Clan</h2>
              <img
                src={`${process.env.PUBLIC_URL}/cancel.png`}
                alt="Close"
                className="overlay-cancel"
                onClick={handleOverlayClose}
              />
            </div>
            <div className="overlay-divider"></div>
            <div className="overlay-content8">
              <img
                src={`${process.env.PUBLIC_URL}/close.gif`}
                alt="Close Icon"
                className="overlay-streak-icon2"
              />
              <p className="overlay-text">You have left the clan</p>
              <button className="overlay-cta-button clickable" onClick={handleOverlayClose}>
                Got it
              </button>
            </div>
          </div>
        </div>
      ),
    };

    return <div className="overlay-backdrop">{overlayContent[overlayState]}</div>;
  };

  if (loading) {
    return (
      <div className="clan-details-screen">
        <p className="loading-message">Loading clan details...</p>
        <Navigation />
      </div>
    );
  }

  if (error) {
    return (
      <div className="clan-details-screen">
        <p className="error-message">Error: {error}</p>
        <Navigation />
      </div>
    );
  }

  if (!clanData) {
    return (
      <div className="clan-details-screen">
        <p className="no-data-message">No clan data available. Please join or create a clan.</p>
        <Navigation />
      </div>
    );
  }

  return (
    <div className="clan-details-screen">
      <div className="clan-icon-section">
        <img
          src={clanData.icon}
          alt="Clan Icon"
          className="clan-icon"
          loading="lazy"
          onError={(e) => (e.target.src = `${process.env.PUBLIC_URL}/default-clan-icon.png`)}
        />
      </div>
      <p className="clan-name">{clanData.name}</p>
      <div className="clan-position">
        <span className="position-text">{clanData.position}</span>
        <img src={clanData.topIcon} alt="Top Icon" className="top-icon" />
      </div>
      <div className="clan-actions1">
        <div className="exit-button clickable" onClick={handleExitClick}>
          <img src={clanData.ctaLeaveIcon} alt="Exit Icon" className="cta-icon" />
          <span>Exit</span>
        </div>
      </div>
      <div className="your-clan-section1">
        <p className="your-clan-text">Your Clan</p>
        <div className="data-card">
          <div className="data-row">
            <span className="data-title">Earning</span>
            <span className="data-value">x0.001% tapping</span>
          </div>
          <div className="data-row">
            <span className="data-title">Clan Rank</span>
            <span className="data-value">{clanData.position}</span>
          </div>
          <div className="data-row">
            <span className="data-title">In-clan Rank</span>
            <span className="data-value">{clanData.inClanRank}</span>
          </div>
          <div className="data-row">
            <span className="data-title">Clan's Coin Earn</span>
            <div className="data-value">
              <img src={clanData.coinIcon} alt="Coin Icon" className="coin-icon" />
              {clanData.clanCoin}
            </div>
          </div>
          <div className="data-row">
            <span className="data-title">Members</span>
            <span className="data-value">{clanData.members}</span>
          </div>
        </div>
      </div>
      <div className="top-earners-section2">
        <div className="top-earners-header1">
          <p className="top-earners-text">Clan Top Earners</p>
          <div className="see-all-section clickable" onClick={handleSeeAll}>
            <span className="see-all-text">See all</span>
            <img src={clanData.seeAllIcon} alt="See All Icon" className="see-all-icon" />
          </div>
        </div>
        <div className="top-earners-container">
          {topEarners.length > 0 ? (
            topEarners.map((earner, index) => (
              <div className="top-earner-card" key={earner.telegram_user_id || index}>
                <div className="top-earner-left">
                  <img
                    src={earner.image_url || `${process.env.PUBLIC_URL}/default-profile-icon.png`}
                    alt={`${earner.username}'s Profile`}
                    className="top-earner-icon round-frame"
                    loading="lazy"
                    onError={(e) => (e.target.src = `${process.env.PUBLIC_URL}/default-profile-icon.png`)}
                  />
                  <div className="top-earner-info">
                    <p className="top-earner-username">
                      {earner.username || "Unknown"} <span className="level">.Lvl {earner.level || 1}</span>
                    </p>
                    <p className="top-earner-coins">{(earner.total_coins || 0).toLocaleString()} BT Coin</p>
                  </div>
                </div>
                <div className="top-earner-right">
                  {index === 0 ? (
                    <img
                      src={`${process.env.PUBLIC_URL}/first-icon.png`}
                      alt="1st Place"
                      className="top-earner-right-icon"
                    />
                  ) : index === 1 ? (
                    <img
                      src={`${process.env.PUBLIC_URL}/second-icon.png`}
                      alt="2nd Place"
                      className="top-earner-right-icon"
                    />
                  ) : index === 2 ? (
                    <img
                      src={`${process.env.PUBLIC_URL}/third-icon.png`}
                      alt="3rd Place"
                      className="top-earner-right-icon"
                    />
                  ) : (
                    <span className="position-number">#{index + 1}</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="no-data-message">No top earners available yet.</p>
          )}
        </div>
      </div>
      {renderOverlay()}
      <Navigation />
    </div>
  );
};

export default ClanDetailsScreen;