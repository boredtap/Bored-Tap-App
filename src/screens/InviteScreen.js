// import React, { useState } from "react";
// import Navigation from "../components/Navigation";
// import "./InviteScreen.css";

// const InviteScreen = () => {
//   const [isOverlayVisible, setOverlayVisible] = useState(false);

//   const friendsData = [
//     { id: 1, name: "Ridwan007", level: "Lvl 10", btCoin: "161,832 BT", iconValue: 0 },
//     { id: 2, name: "Tobi008", level: "Lvl 8", btCoin: "132,050 BT", iconValue: 5 },
//     { id: 3, name: "AdaDev12", level: "Lvl 12", btCoin: "245,500 BT", iconValue: 10 },
//     { id: 4, name: "John001", level: "Lvl 6", btCoin: "75,600 BT", iconValue: 3 },
//     { id: 5, name: "Blessing10", level: "Lvl 15", btCoin: "320,000 BT", iconValue: 8 },
//   ];

//   const inviteLink = "https://t.me/boredtap_bot?start=r_18374398";

//   const handleCopy = () => {
//     navigator.clipboard.writeText(inviteLink);
//     alert("Invite link copied to clipboard!");
//   };

//   return (
//     <div className="invite-screen">

//       {/* Centralized Top Section */}
//       <div className="invite-header">
//         <img
//           src={`${process.env.PUBLIC_URL}/invite.png`}
//           alt="Invite Icon"
//           className="invite-icon"
//         />
//         <p className="invite-title">Invite Friends!</p>
//         <p className="invite-subtitle">You and your friend will receive BT Coins</p>
//       </div>

//       {/* Invite Link Section */}
//       <div className="invite-link-card">
//         <div className="invite-link-details">
//           <p className="invite-link-title">My Invite Link:</p>
//           <p className="invite-link">{inviteLink}</p>
//         </div>
//         <button className="reward-cta" onClick={handleCopy}>
//           Copy
//         </button>
//       </div>

//       {/* Your Friends Section */}
//       <div className="your-friends-section">
//         <p className="friends-title">Your Friends (6)</p>
//         {friendsData.map((friend) => (
//           <div className="friend-card" key={friend.id}>
//             <img
//               src={`${process.env.PUBLIC_URL}/profile-picture.png`}
//               alt="Profile"
//               className="friend-profile-img"
//             />
//             <div className="friend-details">
//               <p className="friend-name">
//                 {friend.name} <span className="friend-level">{friend.level}</span>
//               </p>
//               <div className="friend-icon-value">
//                 <img
//                   src={`${process.env.PUBLIC_URL}/friends.png`}
//                   alt="Icon"
//                   className="icon-img"
//                 />
//                 <span className="icon-value">+{friend.iconValue}</span>
//               </div>
//             </div>
//             <p className="friend-bt-value">{friend.btCoin}</p>
//           </div>
//         ))}
//       </div>

//       {/* Full-screen Invite CTA */}
//       <div className="cta-container">
//         <button
//           className="cta-button"
//           onClick={() => setOverlayVisible(true)}
//         >
//           Invite a Friend
//         </button>
//       </div>

//       {/* Overlay */}
//       {isOverlayVisible && (
//         <div className="overlay">
//           <div className="overlay-card">
//             <div className="overlay-header">
//               <p className="overlay-title">Invite a Friend</p>
//               <button className="close-button" onClick={() => setOverlayVisible(false)}>
//                 &times;
//               </button>
//             </div>
//             <div className="division-line"></div>
//             <img
//               src={`${process.env.PUBLIC_URL}/qr-code.png`}
//               alt="QR Code"
//               className="qr-code"
//             />
//             <button className="overlay-cta-button">Share</button>
//             <button className="overlay-cta-button" onClick={handleCopy}>Copy</button>
//           </div>
//         </div>
//       )}

//       {/* Navigation */}
//       <Navigation />
//     </div>
//   );
// };

// export default InviteScreen;
import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import "./InviteScreen.css";

const InviteScreen = () => {
  const [isOverlayVisible, setOverlayVisible] = useState(false);
  const [invites, setInvites] = useState([]);
  const [qrCodeUrl, setQrCodeUrl] = useState("");

  useEffect(() => {
    const fetchInvites = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const response = await fetch("https://bored-tap-api.onrender.com/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to fetch friends");
        const data = await response.json();
        setInvites(data.invites || []);
      } catch (err) {
        console.error("Error fetching friends:", err);
      }
    };

    const fetchQrCode = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const response = await fetch("https://bored-tap-api.onrender.com/invite-qr-code", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const blob = await response.blob();
          setQrCodeUrl(URL.createObjectURL(blob));
        } else {
          console.error("Failed to fetch QR code:", await response.text());
        }
      } catch (err) {
        console.error("Error fetching QR code:", err);
      }
    };

    fetchInvites();
    fetchQrCode();
  }, []);

  const user = JSON.parse(localStorage.getItem("telegramUser"));
  const inviteLink = `http://t.me/Bored_Tap_Bot?start=${user.telegramUserId}`;

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
                {invite.name} <span className="friend-level">{invite.level}</span>
              </p>
              <div className="friend-icon-value">
                <img
                  src={`${process.env.PUBLIC_URL}/friends.png`}
                  alt="Icon"
                  className="icon-img"
                />
                <span className="icon-value">+{invite.iconValue}</span>
              </div>
            </div>
            <p className="friend-bt-value">{invite.btCoin}</p>
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