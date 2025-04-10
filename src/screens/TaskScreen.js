import React, { useState, useEffect, useCallback, useContext } from "react";
import Navigation from "../components/Navigation";
import "./TaskScreen.css";
import { BoostContext } from "../context/BoosterContext";
import { BASE_URL } from "../utils/BaseVariables";

const TaskScreen = () => {
  const { totalTaps } = useContext(BoostContext);
  const [activeTab, setActiveTab] = useState("In-Game");
  const [tasksData, setTasksData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPerformOverlay, setShowPerformOverlay] = useState(false);
  const [performResult, setPerformResult] = useState(null);
  const [showRewardOverlay, setShowRewardOverlay] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showShareOverlay, setShowShareOverlay] = useState(false);
  const [shareTask, setShareTask] = useState(null);
  const [showCopyPopup, setShowCopyPopup] = useState(false);

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
      console.error("Error fetching tasks:", err);
      setTasksData([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePerformTask = useCallback(async (task) => {
    const token = localStorage.getItem("accessToken");

    if (activeTab === "Social" || activeTab === "Special") {
      if (task.task_url) {
        window.open(task.task_url, "_blank");
        setPerformResult({ message: "Task opened in new tab. Return to claim your reward.", success: true });
        setSelectedTask(task);
        setShowPerformOverlay(true);

        // Mark as eligible locally after redirect (no backend perform route)
        setTimeout(() => {
          setTasksData((prev) =>
            prev.map((t) => (t.task_id === task.task_id ? { ...t, eligible: true } : t))
          );
        }, 1000); // Short delay to simulate redirect and return
      } else {
        setPerformResult({ message: "No task URL provided", success: false });
        setSelectedTask(task);
        setShowPerformOverlay(true);
      }
    } else {
      // For In-Game
      try {
        const response = await fetch(`${BASE_URL}/user/tasks/my_tasks/${task.task_id}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const result = await response.json();
        const isEligible = response.ok && !result.message.includes("not completed");

        setPerformResult({
          message: result.message || (isEligible ? "Task performed successfully" : "Task not completed"),
          success: isEligible,
        });
        setSelectedTask(task);
        setShowPerformOverlay(true);

        if (isEligible) {
          setTasksData((prev) =>
            prev.map((t) => (t.task_id === task.task_id ? { ...t, eligible: true } : t))
          );
        }
      } catch (err) {
        console.error("Error performing In-Game task:", err);
        setPerformResult({ message: "Error performing task", success: false });
        setSelectedTask(task);
        setShowPerformOverlay(true);
      }
    }
  }, [activeTab]);

  const handleClaimReward = useCallback(async (task) => {
    const token = localStorage.getItem("accessToken");
    try {
      const response = await fetch(`${BASE_URL}/user/tasks/my_tasks/${task.task_id}/claim_reward`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to claim reward: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      setSelectedTask({ ...task, rewardMessage: result.message });
      setShowRewardOverlay(true);

      // Refetch tasks to move to Completed tab
      fetchTasksAndTaps(activeTab);
    } catch (err) {
      console.error("Error claiming reward:", err);
      alert(`Failed to claim reward: ${err.message}`);
    }
  }, [activeTab]);

  const handleTabClick = useCallback((tab) => setActiveTab(tab), []);

  const handleClosePerformOverlay = useCallback(() => {
    setShowPerformOverlay(false);
    setPerformResult(null);
    setSelectedTask(null);
  }, []);

  const handleCloseRewardOverlay = useCallback(() => {
    setShowRewardOverlay(false);
    setSelectedTask(null);
  }, []);

  const handleShareTask = useCallback((task) => {
    setShareTask(task);
    setShowShareOverlay(true);
  }, []);

  const handleCloseShareOverlay = useCallback(() => {
    setShowShareOverlay(false);
    setShareTask(null);
  }, []);

  const shareLink = `https://t.me/Bored_Tap_Bot?start=task_${shareTask?.task_id || ""}`;
  const shareMessage = `I just completed "${shareTask?.task_name}" and earned ${shareTask?.task_reward} BT Coins on Bored Tap! Join me!`;

  const handleTelegramShare = () => {
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(shareMessage)}`;
    window.open(telegramUrl, "_blank");
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage + " " + shareLink)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(shareLink);
    setShowCopyPopup(true);
    setTimeout(() => setShowCopyPopup(false), 2000);
  };

  return (
    <div className="task-screen">
      <div className="task-body">
        <div className="total-taps">
          <p>Your Total Taps:</p>
          <div className="taps-display">
            <img src={`${process.env.PUBLIC_URL}/logo.png`} alt="BT Coin Logo" className="taps-logo" />
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
                const taskImage = task.task_image_id
                  ? `${BASE_URL}/images/${task.task_image_id}`
                  : `${process.env.PUBLIC_URL}/logo.png`;
                const isEligible = task.eligible || task.completed;

                return (
                  <div
                    className="task-item clickable"
                    key={task.task_id}
                    onClick={() =>
                      activeTab !== "Completed" && !isEligible ? handlePerformTask(task) : null
                    }
                  >
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
                    {activeTab === "Completed" ? (
                      <div
                        className="task-share-icon clickable"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShareTask(task);
                        }}
                      >
                        <img
                          src={`${process.env.PUBLIC_URL}/share-icon.png`}
                          alt="Share Icon"
                          className="share-icon"
                        />
                      </div>
                    ) : (
                      <button
                        className={`task-action ${isEligible ? "active" : "inactive"}`}
                        disabled={!isEligible}
                        onClick={(e) => {
                          e.stopPropagation();
                          isEligible && handleClaimReward(task);
                        }}
                      >
                        Claim
                      </button>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="no-task-message">No tasks available in this category.</p>
            )}
          </div>
        </div>
      </div>

      {showPerformOverlay && performResult && (
        <div className="overlay-backdrop">
          <div className="overlay-container7">
            <div className={`task-overlay7 ${showPerformOverlay ? "slide-in" : "slide-out"}`}>
              <div className="overlay-header7">
                <h2 className="overlay-title7">Task Status</h2>
                <img
                  src={`${process.env.PUBLIC_URL}/cancel.png`}
                  alt="Cancel"
                  className="overlay-cancel"
                  onClick={handleClosePerformOverlay}
                />
              </div>
              <div className="overlay-divider"></div>
              <div className="overlay-content7">
                <img
                  src={
                    performResult.success
                      ? `${process.env.PUBLIC_URL}/claim.gif`
                      : `${process.env.PUBLIC_URL}/logo.png`
                  }
                  alt="Task Icon"
                  className="overlay-task-icon"
                />
                <p className="overlay-text">{performResult.message}</p>
                <button className="overlay-cta clickable" onClick={handleClosePerformOverlay}>
                  Ok
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRewardOverlay && selectedTask && (
        <div className="overlay-backdrop">
          <div className="overlay-container7">
            <div className={`task-overlay7 ${showRewardOverlay ? "slide-in" : "slide-out"}`}>
              <div className="overlay-header7">
                <h2 className="overlay-title7">Claim Reward</h2>
                <img
                  src={`${process.env.PUBLIC_URL}/cancel.png`}
                  alt="Cancel"
                  className="overlay-cancel"
                  onClick={handleCloseRewardOverlay}
                />
              </div>
              <div className="overlay-divider"></div>
              <div className="overlay-content7">
                <img
                  src={
                    selectedTask.task_image_id
                      ? `${BASE_URL}/images/${selectedTask.task_image_id}`
                      : `${process.env.PUBLIC_URL}/logo.png`
                  }
                  alt="Task Icon"
                  className="overlay-task-icon"
                  onError={(e) => (e.target.src = `${process.env.PUBLIC_URL}/logo.png`)}
                />
                <p className="overlay-text">Your reward of</p>
                <div className="overlay-reward-value">
                  <img
                    src={`${process.env.PUBLIC_URL}/logo.png`}
                    alt="Coin Icon"
                    className="overlay-coin-icon"
                  />
                  <span>{selectedTask.task_reward}</span>
                </div>
                <p className="overlay-message">
                  {selectedTask.rewardMessage || "has been added to your coin balance"}
                </p>
                <button className="overlay-cta clickable" onClick={handleCloseRewardOverlay}>
                  Ok
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showShareOverlay && shareTask && (
        <div className="overlay-backdrop">
          <div className="overlay-container4">
            <div className={`invite-overlay4 ${showShareOverlay ? "slide-in" : "slide-out"}`}>
              <div className="overlay-header4">
                <h2 className="overlay-title4">Share Task</h2>
                <img
                  src={`${process.env.PUBLIC_URL}/cancel.png`}
                  alt="Close"
                  className="overlay-cancel"
                  onClick={handleCloseShareOverlay}
                />
              </div>
              <div className="overlay-divider"></div>
              <div className="overlay-content4">
                <p className="overlay-text">Share via:</p>
                <div className="share-options">
                  <button className="overlay-cta-button clickable" onClick={handleTelegramShare}>
                    Telegram
                  </button>
                  <button className="overlay-cta-button clickable" onClick={handleWhatsAppShare}>
                    WhatsApp
                  </button>
                  <button className="overlay-cta-button clickable" onClick={handleCopyShare}>
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCopyPopup && (
        <div className="copy-popup">
          <img
            src={`${process.env.PUBLIC_URL}/tick-icon.png`}
            alt="Tick Icon"
            className="copy-popup-icon"
          />
          <span className="copy-popup-text">Task link copied</span>
        </div>
      )}

      <Navigation />
    </div>
  );
};

export default TaskScreen;