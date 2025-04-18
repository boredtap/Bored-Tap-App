import React, { useState, useEffect, useCallback, useContext, useRef } from "react";
import Navigation from "../components/Navigation";
import "./TaskScreen.css";
import { BoostContext } from "../context/BoosterContext";
import { BASE_URL } from "../utils/BaseVariables";

const TaskScreen = () => {
  const { totalTaps } = useContext(BoostContext);
  const [activeTab, setActiveTab] = useState("In-Game");
  const [tasksData, setTasksData] = useState({
    "In-Game": [],
    Special: [],
    Social: [],
    Completed: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPerformOverlay, setShowPerformOverlay] = useState(false);
  const [performResult, setPerformResult] = useState(null);
  const [showRewardOverlay, setShowRewardOverlay] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showShareOverlay, setShowShareOverlay] = useState(false);
  const [shareTask, setShareTask] = useState(null);
  const [showCopyPopup, setShowCopyPopup] = useState(false);
  const [imageCache, setImageCache] = useState({});
  const [pagination, setPagination] = useState({
    pageSize: 10,
    pageNumber: 1,
    hasMore: true,
  });
  const observer = useRef(null);
  const loadMoreRef = useRef(null);
  const isFetching = useRef(false);

  const taskTabs = {
    "In-Game": "In-Game",
    Special: "Special",
    Social: "Social",
    Completed: "Completed",
  };

  // [MODIFIED] Function to clear task eligibility entries from localStorage
  const clearTaskEligibility = () => {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("task_") && key.endsWith("_eligible")) {
        localStorage.removeItem(key);
        console.log(`Cleared localStorage key: ${key}`);
      }
    });
  };

  // [MODIFIED] Check session and user state on mount
  useEffect(() => {
    const checkSessionAndUser = async () => {
      const telegramUser = JSON.parse(localStorage.getItem("telegramUser"));
      const storedSessionId = localStorage.getItem("sessionId");
      const currentSessionId = Date.now().toString(); // Unique per session
      const token = localStorage.getItem("accessToken");

      // [MODIFIED] Clear eligibility if session ID is missing or different
      if (!storedSessionId || storedSessionId !== currentSessionId) {
        console.log("New session detected, clearing task eligibility");
        clearTaskEligibility();
        localStorage.setItem("sessionId", currentSessionId);
      }

      // [MODIFIED] Check if user is starting afresh
      if (telegramUser && token) {
        try {
          const response = await fetch(`${BASE_URL}/user/profile`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
          if (response.ok) {
            const data = await response.json();
            const storedTelegramId = localStorage.getItem("lastTelegramId");
            const isFreshAccount = data.total_coins === 0 && data.level === 1;

            // [MODIFIED] Clear eligibility if new user or fresh account
            if (
              !storedTelegramId ||
              storedTelegramId !== telegramUser.id ||
              isFreshAccount
            ) {
              console.log(
                `New user or fresh account detected (telegramId: ${telegramUser.id}, isFresh: ${isFreshAccount}), clearing task eligibility`
              );
              clearTaskEligibility();
              localStorage.setItem("lastTelegramId", telegramUser.id);
            }
          }
        } catch (err) {
          console.error("Error checking user profile:", err);
        }
      }
    };

    checkSessionAndUser();

    // [MODIFIED] Clear eligibility on browser/tab close
    const handleBeforeUnload = () => {
      console.log("App closing, clearing task eligibility");
      clearTaskEligibility();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Fetch image by ID
  const fetchImage = async (imageId, token) => {
    try {
      const response = await fetch(`${BASE_URL}/bored-tap/user_app/image?image_id=${imageId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          accept: "application/json",
        },
      });

      if (!response.ok) throw new Error(`Image fetch failed: ${response.status}`);

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setImageCache((prev) => ({ ...prev, [imageId]: imageUrl }));
    } catch (err) {
      console.error(`Error fetching image ${imageId}:`, err);
      setImageCache((prev) => ({ ...prev, [imageId]: `${process.env.PUBLIC_URL}/logo.png` }));
    }
  };

  // Fetch tasks
  const fetchTasksAndTaps = useCallback(
    async (taskType, pageNumber, append = false) => {
      if (isFetching.current) return;
      isFetching.current = true;
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("No access token found");

        const url =
          taskType === "Completed"
            ? `${BASE_URL}/user/tasks/my_tasks/completed_tasks?page_size=${pagination.pageSize}&page_number=${pageNumber}`
            : `${BASE_URL}/user/tasks/my_tasks?task_type=${taskType.toLowerCase()}&page_size=${pagination.pageSize}&page_number=${pageNumber}`;

        const tasksResponse = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!tasksResponse.ok) throw new Error(`Task fetch failed: ${tasksResponse.status}`);

        const tasks = await tasksResponse.json();
        const taskList = Array.isArray(tasks) ? tasks : tasks.tasks || [];

        // [MODIFIED] Check localStorage for Social/Special task eligibility
        const updatedTaskList = taskList.map((task) => {
          if (taskType === "Social" || taskType === "Special") {
            const isEligibleInStorage = localStorage.getItem(`task_${task.task_id}_eligible`) === "true";
            console.log(`Task ${task.task_id} eligibility: backend=${task.eligible}, localStorage=${isEligibleInStorage}`);
            return { ...task, eligible: task.eligible || isEligibleInStorage };
          }
          return task;
        });

        setTasksData((prev) => ({
          ...prev,
          [taskType]: append ? [...prev[taskType], ...updatedTaskList] : updatedTaskList,
        }));

        // Pre-fetch images for tasks
        taskList.forEach((task) => {
          if (task.task_image_id && !imageCache[task.task_image_id]) {
            fetchImage(task.task_image_id, token);
          }
        });

        setPagination((prev) => ({
          ...prev,
          pageNumber,
          hasMore: taskList.length === prev.pageSize,
        }));
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError(err.message);
        if (!append) {
          setTasksData((prev) => ({ ...prev, [taskType]: [] }));
        }
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    },
    [pagination.pageSize, imageCache]
  );

  // Load tasks for the active tab on mount or tab change
  useEffect(() => {
    // Only fetch if tasks for the active tab are empty or pagination is reset
    if (tasksData[activeTab].length === 0 || pagination.pageNumber === 1) {
      fetchTasksAndTaps(activeTab, 1);
    }
    setPagination((prev) => ({ ...prev, pageNumber: 1, hasMore: true }));
  }, [activeTab, fetchTasksAndTaps]);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    if (!pagination.hasMore || loading || isFetching.current) return;

    const handleIntersection = (entries) => {
      if (entries[0].isIntersecting && !isFetching.current) {
        setPagination((prev) => {
          const nextPage = prev.pageNumber + 1;
          fetchTasksAndTaps(activeTab, nextPage, true);
          return { ...prev, pageNumber: nextPage };
        });
      }
    };

    observer.current = new IntersectionObserver(handleIntersection, { threshold: 0.1 });
    const currentLoadMoreRef = loadMoreRef.current;
    if (currentLoadMoreRef) observer.current.observe(currentLoadMoreRef);

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [activeTab, pagination.hasMore, loading, fetchTasksAndTaps]);

  const handlePerformTask = useCallback(
    async (task) => {
      const token = localStorage.getItem("accessToken");

      if (activeTab === "Social" || activeTab === "Special") {
        if (task.task_url) {
          // [MODIFIED] Open task URL and mark as eligible in localStorage
          console.log(`Navigating to task ${task.task_id} URL: ${task.task_url}`);
          window.open(task.task_url, "_blank");

          // [MODIFIED] Store eligibility in localStorage
          localStorage.setItem(`task_${task.task_id}_eligible`, "true");
          console.log(`Marked task ${task.task_id} as eligible in localStorage`);

          // [MODIFIED] Update tasksData to reflect eligibility immediately
          setTasksData((prev) => ({
            ...prev,
            [activeTab]: prev[activeTab].map((t) =>
              t.task_id === task.task_id ? { ...t, eligible: true } : t
            ),
          }));

          // [MODIFIED] Show overlay to confirm task navigation
          setPerformResult({
            message: "Task opened in new tab. You can now claim your reward.",
            success: true,
          });
          setSelectedTask(task);
          setShowPerformOverlay(true);
        } else {
          setPerformResult({ message: "No task URL provided", success: false });
          setSelectedTask(task);
          setShowPerformOverlay(true);
        }
      } else {
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
            setTasksData((prev) => ({
              ...prev,
              [activeTab]: prev[activeTab].map((t) =>
                t.task_id === task.task_id ? { ...t, eligible: true } : t
              ),
            }));
          }
        } catch (err) {
          console.error("Error performing In-Game task:", err);
          setPerformResult({ message: "Error performing task", success: false });
          setSelectedTask(task);
          setShowPerformOverlay(true);
        }
      }
    },
    [activeTab]
  );

  const handleClaimReward = useCallback(
    async (task) => {
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

        // [MODIFIED] Clear localStorage eligibility after claiming reward
        localStorage.removeItem(`task_${task.task_id}_eligible`);
        console.log(`Cleared eligibility for task ${task.task_id} from localStorage`);

        // Reset tasks for the current tab to reflect updated status
        setTasksData((prev) => ({ ...prev, [activeTab]: [] }));
        setPagination((prev) => ({ ...prev, pageNumber: 1, hasMore: true }));
        fetchTasksAndTaps(activeTab, 1);
      } catch (err) {
        console.error("Error claiming reward:", err);
        alert(`Failed to claim reward: ${err.message}`);
      }
    },
    [activeTab, fetchTasksAndTaps]
  );

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
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareLink)}&text=${encodeURIComponent(
      shareMessage
    )}`;
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
            {error && <p className="error-message">Error: {error}</p>}
            {loading && tasksData[activeTab].length === 0 && (
              <p className="loading-message">Fetching Tasks...</p>
            )}
            {tasksData[activeTab].length > 0 ? (
              tasksData[activeTab].map((task) => {
                const taskImage =
                  task.task_image_id && imageCache[task.task_image_id]
                    ? imageCache[task.task_image_id]
                    : `${process.env.PUBLIC_URL}/logo.png`;
                const isEligible = task.eligible || task.completed;

                return (
                  <div
                    className="task-item clickable"
                    key={task.task_id}
                    onClick={() => (activeTab !== "Completed" && !isEligible ? handlePerformTask(task) : null)}
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
                          <span>{task.task_reward.toLocaleString()}</span>
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
              !loading && <p className="no-task-message">No tasks available in this category.</p>
            )}
            {pagination.hasMore && !loading && (
              <div ref={loadMoreRef} style={{ height: "20px" }} />
            )}
            {loading && tasksData[activeTab].length > 0 && (
              <p className="loading-message">Loading more tasks...</p>
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
                    selectedTask.task_image_id && imageCache[selectedTask.task_image_id]
                      ? imageCache[selectedTask.task_image_id]
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
                  <span>{selectedTask.task_reward.toLocaleString()}</span>
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