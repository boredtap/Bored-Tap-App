import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation";
import "./ProfileScreen.css";

const ProfileScreen = () => {
  const [profile, setProfile] = useState(null); // State to hold profile data
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state
  const navigate = useNavigate();

  // Fetch profile data from the backend
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        navigate("/splash"); // Redirect to splash screen if no token
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
        setProfile(data); // Save profile data
      } catch (err) {
        setError(err.message);
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>Error: {error}</p>
        <button onClick={() => navigate("/splash")}>Go to Splash</button>
      </div>
    );
  }

  const profileData = [
    { icon: `${process.env.PUBLIC_URL}/logo.png`, label: "Total Coin", value: profile?.total_coins || "0" },
    { icon: `${process.env.PUBLIC_URL}/tasks.png`, label: "Completed Task", value: profile?.completed_tasks || "0" },
    { icon: `${process.env.PUBLIC_URL}/leaderboard.png`, label: "Rank", value: profile?.rank || "N/A" },
    { icon: `${process.env.PUBLIC_URL}/invite.png`, label: "Invited Friends", value: profile?.invited_friends || "0" },
    { icon: `${process.env.PUBLIC_URL}/level.png`, label: "Level", value: `Lv ${profile?.level || "1"}` },
    { icon: `${process.env.PUBLIC_URL}/wallet.png`, label: "Connect Wallet", value: <img src={`${process.env.PUBLIC_URL}/plus-icon.png`} alt="Add Wallet" /> },
  ];

  return (
    <div className="profile-screen">
      {/* Profile Body */}
      <div className="profile-body">
        {/* Profile Picture */}
        <div className="profile-picture">
          <img src={profile?.image_url || `${process.env.PUBLIC_URL}/profile-picture.png`} alt="Profile" className="profile-image" />
        </div>
        <div className="profile-username">{profile?.username || "User"}</div>
        <div className="profile-level">Lvl {profile?.level || "1"}</div>

        {/* Profile Data Cards */}
        <div className="profile-data-cards">
          {profileData.map((item, index) => (
            <div key={index} className="profile-data-card">
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
