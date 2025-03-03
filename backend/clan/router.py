from typing import Annotated, Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from clan.schemas import CreateClan, ClanSearchResponse
from user_reg_and_prof_mngmnt.user_authentication import get_current_user
from clan.dependencies import (
    create_clan as create_clan_func,
    top_clans as top_clans_func,
    join_clan as join_clan_func,
    my_clan as my_clan_func,
)
from database_connection import clans_collection, user_collection



user_clan_router = APIRouter(
    prefix="/user/clan",
    tags=["Clan"],
    # responses={404: {"description": "Not found"}},
    dependencies=[Depends(get_current_user)]
)


# ----------------------------- CREATE CLAN ------------------------------ #
@user_clan_router.post("/create_clan", deprecated=True)
async def create_clan(
    clan: Annotated[CreateClan, Depends(CreateClan)],
    telegram_user_id: Annotated[str, Depends(get_current_user)]
):
    response = create_clan_func(telegram_user_id, clan)

    return response


# ----------------------------- TOP CLANS ------------------------------ #
@user_clan_router.get("/top_clans")
async def top_clans():
    
    return top_clans_func()


# ----------------------------- SEARCH CLANS ------------------------------ #
@user_clan_router.get("/search")
async def search_clans(
    query: str = Query(..., description="Search query"),
    limit: int = Query(10, description="Maximum number of results"),
    skip: int = Query(0, description="Number of results to skip"),
):
    """
    Search for clans by name.

    Args:
        query (str): The search query to match against clan names.
        limit (int): The maximum number of results to return.
        skip (int): The number of results to skip.

    Returns:
        StreamingResponse: A json response containing the search results.
    """
    search_filter = {}

    if query:
        # Use a case-insensitive regex search for partial matches
        search_filter["name"] = {"$regex": query, "$options": "i"}

    clans = clans_collection.find(search_filter).sort("total_coins", -1).skip(skip).limit(limit)

    for clan in clans:
        if clan["status"] == "active":

            return StreamingResponse(
                ClanSearchResponse(
                    id=str(clan["_id"]),
                    name=clan["name"],
                    rank=clan["rank"],
                    total_coin=clan["total_coins"],
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


# ----------------------------- CLAN TOP EARNERS ------------------------------ #
@user_clan_router.get("/clan/top_earners", deprecated=True)
async def clan_top_earners(clan_id: str, limit: Optional[int] = 10):
    pass

