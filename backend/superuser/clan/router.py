from fastapi import APIRouter, Depends, Query
from superuser.clan.dependencies import (
    get_clans as get_clans_func,
    get_clan_profile as get_clan_profile_func,
    alter_clan_status as alter_clan_status_func
)
from superuser.clan.schemas import AlterClanStatus, ClanCategories
from superuser.dashboard.admin_auth import get_current_admin


clan_router = APIRouter(
    prefix="/admin/clan",
    tags=["Admin Panel Clan"],
    # responses={404: {"description": "Not found"}},
    dependencies=[Depends(get_current_admin)]
)


# ----------------------------- GET CLANS ------------------------------ #
@clan_router.get("/get_clans")
async def get_clans(
    category: ClanCategories,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    ):

    """
    Fetches a list of clans based on the given category and pagination parameters.

    Args:
        category (ClanCategories): The category of clans to fetch.
        page (int, optional): Page number. Defaults to 1.
        page_size (int, optional): Page size. Defaults to 20 clans per page.

    Returns:
        list[ClanProfile]: A list of ClanProfile objects representing the fetched clans.
    """
    skip = (page - 1) * page_size
    response = get_clans_func(category, skip, page_size)

    return list(response)


# ----------------------------- CLAN PROFILE ------------------------------ #
@clan_router.get("/get_clan/{clan_id}")
async def get_clan_profile(clan_id: str):
    profile = get_clan_profile_func(clan_id)

    return profile


# ----------------------------- ALTER CLAN STATUS ------------------------------ #
@clan_router.post("/alter_clan_status/{clan_id}")
async def alter_clan_status(alter_action: AlterClanStatus, clan_id: str):
    response = alter_clan_status_func(clan_id, alter_action)

    return response
