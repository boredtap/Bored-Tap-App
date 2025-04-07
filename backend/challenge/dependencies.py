from challenge.schemas import MyChallenges
from database_connection import user_collection
from superuser.challenge.dependencies import get_challenges


def get_my_challenges(telegram_user_id: str, status: str):
    my_data = user_collection.find_one({"telegram_user_id": telegram_user_id})

    if my_data:
        my_level: str = my_data["level_name"].lower()
        my_clan = my_data["clan"]

        for challenge in get_challenges(status):
            if status == "ongoing":
                if my_level in challenge.participants or \
                    my_clan in challenge.participants or \
                    "all_users" in challenge.participants or \
                    telegram_user_id in challenge.participants:

                    yield MyChallenges(
                        challenge_id=challenge.id,
                        name=challenge.name,
                        description=challenge.description,
                        reward=challenge.reward,
                        remaining_time=challenge.remaining_time,
                        image_id=str(challenge.image_id)
                    )


def get_challenge_image(image_id: str):
    pass
