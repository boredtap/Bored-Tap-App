// import React, { useState, useEffect, useRef } from "react";
// import Navigation from "../components/Navigation";
// import CTAButton from "../components/CTAButton";
// import "./DailyStreakScreen.css";
// import { BASE_URL } from "../utils/BaseVariables"; // Import BASE_URL

// const RewardFrame = ({ day, reward, isActive, isClaimed, onClick }) => {
//   return (
//     <div
//       className={`reward-frame ${isActive ? "active" : ""} ${isClaimed ? "claimed" : ""}`}
//       onClick={isActive && !isClaimed ? onClick : undefined}
//       style={isActive && !isClaimed ? { cursor: "pointer" } : { cursor: "not-allowed" }}
//     >
//       <p className="frame-day">{day}</p>
//       <img
//         src={isClaimed ? `${process.env.PUBLIC_URL}/tick.png` : `${process.env.PUBLIC_URL}/logo.png`}
//         alt={isClaimed ? "Claimed" : "Reward"}
//         className="frame-icon"
//       />
//       <p className="frame-reward">{reward}</p>
//     </div>
//   );
// };

// const DailyStreakScreen = () => {
//   const [currentDay, setCurrentDay] = useState(() => {
//     return parseInt(localStorage.getItem("currentDay")) || 1;
//   });
//   const [claimedDays, setClaimedDays] = useState(() => {
//     return JSON.parse(localStorage.getItem("claimedDays")) || [];
//   });
//   const [profile, setProfile] = useState(null);
//   const [showOverlay, setShowOverlay] = useState(true);
//   const [countdownTime, setCountdownTime] = useState(() => {
//     return localStorage.getItem("countdownTime") || "23:59:59";
//   });
//   const [showClaimMessage, setShowClaimMessage] = useState(false);
//   const [ctaButtonText, setCtaButtonText] = useState(() => {
//     return localStorage.getItem("ctaButtonText") || "Claim Reward";
//   });
//   const rewards = [
//     { day: "Day 1", reward: "500" },
//     { day: "Day 2", reward: "1000" },
//     { day: "Day 3", reward: "1500" },
//     { day: "Day 4", reward: "2000" },
//     { day: "Day 5", reward: "2500" },
//     { day: "Day 6", reward: "3000" },
//     { day: "Day 7", reward: "3500" },
//     { day: "Ultimate", reward: "5000" },
//   ];
//   const ctaButtonRef = useRef(null);
//   const isClaimed = claimedDays.includes(currentDay);

//   // Countdown timer effect
//   useEffect(() => {
//     if (ctaButtonText === "Come Back Tomorrow") {
//       const timer = setInterval(() => {
//         const [hours, minutes, seconds] = countdownTime.split(":").map(Number);
//         let totalSeconds = hours * 3600 + minutes * 60 + seconds;

//         if (totalSeconds > 0) {
//           totalSeconds--;
//           const newHours = Math.floor(totalSeconds / 3600);
//           const newMinutes = Math.floor((totalSeconds % 3600) / 60);
//           const newSeconds = totalSeconds % 60;
//           const newTime = `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}:${String(newSeconds).padStart(2, "0")}`;
//           setCountdownTime(newTime);
//           localStorage.setItem("countdownTime", newTime);
//         } else {
//           clearInterval(timer);
//           setCtaButtonText("Claim Reward");
//           localStorage.setItem("ctaButtonText", "Claim Reward");
//           setCountdownTime("23:59:59");
//           localStorage.setItem("countdownTime", "23:59:59");
//         }
//       }, 1000);

//       return () => clearInterval(timer);
//     }
//   }, [countdownTime, ctaButtonText]);

//   const resetStreakState = () => {
//     setCurrentDay(1);
//     setClaimedDays([]);
//     setShowClaimMessage(false);
//     setCtaButtonText("Claim Reward");
//     setCountdownTime("23:59:59");
//     localStorage.removeItem("currentDay");
//     localStorage.removeItem("claimedDays");
//     localStorage.setItem("ctaButtonText", "Claim Reward");
//     localStorage.setItem("countdownTime", "23:59:59");
//   };

//   useEffect(() => {
//     const fetchProfile = async () => {
//       const token = localStorage.getItem("accessToken");
//       if (!token) {
//         resetStreakState();
//         return;
//       }

//       try {
//         const response = await fetch(`${BASE_URL}/user/profile`, {
//           method: "GET",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         });

