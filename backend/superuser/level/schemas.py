from typing import Annotated
from fastapi import Form, UploadFile
from pydantic import BaseModel


class CreateLevel(BaseModel):
    name: str
    level: int
    requirement: int
    badge: Annotated[UploadFile, Form(description="Upload badge image", media_type="multipart/form-data")]

