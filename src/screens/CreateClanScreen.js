import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./CreateClanScreen.css";

const CreateClanScreen = () => {
  const [clanName, setClanName] = useState("");
  const [clanImage, setClanImage] = useState(null);
  const [imageName, setImageName] = useState("");
  const [invites, setInvites] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No access token found");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("https://bt-coins.onrender.com/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error(`Failed to fetch profile: ${response.statusText}`);
        const profileData = await response.json();
        console.log("Profile data:", profileData);
        setInvites(profileData.invite || []);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setClanImage(file);
      setImageName(file.name);
    }
  };

  const clearImage = () => {
    setClanImage(null);
    setImageName("");
  };

  const toggleFriendSelection = (friendId) => {
    setSelectedFriends((prev) => {
      const newSelection = prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId];
      console.log("Selected friends after toggle:", newSelection);
      return newSelection;
    });
  };

  const selectAllFriends = () => {
    setSelectedFriends((prev) => {
      const newSelection = prev.length === invites.length ? [] : invites.map((invite) => invite.telegram_user_id);
      console.log("Selected friends after select all:", newSelection);
      return newSelection;
    });
  };

  const handleCreateClan = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("No access token found");
      return;
    }

    const formData = new FormData();
    formData.append("image", clanImage);
    selectedFriends.forEach((id) => formData.append("members", id));

    const url = `https://bt-coins.onrender.com/user/clan/create_clan?name=${encodeURIComponent(clanName)}`;
    console.log("Request URL:", url);
    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }
    console.log("Request headers:", { Authorization: `Bearer ${token}` });

    setLoading(true);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Backend error response:", errorData);
        throw new Error(JSON.stringify(errorData) || `HTTP error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Clan creation successful:", data);
      setShowOverlay(true);
    } catch (err) {
      const errorMessage = err.message.includes("Failed to fetch")
        ? "Network error: Likely a CORS issue. The server allows GET requests but blocks POST with multipart/form-data. Add CORS headers (Access-Control-Allow-Methods: POST, Access-Control-Allow-Headers: Content-Type, Authorization) on the server, or use a proxy in package.json."
        : err.message;
      setError(errorMessage);
      console.error("Fetch error details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClose = () => {
    setShowOverlay(false);
    navigate("/clan");
  };

  const isCtaActive = clanName && clanImage && selectedFriends.length > 0;

  return (
    <div className="create-clan-screen">
      <div className="create-clan-header">
        <img src={`${process.env.PUBLIC_URL}/clan.png`} alt="Clan Icon" className="clan-icon" />
        <p className="create-clan-title">Create a Clan</p>
        <p className="create-clan-subtitle">Invite friends to join your clan (1+ required for testing)</p>
      </div>

      {loading ? (
        <p className="loading-message">Loading...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        <>
          <div className="create-clan-form">
            <input
              type="text"
              placeholder="Clan Name"
              value={clanName}
              onChange={(e) => setClanName(e.target.value)}
              className="clan-input"
            />
            <div className="image-picker">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="clan-image-input"
                id="clan-image"
              />
              <label htmlFor="clan-image" className="image-label">
                {imageName || "Select Clan Image"}
                <img
                  src={`${process.env.PUBLIC_URL}/${clanImage ? "cancel.png" : "add-icon.png"}`}
                  alt={clanImage ? "Cancel" : "Add"}
                  className="picker-icon"
                  onClick={clanImage ? clearImage : null}
                />
              </label>
            </div>

            <div className="friends-header">
              <p className="friends-count">Your Friends ({invites.length})</p>
              <div className="select-all" onClick={selectAllFriends}>
                <span>Select all</span>
                <img
                  src={
                    selectedFriends.length === invites.length && invites.length > 0
                      ? `${process.env.PUBLIC_URL}/tick-icon.png`
                      : `${process.env.PUBLIC_URL}/add-icon.png`
                  }
                  alt="Select All"
                  className="select-all-icon"
                />
              </div>
            </div>

            <div className="friends-list">
              {invites.length === 0 ? (
                <p className="no-friends">No friends available.</p>
              ) : (
                invites.map((invite) => (
                  <div className="friend-card" key={invite.telegram_user_id}>
                    <img
                      src={invite.image_url || `${process.env.PUBLIC_URL}/profile-picture.png`}
                      alt={`${invite.username || "Unknown"}'s Profile`}
                      className="friend-profile-img"
                    />
                    <div className="friend-details">
                      <p className="friend-name">
                        {invite.username || "Unknown"}{" "}
                        <span className="friend-level">.Lvl {invite.level || "?"}</span>
                      </p>
                      <div className="friend-icon-value">
                        <img
                          src={`${process.env.PUBLIC_URL}/friends.png`}
                          alt="Friends Icon"
                          className="icon-img"
                        />
                        <span className="icon-value">+{invite.iconValue || 0}</span>
                      </div>
                    </div>
                    <img
                      src={
                        selectedFriends.includes(invite.telegram_user_id)
                          ? `${process.env.PUBLIC_URL}/tick-icon.png`
                          : `${process.env.PUBLIC_URL}/add-icon.png`
                      }
                      alt={selectedFriends.includes(invite.telegram_user_id) ? "Selected" : "Add"}
                      className="friend-action-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFriendSelection(invite.telegram_user_id);
                      }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="cta-container">
            <button
              className={`create-clan-cta ${isCtaActive ? "" : "inactive"}`}
              onClick={isCtaActive ? handleCreateClan : null}
              disabled={!isCtaActive}
            >
              Create a Clan
            </button>
          </div>
        </>
      )}

      {showOverlay && (
        <div className="overlay-container">
          <div className={`clan-overlay ${showOverlay ? "slide-in" : "slide-out"}`}>
            <div className="overlay-header">
              <h2 className="overlay-title">Awaiting Verification</h2>
              <img
                src={`${process.env.PUBLIC_URL}/cancel.png`}
                alt="Cancel"
                className="overlay-cancel"
                onClick={handleOverlayClose}
              />
            </div>
            <div className="overlay-divider"></div>
            <div className="overlay-content">
              <img src={`${process.env.PUBLIC_URL}/clan.png`} alt="Clan Icon" className="overlay-icon" />
              <p className="overlay-text">We’ll notify you once verification is complete</p>
              <button className="overlay-cta" onClick={handleOverlayClose}>
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <Navigation />
    </div>
  );
};

export default CreateClanScreen;