import { createContext, useState, useEffect } from "react";

// Create context without a default value (avoids unnecessary object creation)
export const BoostContext = createContext({
    tapMultiplier: 1,
    dailyBoosters: null,
});

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
    const [boosters, setBoosters] = useState({
        tapMultiplier: initialBoosters.tapperBoost.isActive ? 2 : 1,
        dailyBoosters: initialBoosters,
    });

    // Sync `dailyBoosters` to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("dailyBoosters", JSON.stringify(boosters.dailyBoosters));
    }, [boosters.dailyBoosters]);

    // Effect to update tapMultiplier when `tapperBoost.isActive` changes
    useEffect(() => {
        setBoosters((prevBoosters) => ({
            ...prevBoosters,
            tapMultiplier: prevBoosters.dailyBoosters.tapperBoost.isActive ? 2 : 1,
        }));
    }, [boosters.dailyBoosters.tapperBoost.isActive]);

    const setDailyBoosters = (newBoosters) => {
        setBoosters(prev => ({
            ...prev,
            dailyBoosters: typeof newBoosters === "function" ? newBoosters(prev.dailyBoosters) : newBoosters
        }));
    };

    const setTapMultiplier = () => {
        setBoosters(prev => ({
            ...prev, tapMultiplier: prev.dailyBoosters.tapperBoost.isActive ? 2 : 1,
        }))
    }

    return (
        <BoostContext.Provider value={{
            tapMultiplier: boosters.tapMultiplier,
            dailyBoosters: boosters.dailyBoosters,
            setBoosters,
            setDailyBoosters,
            setTapMultiplier
        }}>
            {children}
        </BoostContext.Provider>
    );
};

export default BoostersContext;
