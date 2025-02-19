from fastapi import APIRouter, Depends
from superuser.dashboard.admin_auth import get_current_admin
from superuser.boost.schemas import CreateExtraBoost, UpdateUpgradeCost
from superuser.boost.models import ExtraBoostModelResponse
from superuser.boost.dependencies import (
    create_extra_boost as create_extra_boost_func,
    update_upgrade_cost as update_upgrade_cost_func,
    get_extra_boosters as get_extra_boosters_func,
    delete_extra_boost as delete_extra_boost_func
)


boostApp = APIRouter(
    prefix="/admin/boost",
    tags=["Admin Panel Boost"],
    # responses={404: {"description": "Not found"}},
    dependencies=[Depends(get_current_admin)]
)


@boostApp.post("/create_extra_boost")
async def create_extra_boost(eboost: CreateExtraBoost = Depends(CreateExtraBoost)) -> ExtraBoostModelResponse:

    extra_boost = create_extra_boost_func(eboost)

    return extra_boost


@boostApp.get("/extra_boosters")
async def get_extra_boosters():

    return get_extra_boosters_func()


@boostApp.put("/edit_upgrade_cost")
async def update_upgrade_cost(upgrade: UpdateUpgradeCost = Depends(UpdateUpgradeCost)):

    return update_upgrade_cost_func(upgrade)


@boostApp.delete("/extra_booster")
async def delete_extra_boost(extra_boost_id: str):
    
    deleted = delete_extra_boost_func(extra_boost_id)

    if deleted:
        return {"message": "extra booster deleted successfully"}