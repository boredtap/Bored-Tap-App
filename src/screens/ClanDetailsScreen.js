// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import Navigation from "../components/Navigation";
// import "./ClanDetailsScreen.css";

// // Utility function for fetching images
// const fetchClanImage = async (imageId, token) => {
//   if (!imageId) return `${process.env.PUBLIC_URL}/default-clan-icon.png`;
//   try {
//     const response = await fetch(
//       `https://bt-coins.onrender.com/bored-tap/user_app/image?image_id=${imageId}`,
//       {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           Accept: "application/json",
//         },
//       }
//     );
//     if (!response.ok) throw new Error("Failed to fetch image");
//     const blob = await response.blob();
//     return URL.createObjectURL(blob);
//   } catch (err) {
//     console.error("Error fetching clan image:", err);
//     return `${process.env.PUBLIC_URL}/default-clan-icon.png`;
//   }
// };

// const ClanDetailsScreen = () => {
//   const navigate = useNavigate();
//   const [clanData, setClanData] = useState(() => {
//     const storedData = localStorage.getItem("clanData");
//     return storedData ? JSON.parse(storedData) : null;
//   });
//   const [error, setError] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [topEarners, setTopEarners] = useState([]);
//   const [overlayState, setOverlayState] = useState(null);
//   const [showCopyPopup, setShowCopyPopup] = useState(false);

//   useEffect(() => {
//     const fetchClanDetails = async () => {
//       try {
//         setLoading(true);
//         const token = localStorage.getItem("accessToken");
//         if (!token) {
//           navigate("/splash");
//           return;
//         }

//         const response = await fetch("https://bt-coins.onrender.com/user/clan/my_clan", {
//           method: "GET",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         });
//         if (!response.ok) throw new Error("Failed to fetch clan details");
//         const data = await response.json();
//         console.log("Raw clan data:", data);

//         const imageUrl = await fetchClanImage(data.image_id, token);

//         const updatedClanData = {
//           id: data.id,
//           icon: imageUrl,
//           name: data.name,
//           position: data.rank || "#?",
//           topIcon: `${process.env.PUBLIC_URL}/${
//             data.rank === "#1"
//               ? "first-icon.png"
//               : data.rank === "#2"
//               ? "second-icon.png"
//               : data.rank === "#3"
//               ? "third-icon.png"
//               : "default-rank.png"
//           }`,
//           ctaLeaveIcon: `${process.env.PUBLIC_URL}/exit.png`,
//           ctaInviteIcon: `${process.env.PUBLIC_URL}/invitee.png`,
//           clanCoin: data.total_coins ? data.total_coins.toLocaleString() : "0",
//           members: data.members ? data.members.toLocaleString() : "0",
//           coinIcon: `${process.env.PUBLIC_URL}/logo.png`,
//           seeAllIcon: `${process.env.PUBLIC_URL}/front-arrow.png`,
//           inClanRank: data.in_clan_rank
//             ? data.in_clan_rank.charAt(0).toUpperCase() + data.in_clan_rank.slice(1)
//             : "Member",
//         };

//         setClanData(updatedClanData);
//         localStorage.setItem("clanData", JSON.stringify(updatedClanData));

//         const topEarnersResponse = await fetch(
//           `https://bt-coins.onrender.com/user/clan/clan/${data.id}/top_earners?page_number=1&page_size=10`,
//           {
//             method: "GET",
//             headers: {
//               Authorization: `Bearer ${token}`,
//               Accept: "application/json",
//             },
//           }
//         );
//         if (!topEarnersResponse.ok) throw new Error("Failed to fetch top earners");
//         const topEarnersData = await topEarnersResponse.json();
//         setTopEarners(topEarnersData);

//         setLoading(false);
//       } catch (err) {
//         setError(err.message);
//         setLoading(false);
//         console.error("Error:", err.message);
//       }
//     };

//     fetchClanDetails();
//   }, [navigate]);

//   const handleExitClick = () => {
//     setOverlayState("confirmExit");
//   };

