import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SplashScreen from "./screens/SplashScreen";
import Dashboard from "./screens/Dashboard"; // Placeholder for now
import TelegramLogin from "./TelegramLogin"; // Import TelegramLogin
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

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/telegram-login" element={<TelegramLogin />} /> {/* New Route */}
        <Route path="/profile-screen" element={<ProfileScreen />} /> {/* New Route */}
        <Route path="/profile-screen2" element={<ProfileScreen2 />} /> {/* New Route */}
        <Route path="/level-screen" element={<LevelScreen />} /> {/* New Route */}
        <Route path="/task-screen" element={<TaskScreen />} /> {/* New Route */}
        <Route path="/leaderboard-screen" element={<Leaderboard />} /> {/* New Route */}
        <Route path="/challenge-screen" element={<ChallengeScreen />} /> {/* New Route */}
        <Route path="/reward-screen" element={<RewardScreen />} /> {/* New Route */}
        <Route path="/daily-streak-screen" element={<DailyStreakScreen/>} /> {/* New Route */}
        <Route path="/invite-screen" element={<InviteScreen />} /> {/* New Route */}
        <Route path="/boost-screen" element={<BoostScreen />} /> {/* New Route */}
        <Route path="/wallet-screen" element={<WalletScreen />} /> {/* New Route */}
      </Routes>
    </Router>
  );
};

export default App;
