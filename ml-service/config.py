import os
from dotenv import load_dotenv

load_dotenv()

ML_SERVICE_PORT = int(os.getenv("ML_SERVICE_PORT", "8001"))
MODELS_DIR = os.path.join(os.path.dirname(__file__), "saved_models")
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres@127.0.0.1:5433/cropyield")

os.makedirs(MODELS_DIR, exist_ok=True)
