// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import AppBar from "../components/AppBar";
// import Navigation from "../components/Navigation"; 
// import "./Dashboard.css"; 
// import "../components/Navigation.css"; 

// const Dashboard = () => {
//   const navigate = useNavigate();

//   // States
//   const [telegramData, setTelegramData] = useState({
//     telegram_user_id: "",
//     username: "User",
//     image_url: "",
//   });
//   const [currentStreak, /*setCurrentStreak*/] = useState(0);
//   const [totalTaps, setTotalTaps] = useState(0);
//   const [electricBoost, setElectricBoost] = useState(1000);
//   const [level, /*setLevel*/] = useState(1);
//   const [tapAnimation, setTapAnimation] = useState(false);
//   const [boostAnimation, setBoostAnimation] = useState(false);

//   // Fetch Telegram data on mount
//   useEffect(() => {
//     if (window.Telegram && window.Telegram.WebApp) {
//       const user = window.Telegram.WebApp.initDataUnsafe.user;
  
//       if (user) {
//         const telegramInfo = {
//           telegram_user_id: user.id,
//           username: user.username || `User${user.id}`,
//           image_url: user.photo_url || `${process.env.PUBLIC_URL}/profile-picture.png`,
//         };
  
//         setTelegramData(telegramInfo);
  
//         // Send user data to backend for validation
//         fetch("https://bored-tap-api.onrender.com/sign-up", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(telegramInfo),
//         })
//           .then((res) => res.json())
//           .then((data) => {
//             if (data.success) {
//               console.log("User authenticated");
//             } else {
//               console.error("Authentication failed:", data.message);
//             }
//           })
//           .catch((err) => console.error("Error syncing Telegram data:", err));
//       } else {
//         console.error("Telegram user data not available");
//       }
//     }
//   }, []);

//   // Handle tapping on the big logo
//   const handleTap = (event) => {
//     const fingersCount = event.touches?.length || 1; // Count fingers on tap
//     setTotalTaps((prev) => prev + fingersCount);
//     setElectricBoost((prev) => (prev > 0 ? prev - fingersCount : prev));

//     // Show tap animation
//     setTapAnimation(true);
//     setTimeout(() => setTapAnimation(false), 500);

//     // Sync tap action with backend
//     fetch("/api/user/tap", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ telegramId: telegramData.id, taps: fingersCount }),
//     }).catch((err) => console.error("Failed to sync tap:", err));
//   };

//   // Electric boost recharge logic
//   useEffect(() => {
//     if (electricBoost === 0) {
//       const rechargeInterval = setInterval(() => {
//         setElectricBoost(1000); // Recharge to full every 30 minutes
//       }, 30 * 60 * 1000); // 30 minutes in milliseconds
//       return () => clearInterval(rechargeInterval);
//     }
//   }, [electricBoost]);

//   // Trigger boost animation when electric value changes
//   useEffect(() => {
//     setBoostAnimation(true);
//     setTimeout(() => setBoostAnimation(false), 300);
//   }, [electricBoost]);

//   // Frames navigation handler
//   const handleFrameClick = (path) => {
//     navigate(path);
//   };

//   return (
//     <div className="dashboard-container">
//       {/* AppBar Section */}
//       <AppBar title="Dashboard" />
  
//       {/* Profile and Streak Section */}
//       <div className="profile-streak-section">
//         {/* Profile Section */}
//           <div
//             className="profile-section"
//             onClick={() => navigate("/profile-screen")} // Navigate to Profile Screen on click
//           >
//             <img
//               src={telegramData.photoUrl}
//               alt="Profile"
//               className="profile-picture"
//             />
//             <div className="profile-info">
//               <span className="profile-username">{telegramData.username}</span>
//               <span className="profile-level">Lvl {level}</span>
//             </div>
//           </div>

  
//         {/* Streak Section */}
//         <div
//           className="streak-section"
//           onClick={() => navigate("/daily-streak-screen")}
//         >
//           <img
//             src={`${process.env.PUBLIC_URL}/streak.png`}
//             alt="Streak Icon"
//             className="streak-icon"
//           />
//           <div className="streak-info">
//             <span className="streak-text">Current Streak</span>
//             <span className="streak-days">Day {currentStreak || 1}</span>
//           </div>
//         </div>
//       </div>


