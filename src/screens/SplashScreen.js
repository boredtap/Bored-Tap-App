import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./SplashScreen.css";
import { BoostContext } from "../context/BoosterContext";

const SplashScreen = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { resetAll, setLastActiveTime, setExtraBoosters, setAutoTapActive, setTotalTaps, setElectricBoost } =
    useContext(BoostContext);

  const handleResetIfNewUser = (userID) => {
    const oldUser = localStorage.getItem("telegramUser");
    if (oldUser) {
      const { uniqueId } = JSON.parse(oldUser);
      if (uniqueId !== userID) {
        resetAll();
      }
    } else {
      resetAll();
    }
  };

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
        const inviterId = webApp.initDataUnsafe?.start_param || "";
        console.log("Telegram User Data:", { username, telegramUserId, imageUrl, inviterId });

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
          console.log("Signin Success:", { token: authData.access_token });
        } else {
          console.log("Signin failed:", signInResponse.status, await signInResponse.text());
          const signUpResponse = await fetch("https://bt-coins.onrender.com/sign-up", {
            method: "POST",
            headers: { "Content-Type": "application/json", accept: "application/json" },
            body: JSON.stringify({ telegram_user_id: telegramUserId, username, image_url: imageUrl }),
          });

          if (!signUpResponse.ok) {
            const errorText = await signUpResponse.text();
            if (signUpResponse.status === 400 && errorText.includes("User already exists")) {
              // Retry signin for existing user
              const retrySignInResponse = await fetch("https://bt-coins.onrender.com/signin", {
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
              if (!retrySignInResponse.ok) {
                throw new Error(`Retry signin failed: ${await retrySignInResponse.text()}`);
              }
              authData = await retrySignInResponse.json();
              console.log("Retry Signin Success:", { token: authData.access_token });
            } else {
              throw new Error(`Registration failed: ${errorText}`);
            }
          } else {
            console.log("Signup successful");
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
            console.log("Signin after signup successful:", { token: authData.access_token });
          }

          // Update image for invitees if available
          const isInvitee = !!inviterId;
          if (isInvitee && imageUrl) {
            console.log("Attempting image update with URL:", imageUrl);
            const imageUpdateResponse = await fetch(
              `https://bt-coins.onrender.com/bored-tap/user_app?image_url=${encodeURIComponent(imageUrl)}`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${authData.access_token}`,
                  "Content-Type": "application/json",
                  Accept: "application/json",
                },
              }
            );
            const responseText = await imageUpdateResponse.text();
            console.log("Image update response:", {
              status: imageUpdateResponse.status,
              ok: imageUpdateResponse.ok,
              body: responseText,
            });
            if (!imageUpdateResponse.ok) {
              console.error("Image update failed:", responseText);
            } else {
              console.log("Image update successful");
            }
          } else {
            console.log("Skipped image update:", { isInvitee, hasImageUrl: !!imageUrl });
          }
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
        console.log("Profile response:", data);

        handleResetIfNewUser(data.id);

        const date = new Date(data.last_active_time);
        const offset = date.getTimezoneOffset() * 60000;
        const correctedTime = new Date(date.getTime() - offset);

        setLastActiveTime(correctedTime);
        setElectricBoost(data.power_limit);
        setTotalTaps(data.total_coins);

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
            icon = `${process.env.PUBLIC_URL}/extra-booster-icon.png`;
        }

        return {
          id: booster.booster_id,
          title: booster.name,
          description: booster.description,
          value: booster.upgrade_cost.toString(),
          level: booster.status === "owned" ? "Owned" : booster.level === "-" ? "Not Owned" : `Level ${booster.level}`,
          actionIcon: `${process.env.PUBLIC_URL}/front-arrow.png`,
          icon,
          rawLevel: booster.level === "-" ? 0 : parseInt(booster.level, 10),
          effect: booster.effect,
          status: booster.status && booster.status === "owned" ? 1 : 0,
        };
      });

      const autoTapBooster = mappedExtraBoosters.filter((booster) => booster.title === "Auto-bot Tapping");

      setExtraBoosters(mappedExtraBoosters);
      setAutoTapActive(autoTapBooster[0].status === 1);

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
        <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Bored Tap Logo" className="splash-logo" />
        <h1 className="splash-title">BoredTap App</h1>
        {loading && <div className="loader-bar"></div>}
        {error && (
          <div className="error-container">
            <p className="error-message">Error: {error}</p>
            <button onClick={handleRetry} className="retry-button">
              Retry
            </button>
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
//                   photo_url: "https://t.me/i/userpic/320/w1rd6s7RjypJpbHZRzETgLACa4GaM0uhz88rMnregJs.svg", // Mock Telegram image URL
//                 },
//                 start_param: "12345", // Mock inviter ID
//               },
//             },
//           };
//         }

//         const webApp = window.Telegram.WebApp;
//         const userData =
//           webApp.initDataUnsafe?.user || {
//             id: "32141",
//             username: "yuiop6",
//             photo_url: "https://t.me/i/userpic/320/w1rd6s7RjypJpbHZRzETgLACa4GaM0uhz88rMnregJs.svg",
//           };
//         const inviterId = webApp.initDataUnsafe?.start_param || "";

//         if (!userData || !userData.id) {
//           throw new Error("User data is missing or invalid");
//         }

//         const username = userData.username || `User${userData.id}`;
//         const telegramUserId = String(userData.id);
//         const imageUrl = userData.photo_url || "";
//         console.log("Using Telegram Data:", { telegramUserId, username, imageUrl, inviterId });

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

//         let authData;
//         if (signInResponse.ok) {
//           authData = await signInResponse.json();
//           console.log("Signin successful:", authData);
//         } else {
//           // If sign-in fails, register the user
//           const signUpResponse = await fetch("https://bt-coins.onrender.com/sign-up", {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//               accept: "application/json",
//             },
//             body: JSON.stringify({
//               telegram_user_id: telegramUserId,
//               username,
//               image_url: imageUrl,
//             }),
//           });

//           if (!signUpResponse.ok) {
//             throw new Error(`Registration failed: ${await signUpResponse.text()}`);
//           }
//           console.log("Signup successful");

//           // Sign in after successful registration
//           const signInAfterRegResponse = await fetch("https://bt-coins.onrender.com/signin", {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/x-www-form-urlencoded",
//               accept: "application/json",
//             },
//             body: new URLSearchParams({
//               grant_type: "password",
//               username,
//               password: telegramUserId,
//               scope: "",
//               client_id: "string",
//               client_secret: "string",
//             }),
//           });

//           if (!signInAfterRegResponse.ok) {
//             throw new Error("Failed to sign in after registration");
//           }

//           authData = await signInAfterRegResponse.json();
//           console.log("Signin after signup successful:", authData);

//           // Update profile image for new users (or invitees)
//           const isInvitee = !!inviterId;
//           if (imageUrl) { // Removed isInvitee condition for testing
//             console.log("Attempting to update image with URL:", imageUrl);
//             const imageUpdateResponse = await fetch(
//               `https://bt-coins.onrender.com/bored-tap/user_app?image_url=${encodeURIComponent(imageUrl)}`,
//               {
//                 method: "POST",
//                 headers: {
//                   Authorization: `Bearer ${authData.access_token}`,
//                   "Content-Type": "application/json",
//                   Accept: "application/json",
//                 },
//               }
//             );
//             const responseText = await imageUpdateResponse.text();
//             console.log("Image update response:", {
//               status: imageUpdateResponse.status,
//               ok: imageUpdateResponse.ok,
//               body: responseText,
//             });
//             if (!imageUpdateResponse.ok) {
//               console.error("Image update failed:", responseText);
//             } else {
//               console.log("Image update successful");
//             }
//           } else {
//             console.log("No image URL to update");
//           }
//         }

//         // Fetch profile to verify
//         const profileResponse = await fetch("https://bt-coins.onrender.com/user/profile", {
//           method: "GET",
//           headers: {
//             Authorization: `Bearer ${authData.access_token}`,
//             "Content-Type": "application/json",
//           },
//         });
//         if (!profileResponse.ok) throw new Error("Failed to fetch profile");
//         const profileData = await profileResponse.json();
//         console.log("Profile data after update:", profileData);

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