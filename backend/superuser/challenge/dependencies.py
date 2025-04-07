from datetime import date, datetime, timedelta
from email.mime import image
from io import BytesIO
from bson import ObjectId
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from superuser.challenge.models import ChallengeModel, ChallengeModelResponse
from superuser.challenge.schemas import CreateChallenge
from dependencies import user_levels
from database_connection import user_collection, fs, challenges_collection, clans_collection


def verify_image(format: str):
    """
    Verifies if the provided image format is valid.

    Args:
        format (str): The format of the image file to verify.

    Raises:
        HTTPException: If the image format is not one of the valid formats ("jpeg", "jpg", "png").

    Returns:
        bool: True if the format is valid.
    """
    if format.lower() not in ["jpeg", "jpg", "png"]:
        raise HTTPException(status_code=400, detail="Invalid image file. Please upload a valid image file.")
    
    return True


# ------------------------------- VERIFY BENEFICIARIES ------------------------------ #
def verify_participants(
        new_challenge: CreateChallenge,
        clan: list[str] | None = None,
        level: list[str] | None = None,
        specific_users: list[str] | None = None
    ):
    """
    Verifies the challenge participants based on the provided parameters.

    Args:
        new_challenge (CreateChallenge): The challenge data to verify.
        clan (list[str] | None, optional): The clan ids/names to verify. Defaults to None.
        level (list[str] | None, optional): The level names to verify. Defaults to None.
        specific_users (list[str] | None, optional): The user ids/usernames to verify. Defaults to None.

    Raises:
        HTTPException: If the challenge participants are invalid.

    Returns:
        None
    """

    # all users
    if new_challenge.participants == "all_users":
        new_challenge.participants = ["all_users"]

    # verify levels
    if new_challenge.participants == "level":
        level_participants = level[0].split(",")
        game_levels = [level[1].lower() for k, level in user_levels.items()]

        for level in level_participants:
            if level.lower() not in game_levels:
                raise HTTPException(status_code=400, detail="Invalid level entered.")
        new_challenge.participants = level_participants

    # verify clan
    if new_challenge.participants == "clan" and len(clan) > 0:
        clans = clan[0].split(",")

        for clan_id in clans:
            clan_by_name = clans_collection.find_one({"name": clan_id})

            clan = clan_by_name
            if not clan:
                raise HTTPException(status_code=400, detail="Invalid clan entered.")

        new_challenge.participants = clans

    # verify specific users
    if new_challenge.participants == "specific_users" and len(specific_users) > 0:
        users = specific_users[0].split(",")

        for user_id in users:
            user_by_id = user_collection.find_one({"telegram_user_id": user_id})
            user_by_username = user_collection.find_one({"username": user_id})

            user = user_by_id or user_by_username
            if not user:
                raise HTTPException(status_code=400, detail="Invalid user entered.")

        new_challenge.participants = users


# --------------------------------- CALCULATE CHALLENGE TIMINGS --------------------------------- #
def calculate_remaining_time(challenge_duration: str, challenge_launch_date: datetime):
    """
    Calculates the remaining time for a challenge given its duration and launch date.

    Args:
        challenge_duration (str): The duration of the challenge in the format "DD:HH:MM:SS".
        challenge_launch_date (datetime): The launch date and time of the challenge.

    Returns:
        str: The remaining time in the format "DD:HH:MM:SS".

    Raises:
        HTTPException: If the challenge duration is invalid.
    """
    # calculate challenge end time
    days, hours, minutes, seconds = map(int, challenge_duration.split(":"))
    duration = timedelta(days=days, hours=hours, minutes=minutes, seconds=seconds)
    challenge_end_time = challenge_launch_date + duration

    # calculate challenge remaining time
    if datetime.now(tz=challenge_launch_date.tzinfo) < challenge_launch_date:
        remaining_time = challenge_end_time - challenge_launch_date
        if remaining_time < timedelta(days=0, hours=0, minutes=0, seconds=0):
            remaining_time = timedelta(days=0, hours=0, minutes=0, seconds=0)
    else:
        remaining_time = challenge_end_time - datetime.now()
        if remaining_time < timedelta(days=0, hours=0, minutes=0, seconds=0):
            remaining_time = timedelta(days=0, hours=0, minutes=0, seconds=0)

    days = remaining_time.days
    hours, remainder = divmod(remaining_time.seconds, 3600)
    minutes, seconds = divmod(remainder, 60)

    return f"{days:02d}:{hours:02d}:{minutes:02d}:{seconds:02d}"


# --------------------------------- CREATE CHALLENGE --------------------------------- #
def create_challenge(challenge: CreateChallenge, image_bytes: bytes, image_name: str):
    """
    Creates a new challenge in the database.

    Args:
        challenge (CreateChallenge): The challenge data to create.
        image_bytes (bytes): The image bytes to upload.
        image_name (str): The name of the image file.

    Raises:
        HTTPException: If the challenge creation fails.

    Returns:
        ChallengeModelResponse: The created challenge data.
    """
    if challenge.launch_date < datetime.now(tz=challenge.launch_date.tzinfo):
        raise HTTPException(status_code=400, detail="Challenge launch date cannot be in the past.")
    
    # challenge_remaining_time = f"{days:02d}:{hours:02d}:{minutes:02d}:{seconds:02d}"
    challenge_remaining_time = calculate_remaining_time(challenge.duration, challenge.launch_date)

    image_id = fs.put(image_bytes, filename="challenge_" + image_name)

    if not image_id:
        raise HTTPException("Challenge creation failed.")


    new_challenge = ChallengeModel(
        name=challenge.name,
        description=challenge.description,
        launch_date=challenge.launch_date,
        reward=challenge.reward,
        duration=challenge.duration,
        remaining_time=challenge_remaining_time,
        participants=challenge.participants,
        image_id=str(image_id)
    )

    inserted = challenges_collection.insert_one(new_challenge.model_dump())

    if not inserted.acknowledged:
        raise HTTPException("Challenge creation failed.")

    # get inserted id
    new_challenge_id = inserted.inserted_id

    return ChallengeModelResponse(
        id=str(new_challenge_id),
        **new_challenge.model_dump()
    )