//       {/* Frames Section */}
//       <div className="frames-section">
//         {[
//           { name: "Rewards", icon: "reward.png", path: "/reward-screen" },
//           { name: "Challenge", icon: "challenge.png", path: "/challenge-screen" },
//           { name: "Clan", icon: "clan.png", path: "/clan-screen" },
//           { name: "Leaderboard", icon: "leaderboard.png", path: "/leaderboard-screen" },
//         ].map((frame, index) => (
//           <div
//             className="frame"
//             key={index}
//             onClick={() => handleFrameClick(frame.path)} // Navigate on click
//           >
//             <img
//               src={`${process.env.PUBLIC_URL}/${frame.icon}`}
//               alt={`${frame.name} Icon`}
//               className="frame-icon"
//             />
//             <span>{frame.name}</span>
//           </div>
//         ))}
//       </div>

//       {/* Total Taps Section */}
//       <div className="total-taps-section">
//         <p className="total-taps-text">Your Total Taps:</p>
//         <div className="total-taps-count">
//           <img
//             className="tap-logo-small"
//             src={`${process.env.PUBLIC_URL}/logo.png`}
//             alt="Small Icon"
//           />
//           <span>{totalTaps}</span>
//         </div>
//         <div
//           className={`big-tap-icon ${tapAnimation ? "tap-animation" : ""}`}
//           onTouchStart={handleTap} // Detect multi-finger touch
//           onClick={handleTap} // Fallback for single clicks
//         >
//           <img
//             className="tap-logo-big"
//             src={`${process.env.PUBLIC_URL}/logo.png`}
//             alt="Big Tap Icon"
//           />
//           {tapAnimation && <div className="tap-bonus">+1</div>}
//         </div>
//       </div>

//       {/* Electric & Boost Section */}
//       <div className="electric-boost-section">
//         <div className={`electric-value ${boostAnimation ? "boost-animation" : ""}`}>
//           <img
//             src={`${process.env.PUBLIC_URL}/electric-icon.png`}
//             alt="Electric Icon"
//             className="electric-icon"
//           />
//           <span>{electricBoost}/1000</span>
//         </div>
//         <button className="boost-btn" onClick={() => navigate("/boost-screen")}>
//           <img
//             src={`${process.env.PUBLIC_URL}/boostx2.png`}
//             alt="Boost Icon"
//             className="boost-icon"
//           />
//           Boost
//         </button>
//       </div>

//       {/* Navigation Section */}
//       <Navigation />
//     </div>
//   );
// };

