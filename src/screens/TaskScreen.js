import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import "./TaskScreen.css";

const TaskScreen = () => {
  const [activeTab, setActiveTab] = useState("In-Game"); // Default to In-Game
  const [tasksData, setTasksData] = useState([]);
  const [totalTaps, setTotalTaps] = useState(0);
  // const [loading, setLoading] = useState(true); // Commented out loading

  const taskTabs = ["In-Game", "Special", "Social", "Completed"];

  useEffect(() => {
    fetchTasksAndTaps(activeTab);
  }, [activeTab]);

  const fetchTasksAndTaps = async (taskType) => {
    // setLoading(true); // Commented out loading
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

      // Fetch tasks based on active tab
      let url = `https://bored-tap-api.onrender.com/user/tasks/my_tasks?task_type=${taskType.toLowerCase()}`;
      if (taskType === "Completed") {
        url = `https://bored-tap-api.onrender.com/user/tasks/my_tasks/completed`;
      }

      const tasksResponse = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!tasksResponse.ok) throw new Error(`Task fetch failed: ${tasksResponse.status}`);

      const tasks = await tasksResponse.json();
      setTasksData(tasks);
    } catch (err) {
      console.error("Error fetching tasks or taps:", err);
    }
    // finally { setLoading(false); } // Commented out loading
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
        fetchTasksAndTaps("Completed"); // Refresh completed tasks
      } else {
        console.error("Error claiming task:", result.message);
      }
    } catch (err) {
      console.error("Error claiming task:", err);
    }
  };

  return (
    <div className="task-container">
      <div className="task-wrapper">
        <div className="task-summary">
          <p>Your Total Taps:</p>
          <div className="tap-count">
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Logo" className="tap-icon" />
            <span className="tap-number">{totalTaps.toLocaleString()}</span>
          </div>
          <p className="tap-info">Earn BT-coin rewards by completing simple tasks</p>
        </div>

        {/* Pagination Tabs */}
        <div className="task-tabs">
          {taskTabs.map((tab) => (
            <span
              key={tab}
              className={`task-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => handleTabClick(tab)}
            >
              {tab}
            </span>
          ))}
        </div>

        {/* Task List */}
        <div className="task-list">
          {tasksData.length > 0 ? (
            tasksData.map((task, index) => (
              <div className="task-item" key={index}>
                <div className="task-details">
                  <img
                    src={task.task_image} // Uses uploaded image
                    alt={task.task_name}
                    className="task-thumbnail"
                  />
                  <div className="task-meta">
                    <p className="task-name">{task.task_name}</p>
                    <div className="task-reward">
                      <img
                        src={`${process.env.PUBLIC_URL}/logo.png`}
                        alt="Coin Icon"
                        className="coin-icon"
                      />
                      <span>{task.task_reward}</span>
                    </div>
                  </div>
                </div>
                <button
                  className="task-action"
                  onClick={() => handleClaimClick(task.id)}
                >
                  Claim
                </button>
              </div>
            ))
          ) : (
            <p className="no-task-message">No tasks available in this category.</p>
          )}
        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default TaskScreen;
