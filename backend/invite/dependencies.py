from io import BytesIO
import segno
from user_reg_and_prof_mngmnt.schemas import BasicProfile
from .schemas import Invitee
from database_connection import user_collection, invites_ref


def generate_qr_code(data: str):
    image_buffer = BytesIO()

    qrcode = segno.make_qr(data)
    qrcode.save(
        image_buffer,
        kind="png",
        scale=5,
        border=3,
        # light="cyan",
        # dark="darkblue"
    )

    image_buffer.seek(0)
    return image_buffer


def get_user_by_id(telegram_user_id: str) -> BasicProfile:
    """
    Retrieve a user by their telegram user ID.

    Args:
        telegram_user_id (str): The telegram user ID of the user to retrieve.

    Returns:
        BasicProfile: The user data if found, otherwise None.
    """
    user = user_collection.find_one({"telegram_user_id": telegram_user_id})

    if user:
        user_data: dict = BasicProfile(
            telegram_user_id=user.get("telegram_user_id", None),
            username=user.get("username", None),
            firstname=user.get("firstname", None),
            image_url=user.get("image_url", None),
            level=user.get("level", None),
            total_coins=user.get("total_coins", None),
            referral_url=user.get("referral_url", None),
            is_active=user.get("is_active", None)
        )
        return user_data
    return None


def get_user_invitees(telegram_user_id: str) -> list[Invitee] | list:
    """
    Retrieve a user by their telegram user ID.

    Args:
        telegram_user_id (str): The telegram user ID of the user to retrieve.

    Returns:
        BasicProfile: The user data if found, otherwise None.
    """
    user_invitees_ref = invites_ref.find_one({'inviter_telegram_id': telegram_user_id})
    invitees: list[Invitee] = []
    
    if user_invitees_ref:
        invitees_ref: list[str] = user_invitees_ref["invitees"]

        for id in invitees_ref:
            invitee: dict = user_collection.find_one({"telegram_user_id": id})
            if invitee:
                invitee_data = Invitee(
                    telegram_user_id=id,
                    username=invitee.get("username"),
                    level=invitee.get("level"),
                    image_url=invitee.get("image_url", None),
                    total_coins=invitee.get("total_coins")
                )
                invitees.append(invitee_data)
    return invitees
