import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./SplashScreen.css";
import { BoostContext } from "../context/BoosterContext";
import { BASE_URL } from "../utils/BaseVariables"; // Import BASE_URL

const SplashScreen = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { resetAll, setLastActiveTime, setExtraBoosters, setAutoTapActive, setTotalTaps, setElectricBoost } =
    useContext(BoostContext);

  const nameMapping = {
    "multiplier": "Multiplier Boost",
    "boost": "Boost",
    "recharging speed": "Recharge Speed",
    "auto-bot tapping": "Auto-Bot Tapping",
    // Add more mappings as needed
  };

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

        // Explicitly log if photo_url exists or not
        console.log("User photo_url status:", userData.photo_url ? "Available" : "Not available", 
                    userData.photo_url ? userData.photo_url : "");

        const imageUrl = userData.photo_url || "https://example.com/";
        const inviterId = webApp.initDataUnsafe?.start_param || "";

        console.log("Telegram User Data:", { 
          username, 
          telegramUserId, 
          imageUrl, 
          inviterId,
          rawUserData: JSON.stringify(userData)
        });

        const signInResponse = await fetch(`${BASE_URL}/signin`, {
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
        let isNewUser = false;

        if (signInResponse.ok) {
          authData = await signInResponse.json();
          console.log("Signin Success:", { token: authData.access_token });
        } else {
          console.log("Signin failed:", signInResponse.status, await signInResponse.text());
          const signUpBody = {
            telegram_user_id: telegramUserId,
            username,
            image_url: imageUrl,
          };
          if (inviterId) {
            signUpBody.inviter_id = inviterId;
          }
          const signUpResponse = await fetch(`${BASE_URL}/sign-up`, {
            method: "POST",
            headers: { "Content-Type": "application/json", accept: "application/json" },
            body: JSON.stringify(signUpBody),
          });

          if (!signUpResponse.ok) {
            const errorText = await signUpResponse.text();
            if (signUpResponse.status === 400 && errorText.includes("User already exists")) {
              const retrySignInResponse = await fetch(`${BASE_URL}/signin`, {
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
            isNewUser = true;
            const signInAfterRegResponse = await fetch(`${BASE_URL}/signin`, {
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
        }

        // Always attempt to update the image if photo_url is available, for both new and existing users
        if (userData.photo_url) {
          console.log("Attempting image update for user:", { 
            isNewUser, 
            hasInviterId: !!inviterId, 
            imageUrl: userData.photo_url 
          });

          try {
            // Create a structured body to ensure the image_url is properly sent
            const imageUpdateBody = { image_url: userData.photo_url };

            // First try with query parameter as in original code
            const imageUpdateResponse = await fetch(
              `${BASE_URL}/bored-tap/user_app?image_url=${encodeURIComponent(userData.photo_url)}`,
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
            console.log("Image update response (query param):", {
              status: imageUpdateResponse.status,
              ok: imageUpdateResponse.ok,
              body: responseText,
            });

            // If first attempt failed, try with request body instead
            if (!imageUpdateResponse.ok) {
              console.log("Trying alternative image update method with request body");

              const altImageUpdateResponse = await fetch(
                `${BASE_URL}/bored-tap/user_app`,
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${authData.access_token}`,
                    "Content-Type": "application/json",
                    Accept: "application/json",
                  },
                  body: JSON.stringify(imageUpdateBody),
                }
              );

              const altResponseText = await altImageUpdateResponse.text();
              console.log("Alternative image update response (request body):", {
                status: altImageUpdateResponse.status,
                ok: altImageUpdateResponse.ok,
                body: altResponseText,
              });

              if (!altImageUpdateResponse.ok) {
                console.error("Both image update methods failed");
              } else {
                console.log("Alternative image update method successful");
              }
            } else {
              console.log("Image update successful");
            }
          } catch (updateError) {
            console.error("Image update request error:", updateError.message, updateError.stack);
          }
        } else {
          console.log("No photo_url available from Telegram WebApp");
        }

        const response = await fetch(`${BASE_URL}/user/profile`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authData.access_token}`,
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to fetch profile");
        const data = await response.json();
        console.log("Profile response:", data);

        // Verify if the image was actually updated on the server
        console.log("Current image_url in profile:", data.image_url);

        handleResetIfNewUser(data.id);

        const date = new Date(data.last_active_time);
        const offset = date.getTimezoneOffset() * 60000;
        const correctedTime = new Date(date.getTime() - offset);

        setLastActiveTime(correctedTime);
        setElectricBoost(data.power_limit);
        setTotalTaps(data.total_coins);

        handleSuccessfulAuth(authData, { telegramUserId, username, imageUrl: userData.photo_url || "", uniqueId: data.id });
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
      const extraBoostersResponse = await fetch(`${BASE_URL}/user/boost/extra_boosters`, {
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
          title: nameMapping[booster.name.toLowerCase()] || booster.name,
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

      const autoTapBooster = mappedExtraBoosters.filter((booster) => booster.title === "Auto-Bot Tapping");

      setExtraBoosters(mappedExtraBoosters);
      setAutoTapActive(autoTapBooster[0].status === 1);

      if (extraBoostersData && extraBoostersData.length) {
        navigate("/dashboard");
      }
    };

    initializeAuth();
  }, []);

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


// import React, { useEffect, useState, useContext } from "react";
// import { useNavigate } from "react-router-dom";
// import "./SplashScreen.css";
// import { BoostContext } from "../context/BoosterContext";
// import { BASE_URL } from "../utils/BaseVariables"; // Import BASE_URL

// const SplashScreen = () => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const { resetAll, setLastActiveTime, setExtraBoosters, setAutoTapActive, setTotalTaps, setElectricBoost, adjustElectricBoosts } =
//     useContext(BoostContext);

//   const nameMapping = {
//     "multiplier": "Multiplier Boost",
//     "boost": "Boost",
//     "recharging speed": "Recharge Speed",
//     "auto-bot tapping": "Auto-Bot Tapping",
//     // Add more mappings as needed
//   };

//   const handleResetIfNewUser = (userID) => {
//     const oldUser = localStorage.getItem("telegramUser");
//     if (oldUser) {
//       const { uniqueId } = JSON.parse(oldUser);
//       if (uniqueId !== userID) {
//         resetAll();
//       }
//     } else {
//       resetAll();
//     }
//   };

//   useEffect(() => {
//     const initializeAuth = async () => {
//       try {
//         if (!window.Telegram?.WebApp) {
//           throw new Error("Telegram WebApp not initialized");
//         }

//         if (!window.Telegram?.WebApp) {
//           console.warn("Running in mock mode (Telegram not detected)");
//           window.Telegram = {
//             WebApp: {
//               initDataUnsafe: {
//                 user: {
//                   id: "111", // Mock Telegram user ID
//                   username: "ore1", // Mock Telegram username
//                   photo_url: "https://t.me/i/userpic/320/w1rd6s7RjypJpbHZRzETgLACa4GaM0uhz88rMnregJs.svg", // Mock Telegram image URL
//                 },
//                 start_param: "", // Mock inviter ID
//               },
//             },
//           };
//         }

//         const webApp = window.Telegram.WebApp;
//         const userData =
//           webApp.initDataUnsafe?.user || {
//             id: "111",
//             username: "ore1",
//             photo_url: "https://t.me/i/userpic/320/w1rd6s7RjypJpbHZRzETgLACa4GaM0uhz88rMnregJs.svg",
//           };

//         if (!userData || !userData.id) {
//           throw new Error("User data is missing or invalid");
//         }

//         const username = userData.username || `User${userData.id}`;
//         const telegramUserId = String(userData.id);

//         // Explicitly log if photo_url exists or not
//         console.log("User photo_url status:", userData.photo_url ? "Available" : "Not available",
//           userData.photo_url ? userData.photo_url : "");

//         const imageUrl = userData.photo_url || "https://example.com/";
//         const inviterId = webApp.initDataUnsafe?.start_param || "";

//         console.log("Telegram User Data:", {
//           username,
//           telegramUserId,
//           imageUrl,
//           inviterId,
//           rawUserData: JSON.stringify(userData)
//         });

//         const signInResponse = await fetch(`${BASE_URL}/signin`, {
//           method: "POST",
//           headers: { "Content-Type": "application/x-www-form-urlencoded", accept: "application/json" },
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
//         let isNewUser = false;

//         if (signInResponse.ok) {
//           authData = await signInResponse.json();
//           console.log("Signin Success:", { token: authData.access_token });
//         } else {
//           console.log("Signin failed:", signInResponse.status, await signInResponse.text());
//           const signUpBody = {
//             telegram_user_id: telegramUserId,
//             username,
//             image_url: imageUrl,
//           };
//           if (inviterId) {
//             signUpBody.inviter_id = inviterId;
//           }
//           const signUpResponse = await fetch(`${BASE_URL}/sign-up`, {
//             method: "POST",
//             headers: { "Content-Type": "application/json", accept: "application/json" },
//             body: JSON.stringify(signUpBody),
//           });

//           if (!signUpResponse.ok) {
//             const errorText = await signUpResponse.text();
//             if (signUpResponse.status === 400 && errorText.includes("User already exists")) {
//               const retrySignInResponse = await fetch(`${BASE_URL}/signin`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/x-www-form-urlencoded", accept: "application/json" },
//                 body: new URLSearchParams({
//                   grant_type: "password",
//                   username,
//                   password: telegramUserId,
//                   scope: "",
//                   client_id: "string",
//                   client_secret: "string",
//                 }),
//               });
//               if (!retrySignInResponse.ok) {
//                 throw new Error(`Retry signin failed: ${await retrySignInResponse.text()}`);
//               }
//               authData = await retrySignInResponse.json();
//               console.log("Retry Signin Success:", { token: authData.access_token });
//             } else {
//               throw new Error(`Registration failed: ${errorText}`);
//             }
//           } else {
//             console.log("Signup successful");
//             isNewUser = true;
//             const signInAfterRegResponse = await fetch(`${BASE_URL}/signin`, {
//               method: "POST",
//               headers: { "Content-Type": "application/x-www-form-urlencoded", accept: "application/json" },
//               body: new URLSearchParams({
//                 grant_type: "password",
//                 username,
//                 password: telegramUserId,
//                 scope: "",
//                 client_id: "string",
//                 client_secret: "string",
//               }),
//             });

//             if (!signInAfterRegResponse.ok) {
//               throw new Error("Failed to sign in after registration");
//             }
//             authData = await signInAfterRegResponse.json();
//             console.log("Signin after signup successful:", { token: authData.access_token });
//           }
//         }

//         // Always attempt to update the image if photo_url is available, for both new and existing users
//         if (userData.photo_url) {
//           console.log("Attempting image update for user:", {
//             isNewUser,
//             hasInviterId: !!inviterId,
//             imageUrl: userData.photo_url
//           });

//           try {
//             // Create a structured body to ensure the image_url is properly sent
//             const imageUpdateBody = { image_url: userData.photo_url };

//             // First try with query parameter as in original code
//             const imageUpdateResponse = await fetch(
//               `${BASE_URL}/bored-tap/user_app?image_url=${encodeURIComponent(userData.photo_url)}`,
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
//             console.log("Image update response (query param):", {
//               status: imageUpdateResponse.status,
//               ok: imageUpdateResponse.ok,
//               body: responseText,
//             });

//             // If first attempt failed, try with request body instead
//             if (!imageUpdateResponse.ok) {
//               console.log("Trying alternative image update method with request body");

//               const altImageUpdateResponse = await fetch(
//                `${BASE_URL}/bored-tap/user_app`,
//                 {
//                   method: "POST",
//                   headers: {
//                     Authorization: `Bearer ${authData.access_token}`,
//                     "Content-Type": "application/json",
//                     Accept: "application/json",
//                   },
//                   body: JSON.stringify(imageUpdateBody),
//                 }
//               );

//               const altResponseText = await altImageUpdateResponse.text();
//               console.log("Alternative image update response (request body):", {
//                 status: altImageUpdateResponse.status,
//                 ok: altImageUpdateResponse.ok,
//                 body: altResponseText,
//               });

//               if (!altImageUpdateResponse.ok) {
//                 console.error("Both image update methods failed");
//               } else {
//                 console.log("Alternative image update method successful");
//               }
//             } else {
//               console.log("Image update successful");
//             }
//           } catch (updateError) {
//             console.error("Image update request error:", updateError.message, updateError.stack);
//           }
//         } else {
//           console.log("No photo_url available from Telegram WebApp");
//         }

//         const response = await fetch(`${BASE_URL}/user/profile`, {
//           method: "GET",
//           headers: {
//             Authorization: `Bearer ${authData.access_token}`,
//             "Content-Type": "application/json",
//           },
//         });
//         if (!response.ok) throw new Error("Failed to fetch profile");
//         const data = await response.json();
//         console.log("Profile response:", data);

//         // Verify if the image was actually updated on the server
//         console.log("Current image_url in profile:", data.image_url);

//         handleResetIfNewUser(data.id);

//         const date = new Date(data.last_active_time);
//         const offset = date.getTimezoneOffset() * 60000;
//         const correctedTime = new Date(date.getTime() - offset);

//         setLastActiveTime(correctedTime);
//         console.log("Setting Electric Boost from profile information")
//         setElectricBoost(data.power_limit);
//         setTotalTaps(data.total_coins);

//         handleSuccessfulAuth(authData, { telegramUserId, username, imageUrl: userData.photo_url || "", uniqueId: data.id });
//       } catch (err) {
//         console.error("Authentication error:", err);
//         setError(err.message);
//       } finally {
//         setLoading(false);
//       }
//     };

//     const handleSuccessfulAuth = async (authData, userInfo) => {
//       localStorage.setItem("accessToken", authData.access_token);
//       localStorage.setItem("tokenType", authData.token_type);
//       localStorage.setItem("telegramUser", JSON.stringify(userInfo));

//       const token = authData.access_token;
//       const extraBoostersResponse = await fetch(`${BASE_URL}/user/boost/extra_boosters`, {
//         method: "GET",
//         headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
//       });

//       if (!extraBoostersResponse.ok) throw new Error("Extra boosters fetch failed");

//       const extraBoostersData = await extraBoostersResponse.json();
//       const mappedExtraBoosters = extraBoostersData.map((booster) => {
//         let icon;
//         switch (booster.name.toLowerCase()) {
//           case "multiplier":
//             icon = `${process.env.PUBLIC_URL}/multiplier-icon.png`;
//             break;
//           case "boost":
//             icon = `${process.env.PUBLIC_URL}/boost-icon 2.png`;
//             break;
//           case "recharging speed":
//             icon = `${process.env.PUBLIC_URL}/recharge-icon.png`;
//             break;
//           case "auto-bot tapping":
//             icon = `${process.env.PUBLIC_URL}/autobot-icon.png`;
//             break;
//           default:
//             icon = `${process.env.PUBLIC_URL}/extra-booster-icon.png`;
//         }

//         return {
//           id: booster.booster_id,
//           title: nameMapping[booster.name.toLowerCase()] || booster.name,
//           description: booster.description,
//           value: booster.upgrade_cost.toString(),
//           level: booster.status === "owned" ? "Owned" : booster.level === "-" ? "Not Owned" : `Level ${booster.level}`,
//           actionIcon: `${process.env.PUBLIC_URL}/front-arrow.png`,
//           icon,
//           rawLevel: booster.level === "-" ? 0 : parseInt(booster.level, 10),
//           effect: booster.effect,
//           status: booster.status && booster.status === "owned" ? 1 : 0,
//         };
//       });

//       const autoTapBooster = mappedExtraBoosters.filter((booster) => booster.title === "Auto-Bot Tapping");

//       setExtraBoosters(mappedExtraBoosters);
//       setAutoTapActive(autoTapBooster[0].status === 1);

//       if (extraBoostersData && extraBoostersData.length) {
//         navigate("/dashboard");
//       }
//     };

//     initializeAuth();
//   }, []);

//   const handleRetry = () => {
//     setError(null);
//     setLoading(true);
//     window.location.reload();
//   };

//   const saveLastActiveTime = () => {
//     setLastActiveTime(Date.now());
//   };

//   window.addEventListener("beforeunload", saveLastActiveTime);
//   document.addEventListener("visibilitychange", () => {
//     if (document.hidden) saveLastActiveTime();
//   });

//   return (
//     <div className="splash-container">
//       <div className="splash-content">
//         <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Bored Tap Logo" className="splash-logo" />
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