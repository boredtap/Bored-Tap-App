import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./ProfileScreen.css";

const ProfileScreen = () => {
  const [profile, setProfile] = useState(null); // Holds user profile data
  const [rank, setRank] = useState("N/A"); // Holds user's rank from leaderboard
  const [error, setError] = useState(null); // Tracks fetch errors
  const navigate = useNavigate();

  // Fetch profile and leaderboard data when component mounts
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/splash");
        return;
      }

      try {
        // Fetch user profile
        const profileResponse = await fetch("https://bt-coins.onrender.com/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!profileResponse.ok) {
          if (profileResponse.status === 401) throw new Error("Unauthorized. Please log in again.");
          throw new Error("Failed to fetch profile data.");
        }

        const profileData = await profileResponse.json();
        setProfile(profileData);
        console.log("Profile data:", profileData);

        // Fetch leaderboard to get rank
        const leaderboardResponse = await fetch(
          "https://bt-coins.onrender.com/user/leaderboard?category=all_time",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!leaderboardResponse.ok) {
          throw new Error("Failed to fetch leaderboard data.");
        }

        const leaderboardData = await leaderboardResponse.json();
        console.log("Leaderboard data:", leaderboardData);

        // Find user's rank by matching telegram_user_id
        const userRank = leaderboardData.find(
          (entry) => entry.telegram_user_id === profileData.telegram_user_id
        );
        setRank(userRank ? userRank.rank : "N/A");
      } catch (err) {
        setError(err.message);
        console.error("Error fetching data:", err);
      }
    };

    fetchUserData();
  }, [navigate]);

  // Render error state
  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
        <button onClick={() => navigate("/splash")}>Go to Splash</button>
      </div>
    );
  }

  // Render loading state while fetching data
  if (!profile) {
    return (
      <div className="profile-screen">
        <div className="profile-body">
          <p>Loading...</p>
        </div>
        <Navigation />
      </div>
    );
  }

  // Derive invited friends count from invite array length
  const invitedFriendsCount = profile.invite ? profile.invite.length : 0;

  // Profile data for cards, mapped to backend response
  const profileData = [
    { icon: `${process.env.PUBLIC_URL}/logo.png`, label: "Total Coin", value: profile.total_coins || "0" },
    {
      icon: `${process.env.PUBLIC_URL}/task.png`,
      label: "Completed Tasks",
      value: profile.completed_tasks || "0", // Assuming backend might add this later; default to 0
    },
    { icon: `${process.env.PUBLIC_URL}/leaderboard12-icon.png`, label: "Rank", value: rank },
    { icon: `${process.env.PUBLIC_URL}/invite.png`, label: "Invited Friends", value: invitedFriendsCount },
    {
      icon: `${process.env.PUBLIC_URL}/level.png`,
      label: "Level",
      value: `Lv. ${profile.level || "1"} ${profile.level_name || ""}`,
      onClick: () => navigate("/level-screen"),
    },
    {
      icon: `${process.env.PUBLIC_URL}/wallet.png`,
      label: "Connect Wallet",
      value: <img src={`${process.env.PUBLIC_URL}/plus-icon.png`} alt="Add Wallet" className="wallet-icon" />,
    },
  ];

  return (
    <div className="profile-screen">
      <div className="profile-body">
        {/* Profile picture */}
        <div className="profile-picture">
          <img
            src={profile.image_url || `${process.env.PUBLIC_URL}/profile-picture.png`}
            alt="Profile"
            className="profile-image"
          />
        </div>
        {/* Username */}
        <div className="profile-username">{profile.username || "User"}</div>

        {/* Profile data cards */}
        <div className="profile-data-cards">
          {profileData.map((item, index) => (
            <div
              key={index}
              className="profile-data-card"
              onClick={item.onClick || null}
            >
              <div className="profile-data-left">
                <div className="profile-icon">
                  <img src={item.icon} alt={item.label} />
                </div>
                <div className="profile-label">{item.label}</div>
              </div>
              <div className="profile-data-right">{item.value}</div>
            </div>
          ))}
        </div>

        {/* Footer links */}
        <div className="profile-links">
          <a href="#privacy">Privacy Policy & Terms of Use</a>
          <a href="#support">Support</a>
        </div>
      </div>

      <Navigation />
    </div>
  );
};

export default ProfileScreen;