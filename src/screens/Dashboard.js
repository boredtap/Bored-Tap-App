// import React, { useState, useEffect, useRef, useCallback } from "react";
// import { useNavigate } from "react-router-dom";
// import Navigation from "../components/Navigation";
// import "./Dashboard.css";

// // Configurable constants for game mechanics
// const BASE_MAX_ELECTRIC_BOOST = 1000;
// const RECHARGE_TIMES = { 0: 3000, 1: 2500, 2: 2000, 3: 1500, 4: 1000, 5: 500 };
// const AUTOBOT_TAP_INTERVAL = 1000;
// const TAP_DEBOUNCE_DELAY = 150;

// const Dashboard = () => {
//   const navigate = useNavigate();

//   // State management
//   const [telegramData, setTelegramData] = useState({
//     telegram_user_id: "",
//     username: "User",
//     image_url: "",
//   });
//   const [profile, setProfile] = useState(null);
//   const [error, setError] = useState(null);
//   const [totalTaps, setTotalTaps] = useState(0);
//   const [electricBoost, setElectricBoost] = useState(() => {
//     return parseFloat(localStorage.getItem("electricBoost")) || BASE_MAX_ELECTRIC_BOOST;
//   });
//   const [maxElectricBoost, setMaxElectricBoost] = useState(BASE_MAX_ELECTRIC_BOOST);
//   const [tapBoostLevel, setTapBoostLevel] = useState(0);
//   const [hasAutobot, setHasAutobot] = useState(false);
//   const [tapAnimation, setTapAnimation] = useState(false);
//   const [tapEffects, setTapEffects] = useState([]);
//   const [currentStreak, setCurrentStreak] = useState(0);
//   const [dailyBoosters, setDailyBoosters] = useState(() => {
//     const saved = localStorage.getItem("dailyBoosters");
//     return saved
//       ? JSON.parse(saved)
//       : {
//           tapperBoost: { usesLeft: 3, isActive: false, endTime: null, resetTime: null },
//           fullEnergy: { usesLeft: 3, isActive: false, resetTime: null },
//         };
//   });

//   // Refs
//   const tapCountSinceLastUpdate = useRef(0);
//   const autobotInterval = useRef(null);
//   const rechargeInterval = useRef(null);
//   const tapTimeout = useRef(null);
//   const tapSoundRef = useRef(new Audio(`${process.env.PUBLIC_URL}/tap.mp3`));
//   const isTapProcessed = useRef(false);

//   // Initialize Telegram data
//   useEffect(() => {
//     const initTelegram = async () => {
//       try {
//         if (window.Telegram?.WebApp) {
//           const user = window.Telegram.WebApp.initDataUnsafe.user;
//           if (user) {
//             setTelegramData({
//               telegram_user_id: user.id,
//               username: user.username || `User${user.id}`,
//               image_url: user.photo_url || `${process.env.PUBLIC_URL}/profile-picture.png`,
//             });
//           }
//         }
//       } catch (err) {
//         console.error("Error syncing Telegram data:", err);
//       }
//     };
//     initTelegram();
//   }, []);

//   // Fetch profile
//   const fetchProfile = useCallback(async () => {
//     const token = localStorage.getItem("accessToken");
//     if (!token) {
//       navigate("/splash");
//       return;
//     }
//     try {
//       const response = await fetch("https://bt-coins.onrender.com/user/profile", {
//         method: "GET",
//         headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
//       });
//       if (!response.ok) throw new Error("Failed to fetch profile");
//       const data = await response.json();
//       setProfile(data);
//       setTotalTaps(data.total_coins || 0);
//       setCurrentStreak(data.streak?.current_streak || 0);

//       if (data.total_coins === 0) {
//         localStorage.removeItem("dailyBoosters");
//         localStorage.removeItem("extraBoosters");
//         localStorage.removeItem("electricBoost");
//         localStorage.removeItem("lastActiveTime");
//         localStorage.removeItem("rechargingSpeedLevel");
//         localStorage.removeItem("lastBoostUpdateTime");
//         setDailyBoosters({
//           tapperBoost: { usesLeft: 3, isActive: false, endTime: null, resetTime: null },
//           fullEnergy: { usesLeft: 3, isActive: false, resetTime: null },
//         });
//         setElectricBoost(BASE_MAX_ELECTRIC_BOOST);
//         setMaxElectricBoost(BASE_MAX_ELECTRIC_BOOST);
//         setTapBoostLevel(0);
//         setHasAutobot(false);
//         setTotalTaps(0);
//       }
//     } catch (err) {
//       setError(err.message);
//     }
//   }, [navigate]);

