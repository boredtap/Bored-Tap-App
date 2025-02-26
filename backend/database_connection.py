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
try:
    redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True, username="default", password=REDIS_PASSWORD)
    redis_client.ping()  # Check connection
    print("Connected to Redis")
except redis.exceptions.ConnectionError as e:
    print(f"Error connecting to Redis: {e}")
    redis_client = None  # Disable caching if Redis is not available


def redis_cache(expire: timedelta = REDIS_EXPIRE):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            print("redis cache")
            if redis_client is None:
                return await func(*args, **kwargs)  # Bypass cache if Redis is unavailable

            request: Request = kwargs.get("request")  # Assuming 'request' is a parameter
            if request is None:
                raise ValueError("Request object is missing")

            cache_key = f"{request.url.path}:{request.query_params}" # Generate a unique cache key
            cached_response = redis_client.get(cache_key)

            if cached_response:
                print("Cache hit")
                response = Response(content=cached_response, media_type="application/json")
                return response

            # Cache miss
            print("Cache miss")
            response = await func(*args, **kwargs)

            if response:
                try:
                    # serialize to json before caching
                    redis_client.set(cache_key, json.dumps(response.model_dump()), ex=expire)
                except Exception as e:
                    print(f"Error setting cache: {e}")

            return response

        return wrapper

    return decorator




# # Example usage:
# @app.get("/items/{item_id}")
# @redis_cache() # Use the default expiration or @redis_cache(expire=timedelta(minutes=10))
# async def read_item(item_id: int, request: Request): # Request is now a parameter
#     # Simulate some work (e.g., database query)
#     import time
#     time.sleep(2)  # Simulate a 2-second delay

#     data = {"item_id": item_id, "value": "some_data"}
#     return data


# @app.get("/no_cache")
# async def no_cache():
#     # Simulate some work (e.g., database query)
#     import time
#     time.sleep(2)  # Simulate a 2-second delay

#     data = {"message": "This endpoint is not cached"}
#     return data





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