//   const handleInvite = () => {
//     setOverlayState("invite"); // Trigger the invite overlay
//   };

//   const handleTransferLeadership = async () => {
//     try {
//       const token = localStorage.getItem("accessToken");
//       const response = await fetch(
//         "https://bt-coins.onrender.com/user/clan/exit_clan?creator_exit_action=transfer",
//         {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//             Accept: "application/json",
//           },
//         }
//       );
//       if (!response.ok) throw new Error("Failed to transfer leadership");
//       setOverlayState("transferComplete");
//     } catch (err) {
//       console.error("Error transferring leadership:", err.message);
//     }
//   };

//   const handleCloseClan = async () => {
//     try {
//       const token = localStorage.getItem("accessToken");
//       const response = await fetch(
//         "https://bt-coins.onrender.com/user/clan/exit_clan?creator_exit_action=close",
//         {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//             Accept: "application/json",
//           },
//         }
//       );
//       if (!response.ok) throw new Error("Failed to close clan");
//       setOverlayState("closeComplete");
//     } catch (err) {
//       console.error("Error closing clan:", err.message);
//     }
//   };

//   const handleOverlayClose = () => {
//     setOverlayState(null);
//     if (overlayState === "transferComplete" || overlayState === "closeComplete") {
//       localStorage.removeItem("clanData");
//       navigate("/clan-screen");
//     }
//   };

//   // Invite link using clan ID
//   const inviteLink = clanData?.id
//     ? `https://t.me/Bored_Tap_Bot?start=clan_${clanData.id}`
//     : `https://t.me/Bored_Tap_Bot?start=clan_default`;

//   const handleTelegramShare = () => {
//     const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(
//       `Join my clan ${clanData?.name || "Unknown"} on Bored Tap!`
//     )}`;
//     window.open(telegramUrl, "_blank");
//   };

//   const handleWhatsAppShare = () => {
//     const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
//       `Join my clan ${clanData?.name || "Unknown"} on Bored Tap! ${inviteLink}`
//     )}`;
//     window.open(whatsappUrl, "_blank");
//   };

//   const handleCopy = () => {
//     navigator.clipboard.writeText(inviteLink);
//     setShowCopyPopup(true);
//     setTimeout(() => setShowCopyPopup(false), 2000);
//   };


