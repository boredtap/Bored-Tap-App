import { createContext, useState, useEffect } from "react";

// Create context without a default value (avoids unnecessary object creation)
export const BoostContext = createContext({
    tapMultiplier: 1,
    dailyBoosters: null,
});

const BOOST_DURATION = 20000; // 20 seconds for Tapper Boost
const DAILY_RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

const BoostersContext = ({ children }) => {
    // Retrieve boosters from localStorage and handle potential errors
    let initialBoosters;
    let initialTapMultiplier = 1;

    try {
        const savedBoosters = localStorage.getItem("dailyBoosters");
        initialBoosters = savedBoosters ? JSON.parse(savedBoosters) : null;

        const savedMultiplier = localStorage.getItem("tapMultiplier");
        if (savedMultiplier) {
            initialTapMultiplier = parseInt(savedMultiplier, 10);
        }

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

    // State for boosters
    const [boosters, setBoosters] = useState({
        tapMultiplier: initialTapMultiplier,
        dailyBoosters: initialBoosters
    });

    // Sync `dailyBoosters` to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("dailyBoosters", JSON.stringify(boosters.dailyBoosters));
    }, [boosters.dailyBoosters]);

    // Sync `tapMultiplier` to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("tapMultiplier", boosters.tapMultiplier.toString());
    }, [boosters.tapMultiplier]);

    const setDailyBoosters = (newBoosters) => {
        setBoosters(prev => ({
            ...prev,
            dailyBoosters: typeof newBoosters === "function" ? newBoosters(prev.dailyBoosters) : newBoosters
        }));
    };

    const activateTapperBoost = () => {
        if (boosters.dailyBoosters.tapperBoost.isActive) return

        if (boosters.dailyBoosters.tapperBoost.usesLeft > 0 && !boosters.dailyBoosters.tapperBoost.isActive) {
            const now = Date.now();

            setBoosters(prev => ({
                tapMultiplier: 2,
                dailyBoosters: {
                    ...prev.dailyBoosters,
                    tapperBoost: {
                        isActive: true,
                        usesLeft: prev.dailyBoosters.tapperBoost.usesLeft - 1,
                        endTime: now + BOOST_DURATION,
                        resetTime: prev.dailyBoosters.tapperBoost.usesLeft === 1 ? now + DAILY_RESET_INTERVAL : prev.dailyBoosters.tapperBoost.resetTime || null,
                    }
                }
            }))

            setTimeout(() => {
                setBoosters(prev => ({
                    tapMultiplier: 1,
                    dailyBoosters: {
                        ...prev.dailyBoosters,
                        tapperBoost: {
                            ...prev.dailyBoosters.tapperBoost,
                            isActive: false,
                            endTime: null,
                        }
                    }
                }))
            }, BOOST_DURATION)
        }
    }

    const activateFullEnergy = () => {
        // Add a check, if energy is already full then return otherwise proceed
        if (boosters.dailyBoosters.fullEnergy.usesLeft == 0) return

        const now = Date.now();

        setBoosters(prev => ({
            ...prev,
            dailyBoosters: {
                ...prev.dailyBoosters,
                fullEnergy: {
                    ...prev.dailyBoosters.fullEnergy,
                    usesLeft: prev.dailyBoosters.fullEnergy.usesLeft - 1,
                    isActive: false,
                    resetTime: prev.dailyBoosters.fullEnergy.usesLeft === 1 ? now + DAILY_RESET_INTERVAL : prev.dailyBoosters.fullEnergy.resetTime || null,
                }
            }
        }))

        const maxEnergy = parseInt(localStorage.getItem("maxElectricBoost") || "1000", 10);
        localStorage.setItem("electricBoost", maxEnergy.toString());
        window.dispatchEvent(new CustomEvent("fullEnergyClaimed", { detail: { maxEnergy } }));
    }

    const setTapMultiplier = (val) => {
        setBoosters(prev => ({
            ...prev, tapMultiplier: val,
        }))
    }

    // Effect to check & apply boost on app load
    useEffect(() => {
        const { tapperBoost } = boosters.dailyBoosters;

        if (tapperBoost && tapperBoost.isActive) {
            console.log("BoostersContext: Tapper Boost is active on load.");

            // Apply 2x multiplier
            setBoosters(prev => ({ ...prev, tapMultiplier: 2 }));

            const remaining = tapperBoost.endTime - Date.now();
            if (remaining > 0) {
                setTimeout(() => {
                    console.log("BoostersContext: Tapper Boost expired on load check.");

                    setBoosters(prev => ({
                        ...prev,
                        tapMultiplier: 1, // Reset multiplier after boost ends
                        dailyBoosters: {
                            ...prev.dailyBoosters,
                            tapperBoost: {
                                ...prev.dailyBoosters.tapperBoost,
                                isActive: false,
                                endTime: null
                            }
                        }
                    }));

                    // Save updated state to localStorage
                    localStorage.setItem("dailyBoosters", JSON.stringify({
                        ...boosters.dailyBoosters,
                        tapperBoost: { ...boosters.dailyBoosters.tapperBoost, isActive: false, endTime: null }
                    }));
                }, remaining);
            } else {
                // Boost already expired
                setBoosters(prev => ({
                    ...prev,
                    tapMultiplier: 1,
                    dailyBoosters: {
                        ...prev.dailyBoosters,
                        tapperBoost: {
                            ...prev.dailyBoosters.tapperBoost,
                            isActive: false,
                            endTime: null
                        }
                    }
                }));

                localStorage.setItem("dailyBoosters", JSON.stringify({
                    ...boosters.dailyBoosters,
                    tapperBoost: { ...boosters.dailyBoosters.tapperBoost, isActive: false, endTime: null }
                }));
            }
        }
    }, []); // Runs only on mount

    //  Booster issue: I think it is fetching from localstorage immediately i open dashbboard or something. Either way it is set, but seems when i get into dashboard it is changed back to 1.

    return (
        <BoostContext.Provider value={{
            tapMultiplier: boosters.tapMultiplier,
            dailyBoosters: boosters.dailyBoosters,
            setBoosters,
            setDailyBoosters,
            setTapMultiplier,
            activateTapperBoost,
            activateFullEnergy
        }}>
            {children}
        </BoostContext.Provider>
    );
};

export default BoostersContext;
