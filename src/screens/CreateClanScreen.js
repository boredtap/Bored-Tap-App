import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./CreateClanScreen.css";
import { BASE_URL } from "../utils/BaseVariables";

const CreateClanScreen = () => {
  const [clanName, setClanName] = useState("");
  const [clanImage, setClanImage] = useState(null);
  const [imageName, setImageName] = useState("");
  const [eligibleMembers, setEligibleMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false); // Awaiting verification overlay
  const [showNotQualifiedOverlay, setShowNotQualifiedOverlay] = useState(false); // Not Qualified overlay
  const [showInviteOverlay, setShowInviteOverlay] = useState(false); // Invite options overlay
  const [showCopyPopup, setShowCopyPopup] = useState(false); // Copy link popup
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
        const response = await fetch(`${BASE_URL}/user/clan/my_eligible_members`, {
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
          if (response.status === 403) {
            setShowNotQualifiedOverlay(true); // Show "Not Qualified" overlay on 403
            setLoading(false);
            return;
          }
          throw new Error(`Failed to fetch eligible members: ${response.status} - ${errorText}`);
        }
        const membersData = await response.json();
        console.log("Eligible members data:", membersData);
        setEligibleMembers(membersData || []);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching eligible members:", err);
      } finally {
        if (!showNotQualifiedOverlay) setLoading(false); // Only stop loading if no overlay
      }
    };

    fetchEligibleMembers();
  }, [showNotQualifiedOverlay]);

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

    const url = `${BASE_URL}/user/clan/create_clan?name=${encodeURIComponent(clanName)}`;
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

  const handleNotQualifiedClose = () => {
    setShowNotQualifiedOverlay(false);
    navigate("/clan-screen");
  };

  const handleInviteOverlayClose = () => {
    setShowInviteOverlay(false);
  };

  const user = JSON.parse(localStorage.getItem("telegramUser")) || { telegramUserId: "" };
  const inviteLink = `https://t.me/Bored_Tap_Bot?start=${user.telegramUserId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setShowCopyPopup(true);
    setTimeout(() => setShowCopyPopup(false), 2000);
  };

  const handleTelegramShare = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(
      "Join me on Bored Tap and earn BT Coins!"
    )}`;
    window.open(telegramUrl, "_blank");
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent("Join me on Bored Tap! " + inviteLink)}`;
    window.open(whatsappUrl, "_blank");
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
                {eligibleMembers.length === 0 && !showNotQualifiedOverlay ? (
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

      {/* Awaiting Verification Overlay */}
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

      {/* Not Qualified Overlay */}
      {showNotQualifiedOverlay && (
        <div className="overlay-backdrop">
          <div className="overlay-container-not-qualified">
            <div className={`not-qualified-overlay ${showNotQualifiedOverlay ? "slide-in" : "slide-out"}`}>
              <div className="overlay-header-not-qualified">
                <h2 className="overlay-title-not-qualified">Not Qualified</h2>
                <img
                  src={`${process.env.PUBLIC_URL}/cancel.png`}
                  alt="Cancel"
                  className="overlay-cancel"
                  onClick={handleNotQualifiedClose}
                />
              </div>
              <div className="overlay-divider"></div>
              <div className="overlay-content-not-qualified">
                <img
                  src={`${process.env.PUBLIC_URL}/invite.png`}
                  alt="Invite Icon"
                  className="overlay-icon-not-qualified"
                />
                <p className="overlay-text-not-qualified">Invite Friends!</p>
                <p className="overlay-subtext-not-qualified">Invite 50 friends to create a clan</p>
                <button className="overlay-cta-not-qualified" onClick={() => setShowInviteOverlay(true)}>
                  Invite a Friend
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invite Options Overlay */}
      {showInviteOverlay && (
        <div className="overlay-backdrop">
          <div className="overlay-container-invite">
            <div className={`invite-overlay ${showInviteOverlay ? "slide-in" : "slide-out"}`}>
              <div className="overlay-header-invite">
                <h2 className="overlay-title-invite">Invite a Friend</h2>
                <img
                  src={`${process.env.PUBLIC_URL}/cancel.png`}
                  alt="Close"
                  className="overlay-cancel"
                  onClick={handleInviteOverlayClose}
                />
              </div>
              <div className="overlay-divider"></div>
              <div className="overlay-content-invite">
                <p className="overlay-text-invite">Share via:</p>
                <div className="share-options">
                  <button className="overlay-cta-button clickable" onClick={handleTelegramShare}>
                    Telegram
                  </button>
                  <button className="overlay-cta-button clickable" onClick={handleWhatsAppShare}>
                    WhatsApp
                  </button>
                  <button className="overlay-cta-button clickable" onClick={handleCopy}>
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Copy Popup */}
      {showCopyPopup && (
        <div className="copy-popup">
          <img
            src={`${process.env.PUBLIC_URL}/tick-icon.png`}
            alt="Tick Icon"
            className="copy-popup-icon"
          />
          <span className="copy-popup-text">Invite link copied</span>
        </div>
      )}

      <Navigation />
    </div>
  );
};

export default CreateClanScreen;