//   // Apply extra booster effects
//   const applyExtraBoosterEffects = useCallback((boosters) => {
//     let newMaxElectricBoost = BASE_MAX_ELECTRIC_BOOST;
//     let newTapBoostLevel = 0;
//     let autobotOwned = false;
//     boosters.forEach((booster) => {
//       switch (booster.title.toLowerCase()) {
//         case "boost":
//           newTapBoostLevel = parseInt(booster.rawLevel) || 0;
//           break;
//         case "multiplier":
//           newMaxElectricBoost += 500 * (parseInt(booster.rawLevel) || 0);
//           break;
//         case "auto-bot tapping":
//           autobotOwned = booster.rawLevel !== "-";
//           break;
//         default:
//           break;
//       }
//     });
//     setMaxElectricBoost(newMaxElectricBoost);
//     localStorage.setItem("maxElectricBoost", newMaxElectricBoost);
//     setTapBoostLevel(newTapBoostLevel);
//     localStorage.setItem("tapBoostLevel", newTapBoostLevel);
//     setHasAutobot(autobotOwned);
//     localStorage.setItem("hasAutobot", autobotOwned);
//     setElectricBoost((prev) => Math.min(prev, newMaxElectricBoost));
//   }, []);

//   // Initial fetch and booster setup
//   useEffect(() => {
//     console.log("Initial fetch...");
//     fetchProfile();

//     const handleBoosterUpgraded = () => {
//       const savedBoosters = localStorage.getItem("extraBoosters");
//       if (savedBoosters) {
//         applyExtraBoosterEffects(JSON.parse(savedBoosters));
//         fetchProfile(); // Refresh profile after upgrade
//       }
//     };
//     const handleFullEnergyClaimed = () => {
//       setElectricBoost(maxElectricBoost); // Immediate refill
//       localStorage.setItem("electricBoost", maxElectricBoost);
//       setDailyBoosters((prev) => ({
//         ...prev,
//         fullEnergy: { ...prev.fullEnergy, isActive: false }, // Reset immediately
//       }));
//     };

//     window.addEventListener("boosterUpgraded", handleBoosterUpgraded);
//     window.addEventListener("fullEnergyClaimed", handleFullEnergyClaimed);

//     return () => {
//       window.removeEventListener("boosterUpgraded", handleBoosterUpgraded);
//       window.removeEventListener("fullEnergyClaimed", handleFullEnergyClaimed);
//     };
//   }, [fetchProfile, applyExtraBoosterEffects, maxElectricBoost]);

//   // Offline autobot gains
//   useEffect(() => {
//     if (hasAutobot) {
//       const lastActive = localStorage.getItem("lastActiveTime");
//       if (lastActive) {
//         const timePassed = (Date.now() - parseInt(lastActive)) / 1000;
//         const tapsEarned = Math.floor(timePassed);
//         const coinsEarned = tapsEarned * (1 + tapBoostLevel);
//         setTotalTaps((prev) => prev + coinsEarned);
//         tapCountSinceLastUpdate.current += coinsEarned;
//       }
//     }
//     localStorage.setItem("lastActiveTime", Date.now());
//   }, [hasAutobot, tapBoostLevel]);

//   // Autobot continuous tapping
//   useEffect(() => {
//     if (hasAutobot) {
//       autobotInterval.current = setInterval(() => {
//         const multiplier = (dailyBoosters.tapperBoost.isActive ? 2 : 1) + tapBoostLevel;
//         setTotalTaps((prev) => prev + multiplier);
//         tapCountSinceLastUpdate.current += multiplier;
//       }, AUTOBOT_TAP_INTERVAL);
//     }
//     return () => clearInterval(autobotInterval.current);
//   }, [hasAutobot, dailyBoosters.tapperBoost.isActive, tapBoostLevel]);

//   // Energy recharge
//   useEffect(() => {
//     const rechargeTime = RECHARGE_TIMES[0];
//     const rechargeRate = maxElectricBoost / (rechargeTime * 1000);

//     rechargeInterval.current = setInterval(() => {
//       setElectricBoost((prev) => {
//         if (prev < maxElectricBoost && !dailyBoosters.fullEnergy.isActive) {
//           const newBoost = Math.min(prev + rechargeRate * 1000, maxElectricBoost);
//           localStorage.setItem("electricBoost", newBoost);
//           return newBoost;
//         }
//         return prev;
//       });
//     }, 1000);
//     return () => clearInterval(rechargeInterval.current);
//   }, [maxElectricBoost, dailyBoosters.fullEnergy.isActive]);

//   // Backend sync
//   const updateBackend = useCallback(async () => {
//     if (tapCountSinceLastUpdate.current === 0) return;
//     const tapsToSync = tapCountSinceLastUpdate.current;
//     try {
//       const token = localStorage.getItem("accessToken");
//       const response = await fetch(
//         `https://bt-coins.onrender.com/update-coins?coins=${tapsToSync}`,
//         {
//           method: "POST",
//           headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
//         }
//       );
//       if (response.ok) {
//         const data = await response.json();
//         if (data.total_coins >= 0) {
//           setTotalTaps(data.total_coins);
//           tapCountSinceLastUpdate.current = 0;
//         }
//       }
//     } catch (err) {
//       console.error("Error syncing with backend:", err);
//     }
//   }, []);

//   // Tap handler
//   const handleTap = useCallback((event) => {
//     event.preventDefault();
//     if (electricBoost === 0 || isTapProcessed.current) return;

