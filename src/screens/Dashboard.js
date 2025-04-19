// import React, { useState, useEffect, useCallback, useRef, useContext } from "react";
// import { useNavigate } from "react-router-dom";
// import Navigation from "../components/Navigation";
// import "./Dashboard.css";
// import { BoostContext } from "../context/BoosterContext";
// import { throttle } from "lodash";
// import { BASE_URL } from "../utils/BaseVariables";

// // Updated Recharge times per spec (in ms) - now including all 5 levels
// const RECHARGE_TIMES = [5000, 4500, 3500, 2500, 1500, 500]; // Level 0 through 5

// const Dashboard = () => {
//   const navigate = useNavigate();
//   const [clanPath, setClanPath] = useState("/clan-screen");

//   useEffect(() => {
//     const checkClanStatus = async () => {
//       const token = localStorage.getItem("accessToken");
//       if (!token) return;

//       try {
//         const response = await fetch(`${BASE_URL}/user/clan/my_clan`, {
//           method: "GET",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         });
//         if (response.ok) {
//           const data = await response.json();
//           if (data.id) {
//             if (data.status === "active") {
//               setClanPath("/clan-details-screen");
//               localStorage.removeItem("pendingClanId");
//             } else if (data.status === "pending") {
//               setClanPath("/clan-screen");
//               localStorage.setItem("pendingClanId", data.id);
//             }
//           } else {
//             setClanPath("/clan-screen");
//           }
//         } else {
//           setClanPath("/clan-screen");
//         }
//       } catch (err) {
//         console.error("Error checking clan status:", err);
//         setClanPath("/clan-screen");
//       }
//     };
//     checkClanStatus();
//   }, [navigate]);

//   const {
//     totalTaps,
//     setTotalTaps,
//     setDailyBoosters,
//     dailyBoosters,
//     extraBoosters,
//     tapMultiplier,
//     activateTapperBoost,
//     activateFullEnergy,
//     setTapMultiplier,
//     setElectricBoost,
//     setMaxElectricBoost,
//     maxElectricBoost,
//     setRechargeTime,
//     rechargeTime,
//     autoTapActive,
//     setAutoTapActive,
//     applyAutoBotTaps,
//     lastActiveTime,
//     setLastActiveTime,
//     adjustElectricBoosts,
//     electricBoost,
//   } = useContext(BoostContext);

//   const [telegramData, setTelegramData] = useState({
//     telegram_user_id: "",
//     username: "User",
//     image_url: `${process.env.PUBLIC_URL}/profile-picture.png`,
//   });

//   const [profile, setProfile] = useState({ level: 1, level_name: "Beginner" });
//   const [currentStreak, setCurrentStreak] = useState(0);
//   const [tapEffects, setTapEffects] = useState([]);
//   const [showAutoBotOverlay, setShowAutoBotOverlay] = useState(false);
//   const [autoBotTaps, setAutoBotTaps] = useState(0);

//   const tapCountSinceLastUpdate = useRef(0);
//   const lastTapTime = useRef(Date.now());
//   const rechargeInterval = useRef(null);
//   const autoTapInterval = useRef(null);
//   const boostMultiplierActive = useRef(false);
//   const electricBoostRef = useRef(electricBoost);

//   useEffect(() => {
//     electricBoostRef.current = electricBoost;
//   }, [electricBoost]);

//   const resetBoosters = () => {
//     const resetState = {
//       tapperBoost: { usesLeft: 3, isActive: false, endTime: null, resetTime: null },
//       fullEnergy: { usesLeft: 3, isActive: false, resetTime: null },
//     };
//     setDailyBoosters(resetState);
//     setAutoTapActive(false);
//     setMaxElectricBoost(1000);
//     setElectricBoost(1000);
//     setRechargeTime(RECHARGE_TIMES[0]);
//     setTotalTaps(0);
//     setProfile({ level: 1, level_name: "Beginner" });
//     setCurrentStreak(0);
//     tapCountSinceLastUpdate.current = 0;
//     lastTapTime.current = Date.now();
//     setAutoTapActive(false);
//     if (autoTapInterval.current) clearInterval(autoTapInterval.current);
//     autoTapInterval.current = null;
//     boostMultiplierActive.current = false;
//     setTelegramData({
//       telegram_user_id: "",
//       username: "User",
//       image_url: `${process.env.PUBLIC_URL}/profile-picture.png`,
//     });
//   };

//   useEffect(() => {
//     const fetchProfile = async () => {
//       const token = localStorage.getItem("accessToken");
//       if (!token) {
//         navigate("/splash");
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
//         if (!response.ok) throw new Error("Failed to fetch profile");
//         const data = await response.json();
//         if (data.total_coins === 0 && data.level === 1) {
//           resetBoosters();
//         } else {
//           setProfile(data);
//           if (data.total_coins) {
//             setTotalTaps(data.total_coins);
//           }
//           setCurrentStreak(data.streak?.current_streak || 0);
//           const savedTapTime = localStorage.getItem("lastTapTime");
//           if (savedTapTime) {
//             lastTapTime.current = parseInt(savedTapTime, 10);
//           }
//           setTelegramData({
//             telegram_user_id: data.telegram_user_id || "",
//             username: data.username || "User",
//             image_url: data.image_url || `${process.env.PUBLIC_URL}/profile-picture.png`,
//           });
//         }
//       } catch (err) {
//         console.error("Error fetching profile:", err);
//         navigate("/splash");
//       }
//     };
//     fetchProfile();
//   }, [navigate]);