//         if (!response.ok) {
//           if (response.status === 401 || response.status === 403) {
//             localStorage.removeItem("accessToken");
//             resetStreakState();
//           }
//           throw new Error("Failed to fetch profile");
//         }

//         const data = await response.json();
//         setProfile(data);

//         const storedClaimedDays = JSON.parse(localStorage.getItem("claimedDays")) || [];
//         const backendClaimedDays = data.streak?.claimed_days || [];
//         const backendLastClaimedDay = Math.max(...backendClaimedDays, 0);

//         if (storedClaimedDays.length <= backendClaimedDays.length) {
//           setClaimedDays(backendClaimedDays);
//           setCurrentDay(backendLastClaimedDay + 1);
//           localStorage.setItem("claimedDays", JSON.stringify(backendClaimedDays));
//           localStorage.setItem("currentDay", backendLastClaimedDay + 1);
//         }

//         if (!data.streak || (data.streak.current_streak === 0 && backendClaimedDays.length === 0)) {
//           resetStreakState();
//         }
//       } catch (err) {
//         console.error("Error fetching profile:", err);
//       }
//     };

//     fetchProfile();
//   }, []);

//   const handleClaim = async () => {
//     const isLastDay = currentDay === rewards.length;
//     if (!claimedDays.includes(currentDay)) {
//       try {
//         const token = localStorage.getItem("accessToken");
//         if (!token) {
//           console.error("No access token found");
//           return;
//         }
//         const response = await fetch(`${BASE_URL}/perform-streak`, {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify({ telegram_user_id: profile?.telegram_user_id }),
//         });
//         if (!response.ok) throw new Error("Failed to claim reward");
//         const streakData = await response.json();

//         if (streakData.message === "Streak not updated") {
//           const timeMatch = streakData.Count.match(/(\d{2} hrs:\d{2} mins:\d{2} secs)/);
//           const time = timeMatch ? timeMatch[0].replace(/ hrs| mins| secs/g, "") : "23:59:59";
//           setCountdownTime(time);
//           localStorage.setItem("countdownTime", time);
//           setShowOverlay(true);
//           return;
//         }

//         const newClaimedDays = [...claimedDays, currentDay];
//         let newCurrentDay = currentDay + 1;
//         if (isLastDay) {
//           newCurrentDay = currentDay + 1;
//         }
//         localStorage.setItem("claimedDays", JSON.stringify(newClaimedDays));
//         localStorage.setItem("currentDay", newCurrentDay);
//         localStorage.setItem("ctaButtonText", "Come Back Tomorrow");
//         localStorage.setItem("countdownTime", "23:59:59");

//         setClaimedDays(newClaimedDays);
//         setCurrentDay(newCurrentDay);
//         setCtaButtonText("Come Back Tomorrow");
//         setCountdownTime("23:59:59");
//         setShowClaimMessage(true);

//         setProfile((prev) => ({
//           ...prev,
//           total_coins: streakData.total_coins || prev.total_coins,
//           streak: {
//             ...prev.streak,
//             current_streak: streakData.current_streak,
//             longest_streak: streakData.longest_streak,
//             claimed_days: newClaimedDays,
//           },
//         }));
//       } catch (err) {
//         console.error("Error claiming reward:", err);
//         setShowOverlay(true);
//       }
//     }
//   };

//   const handleCloseOverlay = () => setShowOverlay(false);

//   return (
//     <div className="daily-streak-screen">
//       <div className="streak-header">
//         <img
//           src={`${process.env.PUBLIC_URL}/streak.png`}
//           alt="Streak Icon"
//           className="streak-icon-big"
//         />
//         <p className="streak-title">Streak Calendar</p>
//         <p className="streak-subtitle">Claim your daily bonuses!</p>
//       </div>

//       <div className="daily-rewards">
//         <p className="daily-rewards-title">Daily Rewards</p>
//         <div className="rewards-grid">
//           {rewards.map((reward, index) => {
//             const displayedDay = index + 1;
//             return (
//               <RewardFrame
//                 key={displayedDay}
//                 day={displayedDay === rewards.length ? "Ultimate" : `Day ${displayedDay}`}
//                 reward={reward.reward}
//                 isActive={displayedDay === currentDay}
//                 isClaimed={claimedDays.includes(displayedDay)}
//                 onClick={handleClaim}
//               />
//             );
//           })}
//         </div>
//         {showClaimMessage && (
//           <p className="rewards-note">Come back in {countdownTime} for your next reward</p>
//         )}
//       </div>

