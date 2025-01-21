import React from "react";
import Navigation from "../components/Navigation";
import "./LevelScreen.css";

const LevelScreen = () => {

  const levelData = [
    { label: "Novice", value: "0", icon: `${process.env.PUBLIC_URL}/novice.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 1 },
    { label: "Explorer", value: "5000", icon: `${process.env.PUBLIC_URL}/explorer.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 2 },
    { label: "Apprentice", value: "25000", icon: `${process.env.PUBLIC_URL}/apprentice.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 3 },
    { label: "Warrior", value: "100000", icon: `${process.env.PUBLIC_URL}/warrior.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 4 },
    { label: "Master", value: "500000", icon: `${process.env.PUBLIC_URL}/master.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 5 },
    { label: "Champion", value: "1000000", icon: `${process.env.PUBLIC_URL}/champion.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 6 },
    { label: "Tactician", value: "20000000", icon: `${process.env.PUBLIC_URL}/tactician.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 7 },
    { label: "Specialist", value: "100000000", icon: `${process.env.PUBLIC_URL}/specialist.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 8 },
    { label: "Conqueror", value: "500000000", icon: `${process.env.PUBLIC_URL}/conqueror.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 9 },
    { label: "Legend", value: "1000000000", icon: `${process.env.PUBLIC_URL}/legend.png`, smallIcon: `${process.env.PUBLIC_URL}/logo.png`, cardNumber: 10 },
  ];

  return (
    <div className="level-screen">

      {/* Centralized Level Icon */}
      <div className="level-header">
        <img
          src={`${process.env.PUBLIC_URL}/novice.png`}
          alt="Level Icon"
          className="level-icon"
        />
        <div className="level-text">Lvl 4 Warrior</div>
      </div>

      {/* Progress and Coins */}
      <div className="progress-info">
        <span className="next-level">Next level: 5</span>
        <div className="coin-info">
          <img
            src={`${process.env.PUBLIC_URL}/logo.png`}
            alt="Coin Icon"
            className="coin-icon"
          />
          <span className="coin-text">500,000 (327,938 left)</span>
        </div>
      </div>

      {/* Loading Bar */}
      <div className="loading-bar">
        <div className="loader" style={{ width: "35%" }}></div>
      </div>

      {/* Data Cards */}
      <div className="level-data-cards">
        {levelData.map((item, index) => (
          <div
            key={index}
            className="level-data-card"
            style={{
              backgroundColor: index >= 4 ? "transparent" : "#414141",
              border: index >= 4 ? "0px solid #fff" : "none",
            }}
          >
            <div className="level-data-left">
              <img src={item.icon} alt={item.label} className="level-card-icon" />
              <div className="level-info">
                <div className="level-label">{item.label}</div>
                <div className="level-small-icon">
                  <img src={item.smallIcon} alt="Coin Icon" className="small-coin-icon" />
                  <span>{item.value}</span>
                </div>
              </div>
            </div>
            <div className="level-data-right">
              <div className="card-number">{item.cardNumber}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default LevelScreen;
// import React, { useState, useEffect } from "react";
// import Navigation from "../components/Navigation";
// import "./LevelScreen.css";

// const LevelScreen = () => {
//   const [levelData, setLevelData] = useState([]);
//   const [userLevel, setUserLevel] = useState(null);
//   const [userTaps, setUserTaps] = useState(0);
//   // const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchLevelData = async () => {
//       const token = localStorage.getItem("accessToken");
//       if (!token) {
//         console.error("No access token found");
//         return;
//       }

//       try {
//         // Fetch level data from backend (assuming there's an endpoint for this)
//         const levelsResponse = await fetch("YOUR_LEVEL_DATA_ENDPOINT", {
//           method: "GET",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         });
//         if (!levelsResponse.ok) throw new Error("Failed to fetch level data");
//         const levels = await levelsResponse.json();
//         setLevelData(levels);

//         // Fetch user profile for current level, taps, etc.
//         const profileResponse = await fetch("https://bored-tap-api.onrender.com/user/profile", {
//           method: "GET",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         });
//         if (!profileResponse.ok) throw new Error("Failed to fetch user profile");
//         const profile = await profileResponse.json();
//         setUserLevel(profile.level);
//         setUserTaps(profile.total_coins); // Assuming total_coins represent taps
//       } catch (err) {
//         console.error("Error fetching data:", err);
//       } 
//       // finally {
//       //   setLoading(false);
//       // }
//     };

//     fetchLevelData();
//   }, []);

//   // Find the current level from levelData based on userLevel
//   const currentLevelInfo = levelData.find(level => level.cardNumber === userLevel) || { icon: `${process.env.PUBLIC_URL}/novice.png`, label: 'Novice', value: '0' };

//   // Calculate next level and remaining taps
//   const nextLevel = userLevel < levelData.length ? userLevel + 1 : userLevel;
//   const nextLevelInfo = levelData.find(level => level.cardNumber === nextLevel) || { value: '0' };
//   const tapsToNextLevel = parseInt(nextLevelInfo.value) - userTaps;
//   const progressPercentage = (userTaps / parseInt(nextLevelInfo.value)) * 100;

//   // if (loading) {
//   //   return <div className="loading">Loading levels...</div>;
//   // }

//   return (
//     <div className="level-screen">

//       {/* Centralized Level Icon */}
//       <div className="level-header">
//         <img
//           src={currentLevelInfo.icon}
//           alt="Level Icon"
//           className="level-icon"
//         />
//         <div className="level-text">Lvl {userLevel} {currentLevelInfo.label}</div>
//       </div>

//       {/* Progress and Coins */}
//       <div className="progress-info">
//         <span className="next-level">Next level: {nextLevel}</span>
//         <div className="coin-info">
//           <img
//             src={`${process.env.PUBLIC_URL}/logo.png`}
//             alt="Coin Icon"
//             className="coin-icon"
//           />
//           <span className="coin-text">{userTaps.toLocaleString()} ({Math.max(tapsToNextLevel, 0).toLocaleString()} left)</span>
//         </div>
//       </div>

//       {/* Loading Bar */}
//       <div className="loading-bar">
//         <div className="loader" style={{ width: `${Math.min(progressPercentage, 100)}%` }}></div>
//       </div>

//       {/* Data Cards */}
//       <div className="level-data-cards">
//         {levelData.map((item, index) => (
//           <div
//             key={index}
//             className="level-data-card"
//             style={{
//               backgroundColor: index >= 4 ? "transparent" : "#414141",
//               border: index >= 4 ? "0px solid #fff" : "none",
//             }}
//           >
//             <div className="level-data-left">
//               <img src={item.icon} alt={item.label} className="level-card-icon" />
//               <div className="level-info">
//                 <div className="level-label">{item.label}</div>
//                 <div className="level-small-icon">
//                   <img src={item.smallIcon || `${process.env.PUBLIC_URL}/logo.png`} alt="Coin Icon" className="small-coin-icon" />
//                   <span>{item.value}</span>
//                 </div>
//               </div>
//             </div>
//             <div className="level-data-right">
//               <div className="card-number">{item.cardNumber}</div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Navigation */}
//       <Navigation />
//     </div>
//   );
// };

// export default LevelScreen;