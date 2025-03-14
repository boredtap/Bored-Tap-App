import React, { useState, useEffect, useContext } from "react";
import Navigation from "../components/Navigation";
import "./TaskScreen.css";
import { BoostContext } from "../context/BoosterContext";

// TaskScreen component displays user's tasks across categories with claim functionality
const TaskScreen = () => {
  const { totalTaps } = useContext(BoostContext)
  const [activeTab, setActiveTab] = useState("In-Game"); // Default active tab
  const [tasksData, setTasksData] = useState([]); // Holds tasks data for the active tab

  const [loading, setLoading] = useState(true); // Loading state for data fetching
  const [showOverlay, setShowOverlay] = useState(false); // Controls overlay visibility
  const [selectedTask, setSelectedTask] = useState(null); // Tracks the task being claimed

  // Define custom tab labels matching RewardScreen style
  const taskTabs = {
    "In-Game": "In-Game",
    "Special": "Special",
    "Social": "Social",
    "Completed": "Completed",
  };

  // Fetch tasks and total taps when active tab changes
  useEffect(() => {
    fetchTasksAndTaps(activeTab);
  }, [activeTab]);

  // Fetch tasks and user profile data based on the active tab
  const fetchTasksAndTaps = async (taskType) => {
    setLoading(true); // Start loading state
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.error("No access token found");
        return;
      }

      // Fetch user profile for total taps
      const profileResponse = await fetch("https://bt-coins.onrender.com/user/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!profileResponse.ok) throw new Error(`Profile fetch failed: ${profileResponse.status}`);

      const profileData = await profileResponse.json();

      // Determine the URL based on active tab
      let url = `https://bt-coins.onrender.com/user/tasks/my_tasks?task_type=${taskType.toLowerCase()}`;
      if (taskType === "Completed") {
        url = `https://bt-coins.onrender.com/user/tasks/my_tasks/completed`;
      }

      // Fetch tasks for the active tab
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
    } finally {
      setLoading(false); // End loading state
    }
  };

  // Handle tab switching
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  // Handle claiming a task and show overlay
  const handleClaimClick = async (taskId) => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `https://bt-coins.onrender.com/user/tasks/my_tasks/completed`,
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
        // Show overlay with task details
        const claimedTask = tasksData.find((t) => t.id === taskId);
        setSelectedTask(claimedTask);
        setShowOverlay(true);

        // Refresh completed tasks
        fetchTasksAndTaps("Completed");
      } else {
        console.error("Error claiming task:", result.message);
      }
    } catch (err) {
      console.error("Error claiming task:", err);
    }
  };

  // Close overlay and reset selected task
  const handleCloseOverlay = () => {
    setShowOverlay(false);
    setSelectedTask(null);
  };

  return (
    <div className="task-screen">
      <div className="task-body">
        {/* Total Taps Summary */}
        <div className="total-taps">
          <p>Your Total Taps:</p>
          <div className="taps-display">
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Logo" className="taps-logo" />
            <span className="taps-number">{totalTaps?.toLocaleString() ?? 0}</span>
          </div>
          <p className="tap-info">Earn BT-coin rewards by completing simple tasks</p>
        </div>

        {/* Pagination Tabs */}
        <div className="pagination">
          {Object.keys(taskTabs).map((tab) => (
            <span
              key={tab}
              className={`pagination-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => handleTabClick(tab)}
            >
              {taskTabs[tab]}
            </span>
          ))}
        </div>

        {/* Scrollable Task List Container */}
        <div className="task-list-container">
          <div className="task-list">
            {loading ? (
              <p className="loading-message">Fetching Tasks...</p>
            ) : tasksData.length > 0 ? (
              tasksData.map((task) => {
                // Assume task.completed indicates if the task is claimable (adjust based on API)
                const isClaimable = task.completed || activeTab === "Completed";
                return (
                  <div className="task-item" key={task.id}>
                    <div className="task-details">
                      <img
                        src={`data:image/png;base64,${task.task_image}`}
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
                      className={`task-action ${isClaimable ? "active clickable" : "inactive"}`}
                      onClick={() => handleClaimClick(task.id)}
                      disabled={!isClaimable}
                    >
                      Claim
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="no-task-message">No tasks available in this category.</p>
            )}
          </div>
        </div>
      </div>

      {/* Overlay for Claim Confirmation */}
      {showOverlay && selectedTask && (
        <div className="overlay-container7">
          <div className={`task-overlay7 ${showOverlay ? "slide-in" : "slide-out"}`}>
            <div className="overlay-header7">
              <h2 className="overlay-title7">Claim Reward</h2>
              <img
                src={`${process.env.PUBLIC_URL}/cancel.png`}
                alt="Cancel"
                className="overlay-cancel"
                onClick={handleCloseOverlay}
              />
            </div>
            <div className="overlay-divider"></div>
            <div className="overlay-content7">
              <img
                src={`data:image/png;base64,${selectedTask.task_image}`}
                alt="Task Icon"
                className="overlay-task-icon"
              />
              <p className="overlay-text">Your reward of</p>
              <div className="overlay-reward-value">
                <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Coin Icon" className="overlay-coin-icon" />
                <span>{selectedTask.task_reward}</span>
              </div>
              <p className="overlay-message">has been added to your coin balance</p>
              <button className="overlay-cta clickable" onClick={handleCloseOverlay}>
                Ok
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <Navigation />
    </div>
  );
};

export default TaskScreen;