import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./ClanListScreen.css";
import { fetchImage } from "../utils/fetchImage";
import { BASE_URL } from "../utils/BaseVariables";

const ClanListScreen = () => {
  const navigate = useNavigate();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [clans, setClans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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

  const fetchClans = useCallback(
    async (page, append = false) => {
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          navigate("/splash");
          return;
        }

        // Construct URL with proper query parameters
        const params = new URLSearchParams({
          page_size: pageSize,
          page_number: page,
        });
        if (searchQuery.trim()) {
          params.append("query", searchQuery.trim());
        }

        const endpoint = searchQuery.trim() ? "search" : "all_clans";
        const url = `${BASE_URL}/user/clan/${endpoint}?${params.toString()}`;

        console.log("Fetching clans from:", url); // Debug log

        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch clans: ${response.status}`);
        }

        const data = await response.json();
        const clanData = Array.isArray(data) ? data : data ? [data] : [];

        if (clanData.length === 0) {
          setHasMore(false);
          setLoading(false);
          return;
        }

        const newClans = clanData.map((clan, index) => ({
          id: clan.id,
          name: clan.name,
          icon: `${process.env.PUBLIC_URL}/default-clan-icon.png`,
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
          icon: imageUrls[index],
        }));

        setClans((prev) => (append ? [...prev, ...clansWithImages] : clansWithImages));
        setHasMore(clanData.length === pageSize);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching clans:", err.message);
      } finally {
        setLoading(false);
      }
    },
    [navigate, searchQuery]
  );

  useEffect(() => {
    setClans([]); // Reset clans on search change
    setPageNumber(1); // Reset page
    setHasMore(true); // Reset hasMore
    fetchClans(1, false);
  }, [searchQuery, fetchClans]);

  useEffect(() => {
    if (pageNumber > 1) {
      fetchClans(pageNumber, true);
    }
  }, [pageNumber, fetchClans]);

  const handleClanClick = (clanId) => {
    const clan = clans.find((c) => c.id === clanId);
    navigate(`/clan-preview/${clanId}`, { state: { clan } });
  };

  return (
    <div className="clan-list-screen">
      <div className="find-clan-section">
        {!isSearchActive ? (
          <>
            <p className="find-clan-title">Find a clan you like</p>
            <div className="search-container" onClick={() => setIsSearchActive(true)}>
              <img src={`${process.env.PUBLIC_URL}/search.png`} alt="Search Icon" className="search-icon" />
            </div>
          </>
        ) : (
          <div className="search-bar">
            <img src={`${process.env.PUBLIC_URL}/search.png`} alt="Search Icon" className="search-bar-icon" />
            <input
              type="text"
              placeholder="Search for a clan..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <button
              className="search-close-button"
              onClick={() => {
                setSearchQuery("");
                setIsSearchActive(false);
              }}
            >
              <img src={`${process.env.PUBLIC_URL}/cancel.png`} alt="Close" className="close-icon" />
            </button>
          </div>
        )}
      </div>

      {loading && clans.length === 0 ? (
        <p className="loading-message">Loading clans...</p>
      ) : error ? (
        <p className="error-message">Error: {error}</p>
      ) : clans.length > 0 ? (
        <div className="clan-cards">
          {clans.map((clan, index) => (
            <div
              className="clan-card"
              key={clan.id}
              onClick={() => handleClanClick(clan.id)}
              ref={index === clans.length - 1 ? lastClanElementRef : null}
            >
              <div className="clan-card-left">
                <img
                  src={clan.icon}
                  alt={`${clan.name} Icon`}
                  className="clan-card-icon"
                  loading="lazy"
                  onError={(e) => (e.target.src = `${process.env.PUBLIC_URL}/logo.png`)}
                />
                <div className="clan-card-details">
                  <p className="clan-card-name">{clan.name}</p>
                  <div className="clan-card-stats">
                    <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Coins Icon" className="members-icon" />
                    <span className="clan-card-members">{clan.total_coins}</span>
                  </div>
                </div>
              </div>
              <img src={clan.rankIcon} alt="Rank Icon" className="join-icon" />
            </div>
          ))}
          {loading && <p className="loading-message">Loading more clans...</p>}
          {!hasMore && <p className="end-message">No more clans to load.</p>}
        </div>
      ) : (
        <p className="no-clans">No clans found. Try a different search or create one!</p>
      )}

      <Navigation />
    </div>
  );
};

export default ClanListScreen;