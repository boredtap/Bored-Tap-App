import json
from config import get_settings
from gridfs import GridFS
from pymongo import MongoClient, errors
import redis
from functools import wraps
from datetime import timedelta
from fastapi import Request, Response


connection_string: str = get_settings().mongodb_connection_string
client: MongoClient = MongoClient(connection_string)



# --------------------------------------------- redis connection ---------------------------------------------
REDIS_HOST = get_settings().redis_host
REDIS_PORT = get_settings().redis_port
REDIS_PASSWORD = get_settings().redis_password
REDIS_EXPIRE = timedelta(minutes=5)  # Cache expiration time

# Initialize Redis client
def get_redis_client():
    try:
        # production cache
        redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True, username="default", password=REDIS_PASSWORD)

        # local cache
        # redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)

        redis_client.ping()  # Check connection
        print("Connected to Redis")
    except redis.exceptions.ConnectionError as e:
        print(f"Error connecting to Redis: {e}")
        redis_client = None  # Disable caching if Redis is not available
    
    yield redis_client



# --------------------------------------------- mongo connection ---------------------------------------------
def get_db():
    """

    """
    try:
        # ping the server to check connectivity
        client.server_info()
        db = client['bored-tap']
        return db
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        raise e

def get_img_db():
    """

    """
    try:
        # ping the server to check connectivity
        client.server_info()
        db = client['bored-tap-images']
        return db
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        raise e


db = get_db()
img_db = get_img_db()
fs = GridFS(img_db, collection='images')

collection_names = [
    'admins',
    'users',
    'invites_ref',
    'coin_stats',
    'tasks',
    'rewards',
    'clans',
    'challenges',
    'extra_boosts',
    'levels'
]

for collection_name in collection_names:
    try:
        db.create_collection(collection_name, check_exists=True,)
    except errors.CollectionInvalid:
        pass

admin_collection = db['admins']
user_collection = db['users']
invites_ref = db['invites_ref']
coin_stats = db['coin_stats']
task_collection = db['tasks']
rewards_collection = db['rewards']
challenges_collection = db['challenges']
extra_boosts_collection = db['extra_boosts']
levels_collection = db['levels']
clans_collection = db['clans']



# change the clan datatype in user collection from array to object
def change_clan_datatype():
    update_clan = user_collection.update_many(
        {},
        {
            "$set": {
                "clan": {
                    "id": None,
                    "name": None
                }
            }
        }
    )

    if update_clan.modified_count > 0:
        print(f"{update_clan.modified_count} users clan data changed successfully")
    else:
        print("Clan datatype change failed")

# change_clan_datatype()