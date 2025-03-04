import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./JoinClanScreen.css";

const JoinClanScreen = () => {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [clans, setClans] = useState([]);
  const [filteredClans, setFilteredClans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClans = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No access token found");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("https://bt-coins.onrender.com/user/clan/all_clans", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to fetch clans");
        const data = await response.json();
        setClans(Array.isArray(data) ? data : []);
        setFilteredClans(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching clans:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchClans();
  }, []);

  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = clans.filter((clan) =>
      clan.name.toLowerCase().includes(query)
    );
    setFilteredClans(filtered);
  };

  const handleClanClick = (clanId) => {
    navigate(`/clan/${clanId}`);
  };

  return (
    <div className="join-clan-screen">
      <div className="find-clan-section">
        {!isSearchActive ? (
          <>
            <p className="find-clan-title">Find a clan you like</p>
            <div
              className="search-container"
              onClick={() => setIsSearchActive(true)}
            >
              <img
                src={`${process.env.PUBLIC_URL}/search.png`}
                alt="Search Icon"
                className="search-icon"
              />
            </div>
          </>
        ) : (
          <div className="search-bar">
            <img
              src={`${process.env.PUBLIC_URL}/search.png`}
              alt="Search Icon"
              className="search-bar-icon"
            />
            <input
              type="text"
              placeholder="Search for a clan..."
              className="search-input"
              value={searchQuery}
              onChange={handleSearchChange}
              autoFocus
              onBlur={() => {
                if (!searchQuery) setIsSearchActive(false);
              }}
            />
          </div>
        )}
      </div>

      <div className="clan-cards">
        {loading ? (
          <p className="loading-message">Loading clans...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : filteredClans.length === 0 ? (
          <p className="no-clans">No clans found.</p>
        ) : (
          filteredClans.map((clan) => (
            <div
              className="clan-card"
              key={clan.id}
              onClick={() => handleClanClick(clan.id)}
            >
              <div className="clan-card-left">
                <img
                  src={clan.image_url || `${process.env.PUBLIC_URL}/default-clan.png`}
                  alt={`${clan.name} Icon`}
                  className="clan-card-icon"
                />
                <div className="clan-card-details">
                  <p className="clan-card-name">{clan.name}</p>
                  <div className="clan-card-stats">
                    <img
                      src={`${process.env.PUBLIC_URL}/logo.png`}
                      alt="Members Icon"
                      className="members-icon"
                    />
                    <span className="clan-card-members">
                      {clan.members?.toLocaleString() || "0"}
                    </span>
                  </div>
                </div>
              </div>
              <img
                src={`${process.env.PUBLIC_URL}/front-arrow.png`}
                alt="Join Icon"
                className="join-icon"
              />
            </div>
          ))
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default JoinClanScreen;