//       <div className="cta-container clickable">
//         <CTAButton
//           ref={ctaButtonRef}
//           isActive={!isClaimed && ctaButtonText === "Claim Reward"}
//           text={ctaButtonText}
//           onClick={handleClaim}
//         />
//       </div>

//       {showOverlay && (
//         <div className="overlay-container6">
//           <div className={`streak-overlay6 ${showOverlay ? "slide-in" : "slide-out"}`}>
//             <div className="overlay-header6">
//               <h2 className="overlay-title6">Daily Streak</h2>
//               <img
//                 src={`${process.env.PUBLIC_URL}/cancel.png`}
//                 alt="Close"
//                 className="overlay-cancel"
//                 onClick={handleCloseOverlay}
//               />
//             </div>
//             <div className="overlay-divider"></div>
//             <div className="overlay-content6">
//               <img
//                 src={`${process.env.PUBLIC_URL}/streak.png`}
//                 alt="Streak Icon"
//                 className="overlay-streak-icon"
//               />
//               <p className="overlay-text">Streak Not Updated</p>
//               <p className="overlay-subtext">Check again in</p>
//               <p className="overlay-time">{countdownTime}</p>
//               <button className="overlay-cta-button clickable" onClick={handleCloseOverlay}>
//                 Ok
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       <Navigation />
//     </div>
//   );
// };

// export default DailyStreakScreen;


import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import CTAButton from "../components/CTAButton";
import "./DailyStreakScreen.css";
import { BASE_URL } from "../utils/BaseVariables";

const RewardFrame = ({ day, reward, isActive, isClaimed, onClick, onInvalidClick }) => {
  return (
    <div
      className={`reward-frame ${isActive ? "active" : ""} ${isClaimed ? "claimed" : ""}`}
      onClick={isActive && !isClaimed ? onClick : onInvalidClick}
      style={isActive && !isClaimed ? { cursor: "pointer" } : { cursor: isClaimed ? "not-allowed" : "pointer" }}
    >
      <p className="frame-day">{day}</p>
      <img
        src={isClaimed ? `${process.env.PUBLIC_URL}/tick.png` : `${process.env.PUBLIC_URL}/logo.png`}
        alt={isClaimed ? "Claimed" : "Reward"}
        className="frame-icon"
      />
      <p className="frame-reward">{reward}</p>
    </div>
  );
};

