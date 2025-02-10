import base64
from bson import Binary, ObjectId
from superuser.reward.models import RewardsModel, RewardsModelResponse
from superuser.reward.schemas import CreateReward, UpdateReward, Status
from database_connection import rewards_collection


def create_reward(reward: CreateReward, reward_image: Binary):

    new_reward = RewardsModel(
        reward_title=reward.reward_title,
        reward=reward.reward,
        beneficiary=reward.beneficiary,
        launch_date=reward.launch_date,
        status=Status.ONGOING,
        claim_rate=0,
        reward_image=reward_image
    )

    inserted = rewards_collection.insert_one(new_reward.model_dump())

    if not inserted.acknowledged:
        raise Exception("Reward creation failed.")

    # get inserted id
    new_reward_id = inserted.inserted_id
    new_reward.reward_image = base64.b64encode(new_reward.reward_image).decode('utf-8')  # convert binary to base64

    return RewardsModelResponse(**new_reward.model_dump(), id=str(new_reward_id))

def update_reward(reward: UpdateReward, reward_image: Binary, reward_id: str):

    # get reward by id
    reward_data = rewards_collection.find_one({"_id": ObjectId(reward_id)})

    if not reward_data:
        raise Exception("Reward not found.")

    # update reward
    reward_data["reward_title"] = reward.reward_title
    reward_data["reward"] = reward.reward
    reward_data["beneficiary"] = reward.beneficiary
    reward_data["launch_date"] = reward.launch_date
    reward_data["reward_image"] = reward_image

    query_filter = {"_id": ObjectId(reward_id)}
    update_operation = {
        "$set": {
                "reward_title": reward_data["reward_title"],
                "reward": reward_data["reward"],
                "beneficiary": reward_data["beneficiary"],
                "launch_date": reward_data["launch_date"],
                "reward_image": reward_data["reward_image"],
            }
    }

    updated = rewards_collection.update_one(
        query_filter,
        update_operation
    )

    if not updated.acknowledged:
        raise Exception("Reward update failed.")
    
    # convert binary to base64
    reward_data["reward_image"] = base64.b64encode(reward_data["reward_image"]).decode('utf-8')

    return RewardsModelResponse(**reward_data, id=str(reward_id))


# ------------------------------- DELETE REWARD ------------------------------ #
def delete_reward(reward_id: str):

    deleted = rewards_collection.delete_one({"_id": ObjectId(reward_id)})

    if not deleted.acknowledged:
        raise Exception("Reward deletion failed.")

    return True