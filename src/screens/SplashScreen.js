// import React, { useEffect, useState, useContext } from "react";
import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./SplashScreen.css";
import { BoostContext } from "../context/BoosterContext";

const SplashScreen = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { resetAll, setLastActiveTime, setExtraBoosters, setAutoTapActive } = useContext(BoostContext)

  const handleResetIfNewUser = (userID) => {
    const oldUser = localStorage.getItem("telegramUser");
    if (oldUser) {
      const { telegramUserId: oldUserId } = JSON.parse(oldUser)
      if (oldUserId !== userID) {
        resetAll()
      }
    } else { resetAll() }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (!window.Telegram?.WebApp) {
          throw new Error("Telegram WebApp not initialized");
        }

        const webApp = window.Telegram.WebApp;
        const userData = webApp.initDataUnsafe?.user;

        if (!userData || !userData.id) {
          throw new Error("User data is missing or invalid");
        }

        const username = userData.username || `User${userData.id}`;
        const telegramUserId = String(userData.id);
        const imageUrl = userData.photo_url || "";

        const signInResponse = await fetch("https://bt-coins.onrender.com/signin", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", accept: "application/json" },
          body: new URLSearchParams({
            grant_type: "password",
            username,
            password: telegramUserId,
            scope: "",
            client_id: "string",
            client_secret: "string",
          }),
        });

        let authData;
        if (signInResponse.ok) {
          authData = await signInResponse.json();
        } else {
          // 2️⃣ If sign-in fails, register the user
          const signUpResponse = await fetch("https://bt-coins.onrender.com/sign-up", {
            method: "POST",
            headers: { "Content-Type": "application/json", accept: "application/json" },
            body: JSON.stringify({ telegram_user_id: telegramUserId, username, image_url: imageUrl }),
          });

          if (!signUpResponse.ok) {
            throw new Error(`Registration failed: ${await signUpResponse.text()}`);
          }

          // 3️⃣ Sign in after successful registration
          const signInAfterRegResponse = await fetch("https://bt-coins.onrender.com/signin", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded", accept: "application/json" },
            body: new URLSearchParams({
              grant_type: "password",
              username,
              password: telegramUserId,
              scope: "",
              client_id: "string",
              client_secret: "string",
            }),
          });

          if (!signInAfterRegResponse.ok) {
            throw new Error("Failed to sign in after registration");
          }

          authData = await signInAfterRegResponse.json();
        }

        const response = await fetch("https://bt-coins.onrender.com/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authData.access_token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to fetch profile");
        const data = await response.json();
        // 4️⃣ Handle successful authentication
        console.log('Response', data)
        handleResetIfNewUser(data.id); // ✅ Only called ONCE now
        handleSuccessfulAuth(authData, { telegramUserId, username, imageUrl, uniqueId: data.id });
      } catch (err) {
        console.error("Authentication error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const handleSuccessfulAuth = async (authData, userInfo) => {
      localStorage.setItem("accessToken", authData.access_token);
      localStorage.setItem("tokenType", authData.token_type);
      localStorage.setItem("telegramUser", JSON.stringify(userInfo));
  
      // ✅ Wait for fetchData before navigating
      const token = authData.access_token;
      const extraBoostersResponse = await fetch("https://bt-coins.onrender.com/user/boost/extra_boosters", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
  
      if (!extraBoostersResponse.ok) throw new Error("Extra boosters fetch failed");
  
      const extraBoostersData = await extraBoostersResponse.json();
      const mappedExtraBoosters = extraBoostersData.map((booster) => {
        let icon;
        switch (booster.name.toLowerCase()) {
          case "multiplier":
            icon = `${process.env.PUBLIC_URL}/multiplier-icon.png`;
            break;
          case "boost":
            icon = `${process.env.PUBLIC_URL}/boost-icon 2.png`;
            break;
          case "recharging speed":
            icon = `${process.env.PUBLIC_URL}/recharge-icon.png`;
            break;
          case "auto-bot tapping":
            icon = `${process.env.PUBLIC_URL}/autobot-icon.png`;
            break;
          default:
            icon = `${process.env.PUBLIC_URL}/extra-booster-icon.png`; // Fallback icon
        }
  
        return {
          id: booster.booster_id,
          title: booster.name,
          description: booster.description,
          value: booster.upgrade_cost.toString(),
          level: booster.status === 'owned' ? "Owned" : booster.level === "-" ? "Not Owned" : `Level ${booster.level - 1}`,
          actionIcon: `${process.env.PUBLIC_URL}/front-arrow.png`,
          icon, // Use the static icon assigned above
          rawLevel: booster.level === "-" ? 0 : parseInt(booster.level, 10) - 1,
          effect: booster.effect,
          status: booster.status && booster.status === "owned" ? 1 : 0
        };
      });
  
      const autoTapBooster = mappedExtraBoosters.filter(booster => booster.title === 'Auto-bot Tapping')
  
      setExtraBoosters(mappedExtraBoosters)
      setAutoTapActive(autoTapBooster[0].status === 1)
      // ✅ Navigate after setting data
      if (extraBoostersData && extraBoostersData.length) {
        navigate("/dashboard");
      }
    };

    initializeAuth();
  }, [navigate, resetAll]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  const saveLastActiveTime = () => {
    setLastActiveTime(Date.now());
  };

  window.addEventListener("beforeunload", saveLastActiveTime);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) saveLastActiveTime();
  });

  return (
    <div className="splash-container">
      <div className="splash-content">
        <img
          src={`${process.env.PUBLIC_URL}/logo.png`}
          alt="Bored Tap Logo"
          className="splash-logo"
        />
        <h1 className="splash-title">BoredTap App</h1>
        {loading && <div className="loader-bar"></div>}
        {error && (
          <div className="error-container">
            <p className="error-message">Error: {error}</p>
            <button onClick={handleRetry} className="retry-button">Retry</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SplashScreen;


// import React, { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import "./SplashScreen.css";

// const SplashScreen = () => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const initializeAuth = async () => {
//       try {
//         // Mock Telegram WebApp when running locally
//         if (!window.Telegram?.WebApp) {
//           console.warn("Running in mock mode (Telegram not detected)");
//           window.Telegram = {
//             WebApp: {
//               initDataUnsafe: {
//                 user: {
//                   id: "32141", // Mock Telegram user ID
//                   username: "yuiop6", // Mock Telegram username
//                   photo_url: "https://via.placeholder.com/150", // Placeholder image
//                 },
//               },
//             },
//           };
//         }

//         const webApp = window.Telegram.WebApp;
//         const userData =
//           webApp.initDataUnsafe?.user || {
//             id: "32141",
//             username: "yuiop6",
//             photo_url: "https://via.placeholder.com/150",
//           };

//         if (!userData || !userData.id) {
//           throw new Error("User data is missing or invalid");
//         }

//         const username = userData.username || `User${userData.id}`;
//         const telegramUserId = String(userData.id);
//         const imageUrl = userData.photo_url || "";

//         console.log("Using Telegram Data:", { telegramUserId, username, imageUrl });

//         // First try to sign in
//         const signInResponse = await fetch("https://bt-coins.onrender.com/signin", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/x-www-form-urlencoded",
//             accept: "application/json",
//           },
//           body: new URLSearchParams({
//             grant_type: "password",
//             username,
//             password: telegramUserId,
//             scope: "",
//             client_id: "string",
//             client_secret: "string",
//           }),
//         });

//         if (signInResponse.ok) {
//           const authData = await signInResponse.json();
//           handleSuccessfulAuth(authData, { telegramUserId, username, imageUrl });
//           return;
//         }

//         // If sign-in fails, register the user
//         const signUpResponse = await fetch("https://bt-coins.onrender.com/sign-up", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             accept: "application/json",
//           },
//           body: JSON.stringify({
//             telegram_user_id: telegramUserId,
//             username,
//             image_url: imageUrl,
//           }),
//         });

//         if (!signUpResponse.ok) {
//           throw new Error(`Registration failed: ${await signUpResponse.text()}`);
//         }

//         // Sign in after successful registration
//         const signInAfterRegResponse = await fetch("https://bt-coins.onrender.com/signin", {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/x-www-form-urlencoded",
//             accept: "application/json",
//           },
//           body: new URLSearchParams({
//             grant_type: "password",
//             username,
//             password: telegramUserId,
//             scope: "",
//             client_id: "string",
//             client_secret: "string",
//           }),
//         });

//         if (!signInAfterRegResponse.ok) {
//           throw new Error("Failed to sign in after registration");
//         }

//         const authData = await signInAfterRegResponse.json();
//         handleSuccessfulAuth(authData, { telegramUserId, username, imageUrl });
//       } catch (err) {
//         console.error("Authentication error:", err);
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     const handleSuccessfulAuth = (authData, userInfo) => {
//       localStorage.setItem("accessToken", authData.access_token);
//       localStorage.setItem("tokenType", authData.token_type);
//       localStorage.setItem("telegramUser", JSON.stringify(userInfo));
//       navigate("/dashboard");
//     };

//     initializeAuth();
//   }, [navigate]);

//   const handleRetry = () => {
//     setError(null);
//     setLoading(true);
//     window.location.reload();
//   };

//   return (
//     <div className="splash-container">
//       <div className="splash-content">
//         <img
//           src={`${process.env.PUBLIC_URL}/logo.png`}
//           alt="Bored Tap Logo"
//           className="splash-logo"
//         />
//         <h1 className="splash-title">BoredTap App</h1>
//         {loading && <div className="loader-bar"></div>}
//         {error && (
//           <div className="error-container">
//             <p className="error-message">Error: {error}</p>
//             <button onClick={handleRetry} className="retry-button">
//               Retry
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default SplashScreen;
