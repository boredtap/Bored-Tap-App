from enum import Enum
from pydantic import BaseModel


class AdminRoleEnum(str, Enum):
    super_admin="super_admin"
    assistant="assistant"

class AdminProfile(BaseModel):
    username: str
    hashed_password: str
    role: AdminRoleEnum
    is_admin: bool = True