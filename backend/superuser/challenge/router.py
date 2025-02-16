from datetime import date
from enum import verify
from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException
from superuser.challenge.models import ChallengeModelResponse
from superuser.challenge.schemas import ChallengeStatus, CreateChallenge
from superuser.challenge.dependencies import (
    create_challenge as create_challenge_func,
    update_challenge as update_challenge_func,
    get_challenge_image as get_challenge_image_func,
    get_challenges as get_challenges_func,
    get_challenge_by_id as get_challenge_by_id_func,
    get_challenge_by_date as get_challenge_by_date_func,
    delete_challenge as delete_challenge_func
)
from superuser.dashboard.admin_auth import get_current_admin
from superuser.challenge.dependencies import verify_participants



challenge_router = APIRouter(
    prefix="/admin/challenge",
    tags=["Admin Panel Challenge"],
    # responses={404: {"description": "Not found"}},
    dependencies=[Depends(get_current_admin)]
)



# ------------------------------ VERIFY IMAGE ------------------------------ #
def verify_image(format: str):
    if format.lower() not in ["jpeg", "jpg", "png"]:
        raise HTTPException(status_code=400, detail="Invalid image file. Please upload a valid image file.")
    
    return True


# --------------------------------- CREATE CHALLENGE --------------------------------- #
@challenge_router.post("/create_challenge", status_code=201, response_model=ChallengeModelResponse)
async def create_challenge(
    clan: list[str] | None = None,
    level: list[str] | None = None,
    specific_users: list[str] | None = None,
    challenge: CreateChallenge = Depends(CreateChallenge)
) -> ChallengeModelResponse:
    """
    Creates a new challenge in the system.

    Args:
        clan (list[str] | None, optional): List of clan IDs participating in the challenge.
        level (list[str] | None, optional): List of level IDs participating in the challenge.
        specific_users (list[str] | None, optional): List of specific user IDs participating in the challenge.
        challenge (CreateChallenge, optional): The challenge data being created.

    Raises:
        HTTPException: If the challenge image is not provided or if the image format is invalid.

    Returns:
        ChallengeModelResponse: The response model containing the details of the created challenge.
    """

    if not challenge.image:
        raise HTTPException(status_code=400, detail="Please upload a challenge image.")

    image_filename = challenge.image.filename
    image_format = image_filename.split(".")[1]
    image_bytes = await challenge.image.read()

    verify_image(image_format)

    verify_participants(challenge, clan, level, specific_users)

    created_challenge = create_challenge_func(challenge, image_bytes, image_filename)

    return created_challenge


# --------------------------------- UPDATE CHALLENGE --------------------------------- #
@challenge_router.put("/update_challenge")
async def update_challenge(
    challenge_id: str,
    clan: list[str] | None = None,
    level: list[str] | None = None,
    specific_users: list[str] | None = None,
    challenge: CreateChallenge = Depends(CreateChallenge)
):
    try:
        img_name = challenge.image.filename
        img_format = img_name.split(".")[1]
        image_bytes = await challenge.image.read()
        
        if verify_image(img_format):
            image_buffer = BytesIO(image_bytes)
            image_buffer.seek(0)

        verify_participants(challenge, clan, level, specific_users)

        updated_challenge = update_challenge_func(challenge_id, challenge, image_bytes, img_name, )

        return updated_challenge
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    

# --------------------------------- GET CHALLENGE IMAGE --------------------------------- #
@challenge_router.get("/get_challenge_image/{challenge_id}")
async def get_challenge_image(image_id: str) -> bytes:
    image = get_challenge_image_func(image_id)

    return image


# --------------------------------- GET ALL CHALLENGES --------------------------------- #
@challenge_router.get("/get_challenges", response_model=list[ChallengeModelResponse])
async def get_challenges(status: ChallengeStatus) -> list[ChallengeModelResponse]:
    all_challenges = get_challenges_func(status)

    return all_challenges


# --------------------------------- GET CHALLENGE BY ID --------------------------------- #
@challenge_router.get("/get_challenge_by_id/{challenge_id}", response_model=ChallengeModelResponse)
async def get_challenge_by_id(challenge_id: str) -> ChallengeModelResponse:
    challenge = get_challenge_by_id_func(challenge_id)

    return challenge


# --------------------------------- GET CHALLENGE BY DATE --------------------------------- #
@challenge_router.get("/get_challenge_by_date", response_model=ChallengeModelResponse, deprecated=True)
async def get_challenge_by_date(date: date) -> ChallengeModelResponse:
    challenge = get_challenge_by_date_func(date)

    return challenge



# --------------------------------- DELETE CHALLENGE --------------------------------- #
@challenge_router.delete("/delete_challenge/{challenge_id}")
async def delete_challenge(challenge_id: str):
    deleted = delete_challenge_func(challenge_id)

    if not deleted:
        raise HTTPException(status_code=400, detail="Challenge deletion failed.")

    return {
            "message": "Challenge deleted successfully."
        }

