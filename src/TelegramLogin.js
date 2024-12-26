import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const TelegramLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!window.Telegram || !window.Telegram.WebApp) {
      console.error("Telegram WebApp is not available.");
      setLoading(false);
      return;
    }

    const tg = window.Telegram.WebApp;
    const initData = tg.initDataUnsafe || {};
    const user = initData.user || null;

    if (!user || !user.id) {
      console.error("Telegram user data is not available:", initData);
      setLoading(false);
      return;
    }

    console.log("Telegram Init Data:", initData);

    const payload = {
      telegram_user_id: user.id,
      username: user.username || "",
      image_url: user.photo_url || "",
    };

    console.log("Payload:", payload);

    const registerUser = async () => {
      try {
        const response = await fetch("https://bored-tap-api.onrender.com/sign-up", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        console.log("API Response Status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
        }

        const data = await response.json();
        console.log("Registration Success:", data);
        navigate("/splash-screen");
      } catch (error) {
        console.error("Registration Failed:", error);
      } finally {
        setLoading(false);
      }
    };

    registerUser();
  }, [navigate]);

  return (
    <div>
      {loading ? <p>Connecting with Telegram...</p> : <p>Failed to connect. Check logs for details.</p>}
    </div>
  );
};

export default TelegramLogin;
