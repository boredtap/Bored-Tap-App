import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const TelegramLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ensure Telegram WebApp is loaded
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      console.log("Telegram WebApp Initialized:", tg); // Debugging: Log Telegram WebApp

      const user = tg.initDataUnsafe?.user;

      // Validate user data
      if (!user || !user.id) {
        console.error("User data is missing or invalid:", tg.initDataUnsafe);
        setLoading(false);
        return;
      }

      console.log("User Data Retrieved from Telegram:", user); // Debugging: Log user data

      const registerUser = async (user) => {
        const payload = {
          telegram_user_id: user.id,
          username: user.username,
          image_url: user.photo_url,
          referral_id: user.referral_id,
        };

        console.log("Sending Payload to API:", payload); // Debugging: Log payload

        try {
          const response = await fetch("https://bored-tap-api.onrender.com/sign-up", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          console.log("API Response:", response); // Debugging: Log response

          if (!response.ok) {
            console.error("API Request Failed:", response.status, response.statusText);
            throw new Error(`API Request Failed: ${response.status}`);
          }

          const data = await response.json();
          console.log("User Successfully Registered:", data); // Debugging: Log response data

          navigate("/splash-screen");
        } catch (error) {
          console.error("Error During Registration:", error); // Debugging: Log errors
        } finally {
          setLoading(false);
        }
      };

      registerUser(user);
    } else {
      console.error("Telegram WebApp is not initialized.");
      setLoading(false);
    }
  }, [navigate]);

  return (
    <div>
      {loading ? (
        <h1>Connecting with Telegram...</h1>
      ) : (
        <h1>Failed to connect. Please try again.</h1>
      )}
    </div>
  );
};

export default TelegramLogin;
