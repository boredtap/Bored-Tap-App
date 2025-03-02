import { useState, useEffect } from "react";
import '../screens/BoostScreen.css'

const BoosterTimer = ({ boosterType, dailyBoosters }) => {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        const updateTimer = () => {
            const booster = dailyBoosters[boosterType];
            if (!booster) return;

            if (boosterType === "tapperBoost" && booster.isActive) {
                const remaining = Math.max(0, (booster.endTime - Date.now()) / 1000);
                setTimeLeft(`Active: ${Math.floor(remaining)}s`);
            } else if (booster.usesLeft > 0) {
                setTimeLeft(`${booster.usesLeft}/3 uses left`);
            } else if (booster.resetTime) {
                const resetIn = Math.max(0, (booster.resetTime - Date.now()) / 1000);
                const hours = Math.floor(resetIn / 3600);
                const minutes = Math.floor((resetIn % 3600) / 60);
                const seconds = Math.floor(resetIn % 60);
                setTimeLeft(
                    `0/3 ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
                        .toString()
                        .padStart(2, "0")}`
                );
            } else {
                setTimeLeft("0/3");
            }
        };

        updateTimer(); // Run immediately

        const interval = setInterval(updateTimer, 1000); // Update every second

        return () => clearInterval(interval); // Cleanup on unmount
    }, [boosterType, dailyBoosters]); // Re-run if these values change

    return <p className="booster-value">{timeLeft}</p>;
};

export default BoosterTimer;
