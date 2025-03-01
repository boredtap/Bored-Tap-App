import { createContext, useState, useEffect } from "react";

// Create context without a default value (avoids unnecessary object creation)
export const DailyBoostersContext = createContext(null);

const BoostersContext = ({ children }) => {
    // Retrieve boosters from localStorage and handle potential errors
    let initialBoosters;

    try {
        const savedBoosters = localStorage.getItem("dailyBoosters");
        initialBoosters = savedBoosters ? JSON.parse(savedBoosters) : null;
    } catch (error) {
        console.error("Error parsing dailyBoosters from localStorage:", error);
        initialBoosters = null; // Handle corrupted data
    }

    // Provide default boosters if no valid data is found
    if (!initialBoosters) {
        initialBoosters = {
            tapperBoost: { usesLeft: 3, isActive: false, endTime: null, resetTime: null },
            fullEnergy: { usesLeft: 3, isActive: false, resetTime: null },
        };
    }

    // State for daily boosters
    const [dailyBoosters, setDailyBoosters] = useState(initialBoosters);

    // Sync `dailyBoosters` to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("dailyBoosters", JSON.stringify(dailyBoosters));
    }, [dailyBoosters]);

    return (
        <DailyBoostersContext.Provider value={{ dailyBoosters, setDailyBoosters }}>
            {children}
        </DailyBoostersContext.Provider>
    );
};

export default BoostersContext;
