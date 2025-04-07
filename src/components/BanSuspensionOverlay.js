import React, { useEffect, useState } from "react";
import "./BanSuspensionOverlay.css";

const BanSuspensionOverlay = ({ status, remainingTime }) => {
  const [countdown, setCountdown] = useState(remainingTime || 0);

  useEffect(() => {
    if (status === "suspended" && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1000;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status, countdown]);

  const formatTime = (ms) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${days.toString().padStart(2, "0")}day : ${hours.toString().padStart(2, "0")}hrs : ${minutes.toString().padStart(2, "0")}mins`;
  };

  const iconSrc = status === "banned" 
    ? `${process.env.PUBLIC_URL}/ban.png` 
    : `${process.env.PUBLIC_URL}/suspend.png`;

  return (
    <div className="ban-overlay-backdrop">
      <div className="ban-overlay-container">
        <div className="ban-overlay-content">
          <img src={iconSrc} alt={`${status} Icon`} className="ban-status-icon" />
          <p className="ban-text">Your Account is</p>
          <h2 className="ban-status">{status.toUpperCase()}!</h2>
          {status === "suspended" && countdown > 0 && (
            <p className="ban-countdown">{formatTime(countdown)}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BanSuspensionOverlay;