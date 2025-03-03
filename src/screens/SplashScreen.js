import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./SplashScreen.css";
import { BoostContext } from "../context/BoosterContext";

const SplashScreen = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { resetAll, applyAutoBotTaps } = useContext(BoostContext)

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

        // First try to sign in
        const signInResponse = await fetch("https://bt-coins.onrender.com/signin", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "accept": "application/json",
          },
          body: new URLSearchParams({
            grant_type: "password",
            username,
            password: telegramUserId,
            scope: "",
            client_id: "string",
            client_secret: "string",
          }),
        });

        if (signInResponse.ok) {
          const authData = await signInResponse.json();
          handleSuccessfulAuth(authData, { telegramUserId, username, imageUrl });
          return;
        }

        // If sign-in fails, register the user
        const signUpResponse = await fetch("https://bt-coins.onrender.com/sign-up", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "accept": "application/json",
          },
          body: JSON.stringify({
            telegram_user_id: telegramUserId,
            username,
            image_url: imageUrl,
          }),
        });

        if (!signUpResponse.ok) {
          throw new Error("Registration failed");
        }

        // Sign in after successful registration
        const signInAfterRegResponse = await fetch("https://bt-coins.onrender.com/signin", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "accept": "application/json",
          },
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

        const authData = await signInAfterRegResponse.json();
        handleSuccessfulAuth(authData, { telegramUserId, username, imageUrl });
      } catch (err) {
        console.error("Authentication error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const handleSuccessfulAuth = (authData, userInfo) => {
      localStorage.setItem("accessToken", authData.access_token);
      localStorage.setItem("tokenType", authData.token_type);

      // Check if new user and adjust localstorage data accordingly
      const oldUser = localStorage.getItem("telegramUser");
      if (oldUser) {
        const { telegramUserId: oldUserId } = JSON.parse(oldUser)
        if (oldUserId !== userInfo.telegramUserId) {
          resetAll()
        }
      }
      localStorage.setItem("telegramUser", JSON.stringify(userInfo));
      navigate("/dashboard");
    };

    initializeAuth();
  }, [navigate]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  window.addEventListener("beforeunload", () => {
    localStorage.setItem("lastActiveTime", Date.now());
  });

  useEffect(() => {
    const handleLoad = () => {
      applyAutoBotTaps();
    };

    // Check if the document is already loaded
    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad);
    }

    return () => {
      window.removeEventListener("load", handleLoad);
    };
  }, []);

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