import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Navigation.css";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get current route

  return (
    <div className="navigation-bar">
      <div
        className={`navigation-item ${location.pathname === "/dashboard" ? "active" : ""}`}
        onClick={() => navigate("/dashboard")}
      >
        <img
          src={`${process.env.PUBLIC_URL}/earn.png`}
          alt="Earn Icon"
          className="navigation-icon"
        />
        <span>Earn</span>
      </div>
      <div
        className={`navigation-item ${location.pathname === "/task-screen" ? "active" : ""}`}
        onClick={() => navigate("/task-screen")}
      >
        <img
          src={`${process.env.PUBLIC_URL}/task.png`}
          alt="Tasks Icon"
          className="navigation-icon"
        />
        <span>Tasks</span>
      </div>
      <div
        className={`navigation-item ${location.pathname === "/invite-screen" ? "active" : ""}`}
        onClick={() => navigate("/invite-screen")}
      >
        <img
          src={`${process.env.PUBLIC_URL}/invite.png`}
          alt="Invite Icon"
          className="navigation-icon"
        />
        <span>Invite</span>
      </div>
      <div
        className={`navigation-item ${location.pathname === "/wallet-screen" ? "active" : ""}`}
        onClick={() => navigate("/wallet-screen")}
      >
        <img
          src={`${process.env.PUBLIC_URL}/wallet.png`}
          alt="Wallet Icon"
          className="navigation-icon"
        />
        <span>Wallet</span>
      </div>
    </div>
  );
};

export default Navigation;
