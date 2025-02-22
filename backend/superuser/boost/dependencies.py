from datetime import datetime, timezone
from io import BytesIO

from bson import ObjectId
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from superuser.boost.models import AutoBotModel, AutoBotModelResponse, ExtraBoostModel, ExtraBoostModelResponse
from superuser.boost.schemas import CreateExtraBoost, UpdateUpgradeCost
from database_connection import extra_boosts_collection, fs


# ------------------------------ VERIFY NEW EXTRA BOOST ------------------------------ #
def verify_new_extra_boost(eboost: CreateExtraBoost, ):
    """
    Verifies the new extra boost data against existing boosts in the database.

    Args:
        eboost (CreateExtraBoost): The new extra boost data to verify.

    Raises:
        HTTPException: If the following conditions are met:
            - More than 5 extra boosts exist with the same name.
            - An extra boost with the specified level already exists.
            - The upgrade cost is less than or equal to zero.
            - The upgrade cost is not higher than the current highest level's upgrade cost.

    Returns:
        None
    """
    if eboost.name == "Auto-bot Tapping":
        auto_bot = extra_boosts_collection.find({"name": "Auto-bot Tapping"})
        if auto_bot:
            raise HTTPException(status_code=400, detail="Cannot create more than one Auto-Tapping bot.")
        return

    # find other extra boosters and sort them in ascending order
    extra_boosts_from_db = extra_boosts_collection.find({"name": eboost.name}).sort("level", -1)
    if extra_boosts_from_db:
        try:
            extra_boosts: list[ExtraBoostModelResponse] = []
            for extra_boost in extra_boosts_from_db:
                print(extra_boost["name"])
                extra_boosts.append(
                    ExtraBoostModelResponse(
                        id= str(extra_boost["_id"]),
                        name=extra_boost["name"],
                        description=extra_boost["description"],
                        level=extra_boost["level"],
                        effect=extra_boost["effect"],
                        upgrade_cost=extra_boost["upgrade_cost"],
                        condition=extra_boost["condition"],
                        image_id=str(extra_boost["image_id"]),
                        created_at=extra_boost["created_at"]
                    )
                )
        except StopIteration as e:
            print(e)
            pass
    else:
        return

    # check if there are already 5 extra boosts
    if len(extra_boosts) == 5:
        raise HTTPException(status_code=400, detail="Cannot create more than 5 extra boosts.")
        
    # check if level already exists
    if len(extra_boosts) >= eboost.level:
        raise HTTPException(status_code=400, detail=f"{eboost.name} level {eboost.level} already exists.")
    
    # check if boost upgrade cost is greater than 0
    if eboost.upgrade_cost < 0:
        raise HTTPException(status_code=400, detail=f"{eboost.name} upgrade cost must be greater than 0.")

    # check if boost upgrade cost is greater than current highest level's upgrade cost
    try:
        if eboost.upgrade_cost <= extra_boosts[-1].upgrade_cost:
            raise HTTPException(status_code=400, detail=f"{eboost.name} upgrade cost must be higher than {extra_boosts[-1].upgrade_cost}.")
    except IndexError:
        pass

# =----------------------------- VERIFY IMAGE ------------------------------ #
def verify_image(format: str):
    if format.lower() not in ["jpeg", "jpg", "png"]:
        raise HTTPException(status_code=400, detail="Invalid badge file. Please upload a valid badge file.")
    
    return True