//   const renderOverlay = () => {
//     switch (overlayState) {
//       case "confirmExit":
//         return (
//           <div className="overlay-container6">
//             <div className="streak-overlay6 slide-in">
//               <div className="overlay-header6">
//                 <h2 className="overlay-title6">Exiting Clan?</h2>
//                 <img
//                   src={`${process.env.PUBLIC_URL}/cancel.png`}
//                   alt="Close"
//                   className="overlay-cancel"
//                   onClick={handleOverlayClose}
//                 />
//               </div>
//               <div className="overlay-divider"></div>
//               <div className="overlay-content6">
//                 <img
//                   src={`${process.env.PUBLIC_URL}/exit.png`}
//                   alt="Exit Icon"
//                   className="overlay-streak-icon1"
//                 />
//                 <p className="overlay-text">Are you sure you want to exit your clan?</p>
//                 <p className="overlay-subtext">
//                   You can either transfer your title to the next top member on the clan leaderboard or choose to close your clan entirely.
//                 </p>
//                 <div className="overlay-cta-container">
//                   <button
//                     className="overlay-cta-button inactive clickable"
//                     onClick={handleTransferLeadership}
//                   >
//                     Transfer Leadership
//                   </button>
//                   <button className="overlay-cta-button active clickable" onClick={handleCloseClan}>
//                     Close
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         );
//       case "transferComplete":
//         return (
//           <div className="overlay-container8">
//             <div className="streak-overlay8 slide-in">
//               <div className="overlay-header8">
//                 <h2 className="overlay-title8">Transfer Completed</h2>
//                 <img
//                   src={`${process.env.PUBLIC_URL}/cancel.png`}
//                   alt="Close"
//                   className="overlay-cancel"
//                   onClick={handleOverlayClose}
//                 />
//               </div>
//               <div className="overlay-divider"></div>
//               <div className="overlay-content8">
//                 <img
//                   src={`${process.env.PUBLIC_URL}/transfer.gif`}
//                   alt="Transfer Icon"
//                   className="overlay-streak-icon1"
//                 />
//                 <p className="overlay-text">Clan leadership transfer is complete</p>
//                 <p className="overlay-subtext">
//                   You have transferred your title to Ridwan007 (the next in line)
//                 </p>
//                 <button className="overlay-cta-button active clickable" onClick={handleOverlayClose}>
//                   Done
//                 </button>
//               </div>
//             </div>
//           </div>
//         );
//       case "closeComplete":
//         return (
//           <div className="overlay-container8">
//             <div className="streak-overlay8 slide-in">
//               <div className="overlay-header8">
//                 <h2 className="overlay-title8">Close Clan</h2>
//                 <img
//                   src={`${process.env.PUBLIC_URL}/cancel.png`}
//                   alt="Close"
//                   className="overlay-cancel"
//                   onClick={handleOverlayClose}
//                 />
//               </div>
//               <div className="overlay-divider"></div>
//               <div className="overlay-content8">
//                 <img
//                   src={`${process.env.PUBLIC_URL}/close.gif`}
//                   alt="Close Icon"
//                   className="overlay-streak-icon1"
//                 />
//                 <p className="overlay-text">Your clan is completely closed</p>
//                 <p className="overlay-subtext">
//                   Please note: All members' clan earning will be stopped
//                 </p>
//                 <button className="overlay-cta-button active clickable" onClick={handleOverlayClose}>
//                   Got it
//                 </button>
//               </div>
//             </div>
//           </div>
//         );
//       case "invite":
//         return (
//           <div className="overlay-container8">
//             <div className="streak-overlay8 slide-in">
//               <div className="overlay-header8">
//                 <h2 className="overlay-title8">Invite a Friend</h2>
//                 <img
//                   src={`${process.env.PUBLIC_URL}/cancel.png`}
//                   alt="Close"
//                   className="overlay-cancel"
//                   onClick={handleOverlayClose}
//                 />
//               </div>
//               <div className="overlay-divider"></div>
//               <div className="overlay-content8">
//                 <p className="overlay-text">Share via:</p>
//                 <div className="share-options">
//                   <button className="overlay-cta-button clickable" onClick={handleTelegramShare}>
//                     Telegram
//                   </button>
//                   <button className="overlay-cta-button clickable" onClick={handleWhatsAppShare}>
//                     WhatsApp
//                   </button>
//                   <button className="overlay-cta-button clickable" onClick={handleCopy}>
//                     Copy Link
//                   </button>
//                 </div>
//               </div>
//             </div>
//           </div>
//         );
//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="clan-details-screen">
//       {clanData ? (
//         <>
//           <div className="clan-icon-section">
//             <img src={clanData.icon} alt="Clan Icon" className="clan-icon" />
//           </div>
//           <p className="clan-name">{clanData.name}</p>
//           <div className="clan-position">
//             <span className="position-text">{clanData.position}</span>
//             <img src={clanData.topIcon} alt="Top Icon" className="top-icon" />
//           </div>
//           <div className="clan-actions">
//             <div className="cta-button clickable" onClick={handleExitClick}>
//               <img src={clanData.ctaLeaveIcon} alt="Exit Icon" className="cta-icon" />
//               <span>Exit</span>
//             </div>
//             <div className="cta-button clickable" onClick={handleInvite}>
//               <img src={clanData.ctaInviteIcon} alt="Invite Icon" className="cta-icon" />
//               <span>Invite</span>
//             </div>
//           </div>
//           <div className="your-clan-section">
//             <p className="your-clan-text">Your Clan</p>
//           </div>
//           <div className="data-card">
//             <div className="data-row">
//               <span className="data-title">Earning</span>
//               <span className="data-value">x0.001% tapping</span>
//             </div>
//             <div className="data-row">
//               <span className="data-title">Clan Rank</span>
//               <span className="data-value">{clanData.position}</span>
//             </div>
//             <div className="data-row">
//               <span className="data-title">In-clan Rank</span>
//               <span className="data-value">{clanData.inClanRank}</span>
//             </div>
//             <div className="data-row">
//               <span className="data-title">Clan's Coin Earn</span>
//               <div className="data-value">
//                 <img src={clanData.coinIcon} alt="Coin Icon" className="coin-icon" />
//                 {clanData.clanCoin}
//               </div>
//             </div>
//             <div className="data-row">
//               <span className="data-title">Members</span>
//               <span className="data-value">{clanData.members}</span>
//             </div>
//           </div>
//           <div className="top-earners-section1">
//             <p className="top-earners-text1">Clan Top Earners</p>
//             <div className="top-earners-cards-container1">
//               {topEarners.map((earner, index) => (
//                 <div className="top-earner-card1" key={index}>
//                   <div className="top-earner-left">
//                     <img
//                       src={earner.image_url}
//                       alt={`${earner.username}'s Profile`}
//                       className="top-earner-icon round-frame"
//                     />
//                     <div className="top-earner-info">
//                       <p className="top-earner-username">
//                         {earner.username} <span className="level">.Lvl {earner.level}</span>
//                       </p>
//                       <p className="top-earner-coins">{earner.total_coins.toLocaleString()} BT Coin</p>
//                     </div>
//                   </div>
//                   <div className="top-earner-right">
//                     {index === 0 ? (
//                       <img
//                         src={`${process.env.PUBLIC_URL}/first-icon.png`}
//                         alt="1st Place"
//                         className="top-earner-right-icon"
//                       />
//                     ) : index === 1 ? (
//                       <img
//                         src={`${process.env.PUBLIC_URL}/second-icon.png`}
//                         alt="2nd Place"
//                         className="top-earner-right-icon"
//                       />
//                     ) : index === 2 ? (
//                       <img
//                         src={`${process.env.PUBLIC_URL}/third-icon.png`}
//                         alt="3rd Place"
//                         className="top-earner-right-icon"
//                       />
//                     ) : (
//                       <span className="position-number">#{index + 1}</span>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </>
//       ) : (
//         <p>No clan data available yet.</p>
//       )}
//       {loading && <p className="loading-text">Updating data...</p>}
//       {error && <p className="error-text">Error: {error}</p>}
//       {renderOverlay()}
//       {showCopyPopup && (
//         <div className="copy-popup">
//           <img
//             src={`${process.env.PUBLIC_URL}/tick-icon.png`}
//             alt="Tick Icon"
//             className="copy-popup-icon"
//           />
//           <span className="copy-popup-text">Invite link is copied</span>
//         </div>
//       )}
//       <Navigation />
//     </div>
//   );
// };

