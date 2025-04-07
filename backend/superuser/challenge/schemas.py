from datetime import datetime, timedelta
from enum import Enum
from typing import Annotated
from fastapi import Form, UploadFile
from pydantic import BaseModel


class ParticipantsCategory(str, Enum):
    ALL_USERS = "all_users"
    LEVEL = "level"
    CLAN = "clan"
    SPECIFIC_USERS = "specific_users"

class CreateChallenge(BaseModel):
    name: Annotated[str, Form(description="Challenge name")]
    description: Annotated[str, Form(description="Challenge description")]
    launch_date: Annotated[datetime, Form(description="Launch date")]
    reward: Annotated[int, Form(description="Reward amount")]
    duration: Annotated[str, Form(description="DD:HH:MM:SS")]
    participants: Annotated[ParticipantsCategory, Form(description="Challenge participants")]
    image: Annotated[UploadFile, Form(description="Upload challenge image", media_type="multipart/form-data")]


class ChallengeStatus(str, Enum):
    ONGOING = "ongoing"
    COMPLETED = "completed"
    
    def __repr__(self):
        return self.value
