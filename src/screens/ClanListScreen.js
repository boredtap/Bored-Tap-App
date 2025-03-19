import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./ClanListScreen.css";
import { fetchImage } from "../utils/fetchImage"; // Updated import

const ClanListScreen = () => {
  const navigate = useNavigate();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [clans, setClans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClans = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          navigate("/splash");
          return;
        }

        let url = searchQuery.trim()
          ? `https://bt-coins.onrender.com/user/clan/search?query=${encodeURIComponent(searchQuery)}`
          : "https://bt-coins.onrender.com/user/clan/all_clans";

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
        console.log("Fetched data:", data);

        const clanData = Array.isArray(data) ? data : data ? [data] : [];

        const initialClans = clanData.map((clan, index) => ({
          id: clan.id,
          name: clan.name,
          icon: `${process.env.PUBLIC_URL}/default-clan-icon.png`,
          rank: clan.rank || `#${index + 1}`,
          total_coins: clan.total_coins ? clan.total_coins.toLocaleString() : "0",
          rankIcon: `${process.env.PUBLIC_URL}/${
            index === 0 ? "first-icon.png" : index === 1 ? "second-icon.png" : index === 2 ? "third-icon.png" : "front-arrow.png"
          }`,
          image_id: clan.image_id,
        }));

        setClans(initialClans);
        setLoading(false);

        // Fetch images in parallel
        const imagePromises = initialClans.map((clan) =>
          clan.image_id
            ? fetchImage(clan.image_id, token, "clan_image", `${process.env.PUBLIC_URL}/default-clan-icon.png`)
            : Promise.resolve(`${process.env.PUBLIC_URL}/default-clan-icon.png`)
        );
        const imageUrls = await Promise.all(imagePromises);

        setClans((prev) =>
          prev.map((clan, index) => ({
            ...clan,
            icon: imageUrls[index],
          }))
        );
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error("Error fetching clans:", err.message);
      }
    };

    fetchClans();
  }, [navigate, searchQuery]);

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

      {loading ? (
        <p className="loading-message">Loading clans...</p>
      ) : error ? (
        <p className="error-message">Error: {error}</p>
      ) : clans.length > 0 ? (
        <div className="clan-cards">
          {clans.map((clan) => (
            <div className="clan-card" key={clan.id} onClick={() => handleClanClick(clan.id)}>
              <div className="clan-card-left">
                <img
                  src={clan.icon}
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
              </div>
              <img src={clan.rankIcon} alt="Rank Icon" className="join-icon" />
            </div>
          ))}
        </div>
      ) : (
        <p className="no-clans">No clans found. Try a different search or create one!</p>
      )}

      <Navigation />
    </div>
  );
};

export default ClanListScreen;