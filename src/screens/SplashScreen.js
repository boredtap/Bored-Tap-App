import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SplashScreen.css";

const SplashScreen = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Initialize authentication with retry logic for Telegram WebApp
    const initializeAuth = async (retries = 3) => {
      try {
        // Check if Telegram WebApp is available, retry if not
        if (!window.Telegram?.WebApp) {
          if (retries > 0) {
            console.log(`Telegram WebApp not ready, retrying (${retries} left)...`);
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s
            return initializeAuth(retries - 1);
          }
          throw new Error("Telegram WebApp failed to initialize after retries");
        }

        const webApp = window.Telegram.WebApp;
        const userData = webApp.initDataUnsafe?.user;

        if (!userData || !userData.id) {
          throw new Error("User data is missing or invalid");
        }

        const username = userData.username || `User${userData.id}`;
        const telegramUserId = String(userData.id);
        const imageUrl = userData.photo_url || "";

        // Attempt to sign in with Telegram credentials
        const signInResponse = await fetch("https://bt-coins.onrender.com/signin", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Accept": "application/json",
          },
          body: new URLSearchParams({
            username,
            password: telegramUserId, // Using telegramUserId as password
          }),
        });

        if (signInResponse.ok) {
          const authData = await signInResponse.json();
          handleSuccessfulAuth(authData, { telegramUserId, username, imageUrl });
          return;
        } else {
          const errorText = await signInResponse.text();
          console.log("Sign-in failed:", signInResponse.status, errorText);
        }

        // If sign-in fails, register the user
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

        // Retry sign-in after successful registration
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

    // Handle successful authentication by storing token and navigating
    const handleSuccessfulAuth = (authData, userInfo) => {
      localStorage.setItem("accessToken", authData.access_token);
      localStorage.setItem("tokenType", authData.token_type);
      localStorage.setItem("telegramUser", JSON.stringify(userInfo));
      console.log("Authentication successful, token stored:", authData.access_token);
      navigate("/dashboard");
    };

    initializeAuth();
  }, [navigate]);

  // Retry authentication on user request
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