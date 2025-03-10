import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./ClanListScreen.css";
import { fetchClanImage } from "../utils/fetchImage"; // Adjust path if needed

const ClanListScreen = () => {
  const navigate = useNavigate();
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [clans, setClans] = useState([]);
  const [filteredClans, setFilteredClans] = useState([]);
  const [loading, setLoading] = useState(true);
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

        const response = await fetch("https://bt-coins.onrender.com/user/clan/all_clans", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to fetch clans");
        const clansData = await response.json();
        console.log("Raw clans data:", clansData); // Debug log

        // Map clans with image fetching
        const mappedClans = await Promise.all(
          clansData.map(async (clan, index) => {
            const imageUrl = await fetchClanImage(clan.image_id, token); // Fetch image
            return {
              id: clan.id,
              name: clan.name,
              icon: imageUrl, // Use fetched image URL
              rank: clan.rank || `#${index + 1}`,
              total_coins: clan.total_coins ? clan.total_coins.toLocaleString() : "0", // Total coins earned
              rankIcon: `${process.env.PUBLIC_URL}/${
                index === 0 ? "first-icon.png" : index === 1 ? "second-icon.png" : index === 2 ? "third-icon.png" : "front-arrow.png"
              }`,
            };
          })
        );

        setClans(mappedClans);
        setFilteredClans(mappedClans);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error("Error fetching clans:", err.message);
      }
    };

    fetchClans();
  }, [navigate]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredClans(clans);
    } else {
      const filtered = clans.filter((clan) =>
        clan.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredClans(filtered);
    }
  }, [searchQuery, clans]);

  const handleClanClick = (clanId) => {
    const clan = filteredClans.find((c) => c.id === clanId);
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
              onBlur={() => setIsSearchActive(false)}
            />
          </div>
        )}
      </div>

      {loading ? (
        <p className="loading-message">Loading clans...</p>
      ) : error ? (
        <p className="error-message">Error: {error}</p>
      ) : filteredClans.length > 0 ? (
        <div className="clan-cards">
          {filteredClans.map((clan) => (
            <div className="clan-card" key={clan.id} onClick={() => handleClanClick(clan.id)}>
              <div className="clan-card-left">
                <img src={clan.icon} alt={`${clan.name} Icon`} className="clan-card-icon" />
                <div className="clan-card-details">
                  <p className="clan-card-name">{clan.name}</p>
                  <div className="clan-card-stats">
                    <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Members Icon" className="members-icon" />
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