//   useEffect(() => {
//     //console.log("Current telegramData:", telegramData);
//   }, [telegramData]);

//   const updateBackend = useCallback(() => {
//     const tapsToSync = tapCountSinceLastUpdate.current;
//     tapCountSinceLastUpdate.current = 0;
//     const isoString = new Date(Date.now()).toISOString();

//     const token = localStorage.getItem("accessToken");
//     // Add source parameter to track coin origin
//     const url = `${BASE_URL}/update-coins?coins=${tapsToSync}&current_power_limit=${electricBoostRef.current}&last_active_time=${isoString}&auto_bot_active=true&source=${tapsToSync > 0 ? "tap" : "auto_bot"}`;

//     fetch(url, {
//       method: "POST",
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//       },
//       keepalive: true,
//     })
//       .then((response) => response.json())
//       .then((response_data) => {
//         if (response_data["current coins"] >= 0) {
//           setProfile((prev) => ({
//             ...prev,
//             level: response_data["current level"] || prev.level,
//           }));
//         }
//       })
//       .catch((err) => console.error("Error syncing with backend:", err));
//   }, []);

//   const throttledUpdateBackend = useCallback(throttle(updateBackend, 10000), [updateBackend]);

//   useEffect(() => {
//     const interval = setInterval(throttledUpdateBackend, 15000);

//     return () => {
//       clearInterval(interval);
//       updateBackend();
//     };
//   }, [throttledUpdateBackend]);

//   useEffect(() => {
//     const checkRecharge = () => {
//       const now = Date.now();
//       const timeSinceLastTap = now - lastTapTime.current;

//       if (timeSinceLastTap >= rechargeTime && electricBoost < maxElectricBoost) {
//         if (!rechargeInterval.current) {
//           rechargeInterval.current = setInterval(() => {
//             console.log("Setting Electric Boost from interval update");
//             setElectricBoost((prev) => {
//               const newBoost = Math.min(prev + 1, maxElectricBoost);
//               if (newBoost === maxElectricBoost) {
//                 clearInterval(rechargeInterval.current);
//                 rechargeInterval.current = null;
//               }
//               return newBoost;
//             });
//           }, rechargeTime);
//         }
//       } else if (rechargeInterval.current && timeSinceLastTap < rechargeTime) {
//         clearInterval(rechargeInterval.current);
//         rechargeInterval.current = null;
//       }
//     };

//     const interval = setInterval(checkRecharge, 1000);
//     return () => {
//       clearInterval(interval);
//       if (rechargeInterval.current) {
//         clearInterval(rechargeInterval.current);
//         rechargeInterval.current = null;
//       }
//     };
//   }, [electricBoost, maxElectricBoost, rechargeTime]);

//   useEffect(() => {
//     const handleFullEnergyClaimed = () => {
//       setElectricBoost(maxElectricBoost);
//     };

//     window.addEventListener("fullEnergyClaimed", handleFullEnergyClaimed);
//     return () => window.removeEventListener("fullEnergyClaimed", handleFullEnergyClaimed);
//   }, [maxElectricBoost]);

//   useEffect(() => {
//     const handleBoostUpgraded = (event) => {
//       const newLevel = event.detail?.level || 1;
//       const newPermanent = newLevel + 1;
//       if (!boostMultiplierActive.current) {
//         setTapMultiplier(newPermanent);
//       } else {
//         setTapMultiplier(newPermanent * 2);
//       }
//     };

//     const handleMultiplierUpgraded = (event) => {
//       console.log("Multiplier Upgraded Event:", event.detail);
//     };

//     const handleRechargeSpeedUpgraded = (event) => {
//       console.log("Recharge Speed Upgraded Event:", event.detail);
//       if (rechargeInterval.current) {
//         clearInterval(rechargeInterval.current);
//         rechargeInterval.current = null;
//       }
//     };

//     const handleAutoTapActivated = (event) => {
//       console.log("Auto Tap Activated Event:", event.detail);
//     };

//     const handleBoosterUpgraded = () => {
//       console.log("Generic Booster Upgraded Event");
//     };

//     window.addEventListener("boostUpgraded", handleBoostUpgraded);
//     window.addEventListener("multiplierUpgraded", handleMultiplierUpgraded);
//     window.addEventListener("rechargeSpeedUpgraded", handleRechargeSpeedUpgraded);
//     window.addEventListener("autoTapActivated", handleAutoTapActivated);
//     window.addEventListener("boosterUpgraded", handleBoosterUpgraded);

//     return () => {
//       window.removeEventListener("boostUpgraded", handleBoostUpgraded);
//       window.removeEventListener("multiplierUpgraded", handleMultiplierUpgraded);
//       window.removeEventListener("rechargeSpeedUpgraded", handleRechargeSpeedUpgraded);
//       window.removeEventListener("autoTapActivated", handleAutoTapActivated);
//       window.removeEventListener("boosterUpgraded", handleBoosterUpgraded);
//     };
//   }, []);

//   const isTouchEvent = useRef(false);

