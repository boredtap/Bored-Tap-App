import re
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from clan.schemas import CreateClan, ClanSearchResponse, CreatorExitAction
from user_reg_and_prof_mngmnt.user_authentication import get_current_user
from clan.dependencies import (
    my_eligible_members as my_eligible_members_func,
    create_clan as create_clan_func,
    join_clan as join_clan_func,
    all_clans as all_clans_func,
    next_potential_clan_leader,
    run_clan_earnings,
    top_clans as top_clans_func,
    my_clan as my_clan_func,
    clan_top_earners as clan_top_earners_func,
    exit_clan as exit_clan_func
)
from database_connection import clans_collection, user_collection



user_clan_router = APIRouter(
    prefix="/user/clan",
    tags=["Clan"],
    # responses={404: {"description": "Not found"}},
    dependencies=[Depends(get_current_user), Depends(run_clan_earnings)]
)


# ----------------------------- ELIGIBLE CLAN MEMBERS ------------------------------ #
@user_clan_router.get("/my_eligible_members")
async def my_eligible_members(telegram_user_id: Annotated[str, Depends(get_current_user)]):
    
    return my_eligible_members_func(telegram_user_id)


# ----------------------------- CREATE CLAN ------------------------------ #
@user_clan_router.post("/create_clan")
async def create_clan(
    clan: Annotated[CreateClan, Depends(CreateClan)],
    telegram_user_id: Annotated[str, Depends(get_current_user)]
):
    response = create_clan_func(telegram_user_id, clan)

    return response


# ----------------------------- ALL CLANS ------------------------------ #
@user_clan_router.get("/all_clans")
async def all_clans():
    all_active_clans = all_clans_func()

    return all_active_clans


# ----------------------------- TOP CLANS ------------------------------ #
@user_clan_router.get("/top_clans")
async def top_clans():
    
    return top_clans_func()


# ----------------------------- SEARCH CLANS ------------------------------ #
@user_clan_router.get("/search")
async def search_clans(
    query: str = Query(..., description="Search query"),
    page_size: int = Query(10, description="Page size/maximum number of results"),
    page_number: int = Query(1, description="Page number"),
):
    """
    Search for clans by name.

    Args:
        query (str): The search query to match against clan names.
        page_size (int): The maximum number of results to return.
        page_number (int): The index of the page to retrieve.

    Returns:
        StreamingResponse: A json response containing the search results.
    """
    skip = (page_number - 1) * page_size
    search_filter = {}

    if query:
        # Use a case-insensitive regex search for partial matches
        search_filter["name"] = {"$regex": query, "$options": "i"}

    clans = clans_collection.find(search_filter).sort("total_coins", -1).skip(skip).limit(page_size)

    for clan in clans:
        if clan["status"] == "active":

            return StreamingResponse(
                ClanSearchResponse(
                    id=str(clan["_id"]),
                    name=clan["name"],
                    rank=f"#{clan['rank']}",
                    total_coins=clan["total_coins"],
                    image_id=clan["image_id"],
                    members=clan["members"]
                ).model_dump_json(),
                media_type="application/json"
            )


# ----------------------------- JOIN CLAN ------------------------------ #
@user_clan_router.post("/join_clan")
async def join_clan(
    clan_id: str,
    telegram_user_id: Annotated[str, Depends(get_current_user)]
):
    response = join_clan_func(telegram_user_id, clan_id)

    return response


# ----------------------------- MY CLAN ------------------------------ #
@user_clan_router.get("/my_clan")
async def my_clan(telegram_user_id: Annotated[str, Depends(get_current_user)]):
    clan = my_clan_func(telegram_user_id)

    return clan


# ----------------------------- INVITE MEMBERS TO CLAN ------------------------------ #
@user_clan_router.post("/invite_members", deprecated=True)
async def invite_members_to_clan(telegram_user_id: Annotated[str, Depends(get_current_user)]):
    pass


# ----------------------------- CLAN LEADERSHIP TRANSFER CANDIDATE ------------------------------ #
@user_clan_router.get("/clan/{clan_id}/leadership_transfer_candidate")
async def clan_leadership_transfer_candidate(clan_id: str):

    return next_potential_clan_leader(clan_id)


# ----------------------------- EXIT CLAN ------------------------------ #
@user_clan_router.post("/exit_clan")
async def exit_clan(telegram_user_id: Annotated[str, Depends(get_current_user)], creator_exit_action: CreatorExitAction | None = None):
    leave_clan = exit_clan_func(telegram_user_id, creator_exit_action)

    return leave_clan


# ----------------------------- CLAN TOP EARNERS ------------------------------ #
@user_clan_router.get("/clan/{clan_id}/top_earners")
async def clan_top_earners(
    clan_id: str,
    page_number: int = Query(1, description="Page number"),
    page_size: int = Query(10, description="Page size/maximum number of results"),
):
    skip_value = (page_number -1) * page_size
    
    return clan_top_earners_func(clan_id, page_size, skip_value)

