import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SplashScreen.css";

const SplashScreen = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

        // Attempt sign-in
        const signInResponse = await fetch("https://bt-coins.onrender.com/signin", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
          },
          body: new URLSearchParams({
            username,
            password: telegramUserId,
          }),
        });

        if (signInResponse.ok) {
          const authData = await signInResponse.json();
          handleSuccessfulAuth(authData, { telegramUserId, username, imageUrl });
          return;
        } else {
          console.log("Sign-in failed:", signInResponse.status, await signInResponse.text());
        }

        // Register if sign-in fails
        const signUpResponse = await fetch("https://bt-coins.onrender.com/sign-up", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            telegram_user_id: telegramUserId,
            username,
            image_url: imageUrl,
          }),
        });

        if (!signUpResponse.ok) {
          throw new Error(`Registration failed: ${await signUpResponse.text()}`);
        }

        // Retry sign-in after registration
        const signInAfterRegResponse = await fetch("https://bt-coins.onrender.com/signin", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
          },
          body: new URLSearchParams({
            username,
            password: telegramUserId,
          }),
        });

        if (!signInAfterRegResponse.ok) {
          throw new Error(`Sign-in after registration failed: ${await signInAfterRegResponse.text()}`);
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
      localStorage.setItem("telegramUser", JSON.stringify(userInfo));
      console.log("Token stored:", authData.access_token); // Debug token
      navigate("/dashboard");
    };

    initializeAuth();
  }, [navigate]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    window.location.reload();
  };

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