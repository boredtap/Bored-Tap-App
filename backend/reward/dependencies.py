from bson import ObjectId
from fastapi import HTTPException
from database_connection import user_collection, rewards_collection, user_collection
from reward.schemas import RewardSchema
from superuser.reward.dependencies import get_rewards
from dependencies import update_coins_in_db


def my_on_going_rewards(telegram_user_id: str):
    my_data = user_collection.find_one({"telegram_user_id": telegram_user_id})

    if my_data:
        my_level: str = my_data["level_name"].lower()
        my_clan = my_data["clan"]
        my_claimed_rewards = my_data["claimed_rewards"]

        for reward in get_rewards():
            if reward.status == "on_going" and reward.id not in my_claimed_rewards:
                if my_level in reward.beneficiary or \
                    my_clan in reward.beneficiary or \
                    "all_users" in reward.beneficiary or \
                    telegram_user_id in reward.beneficiary:

                    yield RewardSchema(
                        reward_id=reward.id,
                        reward_title=reward.reward_title,
                        reward=reward.reward,
                        reward_image_id=reward.reward_image_id
                        )



def claim_reward(telegram_user_id: str, reward_id: str):
    reward = rewards_collection.find_one({"_id": ObjectId(reward_id)})
    my_data = user_collection.find_one({"telegram_user_id": telegram_user_id})

    if reward:
        if reward_id in my_data["claimed_rewards"]:
            raise HTTPException(status_code=400, detail="Reward already claimed.")
        
        reward_value = reward["reward"]

        # claim reward
        update_coins_in_db(telegram_user_id, reward_value)

        # update claim count
        update_reward = {
            "$inc": {
                "claim_count": 1
            }
        }
        rewards_collection.update_one({"_id": ObjectId(reward_id)}, update_reward)

        # update user claimed rewards
        update_user = {
            "$push": {
                "claimed_rewards": reward_id
            }
        }
        user_collection.update_one({"telegram_user_id": telegram_user_id}, update_user)

        return True

    return False

def my_claimed_rewards(telegram_user_id: str):
    my_data = user_collection.find_one({"telegram_user_id": telegram_user_id})

    if my_data:
        reward_ids = [ObjectId(reward_id) for reward_id in my_data["claimed_rewards"] if ObjectId.is_valid(reward_id)]

        query = {
            "_id": {"$in": reward_ids}
        }

        claim_rewards = rewards_collection.find(query)

        for reward in claim_rewards:
            yield RewardSchema(
                reward_id=str(reward["_id"]),
                reward_title=reward["reward_title"],
                reward=reward["reward"],
                reward_image_id=reward["reward_image_id"]
                )
