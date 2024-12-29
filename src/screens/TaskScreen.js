import React, { useState } from "react";
import Navigation from "../components/Navigation";
import "./TaskScreen.css";

const TaskScreen = () => {
  const [activeTab, setActiveTab] = useState("In-game");

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleBackClick = () => {
    console.log("Navigating back from Task Screen...");
  };

  const handleMoreClick = () => {
    console.log("Opening more options...");
  };

  const handleLinkClick = () => {
    console.log("Navigating to 'How tasks work'...");
  };

  const handleClaimClick = (task) => {
    console.log(`Claiming reward for task: ${task}`);
  };

  const tasksData = {
    "In-game": [
      { title: "Invite 1 Friend", value: "2,000", bgColor: "#fff", textColor: "#000" },
      { title: "Invite 5 Friends", value: "10,000", bgColor: "#000", textColor: "orange" },
      { title: "Earn 50,000 BT Coin", value: "5,000", bgColor: "#000", textColor: "orange" },
      { title: "Earn 100,000 BT Coin", value: "8,000", bgColor: "#000", textColor: "orange" },
    ],
    "Special": [
      { title: "Welcome to Bored Tap", value: "2,000", bgColor: "#fff", textColor: "#000" },
      { title: "Unlock the Power of Taps", value: "10,000", bgColor: "#000", textColor: "orange" },
      { title: "Exploring Bored Tap Features", value: "5,000", bgColor: "#000", textColor: "orange" },
      { title: "Streaks and Milestones", value: "8,000", bgColor: "#000", textColor: "orange" },
    ],
    "Social": [
      { title: "Follow BoredTap on Youtube", value: "2,000", bgColor: "#fff", textColor: "#000" },
      { title: "Follow BoredTap on X", value: "10,000", bgColor: "#000", textColor: "orange" },
      { title: "Follow BoredTap on Tiktok", value: "5,000", bgColor: "#000", textColor: "orange" },
      { title: "Follow BoredTap on Facebook", value: "8,000", bgColor: "#000", textColor: "orange" },
    ],
    "Completed": [
      { title: "Invite 1 Friend", value: "2,000", bgColor: "#000", textColor: "orange", isCompleted: true },
      { title: "Invite 5 Friends", value: "10,000", bgColor: "#000", textColor: "orange", isCompleted: true },
      { title: "Earn 50,000 BT Coin", value: "5,000", bgColor: "#000", textColor: "orange", isCompleted: true },
      { title: "Earn 100,000 BT Coin", value: "8,000", bgColor: "#000", textColor: "orange", isCompleted: true },
    ],
  };

  const tasks = tasksData[activeTab];

  return (
    <div className="task-screen">

      {/* Body */}
      <div className="task-body">
        {/* Total Taps */}
        <div className="total-taps">
          <p>Your Total Taps:</p>
          <div className="taps-display">
            <img
              src={`${process.env.PUBLIC_URL}/logo.png`}
              alt="Logo"
              className="taps-logo"
            />
            <span className="taps-number">3,289,198</span>
          </div>
          <p className="tap-rewards">
            Earn BT-coin rewards by completing simple tasks
          </p>
          <p className="how-tasks-work" onClick={handleLinkClick}>
            How tasks work?
          </p>
        </div>

        {/* Pagination */}
        <div className="pagination">
          {Object.keys(tasksData).map((tab) => (
            <span
              key={tab}
              className={`pagination-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => handleTabClick(tab)}
            >
              {tab}
            </span>
          ))}
        </div>

        {/* Task Cards */}
        <div className="task-cards">
          {tasks.map((task, index) => (
            <div className="task-card" key={index}>
              <div className="task-left">
                <img
                  src={`${process.env.PUBLIC_URL}/logo.png`}
                  alt={task.title}
                  className="task-logo"
                />
                <div className="task-info">
                  <p className="task-title">{task.title}</p>
                  <div className="task-value">
                    <img
                      src={`${process.env.PUBLIC_URL}/logo.png`}
                      alt="Coin Icon"
                      className="small-logo"
                    />
                    <span>{task.value}</span>
                  </div>
                </div>
              </div>
              <button
                className="task-cta"
                style={{
                  backgroundColor: task.bgColor,
                  color: task.textColor,
                }}
                onClick={() => handleClaimClick(task.title)}
              >
                {task.isCompleted ? "✔" : "Claim"}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default TaskScreen;
