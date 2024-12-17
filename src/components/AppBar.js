import React from "react";
import { FaArrowLeft, FaEllipsisV, FaChevronDown } from "react-icons/fa";
import "./AppBar.css";

const AppBar = ({
  title,
  onBackClick = () => console.log("Back button clicked"),
  onMoreClick = () => console.log("More button clicked"),
  onDropdownClick = () => console.log("Dropdown clicked"),
  height = "80px",
}) => {
  return (
    <div
      className="app-bar"
      style={{ "--app-bar-height": height }} // Customizable height via prop
    >
      {/* Left Section */}
      <div className="app-bar-left">
        <button className="app-bar-icon" onClick={onBackClick}>
          <FaArrowLeft />
        </button>
        <span className="app-bar-title">{title}</span>
      </div>

      {/* Right Section */}
      <div className="app-bar-right">
        <button className="app-bar-icon" onClick={onDropdownClick}>
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
