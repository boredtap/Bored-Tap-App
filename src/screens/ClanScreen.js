import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./ClanScreen.css";
import { fetchClanImage } from "../utils/fetchImage"; // Adjust path if needed

// const ClanScreen = () => {
//   const navigate = useNavigate();
//   const [topClans, setTopClans] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchClanData = async () => {
//       setLoading(true);
//       try {
//         const token = localStorage.getItem("accessToken");
//         if (!token) {
//           navigate("/splash");
//           return;
//         }

//         const profileResponse = await fetch("https://bt-coins.onrender.com/user/profile", {
//           method: "GET",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         });
//         if (!profileResponse.ok) throw new Error("Failed to fetch user profile");
//         const profileData = await profileResponse.json();

//         if (profileData.clan.id) {
//           navigate("/clan-details-screen");
//           return;
//         }

//         const topClansResponse = await fetch("https://bt-coins.onrender.com/user/clan/top_clans", {
//           method: "GET",
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         });
//         if (!topClansResponse.ok) throw new Error("Failed to fetch top clans");
//         const topClansData = await topClansResponse.json();
//         console.log("Raw top clans data:", topClansData);

//         const mappedTopClans = await Promise.all(
//           topClansData.map(async (clan, index) => {
//             const imageUrl = await fetchClanImage(clan.image_id, token);
//             return {
//               id: clan.id || index + 1,
//               name: clan.name,
//               rank: clan.rank || `#${index + 1}`, // Use backend rank or fallback
//               total_coins: clan.total_coins ? clan.total_coins.toLocaleString() : "0", // Total coins earned
//               rankIcon: `${process.env.PUBLIC_URL}/${
//                 index === 0 ? "first-icon.png" : index === 1 ? "second-icon.png" : "third-icon.png"
//               }`,
//               cardIcon: imageUrl,
//             };
//           })
//         );

//         setTopClans(mappedTopClans);
//         setLoading(false);
//       } catch (err) {
//         setError(err.message);
//         setLoading(false);
//         console.error("Error:", err.message);
//       }
//     };

//     fetchClanData();
//   }, [navigate]);

//   const handleCreateClick = () => {
//     navigate("/clan-create-screen");
//   };

//   const handleJoinClick = () => {
//     navigate("/clan-list-screen");
//   };

//   const handleClanClick = (clanId) => {
//     const clan = topClans.find((c) => c.id === clanId);
//     navigate(`/clan-preview/${clanId}`, { state: { clan } });
//   };

//   useEffect(() => {
//     const checkPendingClan = async () => {
//       const token = localStorage.getItem("accessToken");
//       if (!token) {
//         navigate("/splash");
//         return;
//       }

      
  
//       const profileResponse = await fetch("https://bt-coins.onrender.com/user/profile", {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });
//       if (!profileResponse.ok) throw new Error("Failed to fetch user profile");
//       const profileData = await profileResponse.json();
  
//       if (profileData.clan.id) {
//         navigate("/clan-details-screen");
//         return;
//       }
  
//       const pendingClan = localStorage.getItem("pendingClan");
//       if (pendingClan) {
//         setPendingClan(true);
//       } else {
//         setPendingClan(false);
//       }
  
//       const topClansResponse = await fetch("https://bt-coins.onrender.com/user/clan/top_clans", {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//       });
//       if (!topClansResponse.ok) throw new Error("Failed to fetch top clans");
//       const topClansData = await topClansResponse.json();
//       console.log("Raw top clans data:", topClansData);
  
//       const mappedTopClans = await Promise.all(
//         topClansData.map(async (clan, index) => {
//           const imageUrl = await fetchClanImage(clan.image_id, token);
//           return {
//             id: clan.id || index + 1,
//             name: clan.name,
//             rank: clan.rank || `#${index + 1}`, // Use backend rank or fallback
//             total_coins: clan.total_coins ? clan.total_coins.toLocaleString() : "0", // Total coins earned
//             rankIcon: `${process.env.PUBLIC_URL}/${
//               index === 0 ? "first-icon.png" : index === 1 ? "second-icon.png" : "third-icon.png"
//             }`,
//             cardIcon: imageUrl,
//           };
//         })
//       );
  
//       setTopClans(mappedTopClans);
//       setLoading(false);
//     };
  
//     checkPendingClan();
//   }, [navigate]);
  
//   const [pendingClan, setPendingClan] = useState(false);
  
//   return (
//     <div className="clan-screen">
//       <div className="clan-header">
//         <img src={`${process.env.PUBLIC_URL}/clan.png`} alt="Clan Icon" className="clan-image-icon" />
//         <p className="clan-title">Start your <br></br> clan journey</p>
//         <div className="clan-cta-buttons">
//           {pendingClan ? (
//             <>
//               <button className="clan-cta solo inactive" onClick={handleJoinClick}>
//                 Join Clan
//               </button>
//               <p className="pending-message">Your clan is awaiting verification</p>
//             </>
//           ) : (
//             <>
//               <button className="clan-cta active" onClick={handleCreateClick}>
//                 Create New
//               </button>
//               <button className="clan-cta inactive" onClick={handleJoinClick}>
//                 Join Clan
//               </button>
//             </>
//           )}
//         </div>
//       </div>

//       <div className="top-clans-section">
//         <p className="section-title">Top Clans</p>
//         <div className="see-all" onClick={() => navigate("/clan-list-screen")}>
//           <span>See all</span>
//           <img
//             src={`${process.env.PUBLIC_URL}/front-arrow.png`}
//             alt="See All Icon"
//             className="see-all-icon"
//           />
//         </div>
//       </div>

