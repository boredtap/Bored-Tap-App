from datetime import datetime
from pydantic import BaseModel, AnyHttpUrl, Field
from earn.schemas import StreakData
from user_reg_and_prof_mngmnt.models import Clan, InviteeData
from superuser.security.models import SuspendDetails


class Token(BaseModel):
    """
    Token model for storing access token information.

    Attributes:
        access_token (str): The access token string.
        token_type (str): The type of the token.
    """
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """
    TokenData model for storing Telegram user ID.

    Attributes:
        telegram_user_id (str): The Telegram user ID.
    """
    telegram_user_id: str

class Signup(BaseModel):
    """
    Signup model to accept and validate user signup information.

    Attributes:
        telegram_user_id (str): The Telegram user ID.
        username (str): The username of the user.
        image_url (AnyHttpUrl): The URL of the user's profile image.
    """
    telegram_user_id: str
    username: str
    image_url: AnyHttpUrl


class Update(BaseModel):
    """
    Update model for storing user update information.

    Attributes:
        telegram_user_id (str): The Telegram user ID.
        total_coins (int): The total number of coins the user has.
        level (int): The level of the user.
    """
    telegram_user_id: str
    total_coins: int
    level: int

class Invites(BaseModel):
    inviter_telegram_id: str
    invitees: list[str]

class BasicProfile(BaseModel):
    id: str
    telegram_user_id: str
    username: str | None = None
    firstname: str | None = None
    image_url: AnyHttpUrl | str
    total_coins: int | None = 0
    power_limit: int | None = 1000
    last_active_time: datetime | None = None
    auto_bot_active: bool = False
    level: int | None = 1
    level_name: str | None = "Novice"
    referral_url: str | None = None
    is_active: bool

class UserProfile(
        BasicProfile
    ):
    streak: StreakData = Field(default_factory=StreakData)
    invite: list[InviteeData] | None = []
    clan: Clan = Field(default_factory=Clan)


class SuspendedUser(BasicProfile, SuspendDetails):
    pass