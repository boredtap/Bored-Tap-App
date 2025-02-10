from datetime import datetime
from enum import Enum
from typing import Annotated
from fastapi import Form, UploadFile
from pydantic import BaseModel


class Status(str, Enum):
    ONGOING = "on_going"
    CLAIMED = "claimed"

    def __repr__(self):
        return self.value

class Level(str, Enum):
    NOVICE = "novice"
    EXPLORER = "explorer"
    APPRENTICE = "apprentice"
    WARRIOR = "warrior"
    MASTER = "master"
    CHAMPION = "champion"
    TACTICIAN = "tactician"
    SPECIALIST = "specialist"
    CONQUEROR = "conqueror"
    LEGEND = "legend"

    def __repr__(self):
        return self.value


class Beneficiary(str, Enum):
    ALL_USERS = "all_users"
    LEVEL = "level"
    CLAN = "clan"
    SPECIFIC_USERS = "specific_users"

    def __repr__(self):
        return self.value

class CreateReward(BaseModel):
    reward_title: Annotated[str, Form(description="Reward title")]
    reward: Annotated[int, Form(description="Reward amount")]
    launch_date: Annotated[datetime, Form(description="Launch date")]
    beneficiary: Annotated[Beneficiary, Form(description="Beneficiary")]
    reward_image: Annotated[UploadFile | None, Form(description="Upload reward image", media_type="multipart/form-data")] = None


class UpdateReward(CreateReward):
    reward_title: Annotated[str, Form(description="Reward title")]
    reward: Annotated[int, Form(description="Reward amount")]
    launch_date: Annotated[datetime, Form(description="Launch date")]
    beneficiary: Annotated[Beneficiary, Form(description="Beneficiary")]
    reward_image: Annotated[UploadFile | None, Form(description="Upload reward image", media_type="multipart/form-data")] = None

    # @classmethod
    # def __get_validators__(cls):
    #     yield cls.validate_reward_image

    # @classmethod
    # def validate_reward_image(cls, v):
    #     if isinstance(v, dict): # Check if it's a dictionary (from form data)
    #         reward_image_upload = v.get('reward_image_upload')
    #         reward_image_bytes = v.get('reward_image_bytes')

    #         if reward_image_upload and reward_image_bytes:
    #             raise ValueError("Only one of 'reward_image_upload' or 'reward_image_bytes' should be provided.")
    #         elif reward_image_upload:
    #             return {"reward_image": reward_image_upload, "is_upload": True}
    #         elif reward_image_bytes:
    #             return {"reward_image": reward_image_bytes, "is_upload": False}
    #         else: # If none is provided, it means the image is not being updated.
    #             return None # No image update
    #     return v # If it's not a dict, it's probably already validated by pydantic.
