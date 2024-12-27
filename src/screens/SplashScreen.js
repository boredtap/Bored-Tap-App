import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppBar from "../components/AppBar"; // Import AppBar
import "./SplashScreen.css"; // Import CSS for SplashScreen

const SplashScreen = () => {
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
          // referral_id: tg.initDataUnsafe.start_param || "", // Handle referral ID
        };

        console.log("Sending Payload to API:", payload); // Debugging: Log payload

        try {
          const response = await fetch("https://bored-tap-api.onrender.com/sign-up", {
            method: "POST",
            headers: {
              "content-Type": "application/json",
              "accept": "application/json",
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

          // Navigate to the dashboard
          navigate("/dashboard");
        } catch (error) {
          console.error("Error During Registration:", error); // Debugging: Log errors
        } finally {
          setLoading(false);
        }
      };

      // Call the registration function
      registerUser(user);
    } else {
      console.error("Telegram WebApp not initialized");
      setLoading(false);
    }
  }, [navigate]);

  return (
    <div className="splash-container">
      <AppBar
        title="BoredTap"
        onBackClick={() => console.log("Back clicked")}
        onTickClick={() => console.log("Tick clicked")}
        onDropdownClick={() => console.log("Dropdown clicked")}
        onMoreClick={() => console.log("More clicked")}
      />
      <div className="splash-content">
        <img
          src={`${process.env.PUBLIC_URL}/logo.png`}
          alt="Bored Tap Logo"
          className="splash-logo"
        />
        <span className="splash-text">
          {loading ? "Authenticating..." : "Welcome to BoredTap"}
        </span>
      </div>
    </div>
  );
};

export default SplashScreen;
