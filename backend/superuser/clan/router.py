from fastapi import APIRouter, Depends, Query
from clan.dependencies import clan_top_earners as clan_top_earners_func
from superuser.clan.dependencies import (
    get_clans as get_clans_func,
    get_clan_profile as get_clan_profile_func,
    alter_clan_status as alter_clan_status_func,
    get_clan_profile_image as get_clan_profile_image_func
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
@clan_router.get("/get_clan/{clan_id}/image")
async def get_clan_profile_image(image_id: str):

    return get_clan_profile_image_func(image_id)


# ----------------------------- CLAN PROFILE ------------------------------ #
@clan_router.get("/get_clan/{clan_id}")
async def get_clan_profile(clan_id: str):
    """
    Retrieves the profile of a clan based on the provided clan ID.

    Args:
        clan_id (str): The ID of the clan to retrieve the profile for.

    Returns:
        ClanProfile: A ClanProfile object containing the details of the clan.
    """
    profile = get_clan_profile_func(clan_id)

    return profile


# ----------------------------- ALTER CLAN STATUS ------------------------------ #
@clan_router.post("/alter_clan_status/{clan_id}")
async def alter_clan_status(alter_action: AlterClanStatus, clan_id: str):
    """
    Alters the status of a clan based on the given action.

    Args:
        alter_action (AlterClanStatus): The action (approve, disband, or resume) to apply to the clan's status.
        clan_id (str): The ID of the clan whose status is to be altered.

    Returns:
        dict: A dictionary containing the status and message of the operation.
    """
    response = alter_clan_status_func(clan_id, alter_action)

    return response


# ------------------------------- CLAN TOP EARNERS -------------------------------- #
@clan_router.get("/clan/{clan_id}/top_earner")
async def clan_top_earners(
    clan_id: str,
    page_number: int = Query(1, description="Page number"),
    page_size: int = Query(20, description="Page size/maximum number of results")
):
    """
    Fetches a list of top earners for the given clan.

    Args:
        clan_id (str): The ID of the clan to fetch top earners for.
        page_number (int, optional): Page number. Defaults to 1.
        page_size (int, optional): Page size. Defaults to 20 top earners per page.

    Returns:
        list[ClanTopEarners]: A list of ClanTopEarners objects representing the top earners of the given clan.
    """
    skip_value = (page_number -1) * page_size
    
    return clan_top_earners_func(clan_id, page_size, skip_value)