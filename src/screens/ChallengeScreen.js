// import React, { useState } from "react";
// import Navigation from "../components/Navigation";
// import "./ChallengeScreen.css";

// const ChallengeScreen = () => {
//   const [activeTab, setActiveTab] = useState("Open Challenges");

//   const handleTabClick = (tab) => {
//     setActiveTab(tab);
//   };

//   const handleClaimClick = (challenge) => {
//     console.log(`Claiming reward for challenge: ${challenge}`);
//   };

//   const challengesData = {
//     "Open Challenges": [
//       {
//         title: "Tap Marathon",
//         description: "Achieve 50,000 taps within 24hrs.",
//         reward: "2000",
//         time: "10:46:34",
//         progress: 100,
//         button: { label: "Claim", bgColor: "#fff", textColor: "#000" },
//         iconSize: 50,
//         smallIconSize: 16,
//       },
//       {
//         title: "Daily Leaderboard Race",
//         description: "Attain Top 3 on weekly leaderboard.",
//         reward: "5000",
//         time: "1 day 21hr 20mins",
//         progress: 35,
//         button: { label: "Claim", bgColor: "#000", textColor: "orange" },
//         iconSize: 50,
//         smallIconSize: 16,
//       },
//       {
//         title: "Invite Blitz",
//         description: "Invite 3 friends within 12hrs.",
//         reward: "10,000",
//         time: "10:46:34",
//         progress: 20,
//         button: { label: "Claim", bgColor: "#000", textColor: "orange" },
//         iconSize: 50,
//         smallIconSize: 16,
//       },
//     ],
//     "Completed Challenges": [
//       {
//         title: "Tap Marathon",
//         description: "Achieve 50,000 taps within 24hrs.",
//         reward: "2000",
//         status: "Win",
//         progress: 100,
//         button: { label: "✔", bgColor: "#000", textColor: "orange" },
//         iconSize: 50,
//         smallIconSize: 16,
//       },
//       {
//         title: "Daily Leaderboard Race",
//         description: "Attain Top 3 on weekly leaderboard.",
//         reward: "5000",
//         status: "Win",
//         progress: 100,
//         button: { label: "✔", bgColor: "#000", textColor: "orange" },
//         iconSize: 50,
//         smallIconSize: 16,
//       },
//       {
//         title: "Invite Blitz",
//         description: "Invite 3 friends within 12hrs.",
//         reward: "10,000",
//         status: "Expired",
//         progress: 0,
//         button: { label: "✔", bgColor: "#000", textColor: "orange" },
//         iconSize: 50,
//         smallIconSize: 16,
//       },
//     ],
//   };

//   const challenges = challengesData[activeTab];

//   return (
//     <div className="challenge-screen">

//       {/* Body */}
//       <div className="challenge-body">
//         {/* Total Taps */}
//         <div className="total-taps">
//           <p>Your Total Taps:</p>
//           <div className="taps-display">
//             <img
//               src={`${process.env.PUBLIC_URL}/logo.png`}
//               alt="Logo"
//               className="taps-logo"
//             />
//             <span className="taps-number">3,289,198</span>
//           </div>
//           <p className="tap-rewards">
//             Earn BT-coin rewards by completing simple tasks.
//           </p>
//           <p className="task-link">How tasks work?</p>
//         </div>

//         {/* Pagination */}
//         <div className="pagination">
//           {Object.keys(challengesData).map((tab) => (
//             <span
//               key={tab}
//               className={`pagination-tab ${
//                 activeTab === tab ? "active" : ""
//               }`}
//               onClick={() => handleTabClick(tab)}
//             >
//               {tab}
//             </span>
//           ))}
//         </div>

//         {/* Challenge Cards */}
//         <div className="challenge-cards">
//           {challenges.map((challenge, index) => (
//             <div className="challenge-card" key={index}>
//               <div className="challenge-left">
//                 <img
//                   src={`${process.env.PUBLIC_URL}/logo.png`}
//                   alt={challenge.title}
//                   className="challenge-icon"
//                   style={{
//                     width: challenge.iconSize,
//                     height: challenge.iconSize,
//                   }}
//                 />
//                 <div className="challenge-info">
//                   <p className="challenge-title">{challenge.title}</p>
//                   <p className="challenge-description">{challenge.description}</p>
//                   <div className="challenge-meta">
//                     <img
//                       src={`${process.env.PUBLIC_URL}/logo.png`}
//                       alt="Coin Icon"
//                       className="small-icon"
//                       style={{
//                         width: challenge.smallIconSize,
//                         height: challenge.smallIconSize,
//                       }}
//                     />
//                     <span>{challenge.reward}</span>
//                     <span className="challenge-time">{challenge.time || challenge.status}</span>
//                   </div>
//                   <div className="progress-bar">
//                     <div
//                       className="progress-fill"
//                       style={{ width: `${challenge.progress}%` }}
//                     ></div>
//                   </div>
//                 </div>
//               </div>
//               <button
//                 className="challenge-cta"
//                 style={{
//                   backgroundColor: challenge.button.bgColor,
//                   color: challenge.button.textColor,
//                 }}
//                 onClick={() => handleClaimClick(challenge.title)}
//               >
//                 {challenge.button.label}
//               </button>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Navigation */}
//       <Navigation />
//     </div>
//   );
// };

