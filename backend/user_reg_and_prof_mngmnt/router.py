from fastapi import APIRouter

starter = APIRouter()


@starter.get("/start")
async def start_cmd():
    return {"msg": "Welcome to Bored Tap :)"}
