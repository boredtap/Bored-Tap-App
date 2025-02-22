import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./ProfileScreen.css";

const ProfileScreen = () => {
  const [profile, setProfile] = useState(null); // Holds user profile data from backend
  const [error, setError] = useState(null); // Tracks fetch errors
  const navigate = useNavigate(); // Enables programmatically navigating between screens

  // Fetch user profile data when component mounts
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/splash"); // Redirect to splash screen if no auth token exists
        return;
      }

      try {
        const response = await fetch("https://bt-coins.onrender.com/user/profile", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) throw new Error("Unauthorized. Please log in again.");
          throw new Error("Failed to fetch profile data.");
        }

        const data = await response.json();
        setProfile(data); // Store fetched profile data in state
      } catch (err) {
        setError(err.message); // Set error state for display
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, [navigate]);

  // Render error state with retry navigation
  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
        <button onClick={() => navigate("/splash")}>Go to Splash</button>
      </div>
    );
  }

  // Define profile data for cards with consistent structure
  const profileData = [
    { icon: `${process.env.PUBLIC_URL}/logo.png`, label: "Total Coin", value: profile?.total_coins || "0" },
    { icon: `${process.env.PUBLIC_URL}/task.png`, label: "Completed Task", value: profile?.completed_tasks || "0" },
    { icon: `${process.env.PUBLIC_URL}/leaderboard12-icon.png`, label: "Rank", value: profile?.rank || "N/A" },
    { icon: `${process.env.PUBLIC_URL}/invite.png`, label: "Invited Friends", value: profile?.invited_friends || "0" },
    {
      icon: `${process.env.PUBLIC_URL}/level.png`,
      label: "Level",
      value: `Lv. ${profile?.level || "1"} ${profile?.level_name || ""}`,
      onClick: () => navigate("/level-screen"), // Navigate to level screen on click
    },
    {
      icon: `${process.env.PUBLIC_URL}/wallet.png`,
      label: "Connect Wallet",
      value: <img src={`${process.env.PUBLIC_URL}/plus-icon.png`} alt="Add Wallet" className="wallet-icon" />,
    },
  ];

  return (
    <div className="profile-screen">
      {/* Main content area */}
      <div className="profile-body">
        {/* User profile picture */}
        <div className="profile-picture">
          <img
            src={profile?.image_url || `${process.env.PUBLIC_URL}/profile-picture.png`}
            alt="Profile"
            className="profile-image"
          />
        </div>
        {/* Username display */}
        <div className="profile-username">{profile?.username || "User"}</div>
        {/* Level display */}
        <div className="profile-level">Lv. {profile?.level || "1"} .{profile?.level_name || ""}</div>

        {/* Profile data cards container */}
        <div className="profile-data-cards">
          {profileData.map((item, index) => (
            <div
              key={index}
              className="profile-data-card"
              onClick={item.onClick || null} // Apply click handler if defined
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

      {/* Bottom navigation bar */}
      <Navigation />
    </div>
  );
};

export default ProfileScreen;