//     isTapProcessed.current = true;
//     const fingersCount = event.touches ? Math.min(event.touches.length, 1) : 1;
//     const tapperBoostActive = dailyBoosters.tapperBoost.isActive;
//     const multiplier = (tapperBoostActive ? 2 : 1) + tapBoostLevel;
//     const coinsAdded = fingersCount * multiplier;

//     setTotalTaps((prev) => prev + coinsAdded);
//     tapCountSinceLastUpdate.current += coinsAdded;

//     setElectricBoost((prev) => {
//       const newBoost = dailyBoosters.fullEnergy.isActive ? maxElectricBoost : Math.max(prev - fingersCount, 0);
//       localStorage.setItem("electricBoost", newBoost);
//       return newBoost;
//     });

//     setTapAnimation(true);
//     setTimeout(() => setTapAnimation(false), 500);

//     const tapX = (event.touches ? event.touches[0].clientX : event.clientX) || 0;
//     const tapY = (event.touches ? event.touches[0].clientY : event.clientY) || 0;
//     const newTapEffect = { id: Date.now(), x: tapX, y: tapY, count: coinsAdded };
//     setTapEffects((prevEffects) => [...prevEffects, newTapEffect]);
//     setTimeout(() => setTapEffects((prev) => prev.filter((e) => e.id !== newTapEffect.id)), 1000);

//     if (tapSoundRef.current.paused) {
//       tapSoundRef.current.currentTime = 0;
//       tapSoundRef.current.volume = 0.2;
//       tapSoundRef.current.play().catch((err) => console.error("Audio playback error:", err));
//     }

//     tapTimeout.current = setTimeout(() => {
//       isTapProcessed.current = false;
//       updateBackend();
//     }, TAP_DEBOUNCE_DELAY);
//   }, [electricBoost, dailyBoosters, tapBoostLevel, maxElectricBoost, updateBackend]);

//   const handleTapEnd = () => {
//     if (!isTapProcessed.current && tapCountSinceLastUpdate.current > 0) {
//       updateBackend();
//     }
//   };

//   // Daily booster timer
//   useEffect(() => {
//     const intervalId = setInterval(() => {
//       setDailyBoosters((prev) => {
//         const updated = { ...prev };
//         if (updated.tapperBoost.isActive && Date.now() >= updated.tapperBoost.endTime) {
//           updated.tapperBoost.isActive = false;
//         }
//         ["tapperBoost", "fullEnergy"].forEach((type) => {
//           const booster = updated[type];
//           if (booster.usesLeft === 0 && booster.resetTime && Date.now() >= booster.resetTime) {
//             booster.usesLeft = 3;
//             booster.resetTime = null;
//             booster.isActive = false;
//           }
//         });
//         return updated;
//       });
//     }, 1000);
//     localStorage.setItem("dailyBoosters", JSON.stringify(dailyBoosters));
//     return () => clearInterval(intervalId);
//   }, [dailyBoosters]);

//   if (error) return <div className="error">{error}</div>;

//   const { level = 1, level_name = "Beginner" } = profile || {};

//   return (
//     <div className="dashboard-container">
//       <div className="profile1-streak-section">
//         <div className="profile1-section" onClick={() => navigate("/profile-screen")}>
//           <img src={telegramData.image_url} alt="Profile" className="profile1-picture" />
//           <div className="profile1-info">
//             <span className="profile1-username">{telegramData.username}</span>
//             <span className="profile1-level">Lv. {level}. {level_name}</span>
//           </div>
//         </div>
//         <div className="streak-section" onClick={() => navigate("/daily-streak-screen")}>
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
//           { name: "Clan", icon: "clan.png", path: "/clan-screen" },
//           { name: "Leaderboard", icon: "leaderboard.png", path: "/leaderboard-screen" },
//         ].map((frame, index) => (
//           <div className="frame" key={index} onClick={() => navigate(frame.path)}>
//             <img src={`${process.env.PUBLIC_URL}/${frame.icon}`} alt={`${frame.name} Icon`} className="frame-icon" />
//             <span>{frame.name}</span>
//           </div>
//         ))}
//       </div>

//       <div className="total-taps-section">
//         <p className="total-taps-text">Your Total Taps:</p>
//         <div className="total-taps-count">
//           <img className="tap-logo-small" src={`${process.env.PUBLIC_URL}/logo.png`} alt="Small Icon" />
//           <span>{totalTaps.toLocaleString()}</span>
//         </div>
//         <div
//           className={`big-tap-icon ${tapAnimation ? "tap-animation" : ""}`}
//           onTouchStart={handleTap}
//           onTouchEnd={handleTapEnd}
//           onMouseDown={handleTap}
//           onMouseUp={handleTapEnd} 
//         >
//           <img className="tap-logo-big" src={`${process.env.PUBLIC_URL}/logo.png`} alt="Big Tap Icon" />
//         </div>
//         {tapEffects.map((effect) => (
//           <div key={effect.id} className="tap-effect" style={{ top: effect.y, left: effect.x }}>
//             +{effect.count}
//           </div>
//         ))}
//       </div>

