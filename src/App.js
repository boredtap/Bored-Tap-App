import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import AuthScreen from "./screens/AuthScreen";
import SplashScreen from "./screens/SplashScreen";
import Dashboard from "./screens/Dashboard";
import TelegramLogin from "./TelegramLogin";
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
import JoinClanScreen from "./screens/JoinClanScreen";
import DetailedClanScreen from "./screens/DetailedClanScreen";
import DetailedClanScreen2 from "./screens/DetailedClanScreen2";
import TopClanScreen from "./screens/TopClanScreen";
import CreateClanScreen from "./screens/CreateClanScreen";


const App = () => {
  return (
    <Router>
      <Routes>
        {/* <Route path="/" element={<TelegramLogin />} /> */}
        {/* <Route path="/" element={<AuthScreen />} />
        <Route path="/auth" element={<AuthScreen />} /> */}
        <Route path="/" element={<SplashScreen />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/telegram-login" element={<TelegramLogin />} />
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
        <Route path="/join-clan-screen" element={<JoinClanScreen />} />
        <Route path="/detailed-clan-screen" element={<DetailedClanScreen />} />
        <Route path="/detailed-clan-screen2" element={<DetailedClanScreen2 />} />
        <Route path="/top-clan-screen" element={<TopClanScreen />} />
        <Route path="/create-clan" element={<CreateClanScreen />} />
      </Routes>
    </Router>
  );
};

export default App;
