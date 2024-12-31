import React from "react";
import "./AppBar.css";

const AppBar = ({ title, height = "24px" }) => {
  return (
    <div
      className="app-bar"
      style={{ "--app-bar-height": height }} // Customizable height via prop
    >
      {/* Title Section */}
      <div className="app-bar-left">
        <span className="app-bar-title">{title}</span>
      </div>
    </div>
  );
};

export default AppBar;
