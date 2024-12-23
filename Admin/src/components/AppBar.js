import React from 'react';
import './AppBar.css';

const AppBar = ({ screenName }) => {
  const currentDate = new Date();
  const time = currentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = currentDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="app-bar">
      <div className="left-section">
        <div className="title-and-time">
          <span className="screen-name">{screenName}</span>
          <div className="time-date">
            <span className="time">{time}</span>
            <span className="date">{date}</span>
          </div>
        </div>
      </div>
      <div className="middle-section">
        <div className="search-bar">
          <img
            src={`${process.env.PUBLIC_URL}/search.png`}
            alt="Search"
            className="search-icon"
          />
          <input type="text" placeholder="Search..." className="search-input" />
        </div>
      </div>
      <div className="right-section">
        <img
          src={`${process.env.PUBLIC_URL}/notification.png`}
          alt="Notification"
          className="notification-icon"
        />
        <div className="profile">
          <img
            src={`${process.env.PUBLIC_URL}/profile-picture.png`}
            alt="Profile"
            className="profile-picture"
          />
          <div className="profile-info">
            <span className="username">Isreal A.</span>
            <span className="role">Super Admin</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppBar;
