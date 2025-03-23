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
    Establishes a connection to the 'bored-tap' MongoDB database.

    This function attempts to connect to the MongoDB server and retrieve
    the 'bored-tap' database. It checks the server's connectivity by 
    pinging it, and raises an exception if the connection fails.

    Returns:
        Database: The 'bored-tap' MongoDB database instance.

    Raises:
        Exception: If there is an error connecting to MongoDB.
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
    Establishes a connection to the 'bored-tap-images' MongoDB database.

    This function attempts to connect to the MongoDB server and retrieve
    the 'bored-tap-images' database. It checks the server's connectivity by 
    pinging it, and raises an exception if the connection fails.

    Returns:
        Database: The 'bored-tap-images' MongoDB database instance.

    Raises:
        Exception: If there is an error connecting to MongoDB.
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

