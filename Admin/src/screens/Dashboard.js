import React from 'react';
import NavigationPanel from '../components/NavigationPanel';
import AppBar from '../components/AppBar';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard">
      <NavigationPanel />
      <div className="main-wrapper">
        <AppBar screenName="Dashboard" />
        <div className="main-content">
          <div className="overview-section">
            <h2 className="overview-title">Overview</h2>
            <div className="data-frames">
              <div className="data-frame">Frame 1</div>
              <div className="data-frame">Frame 2</div>
              <div className="data-frame">Frame 3</div>
              <div className="data-frame">Frame 4</div>
            </div>
          </div>

          <div className="recent-activities">
            <h2 className="section-title">Recent Activities</h2>
            <div className="big-frame">Graph (Recent Activities)</div>
          </div>

          <div className="user-level-wallet">
            <div className="user-level">
              <h2 className="section-title">User Level</h2>
              <div className="small-frame">Graph (User Level)</div>
            </div>
            <div className="wallet-connection">
              <h2 className="section-title">Wallet Connection</h2>
              <div className="small-frame">Graph (Wallet Connection)</div>
            </div>
          </div>
        </div>
        <div className="right-panel">
          <div className="new-users">
            <h3 className="panel-title">New Users</h3>
            <div className="panel-frame">User Data</div>
          </div>
          <div className="leaderboard">
            <h3 className="panel-title">Leaderboard</h3>
            <div className="panel-frame">Leaderboard Data</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