//   const handleTap = (event) => {
//     if (event.pointerType === "touch") {
//       isTouchEvent.current = true;
//     } else if (event.pointerType === "mouse" && isTouchEvent.current) {
//       return;
//     }

//     if (electricBoost <= 0) return;

//     if (rechargeInterval.current) {
//       clearInterval(rechargeInterval.current);
//       rechargeInterval.current = null;
//     }

//     lastTapTime.current = Date.now();
//     localStorage.setItem("lastTapTime", lastTapTime.current.toString());

//     const numTaps = event.touches ? event.touches.length : 1;

//     setTotalTaps((prev) => prev + tapMultiplier * numTaps);
//     tapCountSinceLastUpdate.current += tapMultiplier * numTaps;

//     setElectricBoost((prev) => Math.max(prev - numTaps, 0));

//     const tapElement = event.currentTarget;
//     const tapIconRect = tapElement.getBoundingClientRect();

//     const tapX = event.clientX - tapIconRect.left;
//     const tapY = event.clientY - tapIconRect.top;
//     const id = Date.now() + Math.random();
//     const newTapEffect = { id, x: tapX, y: tapY };

//     setTapEffects((prev) => [...prev, newTapEffect]);

//     setTimeout(() => {
//       setTapEffects((prev) => prev.filter((effect) => effect.id !== id));
//     }, 1000);

//     tapElement.classList.add("tap-animation");
//     setTimeout(() => tapElement.classList.remove("tap-animation"), 200);
//   };

//   useEffect(() => {
//     const handleLoad = () => {
//       const currentUser = JSON.parse(localStorage.getItem("telegramUser"));
//       const lastUser = JSON.parse(sessionStorage.getItem("lastUser"));

//       if (currentUser && currentUser.uniqueId !== lastUser?.uniqueId) {
//         const offlineTaps = applyAutoBotTaps();
//         const newElectricBoost = adjustElectricBoosts();
//         setElectricBoost(newElectricBoost);

//         if (offlineTaps > 0) {
//           setAutoBotTaps(offlineTaps);
//           setShowAutoBotOverlay(true);
//         }

//         sessionStorage.setItem("lastUser", JSON.stringify(currentUser));
//         sessionStorage.setItem("hasVisited", "true");
//       }

//       sessionStorage.setItem("lastUser", JSON.stringify(currentUser));
//     };

//     if (document.readyState === "complete") {
//       handleLoad();
//     } else {
//       window.addEventListener("load", handleLoad);
//     }

//     return () => {
//       window.removeEventListener("load", handleLoad);
//     };
//   }, [applyAutoBotTaps]);

//   useEffect(() => {
//     const storedTaps = localStorage.getItem("autoBotTaps");
//     if (storedTaps !== null) {
//       const parsedTaps = parseInt(storedTaps, 10);
//       if (parsedTaps > 0) {
//         setAutoBotTaps((prev) => parsedTaps + prev);
//         setShowAutoBotOverlay(true);
//       }
//     }
//   }, []);

//   useEffect(() => {
//     localStorage.setItem("autoBotTaps", autoBotTaps);
//   }, [autoBotTaps]);

//   const handleClaimAutoBotTaps = () => {
//     setTotalTaps((prev) => prev + autoBotTaps);
//     tapCountSinceLastUpdate.current = autoBotTaps;

//     setAutoBotTaps(0);
//     localStorage.setItem("autoBotTaps", "0");

//     setShowAutoBotOverlay(false);

//     updateBackend();
//   };

//   const handleClearAutoBotTaps = () => {
//     setAutoBotTaps(0);
//     setShowAutoBotOverlay(false);
//     localStorage.setItem("autoBotTaps", "0");
//   };

//   useEffect(() => {
//     const handleUnload = () => {
//       updateBackend();
//     };

//     const handleVisibilityChange = () => {
//       if (document.hidden) {
//         updateBackend();
//       }
//     };

//     window.addEventListener("beforeunload", handleUnload);
//     document.addEventListener("visibilitychange", handleVisibilityChange);

//     return () => {
//       window.removeEventListener("beforeunload", handleUnload);
//       document.removeEventListener("visibilitychange", handleVisibilityChange);
//     };
//   }, [updateBackend]);

//   const renderAutoBotOverlay = () => {
//     if (!showAutoBotOverlay || autoBotTaps <= 0) return null;