// export default ClanDetailsScreen;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./ClanDetailsScreen.css";

const fetchClanImage = async (imageId, token) => {
  if (!imageId) return `${process.env.PUBLIC_URL}/default-clan-icon.png`;
  try {
    const response = await fetch(
      `https://bt-coins.onrender.com/bored-tap/user_app/image?image_id=${imageId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      }
    );
    if (!response.ok) throw new Error("Failed to fetch image");
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error("Error fetching clan image:", err);
    return `${process.env.PUBLIC_URL}/default-clan-icon.png`;
  }
};

const ClanDetailsScreen = () => {
  const navigate = useNavigate();
  const [clanData, setClanData] = useState(() => {
    const storedData = localStorage.getItem("clanData");
    return storedData ? JSON.parse(storedData) : null;
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [topEarners, setTopEarners] = useState([]);
  const [overlayState, setOverlayState] = useState(null);
  const [isCreator, setIsCreator] = useState(false); // New state to track creator status

  useEffect(() => {
    const fetchClanDetails = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        if (!token) {
          navigate("/splash");
          return;
        }

        const response = await fetch("https://bt-coins.onrender.com/user/clan/my_clan", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to fetch clan details");
        const data = await response.json();
        console.log("Raw clan data:", data);

        const imageUrl = await fetchClanImage(data.image_id, token);

        const updatedClanData = {
          id: data.id,
          icon: imageUrl,
          name: data.name,
          position: data.rank || "#?",
          topIcon: `${process.env.PUBLIC_URL}/${
            data.rank === "#1"
              ? "first-icon.png"
              : data.rank === "#2"
              ? "second-icon.png"
              : data.rank === "#3"
              ? "third-icon.png"
              : "default-rank.png"
          }`,
          ctaLeaveIcon: `${process.env.PUBLIC_URL}/exit.png`,
          clanCoin: data.total_coins ? data.total_coins.toLocaleString() : "0",
          members: data.members ? data.members.toLocaleString() : "0",
          coinIcon: `${process.env.PUBLIC_URL}/logo.png`,
          seeAllIcon: `${process.env.PUBLIC_URL}/front-arrow.png`,
          inClanRank: data.in_clan_rank
            ? data.in_clan_rank.charAt(0).toUpperCase() + data.in_clan_rank.slice(1)
            : "Member",
        };

        setClanData(updatedClanData);
        localStorage.setItem("clanData", JSON.stringify(updatedClanData));

        // Mock check for creator status (replace with actual logic from API)
        setIsCreator(data.in_clan_rank === "creator"); // Assuming "creator" indicates ownership

        const topEarnersResponse = await fetch(
          `https://bt-coins.onrender.com/user/clan/clan/${data.id}/top_earners?page_number=1&page_size=10`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
        if (!topEarnersResponse.ok) throw new Error("Failed to fetch top earners");
        const topEarnersData = await topEarnersResponse.json();
        setTopEarners(topEarnersData);

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error("Error:", err.message);
      }
    };

    fetchClanDetails();
  }, [navigate]);

  const handleExitClick = () => {
    setOverlayState("confirmExit");
  };

  const handleTransferLeadership = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        "https://bt-coins.onrender.com/user/clan/exit_clan?creator_exit_action=transfer",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to transfer leadership");
      setOverlayState("transferComplete");
    } catch (err) {
      console.error("Error transferring leadership:", err.message);
    }
  };

  const handleCloseClan = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        "https://bt-coins.onrender.com/user/clan/exit_clan?creator_exit_action=close",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to close clan");
      setOverlayState("closeComplete");
    } catch (err) {
      console.error("Error closing clan:", err.message);
    }
  };

  const handleLeaveClan = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        "https://bt-coins.onrender.com/user/clan/exit_clan", // No creator_exit_action for regular members
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      if (!response.ok) throw new Error("Failed to leave clan");
      setOverlayState("leaveComplete");
    } catch (err) {
      console.error("Error leaving clan:", err.message);
    }
  };

  const handleOverlayClose = () => {
    setOverlayState(null);
    if (
      overlayState === "transferComplete" ||
      overlayState === "closeComplete" ||
      overlayState === "leaveComplete"
    ) {
      localStorage.removeItem("clanData");
      navigate("/clan-screen");
    }
  };

  const handleSeeAll = () => {
    navigate("/clan-top-earners", { state: { clanData, topEarners } });
  };

  const renderOverlay = () => {
    if (!overlayState) return null; // Only render backdrop when overlay is active
  
    const overlayContent = () => {
    switch (overlayState) {
      case "confirmExit":
        return isCreator ? (
          <div className="overlay-container6">
            <div className="streak-overlay6 slide-in">
              <div className="overlay-header6">
                <h2 className="overlay-title6">Exiting Clan?</h2>
                <img
                  src={`${process.env.PUBLIC_URL}/cancel.png`}
                  alt="Close"
                  className="overlay-cancel"
                  onClick={handleOverlayClose}
                />
              </div>
              <div className="overlay-divider"></div>
              <div className="overlay-content6">
                <img
                  src={`${process.env.PUBLIC_URL}/exit.png`}
                  alt="Exit Icon"
                  className="overlay-streak-icon1"
                />
                <p className="overlay-text">Are you sure you want to exit your clan?</p>
                <p className="overlay-subtext">
                  You can either transfer your title to the next top member or close your clan entirely.
                </p>
                <div className="overlay-cta-container">
                  <button
                    className="overlay-cta-button inactive clickable"
                    onClick={handleTransferLeadership}
                  >
                    Transfer Leadership
                  </button>
                  <button className="overlay-cta-button active clickable" onClick={handleCloseClan}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="overlay-container6">
            <div className="streak-overlay6 slide-in">
              <div className="overlay-header6">
                <h2 className="overlay-title6">Leave Clan?</h2>
                <img
                  src={`${process.env.PUBLIC_URL}/cancel.png`}
                  alt="Close"
                  className="overlay-cancel"
                  onClick={handleOverlayClose}
                />
              </div>
              <div className="overlay-divider"></div>
              <div className="overlay-content6">
                <img
                  src={`${process.env.PUBLIC_URL}/exit.png`}
                  alt="Exit Icon"
                  className="overlay-streak-icon1"
                />
                <p className="overlay-text">Are you sure you want to leave this clan?</p>
                <button className="overlay-cta-button active clickable" onClick={handleLeaveClan}>
                  Leave
                </button>
              </div>
            </div>
          </div>
        );
      case "transferComplete":
        return (
          <div className="overlay-container8">
            <div className="streak-overlay8 slide-in">
              <div className="overlay-header8">
                <h2 className="overlay-title8">Transfer Completed</h2>
                <img
                  src={`${process.env.PUBLIC_URL}/cancel.png`}
                  alt="Close"
                  className="overlay-cancel"
                  onClick={handleOverlayClose}
                />
              </div>
              <div className="overlay-divider"></div>
              <div className="overlay-content8">
                <img
                  src={`${process.env.PUBLIC_URL}/transfer.gif`}
                  alt="Transfer Icon"
                  className="overlay-streak-icon1"
                />
                <p className="overlay-text">Clan leadership transfer is complete</p>
                <p className="overlay-subtext">
                  You have transferred your title to Ridwan007 (the next in line)
                </p>
                <button className="overlay-cta-button active clickable" onClick={handleOverlayClose}>
                  Done
                </button>
              </div>
            </div>
          </div>
        );
      case "closeComplete":
        return (
          <div className="overlay-container8">
            <div className="streak-overlay8 slide-in">
              <div className="overlay-header8">
                <h2 className="overlay-title8">Clan Closed</h2>
                <img
                  src={`${process.env.PUBLIC_URL}/cancel.png`}
                  alt="Close"
                  className="overlay-cancel"
                  onClick={handleOverlayClose}
                />
              </div>
              <div className="overlay-divider"></div>
              <div className="overlay-content8">
                <img
                  src={`${process.env.PUBLIC_URL}/close.gif`}
                  alt="Close Icon"
                  className="overlay-streak-icon1"
                />
                <p className="overlay-text">Your clan is completely closed</p>
                <p className="overlay-subtext">
                  Please note: All members' clan earnings will be stopped
                </p>
                <button className="overlay-cta-button active clickable" onClick={handleOverlayClose}>
                  Got it
                </button>
              </div>
            </div>
          </div>
        );
      case "leaveComplete":
        return (
          <div className="overlay-container8">
            <div className="streak-overlay8 slide-in">
              <div className="overlay-header8">
                <h2 className="overlay-title8">Left Clan</h2>
                <img
                  src={`${process.env.PUBLIC_URL}/cancel.png`}
                  alt="Close"
                  className="overlay-cancel"
                  onClick={handleOverlayClose}
                />
              </div>
              <div className="overlay-divider"></div>
              <div className="overlay-content8">
                <img
                  src={`${process.env.PUBLIC_URL}/close.gif`}
                  alt="Close Icon"
                  className="overlay-streak-icon1"
                />
                <p className="overlay-text">You have left the clan</p>
                <button className="overlay-cta-button active clickable" onClick={handleOverlayClose}>
                  Got it
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="overlay-backdrop">
      {overlayContent()}
    </div>
  );
};

  

  return (
    <div className="clan-details-screen">
      {clanData ? (
        <>
          <div className="clan-icon-section">
            <img src={clanData.icon} alt="Clan Icon" className="clan-icon" />
          </div>
          <p className="clan-name">{clanData.name}</p>
          <div className="clan-position">
            <span className="position-text">{clanData.position}</span>
            <img src={clanData.topIcon} alt="Top Icon" className="top-icon" />
          </div>
          <div className="clan-actions1">
            <div className="exit-button clickable" onClick={handleExitClick}>
              <img src={clanData.ctaLeaveIcon} alt="Exit Icon" className="cta-icon" />
              <span>Exit</span>
            </div>
          </div>
          <div className="your-clan-section1">
            <p className="your-clan-text">Your Clan</p>
            <div className="data-card">
              <div className="data-row">
                <span className="data-title">Earning</span>
                <span className="data-value">x0.001% tapping</span>
              </div>
              <div className="data-row">
                <span className="data-title">Clan Rank</span>
                <span className="data-value">{clanData.position}</span>
              </div>
              <div className="data-row">
                <span className="data-title">In-clan Rank</span>
                <span className="data-value">{clanData.inClanRank}</span>
              </div>
              <div className="data-row">
                <span className="data-title">Clan's Coin Earn</span>
                <div className="data-value">
                  <img src={clanData.coinIcon} alt="Coin Icon" className="coin-icon" />
                  {clanData.clanCoin}
                </div>
              </div>
              <div className="data-row">
                <span className="data-title">Members</span>
                <span className="data-value">{clanData.members}</span>
              </div>
            </div>
          </div>
          <div className="top-earners-section2">
            <div className="top-earners-header1">
              <p className="top-earners-text">Clan Top Earners</p>
              <div className="see-all-section clickable" onClick={handleSeeAll}>
                <span className="see-all-text">See all</span>
                <img src={clanData.seeAllIcon} alt="See All Icon" className="see-all-icon" />
              </div>
            </div>
            <div className="top-earners-container">
              {topEarners.map((earner, index) => (
                <div className="top-earner-card" key={index}>
                  <div className="top-earner-left">
                    <img
                      src={earner.image_url}
                      alt={`${earner.username}'s Profile`}
                      className="top-earner-icon round-frame"
                    />
                    <div className="top-earner-info">
                      <p className="top-earner-username">
                        {earner.username} <span className="level">.Lvl {earner.level}</span>
                      </p>
                      <p className="top-earner-coins">{earner.total_coins.toLocaleString()} BT Coin</p>
                    </div>
                  </div>
                  <div className="top-earner-right">
                    {index === 0 ? (
                      <img
                        src={`${process.env.PUBLIC_URL}/first-icon.png`}
                        alt="1st Place"
                        className="top-earner-right-icon"
                      />
                    ) : index === 1 ? (
                      <img
                        src={`${process.env.PUBLIC_URL}/second-icon.png`}
                        alt="2nd Place"
                        className="top-earner-right-icon"
                      />
                    ) : index === 2 ? (
                      <img
                        src={`${process.env.PUBLIC_URL}/third-icon.png`}
                        alt="3rd Place"
                        className="top-earner-right-icon"
                      />
                    ) : (
                      <span className="position-number">#{index + 1}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <p>No clan data available yet.</p>
      )}
      {loading && <p className="loading-text">Updating data...</p>}
      {error && <p className="error-text">Error: {error}</p>}
      {renderOverlay()}
      <Navigation />
    </div>
  );
};

export default ClanDetailsScreen;

