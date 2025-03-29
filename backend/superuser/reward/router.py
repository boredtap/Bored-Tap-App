from datetime import datetime, timezone
from io import BytesIO
from fastapi import HTTPException
from fastapi import APIRouter, Depends
from superuser.dashboard.admin_auth import get_current_admin
from superuser.reward.dependencies import (
    create_reward as create_reward_func,
    set_datetime_to_utc,
    update_status_of_expired_rewards,
    verify_beneficiaries,
    update_reward as update_reward_func,
    delete_reward as delete_reward_func,
    get_rewards as get_rewards_func,
    get_reward_image as get_reward_image_func,
    get_rewards_by_status as get_reward_by_status_func,
    get_rewards_by_date as get_reward_by_date_func
)
from superuser.reward.models import RewardsModelResponse
from superuser.reward.schemas import CreateReward, Status, UpdateReward
from user_reg_and_prof_mngmnt.user_authentication import get_current_user



rewardApp = APIRouter(
    prefix="/admin/reward",
    tags=["Admin Panel Reward"],
    # responses={404: {"description": "Not found"}},
    dependencies=[Depends(get_current_admin), Depends(update_status_of_expired_rewards)]
)


# ------------------------------ VERIFY IMAGE ------------------------------ #
def verify_image(format: str):
    if format.lower() not in ["jpeg", "jpg", "png"]:
        raise HTTPException(status_code=400, detail="Invalid image file. Please upload a valid image file.")
    
    return True


# ------------------------------ CREATE REWARD ------------------------------ #
@rewardApp.post("/create_reward", status_code=201)
async def create_reward(
        clan: list[str] | None = None,
        level: list[str] | None = None,
        specific_users: list[str] | None = None,
        new_reward: CreateReward = Depends(CreateReward),
    ) -> RewardsModelResponse:
    """
    Creates a new reward in the system.

    Args:
        clan (list[str] | None, optional): List of clan IDs/names participating in the reward.
        level (list[str] | None, optional): List of level name(s) participating in the reward.
        specific_users (list[str] | None, optional): List of specific user IDs/usernames participating in the reward.
        new_reward (CreateReward, optional): The reward data being created.

    Raises:
        HTTPException: If the reward image is not provided or if the image format is invalid.

    Returns:
        RewardsModelResponse: The response model containing the details of the created reward.
    """
    if not new_reward.reward_image:
        raise HTTPException(status_code=400, detail="Please upload a reward image.")

    image_filename = new_reward.reward_image.filename
    image_format = image_filename.split(".")[1]
    image_bytes = await new_reward.reward_image.read()
    
    if verify_image(image_format):
        image_buffer = BytesIO(image_bytes)
        image_buffer.seek(0)

    verify_beneficiaries(new_reward, clan, level, specific_users)

    # set datetime timezone to UTC
    new_reward.expiry_date = set_datetime_to_utc(new_reward.expiry_date)

    created_reward = create_reward_func(new_reward, image_bytes, image_filename)

    return created_reward


# ------------------------------ REWARD IMAGE URL ------------------------------ #
@rewardApp.get("/reward_image/{image_id}", status_code=201)
async def get_reward_image(image_id: str):
    image = get_reward_image_func(image_id)

    return image

# ------------------------------ UPDATE REWARD ------------------------------ #
@rewardApp.put("/update_reward", status_code=201)
async def update_reward(
        reward_id: str,
        clan: list[str] | None = None,
        level: list[str] | None = None,
        specific_users: list[str] | None = None,
        reward_update: UpdateReward = Depends(UpdateReward)
    ) -> RewardsModelResponse:
    # check incoming upload image type whether it is image or bytes
    try:
        img_name = reward_update.reward_image.filename
        image_format = img_name.split(".")[1]
        img_bytes = await reward_update.reward_image.read()
        verify_image(image_format)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid image file. Please upload a valid image file.")

    verify_beneficiaries(reward_update, clan, level, specific_users)
    
    # set datetime timezone to UTC
    reward_update.expiry_date = set_datetime_to_utc(reward_update.expiry_date)

    updated_reward = update_reward_func(reward_update, img_bytes, img_name, reward_id)

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
@rewardApp.get("/get_reward_by_status", status_code=201)
async def get_reward_by_status(status: Status):
    return get_reward_by_status_func(status)


# ------------------------------ GET REWARD BY BENEFICARY ------------------------------ #
@rewardApp.get("/get_reward_by_beneficiary", status_code=201, deprecated=True)
async def get_reward_by_beneficiary():
    pass


# ------------------------------ GET REWARD BY ID ------------------------------ #
# @rewardApp.get("/get_reward_by_id", status_code=201, deprecated=True)
# async def get_reward_by_id():
#     pass


# ------------------------------ GET REWARD BY DATE ------------------------------ #
@rewardApp.get("/get_reward_by_date", status_code=201)
async def get_reward_by_date(date: datetime):
    return get_reward_by_date_func(date)
