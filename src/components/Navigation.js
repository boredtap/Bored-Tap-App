import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Navigation.css";

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Get the current route path

  // Define navigation items with their paths, labels, and icons
  const navItems = [
    { path: "/dashboard", label: "Earn", icon: "earn.png" },
    { path: "/task-screen", label: "Tasks", icon: "task.png" },
    { path: "/invite-screen", label: "Invite", icon: "invite.png" },
    { path: "/wallet-screen", label: "Wallet", icon: "wallet.png" },
  ];

  return (
    <div className="navigation-bar">
      {navItems.map((item) => (
        <div
          key={item.path}
          className={`navigation-item ${
            location.pathname === item.path ? "active" : ""
          }`}
          onClick={() => navigate(item.path)}
        >
          <img
            src={`${process.env.PUBLIC_URL}/${item.icon}`}
            alt={`${item.label} Icon`}
            className="navigation-icon"
          />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
};

export default Navigation;