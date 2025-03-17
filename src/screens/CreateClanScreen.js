import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./CreateClanScreen.css";

const CreateClanScreen = () => {
  const [clanName, setClanName] = useState("");
  const [clanImage, setClanImage] = useState(null);
  const [imageName, setImageName] = useState("");
  const [eligibleMembers, setEligibleMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEligibleMembers = async () => {
      const token = localStorage.getItem("accessToken");
      console.log("Access token for fetchEligibleMembers:", token);
      if (!token) {
        setError("No access token found");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch("https://bt-coins.onrender.com/user/clan/my_eligible_members", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.log("Fetch eligible members failed with status:", response.status, "Response:", errorText);
          throw new Error(`Failed to fetch eligible members: ${response.status} - ${errorText}`);
        }
        const membersData = await response.json();
        console.log("Eligible members data:", membersData);
        setEligibleMembers(membersData || []);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching eligible members:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEligibleMembers();
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

  const toggleMemberSelection = (memberId) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const selectAllMembers = () => {
    setSelectedMembers((prev) =>
      prev.length === eligibleMembers.length
        ? []
        : eligibleMembers.map((member) => member.telegram_user_id || member.username)
    );
  };

  const handleCreateClan = async () => {
    const token = localStorage.getItem("accessToken");
    console.log("Access token for createClan:", token);
    if (!token) {
      setError("No access token found");
      return;
    }
    if (!clanName || !clanImage || selectedMembers.length === 0) {
      setError("Please provide a clan name, image, and at least one member.");
      return;
    }

    const formData = new FormData();
    formData.append("image", clanImage);
    selectedMembers.forEach((id) => formData.append("members", id));

    const url = `https://bt-coins.onrender.com/user/clan/create_clan?name=${encodeURIComponent(clanName)}`;
    console.log("Creating clan with URL:", url, "and data:", { selectedMembers });

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
        const errorData = await response.text();
        console.log("Clan creation failed with status:", response.status, "Response:", errorData);
        throw new Error(`HTTP error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      console.log("Clan creation response:", data);
      if (data.status === "awaiting verification") {
        localStorage.setItem("pendingClanId", data.clan_id);
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
    navigate("/clan-screen");
  };

  const isCtaActive = clanName && clanImage && selectedMembers.length > 0;

  return (
    <div className="clan-create-screen">
      <div className="create-clan-header">
        <img src={`${process.env.PUBLIC_URL}/clan.png`} alt="Clan Icon" className="clan-icon" />
        <p className="create-clan-title">Create a Clan</p>
        <p className="create-clan-subtitle">Add eligible members to your clan (1+ required)</p>
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
              <p className="friends-count">Eligible Members ({eligibleMembers.length})</p>
              <div className="select-all" onClick={selectAllMembers}>
                <span>Select all</span>
                <img
                  src={
                    selectedMembers.length === eligibleMembers.length && eligibleMembers.length > 0
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
                {eligibleMembers.length === 0 ? (
                  <p className="no-friends">No eligible members available.</p>
                ) : (
                  eligibleMembers.map((member) => (
                    <div className="friend-card" key={member.telegram_user_id || member.username}>
                      <img
                        src={member.image_url || `${process.env.PUBLIC_URL}/profile-picture.png`}
                        alt={`${member.username || "Unknown"}'s Profile`}
                        className="friend-profile-img"
                      />
                      <div className="friend-details">
                        <p className="friend-name">
                          {member.username || "Unknown"}{" "}
                          <span className="friend-level">.Lvl {member.level || "?"}</span>
                        </p>
                        <div className="friend-icon-value">
                          <img
                            src={`${process.env.PUBLIC_URL}/friends.png`}
                            alt="Friends Icon"
                            className="icon-img"
                          />
                          <span className="icon-value">+{member.invitees || 0}</span>
                        </div>
                      </div>
                      <img
                        src={
                          selectedMembers.includes(member.telegram_user_id || member.username)
                            ? `${process.env.PUBLIC_URL}/tick-icon.png`
                            : `${process.env.PUBLIC_URL}/addd.png`
                        }
                        alt={
                          selectedMembers.includes(member.telegram_user_id || member.username)
                            ? "Selected"
                            : "Add"
                        }
                        className="friend-action-icon"
                        onClick={() => toggleMemberSelection(member.telegram_user_id || member.username)}
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
        <div className="overlay-backdrop">
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
        </div>
      )}

      <Navigation />
    </div>
  );
};

export default CreateClanScreen;