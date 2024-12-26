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
    const referral_id = initData.start_param || "";

    if (!user || !user.id) {
      console.error("User data is not available in Telegram initDataUnsafe.");
      setLoading(false);
      return;
    }

    const registerUser = async (user) => {
      const formData = new FormData();
      formData.append("telegram_user_id", user.id);
      formData.append("username", user.username || "");
      formData.append("image_url", user.photo_url || "");

      try {
        const response = await fetch("https://bored-tap-api.onrender.com/sign-up", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
        }

        const data = await response.json();
        console.log("Fetch Success:", data);
        navigate("/splash-screen");
      } catch (error) {
        console.error("Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };

    registerUser(user);
  }, [navigate]);

  return (
    <div>
      {loading ? <p>Loading...</p> : <p>Connecting with Telegram...</p>}
    </div>
  );
};

export default TelegramLogin;