//       <div className="electric-boost-section">
//         <div className="electric-value">
//           <img src={`${process.env.PUBLIC_URL}/electric-icon.png`} alt="Electric Icon" className="electric-icon" />
//           <span>{Math.floor(electricBoost)}/{maxElectricBoost}</span>
//         </div>
//         <button className="boost-btn" onClick={() => navigate("/boost-screen")}>
//           <img src={`${process.env.PUBLIC_URL}/boostx2.png`} alt="Boost Icon" className="boost-icon" />
//           Boost
//         </button>
//       </div>

//       <Navigation />
//     </div>
//   );
// };

// export default Dashboard;

// import React, { useState, useEffect, useCallback, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import Navigation from "../components/Navigation";
// import "./Dashboard.css";

// /**
//  * Dashboard component displaying the main UI with tapping interaction and navigation links.
//  * Syncs with Telegram WebApp for user data and backend for profile, streak, and coin updates.
//  */
// const Dashboard = () => {
//   const navigate = useNavigate();

//   // State for Telegram user data
//   const [telegramData, setTelegramData] = useState({
//     telegram_user_id: "",
//     username: "User",
//     image_url: `${process.env.PUBLIC_URL}/profile-picture.png`,
//   });

//   // State for user profile data
//   const [profile, setProfile] = useState({ level: 1, level_name: "Beginner" });

//   // State for streak and boost data
//   const [currentStreak, setCurrentStreak] = useState(0);
//   const [electricBoost, setElectricBoost] = useState(1000);
//   const [maxElectricBoost] = useState(1000);

//   // State for total taps and tap effects
//   const [totalTaps, setTotalTaps] = useState(0);
//   const [tapEffects, setTapEffects] = useState([]); // Multiple tap effects allowed

//   // Refs for tap and recharge management
//   const tapCountSinceLastUpdate = useRef(0);
//   const lastTapTime = useRef(Date.now()); // Track time of last tap
//   const rechargeInterval = useRef(null); // Store recharge interval ID

//   // Initialize Telegram WebApp data on component mount
//   useEffect(() => {
//     const initTelegram = async () => {
//       try {
//         if (window.Telegram?.WebApp) {
//           const user = window.Telegram.WebApp.initDataUnsafe.user;
//           if (user) {
//             setTelegramData({
//               telegram_user_id: user.id,
//               username: user.username || `User${user.id}`,
//               image_url: user.photo_url || `${process.env.PUBLIC_URL}/profile-picture.png`,
//             });
//           }
//         }
//       } catch (err) {
//         console.error("Error syncing Telegram data:", err);
//       }
//     };
//     initTelegram();
//   }, []);

//   // Fetch user profile from backend on component mount
//   useEffect(() => {
//     const fetchProfile = async () => {
//       const token = localStorage.getItem("accessToken");
//       if (!token) {
//         navigate("/splash");
//         return;
//       }
//       try {
//         const response = await fetch("https://bt-coins.onrender.com/user/profile", {
//           method: "GET",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         });
//         if (!response.ok) throw new Error("Failed to fetch profile");
//         const data = await response.json();
//         setProfile(data);
//         setTotalTaps(data.total_coins || 0);
//         setCurrentStreak(data.streak?.current_streak || 0);

//         // Load electric boost and last tap time from localStorage
//         const savedBoost = localStorage.getItem("electricBoost");
//         const savedTapTime = localStorage.getItem("lastTapTime");
//         const initialBoost = savedBoost !== null ? parseInt(savedBoost, 10) : 1000;
//         lastTapTime.current = savedTapTime !== null ? parseInt(savedTapTime, 10) : Date.now();

//         // Calculate initial recharge based on time elapsed
//         const now = Date.now();
//         const timeSinceLastTap = now - lastTapTime.current;
//         if (timeSinceLastTap >= 3000) {
//           const pointsToAdd = Math.floor((timeSinceLastTap - 3000) / 3000); // Points after 3s pause
//           const newBoost = Math.min(initialBoost + pointsToAdd, maxElectricBoost);
//           setElectricBoost(newBoost);
//           localStorage.setItem("electricBoost", newBoost);
//         } else {
//           setElectricBoost(initialBoost);
//         }
//       } catch (err) {
//         console.error("Error fetching profile:", err);
//         navigate("/splash"); // Redirect on failure
//       }
//     };
//     fetchProfile();
//   }, [navigate, maxElectricBoost]); // Added maxElectricBoost to satisfy ESLint

//   // Sync tap count with backend every 2 seconds or on unmount
//   const updateBackend = useCallback(async () => {
//     if (tapCountSinceLastUpdate.current === 0) return;

