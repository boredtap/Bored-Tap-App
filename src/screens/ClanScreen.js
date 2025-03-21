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
        // Check user's clan status first
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
            }
          } else {
            setClanStatus(null);
          }
        } else {
          setClanStatus(null);
        }

        // Fetch top clans with pagination
        const params = new URLSearchParams({
          page_size: pageSize,
          page_number: page,
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
          id: clan.id || `${page}-${index}`, // Fallback ID if missing
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

  return (
    <div className="clan-screen">
      <div className="clan-header">
        <img src={`${process.env.PUBLIC_URL}/clan.png`} alt="Clan Icon" className="clan-image-icon" />
        <p className="clan-title">
          Start your <br /> clan journey
        </p>
        <div className="clan-cta-buttons">
          {clanStatus === "pending" ? (
            <>
              <button className="clan-cta inactive" onClick={handleJoinClick}>
                Join Clan
              </button>
              <p className="pending-message">Your clan is awaiting verification</p>
            </>
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

      <Navigation />
    </div>
  );
};

export default ClanScreen;