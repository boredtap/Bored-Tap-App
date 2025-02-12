from datetime import datetime
from io import BytesIO
from bson import ObjectId
from fastapi.responses import StreamingResponse
from superuser.reward.models import RewardsModel, RewardsModelResponse
from superuser.reward.schemas import CreateReward, UpdateReward, Status
from database_connection import rewards_collection, fs


# ------------------------------- VERIFY BENEFICIARIES ------------------------------ #
def verify_beneficiaries(
        new_reward: CreateReward,
        clan: list[str] | None = None,
        level: list[str] | None = None,
        specific_users: list[str] | None = None
    ):
    if new_reward.beneficiary == "all_users":
        new_reward.beneficiary = ["all_users"]

    if new_reward.beneficiary == "level":
        new_reward.beneficiary = level[0].split(",")

    if new_reward.beneficiary == "clan" and len(clan) > 0:
        new_reward.beneficiary = clan[0].split(",")

    if new_reward.beneficiary == "specific_users" and len(specific_users) > 0:
        new_reward.beneficiary = specific_users[0].split(",")


# ------------------------------- CREATE REWARD ------------------------------ #
def create_reward(reward: CreateReward, reward_image: bytes, image_name: str):
    image_id = fs.put(reward_image, filename=image_name)

    new_reward = RewardsModel(
        reward_title=reward.reward_title,
        reward=reward.reward,
        beneficiary=reward.beneficiary,
        launch_date=reward.launch_date,
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
        **new_reward.model_dump()
    )


def get_reward_image(image_id: str):
    reward_image = fs.get(image_id)
    image_buffer = BytesIO(reward_image.read())
    image_buffer.seek(0)
    return StreamingResponse(image_buffer, media_type="image/jpeg")

def update_reward(reward: UpdateReward, reward_image: bytes, img_name: str, reward_id: str):

    # get reward by id
    query_filter = {"_id": ObjectId(reward_id)}
    reward_data = rewards_collection.find_one(query_filter)

    if not reward_data:
        raise Exception("Reward not found.")

    # delete old image and insert updated image
    old_img_id = reward_data["reward_image_id"]
    fs.delete(ObjectId(old_img_id))

    new_img_id = fs.put(reward_image, filename=img_name)

    update_operation = {
        "$set": {
                "reward_title": reward.reward_title,
                "reward": reward.reward,
                "beneficiary": reward.beneficiary,
                "launch_date": reward.launch_date,
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
        launch_date=reward.launch_date,
        status=reward_data["status"],
        claim_rate=reward_data["claim_rate"],
        reward_image_id=str(new_img_id)
    )


# ------------------------------- DELETE REWARD ------------------------------ #
def delete_reward(reward_id: str):
    reward = rewards_collection.find_one({"_id": ObjectId(reward_id)})

    if not reward:
        raise Exception("Reward not found.")
    
    # delete reward image
    image_id = reward["reward_image_id"]
    fs.delete(ObjectId(image_id))

    # delete reward
    deleted = rewards_collection.delete_one({"_id": ObjectId(reward_id)})

    if not deleted.acknowledged:
        raise Exception("Reward deletion failed.")

    return True


# ------------------------------- GET REWARDS ------------------------------ #
def get_rewards():
    rewards = rewards_collection.find({})

    if not rewards:
        raise Exception("No rewards found.")
    
    for reward in rewards:
        yield RewardsModelResponse(
            id=str(reward["_id"]),
            reward_title=reward["reward_title"],
            reward=reward["reward"],
            beneficiary=reward["beneficiary"],
            launch_date=reward["launch_date"],
            status=reward["status"],
            claim_rate=reward["claim_rate"],
            claim_count=reward["claim_count"],
            reward_image_id=reward["reward_image_id"]
        )


# ------------------------------- GET REWARDS BY STATUS ------------------------------ #
def get_rewards_by_status(status: str):
    rewards = rewards_collection.find({"status": status})

    if not rewards:
        raise Exception("No rewards found.")
    
    for reward in rewards:
        yield RewardsModelResponse(
            id=str(reward["_id"]),
            reward_title=reward["reward_title"],
            reward=reward["reward"],
            beneficiary=reward["beneficiary"],
            launch_date=reward["launch_date"],
            status=reward["status"],
            claim_rate=reward["claim_rate"],
            reward_image_id=reward["reward_image_id"]
        )


# ------------------------------- GET REWARDS BY DATE ------------------------------ #
def get_rewards_by_date(date: datetime):
    rewards = rewards_collection.find({"launch_date": date})

    if not rewards:
        raise Exception("No rewards found.")
    
    for reward in rewards:
        yield RewardsModelResponse(
            id=str(reward["_id"]),
            reward_title=reward["reward_title"],
            reward=reward["reward"],
            beneficiary=reward["beneficiary"],
            launch_date=reward["launch_date"],
            status=reward["status"],
            claim_rate=reward["claim_rate"],
            reward_image_id=reward["reward_image_id"]
        )
