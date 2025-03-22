from datetime import datetime, timedelta
import logging
from typing import Annotated
from fastapi import APIRouter, Depends
from yarl import Query

from .dependencies import broken_streak_reset, calculate_time_difference, increment_streak_and_coin, init_streak
from earn.schemas import StreakData
from user_reg_and_prof_mngmnt.user_authentication import get_current_user
from earn.dependencies import get_current_streak

# ---------------------- imports for leaderboard ---------------------- #
from superuser.leaderboard.schemas import LeaderboardType
from superuser.leaderboard.dependencies import (
    all_time_leaderboard, daily_leaderboard,
    weekly_leaderboard, monthly_leaderboard
)

# ---------------------- imports for reward ---------------------- #
from superuser.reward.dependencies import get_reward_image as get_reward_image_func
from reward.dependencies import (
    my_on_going_rewards,
    claim_reward as claim_reward_func,
    my_claimed_rewards
)
from superuser.reward.schemas import Status

# ---------------------- imports for challenge ---------------------- #
from superuser.challenge.schemas import ChallengeStatus
from challenge.dependencies import get_my_challenges as get_my_challenges_func




logging.basicConfig(level=logging.INFO)
earnApp = APIRouter(
    tags=["Earn features"],
    dependencies=[Depends(get_current_user)]
)

##############################################################################################################################
# -------------------------------------------------------- EARN/STREAK ----------------------------------------------------- #
##############################################################################################################################

# ------------------------------------- PERFORM STREAK ------------------------------------- #
@earnApp.post("/perform-streak")
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
    if one_day <= time_difference <= timedelta(hours=48) and current_date.date() != old_streak.last_action_date.date():
        # Streak continues
        # Increment:- streak: 1, total_coins: daily_reward_amount
        # set:- last_action_date: current_date, longest_streak: max(old_streak, current_streak)

        logging.info('Streak continues if:', {'time_difference': 'gte 24 hours but lte 48 hours'})
        
        new_streak = StreakData(
            current_streak=old_streak.current_streak + 1,
            longest_streak=max(old_streak.longest_streak, old_streak.current_streak + 1),
            last_action_date=current_date
        )

        increment_streak_and_coin(telegram_user_id, daily_reward_amount, new_streak)
        # logging.info({
        #     "Time difference (hrs)": time_difference.total_seconds() / 3600,
        #     "New streak": new_streak.model_dump()
        # })

        return new_streak

    elif time_difference > timedelta(hours=48):
        # broken streak, restart user streak
        # logging.info('Broken streak, if: time difference is gt 25 hours')
        reset_streak = StreakData(
            current_streak=1,
            longest_streak=old_streak.longest_streak,
            last_action_date=current_date
        )

        broken_streak_reset(telegram_user_id, reset_streak, daily_reward_amount)
        # logging.info({
        #     "Time difference (hrs)": time_difference.total_seconds() / 3600,
        #     "Reset streak": reset_streak.model_dump()
        # })

        return reset_streak
    
    remaining_wait_time = timedelta(hours=24) - time_difference
    hrs = remaining_wait_time.total_seconds() // 3600
    mins = (remaining_wait_time.total_seconds() // 60) % 60
    secs = remaining_wait_time.total_seconds() % 60

    return {
        "message": "Streak not updated",
        "Count": f"check again in the next {int(hrs)} hrs:{int(mins)} mins:{int(secs)} secs"
    }


# ------------------------------------- GET STREAK STATUS ------------------------------------- #
@earnApp.get("/streak/status")
async def get_streak_status(telegram_user_id: Annotated[str, Depends(get_current_user)]):
    streak = get_current_streak(telegram_user_id)
    return StreakData(
        current_streak=streak.current_streak,
        longest_streak=streak.longest_streak,
        last_action_date=streak.last_action_date
    )


##############################################################################################################################
# --------------------------------------------------- EARN/LEADERBOARD ----------------------------------------------------- #
##############################################################################################################################

# ------------------------------------- LEADERBOARD ------------------------------------- #
@earnApp.get("/user/leaderboard")
async def get_leaderboard(category: LeaderboardType):
    if category == LeaderboardType.ALL_TIME:
        board_result = all_time_leaderboard()

    if category == LeaderboardType.DAILY:
        board_result = daily_leaderboard()

    if category == LeaderboardType.WEEKLY:
        board_result = weekly_leaderboard()

    if category == LeaderboardType.MONTHLY:
        board_result = monthly_leaderboard()
    
    return board_result



##############################################################################################################################
# ------------------------------------------------------- EARN/REWARD ---------------------------------------------------------- #
##############################################################################################################################

# ------------------------------------- MY REWARDS ------------------------------------- #
@earnApp.get("/earn/my-rewards")
async def get_my_rewards(telegram_user_id: Annotated[str, Depends(get_current_user)], status: Status):
    if status == Status.ONGOING:
        return my_on_going_rewards(telegram_user_id)
    
    return my_claimed_rewards(telegram_user_id)


# ------------------------------------- GET REWARD IMAGE ------------------------------------- #
@earnApp.get("/reward_image/{image_id}", status_code=201, deprecated=True)
async def get_reward_image(image_id: str):

    return get_reward_image_func(image_id)



# ------------------------------------- CLAIM REWARD ------------------------------------- #
@earnApp.get("/earn/my-rewards/{reward_id}/claim")
async def claim_reward(reward_id: str, telegram_user_id: Annotated[str, Depends(get_current_user)]):
    claim = claim_reward_func(telegram_user_id, reward_id)
    if claim:
        return {"message": "Reward claimed successfully."}
    
    return {"message": "Reward not found/Invalid reward id."}



##############################################################################################################################
# --------------------------------------------------- EARN/CHALLENGE ------------------------------------------------------- #
##############################################################################################################################

@earnApp.get("/earn/challenge/my-challenges")
async def get_my_challenges(telegram_user_id: Annotated[str, Depends(get_current_user)], status: ChallengeStatus):

    return get_my_challenges_func(telegram_user_id, status)


@earnApp.get("/earn/challenge/challenge_image/{image_id}", status_code=201, deprecated=True)
async def get_challenge_image(image_id: str):

    return get_reward_image_func(image_id)
