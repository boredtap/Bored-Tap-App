from datetime import datetime
from email.mime import image
from bson import ObjectId
from fastapi import HTTPException
from database_connection import clans_collection, user_collection
from superuser.clan.schemas import AlterClanStatus, ClanCategories, ClanProfile


# ----------------------------- GET CLANS ------------------------------ #
def get_clans(category: ClanCategories, skip: int, page_size: int):
    """
    Fetches a list of clans based on the given category and pagination parameters.

    Args:
        category (ClanCategories): The category of clans to fetch.
        skip (int): The number of documents to skip in the result set.
        page_size (int): The maximum number of documents to return in the result set.

    Yields:
        ClanProfile: A ClanProfile object representing the fetched clan.
    """
    if category == ClanCategories.ALL_CLANS:
        clans = clans_collection.find({}).skip(skip).limit(page_size)

    if category == ClanCategories.ACTIVE:
        clans = clans_collection.find({"status": "active"}).skip(skip).limit(page_size)

    if category == ClanCategories.PENDING:
        clans = clans_collection.find({"status": "pending"}).skip(skip).limit(page_size)

    if category == ClanCategories.DISBANDED:
        clans = clans_collection.find({"status": "disbanded"}).skip(skip).limit(page_size)

    for clan in clans:
        clan_data = ClanProfile(
            id=str(clan["_id"]),
            name=clan["name"],
            status=clan["status"],
            rank=f"#{clan['rank']}",
            creator=clan["creator"],
            coins_earned=clan["total_coins"],
            members=clan["members"],
            created_at=clan["created_at"],
            image_id=clan["image_id"]
        )

        yield clan_data


# ------------------------------- CLAN PROFILE -------------------------------- #
def get_clan_profile(clan_id: str):
    clan = clans_collection.find_one({"_id": ObjectId(clan_id)})

    if not clan:
        raise HTTPException(status_code=404, detail="Clan not found/Invalid clan id.")
    
    # date_created_str = clan["created_at"]
    # date_created = datetime.strptime(date_created_str, '%Y-%m-%d %H:%M:%S')
    creator = user_collection.find_one({"telegram_user_id": clan["creator"]})["username"]
    clan_profile = ClanProfile(
        id=str(clan["_id"]),
        name=clan["name"],
        status=clan["status"],
        rank=f"#{clan['rank']}",
        creator=creator,
        coins_earned=clan["total_coins"],
        members=clan["members"],
        created_at=clan["created_at"],
        image_id=clan["image_id"]
    )

    return clan_profile


# ------------------------------- ALTER CLAN STATUS -------------------------------- #
def alter_clan_status(clan_id: str, action: AlterClanStatus):
    clan = clans_collection.find_one({"_id": ObjectId(clan_id)})
    if not action:
        raise HTTPException(status_code=400, detai="please enter the status you want to alter.")

    if not clan:
        raise HTTPException(status_code=404, detail="Clan not found/Invalid clan id.")

    clan_name = clan["name"]
    query = {"_id": ObjectId(clan_id)}

    # ------------------ approve or resume clan ------------------ #
    if action == AlterClanStatus.APPROVE or action == AlterClanStatus.RESUME:
        approve_action = clans_collection.update_one(
            query,
            {"$set": {"status": "active"}}
        )

        if approve_action.modified_count == 1:
            return {
                "status": "success",
                "message": f"Clan {clan_name} has been successfully {action}."
            }

    # ------------------ disband clan ------------------ #
    if action == AlterClanStatus.DISBAND:
        disband_action = clans_collection.update_one(
            query,
            {"$set": {"status": AlterClanStatus.DISBAND}}
        )

        if disband_action.modified_count == 1:
            return {
                "status": "success",
                "message": f"Clan {clan_name} has been successfully disbanded."
            }

