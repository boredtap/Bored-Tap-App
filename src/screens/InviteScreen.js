import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import "./InviteScreen.css";

const InviteScreen = () => {
  const [isOverlayVisible, setOverlayVisible] = useState(false);
  const [invites, setInvites] = useState([]);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    const fetchUserProfileAndQR = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("No access token found");
        return;
      }

      try {
        // Fetch user profile which includes invited friends
        const profileResponse = await fetch("https://bt-coins.onrender.com/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!profileResponse.ok) throw new Error("Failed to fetch profile");
        const profileData = await profileResponse.json();
        setInvites(profileData.invite || []); // Assuming 'invite' is the field in the profile for friends

        // Fetch QR code
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

  const user = JSON.parse(localStorage.getItem("telegramUser"));
  const inviteLink = `https://t.me/Bored_Tap_Bot?start=${user.telegramUserId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    alert("Invite link copied to clipboard!");
  };

  return (
    <div className="invite-screen">

      {/* Centralized Top Section */}
      <div className="invite-header">
        <img
          src={`${process.env.PUBLIC_URL}/invite.png`}
          alt="Invite Icon"
          className="invite-icon"
        />
        <p className="invite-title">Invite Friends!</p>
        <p className="invite-subtitle">You and your friend will receive BT Coins</p>
      </div>

      {/* Invite Link Section */}
      <div className="invite-link-card">
        <div className="invite-link-details">
          <p className="invite-link-title">My Invite Link:</p>
          <p className="invite-link">{inviteLink}</p>
        </div>
        <button className="reward-cta" onClick={handleCopy}>
          Copy
        </button>
      </div>

      {/* Your Friends Section */}
      <div className="your-friends-section">
        <p className="friends-title">Your Friends ({invites.length})</p>
        {invites.map((invite) => (
          <div className="friend-card" key={invite.id}>
            <img
              src={`${process.env.PUBLIC_URL}/profile-picture.png`}
              alt="Profile"
              className="friend-profile-img"
            />
            <div className="friend-details">
              <p className="friend-name">
                {invite.username || invite.name} <span className="friend-level">.Lvl {invite.level || "?"}</span>
              </p>
              {/* Assuming backend provides similar fields for each invite */}
              <div className="friend-icon-value">
                <img
                  src={`${process.env.PUBLIC_URL}/friends.png`}
                  alt="Icon"
                  className="icon-img"
                />
                <span className="icon-value">+{invite.iconValue || 0}</span>
              </div>
            </div>
            <p className="friend-bt-value">{invite.total_coins ? `${invite.total_coins} BT` : "0 BT"}</p>
          </div>
        ))}
      </div>

      {/* Full-screen Invite CTA */}
      <div className="cta-container">
        <button
          className="cta-button"
          style={{ backgroundColor: 'white', color: 'black' }}
          onClick={() => setOverlayVisible(true)}
        >
          Invite a Friend
        </button>
      </div>

      {/* Overlay */}
      {isOverlayVisible && (
        <div className="overlay">
          <div className="overlay-card">
            <div className="overlay-header">
              <p className="overlay-title">Invite a Friend</p>
              <button className="close-button" onClick={() => setOverlayVisible(false)}>
                ×
              </button>
            </div>
            <div className="division-line"></div>
            <img
              src={qrCodeUrl || `${process.env.PUBLIC_URL}/qr-code.png`}
              alt="QR Code"
              className="qr-code"
            />
            <button className="overlay-cta-button">Share</button>
            <button className="overlay-cta-button" onClick={handleCopy}>Copy</button>
          </div>
        </div>
      )}

      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default InviteScreen;