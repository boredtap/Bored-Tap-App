from typing import Annotated
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from .dependencies import get_user_invitees, get_user_by_id
from invite.dependencies import generate_qr_code
from user_reg_and_prof_mngmnt.user_authentication import get_current_user


inviteApp = APIRouter()


@inviteApp.get("/invite-qr-code", tags=["Invite features"])
async def generate_invite_qr_code(telegram_user_id: Annotated[str, Depends(get_current_user)]):
    """This route generates a QR code for users unique invite url."""
    user = get_user_by_id(telegram_user_id)

    if user:
        qrcode = generate_qr_code(user.referral_url+telegram_user_id)

    response = StreamingResponse(qrcode, media_type="image/png")
    response.headers["Content-Disposition"] = "attachment; filename=invite_qr_code.png"
    return response

@inviteApp.get("/invitees", tags=["Invite features"])
async def get_invitees(telegram_user_id: Annotated[str, Depends(get_current_user)]):
    """This route returns a list of users that have been invited by the current user."""
    invitees = get_user_invitees(telegram_user_id)

    return invitees