//     return (
//       <div className="overlay-container2">
//         <div className={`boost-overlay2 ${showAutoBotOverlay ? "slide-in" : "slide-out"}`}>
//           <div className="overlay-header2">
//             <h2 className="overlay2-title">Auto-Bot Earning</h2>
//             <img
//               src={`${process.env.PUBLIC_URL}/cancel.png`}
//               alt="Cancel"
//               className="overlay-cancel"
//               onClick={handleClearAutoBotTaps}
//             />
//           </div>
//           <div className="overlay-divider"></div>
//           <div className="overlay-content">
//             <img
//               src={`${process.env.PUBLIC_URL}/autobot-icon.png`}
//               alt="AutoBot Icon"
//               className="overlay-boost-icon"
//             />
//             <p className="overlay-description">Your autobot worked for you</p>
//             <div className="overlay-value-container">
//               <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Coin Icon" className="overlay-coin-icon" />
//               <span className="overlay-value">{autoBotTaps.toLocaleString()}</span>
//             </div>
//             <button className="overlay-cta clickable" onClick={handleClaimAutoBotTaps}>
//               Claim
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="dashboard-container">
//       {renderAutoBotOverlay()}
//       <div className="profile1-streak-section">
//         <div className="profile1-section clickable" onClick={() => navigate("/profile-screen")}>
//           <img src={telegramData.image_url} alt="Profile" className="profile1-picture" />
//           <div className="profile1-info">
//             <span className="profile1-username">{telegramData.username}</span>
//             <span className="profile1-level">
//               Lv. {profile.level}. {profile.level_name}
//             </span>
//           </div>
//         </div>
//         <div className="streak-section clickable" onClick={() => navigate("/daily-streak-screen")}>
//           <img src={`${process.env.PUBLIC_URL}/streak.png`} alt="Streak Icon" className="streak-icon" />
//           <div className="streak-info">
//             <span className="streak-text">Current Streak</span>
//             <span className="streak-days">Day {currentStreak}</span>
//           </div>
//         </div>
//       </div>

//       <div className="frames-section">
//         {[
//           { name: "Rewards", icon: "reward.png", path: "/reward-screen" },
//           { name: "Challenge", icon: "challenge.png", path: "/challenge-screen" },
//           { name: "Clan", icon: "clan.png", path: clanPath },
//           { name: "Leaderboard", icon: "leaderboard.png", path: "/leaderboard-screen" },
//         ].map((frame, index) => (
//           <div className="frame clickable" key={index} onClick={() => navigate(frame.path)}>
//             <img src={`${process.env.PUBLIC_URL}/${frame.icon}`} alt={`${frame.name} Icon`} className="frame-icon" />
//             <span>{frame.name}</span>
//           </div>
//         ))}
//       </div>

//       <div className="total-taps-section">
//         <p className="total-taps-text">Your Total Taps:</p>
//         <div className="total-taps-count">
//           <img className="tap-logo-small" src={`${process.env.PUBLIC_URL}/logo.png`} alt="Small Icon" />
//           <span>{totalTaps?.toLocaleString() ?? 0}</span>
//         </div>
//         <div className="big-tap-icon" onPointerDown={handleTap}>
//           <img className="tap-logo-big" src={`${process.env.PUBLIC_URL}/logo.png`} alt="Big Tap Icon" />
//           {tapEffects.map((effect) => (
//             <div key={effect.id} className="tap-effect" style={{ top: `${effect.y}px`, left: `${effect.x}px` }}>
//               +{tapMultiplier}
//             </div>
//           ))}
//         </div>
//       </div>
//       <div className="electric-boost-section">
//         <div className="electric-value">
//           <img src={`${process.env.PUBLIC_URL}/electric-icon.png`} alt="Electric Icon" className="electric-icon" />
//           <span>{Math.floor(electricBoost)}/{maxElectricBoost}</span>
//         </div>
//         <button className="boost-btn clickable" onClick={() => navigate("/boost-screen")}>
//           <img src={`${process.env.PUBLIC_URL}/boostx2.png`} alt="Boost Icon" className="boost-icon" />
//           Boost
//         </button>
//       </div>
//       <Navigation />
//     </div>
//   );
// };

// export default Dashboard;


