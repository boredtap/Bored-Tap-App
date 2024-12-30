import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import "./TaskScreen.css";

const TaskScreen = () => {
  const [activeTab, setActiveTab] = useState("In-game");
  const [tasksData, setTasksData] = useState({});
  const [totalTaps, setTotalTaps] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch data from the backend
  useEffect(() => {
    const fetchTasksAndTaps = async () => {
      try {
        // Fetch total taps
        const tapsResponse = await fetch("https://bored-tap-api.onrender.com/total-taps");
        const tapsData = await tapsResponse.json();
        if (tapsResponse.ok) {
          setTotalTaps(tapsData.totalTaps);
        }

        // Fetch tasks
        const tasksResponse = await fetch("https://bored-tap-api.onrender.com/tasks");
        const tasks = await tasksResponse.json();
        if (tasksResponse.ok) {
          setTasksData(tasks);
        }
      } catch (err) {
        console.error("Error fetching tasks or taps:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTasksAndTaps();
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleLinkClick = () => {
    console.log("Navigating to 'How tasks work'...");
  };

  const handleClaimClick = async (taskId) => {
    try {
      const response = await fetch(`https://bored-tap-api.onrender.com/claim-task/${taskId}`, {
        method: "POST",
      });
      const result = await response.json();
      if (response.ok) {
        console.log(`Task claimed successfully: ${result.message}`);
        // Optionally refresh tasks after claiming
      } else {
        console.error("Error claiming task:", result.message);
      }
    } catch (err) {
      console.error("Error claiming task:", err);
    }
  };

  if (loading) {
    return <div className="loading">Loading tasks...</div>;
  }

  const tasks = tasksData[activeTab] || [];

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
            <span className="taps-number">{totalTaps.toLocaleString()}</span>
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
          {tasks.length > 0 ? (
            tasks.map((task, index) => (
              <div className="task-card" key={index}>
                <div className="task-left">
                  <img
                    src={task.imageUrl || `${process.env.PUBLIC_URL}/logo.png`}
                    alt={task.title}
                    className="task-logo"
                  />
                  <div className="task-info">
                    <p className="task-title">{task.title}</p>
                    <div className="task-value">
                      <img
                        src={`${process.env.PUBLIC_URL}/coin-icon.png`}
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
                    backgroundColor: task.bgColor || "#fff",
                    color: task.textColor || "#000",
                  }}
                  onClick={() => handleClaimClick(task.id)}
                >
                  {task.isCompleted ? "✔" : "Claim"}
                </button>
              </div>
            ))
          ) : (
            <p className="no-tasks">No tasks available in this category.</p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default TaskScreen;
