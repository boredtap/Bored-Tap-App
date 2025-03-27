from datetime import datetime, timedelta, timezone
from io import BytesIO
import stat
from bson import ObjectId
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from superuser.reward.models import RewardsModel, RewardsModelResponse
from superuser.reward.schemas import CreateReward, UpdateReward, Status
from database_connection import rewards_collection, fs, user_collection
from dependencies import user_levels


# ------------------------------- VERIFY BENEFICIARIES ------------------------------ #
def verify_beneficiaries(
        new_reward: CreateReward,
        clan: list[str] | None = None,
        level: list[str] | None = None,
        specific_users: list[str] | None = None
    ):
    # all users
    if new_reward.beneficiary == "all_users":
        new_reward.beneficiary = ["all_users"]

    # verify levels
    if new_reward.beneficiary == "level":
        level_participants = level[0].split(",")
        game_levels = [level[1].lower() for k, level in user_levels.items()]

        for level in level_participants:
            if level.lower() not in game_levels:
                raise HTTPException(status_code=400, detail="Invalid level entered.")
        new_reward.beneficiary = level_participants

    # verify clan
    if new_reward.beneficiary == "clan" and len(clan) > 0:
        new_reward.beneficiary = clan[0].split(",")

    # verify specific users
    if new_reward.beneficiary == "specific_users" and len(specific_users) > 0:
        users = specific_users[0].split(",")

        for user_id in users:
            user = user_collection.find_one({"telegram_user_id": user_id})
            if not user:
                raise HTTPException(status_code=400, detail="Invalid user entered.")

        new_reward.beneficiary = users

def set_datetime_to_utc(date_time: datetime):
    # set datetime timezone to UTC
    if date_time.tzinfo is None:
        date_time = date_time.replace(hour=0, minute=0, second=0, tzinfo=timezone.utc)
    else:
        date_time = date_time.astimezone(timezone.utc)

    return date_time



# ------------------------------- CREATE REWARD ------------------------------ #
def create_reward(reward: CreateReward, reward_image: bytes, image_name: str):
    image_id = fs.put(reward_image, filename="reward_" + image_name)

    today = datetime.now(timezone.utc)
    expiry_date = reward.expiry_date

    if expiry_date.tzinfo:
        expiry_date = expiry_date.astimezone(timezone.utc)
    else:
        expiry_date = expiry_date.replace(tzinfo=timezone.utc)

    expiry_date = expiry_date.replace(hour=today.hour, minute=today.minute, second=today.second, microsecond=today.microsecond, tzinfo=timezone.utc)

    new_reward = RewardsModel(
        reward_title=reward.reward_title,
        reward=reward.reward,
        beneficiary=reward.beneficiary,
        expiry_date=expiry_date,
        status=Status.ONGOING,
        claim_rate=0,
        reward_image_id=str(image_id)
    )

    inserted = rewards_collection.insert_one(new_reward.model_dump())

    if not inserted.acknowledged:
        raise Exception("Reward creation failed.")

    # get inserted id
    new_reward_id = inserted.inserted_id

    image_buffer = BytesIO(reward_image)
    image_buffer.seek(0)

    return RewardsModelResponse(
        id=str(new_reward_id),
        reward_title=new_reward.reward_title,
        reward=new_reward.reward,
        beneficiary=new_reward.beneficiary,  
        expiry_date=new_reward.expiry_date,
        status=new_reward.status,
        claim_count=new_reward.claim_count,
        claim_rate=f"{new_reward.claim_rate}%",
        reward_image_id=str(image_id)
        # **new_reward.model_dump()
    )


def get_reward_image(image_id: str):
    reward_image = fs.get(ObjectId(image_id))
    image_buffer = BytesIO(reward_image.read())
    image_buffer.seek(0)
    return StreamingResponse(image_buffer, media_type="image/jpeg")

def update_reward(reward: UpdateReward, reward_image: bytes, img_name: str, reward_id: str):

    # get reward by id
    query_filter = {"_id": ObjectId(reward_id)}
    reward_data = rewards_collection.find_one(query_filter)

    if not reward_data:
        raise HTTPException("Reward not found.")

    # delete old image and insert updated image
    old_img_id = reward_data["reward_image_id"]
    fs.delete(ObjectId(old_img_id))

    new_img_id = fs.put(reward_image, filename=img_name)

    update_operation = {
        "$set": {
                "reward_title": reward.reward_title,
                "reward": reward.reward,
                "beneficiary": reward.beneficiary,
                "expiry_date": reward.expiry_date,
                "reward_image_id": new_img_id,
            }
    }

    updated = rewards_collection.update_one(
        query_filter,
        update_operation
    )

    if not updated.acknowledged:
        raise Exception("Reward update failed.")

    return RewardsModelResponse(
        # **reward, id=str(reward_id)
        id=str(reward_id),
        reward_title=reward.reward_title,
        reward=reward.reward,
        beneficiary=reward.beneficiary,
        expiry_date=reward.expiry_date,
        status=reward_data["status"],
        claim_rate=f"{reward_data['claim_rate']}%",
        reward_image_id=str(new_img_id)
    )


