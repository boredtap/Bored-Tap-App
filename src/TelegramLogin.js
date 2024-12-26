import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const TelegramLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      const user = tg.initDataUnsafe?.user;

      if (!user) {
        console.error("Telegram WebApp user data is not available.");
        setLoading(false);
        return;
      }

      const registerUser = async (user) => {
        const payload = {
          telegram_user_id: user.id,
          username: user.username,
          image_url: user.photo_url,
        };

        console.log("Payload:", payload); // Debugging

        try {
          const response = await fetch("https://bored-tap-api.onrender.com/sign-up", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          console.log("Fetch Success:", data); // Debugging
          navigate("/splash-screen");
        } catch (error) {
          console.error("Registration Failed:", error);
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
