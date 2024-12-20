import React from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaEllipsisV, FaChevronDown } from "react-icons/fa";
import "./AppBar.css";

const AppBar = ({
  title,
  onMoreClick = () => console.log("More button clicked"),
  height = "80px",
}) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate(-1); // Navigate to the previous screen
  };

  const handleDropdownClick = () => {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.close(); // Minimize the app using Telegram WebApp API
    } else {
      console.log("Minimizing the app...");
    }
  };

  return (
    <div
      className="app-bar"
      style={{ "--app-bar-height": height }} // Customizable height via prop
    >
      {/* Left Section */}
      <div className="app-bar-left">
        <button className="app-bar-icon" onClick={handleBackClick}>
          <FaArrowLeft />
        </button>
        <span className="app-bar-title">{title}</span>
      </div>

      {/* Right Section */}
      <div className="app-bar-right">
        <button className="app-bar-icon" onClick={handleDropdownClick}>
          <FaChevronDown />
        </button>
        <button className="app-bar-icon" onClick={onMoreClick}>
          <FaEllipsisV />
        </button>
      </div>
    </div>
  );
};

export default AppBar;
