import { createContext, useState, useEffect } from "react";

const BOOST_DURATION = 20000; // 20 seconds for Tapper Boost
const DAILY_RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
// Updated Recharge times per spec (in ms) - now including all 5 levels
const RECHARGE_TIMES = [3000, 2500, 2000, 1500, 1000, 500]; // Level 0 through 5

// Create context without a default value (avoids unnecessary object creation)
export const BoostContext = createContext({
    tapMultiplier: 1,
    dailyBoosters: null,
    extraBoosters: null,
    electricBoost: 1000,
    maxElectricBoost: 1000,
    rechargeTime: RECHARGE_TIMES[0]
});

const BoostersContext = ({ children }) => {
    // Retrieve boosters from localStorage and handle potential errors
    let initialBoosters;
    let initialTapMultiplier = 1;
    let initialExtraBoosters;
    let initialElectricBoost = 1000
    let initialMaxElectricBoost = 1000
    let initialRechargeTime = RECHARGE_TIMES[0]

    try {
        const savedBoosters = localStorage.getItem("dailyBoosters");
        initialBoosters = savedBoosters ? JSON.parse(savedBoosters) : null;

        const savedExtraBoosters = localStorage.getItem("extraBoosters");
        initialExtraBoosters = savedExtraBoosters ? JSON.parse(savedExtraBoosters) : null;

        const savedElectricBoost = localStorage.getItem("electricBoost")
        initialElectricBoost = savedElectricBoost ? JSON.parse(savedElectricBoost) : 1000;

        const savedMaxElectricBoost = localStorage.getItem("maxElectricBoost")
        initialMaxElectricBoost = savedMaxElectricBoost ? JSON.parse(savedMaxElectricBoost) : 1000;

        const savedRechargeTime = localStorage.getItem("rechargeTime")
        initialRechargeTime = savedRechargeTime ? JSON.parse(savedRechargeTime) : RECHARGE_TIMES[0];

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

    if (!initialExtraBoosters) {
        initialExtraBoosters = []
    }

    // State for boosters
    const [boosters, setBoosters] = useState({
        tapMultiplier: initialTapMultiplier,
        dailyBoosters: initialBoosters,
        extraBoosters: initialExtraBoosters,
        electricBoost: initialElectricBoost,
        maxElectricBoost: initialMaxElectricBoost,
        rechargeTime: initialRechargeTime
    });

    // Sync `dailyBoosters` to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("dailyBoosters", JSON.stringify(boosters.dailyBoosters));
    }, [boosters.dailyBoosters]);

    // Sync `extraBoosters` to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("extraBoosters", JSON.stringify(boosters.extraBoosters));
    }, [boosters.extraBoosters]);

    // Sync `tapMultiplier` to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("tapMultiplier", boosters.tapMultiplier.toString());
    }, [boosters.tapMultiplier]);

    // Sync `ElectricMultiplier` to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("electricBoost", boosters.electricBoost.toString());
    }, [boosters.electricBoost]);

    // Sync `MaxElectricBoost` to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("maxElectricBoost", boosters.maxElectricBoost.toString());
    }, [boosters.maxElectricBoost]);

    // Sync `RechargeTime` to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem("rechargeTime", boosters.rechargeTime.toString());
    }, [boosters.rechargeTime]);

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
                tapMultiplier: prev.tapMultiplier * 2,
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
                    tapMultiplier: Math.round(prev.tapMultiplier / 2),
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
        setElectricBoost(maxEnergy)
        window.dispatchEvent(new CustomEvent("fullEnergyClaimed", { detail: { maxEnergy } }));
    }

    const setTapMultiplier = (val) => {
        setBoosters(prev => ({
            ...prev, tapMultiplier: val,
        }))
    }

    const setElectricBoost = (newElectricBoost) => {
        setBoosters(prev => ({
            ...prev, electricBoost: typeof newElectricBoost === 'function' ? newElectricBoost(prev.electricBoost) : newElectricBoost,
        }))
    }

    const setRechargeTime = (newRechargeTime) => {
        setBoosters(prev => ({
            ...prev, rechargeTime: typeof newRechargeTime === 'function' ? newRechargeTime(prev.rechargeTime) : newRechargeTime,
        }))
    }

    const setMaxElectricBoost = (newMaxElectricBoost) => {
        setBoosters(prev => ({
            ...prev, maxElectricBoost: typeof newMaxElectricBoost === 'function' ? newMaxElectricBoost(prev.maxElectricBoost) : newMaxElectricBoost,
        }))
    }

    const setExtraBoosters = (data) => {
        setBoosters(prev => ({
            ...prev,
            extraBoosters: data
        }))
    }

    const activateOtherBoosters = (effect, newLevel) => {
        console.log(`Activating booster: ${effect}, Level: ${newLevel}`);

        switch (effect) {
            case "boost": {
                const newMultiplier = 1 + newLevel;
                setTapMultiplier(newMultiplier);
                window.dispatchEvent(new CustomEvent("boostUpgraded", { detail: { level: newLevel, multiplier: newMultiplier } }));
                break;
            }
            case "multiplier": {
                const newMaxEnergy = 1000 + newLevel * 500;
                setMaxElectricBoost(newMaxEnergy);
                window.dispatchEvent(new CustomEvent("multiplierUpgraded", { detail: { level: newLevel, maxEnergy: newMaxEnergy } }));
                break;
            }
            case "recharge": {
                const rechargeIndex = Math.min(newLevel, RECHARGE_TIMES.length - 1);
                const newRechargeTime = RECHARGE_TIMES[rechargeIndex];
                setRechargeTime(newRechargeTime)
                window.dispatchEvent(new CustomEvent("rechargeSpeedUpgraded", { detail: { level: newLevel } }));
                break;
            }
            case "auto-tap": {
                localStorage.setItem("autoTapActive", "true");
                window.dispatchEvent(new CustomEvent("autoTapActivated", { detail: { level: newLevel } }));
                break;
            }
            default:
                console.warn(`Unknown booster effect: ${effect}`);
                window.dispatchEvent(new Event("boosterUpgraded"));
        }
    };

    const resetAll = () => {
        setBoosters({
            tapMultiplier: 1,
            dailyBoosters: null,
            extraBoosters: null,
            electricBoost: 1000,
            maxElectricBoost: 1000,
            rechargeTime: RECHARGE_TIMES[0]
        })
    }

    useEffect(() => {
        boosters.extraBoosters.forEach(({ title, rawLevel }) => activateOtherBoosters(title, rawLevel))
    }, [boosters.extraBoosters])


    // Effect to check & apply boost on app load
    useEffect(() => {
        const { tapperBoost } = boosters.dailyBoosters;

        if (tapperBoost && tapperBoost.isActive) {
            console.log("BoostersContext: Tapper Boost is active on load.");

            // Apply 2x multiplier
            setBoosters(prev => ({ ...prev, tapMultiplier: prev.tapMultiplier * 2 }));

            const remaining = tapperBoost.endTime - Date.now();
            if (remaining > 0) {
                setTimeout(() => {
                    console.log("BoostersContext: Tapper Boost expired on load check.");

                    setBoosters(prev => ({
                        ...prev,
                        tapMultiplier: Math.round(prev.tapMultiplier / 2), // Reset multiplier after boost ends
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
                    tapMultiplier: Math.round(prev.tapMultiplier / 2),
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

        boosters.extraBoosters.forEach(({ title, rawLevel }) => activateOtherBoosters(title, rawLevel))
    }, []); // Runs only on mount

    return (
        <BoostContext.Provider value={{
            tapMultiplier: boosters.tapMultiplier,
            dailyBoosters: boosters.dailyBoosters,
            boostersData: boosters.extraBoosters,
            electricBoost: boosters.electricBoost,
            maxElectricBoost: boosters.maxElectricBoost,
            rechargeTime: boosters.rechargeTime,
            setBoosters,
            setDailyBoosters,
            setTapMultiplier,
            activateTapperBoost,
            activateFullEnergy,
            activateOtherBoosters,
            setExtraBoosters,
            setElectricBoost,
            setMaxElectricBoost,
            setRechargeTime,
            resetAll
        }}>
            {children}
        </BoostContext.Provider>
    );
};

export default BoostersContext;