//     const tapsToSync = tapCountSinceLastUpdate.current;
//     try {
//       const token = localStorage.getItem("accessToken");
//       const response = await fetch(
//         `https://bt-coins.onrender.com/update-coins?coins=${tapsToSync}`,
//         {
//           method: "POST",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );
//       if (response.ok) {
//         const data = await response.json();
//         if (data["current coins"] >= 0) {
//           setTotalTaps(data["current coins"]); // Trust backend total
//           setProfile((prev) => ({
//             ...prev,
//             level: data["current level"] || prev.level,
//           }));
//           tapCountSinceLastUpdate.current = 0;
//         }
//       } else {
//         console.error("Failed to sync coins:", await response.text());
//       }
//     } catch (err) {
//       console.error("Error syncing with backend:", err);
//     }
//   }, []);

//   // Set up backend sync interval and cleanup
//   useEffect(() => {
//     const interval = setInterval(updateBackend, 2000); // Sync every 2 seconds
//     return () => {
//       clearInterval(interval);
//       updateBackend(); // Sync remaining taps on unmount
//     };
//   }, [updateBackend]);

//   // Handle electric boost recharge
//   useEffect(() => {
//     const checkRecharge = () => {
//       const now = Date.now();
//       const timeSinceLastTap = now - lastTapTime.current;

//       // Start recharging only after 3 seconds have passed since last tap
//       if (timeSinceLastTap >= 3000 && electricBoost < maxElectricBoost) {
//         if (!rechargeInterval.current) {
//           rechargeInterval.current = setInterval(() => {
//             setElectricBoost((prev) => {
//               const newBoost = Math.min(prev + 1, maxElectricBoost);
//               localStorage.setItem("electricBoost", newBoost);
//               if (newBoost === maxElectricBoost) {
//                 clearInterval(rechargeInterval.current);
//                 rechargeInterval.current = null;
//               }
//               return newBoost;
//             });
//           }, 3000); // Recharge 1 point every 3 seconds
//         }
//       } else if (rechargeInterval.current) {
//         // Stop recharge if tapping resumes within 3 seconds
//         clearInterval(rechargeInterval.current);
//         rechargeInterval.current = null;
//       }
//     };

//     const interval = setInterval(checkRecharge, 1000); // Check every second
//     return () => {
//       clearInterval(interval);
//       if (rechargeInterval.current) {
//         clearInterval(rechargeInterval.current);
//         rechargeInterval.current = null;
//       }
//     };
//   }, [electricBoost, maxElectricBoost]); // Added maxElectricBoost to dependency array

//   /**
//    * Handles tap events on the big tap icon, increments total taps, and shows a +1 effect per tap.
//    * @param {Object} event - The tap or click event object.
//    */
//   const handleTap = (event) => {
//     event.preventDefault(); // Prevent default behavior

//     if (electricBoost <= 0) return; // Prevent taps if no boost remains

//     // Clear any existing recharge interval when tapping
//     if (rechargeInterval.current) {
//       clearInterval(rechargeInterval.current);
//       rechargeInterval.current = null;
//     }

//     // Update last tap time for recharge logic
//     lastTapTime.current = Date.now();
//     localStorage.setItem("lastTapTime", lastTapTime.current);

//     // Increment total taps and track for backend sync
//     setTotalTaps((prev) => prev + 1);
//     tapCountSinceLastUpdate.current += 1;

//     // Decrease electric boost and save to localStorage
//     setElectricBoost((prev) => {
//       const newBoost = Math.max(prev - 1, 0);
//       localStorage.setItem("electricBoost", newBoost);
//       return newBoost;
//     });

//     // Get tap coordinates relative to the tap icon
//     const tapIcon = event.currentTarget.getBoundingClientRect();
//     const tapX = (event.touches ? event.touches[0].clientX : event.clientX) - tapIcon.left;
//     const tapY = (event.touches ? event.touches[0].clientY : event.clientY) - tapIcon.top;

//     // Add a new tap effect without replacing existing ones
//     const newTapEffect = { id: Date.now(), x: tapX, y: tapY };
//     setTapEffects((prev) => [...prev, newTapEffect]);

//     // Trigger slight bounce animation
//     const tapElement = event.currentTarget;
//     tapElement.classList.add("tap-animation");
//     setTimeout(() => tapElement.classList.remove("tap-animation"), 200);

//     // Remove the tap effect after 1 second
//     setTimeout(() => {
//       setTapEffects((prev) => prev.filter((effect) => effect.id !== newTapEffect.id));
//     }, 1000);
//   };

//   return (
//     <div className="dashboard-container">
//       {/* Profile and Streak Section */}
//       <div className="profile1-streak-section">
//         <div className="profile1-section" onClick={() => navigate("/profile-screen")}>
//           <img src={telegramData.image_url} alt="Profile" className="profile1-picture" />
//           <div className="profile1-info">
//             <span className="profile1-username">{telegramData.username}</span>
//             <span className="profile1-level">
//               Lv. {profile.level}. {profile.level_name}
//             </span>
//           </div>
//         </div>
//         <div className="streak-section" onClick={() => navigate("/daily-streak-screen")}>
//           <img src={`${process.env.PUBLIC_URL}/streak.png`} alt="Streak Icon" className="streak-icon" />
//           <div className="streak-info">
//             <span className="streak-text">Current Streak</span>
//             <span className="streak-days">Day {currentStreak}</span>
//           </div>
//         </div>
//       </div>