# ------------------------------- DELETE REWARD ------------------------------ #
def delete_reward(reward_id: str):
    reward = rewards_collection.find_one({"_id": ObjectId(reward_id)})

    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found.")
    
    # delete reward image
    image_id = reward["reward_image_id"]
    fs.delete(ObjectId(image_id))

    # delete reward
    deleted = rewards_collection.delete_one({"_id": ObjectId(reward_id)})

    if not deleted.acknowledged:
        raise Exception("Reward deletion failed.")

    return True


# ------------------------------- CALCULATE REWARD REMAINING TIME ------------------------------ #
def reward_remaining_time(reward: dict):
    """
    Calculates the remaining time until the reward expires.

    Args:
        reward (dict): A dictionary containing the reward details, including the 'expiry_date'.

    Returns:
        timedelta: The remaining time until the reward's expiry date, calculated in days.
    """
    expiry_date: datetime = reward["expiry_date"]
    exp = set_datetime_to_utc(expiry_date)
    today = datetime.now(timezone.utc)
    
    remaining_time = exp - today

    return remaining_time

# ------------------------------- GET REWARDS ------------------------------ #
def get_rewards():
    rewards = rewards_collection.find({})

    if not rewards:
        raise Exception("No rewards found.")
    
    for reward in rewards:
        impression = reward["impression_count"]
        claim_count = reward["claim_count"]
        claim_rate = ((claim_count / impression) * 100) if impression > 0 else 0.00
        rewards_collection.update_one({"_id": reward["_id"]}, {"$set": {"claim_rate": round(claim_rate, 2)}})
        yield RewardsModelResponse(
            id=str(reward["_id"]),
            reward_title=reward["reward_title"],
            reward=reward["reward"],
            beneficiary=reward["beneficiary"],  
            expiry_date=reward["expiry_date"],
            status=reward["status"],
            claim_rate=f"{reward['claim_rate']}%",
            claim_count=reward["claim_count"],
            reward_image_id=str(reward["reward_image_id"])
        )


# ------------------------------- GET REWARDS BY STATUS ------------------------------ #
def get_rewards_by_status(status: str):
    rewards = rewards_collection.find({"status": status})

    if not rewards:
        raise HTTPException(status_code=404, detail="No rewards found.")
    
    for reward in rewards:
        remaining_time = reward_remaining_time(reward)

        if remaining_time.days > timedelta(days=0, hours=0).days:
            yield RewardsModelResponse(
                id=str(reward["_id"]),
                reward_title=reward["reward_title"],
                reward=reward["reward"],
                beneficiary=reward["beneficiary"],
                expiry_date=reward["expiry_date"],
                status=reward["status"],
                claim_rate=f"{reward['claim_rate']}%",
                reward_image_id=str(reward["reward_image_id"])
            )


# ------------------------------- GET REWARDS BY DATE ------------------------------ #
def get_rewards_by_date(date: datetime):
    rewards = rewards_collection.find({"launch_date": date})

    if not rewards:
        raise Exception("No rewards found.")
    
    for reward in rewards:
        remaining_time = reward_remaining_time(reward)

        if remaining_time.days > timedelta(days=0, hours=0):
            yield RewardsModelResponse(
                id=str(reward["_id"]),
                reward_title=reward["reward_title"],
                reward=reward["reward"],
                beneficiary=reward["beneficiary"],
                expiry_date=reward["expiry_date"],
                status=reward["status"],
                claim_rate=f"{reward['claim_rate']}%",
                reward_image_id=reward["reward_image_id"]
            )



def update_status_of_expired_rewards():
    on_going_rewards = rewards_collection.find({"status": "on_going"})

    count = 0
    for reward in on_going_rewards:
        remaining_time = reward_remaining_time(reward)
        
        if remaining_time <= timedelta(days=0, hours=0, minutes=0, seconds=0, microseconds=0):
            exp_check_update = {
                "$set": {
                    "status": "expired"
                }
            }

            update = rewards_collection.update_one({"_id": ObjectId(reward['_id'])}, exp_check_update)
            if update.modified_count > 0:
                count += 1
    print(f"expired rewards: {count}")
