from fastapi import APIRouter, Depends
from user_reg_and_prof_mngmnt.user_authentication import get_current_user
from boosts.dependencies import (
    my_extra_boosters as my_extra_boosters_func
)



userExtraBoostApp = APIRouter(
    prefix="/user/boost",
    tags=["User Boosts"],
    # responses={404: {"description": "Not found"}},
    dependencies=[Depends(get_current_user)]
)


# ----------------------------- GET MY EXTRA BOOSTS ------------------------------ #
@userExtraBoostApp.get("/extra_boosters")
async def my_extra_boosters(telegram_user_id: str = Depends(get_current_user)):

    return my_extra_boosters_func(telegram_user_id)


# ------------------------------- PERFORM UPGRADE --------------------------------- #
@userExtraBoostApp.put("/upgrade")
async def upgrade_extra_boost():
    """
    Does nothing yet, work in progress
    """
    pass
    
