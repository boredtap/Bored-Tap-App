import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./ProfileScreen.css";

const ProfileScreen = () => {
  const [profile, setProfile] = useState(null); // State to hold profile data
  // const [loading, setLoading] = useState(true); // State to track loading
  const [error, setError] = useState(null); // State to handle errors
  const navigate = useNavigate(); // Navigation hook for page redirection

  // Fetch profile data from the backend
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        navigate("/splash"); // Redirect to splash screen if no token is found
        return;
      }

      try {
        const response = await fetch("https://bored-tap-api.onrender.com/user/profile", {
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
        setProfile(data); // Set profile data into state
      } catch (err) {
        setError(err.message); // Set error message
        console.error("Error fetching profile:", err);
      } 
      // finally {
      //   setLoading(false); // Stop loading once the data is fetched
      // }
    };

    fetchProfile();
  }, [navigate]);

  // Show loading indicator if data is still being fetched
  // if (loading) {
  //   return <div className="loading">Loading profile...</div>;
  // }

  // Show error message if there's an issue fetching the data
  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
        <button onClick={() => navigate("/splash")}>Go to Splash</button>
      </div>
    );
  }

  // Profile data cards with respective labels and values
  const profileData = [
    { icon: `${process.env.PUBLIC_URL}/logo.png`, label: "Total Coin", value: profile?.total_coins || "0" },
    { icon: `${process.env.PUBLIC_URL}/task.png`, label: "Completed Task", value: profile?.completed_tasks || "0" },
    { icon: `${process.env.PUBLIC_URL}/leaderboard12-icon.png`, label: "Rank", value: profile?.rank || "N/A" },
    { icon: `${process.env.PUBLIC_URL}/invite.png`, label: "Invited Friends", value: profile?.invited_friends || "0" },
    {
      icon: `${process.env.PUBLIC_URL}/level.png`,
      label: "Level",
      value: `Lv ${profile?.level || "1"}`,
      onClick: () => navigate("/level-screen"), // Navigate to level-screen when clicked
    },
    { icon: `${process.env.PUBLIC_URL}/wallet.png`, label: "Connect Wallet", value: <img src={`${process.env.PUBLIC_URL}/plus-icon.png`} alt="Add Wallet" /> },
  ];

  return (
    <div className="profile-screen">
      {/* Profile Body */}
      <div className="profile-body">
        {/* Profile Picture */}
        <div className="profile-picture">
          <img
            src={profile?.image_url || `${process.env.PUBLIC_URL}/profile-picture.png`}
            alt="Profile"
            className="profile-image"
          />
        </div>
        <div className="profile-username">{profile?.username || "User"}</div>
        <div className="profile-level">Lvl {profile?.level || "1"}</div>

        {/* Profile Data Cards */}
        <div className="profile-data-cards">
          {profileData.map((item, index) => (
            <div
              key={index}
              className="profile-data-card"
              onClick={item.onClick ? item.onClick : null} // Navigate on click if `onClick` exists
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

        {/* Links */}
        <div className="profile-links">
          <a href="#privacy">Privacy Policy & Terms of Use</a>
          <a href="#support">Support</a>
        </div>
      </div>

      {/* Navigation */}
      <Navigation />
    </div>
  );
};

export default ProfileScreen;
