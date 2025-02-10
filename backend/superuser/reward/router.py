from io import BytesIO
from PIL import Image
from bson import Binary
from fastapi import HTTPException
from typing import Optional
from fastapi import APIRouter, Depends
from h11 import Request
from superuser.dashboard.admin_auth import get_current_admin
from superuser.reward.dependencies import (
    create_reward as create_reward_func,
    update_reward as update_reward_func,
    delete_reward as delete_reward_func,
    get_rewards as get_rewards_func
)
from superuser.reward.models import RewardsModelResponse
from superuser.reward.schemas import Beneficiary, CreateReward, Level



rewardApp = APIRouter(
    prefix="/admin/reward",
    tags=["Admin Panel Reward"],
    # responses={404: {"description": "Not found"}},
    dependencies=[Depends(get_current_admin)]
)


# ------------------------------ IMG TO BINARY ------------------------------ #
def img_to_binary(img_upload_content):
    try:
        img_bytes = BytesIO(img_upload_content)
        img = Image.open(img_bytes)
        img.verify()
        img.close()
        img_bytes.seek(0)
        img_data = img_bytes.getvalue()
        binary_img = Binary(img_data)
        return binary_img
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid image file. Please upload a valid image file.")

# ------------------------------- BYTES TO BINARY ------------------------------ #
# def bytes_to_binary(bytes_data):
#     binary_str = bin(int.from_bytes(bytes_data, "big"))[2:]
#     return binary_str


# ------------------------------ CREATE REWARD ------------------------------ #
@rewardApp.post("/create_reward", status_code=201)
async def create_reward(
        clan: list[str] | None = None,
        level: list[str] | None = None,
        specific_users: list[str] | None = None,
        new_reward = Depends(CreateReward)
    ) -> RewardsModelResponse:
    if new_reward.reward_image is None:
        raise HTTPException(status_code=400, detail="Please upload a reward image.")

    try:
        image_content = await new_reward.reward_image.read()
        binary_img = img_to_binary(image_content)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid image file. Please upload a valid image file.")

    if new_reward.beneficiary == "all_users":
        new_reward.beneficiary = ["all_users"]

    if new_reward.beneficiary == "level" and len(level) > 0:
        new_reward.beneficiary = level
    
    if new_reward.beneficiary == "clan" and len(clan) > 0:
        new_reward.beneficiary = clan

    if new_reward.beneficiary == "specific_users" and len(specific_users) > 0:
        new_reward.beneficiary = specific_users

    created_reward = create_reward_func(new_reward, binary_img)

    return created_reward
    


# ------------------------------ UPDATE REWARD ------------------------------ #
@rewardApp.put("/update_reward", status_code=201)
async def update_reward(
        reward_id: str,
        clan: list[str] | None = None,
        level: list[str] | None = None,
        specific_users: list[str] | None = None,
        reward_update = Depends(CreateReward)
    ) -> RewardsModelResponse:
    # check incoming upload image type whether it is image or bytes
    try:
        image_content = await reward_update.reward_image.read()
        binary_img = img_to_binary(image_content)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid image file. Please upload a valid image file.")


    if reward_update.beneficiary == "all_users":
        reward_update.beneficiary = ["all_users"]

    if reward_update.beneficiary == "level" and len(level) > 0:
        reward_update.beneficiary = level

    if reward_update.beneficiary == "clan" and len(clan) > 0:
        reward_update.beneficiary = clan

    if reward_update.beneficiary == "specific_users" and len(specific_users) > 0:
        reward_update.beneficiary = specific_users
    
    updated_reward = update_reward_func(reward_update, binary_img, reward_id)

    return updated_reward



# ------------------------------ DELETE REWARD ------------------------------ #
@rewardApp.delete("/delete_reward", status_code=201)
async def delete_reward(reward_id: str):
    deleted = delete_reward_func(reward_id)

    if deleted:
        return {"message": "Reward deleted successfully."}

    return {"message": "Reward not found/Invalid reward id."}


# ------------------------------ GET ALL REWARDS ------------------------------ #
@rewardApp.get("/get_rewards", status_code=201)
async def get_rewards():
    return get_rewards_func()


# ------------------------------ GET REWARD BY STATUS ------------------------------ #
@rewardApp.get("/get_reward_by_status", status_code=201, deprecated=True)
async def get_reward_by_status():
    pass


# ------------------------------ GET REWARD BY BENEFICARY ------------------------------ #
@rewardApp.get("/get_reward_by_beneficiary", status_code=201, deprecated=True)
async def get_reward_by_beneficiary():
    pass


# ------------------------------ GET REWARD BY ID ------------------------------ #
@rewardApp.get("/get_reward_by_id", status_code=201, deprecated=True)
async def get_reward_by_id():
    pass


# ------------------------------ GET REWARD BY DATE ------------------------------ #
@rewardApp.get("/get_reward_by_date", status_code=201, deprecated=True)
async def get_reward_by_date():
    pass
