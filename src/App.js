import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import SplashScreen from "./screens/SplashScreen";
import Dashboard from "./screens/Dashboard";
// import TelegramLogin from "./screens/TelegramLogin";
import ProfileScreen from "./screens/ProfileScreen";
import ProfileScreen2 from "./screens/ProfileScreen2";
import LevelScreen from "./screens/LevelScreen";
import TaskScreen from "./screens/TaskScreen";
import Leaderboard from "./screens/Leaderboard";
import ChallengeScreen from "./screens/ChallengeScreen";
import RewardScreen from "./screens/RewardScreen";
import DailyStreakScreen from "./screens/DailyStreakScreen";
import InviteScreen from "./screens/InviteScreen";
import BoostScreen from "./screens/BoostScreen";
import WalletScreen from "./screens/WalletScreen";
import ClanScreen from "./screens/ClanScreen";
import ClanPreviewScreen from "./screens/ClanPreviewScreen";
import ClanDetailsScreen from "./screens/ClanDetailsScreen";
import TopClanScreen from "./screens/TopClanScreen";
import CreateClanScreen from "./screens/CreateClanScreen";
import ClanListScreen from "./screens/ClanListScreen";
import ClanTopEarnersScreen from "./screens/ClanTopEarnersScreen";

// Wrapper component to provide navigate within App
const AppContent = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleBackButton = (event) => {
      event.preventDefault(); // Prevent default browser behavior
      if (window.location.pathname === "/") {
        // Optional: Add confirmation or custom behavior for root screen
        if (window.confirm("Are you sure you want to exit the app?")) {
          window.close(); // Attempt to close tab (works in some browsers)
        }
      } else {
        navigate(-1); // Go back in app history
      }
    };

    // Push initial state to ensure there's a history entry
    window.history.pushState(null, null, window.location.pathname);
    window.addEventListener("popstate", handleBackButton);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener("popstate", handleBackButton);
    };
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<SplashScreen />} />
      <Route path="/dashboard" element={<Dashboard />} />
      {/* <Route path="/telegram-login" element={<TelegramLogin />} /> */}
      <Route path="/profile-screen" element={<ProfileScreen />} />
      <Route path="/profile-screen2" element={<ProfileScreen2 />} />
      <Route path="/level-screen" element={<LevelScreen />} />
      <Route path="/task-screen" element={<TaskScreen />} />
      <Route path="/leaderboard-screen" element={<Leaderboard />} />
      <Route path="/challenge-screen" element={<ChallengeScreen />} />
      <Route path="/reward-screen" element={<RewardScreen />} />
      <Route path="/daily-streak-screen" element={<DailyStreakScreen />} />
      <Route path="/invite-screen" element={<InviteScreen />} />
      <Route path="/boost-screen" element={<BoostScreen />} />
      <Route path="/wallet-screen" element={<WalletScreen />} />
      <Route path="/clan-screen" element={<ClanScreen />} />
      <Route path="/clan-list-screen" element={<ClanListScreen />} />
      <Route path="/clan-details-screen" element={<ClanDetailsScreen />} />
      <Route path="/clan-preview/:clanId" element={<ClanPreviewScreen />} />
      <Route path="/top-clan-screen" element={<TopClanScreen />} />
      <Route path="/clan-create-screen" element={<CreateClanScreen />} />
      <Route path="/clan-top-earners" element={<ClanTopEarnersScreen />} />
    </Routes>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;