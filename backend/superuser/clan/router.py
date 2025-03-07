from fastapi import APIRouter, Depends, Query
from superuser.clan.dependencies import (
    get_clans as get_clans_func
)
from superuser.clan.schemas import ClanCategories
from superuser.dashboard.admin_auth import get_current_admin


clan_router = APIRouter(
    prefix="/admin/clan",
    tags=["Admin Panel Clan"],
    # responses={404: {"description": "Not found"}},
    dependencies=[Depends(get_current_admin)]
)


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

