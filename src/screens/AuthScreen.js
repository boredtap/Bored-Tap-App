// src/screens/AuthScreen.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn, signUp, setAuthData } from '../services/authService';
import './AuthScreen.css';

const AuthScreen = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeTelegram = async () => {
      try {
        if (!window.Telegram?.WebApp) {
          throw new Error("Telegram WebApp not initialized");
        }

        const webApp = window.Telegram.WebApp;
        const userData = webApp.initDataUnsafe?.user;

        if (!userData || !userData.id) {
          throw new Error("User data is missing or invalid");
        }

        const userInfo = {
          telegram_user_id: String(userData.id),
          username: userData.username || `User${userData.id}`,
          image_url: userData.photo_url || "",
        };

        try {
          // Attempt to sign in
          const authData = await signIn(userInfo.username, userInfo.telegram_user_id);
          setAuthData(authData, userInfo);
          navigate("/splash");
          return;
        } catch (signInError) {
          console.log("Sign-in failed, attempting registration:", signInError);
          
          // If sign-in fails, attempt registration
          await signUp(userInfo);
          
          // After successful registration, attempt sign-in again
          const authData = await signIn(userInfo.username, userInfo.telegram_user_id);
          setAuthData(authData, userInfo);
          navigate("/splash");
        }
      } catch (err) {
        console.error("Authentication error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeTelegram();
  }, [navigate]);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    window.location.reload();
  };

  return (
    <div className="auth-container">
      <div className="auth-content">
        <img
          src={`${process.env.PUBLIC_URL}/logo.png`}
          alt="Bored Tap Logo"
          className="auth-logo"
        />
        <div className="auth-status">
          {loading ? (
            <div className="loading-spinner">Initializing...</div>
          ) : error ? (
            <div className="error-message">
              <p>Error: {error}</p>
              <button onClick={handleRetry} className="retry-button">
                Retry
              </button>
            </div>
          ) : (
            <div className="success-message">Authentication successful!</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;