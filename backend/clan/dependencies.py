from datetime import datetime
from datetime import timezone
from enum import member
from bson import ObjectId
from fastapi import HTTPException
from database_connection import user_collection, fs, clans_collection
from clan.schemas import CreateClan, ClanResponse, ClanSearchResponse, MyClan
from user_reg_and_prof_mngmnt.models import Clan as UserProfileClan
from superuser.clan.models import Clan, ClanModelResponse



# =----------------------------- VERIFY IMAGE ------------------------------ #
def verify_image(format: str):
    if format.lower() not in ["jpeg", "jpg", "png"]:
        raise HTTPException(status_code=400, detail="Invalid badge file. Please upload a valid badge file.")
    
    return True


# --------------------------------------------- CREATE CLAN --------------------------------------------- #
def create_clan(creator: str, clan: CreateClan):
    """
    Creates a new clan in the system.

    Args:
        creator (str): The telegram user ID of the user creating the clan.
        clan (CreateClan): The clan data being created.

    Raises:
        HTTPException: If the user is not found or if the user is already in a clan.
        HTTPException: If the user does not have enough invites to create a clan.
        HTTPException: If the image format is not valid.

    Returns:
        dict: A dictionary containing the status and message of the operation.
    """
    user: dict = user_collection.find_one({'telegram_user_id': creator})
    user_clan: str = user["clan"]["name"]
    user_invite: list = user["invite"]


    members: list = clan.members[0].split(",")
    if not members:
        members = clan.members

    # members yet to join a clan
    members = [member for member in members if user_collection.find_one({"telegram_user_id": member})["clan"]["name"] == None]
    members.insert(0, creator)

    # # Check if user exists
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user is already in a clan
    if user_clan:
        raise HTTPException(status_code=409, detail="You are already in a clan")

    # check if clan name already exists
    if clans_collection.find_one({"name": clan.name}):
        raise HTTPException(status_code=409, detail="Clan name already exists")

    # Check if user has enough invites    
    if len(user_invite) < 1:
        raise HTTPException(status_code=403, detail="You don't have enough invites to create a clan")

    # process image
    image = clan.image.file.read()
    image_name = clan.image.filename
    image_format = image_name.split(".")[-1]

    if not verify_image(image_format):
        raise HTTPException(status_code=415, detail="Invalid image file. Please upload a valid image file.")

    image_id = fs.put(image, filename="clan_" + image_name)

    new_clan = Clan(
        name=clan.name,
        creator=creator,
        rank=0,
        total_coins=0,
        created_at=datetime.now(timezone.utc),
        # status=Clan.PENDING
        image_id=str(image_id),
        members=0
    )

    created_clan = clans_collection.insert_one(new_clan.model_dump())
    clan_id = str(created_clan.inserted_id)

    if clan_id:
        clan_creation_status = "Clan created successfully"
        # update profile of added members including the creator
        update_members_profile = user_collection.update_many(
            {"telegram_user_id": {"$in": members}},
            {
                "$set": {
                    "clan": UserProfileClan(
                        id=clan_id,
                        name=clan.name
                    ).model_dump()
                }
            }
        )

        # update clan members count
        update_clan_member_count = clans_collection.update_one(
            {"_id": ObjectId(clan_id)},
            {
                "$inc": {
                    "members": update_members_profile.modified_count 
            }}
        )

        if update_clan_member_count.modified_count > 0:
            return {
                "status": True,
                "message": clan_creation_status,
                "clan_id": clan_id,
                "status": "awaiting verification"
            }

    return {
        "status": False, "message": "Failed to create clan"
    }


# --------------------------------- ALL CLANS ---------------------------------- #
def all_clans():
    clans = clans_collection.find().sort("total_coins", -1)

    for clan in clans:
        if clan["status"] == "active":
            yield ClanSearchResponse(
                id=str(clan["_id"]),
                name=clan["name"],
                rank=f"#{clan['rank']}",
                image_id=clan["image_id"],
                total_coins=clan["total_coins"],
                members=clan["members"]
            )


# --------------------------------- TOP CLAN ---------------------------------- #
def top_clans():
    """
    Return the top 10 clans with the most coins.

    Yields:
        dict: A dictionary containing the details of each clan.
    """
    clans = clans_collection.find().sort("total_coins", -1).limit(10)

    for clan in clans:
        if clan["status"] == "active":
            yield ClanSearchResponse(
                    id=str(clan["_id"]),
                    name=clan["name"],
                    rank=f"#{clan['rank']}",
                    total_coins=clan["total_coins"],
                    image_id=clan["image_id"],
                    members=clan["members"]
                )


