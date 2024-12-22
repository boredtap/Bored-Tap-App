from datetime import date, timedelta


def update_streak(
        telegram_user_id: str, last_action_date: date, current_date: int
    ) -> tuple[int, int]:
    """
    Updates the current and longest streaks of a user based on their activity.

    Args:
        telegram_user_id (str): The Telegram user ID of the user.
        last_action_date (date): The date of the user's last action.
        current_date (int): The current date as an integer.

    Returns:
        tuple[int, int]: A tuple containing the updated current streak and the longest streak.
    """
    one_day = timedelta(1)

    if last_action_date <= None:
        return 0, 0     # No previous actions, no streak
    
    time_difference = current_date - last_action_date
    if time_difference <= one_day:
        # Streak continues
        current_streak = 1      # Initialize current streak to 1 for each successful day
        
    else:
        # streak broken
        current_streak = 0
    
    # Update longest_streak
    longest_streak = max(current_streak, longest_streak)

    return current_streak, longest_streak