//       {/* Navigation Frames */}
//       <div className="frames-section">
//         {[
//           { name: "Rewards", icon: "reward.png", path: "/reward-screen" },
//           { name: "Challenge", icon: "challenge.png", path: "/challenge-screen" },
//           { name: "Clan", icon: "clan.png", path: "/clan-screen" },
//           { name: "Leaderboard", icon: "leaderboard.png", path: "/leaderboard-screen" },
//         ].map((frame, index) => (
//           <div className="frame" key={index} onClick={() => navigate(frame.path)}>
//             <img src={`${process.env.PUBLIC_URL}/${frame.icon}`} alt={`${frame.name} Icon`} className="frame-icon" />
//             <span>{frame.name}</span>
//           </div>
//         ))}
//       </div>

//       {/* Total Taps Section */}
//       <div className="total-taps-section">
//         <p className="total-taps-text">Your Total Taps:</p>
//         <div className="total-taps-count">
//           <img className="tap-logo-small" src={`${process.env.PUBLIC_URL}/logo.png`} alt="Small Icon" />
//           <span>{totalTaps.toLocaleString()}</span>
//         </div>
//         <div
//           className="big-tap-icon"
//           onTouchStart={handleTap}
//           onMouseDown={handleTap}
//         >
//           <img className="tap-logo-big" src={`${process.env.PUBLIC_URL}/logo.png`} alt="Big Tap Icon" />
//           {/* Tap Effects */}
//           {tapEffects.map((effect) => (
//             <div
//               key={effect.id}
//               className="tap-effect"
//               style={{ top: `${effect.y}px`, left: `${effect.x}px` }}
//             >
//               +1
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Electric Boost Section */}
//       <div className="electric-boost-section">
//         <div className="electric-value">
//           <img src={`${process.env.PUBLIC_URL}/electric-icon.png`} alt="Electric Icon" className="electric-icon" />
//           <span>{Math.floor(electricBoost)}/{maxElectricBoost}</span>
//         </div>
//         <button className="boost-btn" onClick={() => navigate("/boost-screen")}>
//           <img src={`${process.env.PUBLIC_URL}/boostx2.png`} alt="Boost Icon" className="boost-icon" />
//           Boost
//         </button>
//       </div>

//       <Navigation />
//     </div>
//   );
// };

// export default Dashboard;


import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./Dashboard.css";

/**
 * Dashboard component displaying the main UI with tapping interaction and navigation links.
 * Syncs with Telegram WebApp for user data and backend for profile, streak, and coin updates.
 */
