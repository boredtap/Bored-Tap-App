from .config import get_settings
from supabase import create_client, Client

supabase_url: str = get_settings().supabase_url
supabase_key: str = get_settings().supabase_key

supabase: Client = create_client(supabase_url, supabase_key)