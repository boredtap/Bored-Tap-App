import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import "./TaskScreen.css";

const TaskScreen = () => {
  const [activeTab, setActiveTab] = useState("in-game"); // API expects lowercase
  const [tasksData, setTasksData] = useState([]);
  const [totalTaps, setTotalTaps] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasksAndTaps(activeTab);
  }, [activeTab]);

  const fetchTasksAndTaps = async (taskType) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("No access token found");
        return;
      }

      // Fetch user profile
      const profileResponse = await fetch("https://bored-tap-api.onrender.com/user/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!profileResponse.ok) throw new Error(`Profile fetch failed: ${profileResponse.status}`);
      
      const profileData = await profileResponse.json();
      setTotalTaps(profileData.total_coins);

      // Fetch tasks based on the active tab
      const tasksResponse = await fetch(
        `https://bored-tap-api.onrender.com/user/tasks/my_tasks?task_type=${taskType}`, 
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!tasksResponse.ok) throw new Error(`Task fetch failed: ${tasksResponse.status}`);

      const tasks = await tasksResponse.json();
      setTasksData(tasks);
    } catch (err) {
      console.error("Error fetching tasks or taps:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleClaimClick = async (taskId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `https://bored-tap-api.onrender.com/user/tasks/my_tasks/completed`, 
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ task_id: taskId }),
        }
      );

      const result = await response.json();
      if (response.ok) {
        console.log(`Task claimed successfully: ${result.message}`);
        fetchTasksAndTaps(activeTab);
      } else {
        console.error("Error claiming task:", result.message);
      }
    } catch (err) {
      console.error("Error claiming task:", err);
    }
  };

  return (
    <div className="task-screen">
      <div className="task-body">
        <div className="total-taps">
          <p>Your Total Taps:</p>
          <div className="taps-display">
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Logo" className="taps-logo" />
            <span className="taps-number">{totalTaps.toLocaleString()}</span>
          </div>
          <p className="tap-rewards">Earn BT-coin rewards by completing simple tasks</p>
        </div>

        <div className="pagination">
          {["in-game", "completed"].map((tab) => (
            <span
              key={tab}
              className={`pagination-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => handleTabClick(tab)}
            >
              {tab.replace("-", " ").toUpperCase()}
            </span>
          ))}
        </div>

        <div className="task-cards">
          {loading ? (
            <p className="loading">Loading tasks...</p>
          ) : tasksData.length > 0 ? (
            tasksData.map((task, index) => (
              <div className="task-card" key={index}>
                <div className="task-left">
                  <img
                    src={task.task_image || `${process.env.PUBLIC_URL}/logo.png`}
                    alt={task.task_name}
                    className="task-logo"
                  />
                  <div className="task-info">
                    <p className="task-title">{task.task_name}</p>
                    <div className="task-value">
                      <img
                        src={`${process.env.PUBLIC_URL}/coin-icon.png`}
                        alt="Coin Icon"
                        className="small-logo"
                      />
                      <span>{task.task_reward}</span>
                    </div>
                  </div>
                </div>
                <button
                  className="task-cta"
                  onClick={() => handleClaimClick(task.id)}
                >
                  Claim
                </button>
              </div>
            ))
          ) : (
            <p className="no-tasks">No tasks available in this category.</p>
          )}
        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default TaskScreen;