const DailyStreakScreen = () => {
  const [streakData, setStreakData] = useState(() => {
    const savedData = localStorage.getItem("streakData");
    return savedData
      ? JSON.parse(savedData)
      : {
          current_streak: 0,
          claimed_days: [],
          last_action_date: null,
          can_claim: true,
          countdown_time: null,
          userSignature: null, // Add userSignature field
        };
  });
  const [showOverlay, setShowOverlay] = useState(false);
  const [countdownDisplay, setCountdownDisplay] = useState(null);
  const rewards = [
    { day: "Day 1", reward: "500" },
    { day: "Day 2", reward: "1000" },
    { day: "Day 3", reward: "1500" },
    { day: "Day 4", reward: "2000" },
    { day: "Day 5", reward: "2500" },
    { day: "Day 6", reward: "3000" },
    { day: "Day 7", reward: "3500" },
    { day: "Ultimate", reward: "5000" },
  ];

  // Create or retrieve userSignature on component mount
  useEffect(() => {
    // Generate a userSignature if it doesn't exist
    if (!streakData.userSignature) {
      const newSignature = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setStreakData(prev => ({
        ...prev,
        userSignature: newSignature
      }));
    }
  }, []);

  // Save streakData to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("streakData", JSON.stringify(streakData));
  }, [streakData]);

  // Initialize countdownDisplay with existing countdown time
  useEffect(() => {
    if (streakData.countdown_time) {
      setCountdownDisplay(streakData.countdown_time);
    }
  }, []);

  // Fetch streak status and handle fresh accounts
  useEffect(() => {
    const fetchStreakStatus = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        localStorage.removeItem("streakData");
        setStreakData({
          current_streak: 0,
          claimed_days: [],
          last_action_date: null,
          can_claim: true,
          countdown_time: null,
          userSignature: null, // Reset user signature on logout
        });
        setCountdownDisplay(null);
        return;
      }

      try {
        // First, check if the user signature needs to be registered or verified
        // We'll send the current userSignature to the backend
        const userSignature = streakData.userSignature || 
                             `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Modify the request to include userSignature
        const response = await fetch(`${BASE_URL}/streak/status`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "X-User-Signature": userSignature, // Send signature in header
          },
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("streakData");
            setStreakData({
              current_streak: 0,
              claimed_days: [],
              last_action_date: null,
              can_claim: true,
              countdown_time: null,
              userSignature: null,
            });
            setCountdownDisplay(null);
          }
          throw new Error("Failed to fetch streak status");
        }

        const data = await response.json();
        
        // Check if the backend indicates this is a new account or signature mismatch
        // The backend would need to add a field like 'isNewSignature' to the response
        const isNewUser = data.isNewSignature === true;
        
        // If backend doesn't support signature verification yet, we can implement a
        // fallback mechanism by checking if the JWT is newer than our stored data
        const jwtIssuedAt = getJwtIssuedTimestamp(token);
        const lastKnownJwtIssueTime = localStorage.getItem('lastKnownJwtIssueTime');
        
        // If JWT is newer and there's a significant time gap, treat as new user
        const jwtIndicatesNewUser = lastKnownJwtIssueTime && 
                                   jwtIssuedAt - parseInt(lastKnownJwtIssueTime, 10) > 300000; // 5 minutes
        
        // Update the last known JWT issue time
        if (jwtIssuedAt) {
          localStorage.setItem('lastKnownJwtIssueTime', jwtIssuedAt.toString());
        }
        
        // If this is a new user (either by backend indication or JWT timing),
        // reset the streak completely
        if (isNewUser || jwtIndicatesNewUser) {
          const resetData = {
            current_streak: 0,
            claimed_days: [],
            last_action_date: null,
            can_claim: true,
            countdown_time: null,
            userSignature: userSignature, // Keep the current signature
          };
          setStreakData(resetData);
          localStorage.setItem("streakData", JSON.stringify(resetData));
          setCountdownDisplay(null);
          
          // Send a registration request for the new signature if needed
          // This would be a POST request to register the new signature
          try {
            await fetch(`${BASE_URL}/register-signature`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ userSignature }),
            });
          } catch (signatureErr) {
            console.error("Error registering user signature:", signatureErr);
            // Non-critical error, can continue
          }
          
          return;
        }

        const lastActionDate = data.last_action_date ? new Date(data.last_action_date) : null;
        const now = new Date();
        
        // Preserve local state for claimed days and countdown
        let localClaimedDays = streakData.claimed_days || [];
        let localCanClaim = streakData.can_claim;
        let localCountdownTime = streakData.countdown_time;

        // Get backend claimed days (convert 0 to 8 for Ultimate)
        const backendClaimedDays = data.claimed_days
          ? data.claimed_days.map((day) => (day === 0 ? 8 : day))
          : [];

        // Determine which claimed days to use
        // Priority: backend days if non-empty, otherwise keep local days
        const claimedDays = backendClaimedDays.length > 0 ? backendClaimedDays : localClaimedDays;

        // Check if account is fresh (complete reset scenario)
        const isFreshAccount = backendClaimedDays.length === 0 && 
                              data.current_streak === 0 && 
                              !data.last_action_date &&
                              (!streakData.claimed_days || streakData.claimed_days.length === 0);
                              
        if (isFreshAccount) {
          // Fresh account - reset everything
          const resetData = {
            current_streak: 0,
            claimed_days: [],
            last_action_date: null,
            can_claim: true,
            countdown_time: null,
            userSignature: userSignature, // Keep the current signature
          };
          setStreakData(resetData);
          localStorage.setItem("streakData", JSON.stringify(resetData));
          setCountdownDisplay(null);
          return;
        }

        // Check if user missed a day
        if (lastActionDate) {
          const timeDiff = now - lastActionDate;
          if (timeDiff > 24 * 60 * 60 * 1000) {
            // Missed a day, reset streak
            const resetData = {
              current_streak: 0,
              claimed_days: [],
              last_action_date: null,
              can_claim: true,
              countdown_time: null,
              userSignature: userSignature, // Keep the current signature
            };
            setStreakData(resetData);
            localStorage.setItem("streakData", JSON.stringify(resetData));
            setCountdownDisplay(null);
            return;
          } else if (timeDiff < 24 * 60 * 60 * 1000) {
            // User has claimed today - ensure countdown is set
            const nextClaimTime = new Date(lastActionDate.getTime() + 24 * 60 * 60 * 1000);
            const remainingMs = nextClaimTime - now;
            
            if (remainingMs > 0) {
              localCanClaim = false;
              const hours = Math.floor(remainingMs / 3600000);
              const minutes = Math.floor((remainingMs % 3600000) / 60000);
              const seconds = Math.floor((remainingMs % 60000) / 1000);
              localCountdownTime = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
            } else {
              // Time's up, can claim next reward
              localCanClaim = true;
              localCountdownTime = null;
            }
          }
        }

        // Update streak data, preserving local claimed_days if backend is empty
        const newStreakData = {
          current_streak: data.current_streak !== undefined ? data.current_streak : streakData.current_streak,
          claimed_days: claimedDays,
          last_action_date: data.last_action_date || streakData.last_action_date,
          can_claim: localCanClaim,
          countdown_time: localCountdownTime,
          userSignature: userSignature, // Keep the current signature
        };

        setStreakData(newStreakData);
        localStorage.setItem("streakData", JSON.stringify(newStreakData));
        setCountdownDisplay(localCountdownTime);
      } catch (err) {
        console.error("Error fetching streak status:", err);
        // Keep localStorage data
        setStreakData((prev) => ({ ...prev }));
      }
    };

    fetchStreakStatus();
  }, []);

  // Helper function to extract JWT issued timestamp
  const getJwtIssuedTimestamp = (token) => {
    try {
      // JWT consists of three parts: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      // Decode the payload (middle part)
      const payload = JSON.parse(atob(parts[1]));
      
      // Return the 'iat' (issued at) claim if it exists
      return payload.iat ? payload.iat * 1000 : null; // Convert to milliseconds
    } catch (e) {
      console.error("Error parsing JWT:", e);
      return null;
    }
  };

  // Update countdown timer
  useEffect(() => {
    if (streakData.countdown_time) {
      const timer = setInterval(() => {
        const [hours, minutes, seconds] = streakData.countdown_time.split(":").map(Number);
        let totalSeconds = hours * 3600 + minutes * 60 + seconds;

        if (totalSeconds > 0) {
          totalSeconds--;
          const newHours = Math.floor(totalSeconds / 3600);
          const newMinutes = Math.floor((totalSeconds % 3600) / 60);
          const newSeconds = totalSeconds % 60;
          const newTime = `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}:${String(newSeconds).padStart(2, "0")}`;
          
          // Update both the streakData state and the display state
          setStreakData((prev) => ({ ...prev, countdown_time: newTime }));
          setCountdownDisplay(newTime);
          
          // Also update localStorage to ensure persistence across refreshes
          const currentData = JSON.parse(localStorage.getItem("streakData") || "{}");
          localStorage.setItem("streakData", JSON.stringify({
            ...currentData,
            countdown_time: newTime
          }));
        } else {
          clearInterval(timer);
          // Time's up - update states and localStorage
          setStreakData((prev) => ({
            ...prev,
            can_claim: true,
            countdown_time: null,
          }));
          setCountdownDisplay(null);
          
          const currentData = JSON.parse(localStorage.getItem("streakData") || "{}");
          localStorage.setItem("streakData", JSON.stringify({
            ...currentData,
            can_claim: true,
            countdown_time: null
          }));
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [streakData.countdown_time]);

  const handleClaim = async (dayIndex) => {
    const displayedDay = dayIndex + 1; // 1-based indexing for UI
    const isUltimate = displayedDay === rewards.length;

    // Check if the clicked day is the current streak day
    const expectedDay = streakData.current_streak === 0 ? 1 : streakData.current_streak + 1;
    if (displayedDay !== expectedDay || !streakData.can_claim) {
      setShowOverlay(true);
      setCountdownDisplay(streakData.countdown_time || "23:59:59");
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setShowOverlay(true);
        throw new Error("No access token found");
      }

      // Send the userSignature with the perform-streak request as well
      const response = await fetch(`${BASE_URL}/perform-streak`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-User-Signature": streakData.userSignature, // Include signature in claim request
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setShowOverlay(true);
        setCountdownDisplay(streakData.countdown_time || "23:59:59");
        throw new Error(errorData.message || "Failed to claim streak");
      }

      const streakResponse = await response.json();
      
      // Always add the claimed day to the current claimed days
      let newClaimedDays = [...streakData.claimed_days, displayedDay];
      let newCurrentStreak = streakResponse.current_streak || streakData.current_streak + 1;
      let newCanClaim = false;
      
      // Always initialize countdown time to 23:59:59 on claim
      let newCountdownTime = "23:59:59";

      // Handle Ultimate streak reset
      if (isUltimate) {
        newClaimedDays = [];
        newCurrentStreak = 0;
        newCanClaim = true;
        newCountdownTime = null;
      }

      const now = new Date();
      const newStreakData = {
        current_streak: newCurrentStreak,
        claimed_days: newClaimedDays,
        last_action_date: streakResponse.last_action_date || now.toISOString(),
        can_claim: newCanClaim,
        countdown_time: newCountdownTime,
        userSignature: streakData.userSignature, // Keep the current signature
      };

      // Update states
      setStreakData(newStreakData);
      setCountdownDisplay(newCountdownTime);
      
      // Always update localStorage immediately after claiming
      localStorage.setItem("streakData", JSON.stringify(newStreakData));
    } catch (err) {
      console.error("Error claiming streak:", err);
      setShowOverlay(true);
      setCountdownDisplay(streakData.countdown_time || "23:59:59");
    }
  };

  const handleInvalidClick = () => {
    setShowOverlay(true);
    setCountdownDisplay(streakData.countdown_time || "23:59:59");
  };

  const handleCloseOverlay = () => {
    setShowOverlay(false);
    setCountdownDisplay(streakData.countdown_time);
  };

  // Determine CTA button state
  const expectedDay = streakData.current_streak === 0 ? 1 : streakData.current_streak + 1;
  const isCtaActive = streakData.can_claim && !streakData.claimed_days.includes(expectedDay);
  const ctaButtonText = isCtaActive ? "Claim Reward" : "Come Back Tomorrow";

  return (
    <div className="daily-streak-screen">
      <div className="streak-header">
        <img
          src={`${process.env.PUBLIC_URL}/streak.png`}
          alt="Streak Icon"
          className="streak-icon-big"
        />
        <p className="streak-title">Streak Calendar</p>
        <p className="streak-subtitle">Claim your daily bonuses!</p>
      </div>

      <div className="daily-rewards">
        <p className="daily-rewards-title">Daily Rewards</p>
        <div className="rewards-grid">
          {rewards.map((reward, index) => {
            const displayedDay = index + 1;
            const isActive = displayedDay === expectedDay && streakData.can_claim;
            const isClaimed = streakData.claimed_days.includes(displayedDay);
            return (
              <RewardFrame
                key={displayedDay}
                day={displayedDay === rewards.length ? "Ultimate" : `Day ${displayedDay}`}
                reward={reward.reward}
                isActive={isActive}
                isClaimed={isClaimed}
                onClick={() => handleClaim(index)}
                onInvalidClick={handleInvalidClick}
              />
            );
          })}
        </div>
        {countdownDisplay && (
          <p className="rewards-note">
            Come back in {countdownDisplay} for your next reward
          </p>
        )}
      </div>

      <div className="cta-container clickable">
        <CTAButton
          isActive={isCtaActive}
          text={ctaButtonText}
          onClick={isCtaActive ? () => handleClaim(expectedDay - 1) : handleInvalidClick}
        />
      </div>

      {showOverlay && (
        <div className="overlay-container6">
          <div className={`streak-overlay6 ${showOverlay ? "slide-in" : "slide-out"}`}>
            <div className="overlay-header6">
              <h2 className="overlay-title6">Daily Streak</h2>
              <img
                src={`${process.env.PUBLIC_URL}/cancel.png`}
                alt="Close"
                className="overlay-cancel"
                onClick={handleCloseOverlay}
              />
            </div>
            <div className="overlay-divider"></div>
            <div className="overlay-content6">
              <img
                src={`${process.env.PUBLIC_URL}/streak.png`}
                alt="Streak Icon"
                className="overlay-streak-icon"
              />
              <p className="overlay-text">Streak Not Updated</p>
              <p className="overlay-subtext">Check again in</p>
              <p className="overlay-time">{countdownDisplay || "23:59:59"}</p>
              <button className="overlay-cta-button clickable" onClick={handleCloseOverlay}>
                Ok
              </button>
            </div>
          </div>
        </div>
      )}

      <Navigation />
    </div>
  );
};

export default DailyStreakScreen;