from datetime import datetime, timedelta
import logging
from typing import Annotated
from fastapi import APIRouter, Depends
from .dependencies import broken_streak_reset, calculate_time_difference, increment_streak_and_coin, init_streak
from earn.schemas import StreakData
from user_reg_and_prof_mngmnt.user_authentication import get_current_user
from earn.dependencies import get_current_streak


logging.basicConfig(level=logging.INFO)
earnApp = APIRouter()

@earnApp.post("/perform-streak", tags=["Earn features"])
async def perform_streak(telegram_user_id: Annotated[str, Depends(get_current_user)]):
    """
    Updates the current and longest streaks of a user based on their activity.

    Args:
        telegram_user_id (str): The Telegram user ID of the user.

    Returns:
        tuple[int, int]: A tuple containing the updated current streak and the longest streak.
    """
    old_streak = get_current_streak(telegram_user_id)
    logging.info(f"Old streak: {old_streak.model_dump()}")

    current_date = datetime.today()
    one_day = timedelta(hours=24)
    daily_reward_amount = 500

    if not old_streak.last_action_date:
        # initialize user streaks if no streak record exists
        logging.info('No streak record found: streak will be initialized')
        init_streak_data = StreakData(
            current_streak=1,
            longest_streak=1,
            last_action_date=current_date
        )

        init_streak(telegram_user_id, init_streak_data, daily_reward_amount)
        logging.info(f"Initialized streak: {init_streak_data.model_dump()}")

        return init_streak_data

    time_difference = calculate_time_difference(current_date, old_streak.last_action_date)
    if one_day <= time_difference <= timedelta(hours=25) and current_date.date() != old_streak.last_action_date.date():
        # Streak continues
        # Increment:- streak: 1, total_coins: daily_reward_amount
        # set:- last_action_date: current_date, longest_streak: max(old_streak, current_streak)

        logging.info('Streak continues if:', {'time_difference': 'gte 23 hours but lte 25 hours'})
        
        new_streak = StreakData(
            current_streak=old_streak.current_streak + 1,
            longest_streak=max(old_streak.longest_streak, old_streak.current_streak + 1),
            last_action_date=current_date
        )

        increment_streak_and_coin(telegram_user_id, daily_reward_amount, new_streak)
        logging.info({
            "Time difference (hrs)": time_difference.total_seconds() / 3600,
            "New streak": new_streak.model_dump()
        })

        return new_streak

    elif time_difference > timedelta(hours=25):
        # broken streak, restart user streak
        logging.info('Broken streak, if: time difference is gt 25 hours')
        reset_streak = StreakData(
            current_streak=1,
            longest_streak=old_streak.longest_streak,
            last_action_date=current_date
        )

        broken_streak_reset(telegram_user_id, reset_streak, daily_reward_amount)
        logging.info({
            "Time difference (hrs)": time_difference.total_seconds() / 3600,
            "Reset streak": reset_streak.model_dump()
        })

        return reset_streak
    
    return {
        "message": "Streak not updated",
        "Countdown": f"check again by this time: {old_streak.last_action_date.strftime("%I:%M %p")} tomorrow"
    }


@earnApp.get("/streak/status", tags=["Earn features"])
async def get_streak_status(telegram_user_id: Annotated[str, Depends(get_current_user)]):
    streak = get_current_streak(telegram_user_id)
    return StreakData(
        current_streak=streak.current_streak,
        longest_streak=streak.longest_streak,
        last_action_date=streak.last_action_date
    )