//       {loading ? (
//         <p className="loading-message">Loading clans...</p>
//       ) : error ? (
//         <p className="error-message">Error: {error}</p>
//       ) : topClans.length > 0 ? (
//         <div className="clan-cards">
//           {topClans.map((clan) => (
//             <div className="clan-card2" key={clan.id} onClick={() => handleClanClick(clan.id)}>
//               <img src={clan.cardIcon} alt="Clan Profile" className="clan-card-icon" />
//               <div className="clan-card-details">
//                 <p className="clan-card-name">{clan.name}</p>
//                 <div className="clan-card-stats">
//                   <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Coins Icon" className="members-icon" />
//                   <span className="clan-card-members">{clan.total_coins}</span> {/* Show total_coins instead of members */}
//                 </div>
//               </div>
//               <img src={clan.rankIcon} alt="Rank Icon" className="rank-icon" />
//             </div>
//           ))}
//         </div>
//       ) : (
//         <p className="no-clans-message">No top clans available yet. Be the first to create one!</p>
//       )}

//       <Navigation />
//     </div>
//   );
// };

// export default ClanScreen;

const ClanScreen = () => {
  const navigate = useNavigate();
  const [topClans, setTopClans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clanStatus, setClanStatus] = useState(null); // null, "pending", or "active"

  useEffect(() => {
    const fetchClanData = async () => {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/splash");
        return;
      }

      try {
        const myClanResponse = await fetch("https://bt-coins.onrender.com/user/clan/my_clan", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (myClanResponse.ok) {
          const myClanData = await myClanResponse.json();
          if (myClanData.id) {
            if (myClanData.status === "active") {
              navigate("/clan-details-screen");
              return;
            } else if (myClanData.status === "pending") {
              setClanStatus("pending");
            }
          } else {
            setClanStatus(null);
          }
        } else {
          setClanStatus(null);
        }

        const topClansResponse = await fetch("https://bt-coins.onrender.com/user/clan/top_clans", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!topClansResponse.ok) throw new Error("Failed to fetch top clans");
        const topClansData = await topClansResponse.json();

        const mappedTopClans = await Promise.all(
          topClansData.map(async (clan, index) => {
            const imageUrl = await fetchClanImage(clan.image_id, token);
            return {
              id: clan.id || index + 1,
              name: clan.name,
              rank: clan.rank || `#${index + 1}`,
              total_coins: clan.total_coins ? clan.total_coins.toLocaleString() : "0",
              rankIcon: `${process.env.PUBLIC_URL}/${
                index === 0 ? "first-icon.png" : index === 1 ? "second-icon.png" : "third-icon.png"
              }`,
              cardIcon: imageUrl,
            };
          })
        );

        setTopClans(mappedTopClans);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
        console.error("Error:", err.message);
      }
    };

    fetchClanData();
  }, [navigate]);

  const handleCreateClick = () => {
    navigate("/clan-create-screen");
  };

  const handleJoinClick = () => {
    navigate("/clan-list-screen");
  };

  const handleClanClick = (clanId) => {
    const clan = topClans.find((c) => c.id === clanId);
    navigate(`/clan-preview/${clanId}`, { state: { clan } });
  };

  return (
    <div className="clan-screen">
      <div className="clan-header">
        <img src={`${process.env.PUBLIC_URL}/clan.png`} alt="Clan Icon" className="clan-image-icon" />
        <p className="clan-title">Start your <br/> clan journey</p>
        <div className={`clan-cta-buttons ${clanStatus === "pending" ? "pending" : "default"}`}>
          {clanStatus === "pending" ? (
            <div className="pending-container">
              <button className="clan-cta inactive" onClick={handleJoinClick}>
                Join Clan
              </button>
              <p className="pending-message">Your clan is awaiting verification</p>
            </div>
          ) : (
            <div className="button-container">
              <button className="clan-cta active" onClick={handleCreateClick}>
                Create New
              </button>
              <button className="clan-cta inactive" onClick={handleJoinClick}>
                Join Clan
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="top-clans-section">
        <p className="section-title">Top Clans</p>
        <div className="see-all" onClick={() => navigate("/clan-list-screen")}>
          <span>See all</span>
          <img
            src={`${process.env.PUBLIC_URL}/front-arrow.png`}
            alt="See All Icon"
            className="see-all-icon"
          />
        </div>
      </div>

      {loading ? (
        <p className="loading-message">Loading clans...</p>
      ) : error ? (
        <p className="error-message">Error: {error}</p>
      ) : topClans.length > 0 ? (
        <div className="clan-cards">
          {topClans.map((clan) => (
            <div className="clan-card2" key={clan.id} onClick={() => handleClanClick(clan.id)}>
              <img src={clan.cardIcon} alt="Clan Profile" className="clan-card-icon" />
              <div className="clan-card-details">
                <p className="clan-card-name">{clan.name}</p>
                <div className="clan-card-stats">
                  <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Coins Icon" className="members-icon" />
                  <span className="clan-card-members">{clan.total_coins}</span>
                </div>
              </div>
              <img src={clan.rankIcon} alt="Rank Icon" className="rank-icon" />
            </div>
          ))}
        </div>
      ) : (
        <p className="no-clans-message">No top clans available yet. Be the first to create one!</p>
      )}

      <Navigation />
    </div>
  );
};

export default ClanScreen;