from datetime import datetime, timedelta, timezone
from bson import ObjectId
from fastapi import HTTPException
from database_connection import user_collection, fs, clans_collection, coin_stats,  invites_ref
from clan.schemas import ClanTopEarners, CreateClan, ClanSearchResponse, MyClan, MyEligibleMembers
from dependencies import update_coin_stats, update_coins_in_db
from user_reg_and_prof_mngmnt.models import Clan as UserProfileClan
from superuser.clan.models import Clan


CLAN_LEADER_INVITEE_REQUIREMENTS = 1


# =----------------------------- VERIFY IMAGE ------------------------------ #
def verify_image(format: str):
    if format.lower() not in ["jpeg", "jpg", "png"]:
        raise HTTPException(status_code=400, detail="Invalid badge file. Please upload a valid badge file.")
    
    return True


# --------------------------------------------- CREATE CLAN --------------------------------------------- #
def my_eligible_members(telegram_user_id: str):
    """
    Retrieve eligible members who can be added to a clan by clan owner during clan creation.

    This function retrieves invitees of a given user who are not currently in any clan. 
    For each eligible invitee, it yields an instance of MyEligibleMembers containing necessary
    data from their profile details.

    Args:
        telegram_user_id (str): The Telegram user ID of the inviter.

    Yields:
        MyEligibleMembers: An object containing details of each eligible member.
    
    Raises:
        HTTPException: If the user has no invitees.
    """

    invitees = invites_ref.find_one({"inviter_telegram_id": telegram_user_id})
    
    # no invitees
    if not invitees:
        raise HTTPException(status_code=403, detail="You have no invitees")
    
    invitees = invitees['invitees']
    
    # get eligible members
    for member in invitees:
        member_profile = user_collection.find_one({"telegram_user_id": member})
        member_invitees = invites_ref.find_one({"inviter_telegram_id": member})
        member_invitees_count = 0

        if member_profile["clan"]["name"] == None:
            if member_invitees:
                member_invitees_count = len(member_invitees['invitees'])

            yield MyEligibleMembers(
                telegram_user_id=member_profile["telegram_user_id"],
                username=member_profile["username"],
                level=member_profile["level"],
                invitees=member_invitees_count,
                image_url=member_profile["image_url"]
            )


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


    members: list = clan.members[0].split(",")  # swaggerUI takes list[str] as ["'item1', 'item2', 'item3'"]
    if not members:
        members = clan.members

    # add clan creater/owner to members list
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
    if len(user_invite) < CLAN_LEADER_INVITEE_REQUIREMENTS:
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
        members=len(members)
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
        # update_clan_member_count = clans_collection.update_one(
        #     {"_id": ObjectId(clan_id)},
        #     {
        #         "$inc": {
        #             "members": update_members_profile.modified_count 
        #     }}
        # )

        if update_members_profile.modified_count > 0:
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
def all_clans(skip: int, limit: int):
    clans = clans_collection.find().sort("total_coins", -1).skip(skip).limit(limit)

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
def top_clans(skip: int, limit: int):
    """
    Return the top clans with the most coins.

    Yields:
        dict: A dictionary containing the details of each clan.
    """
    clans = clans_collection.find().sort("total_coins", -1).skip(skip).limit(limit)

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

    if not user_clan_id:
        raise HTTPException(status_code=404, detail="You are not in a clan")

    clan = clans_collection.find_one({"_id": ObjectId(user_clan_id)})
    in_clan_rank = "member"

    if not clan:
        raise HTTPException(status_code=404, detail="Clan not found")

    if clan["creator"] == telegram_user_id:
        in_clan_rank = "creator"

    return MyClan(
        id=str(clan["_id"]),
        name=clan["name"],
        rank=f"#{clan['rank']}",
        image_id=clan["image_id"],
        in_clan_rank=in_clan_rank,
        total_coins=clan["total_coins"],
        members=clan["members"],
        status=clan["status"]
        # creator=clan["creator"]
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


# --------------------------------- NEXT POTENTIAL LEADER ---------------------------------- #
def next_potential_clan_leader(clan_id: str):
    clan = clans_collection.find_one({"_id": ObjectId(clan_id)})

    if not clan:
        raise HTTPException(status_code=404, detail="Clan not found")
    
    # clan members
    members = user_collection.find({"clan.id": clan_id})
    member_ids = [member["telegram_user_id"] for member in members]

    # members with 50/50+ invitees
    members_id_with_50_invitees = []

    for id in member_ids:
        if id != clan["creator"]:
            invitees = invites_ref.find_one({"inviter_telegram_id": id})

            if invitees:
                invitees = len(invitees["invitees"])
                if invitees >= CLAN_LEADER_INVITEE_REQUIREMENTS:
                    members_id_with_50_invitees.append(id)
    
    # no eligible leader for leadership transfer
    if len(members_id_with_50_invitees) == 0:
        return None
    
    # only one eligible leader
    if len(members_id_with_50_invitees) == 1:
        return {
            "status": "success",
            "message": f"{len(members_id_with_50_invitees)} potential leader found",
            "leader": members_id_with_50_invitees[0],
            "username": user_collection.find_one({"telegram_user_id": members_id_with_50_invitees[0]})["username"]
        }
    
    # multiple eligible leaders
    if len(members_id_with_50_invitees) > 1:
        # get top earner from list of eligible leaders
        top_earner = user_collection.find_one({"telegram_user_id": members_id_with_50_invitees[0]})

        for i in range(1, len(members_id_with_50_invitees)):
            leader = user_collection.find_one({"telegram_user_id": members_id_with_50_invitees[i]})

            if leader["total_coins"] > top_earner["total_coins"]:
                top_earner = leader

        return {
            "status": "success",
            "message": f"{len(members_id_with_50_invitees)} potential leader(s) found",
            "leader": top_earner["telegram_user_id"],
            "username": top_earner["username"]
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
            eligible_leader = next_potential_clan_leader(clan_id)

            if not eligible_leader:
                return {
                    "status": "error",
                    "message": "No eligible leader for leadership transfer"
                }

            # transfer ownership to next member with 50/50+ invitees and is the top earner
            transfer_ownership = clans_collection.update_one(
                {"_id": ObjectId(clan_id)},
                {
                    "$set": {
                        "creator": eligible_leader["leader"]
                    }
                }
            )

            if transfer_ownership.modified_count > 0:
                # remove current leader from clan members
                remove_current_leader = user_collection.update_one(
                    {"telegram_user_id": clan["creator"]},
                    {
                        "$set": {
                            "clan": {
                                "id": None,
                                "name": None,
                            }
                        }
                    }
                )

                # update clan member count
                update_clan_member_count = clans_collection.update_one(
                    {"_id": ObjectId(clan_id)},
                    {
                        "$inc": {
                            "members": -1
                        }
                    }
                )

                if remove_current_leader.modified_count > 0 and update_clan_member_count.modified_count > 0:
                    return {
                        "status": True,
                        "message": "Ownership transferred",
                        "new leader": eligible_leader["leader"]
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
        

# --------------------------------- CLAN TOP EARNERS ---------------------------------- #
def clan_top_earners(clan_id: str, limit: int = 10, skip: int = 0):
    clan = clans_collection.find_one({"_id": ObjectId(clan_id)})

    if not clan:
        raise HTTPException(status_code=404, detail="Clan not found")
    
    members = user_collection.find({"clan.id": clan_id}).sort("total_coins", -1).skip(skip).limit(limit)

    top_earners = []
    for index, member in enumerate(members):
        top_earner = ClanTopEarners(
            telegram_user_id=member["telegram_user_id"],
            username=member["username"],
            level=member["level"],
            total_coins=member["total_coins"],
            image_url=member["image_url"],
            rank=f"#{index + 1}"
        )

        top_earners.append(top_earner)

    return top_earners



# --------------------------------- CLAN EARNINGS STRATEGY ---------------------------------- #
def run_clan_earnings():
    """
    Updates clan earnings and user coins daily.

    This function only runs once a day, preferably at midnight UTC time.
    It calculates 0.1% of the coins a user earned the previous day and distributes it to the user's clan and the user themselves.
    It also updates the clan's last earn date and the clan rankings.

    Returns a dictionary with the clan earnings and the member earnings for each user in the clan.
    """
    # operations before clan earnings update
    clans = clans_collection.find({"status": "active"})
    today_date = datetime.now(timezone.utc).date()
    previous_day = today_date - timedelta(days=1)

    response = {}
    for clan in clans:
        clan_id = clan["_id"]
        members = user_collection.find({"clan.id": str(clan_id)})

        clans_last_earn_date = clans_collection.find_one({"_id": ObjectId(clan_id)})["last_earn_date"]

        if clans_last_earn_date == previous_day.strftime("%Y-%m-%d"):
            print("Clan earnings already distributed for today.")
        else:
            if members:
                members_telegram_ids = [member["telegram_user_id"] for member in members]

                # get 0.1% of coins a user earned the previous day
                user_coin_stats = coin_stats.find_one({"telegram_user_id": {"$in": members_telegram_ids}})
                clan_earnings = 0

                if user_coin_stats:
                    for date, coins in user_coin_stats["date"].items():
                        if date == previous_day.strftime("%Y-%m-%d"):
                            clan_earnings += int(coins * 0.001)

                # add earnings to clan earnings and update clan's last earn date
                clan_update_operation = {
                    "$inc": {
                        "total_coins": clan_earnings
                    },
                    "$set": {
                        "last_earn_date": previous_day.strftime("%Y-%m-%d")
                    }
                }

                clan_update = clans_collection.update_one({"_id": ObjectId(clan_id)}, clan_update_operation)
                if clan_update.modified_count > 0:
                    response["clan_earnings"] = f"+{clan_earnings}"

                # add earnings to user coins
                members_update_operation = {
                    "$inc": {
                        "total_coins": clan_earnings
                    }
                }

                members_update = user_collection.update_many({"telegram_user_id": {"$in": members_telegram_ids}}, members_update_operation)
                if members_update.modified_count > 0:
                    response["member_earnings (each)"] = f"+{clan_earnings}"
                
                # update each user's coin stats
                for member_id in members_telegram_ids:
                    update_coin_stats(member_id, clan_earnings)

                print(response)



    # operations after clan earnings update
    # update clan rankings in from highest to lowest of total coins
    updated_clans = clans_collection.find().sort("total_coins", -1)

    if updated_clans:
        rank = 1
        for clan in updated_clans:
            clan_id = clan["_id"]
            update_clan_rank = clans_collection.update_one(
                {"_id": ObjectId(clan_id)}, 
                {
                    "$set": {"rank": rank}
                }
            )
            rank += 1

    return response

