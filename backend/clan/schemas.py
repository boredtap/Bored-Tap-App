from enum import Enum
from typing import Annotated
from fastapi import Form, UploadFile
from pydantic import BaseModel


class CreateClan(BaseModel):
    name: str
    members: list[str]
    image: Annotated[UploadFile, Form(description="Upload clan image", media_type="multipart/form-data")]


class ClanResponse(BaseModel):
    id: str
    name: str
    rank: str
    total_coins: int
    image_id: str


class ClanSearchResponse(ClanResponse):
    members: int


class MyClan(BaseModel):
    name: str
    rank: str
    image_id: str
    in_clan_rank: str
    total_coins: int
    members: int


class CreatorExitAction(str, Enum):
    TRANSFER = "transfer"
    CLOSE = "close"

    def __repr__(self) -> str:
        return self.value
