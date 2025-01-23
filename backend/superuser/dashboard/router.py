from fastapi import APIRouter


dashboardApp = APIRouter(
    prefix="/dashboard",
    tags=["Admin Dashboard"],
    responses={404: {"description": "Not found"}},
)

