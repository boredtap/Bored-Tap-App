import React from "react";
import "./CTAButton.css";

const CTAButton = ({ isActive, text, onClick }) => {
  return (
    <button
      className={`cta-button ${isActive ? "active" : "inactive"}`}
      onClick={isActive ? onClick : null}
    >
      {text}
    </button>
  );
};

export default CTAButton;