# --------------------------------- UPDATE CHALLENGE --------------------------------- #
def update_challenge(challenge_id: str, challenge: CreateChallenge, image_bytes: bytes, image_name: str):
    # get challenge by id
    query_filter = {"_id": ObjectId(challenge_id)}
    challenge_data = challenges_collection.find_one(query_filter)

    if not challenge_data:
        raise HTTPException(status_code=404, detail="Challenge not found/Invalid challenge id.")

    # calculate challenge remainig time
    challenge_duration = challenge.duration
    challenge_launch_date = challenge.launch_date
    remaining_time = calculate_remaining_time(challenge_duration, challenge_launch_date)

    # delete old image and insert updated image
    try:
        old_img_id = challenge_data["image_id"]
        fs.delete(ObjectId(old_img_id))

        new_img_id = fs.put(image_bytes, filename=image_name)

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    update_operation = {
        "$set": {
                "name": challenge.name,
                "description": challenge.description,
                "launch_date": challenge.launch_date,
                "reward": challenge.reward,
                "duration": challenge.duration,
                "remaining_time": remaining_time,
                "participants": challenge.participants,
                "image_id": new_img_id,
            }
    }

    updated = challenges_collection.update_one(query_filter, update_operation)

    if not updated.acknowledged:
        raise HTTPException(status_code=400, detail="Challenge update failed.")

    return ChallengeModelResponse(
        id=challenge_id,
        name=challenge.name,
        description=challenge.description,
        launch_date=challenge.launch_date,
        reward=challenge.reward,
        duration=challenge.duration,
        remaining_time=remaining_time,
        participants=challenge.participants,
        image_id=str(new_img_id)

    )


# --------------------------------- GET CHALLENGE IMAGE --------------------------------- #
def get_challenge_image(image_id: str):
    challenge_image = fs.get(ObjectId(image_id))
    image_buffer = BytesIO(challenge_image.read())
    image_buffer.seek(0)
    return StreamingResponse(image_buffer, media_type="image/jpeg")


# --------------------------------- GET CHALLENGES --------------------------------- #
def get_challenges(status: str):
    challenges = challenges_collection.find()

    for challenge in challenges:
        challenge_duration: str = challenge["duration"]
        challenge_launch_date: datetime = challenge["launch_date"]

        remaining_time = calculate_remaining_time(challenge_duration, challenge_launch_date)
        
        if remaining_time == "00:00:00:00":
            # update remaining time in db
            update_operation = {
                "$set": {
                    "remaining_time": remaining_time
                }
            }
            challenges_collection.update_one({"_id": ObjectId(challenge['_id'])}, update_operation)

        # ongoing challenges
        if status == "ongoing" and remaining_time != "00:00:00:00":
            challenge["remaining_time"] = remaining_time
            challenge["image_id"] = str(challenge["image_id"])

            yield ChallengeModelResponse(
                id=str(challenge["_id"]),
                **challenge
            ) 

        # completed challenges
        if status == "completed" and remaining_time == "00:00:00:00":
            challenge["remaining_time"] = remaining_time
            challenge["image_id"] = str(challenge["image_id"])

            yield ChallengeModelResponse(
                id=str(challenge["_id"]),
                **challenge
            )


# --------------------------------- GET CHALLENGE BY ID --------------------------------- #
def get_challenge_by_id(challenge_id: str):
    challenge = challenges_collection.find_one({"_id": ObjectId(challenge_id)})

    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found/Invalid challenge id.")
    
    challenge_duration: str = challenge["duration"]
    challenge_launch_date: datetime = challenge["launch_date"]

    remaining_time = calculate_remaining_time(challenge_duration, challenge_launch_date)
    challenge["remaining_time"] = remaining_time
    challenge["image_id"] = str(challenge["image_id"])


    return ChallengeModelResponse(
        id=str(challenge["_id"]),
        **challenge
    )


# --------------------------------- GET CHALLENGE BY LAUNCH DATE --------------------------------- #
def get_challenge_by_date(launch_date: date):
    target_date = datetime(year=launch_date.year, month=launch_date.month, day=launch_date.day)
    next_day = target_date + timedelta(days=1)
    
    challenge = challenges_collection.find_one(
        {
            "launch_date": {
                "$gte": target_date.isoformat() + "Z",
                "$lt": next_day.isoformat() + "Z"
                }
        }
    )

    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found/Invalid challenge id.")

    challenge["image_id"] = str(challenge["image_id"])

    return ChallengeModelResponse(
        id=str(challenge["_id"]),
        **challenge
    )


# --------------------------------- DELETE CHALLENGE --------------------------------- #
def delete_challenge(challenge_id: str):
    try:
        challenge = challenges_collection.find_one({"_id": ObjectId(challenge_id)})

        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found/Invalid challenge id.")

        # delete challenge image
        image_id = challenge["image_id"]
        fs.delete(ObjectId(image_id))

        # delete challenge
        deleted = challenges_collection.delete_one({"_id": ObjectId(challenge_id)})

        if not deleted.acknowledged:
            raise HTTPException(status_code=400, detail="Challenge deletion failed.")

        return True

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