import React, { useState, useEffect, useCallback, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./Dashboard.css";
import { BoostContext } from "../context/BoosterContext";
import { throttle } from "lodash";
import { BASE_URL } from "../utils/BaseVariables";

// Updated Recharge times per spec (in ms) - now including all 5 levels
const RECHARGE_TIMES = [5000, 4500, 3500, 2500, 1500, 500]; // Level 0 through 5

const Dashboard = () => {
  const navigate = useNavigate();
  const [clanPath, setClanPath] = useState("/clan-screen");
  const [showStreakOverlay, setShowStreakOverlay] = useState(false);
  const [streakData, setStreakData] = useState({
    current_streak: 0,
    can_claim: false,
    countdown_time: null,
    last_action_date: null,
  });
  const [countdownDisplay, setCountdownDisplay] = useState(null);

  useEffect(() => {
    const checkClanStatus = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) return;

      try {
        const response = await fetch(`${BASE_URL}/user/clan/my_clan`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          if (data.id) {
            if (data.status === "active") {
              setClanPath("/clan-details-screen");
              localStorage.removeItem("pendingClanId");
            } else if (data.status === "pending") {
              setClanPath("/clan-screen");
              localStorage.setItem("pendingClanId", data.id);
            }
          } else {
            setClanPath("/clan-screen");
          }
        } else {
          setClanPath("/clan-screen");
        }
      } catch (err) {
        console.error("Error checking clan status:", err);
        setClanPath("/clan-screen");
      }
    };
    checkClanStatus();
  }, [navigate]);

  const {
    totalTaps,
    setTotalTaps,
    setDailyBoosters,
    dailyBoosters,
    extraBoosters,
    tapMultiplier,
    activateTapperBoost,
    activateFullEnergy,
    setTapMultiplier,
    setElectricBoost,
    setMaxElectricBoost,
    maxElectricBoost,
    setRechargeTime,
    rechargeTime,
    autoTapActive,
    setAutoTapActive,
    applyAutoBotTaps,
    lastActiveTime,
    setLastActiveTime,
    adjustElectricBoosts,
    electricBoost,
  } = useContext(BoostContext);

  const [telegramData, setTelegramData] = useState({
    telegram_user_id: "",
    username: "User",
    image_url: `${process.env.PUBLIC_URL}/profile-picture.png`,
  });

  const [profile, setProfile] = useState({ level: 1, level_name: "Beginner" });
  const [currentStreak, setCurrentStreak] = useState(0);
  const [tapEffects, setTapEffects] = useState([]);
  const [showAutoBotOverlay, setShowAutoBotOverlay] = useState(false);
  const [autoBotTaps, setAutoBotTaps] = useState(0);

  const tapCountSinceLastUpdate = useRef(0);
  const lastTapTime = useRef(Date.now());
  const rechargeInterval = useRef(null);
  const autoTapInterval = useRef(null);
  const boostMultiplierActive = useRef(false);
  const electricBoostRef = useRef(electricBoost);

  useEffect(() => {
    electricBoostRef.current = electricBoost;
  }, [electricBoost]);

  const resetBoosters = () => {
    const resetState = {
      tapperBoost: { usesLeft: 3, isActive: false, endTime: null, resetTime: null },
      fullEnergy: { usesLeft: 3, isActive: false, resetTime: null },
    };
    setDailyBoosters(resetState);
    setAutoTapActive(false);
    setMaxElectricBoost(1000);
    setElectricBoost(1000);
    setRechargeTime(RECHARGE_TIMES[0]);
    setTotalTaps(0);
    setProfile({ level: 1, level_name: "Beginner" });
    setCurrentStreak(0);
    tapCountSinceLastUpdate.current = 0;
    lastTapTime.current = Date.now();
    setAutoTapActive(false);
    if (autoTapInterval.current) clearInterval(autoTapInterval.current);
    autoTapInterval.current = null;
    boostMultiplierActive.current = false;
    setTelegramData({
      telegram_user_id: "",
      username: "User",
      image_url: `${process.env.PUBLIC_URL}/profile-picture.png`,
    });
  };

  useEffect(() => {
    const fetchProfileAndStreak = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/splash");
        return;
      }
      try {
        // Fetch user profile
        const profileResponse = await fetch(`${BASE_URL}/user/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!profileResponse.ok) throw new Error("Failed to fetch profile");
        const profileData = await profileResponse.json();
        if (profileData.total_coins === 0 && profileData.level === 1) {
          resetBoosters();
        } else {
          setProfile(profileData);
          if (profileData.total_coins) {
            setTotalTaps(profileData.total_coins);
          }
          const savedTapTime = localStorage.getItem("lastTapTime");
          if (savedTapTime) {
            lastTapTime.current = parseInt(savedTapTime, 10);
          }
          setTelegramData({
            telegram_user_id: profileData.telegram_user_id || "",
            username: profileData.username || "User",
            image_url: profileData.image_url || `${process.env.PUBLIC_URL}/profile-picture.png`,
          });
        }

        // Fetch streak status
        const streakResponse = await fetch(`${BASE_URL}/streak/status`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!streakResponse.ok) throw new Error("Failed to fetch streak status");
        const streakDataResponse = await streakResponse.json();

        // Determine if the streak can be claimed based on next_streak_time
        const canClaim = !streakDataResponse.next_streak_time || streakDataResponse.next_streak_time === "00:00:00";
        setStreakData({
          current_streak: streakDataResponse.current_streak || 0,
          can_claim: canClaim,
          countdown_time: streakDataResponse.next_streak_time || null,
          last_action_date: streakDataResponse.last_action_date || null,
        });
        setCountdownDisplay(streakDataResponse.next_streak_time || null);
        setCurrentStreak(streakDataResponse.current_streak || 0);
      } catch (err) {
        console.error("Error fetching profile or streak:", err);
        navigate("/splash");
      }
    };
    fetchProfileAndStreak();
  }, [navigate]);

  useEffect(() => {
    if (streakData.countdown_time) {
      const parseTimeToSeconds = (timeStr) => {
        if (!timeStr || timeStr === "00:00:00") return 0;
        // Handle format like "1 day, 0:22:37"
        const regex = /(\d+)\s*day[s]?,?\s*(\d+):(\d+):(\d+)/;
        const match = timeStr.match(regex);
        if (match) {
          const [, days, hours, minutes, seconds] = match.map(Number);
          return days * 86400 + hours * 3600 + minutes * 60 + seconds;
        }
        // Fallback for HH:MM:SS format
        const [hours, minutes, seconds] = timeStr.split(":").map(Number);
        if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return 0;
        return hours * 3600 + minutes * 60 + seconds;
      };

      let totalSeconds = parseTimeToSeconds(streakData.countdown_time);
      if (totalSeconds <= 0) {
        setStreakData((prev) => ({
          ...prev,
          can_claim: true,
          countdown_time: null,
        }));
        setCountdownDisplay(null);
        return;
      }

      const timer = setInterval(() => {
        totalSeconds--;
        if (totalSeconds <= 0) {
          clearInterval(timer);
          setStreakData((prev) => ({
            ...prev,
            can_claim: true,
            countdown_time: null,
          }));
          setCountdownDisplay(null);
        } else {
          const days = Math.floor(totalSeconds / 86400);
          const hours = Math.floor((totalSeconds % 86400) / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          const seconds = totalSeconds % 60;
          const newTime = days > 0 
            ? `${days} day${days !== 1 ? 's' : ''}, ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
            : `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
          setCountdownDisplay(newTime);
          setStreakData((prev) => ({ ...prev, countdown_time: newTime }));
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [streakData.countdown_time]);

  const handleClaimStreak = async () => {
    if (!streakData.can_claim) {
      setShowStreakOverlay(true);
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");

      const response = await fetch(`${BASE_URL}/streak/claim`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const claimData = await response.json();
      if (!response.ok) {
        setShowStreakOverlay(true);
        throw new Error(claimData.message || "Failed to claim streak");
      }

      // Update total taps with the reward amount
      const rewardAmount = claimData.daily_reward_amount || 0;
      setTotalTaps((prev) => prev + rewardAmount);
      tapCountSinceLastUpdate.current += rewardAmount;

      // Fetch updated streak status
      const streakStatusResponse = await fetch(`${BASE_URL}/streak/status`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!streakStatusResponse.ok) throw new Error("Failed to fetch streak status");
      const newStreakData = await streakStatusResponse.json();

      const canClaim = !newStreakData.next_streak_time || newStreakData.next_streak_time === "00:00:00";
      setStreakData({
        current_streak: newStreakData.current_streak || 0,
        can_claim: canClaim,
        countdown_time: newStreakData.next_streak_time || null,
        last_action_date: newStreakData.last_action_date || null,
      });
      setCountdownDisplay(newStreakData.next_streak_time || null);
      setCurrentStreak(newStreakData.current_streak || 0);

      setShowStreakOverlay(false);
      updateBackend("streak");
    } catch (err) {
      console.error("Error claiming streak:", err);
      setShowStreakOverlay(true);
    }
  };

  const handleCloseStreakOverlay = () => {
    setShowStreakOverlay(false);
  };

  const updateBackend = useCallback((source = null) => {
    const tapsToSync = tapCountSinceLastUpdate.current;
    tapCountSinceLastUpdate.current = 0;
    const isoString = new Date(Date.now()).toISOString();

    const token = localStorage.getItem("accessToken");

    // Use the provided source parameter if available, otherwise determine based on taps
    const tapSource = source || (tapsToSync > 0 ? "tap" : "auto_bot");

    // Fixed query string: corrected 'current_power_limit' and proper encoding
    const url = `${BASE_URL}/update-coins?coins=${encodeURIComponent(tapsToSync)}&current_power_limit=${encodeURIComponent(electricBoostRef.current)}&last_active_time=${encodeURIComponent(isoString)}&auto_bot_active=${encodeURIComponent(true)}&source=${encodeURIComponent(tapSource)}`;

    fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      keepalive: true,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to update coins: ${response.status}`);
        }
        return response.json();
      })
      .then((response_data) => {
        if (response_data["current coins"] >= 0) {
          setProfile((prev) => ({
            ...prev,
            level: response_data["current level"] || prev.level,
          }));
        }
      })
      .catch((err) => console.error("Error syncing with backend:", err));
  }, []);

  const throttledUpdateBackend = useCallback(
    throttle((source) => updateBackend(source), 10000),
    [updateBackend]
  );

  useEffect(() => {
    const interval = setInterval(() => throttledUpdateBackend(), 15000);

    return () => {
      clearInterval(interval);
      updateBackend();
    };
  }, [throttledUpdateBackend]);

  useEffect(() => {
    const checkRecharge = () => {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTime.current;

      if (timeSinceLastTap >= rechargeTime && electricBoost < maxElectricBoost) {
        if (!rechargeInterval.current) {
          rechargeInterval.current = setInterval(() => {
            console.log("Setting Electric Boost from interval update");
            setElectricBoost((prev) => {
              const newBoost = Math.min(prev + 1, maxElectricBoost);
              if (newBoost === maxElectricBoost) {
                clearInterval(rechargeInterval.current);
                rechargeInterval.current = null;
              }
              return newBoost;
            });
          }, rechargeTime);
        }
      } else if (rechargeInterval.current && timeSinceLastTap < rechargeTime) {
        clearInterval(rechargeInterval.current);
        rechargeInterval.current = null;
      }
    };

    const interval = setInterval(checkRecharge, 1000);
    return () => {
      clearInterval(interval);
      if (rechargeInterval.current) {
        clearInterval(rechargeInterval.current);
        rechargeInterval.current = null;
      }
    };
  }, [electricBoost, maxElectricBoost, rechargeTime]);

  useEffect(() => {
    const handleFullEnergyClaimed = () => {
      setElectricBoost(maxElectricBoost);
    };

    window.addEventListener("fullEnergyClaimed", handleFullEnergyClaimed);
    return () => window.removeEventListener("fullEnergyClaimed", handleFullEnergyClaimed);
  }, [maxElectricBoost]);

  useEffect(() => {
    const handleBoostUpgraded = (event) => {
      const newLevel = event.detail?.level || 1;
      const newPermanent = newLevel + 1;
      if (!boostMultiplierActive.current) {
        setTapMultiplier(newPermanent);
      } else {
        setTapMultiplier(newPermanent * 2);
      }
    };

    const handleMultiplierUpgraded = (event) => {
      console.log("Multiplier Upgraded Event:", event.detail);
    };

    const handleRechargeSpeedUpgraded = (event) => {
      console.log("Recharge Speed Upgraded Event:", event.detail);
      if (rechargeInterval.current) {
        clearInterval(rechargeInterval.current);
        rechargeInterval.current = null;
      }
    };

    const handleAutoTapActivated = (event) => {
      console.log("Auto Tap Activated Event:", event.detail);
    };

    const handleBoosterUpgraded = () => {
      console.log("Generic Booster Upgraded Event");
    };

    window.addEventListener("boostUpgraded", handleBoostUpgraded);
    window.addEventListener("multiplierUpgraded", handleMultiplierUpgraded);
    window.addEventListener("rechargeSpeedUpgraded", handleRechargeSpeedUpgraded);
    window.addEventListener("autoTapActivated", handleAutoTapActivated);
    window.addEventListener("boosterUpgraded", handleBoosterUpgraded);

    return () => {
      window.removeEventListener("boostUpgraded", handleBoostUpgraded);
      window.removeEventListener("multiplierUpgraded", handleMultiplierUpgraded);
      window.removeEventListener("rechargeSpeedUpgraded", handleRechargeSpeedUpgraded);
      window.removeEventListener("autoTapActivated", handleAutoTapActivated);
      window.removeEventListener("boosterUpgraded", handleBoosterUpgraded);
    };
  }, []);

  const isTouchEvent = useRef(false);

  const handleTap = (event) => {
    if (event.pointerType === "touch") {
      isTouchEvent.current = true;
    } else if (event.pointerType === "mouse" && isTouchEvent.current) {
      return;
    }

    if (electricBoost <= 0) return;

    if (rechargeInterval.current) {
      clearInterval(rechargeInterval.current);
      rechargeInterval.current = null;
    }

    lastTapTime.current = Date.now();
    localStorage.setItem("lastTapTime", lastTapTime.current.toString());

    const numTaps = event.touches ? event.touches.length : 1;

    setTotalTaps((prev) => prev + tapMultiplier * numTaps);
    tapCountSinceLastUpdate.current += tapMultiplier * numTaps;

    setElectricBoost((prev) => Math.max(prev - numTaps, 0));

    const tapElement = event.currentTarget;
    const tapIconRect = tapElement.getBoundingClientRect();

    const tapX = event.clientX - tapIconRect.left;
    const tapY = event.clientY - tapIconRect.top;
    const id = Date.now() + Math.random();
    const newTapEffect = { id, x: tapX, y: tapY };

    setTapEffects((prev) => [...prev, newTapEffect]);

    setTimeout(() => {
      setTapEffects((prev) => prev.filter((effect) => effect.id !== id));
    }, 1000);

    tapElement.classList.add("tap-animation");
    setTimeout(() => tapElement.classList.remove("tap-animation"), 200);
  };

  useEffect(() => {
    const handleLoad = () => {
      const currentUser = JSON.parse(localStorage.getItem("telegramUser"));
      const lastUser = JSON.parse(sessionStorage.getItem("lastUser"));

      if (currentUser && currentUser.uniqueId !== lastUser?.uniqueId) {
        const offlineTaps = applyAutoBotTaps();
        const newElectricBoost = adjustElectricBoosts();
        setElectricBoost(newElectricBoost);

        if (offlineTaps > 0) {
          setAutoBotTaps(offlineTaps);
          setShowAutoBotOverlay(true);
        }

        sessionStorage.setItem("lastUser", JSON.stringify(currentUser));
        sessionStorage.setItem("hasVisited", "true");
      }

      sessionStorage.setItem("lastUser", JSON.stringify(currentUser));
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
    }

    return () => {
      window.removeEventListener("load", handleLoad);
    };
  }, [applyAutoBotTaps]);

  useEffect(() => {
    const storedTaps = localStorage.getItem("autoBotTaps");
    if (storedTaps !== null) {
      const parsedTaps = parseInt(storedTaps, 10);
      if (parsedTaps > 0) {
        setAutoBotTaps((prev) => parsedTaps + prev);
        setShowAutoBotOverlay(true);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("autoBotTaps", autoBotTaps);
  }, [autoBotTaps]);

  const handleClaimAutoBotTaps = () => {
    setTotalTaps((prev) => prev + autoBotTaps);
    tapCountSinceLastUpdate.current = autoBotTaps;

    setAutoBotTaps(0);
    localStorage.setItem("autoBotTaps", "0");

    setShowAutoBotOverlay(false);

    updateBackend("auto_bot");
  };

  const handleClearAutoBotTaps = () => {
    setAutoBotTaps(0);
    setShowAutoBotOverlay(false);
    localStorage.setItem("autoBotTaps", "0");
  };

  useEffect(() => {
    const handleUnload = () => {
      updateBackend();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateBackend();
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [updateBackend]);

  const renderAutoBotOverlay = () => {
    if (!showAutoBotOverlay || autoBotTaps <= 0) return null;

    return (
      <div className="overlay-container2">
        <div className={`boost-overlay2 ${showAutoBotOverlay ? "slide-in" : "slide-out"}`}>
          <div className="overlay-header2">
            <h2 className="overlay2-title">Auto-Bot Earning</h2>
            <img
              src={`${process.env.PUBLIC_URL}/cancel.png`}
              alt="Cancel"
              className="overlay-cancel"
              onClick={handleClearAutoBotTaps}
            />
          </div>
          <div className="overlay-divider"></div>
          <div className="overlay-content">
            <img
              src={`${process.env.PUBLIC_URL}/autobot-icon.png`}
              alt="AutoBot Icon"
              className="overlay-boost-icon"
            />
            <p className="overlay-description">Your autobot worked for you</p>
            <div className="overlay-value-container">
              <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Coin Icon" className="overlay-coin-icon" />
              <span className="overlay-value">{autoBotTaps.toLocaleString()}</span>
            </div>
            <button className="overlay-cta clickable" onClick={handleClaimAutoBotTaps}>
              Claim
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderStreakOverlay = () => {
    if (!showStreakOverlay) return null;

    return (
      <div className="overlay-backdrop">
        <div className="overlay-container6">
          <div className={`streak-overlay6 ${showStreakOverlay ? "slide-in" : "slide-out"}`}>
            <div className="overlay-header6">
              <h2 className="overlay-title6">Daily Streak</h2>
              <img
                src={`${process.env.PUBLIC_URL}/cancel.png`}
                alt="Close"
                className="overlay-cancel"
                onClick={handleCloseStreakOverlay}
              />
            </div>
            <div className="overlay-divider"></div>
            <div className="overlay-content6">
              <img
                src={`${process.env.PUBLIC_URL}/streak.png`}
                alt="Streak Icon"
                className="overlay-streak-icon"
              />
              <p className="overlay-text">Daily Streak: Day {streakData.current_streak}</p>
              {countdownDisplay ? (
                <>
                  <p className="overlay-subtext">Check again in</p>
                  <p className="overlay-time">{countdownDisplay}</p>
                </>
              ) : (
                <p className="overlay-subtext">Ready to claim your daily reward!</p>
              )}
              <button
                className={`overlay-cta ${streakData.can_claim ? "active" : "inactive"} clickable`}
                onClick={handleClaimStreak}
                disabled={!streakData.can_claim}
              >
                Claim
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      {renderAutoBotOverlay()}
      {renderStreakOverlay()}
      <div className="profile1-streak-section">
        <div className="profile1-section clickable" onClick={() => navigate("/profile-screen")}>
          <img src={telegramData.image_url} alt="Profile" className="profile1-picture" />
          <div className="profile1-info">
            <span className="profile1-username">{telegramData.username}</span>
            <span className="profile1-level">
              Lv. {profile.level}. {profile.level_name}
            </span>
          </div>
        </div>
        <div className="streak-section clickable" onClick={() => setShowStreakOverlay(true)}>
          <img src={`${process.env.PUBLIC_URL}/streak.png`} alt="Streak Icon" className="streak-icon" />
          <div className="streak-info">
            <span className="streak-text">Current Streak</span>
            <span className="streak-days">Day {currentStreak}</span>
          </div>
        </div>
      </div>

      <div className="frames-section">
        {[
          { name: "Rewards", icon: "reward.png", path: "/reward-screen" },
          { name: "Challenge", icon: "challenge.png", path: "/challenge-screen" },
          { name: "Clan", icon: "clan.png", path: clanPath },
          { name: "Leaderboard", icon: "leaderboard.png", path: "/leaderboard-screen" },
        ].map((frame, index) => (
          <div className="frame clickable" key={index} onClick={() => navigate(frame.path)}>
            <img src={`${process.env.PUBLIC_URL}/${frame.icon}`} alt={`${frame.name} Icon`} className="frame-icon" />
            <span>{frame.name}</span>
          </div>
        ))}
      </div>

      <div className="total-taps-section">
        <p className="total-taps-text">Your Total Taps:</p>
        <div className="total-taps-count">
          <img className="tap-logo-small" src={`${process.env.PUBLIC_URL}/logo.png`} alt="Small Icon" />
          <span>{totalTaps?.toLocaleString() ?? 0}</span>
        </div>
        <div className="big-tap-icon" onPointerDown={handleTap}>
          <img className="tap-logo-big" src={`${process.env.PUBLIC_URL}/logo.png`} alt="Big Tap Icon" />
          {tapEffects.map((effect) => (
            <div key={effect.id} className="tap-effect" style={{ top: `${effect.y}px`, left: `${effect.x}px` }}>
              +{tapMultiplier}
            </div>
          ))}
        </div>
      </div>
      <div className="electric-boost-section">
        <div className="electric-value">
          <img src={`${process.env.PUBLIC_URL}/electric-icon.png`} alt="Electric Icon" className="electric-icon" />
          <span>{Math.floor(electricBoost)}/{maxElectricBoost}</span>
        </div>
        <button className="boost-btn clickable" onClick={() => navigate("/boost-screen")}>
          <img src={`${process.env.PUBLIC_URL}/boostx2.png`} alt="Boost Icon" className="boost-icon" />
          Boost
        </button>
      </div>
      <Navigation />
    </div>
  );
};

export default Dashboard;