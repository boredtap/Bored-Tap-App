from datetime import datetime, timedelta
from typing import Annotated
from fastapi import APIRouter, Depends
from dependencies import update_coins_in_db
from earn.schemas import StreakData
from user_reg_and_prof_mngmnt.user_authentication import get_current_user, oauth2_scheme
from earn.dependencies import get_current_streak, init_restart_streak, update_streak_in_db


earnApp = APIRouter()

@earnApp.post("/perform-streak", tags=["Earn features"], response_model=StreakData)
async def perform_streak(telegram_user_id: Annotated[str, Depends(get_current_user)]):
    """
    Updates the current and longest streaks of a user based on their activity.

    Args:
        telegram_user_id (str): The Telegram user ID of the user.

    Returns:
        tuple[int, int]: A tuple containing the updated current streak and the longest streak.
    """
    streak = get_current_streak(telegram_user_id)
    current_date = datetime.today()
    one_day = timedelta(1)

    if not streak.last_action_date:
        # initialize user streaks
        init_restart_streak(current_date, streak)
        update_coins_in_db(telegram_user_id, 500)

        # update user streak
        update_streak_in_db(telegram_user_id, streak)

        return StreakData(
            current_streak=streak.current_streak,
            longest_streak=streak.longest_streak,
            last_action_date=streak.last_action_date
        )

    time_difference = current_date.date() - streak.last_action_date.date()

    if time_difference <= one_day and current_date.date() != streak.last_action_date.date():
        # Streak continues
        streak.current_streak += 1      # Increment current streak by 1 for each successful day
        longest_streak = max(streak.current_streak, streak.longest_streak)
        streak.longest_streak = longest_streak
        streak.last_action_date = current_date
        update_coins_in_db(telegram_user_id, 500)

    elif time_difference > one_day:
        # broken streak, restart user streak
        init_restart_streak(current_date, streak)
        update_coins_in_db(telegram_user_id, 500)
    
    # update user streak
    update_streak_in_db(telegram_user_id, streak)

    return StreakData(
        current_streak=streak.current_streak,
        longest_streak=streak.longest_streak,
        last_action_date=streak.last_action_date
    )


@earnApp.get("/get-streak-status", tags=["Earn features"])
async def get_streak_status(telegram_user_id: Annotated[str, Depends(get_current_user)]):
    streak = get_current_streak(telegram_user_id)
    return StreakData(
        current_streak=streak.current_streak,
        longest_streak=streak.longest_streak,
        last_action_date=streak.last_action_date
    )