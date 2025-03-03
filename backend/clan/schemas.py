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
    rank: int
    total_coin: int
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
