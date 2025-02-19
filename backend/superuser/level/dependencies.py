from bson import ObjectId
from fastapi import HTTPException
from httpx import delete
from superuser.level.models import LevelModel, LevelModelResponse
from superuser.level.schemas import CreateLevel
from database_connection import levels_collection, fs


# ------------------------------ VERIFY BADGE ------------------------------ #
def verify_badge(format: str):
    if format.lower() not in ["jpeg", "jpg", "png"]:
        raise HTTPException(status_code=400, detail="Invalid badge file. Please upload a valid badge file.")
    
    return True


# ------------------------------ VERIFY NEW LEVEL ------------------------------ #
def verify_new_level(level: CreateLevel):
    levels = levels_collection.find({})
    current_higest_level = levels_collection.find({}).sort("level", -1).limit(1)

    # check if level exists by name
    if levels_collection.find_one({"name": level.name}):
        raise HTTPException(status_code=400, detail="Level already exists.")

    # check if level exists by level
    if levels_collection.find_one({"level": level.level}):
        raise HTTPException(status_code=400, detail="Level already exists.")
    
    # check if level requirement is greater than 0 and also greater than current highest level requirement
    if level.requirement < 0:
        raise HTTPException(status_code=400, detail="Level requirement must be greater than 0.")

    if levels:
        try:
            current_higest_level = current_higest_level.next()
            print(current_higest_level)
            if level.requirement <= current_higest_level["requirement"]:
                raise HTTPException(status_code=400, detail=f"Level requirement must be greater than {current_higest_level['requirement']}.")
        except StopIteration as e:
            print(e)
            pass

# ---------------------------------- CREATE LEVEL ------------------------------ #
def create_level(level: CreateLevel, badge: bytes, badge_name: str):
    badge_id = fs.put(badge, filename="badge_" + badge_name)

    # insert new level
    new_level = LevelModel(
        name=level.name,
        level=level.level,
        requirement=level.requirement,
        badge_id=str(badge_id)
    )

    inserted_level = levels_collection.insert_one(new_level.model_dump())

    level_id = str(inserted_level.inserted_id)

    return LevelModelResponse(
        id=str(level_id),
        **new_level.model_dump()
    )

# -------------------------------- GET ALL LEVELS ------------------------------ #
def get_levels():
    levels = levels_collection.find({})

    for level in levels:
        yield LevelModelResponse(
            id=str(level["_id"]),
            name=level["name"],
            level=level["level"],
            requirement=level["requirement"],
            badge_id=level["badge_id"]
        )


# ------------------------------ DELETE LEVEL ------------------------------ #
def delete_level(level_id: str):
    level = levels_collection.find_one({"_id": ObjectId(level_id)})

    if not level:
        raise HTTPException(status_code=400, detail="Level not found.")
    
    badge_id = level["badge_id"]
    fs.delete(ObjectId(badge_id))
    deleted_level = levels_collection.delete_one({"_id": ObjectId(level_id)})

    if not deleted_level.acknowledged:
        raise HTTPException(status_code=400, detail="Level deletion failed.")

    return True