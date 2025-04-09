import React, { useState, useEffect, useContext } from "react";
import Navigation from "../components/Navigation";
import "./TaskScreen.css";
import { BoostContext } from "../context/BoosterContext";
import { BASE_URL } from "../utils/BaseVariables";

// TaskScreen component
const TaskScreen = () => {
  const { totalTaps } = useContext(BoostContext);
  const [activeTab, setActiveTab] = useState("In-Game");
  const [tasksData, setTasksData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOverlay, setShowOverlay] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const taskTabs = {
    "In-Game": "In-Game",
    "Special": "Special",
    "Social": "Social",
    "Completed": "Completed",
  };

  useEffect(() => {
    fetchTasksAndTaps(activeTab);
  }, [activeTab]);

  const fetchTasksAndTaps = async (taskType) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("No access token found");

      const profileResponse = await fetch(`${BASE_URL}/user/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!profileResponse.ok) throw new Error(`Profile fetch failed: ${profileResponse.status}`);

      const url =
        taskType === "Completed"
          ? `${BASE_URL}/user/tasks/my_tasks/completed_tasks`
          : `${BASE_URL}/user/tasks/my_tasks?task_type=${taskType.toLowerCase()}`;

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
      setLoading(false);
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  const handleClaimClick = async (task) => {
    const token = localStorage.getItem("accessToken");
    const taskUrl = task.task_url; // Use task_url directly

    if (taskUrl && !task.completed) {
      // Perform task (redirect to external URL)
      try {
        const response = await fetch(`${BASE_URL}/user/tasks/my_tasks/${task.id}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          window.open(taskUrl, "_blank"); // Open URL in new tab
          // Optimistically update task status
          setTasksData((prev) =>
            prev.map((t) =>
              t.id === task.id ? { ...t, completed: true } : t
            )
          );
        } else {
          console.error("Error performing task:", await response.json());
        }
      } catch (err) {
        console.error("Error performing task:", err);
      }
    } else if (task.completed) {
      // Claim reward
      try {
        const response = await fetch(`${BASE_URL}/user/tasks/my_tasks/${task.id}/claim_reward`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const result = await response.json();
          setSelectedTask({ ...task, rewardMessage: result.message });
          setShowOverlay(true);
          fetchTasksAndTaps(activeTab); // Refresh tasks
        } else {
          console.error("Error claiming reward:", await response.json());
        }
      } catch (err) {
        console.error("Error claiming reward:", err);
      }
    }
  };

  const handleCloseOverlay = () => {
    setShowOverlay(false);
    setSelectedTask(null);
  };

  return (
    <div className="task-screen">
      <div className="task-body">
        <div className="total-taps">
          <p>Your Total Taps:</p>
          <div className="taps-display">
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Logo" className="taps-logo" />
            <span className="taps-number">{totalTaps?.toLocaleString() ?? 0}</span>
          </div>
          <p className="tap-info">Earn BT-coin rewards by completing simple tasks</p>
        </div>

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

        <div className="task-list-container">
          <div className="task-list">
            {loading ? (
              <p className="loading-message">Fetching Tasks...</p>
            ) : tasksData.length > 0 ? (
              tasksData.map((task) => {
                const isClaimable = task.completed || activeTab === "Completed";
                const taskImage = task.task_image
                  ? `data:image/png;base64,${task.task_image}`
                  : `${process.env.PUBLIC_URL}/logo.png`;
                const hasTaskUrl = !!task.task_url; // Check if task_url exists

                return (
                  <div className="task-item" key={task.id}>
                    <div className="task-details">
                      <img
                        src={taskImage}
                        alt={task.task_name}
                        className="task-thumbnail"
                        onError={(e) => (e.target.src = `${process.env.PUBLIC_URL}/logo.png`)}
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
                      onClick={() => handleClaimClick(task)}
                      disabled={!hasTaskUrl && !task.completed} // Disable if no task_url and not completed
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
                src={
                  selectedTask.task_image
                    ? `data:image/png;base64,${selectedTask.task_image}`
                    : `${process.env.PUBLIC_URL}/logo.png`
                }
                alt="Task Icon"
                className="overlay-task-icon"
                onError={(e) => (e.target.src = `${process.env.PUBLIC_URL}/logo.png`)}
              />
              <p className="overlay-text">Your reward of</p>
              <div className="overlay-reward-value">
                <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="Coin Icon" className="overlay-coin-icon" />
                <span>{selectedTask.task_reward}</span>
              </div>
              <p className="overlay-message">
                {selectedTask.rewardMessage || "has been added to your coin balance"}
              </p>
              <button className="overlay-cta clickable" onClick={handleCloseOverlay}>
                Ok
              </button>
            </div>
          </div>
        </div>
      )}

      <Navigation />
    </div>
  );
};

export default TaskScreen;