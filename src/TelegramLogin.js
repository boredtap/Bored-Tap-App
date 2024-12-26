import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const TelegramLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      const user = tg.initDataUnsafe.user;
      const referral_id = tg.initDataUnsafe.start_param || "";

      const registerUser = async (user) => {
        const formData = new FormData();
        formData.append("telegram_user_id", user.id);
        formData.append("username", user.username);
        formData.append("image_url", user.photo_url);

        try {
          const response = await fetch("https://bored-tap-api.onrender.com/sign-up", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          console.log("Fetch Success:", data); // Debugging line

          // Redirect to splashscreen upon successful login
          navigate("/splash-screen");
        } catch (error) {
          console.error("Fetch Error:", error); // Debugging line
        } finally {
          setLoading(false);
        }
      };

      if (user && user.id) {
        registerUser(user);
      } else {
        console.error("User data not available from Telegram");
        setLoading(false);
      }
    }
  }, [navigate]);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      {loading ? (
        <h1>Loading...</h1>
      ) : (
        <h1>Connecting with Telegram...</h1>
      )}
    </div>
  );
};

export default TelegramLogin;
