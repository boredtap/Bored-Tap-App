import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import "./InviteScreen.css";

/**
 * InviteScreen component for inviting friends and displaying invited friends list.
 * Fetches user profile and QR code, provides an invite link, and integrates sharing options.
 */
const InviteScreen = () => {
  const [isOverlayVisible, setOverlayVisible] = useState(false);
  const [invites, setInvites] = useState([]);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [showCopyPopup, setShowCopyPopup] = useState(false);

  useEffect(() => {
    const fetchUserProfileAndQR = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("No access token found");
        return;
      }

      try {
        const profileResponse = await fetch("https://bt-coins.onrender.com/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!profileResponse.ok) throw new Error("Failed to fetch profile");
        const profileData = await profileResponse.json();
        setInvites(profileData.invite || []);

        const qrResponse = await fetch("https://bt-coins.onrender.com/invite-qr-code", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (qrResponse.ok) {
          const blob = await qrResponse.blob();
          setQrCodeUrl(URL.createObjectURL(blob));
        } else {
          console.error("Failed to fetch QR code:", await qrResponse.text());
        }
      } catch (err) {
        console.error("Error fetching user profile or QR code:", err);
      }
    };
    fetchUserProfileAndQR();
  }, []);

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
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      "Join me on Bored Tap! " + inviteLink
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  const toggleOverlay = () => setOverlayVisible((prev) => !prev);

  return (
    <div className="invite-screen">
      <div className="invite-header">
        <img
          src={`${process.env.PUBLIC_URL}/invite.png`}
          alt="Invite Icon"
          className="invite-icon"
        />
        <p className="invite-title">Invite Friends!</p>
        <p className="invite-subtitle">You and your friend will receive BT Coins</p>
      </div>

      <div className="invite-link-card">
        <div className="invite-link-details">
          <p className="invite-link-title">My Invite Link:</p>
          <p className="invite-link">{inviteLink}</p>
        </div>
        <button className="reward-cta" onClick={handleCopy}>
          Copy
        </button>
      </div>

      <div className="your-friends-section">
        <p className="friends-title">Your Friends ({invites.length})</p>
        {invites.length === 0 ? (
          <p className="no-friends">No friends invited yet.</p>
        ) : (
          <div className="friends-list-container">
            <div className="friends-list">
              {invites.map((invite) => (
                <div className="friend-card" key={invite.id || invite.telegram_user_id}>
                  <img
                    src={invite.image_url || `${process.env.PUBLIC_URL}/profile-picture.png`}
                    alt={`${invite.username || "Friend"}'s Profile`}
                    className="friend-profile-img round-frame"
                  />
                  <div className="friend-details">
                    <p className="friend-name">
                      {invite.username || "Unknown"} <span className="friend-level">.Lvl {invite.level || "?"}</span>
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
                  <p className="friend-bt-value">{invite.total_coins ? `${invite.total_coins} BT` : "0 BT"}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="cta-container">
        <button className="invite-cta-button" onClick={toggleOverlay}>
          Invite a Friend
        </button>
      </div>

      {isOverlayVisible && (
        <div className="overlay-container">
          <div className={`invite-overlay ${isOverlayVisible ? "slide-in" : "slide-out"}`}>
            <div className="overlay-header">
              <h2 className="overlay-title">Invite a Friend</h2>
              <img
                src={`${process.env.PUBLIC_URL}/cancel.png`}
                alt="Close"
                className="overlay-cancel"
                onClick={toggleOverlay}
              />
            </div>
            <div className="overlay-divider"></div>
            <div className="overlay-content">
              <img
                src={qrCodeUrl || `${process.env.PUBLIC_URL}/qr-code.png`}
                alt="Invite QR Code"
                className="qr-code"
              />
              <p className="overlay-text">Share via:</p>
              <div className="share-options">
                <button className="overlay-cta-button" onClick={handleTelegramShare}>
                  Telegram
                </button>
                <button className="overlay-cta-button" onClick={handleWhatsAppShare}>
                  WhatsApp
                </button>
                <button className="overlay-cta-button" onClick={handleCopy}>
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCopyPopup && (
        <div className="copy-popup">
          <img
            src={`${process.env.PUBLIC_URL}/tick-icon.png`}
            alt="Tick Icon"
            className="copy-popup-icon"
          />
          <span className="copy-popup-text">Invite link is copied</span>
        </div>
      )}

      <Navigation />
    </div>
  );
};

export default InviteScreen;