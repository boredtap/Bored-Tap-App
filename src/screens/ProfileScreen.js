import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./ProfileScreen.css";

const ProfileScreen = () => {
  const [profile, setProfile] = useState(null); // State to hold profile data
  const [error, setError] = useState(null); // State to handle errors
  const navigate = useNavigate(); // Hook for navigation between screens

  // Fetch profile data from the backend on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        navigate("/splash"); // Redirect to splash if no token is found
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
          if (response.status === 401) {
            throw new Error("Unauthorized. Please log in again.");
          }
          throw new Error("Failed to fetch profile data.");
        }

        const data = await response.json();
        setProfile(data); // Update state with fetched profile data
      } catch (err) {
        setError(err.message); // Capture and display any errors
        console.error("Error fetching profile:", err);
      }
    };

    fetchProfile();
  }, [navigate]);

  // Display error message with retry option if fetch fails
  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
        <button onClick={() => navigate("/splash")}>Go to Splash</button>
      </div>
    );
  }

  // Profile data cards configuration
  const profileData = [
    { 
      icon: `${process.env.PUBLIC_URL}/logo.png`, 
      label: "Total Coin", 
      value: profile?.total_coins || "0" 
    },
    { 
      icon: `${process.env.PUBLIC_URL}/task.png`, 
      label: "Completed Task", 
      value: profile?.completed_tasks || "0" 
    },
    { 
      icon: `${process.env.PUBLIC_URL}/leaderboard12-icon.png`, 
      label: "Rank", 
      value: profile?.rank || "N/A" 
    },
    { 
      icon: `${process.env.PUBLIC_URL}/invite.png`, 
      label: "Invited Friends", 
      value: profile?.invited_friends || "0" 
    },
    { 
      icon: `${process.env.PUBLIC_URL}/level.png`, 
      label: "Level", 
      value: `Lv. ${profile?.level || "1"} ${profile?.level_name || ""}`, // Horizontal level display
      onClick: () => navigate("/level-screen") 
    },
    { 
      icon: `${process.env.PUBLIC_URL}/wallet.png`, 
      label: "Connect Wallet", 
      value: <img src={`${process.env.PUBLIC_URL}/plus-icon.png`} alt="Add Wallet" className="wallet-icon" /> 
    },
  ];

  return (
    <div className="profile-screen">
      {/* Main profile content */}
      <div className="profile-body">
        {/* Profile picture section */}
        <div className="profile-picture">
          <img
            src={profile?.image_url || `${process.env.PUBLIC_URL}/profile-picture.png`}
            alt="Profile"
            className="profile-image"
          />
        </div>
        <div className="profile-username">{profile?.username || "User"}</div>
        <div className="profile-level">Lv. {profile?.level || "1"} {profile?.level_name || ""}</div>

        {/* Profile data cards */}
        <div className="profile-data-cards">
          {profileData.map((item, index) => (
            <div
              key={index}
              className="profile-data-card"
              onClick={item.onClick || null} // Apply onClick if defined
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

      {/* Bottom navigation */}
      <Navigation />
    </div>
  );
};

export default ProfileScreen;