from bson import ObjectId
from fastapi import HTTPException
from database_connection import extra_boosts_collection, user_collection
from boosts.schemas import AutoBotTap, ExtraBoosters
from superuser import boost



def current_booster_status(booster: dict, boost_name: str, boost_level: int):
    """
    This function takes a booster document from the database and a boost name and level,
    and returns the corresponding ExtraBoosters model if the booster name and level match.

    Args:
        booster (dict): A document from the database representing an extra booster.
        boost_name (str): The name of the boost.
        boost_level (int): The level of the boost.

    Returns:
        ExtraBoosters or None: The ExtraBoosters model if the booster name and level match, otherwise None.
    """
    if booster["name"] == boost_name and booster["level"]-1 == boost_level:
                return ExtraBoosters(
                    booster_id=str(booster["_id"]),
                    name=booster["name"],
                    description=booster["description"],
                    level=booster["level"],
                    effect=booster["effect"],
                    upgrade_cost=booster["upgrade_cost"],
                    image_id=booster["image_id"]
                )
    return None


def my_extra_boosters(telegram_user_id: str):
    my_data: dict = user_collection.find_one({"telegram_user_id": telegram_user_id})
    extra_boosters = extra_boosts_collection.find({})

    boost_level: int = my_data["extra_boost"]["boost"]
    multiplier_level: int = my_data["extra_boost"]["multiplier"]
    recharging_speed_level: int = my_data["extra_boost"]["recharging_speed"]
    auto_bot_status: bool = my_data["extra_boost"]["auto_bot_tap"]

    user_boosters = []

    if my_data and extra_boosters:
        for booster in extra_boosters:
            # boost
            if boost_level == 5:
                boost_status = current_booster_status(booster, "boost", 4)
                if boost_status:
                    user_boosters.append(boost_status)

            boost_status = current_booster_status(booster, "boost", boost_level)
            if boost_status:
                user_boosters.append(boost_status)

            # multiplier
            multiplier_status = current_booster_status(booster, "multiplier", multiplier_level)
            if multiplier_status:
                user_boosters.append(multiplier_status)
            elif multiplier_level == 5:
                multiplier_status = current_booster_status(booster, "multiplier", 4)
                if multiplier_status:
                    user_boosters.append(multiplier_status)

            # recharging speed
            recharge_speed_status = current_booster_status(booster, "recharging speed", recharging_speed_level)
            if recharge_speed_status:
                user_boosters.append(recharge_speed_status)
            elif recharging_speed_level == 5:
                recharge_speed_status = current_booster_status(booster, "recharging speed", 4)
                if recharge_speed_status:
                    user_boosters.append(recharge_speed_status)

            # auto bot tap
            if booster["name"] == "Auto-bot Tapping" and not auto_bot_status:
                user_boosters.append(
                     AutoBotTap(
                        booster_id=str(booster["_id"]),
                        name=booster["name"],
                        description=booster["description"],
                        level=booster["level"],
                        effect=booster["effect"],
                        upgrade_cost=booster["upgrade_cost"],
                        image_id=booster["image_id"],
                        status="not owned"
                     )
                )
            elif booster["name"] == "Auto-bot Tapping" and auto_bot_status:
                user_boosters.append(
                     AutoBotTap(
                        booster_id=str(booster["_id"]),
                        name=booster["name"],
                        description=booster["description"],
                        level=booster["level"],
                        effect=booster["effect"],
                        upgrade_cost=booster["upgrade_cost"],
                        image_id=booster["image_id"],
                        status="owned"
                     )
                )

        return user_boosters
    

# ----------------------------------- PERFORM UPGRADE ---------------------------------------
def upgrade_extra_boost(extra_boost_id: str, telegram_user_id: str):
    """
    Upgrade an extra booster.

    Args:
        extra_boost_id (str): The ID of the extra booster to upgrade.
        telegram_user_id (str): The Telegram user ID of the user.

    Raises:
        HTTPException: If the user does not have enough coins to make the upgrade.

    Returns:
        dict: A dictionary with two keys: "status" and "message". "status" is a boolean indicating whether the upgrade was successful, and "message" is a string with a message about the upgrade.
    """
    user: dict = user_collection.find_one({"telegram_user_id": telegram_user_id})
    ebooster: dict = extra_boosts_collection.find_one({"_id": ObjectId(extra_boost_id)})

    # check if user has enough coins
    if ebooster["upgrade_cost"] > user["total_coins"]:
         raise HTTPException(status_code=400, detail="Not enough coins to make this upgrade.")
    
    # get name of the extra booster
    ebooster_name = ebooster["name"]
    if ebooster_name != "Auto-bot Tapping":
        booster_names = {
            #  boosterdb: userProfile
            "boost": "boost",
            "multiplier": "multiplier",
            "recharging speed": "recharging_speed"
        }
        booster_name = booster_names[ebooster_name]

        if user["extra_boost"][booster_name] == 5:
            raise HTTPException(status_code=400, detail="You have reached the maximum level for this booster.")
        
        update = user_collection.update_one(
            {"telegram_user_id": telegram_user_id},
            {
                # subtract upgrade cost from user total coins
                "$inc": {
                    "total_coins": -ebooster["upgrade_cost"],
                    f"extra_boost.{booster_name}": 1
                }
            }
        )

        if update.modified_count:
            print(update.modified_count)
            return {
                "status": True,
                "message": "Extra boost upgraded successfully."
            }
    
    else:
        update = user_collection.update_one(
            {"telegram_user_id": telegram_user_id},
            {
                # subtract upgrade cost from user total coins
                "$inc": {
                    "total_coins": -ebooster["upgrade_cost"]
                },

                # increment user extra boost level
                "$set": {
                    "extra_boost.auto_bot_tap": True
                }
            }
        )

        if update.modified_count == 1:
            return {
                "status": True,
                "message": "Extra boost upgraded successfully."
            }
