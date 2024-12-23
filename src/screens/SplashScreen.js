import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppBar from "../components/AppBar"; // Import AppBar
import "./SplashScreen.css"; // Import CSS for SplashScreen

const SplashScreen = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/dashboard"); // Redirect to Dashboard
    }, 10000); // 5 seconds

    return () => clearTimeout(timer); // Cleanup the timer
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
        <span className="splash-text">BoredTap App</span>
      </div>
    </div>
  );
};

export default SplashScreen;