# ----------------------------------- JOIN CLAN ------------------------------------- #
def join_clan(telegram_user_id: str, clan_id: str):
    clan = clans_collection.find_one({"_id": ObjectId(clan_id)})

    if not clan:
        raise HTTPException(status_code=404, detail="Clan not found")
    
    if clan["status"] == "pending":
        raise HTTPException(status_code=423, detail="Clan is pendind admin's approval")
    
    if clan["status"] == "disband":
        raise HTTPException(status_code=410, detail="Clan has been disbanded")
    
    user_current_clan = user_collection.find_one({"telegram_user_id": telegram_user_id})["clan"]["name"]
    if user_current_clan:
        raise HTTPException(status_code=409, detail="You are already in a clan. Exit current clan to join another clan")

    if clan["status"] == "active":
        clan_name = clan["name"]

        # update user profile
        update_user = user_collection.update_one(
            {"telegram_user_id": telegram_user_id},
            {
                "$set": {
                    "clan": UserProfileClan(
                        id=clan_id,
                        name=clan_name
                    ).model_dump()
                }
            }
        )

        # increment clan member count
        update_clan_member_count = clans_collection.update_one(
            {"_id": ObjectId(clan_id)},
            {
                "$inc": {
                    "members": 1
                }
            }
        )

        if update_user.modified_count > 0 and update_clan_member_count.modified_count > 0:
            return {
                "status": True, "message": "Joined clan successfully"
            }


# --------------------------------- MY CLAN ---------------------------------- #
def my_clan(telegram_user_id):
    user_clan_id = user_collection.find_one({"telegram_user_id": telegram_user_id})["clan"]["id"]
    clan = clans_collection.find_one({"_id": ObjectId(user_clan_id)})
    in_clan_rank = "member"

    if clan["creator"] == telegram_user_id:
        in_clan_rank = "creator"

    return MyClan(
        name=clan["name"],
        rank=f"#{clan['rank']}",
        image_id=clan["image_id"],
        in_clan_rank=in_clan_rank,
        total_coins=clan["total_coins"],
        members=clan["members"]
    )


# --------------------------------- INVITE TO CLAN ---------------------------------- #
def invite_to_clan(telegram_user_id: str, clan_id: str):
    user = user_collection.find_one({"telegram_user_id": telegram_user_id})
    clan = clans_collection.find_one({"_id": ObjectId(clan_id)})

    if user and clan:
        if user["clan"]["id"] == None:
            update_user = user_collection.update_one(
                {"telegram_user_id": telegram_user_id},
                {
                    "$set": {
                        "clan": {
                            "name": clan["name"],
                            "id": clan_id,
                            "rank": "member",
                            "in_clan_rank": "member"
                        }
                    }
                }
            )

            if update_user.modified_count > 0:
                # increment clan member count
                update_clan_member_count = clans_collection.update_one(
                    {"_id": ObjectId(clan_id)},
                    {
                        "$inc": {
                            "members": 1
                        }
                    }
                )

                if update_clan_member_count.modified_count > 0:
                    return {
                        "status": True, "message": "Invited to clan successfully"
                    }


# --------------------------------- EXIT CLAN ---------------------------------- #
def exit_clan(telegram_user_id: str, creator_exit_action: str | None = None):
    user = user_collection.find_one({"telegram_user_id": telegram_user_id})
    clan_id = user["clan"]["id"]

    # check if user is in clan
    if user and clan_id == None:
        raise HTTPException(status_code=404, detail="You need to be in a clan to perform this action")

    # check if clan exists
    clan = clans_collection.find_one({"_id": ObjectId(clan_id)})

    if not clan:
        raise HTTPException(status_code=404, detail="Clan not found")


    # if user is not creator
    # set fields in clan object in user profile to None
    # decrement clan member count
    if clan["creator"] != telegram_user_id:
        # set clan in user profile to none
        update_user = user_collection.update_one(
            {"telegram_user_id": telegram_user_id},
            {
                "$set": {
                    "clan": {
                        "id": None,
                        "name": None,
                    }
                }
            }
        )

        # decrement clan member count
        update_clan_member_count = clans_collection.update_one(
            {"_id": ObjectId(clan_id)},
            {
                "$inc": {
                    "members": -1
                }
            }
        )

        if update_user.modified_count > 0 and update_clan_member_count.modified_count > 0:
            return {
                "status": True, "message": f"Exited clan \"{clan['name']}\" successfully"
        }


    # if user is the creator of the clan
    # transfer clan ownership to next top member or close clan completely
    if clan["creator"] == telegram_user_id:
        # if exit action is none, raise error
        if not creator_exit_action:
            raise HTTPException(status_code=400, detail="You need to specify an exit action: transfer or close clan")


        # transfer ownership to next top member
        if creator_exit_action.lower() == "transfer":
            return {
                "status": "Ownership transfer feature coming soon 😊"
            }


        # close clan completely
        if creator_exit_action.lower() == "close":
            # set fields in clan object of members to none
            remove_all_members = user_collection.update_many(
                {"clan.id": clan_id},
                {
                    "$set": {
                        "clan": {
                            "id": None,
                            "name": None,
                        }
                    }
                }
            )

            # delete clan image
            image_id = clan["image_id"]
            fs.delete(ObjectId(image_id))

            # delete clan
            delete_clan = clans_collection.delete_one({"_id": ObjectId(clan_id)})

            if remove_all_members.modified_count > 0 and delete_clan.deleted_count > 0:
                return {
                    "status": True, "message": "Clan closed successfully"
                }
        