const Dashboard = () => {
  const navigate = useNavigate();

  // State for Telegram user data
  const [telegramData, setTelegramData] = useState({
    telegram_user_id: "",
    username: "User",
    image_url: `${process.env.PUBLIC_URL}/profile-picture.png`,
  });

  // State for user profile data
  const [profile, setProfile] = useState({ level: 1, level_name: "Beginner" });

  // State for streak and boost data
  const [currentStreak, setCurrentStreak] = useState(0);
  const [electricBoost, setElectricBoost] = useState(1000);
  const [maxElectricBoost] = useState(1000);

  // State for total taps and tap effects
  const [totalTaps, setTotalTaps] = useState(0);
  const [tapEffects, setTapEffects] = useState([]); // Multiple tap effects allowed

  // State for booster effects
  const [tapMultiplier, setTapMultiplier] = useState(1); // Default tap multiplier

  // Refs for tap and recharge management
  const tapCountSinceLastUpdate = useRef(0);
  const lastTapTime = useRef(Date.now()); // Track time of last tap
  const rechargeInterval = useRef(null); // Store recharge interval ID

  // Define resetBoosters before it's used
  const resetBoosters = () => {
    const resetState = {
      tapperBoost: { usesLeft: 3, isActive: false, endTime: null, resetTime: null },
      fullEnergy: { usesLeft: 3, isActive: false, resetTime: null },
    };
    localStorage.setItem("dailyBoosters", JSON.stringify(resetState));
    setTapMultiplier(1);
    setElectricBoost(maxElectricBoost);
    localStorage.setItem("electricBoost", maxElectricBoost);
  };

  // Initialize Telegram WebApp data on component mount and reset boosters if user changes
  useEffect(() => {
    const initTelegram = async () => {
      try {
        if (window.Telegram?.WebApp) {
          const user = window.Telegram.WebApp.initDataUnsafe.user;
          if (user) {
            setTelegramData({
              telegram_user_id: user.id,
              username: user.username || `User${user.id}`,
              image_url: user.photo_url || `${process.env.PUBLIC_URL}/profile-picture.png`,
            });
            const storedUserId = localStorage.getItem("telegram_user_id");
            if (storedUserId !== user.id.toString()) {
              localStorage.setItem("telegram_user_id", user.id);
              resetBoosters(); // Reset boosters if user ID changes
            }
          }
        }
      } catch (err) {
        console.error("Error syncing Telegram data:", err);
      }
    };
    initTelegram();
  }, []); // No dependencies since resetBoosters is defined above

  // Fetch user profile from backend on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/splash");
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
        if (!response.ok) throw new Error("Failed to fetch profile");
        const data = await response.json();
        setProfile(data);
        setTotalTaps(data.total_coins || 0);
        setCurrentStreak(data.streak?.current_streak || 0);

        // Load electric boost and last tap time from localStorage
        const savedBoost = localStorage.getItem("electricBoost");
        const savedTapTime = localStorage.getItem("lastTapTime");
        const initialBoost = savedBoost !== null ? parseInt(savedBoost, 10) : 1000;
        lastTapTime.current = savedTapTime !== null ? parseInt(savedTapTime, 10) : Date.now();

        // Calculate initial recharge based on time elapsed
        const now = Date.now();
        const timeSinceLastTap = now - lastTapTime.current;
        if (timeSinceLastTap >= 3000) {
          const pointsToAdd = Math.floor((timeSinceLastTap - 3000) / 3000); // Points after 3s pause
          const newBoost = Math.min(initialBoost + pointsToAdd, maxElectricBoost);
          setElectricBoost(newBoost);
          localStorage.setItem("electricBoost", newBoost);
        } else {
          setElectricBoost(initialBoost);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        navigate("/splash"); // Redirect on failure
      }
    };
    fetchProfile();
  }, [navigate, maxElectricBoost]);

  // Sync tap count with backend every 2 seconds or on unmount
  const updateBackend = useCallback(async () => {
    if (tapCountSinceLastUpdate.current === 0) return;

    const tapsToSync = tapCountSinceLastUpdate.current;
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `https://bt-coins.onrender.com/update-coins?coins=${tapsToSync}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data["current coins"] >= 0) {
          setTotalTaps(data["current coins"]); // Trust backend total
          setProfile((prev) => ({
            ...prev,
            level: data["current level"] || prev.level,
          }));
          tapCountSinceLastUpdate.current = 0;
        }
      } else {
        console.error("Failed to sync coins:", await response.text());
      }
    } catch (err) {
      console.error("Error syncing with backend:", err);
    }
  }, []);

  // Set up backend sync interval and cleanup
  useEffect(() => {
    const interval = setInterval(updateBackend, 2000); // Sync every 2 seconds
    return () => {
      clearInterval(interval);
      updateBackend(); // Sync remaining taps on unmount
    };
  }, [updateBackend]);

  // Handle electric boost recharge
  useEffect(() => {
    const checkRecharge = () => {
      const now = Date.now();
      const timeSinceLastTap = now - lastTapTime.current;

      // Start recharging only after 3 seconds have passed since last tap
      if (timeSinceLastTap >= 3000 && electricBoost < maxElectricBoost) {
        if (!rechargeInterval.current) {
          rechargeInterval.current = setInterval(() => {
            setElectricBoost((prev) => {
              const newBoost = Math.min(prev + 1, maxElectricBoost);
              localStorage.setItem("electricBoost", newBoost);
              if (newBoost === maxElectricBoost) {
                clearInterval(rechargeInterval.current);
                rechargeInterval.current = null;
              }
              return newBoost;
            });
          }, 3000); // Recharge 1 point every 3 seconds
        }
      } else if (rechargeInterval.current) {
        // Stop recharge if tapping resumes within 3 seconds
        clearInterval(rechargeInterval.current);
        rechargeInterval.current = null;
      }
    };

    const interval = setInterval(checkRecharge, 1000); // Check every second
    return () => {
      clearInterval(interval);
      if (rechargeInterval.current) {
        clearInterval(rechargeInterval.current);
        rechargeInterval.current = null;
      }
    };
  }, [electricBoost, maxElectricBoost]);

  // Handle Tapper Boost activation
  useEffect(() => {
    const handleTapperBoostActivated = () => {
      setTapMultiplier(2); // Double tap value for 20 seconds
      setTimeout(() => {
        setTapMultiplier(1); // Reset after 20 seconds
      }, 20000);
    };

    window.addEventListener("tapperBoostActivated", handleTapperBoostActivated);
    return () => window.removeEventListener("tapperBoostActivated", handleTapperBoostActivated);
  }, []);

  // Handle Full Energy claim
  useEffect(() => {
    const handleFullEnergyClaimed = () => {
      setElectricBoost(maxElectricBoost); // Instantly set to max
      localStorage.setItem("electricBoost", maxElectricBoost);
    };

    window.addEventListener("fullEnergyClaimed", handleFullEnergyClaimed);
    return () => window.removeEventListener("fullEnergyClaimed", handleFullEnergyClaimed);
  }, [maxElectricBoost]);

  /**
   * Handles tap events on the big tap icon, increments total taps with multiplier, and shows a tap effect.
   * @param {Object} event - The tap or click event object.
   */
  const handleTap = (event) => {
    event.preventDefault(); // Prevent default behavior

    if (electricBoost <= 0) return; // Prevent taps if no boost remains

    // Clear any existing recharge interval when tapping
    if (rechargeInterval.current) {
      clearInterval(rechargeInterval.current);
      rechargeInterval.current = null;
    }

    // Update last tap time for recharge logic
    lastTapTime.current = Date.now();
    localStorage.setItem("lastTapTime", lastTapTime.current);

    // Increment total taps with multiplier (base tap value = 1, doubled or quadrupled by boost)
    const tapValue = tapMultiplier; // Tap value reflects multiplier (1, 2, or 4 with future upgrades)
    setTotalTaps((prev) => prev + tapValue);
    tapCountSinceLastUpdate.current += tapValue;

    // Decrease electric boost by 1 only, regardless of tap value
    setElectricBoost((prev) => {
      const newBoost = Math.max(prev - 1, 0);
      localStorage.setItem("electricBoost", newBoost);
      return newBoost;
    });

    // Get tap coordinates relative to the tap icon
    const tapIcon = event.currentTarget.getBoundingClientRect();
    const tapX = (event.touches ? event.touches[0].clientX : event.clientX) - tapIcon.left;
    const tapY = (event.touches ? event.touches[0].clientY : event.clientY) - tapIcon.top;

    // Add a new tap effect without replacing existing ones, showing the boosted value
    const newTapEffect = { id: Date.now(), x: tapX, y: tapY };
    setTapEffects((prev) => [...prev, newTapEffect]);

    // Trigger slight bounce animation
    const tapElement = event.currentTarget;
    tapElement.classList.add("tap-animation");
    setTimeout(() => tapElement.classList.remove("tap-animation"), 200);

    // Remove the tap effect after 1 second
    setTimeout(() => {
      setTapEffects((prev) => prev.filter((effect) => effect.id !== newTapEffect.id));
    }, 1000);
  };

  return (
    <div className="dashboard-container">
      {/* Profile and Streak Section */}
      <div className="profile1-streak-section">
        <div className="profile1-section" onClick={() => navigate("/profile-screen")}>
          <img src={telegramData.image_url} alt="Profile" className="profile1-picture" />
          <div className="profile1-info">
            <span className="profile1-username">{telegramData.username}</span>
            <span className="profile1-level">
              Lv. {profile.level}. {profile.level_name}
            </span>
          </div>
        </div>
        <div className="streak-section" onClick={() => navigate("/daily-streak-screen")}>
          <img src={`${process.env.PUBLIC_URL}/streak.png`} alt="Streak Icon" className="streak-icon" />
          <div className="streak-info">
            <span className="streak-text">Current Streak</span>
            <span className="streak-days">Day {currentStreak}</span>
          </div>
        </div>
      </div>

      {/* Navigation Frames */}
      <div className="frames-section">
        {[
          { name: "Rewards", icon: "reward.png", path: "/reward-screen" },
          { name: "Challenge", icon: "challenge.png", path: "/challenge-screen" },
          { name: "Clan", icon: "clan.png", path: "/clan-screen" },
          { name: "Leaderboard", icon: "leaderboard.png", path: "/leaderboard-screen" },
        ].map((frame, index) => (
          <div className="frame" key={index} onClick={() => navigate(frame.path)}>
            <img src={`${process.env.PUBLIC_URL}/${frame.icon}`} alt={`${frame.name} Icon`} className="frame-icon" />
            <span>{frame.name}</span>
          </div>
        ))}
      </div>

      {/* Total Taps Section */}
      <div className="total-taps-section">
        <p className="total-taps-text">Your Total Taps:</p>
        <div className="total-taps-count">
          <img className="tap-logo-small" src={`${process.env.PUBLIC_URL}/logo.png`} alt="Small Icon" />
          <span>{totalTaps.toLocaleString()}</span>
        </div>
        <div
          className="big-tap-icon"
          onTouchStart={handleTap}
          onMouseDown={handleTap}
        >
          <img className="tap-logo-big" src={`${process.env.PUBLIC_URL}/logo.png`} alt="Big Tap Icon" />
          {/* Tap Effects */}
          {tapEffects.map((effect) => (
            <div
              key={effect.id}
              className="tap-effect"
              style={{ top: `${effect.y}px`, left: `${effect.x}px` }}
            >
              +{tapMultiplier} {/* Display the boosted value */}
            </div>
          ))}
        </div>
      </div>

      {/* Electric Boost Section */}
      <div className="electric-boost-section">
        <div className="electric-value">
          <img src={`${process.env.PUBLIC_URL}/electric-icon.png`} alt="Electric Icon" className="electric-icon" />
          <span>{Math.floor(electricBoost)}/{maxElectricBoost}</span>
        </div>
        <button className="boost-btn" onClick={() => navigate("/boost-screen")}>
          <img src={`${process.env.PUBLIC_URL}/boostx2.png`} alt="Boost Icon" className="boost-icon" />
          Boost
        </button>
      </div>

      <Navigation />
    </div>
  );
};

export default Dashboard;