// export default ChallengeScreen;
import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import "./ChallengeScreen.css";

const ChallengeScreen = () => {
  const [activeTab, setActiveTab] = useState("Open Challenges");
  const [totalTaps, setTotalTaps] = useState(0);
  const [challengesData, setChallengesData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("No access token found");
        return;
      }

      try {
        // Fetch user profile for total taps
        const profileResponse = await fetch("https://bored-tap-api.onrender.com/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!profileResponse.ok) {
          throw new Error(`HTTP error! status: ${profileResponse.status}`);
        }

        const profileData = await profileResponse.json();
        setTotalTaps(profileData.total_coins); // Assuming total_coins is the field for total taps in the profile

        // Fetch challenges data (assuming endpoint exists)
        const challengesResponse = await fetch("YOUR_CHALLENGES_ENDPOINT", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!challengesResponse.ok) {
          throw new Error("Failed to fetch challenges");
        }

        const challenges = await challengesResponse.json();
        setChallengesData({
          "Open Challenges": challenges.open || [],
          "Completed Challenges": challenges.completed || [],
        });
      } catch (err) {
        console.error("Error fetching data:", err);
      } 
      // finally {
      //   setLoading(false);
      // }
    };

    fetchData();
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleClaimClick = (challenge) => {
    console.log(`Claiming reward for challenge: ${challenge}`);
  };

  const challenges = challengesData[activeTab] || [];

  // if (loading) {
  //   return <div className="loading">Loading challenges...</div>;
  // }

  return (
    <div className="challenge-screen">

      {/* Body */}
      <div className="challenge-body">
        {/* Total Taps */}
        <div className="total-taps">
          <p>Your Total Taps:</p>
          <div className="taps-display">
            <img
              src={`${process.env.PUBLIC_URL}/logo.png`}
              alt="Logo"
              className="taps-logo"
            />
            <span className="taps-number">{totalTaps.toLocaleString()}</span>
          </div>
          <p className="tap-rewards">
            Earn BT-coin rewards by completing simple tasks.
          </p>
          <p className="task-link">How tasks work?</p>
        </div>

        {/* Pagination */}
        <div className="pagination">
          {Object.keys(challengesData).map((tab) => (
            <span
              key={tab}
              className={`pagination-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => handleTabClick(tab)}
            >
              {tab}
            </span>
          ))}
        </div>

        {/* Challenge Cards */}
        <div className="challenge-cards">
          {challenges.length > 0 ? (
            challenges.map((challenge, index) => (
              <div className="challenge-card" key={index}>
                <div className="challenge-left">
                  <img
                    src={`${process.env.PUBLIC_URL}/${challenge.icon || 'logo.png'}`}
                    alt={challenge.title}
                    className="challenge-icon"
                    style={{
                      width: challenge.iconSize || 50,
                      height: challenge.iconSize || 50,
                    }}
                  />
                  <div className="challenge-info">
                    <p className="challenge-title">{challenge.title}</p>
                    <p className="challenge-description">{challenge.description}</p>
                    <div className="challenge-meta">
                      <img
                        src={`${process.env.PUBLIC_URL}/logo.png`}
                        alt="Coin Icon"
                        className="small-icon"
                        style={{
                          width: challenge.smallIconSize || 16,
                          height: challenge.smallIconSize || 16,
                        }}
                      />
                      <span>{challenge.reward}</span>
                      <span className="challenge-time">{challenge.time || challenge.status}</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${challenge.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                <button
                  className="challenge-cta"
                  style={{
                    backgroundColor: challenge.button?.bgColor || "#fff",
                    color: challenge.button?.textColor || "#000",
                  }}
                  onClick={() => handleClaimClick(challenge.title)}
                >
                  {challenge.button?.label || "Claim"}
                </button>
              </div>
            ))
          ) : (
            <p className="no-challenges">No challenges available yet.</p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default ChallengeScreen;