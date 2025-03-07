from database_connection import clans_collection
from superuser.clan.schemas import ClanCategories, ClanProfile


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
            created_at=clan["created_at"]
        )

        yield clan_data

