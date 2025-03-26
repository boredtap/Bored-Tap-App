from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from superuser.security.schemas import UserStatus
from superuser.security.dependencies import (
    resume_user,
    suspend_user as suspend_user_func,
    ban_user
)
from superuser.dashboard.admin_auth import get_current_admin
from user_reg_and_prof_mngmnt.user_authentication import get_current_user



securityApp = APIRouter(
    prefix="/admin/security",
    tags=["Admin Panel Security"],
    # responses={404: {"description": "Not found"}},
    dependencies=[Depends(get_current_admin)]
)


@securityApp.put("/suspend_user/{user_id}")
async def suspend_user(user: UserStatus = Depends(UserStatus)):
    """
    Suspends, bans, or resumes a user based on the `user.status` value.

    Args:
        user (UserStatus): A UserStatus object containing the user ID and status to apply.

    Raises:
        HTTPException: If the provided end date is invalid or not provided when suspending a user.

    Returns:
        dict: A dictionary containing a success message and the updated user status.
    """
    
    match user.status:
        case "suspend":
            if not user.end_date:
                raise HTTPException(status_code=400, detail="End date is required.")
            suspended = suspend_user_func(user_id=user.user_id, end_date=user.end_date, reason=user.reason)

            return suspended
        
        case "ban":
            banned_user = ban_user(user_id=user.user_id)

            return banned_user
        
        case "resume":
            resume_response = resume_user(user_id=user.user_id)

            return resume_response

