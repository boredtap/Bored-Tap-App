from datetime import datetime, timezone
from fastapi import HTTPException
from superuser.security.models import SuspendDetails
from database_connection import user_collection


def suspend_user(user_id: str, end_date: datetime, reason: str = None):
    """
    Suspend a user.

    Args:
        user_id (str): The user ID of the user to suspend.
        end_date (datetime): The date and time when the user is to be unsuspended.
        reason (str, optional): The reason for the suspension.

    Raises:
        HTTPException: If the user is already suspended.

    Returns:
        dict: A response with a message of the form "User, {user_id} suspended successfully."
    """
    user = user_collection.find_one({"telegram_user_id": user_id})

    if user["is_active"] == False:
        raise HTTPException(status_code=400, detail="User already suspended.")

    if user:
        # make user inactive
        update = user_collection.update_one(
            {"telegram_user_id": user_id},
            {"$set": {"is_active": False}}
        )

        if not update.acknowledged:
            raise HTTPException(status_code=400, detail="User suspension failed.")
        
        if update.acknowledged:
            # create new field in user profile: suspend_details
            end_date = end_date.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=timezone.utc)
            suspend_details = SuspendDetails(
                start_date=datetime.now(timezone.utc),
                end_date=end_date,
                reason=reason
                # remaining_time=
            )

            suspend_info = user_collection.update_one(
                {"telegram_user_id": user_id},
                {"$set": {
                        "suspend_details": suspend_details.model_dump()
                    }
                }
            )

            if not suspend_info.acknowledged:
                update = user_collection.update_one(
                    {"telegram_user_id": user_id},
                    {"$set": {"is_active": True}}
                )
                raise HTTPException(status_code=400, detail="User suspension failed.")

            return {"message": f"User, {user_id} suspended successfully."}


def ban_user(user_id: str):
    user = user_collection.find_one({"telegram_user_id": user_id})

    if not user:
        raise HTTPException(status_code=400, detail="User not found.")

    try:
        if user["banned"] == True:
            raise HTTPException(status_code=400, detail="User already banned.")
    except KeyError:
        pass


    # make user inactive if active or
    # remove suspend_details field from user profile if user is suspended, then ban user
    if user["is_active"] == True:
        update = user_collection.update_one(
            {"telegram_user_id": user_id},
            {
                "$set": {
                    "is_active": False,
                    "banned": True
                }
            },
            upsert=True
        )
    else:
        update = user_collection.update_one(
            {"telegram_user_id": user_id},
            {
                "$set": {
                    "banned": True
                },
                "$unset": {
                    "suspend_details": ""
                }
            },
            upsert=True
        )


    if not update.acknowledged:
        raise HTTPException(status_code=400, detail="User ban failed.")
    
    if update.acknowledged:
        return {"message": f"User, {user_id} banned successfully."}
