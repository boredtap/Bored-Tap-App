import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./ClanScreen.css";
import { fetchImage } from "../utils/fetchImage";
import { BASE_URL } from "../utils/BaseVariables";

const ClanScreen = () => {
  const navigate = useNavigate();
  const [topClans, setTopClans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clanStatus, setClanStatus] = useState(null);
  const [clanName, setClanName] = useState(null);
  const [clanId, setClanId] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [hasTransferCandidates, setHasTransferCandidates] = useState(false);
  const [nextLeader, setNextLeader] = useState(null);
  const [overlayState, setOverlayState] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();
  const pageSize = 10;

  const lastClanElementRef = useCallback(
    (node) => {
      if (loading || !hasMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            setPageNumber((prev) => prev + 1);
          }
        },
        { threshold: 0.1 }
      );
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  const fetchClanData = useCallback(
    async (page, append = false) => {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/splash");
        return;
      }

      try {
        const myClanResponse = await fetch(`${BASE_URL}/user/clan/my_clan`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (myClanResponse.ok) {
          const myClanData = await myClanResponse.json();
          if (myClanData.id) {
            if (myClanData.status === "active") {
              navigate("/clan-details-screen");
              return;
            } else if (myClanData.status === "pending") {
              setClanStatus("pending");
              setClanName(myClanData.name || "Unnamed Clan");
              setClanId(myClanData.id);
              setIsCreator(myClanData.in_clan_rank === "creator");
            } else if (myClanData.status === "disband") {
              setClanStatus("disband");
              setClanName(myClanData.name || "Unnamed Clan");
              setClanId(myClanData.id);
              setIsCreator(myClanData.in_clan_rank === "creator");

              if (myClanData.in_clan_rank === "creator") {
                const transferResponse = await fetch(
                  `${BASE_URL}/user/clan/clan/${myClanData.id}/leadership_transfer_candidate`,
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
            }
          } else {
            setClanStatus(null);
            setClanName(null);
            setClanId(null);
            setIsCreator(false);
            setHasTransferCandidates(false);
            setNextLeader(null);
          }
        } else {
          setClanStatus(null);
          setClanName(null);
          setClanId(null);
          setIsCreator(false);
          setHasTransferCandidates(false);
          setNextLeader(null);
        }

        const params = new URLSearchParams({
          page_size: pageSize.toString(),
          page_number: page.toString(),
        });
        const url = `${BASE_URL}/user/clan/top_clans?${params.toString()}`;
        console.log("Fetching top clans from:", url);

        const topClansResponse = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!topClansResponse.ok) throw new Error("Failed to fetch top clans");
        const topClansData = await topClansResponse.json();
        console.log("Raw top clans data:", topClansData);

        if (!Array.isArray(topClansData) || topClansData.length === 0) {
          setHasMore(false);
          setLoading(false);
          return;
        }

        const newClans = topClansData.map((clan, index) => ({
          id: clan.id || `${page}-${index}`,
          name: clan.name,
          rank: clan.rank || `#${index + 1 + (page - 1) * pageSize}`,
          total_coins: clan.total_coins ? clan.total_coins.toLocaleString() : "0",
          rankIcon: `${process.env.PUBLIC_URL}/${
            index + (page - 1) * pageSize === 0
              ? "first-icon.png"
              : index + (page - 1) * pageSize === 1
              ? "second-icon.png"
              : index + (page - 1) * pageSize === 2
              ? "third-icon.png"
              : "front-arrow.png"
          }`,
          cardIcon: `${process.env.PUBLIC_URL}/logo.png`,
          image_id: clan.image_id,
        }));

        const imagePromises = newClans.map((clan) =>
          clan.image_id
            ? fetchImage(clan.image_id, token, "clan_image", `${process.env.PUBLIC_URL}/default-clan-icon.png`)
            : Promise.resolve(`${process.env.PUBLIC_URL}/default-clan-icon.png`)
        );
        const imageUrls = await Promise.all(imagePromises);

        const clansWithImages = newClans.map((clan, index) => ({
          ...clan,
          cardIcon: imageUrls[index],
        }));

        setTopClans((prev) => (append ? [...prev, ...clansWithImages] : clansWithImages));
        setHasMore(topClansData.length === pageSize);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching clan data:", err.message);
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    fetchClanData(1, false);
  }, [fetchClanData]);

  useEffect(() => {
    if (pageNumber > 1) {
      fetchClanData(pageNumber, true);
    }
  }, [pageNumber, fetchClanData]);

  const handleCreateClick = () => {
    navigate("/clan-create-screen");
  };

  const handleJoinClick = () => {
    navigate("/clan-list-screen");
  };

  const handleClanClick = (clanId) => {
    const clan = topClans.find((c) => c.id === clanId);
    navigate(`/clan-preview/${clanId}`, { state: { clan } });
  };

  const handleExitClick = () => {
    setOverlayState("confirmExit");
  };

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
      setClanStatus(null);
      setClanName(null);
      setClanId(null);
      setIsCreator(false);
      setHasTransferCandidates(false);
      setNextLeader(null);
      fetchClanData(1, false);
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

  return (
    <div className="clan-screen">
      <div className="clan-header">
        <img src={`${process.env.PUBLIC_URL}/clan.png`} alt="Clan Icon" className="clan-image-icon" />
        <p className="clan-title">
          Start your <br /> clan journey
        </p>
        {clanStatus === "disband" && clanName && (
          <p className="disband-message">The '{clanName}' has been banned</p>
        )}
        <div className="clan-cta-buttons">
          {clanStatus === "pending" ? (
            <>
              <button className="clan-cta inactive" onClick={handleJoinClick}>
                Join Clan
              </button>
              <p className="pending-message">Your clan is awaiting verification</p>
            </>
          ) : clanStatus === "disband" ? (
            <div className="exit-button1 clickable" onClick={handleExitClick}>
              {/* <img src={`${process.env.PUBLIC_URL}/exit.png`} alt="Exit Icon" className="cta-icon" /> */}
              <span>Exit</span>
            </div>
          ) : (
            <>
              <button className="clan-cta active" onClick={handleCreateClick}>
                Create New
              </button>
              <button className="clan-cta inactive" onClick={handleJoinClick}>
                Join Clan
              </button>
            </>
          )}
        </div>
      </div>

      <div className="top-clans-section">
        <p className="section-title">Top Clans</p>
        <div className="see-all" onClick={() => navigate("/clan-list-screen")}>
          <span>See all</span>
          <img
            src={`${process.env.PUBLIC_URL}/front-arrow.png`}
            alt="See All Icon"
            className="see-all-icon"
          />
        </div>
      </div>

      {loading && topClans.length === 0 ? (
        <p className="loading-message">Loading clans...</p>
      ) : error ? (
        <p className="error-message">Error: {error}</p>
      ) : topClans.length > 0 ? (
        <div className="clan-cards">
          {topClans.map((clan, index) => (
            <div
              className="clan-card2"
              key={clan.id}
              onClick={() => handleClanClick(clan.id)}
              ref={index === topClans.length - 1 ? lastClanElementRef : null}
            >
              <img
                src={clan.cardIcon}
                alt={`${clan.name} Icon`}
                className="clan-card-icon"
                loading="lazy"
                onError={(e) => (e.target.src = `${process.env.PUBLIC_URL}/default-clan-icon.png`)}
              />
              <div className="clan-card-details">
                <p className="clan-card-name">{clan.name}</p>
                <div className="clan-card-stats">
                  <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Coins Icon" className="members-icon" />
                  <span className="clan-card-members">{clan.total_coins}</span>
                </div>
              </div>
              <img src={clan.rankIcon} alt="Rank Icon" className="rank-icon" />
            </div>
          ))}
          {loading && <p className="loading-message">Loading more clans...</p>}
          {!hasMore && <p className="end-message">No more top clans to load.</p>}
        </div>
      ) : (
        <p className="no-clans-message">No top clans available yet. Be the first to create one!</p>
      )}

      {renderOverlay()}
      <Navigation />
    </div>
  );
};

export default ClanScreen;