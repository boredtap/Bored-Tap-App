import React from "react";
import "./Navigation.css";

const Navigation = () => {
  return (
    <div className="navigation-bar">
      <div className="navigation-item">
        <img
          src={`${process.env.PUBLIC_URL}/earn.png`}
          alt="Earn Icon"
          className="navigation-icon"
        />
        <span>Earn</span>
      </div>
      <div className="navigation-item">
        <img
          src={`${process.env.PUBLIC_URL}/task.png`}
          alt="Tasks Icon"
          className="navigation-icon"
        />
        <span>Tasks</span>
      </div>
      <div className="navigation-item">
        <img
          src={`${process.env.PUBLIC_URL}/invite.png`}
          alt="Invite Icon"
          className="navigation-icon"
        />
        <span>Invite</span>
      </div>
      <div className="navigation-item">
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