// export default Dashboard;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppBar from "../components/AppBar";
import Navigation from "../components/Navigation";
import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  
  // Move all useState hooks to the top level
  const [telegramData, setTelegramData] = useState({
    telegram_user_id: "",
    username: "User",
    image_url: "",
  });
  
  // Using const for values that won't change in this version
  const currentStreak = 0;  // Will be implemented with backend integration
  const level = 1;  // Will be implemented with backend integration
  
  const [totalTaps, setTotalTaps] = useState(0);
  const [electricBoost, setElectricBoost] = useState(1000);
  const [tapAnimation, setTapAnimation] = useState(false);
  const [boostAnimation, setBoostAnimation] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialization effect
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        if (window.Telegram?.WebApp) {
          const user = window.Telegram.WebApp.initDataUnsafe.user;
          
          if (user) {
            const telegramInfo = {
              telegram_user_id: user.id,
              username: user.username || `User${user.id}`,
              image_url: user.photo_url || `${process.env.PUBLIC_URL}/profile-picture.png`,
            };

            setTelegramData(telegramInfo);

            // Send user data to backend for validation
            const response = await fetch("https://bored-tap-api.onrender.com/sign-up", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(telegramInfo),
            });

            const data = await response.json();
            if (data.success) {
              console.log("User authenticated");
            } else {
              console.error("Authentication failed:", data.message);
            }
          } else {
            console.error("Telegram user data not available");
          }
        }
      } catch (err) {
        console.error("Error syncing Telegram data:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, []);

  // Handle tap effect
  const handleTap = (event) => {
    const fingersCount = event.touches?.length || 1;
    setTotalTaps((prev) => prev + fingersCount);
    setElectricBoost((prev) => (prev > 0 ? prev - fingersCount : prev));
    setTapAnimation(true);
    setTimeout(() => setTapAnimation(false), 500);
  };

  // Electric boost recharge effect
  useEffect(() => {
    if (electricBoost === 0) {
      const rechargeInterval = setInterval(() => {
        setElectricBoost(1000);
      }, 30 * 60 * 1000);
      return () => clearInterval(rechargeInterval);
    }
  }, [electricBoost]);

  // Boost animation effect
  useEffect(() => {
    if (boostAnimation) {
      const timer = setTimeout(() => setBoostAnimation(false), 300);
      return () => clearTimeout(timer);
    }
  }, [boostAnimation]);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <AppBar title="Dashboard" />
      
      <div className="profile-streak-section">
        <div className="profile-section" onClick={() => navigate("/profile-screen")}>
          <img
            src={telegramData.image_url}
            alt="Profile"
            className="profile-picture"
          />
          <div className="profile-info">
            <span className="profile-username">{telegramData.username}</span>
            <span className="profile-level">Lvl {level}</span>
          </div>
        </div>

        <div className="streak-section" onClick={() => navigate("/daily-streak-screen")}>
          <img
            src={`${process.env.PUBLIC_URL}/streak.png`}
            alt="Streak Icon"
            className="streak-icon"
          />
          <div className="streak-info">
            <span className="streak-text">Current Streak</span>
            <span className="streak-days">Day {currentStreak}</span>
          </div>
        </div>
      </div>

      {/* Rest of the component remains the same */}
      <div className="frames-section">
        {[
          { name: "Rewards", icon: "reward.png", path: "/reward-screen" },
          { name: "Challenge", icon: "challenge.png", path: "/challenge-screen" },
          { name: "Clan", icon: "clan.png", path: "/clan-screen" },
          { name: "Leaderboard", icon: "leaderboard.png", path: "/leaderboard-screen" },
        ].map((frame, index) => (
          <div
            className="frame"
            key={index}
            onClick={() => navigate(frame.path)}
          >
            <img
              src={`${process.env.PUBLIC_URL}/${frame.icon}`}
              alt={`${frame.name} Icon`}
              className="frame-icon"
            />
            <span>{frame.name}</span>
          </div>
        ))}
      </div>

      <div className="total-taps-section">
        <p className="total-taps-text">Your Total Taps:</p>
        <div className="total-taps-count">
          <img
            className="tap-logo-small"
            src={`${process.env.PUBLIC_URL}/logo.png`}
            alt="Small Icon"
          />
          <span>{totalTaps}</span>
        </div>
        <div
          className={`big-tap-icon ${tapAnimation ? "tap-animation" : ""}`}
          onTouchStart={handleTap}
          onClick={handleTap}
        >
          <img
            className="tap-logo-big"
            src={`${process.env.PUBLIC_URL}/logo.png`}
            alt="Big Tap Icon"
          />
          {tapAnimation && <div className="tap-bonus">+1</div>}
        </div>
      </div>

      <div className="electric-boost-section">
        <div className={`electric-value ${boostAnimation ? "boost-animation" : ""}`}>
          <img
            src={`${process.env.PUBLIC_URL}/electric-icon.png`}
            alt="Electric Icon"
            className="electric-icon"
          />
          <span>{electricBoost}/1000</span>
        </div>
        <button className="boost-btn" onClick={() => navigate("/boost-screen")}>
          <img
            src={`${process.env.PUBLIC_URL}/boostx2.png`}
            alt="Boost Icon"
            className="boost-icon"
          />
          Boost
        </button>
      </div>

      <Navigation />
    </div>
  );
};

export default Dashboard;