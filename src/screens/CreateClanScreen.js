import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./CreateClanScreen.css";

const CreateClanScreen = () => {
  const [clanName, setClanName] = useState("");
  const [clanImage, setClanImage] = useState(null);
  const [imageName, setImageName] = useState("");
  const [invitees, setInvitees] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvitees = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No access token found");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("https://bt-coins.onrender.com/invitees", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error(`Failed to fetch invitees: ${response.statusText}`);
        const inviteesData = await response.json();
        console.log("Invitees data:", inviteesData);
        setInvitees(inviteesData || []);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching invitees:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitees();
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
    setSelectedFriends((prev) =>
      prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]
    );
  };

  const selectAllFriends = () => {
    setSelectedFriends((prev) =>
      prev.length === invitees.length ? [] : invitees.map((invitee) => invitee.telegram_user_id)
    );
  };

  const handleCreateClan = async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setError("No access token found");
      return;
    }
    if (!clanName || !clanImage || selectedFriends.length === 0) {
      setError("Please provide a clan name, image, and at least one member.");
      return;
    }

    const formData = new FormData();
    formData.append("image", clanImage);
    selectedFriends.forEach((id) => formData.append("members", id));

    const url = `https://bt-coins.onrender.com/user/clan/create_clan?name=${encodeURIComponent(clanName)}`;
    console.log("Creating clan with URL:", url, "and data:", { selectedFriends });

    setLoading(true);
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error: ${response.status}`);
      }

      const data = await response.json();
      console.log("Clan creation response:", data);
      if (data.status === "awaiting verification") {
        localStorage.setItem("pendingClanId", data.clan_id); // Store pending clan ID
        setShowOverlay(true);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error creating clan:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClose = () => {
    setShowOverlay(false);
    navigate("/clan-screen"); // Redirect to ClanScreen post-creation per earlier flow
  };

  const isCtaActive = clanName && clanImage && selectedFriends.length > 0;

  return (
    <div className="clan-create-screen">
      <div className="create-clan-header">
        <img src={`${process.env.PUBLIC_URL}/clan.png`} alt="Clan Icon" className="clan-icon" />
        <p className="create-clan-title">Create a Clan</p>
        <p className="create-clan-subtitle">Invite friends to join your clan (1+ required)</p>
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
                  src={`${process.env.PUBLIC_URL}/${clanImage ? "cancel.png" : "pin.png"}`}
                  alt={clanImage ? "Cancel" : "Add"}
                  className="picker-icon"
                  onClick={clanImage ? clearImage : null}
                />
              </label>
            </div>

            <div className="friends-header">
              <p className="friends-count">Your Friends ({invitees.length})</p>
              <div className="select-all" onClick={selectAllFriends}>
                <span>Select all</span>
                <img
                  src={
                    selectedFriends.length === invitees.length && invitees.length > 0
                      ? `${process.env.PUBLIC_URL}/tick-icon.png`
                      : `${process.env.PUBLIC_URL}/addd.png`
                  }
                  alt="Select All"
                  className="select-all-icon"
                />
              </div>
            </div>

            <div className="friends-list-container">
              <div className="friends-list">
                {invitees.length === 0 ? (
                  <p className="no-friends">No friends available to invite.</p>
                ) : (
                  invitees.map((invitee) => (
                    <div className="friend-card" key={invitee.telegram_user_id}>
                      <img
                        src={invitee.image_url || `${process.env.PUBLIC_URL}/profile-picture.png`}
                        alt={`${invitee.username || "Unknown"}'s Profile`}
                        className="friend-profile-img"
                      />
                      <div className="friend-details">
                        <p className="friend-name">
                          {invitee.username || "Unknown"}{" "}
                          <span className="friend-level">.Lvl {invitee.level || "?"}</span>
                        </p>
                        <div className="friend-icon-value">
                          <img
                            src={`${process.env.PUBLIC_URL}/friends.png`}
                            alt="Friends Icon"
                            className="icon-img"
                          />
                          <span className="icon-value">+{invitee.invites || 0}</span>
                        </div>
                      </div>
                      <img
                        src={
                          selectedFriends.includes(invitee.telegram_user_id)
                            ? `${process.env.PUBLIC_URL}/tick-icon.png`
                            : `${process.env.PUBLIC_URL}/addd.png`
                        }
                        alt={selectedFriends.includes(invitee.telegram_user_id) ? "Selected" : "Add"}
                        className="friend-action-icon"
                        onClick={() => toggleFriendSelection(invitee.telegram_user_id)}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="cta-container">
            <button
              className={`create-clan-cta ${isCtaActive ? "" : "inactive"}`}
              onClick={isCtaActive ? handleCreateClan : null}
              disabled={!isCtaActive || loading}
            >
              {loading ? "Creating..." : "Create a Clan"}
            </button>
          </div>
        </>
      )}

      {showOverlay && (
        <div className="overlay-container3">
          <div className={`clan-overlay3 ${showOverlay ? "slide-in" : "slide-out"}`}>
            <div className="overlay-header3">
              <h2 className="overlay-title3">Awaiting Verification</h2>
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