# ----------------------------- CREATE EXTRA BOOST ------------------------------ #
def create_extra_boost(eboost: CreateExtraBoost):
    if not eboost.image:
        raise HTTPException(status_code=400, detail="Image is required.")
    
    image = eboost.image.file.read()
    image_name = eboost.image.filename
    image_format = image_name.split(".")[1]

    verify_new_extra_boost(eboost)

    if verify_image(image_format):
        image_id = fs.put(image, filename="eboost_" + image_name)

        if eboost.name == "Auto-bot Tapping":
            new_boost = AutoBotModel(
                name=eboost.name,
                # description=eboost.description,
                # level=eboost.level,
                # effect=eboost.effect,
                upgrade_cost=eboost.upgrade_cost,
                # condition=eboost.condition,
                image_id=str(image_id),
                created_at=datetime.now(timezone.utc)
            )
        else:
            new_boost = ExtraBoostModel(
                name=eboost.name,
                description=eboost.description,
                level=eboost.level,
                effect=eboost.effect,
                upgrade_cost=eboost.upgrade_cost,
                condition=eboost.condition,
                image_id=str(image_id),
                created_at=datetime.now(timezone.utc)
            )
        

        inserted_eboost = extra_boosts_collection.insert_one(new_boost.model_dump())
        eboost_id = str(inserted_eboost.inserted_id)

        if eboost.name == "Auto-bot Tapping":
            return AutoBotModelResponse(
                id=eboost_id,
                **new_boost.model_dump()
            )
        else:
            return ExtraBoostModelResponse(
                id=eboost_id,
                **new_boost.model_dump()
            )


# ----------------------------- GET EXTRA BOOSTERS ------------------------------ #
def get_extra_boosters():
    eboosters = extra_boosts_collection.find({})
    try:
        for extra_boost in eboosters:
            if extra_boost["name"] == "Auto-bot Tapping":
                yield AutoBotModelResponse(
                    id= str(extra_boost["_id"]),
                    name=extra_boost["name"],
                    description=extra_boost["description"],
                    level=extra_boost["level"],
                    effect=extra_boost["effect"],
                    upgrade_cost=extra_boost["upgrade_cost"],
                    condition=extra_boost["condition"],
                    image_id=str(extra_boost["image_id"]),
                    created_at=extra_boost["created_at"]
                )
                continue
            yield ExtraBoostModelResponse(
                    id= str(extra_boost["_id"]),
                    name=extra_boost["name"],
                    description=extra_boost["description"],
                    level=extra_boost["level"],
                    effect=extra_boost["effect"],
                    upgrade_cost=extra_boost["upgrade_cost"],
                    condition=extra_boost["condition"],
                    image_id=str(extra_boost["image_id"]),
                    created_at=extra_boost["created_at"]
                )
    except StopIteration as e:
        pass


# ----------------------------- UPDATE UPGRADE COST ------------------------------ #
def get_extra_boost_image(image_id: str):
    image = fs.get(ObjectId(image_id))
    image_format = image.filename.split(".")[1]
    image_buffer = BytesIO(image.read())
    image_buffer.seek(0)
    return StreamingResponse(image_buffer, media_type=f"image/{image_format}")


# ----------------------------- UPDATE UPGRADE COST ------------------------------ #
def update_upgrade_cost(upgrade: UpdateUpgradeCost):
    query_filter = {"_id": ObjectId(upgrade.extra_boost_id)}
    eboost = extra_boosts_collection.find_one(query_filter)

    if not eboost:
        raise HTTPException(status_code=404, detail="Extra boost not found/invalid id")

    update_operation = {
        "$set": {
            "upgrade_cost": upgrade.upgrade_cost
        }
    }

    update = extra_boosts_collection.update_one(
        query_filter,
        update_operation
    )

    if not update.acknowledged:
        raise HTTPException(status_code=400, detail="Upgrade cost update failed.")

    return {"message": "upgrade cost updated successfully."}


def delete_extra_boost(eboost_id):
    eboost = extra_boosts_collection.find_one({"_id": ObjectId(eboost_id)})
    
    if not eboost:
        raise HTTPException(status_code=404, detail="Extra boost not found/invalid id")

    # delete eboost image
    image_id = eboost["image_id"]
    fs.delete(ObjectId(image_id))

    deleted = extra_boosts_collection.delete_one({"_id": ObjectId(eboost_id)})

    if not deleted.acknowledged:
        raise Exception("Reward deletion failed.")

    return True