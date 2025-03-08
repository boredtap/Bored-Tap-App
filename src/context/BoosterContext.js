import { createContext, useState, useEffect } from "react";

const BOOST_DURATION = 20000; // 20 seconds for Tapper Boost
const DAILY_RESET_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
// Updated Recharge times per spec (in ms) - now including all 5 levels
const RECHARGE_TIMES = [5000, 4500, 3500, 2500, 1500, 500]; // Level 0 through 5


const getFromStorage = (key, defaultValue) => {
    try {
        const saved = localStorage.getItem(key);
        if (saved === null) return defaultValue;
        return JSON.parse(saved);
    } catch (error) {
        console.error(`Error loading ${key} from storage`, error);
        return defaultValue;
    }
};


// Create context without a default value (avoids unnecessary object creation)
export const BoostContext = createContext(null);

const BoostersContext = ({ children }) => {
    const initialBoosters = getFromStorage("dailyBoosters", {
        tapperBoost: { usesLeft: 3, isActive: false, endTime: null, resetTime: null },
        fullEnergy: { usesLeft: 3, isActive: false, resetTime: null },
    });

    const initialState = {
        tapMultiplier: getFromStorage("tapMultiplier", 1),
        dailyBoosters: initialBoosters,
        extraBoosters: getFromStorage("extraBoosters", []),
        electricBoost: getFromStorage("electricBoost", 1000),
        maxElectricBoost: getFromStorage("maxElectricBoost", 1000),
        rechargeTime: getFromStorage("rechargeTime", RECHARGE_TIMES[0]),
        autoTapActive: getFromStorage("autoTapActive", false),
        totalTaps: getFromStorage("totalTaps", 0),
        lastActiveTime: getFromStorage("lastActiveTime", Date.now())
    };

    const [boosters, setBoosters] = useState(initialState);

    useEffect(() => {
        Object.keys(boosters).forEach((key) => {
            localStorage.setItem(key, JSON.stringify(boosters[key]));
        });
    }, [boosters]);


    const setDailyBoosters = (newBoosters) => {
        setBoosters(prev => ({
            ...prev,
            dailyBoosters: typeof newBoosters === "function" ? newBoosters(prev.dailyBoosters) : newBoosters
        }));
    };

    const setTotalTaps = (taps) => {
        setBoosters(prev => ({
            ...prev, totalTaps: typeof taps === 'function' ? taps(prev.totalTaps) : taps,
        }))
    }

    const setLastActiveTime = (time) => {
        localStorage.setItem("lastActiveTime", JSON.stringify(time))
        setBoosters(prev => ({ ...prev, lastActiveTime: time }))
    }

    const activateTapperBoost = () => {
        if (boosters.dailyBoosters.tapperBoost.isActive) return

        if (boosters.dailyBoosters.tapperBoost.usesLeft > 0 && !boosters.dailyBoosters.tapperBoost.isActive) {
            const now = Date.now();

            setBoosters(prev => ({
                ...prev,
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
                    ...prev,
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

    const setAutoTapActive = (activate) => {
        setBoosters(prev => ({
            ...prev, autoTapActive: activate
        }))
    }

    const activateOtherBoosters = (effect, newLevel) => {
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
            case "recharging speed": {
                const rechargeIndex = Math.min(newLevel, RECHARGE_TIMES.length - 1);
                const newRechargeTime = RECHARGE_TIMES[rechargeIndex];
                setRechargeTime(newRechargeTime)
                window.dispatchEvent(new CustomEvent("rechargeSpeedUpgraded", { detail: { level: newLevel } }));
                break;
            }
            case "Auto-bot Tapping": {
                setAutoTapActive(true)
                window.dispatchEvent(new CustomEvent("autoTapActivated", { detail: { level: newLevel } }));
                break;
            }
            default:
                console.warn(`Unknown booster effect: ${effect}`);
                window.dispatchEvent(new Event("boosterUpgraded"));
        }
    };

    const activateOtherBoostersOnLoad = (effect, newLevel) => {
        switch (effect) {
            case "boost": {
                const newMultiplier = 1 + newLevel;
                setTapMultiplier(newMultiplier);
                break;
            }
            case "multiplier": {
                const newMaxEnergy = 1000 + newLevel * 500;
                setMaxElectricBoost(newMaxEnergy);
                break;
            }
            case "recharging speed": {
                const rechargeIndex = Math.min(newLevel, RECHARGE_TIMES.length - 1);
                const newRechargeTime = RECHARGE_TIMES[rechargeIndex];
                setRechargeTime(newRechargeTime)
                break;
            }
            case "Auto-bot Tapping": {
                if (newLevel) {
                    setAutoTapActive(true)
                }
                break;
            }
            default:
                console.warn(`Unknown booster effect: ${effect}`);
        }
    };

    const updateBoosters = (updates) => {
        setBoosters((prev) => ({ ...prev, ...updates }));
    };

    const resetAll = () => {
        const newBoosters = {
            tapMultiplier: 1,
            dailyBoosters: {
                tapperBoost: { usesLeft: 3, isActive: false, endTime: null, resetTime: null },
                fullEnergy: { usesLeft: 3, isActive: false, resetTime: null },
            },
            extraBoosters: [],
            electricBoost: 1000,
            maxElectricBoost: 1000,
            rechargeTime: RECHARGE_TIMES[0],
            autoTapActive: false,
            totalTaps: 0,
            lastActiveTime: Date.now(),
            autoBotTaps: 0
        };

        updateBoosters(newBoosters); // Update state with new values
        // Store updated values in localStorage immediately
        Object.keys(newBoosters).forEach((key) => {
            localStorage.setItem(key, JSON.stringify(newBoosters[key]));
        });
    };


    const applyAutoBotTaps = () => {
        if (!boosters?.autoTapActive) return; // Ensure boosters exist before checking

        const nowUTC = new Date();
        const nowWAT = new Date(nowUTC.getTime() + 3600000); // Convert to Nigerian time (UTC+1)

        const lastActiveUTC = new Date(boosters.lastActiveTime);
        const lastActiveWAT = new Date(lastActiveUTC.getTime() + 3600000); // Convert last active to WAT

        let totalValidTime = 0; // Total valid time within 12 AM - 12 PM WAT

        let current = lastActiveWAT;
        while (current < nowWAT) {
            const hour = current.getUTCHours();
            if (hour >= 0 && hour < 12) {
                totalValidTime += Math.min(nowWAT - current, 3600000); // Add only valid time
            }
            current = new Date(current.getTime() + 3600000); // Move forward 1 hour
        }

        const timeAway = totalValidTime / 1000; // Convert ms to seconds
        const tapsPerSecond = 1 / 3; // Example: Adjust based on game logic
        let offlineTaps = Math.floor(timeAway * tapsPerSecond);

        return offlineTaps
    };

    const adjustElectricBoosts = () => {
        if (!boosters?.lastActiveTime) return;

        const now = Date.now();
        const lastActiveTime = boosters.lastActiveTime || now;
        const timeAway = now - lastActiveTime // ms

        const electricBoostsSinceLeaving = Math.floor(timeAway / boosters.rechargeTime)
        return Math.min(boosters.electricBoost + electricBoostsSinceLeaving, boosters.maxElectricBoost)
    }

    useEffect(() => {
        if (boosters.extraBoosters?.length) {
            boosters.extraBoosters.forEach(({ title, rawLevel, status }) => {
                if (title === "Auto-bot Tapping") {
                    activateOtherBoostersOnLoad(title, status)
                } else {
                    activateOtherBoostersOnLoad(title, rawLevel)
                }
            })
        }
    }, [boosters.extraBoosters])


    // Effect to check & apply boost on app load
    useEffect(() => {
        const { tapperBoost } = boosters.dailyBoosters;

        if (tapperBoost && tapperBoost.isActive) {
            // Apply 2x multiplier
            setBoosters(prev => ({ ...prev, tapMultiplier: prev.tapMultiplier * 2 }));

            const remaining = tapperBoost.endTime - Date.now();
            if (remaining > 0) {
                setTimeout(() => {
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

        if (boosters.extraBoosters?.length) {
            boosters.extraBoosters.forEach(({ title, rawLevel, status }) => {
                if (boosters.name === 'Auto-bot Tapping') {
                    activateOtherBoostersOnLoad(title, status)
                } else {
                    activateOtherBoostersOnLoad(title, rawLevel)
                }
            })
        }
    }, []);

    return (
        <BoostContext.Provider value={{
            tapMultiplier: boosters.tapMultiplier,
            dailyBoosters: boosters.dailyBoosters,
            boostersData: boosters.extraBoosters,
            electricBoost: boosters.electricBoost,
            maxElectricBoost: boosters.maxElectricBoost,
            rechargeTime: boosters.rechargeTime,
            autoTapActive: boosters.autoTapActive,
            totalTaps: boosters.totalTaps,
            lastActiveTime: boosters.lastActiveTime,
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
            resetAll,
            setAutoTapActive,
            adjustElectricBoosts,
            setTotalTaps,
            applyAutoBotTaps,
            setLastActiveTime
        }}>
            {children}
        </BoostContext.Provider>
    );
};

export default BoostersContext;
