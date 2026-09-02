from pathlib import Path


# ============================================================
# SHIELDX BACKEND CONFIGURATION
# ============================================================

# ------------------------------------------------------------
# Base directory
# ------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent


# ============================================================
# SERVER CONFIGURATION
# ============================================================

HOST = "127.0.0.1"
PORT = 5000

DEBUG = True


# ============================================================
# FRONTEND / CORS CONFIGURATION
# ============================================================

# Your frontend currently uses:
#
# const BASE_URL = "http://localhost:5000/api"
#
# So the Flask backend runs on port 5000.
#
# These are the common local frontend ports that may be used
# when running your HTML project with Live Server or Vite.

CORS_ALLOWED_ORIGINS = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",

    "http://localhost:5173",
    "http://127.0.0.1:5173",

    "http://localhost:3000",
    "http://127.0.0.1:3000",

    "http://localhost:5000",
    "http://127.0.0.1:5000",
]


# ============================================================
# API ENDPOINTS
# ============================================================

# These MUST match the endpoints expected by your frontend
# js/api.js.

API_PREFIX = "/api"

ANALYZE_URL_ENDPOINT = f"{API_PREFIX}/analyze-url"
ANALYZE_MESSAGE_ENDPOINT = f"{API_PREFIX}/analyze-message"
ANALYZE_SCREENSHOT_ENDPOINT = f"{API_PREFIX}/analyze-screenshot"

HISTORY_ENDPOINT = f"{API_PREFIX}/history"
STATS_ENDPOINT = f"{API_PREFIX}/stats"


# ============================================================
# FRONTEND RISK LEVELS
# ============================================================

# Your frontend expects exactly these values:
#
# "safe"
# "suspicious"
# "high"
#
# Do NOT change these names because result.js uses them.

RISK_SAFE = "safe"
RISK_SUSPICIOUS = "suspicious"
RISK_HIGH = "high"


# ============================================================
# RISK SCORE THRESHOLDS
# ============================================================

# Score returned to frontend:
#
# 0 - 30    -> safe
# 31 - 70   -> suspicious
# 71 - 100  -> high

SAFE_MAX_SCORE = 30
SUSPICIOUS_MAX_SCORE = 70
HIGH_MAX_SCORE = 100


# ============================================================
# INPUT LIMITS
# ============================================================

# Maximum URL length accepted by the backend.

MAX_URL_LENGTH = 2048


# Maximum message length accepted by the backend.

MAX_MESSAGE_LENGTH = 10000


# Maximum screenshot/file upload size.
#
# Flask expects this value in bytes.

MAX_UPLOAD_SIZE_MB = 10
MAX_CONTENT_LENGTH = MAX_UPLOAD_SIZE_MB * 1024 * 1024


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

DATABASE_DIR = BASE_DIR / "database"

DATABASE_PATH = DATABASE_DIR / "shieldx.db"


# ============================================================
# MACHINE LEARNING MODEL CONFIGURATION
# ============================================================

MODEL_DIR = BASE_DIR / "model" / "saved_model"

URL_MODEL_PATH = MODEL_DIR / "phishing_url_model.joblib"

FEATURE_COLUMNS_PATH = MODEL_DIR / "feature_columns.joblib"


# ============================================================
# SCREENSHOT / OCR CONFIGURATION
# ============================================================

# Screenshot analyzer uses:
#
# Pillow
# pytesseract
#
# Tesseract itself must also be installed on the computer.

ALLOWED_IMAGE_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".bmp"
}


# ============================================================
# SUPPORTED FRONTEND SCAN TYPES
# ============================================================

# These correspond to the scanner options in your frontend.

SCAN_TYPE_URL = "url"
SCAN_TYPE_MESSAGE = "message"
SCAN_TYPE_SCREENSHOT = "screenshot"


SUPPORTED_SCAN_TYPES = {
    SCAN_TYPE_URL,
    SCAN_TYPE_MESSAGE,
    SCAN_TYPE_SCREENSHOT,
}


# ============================================================
# APPLICATION INFORMATION
# ============================================================

APP_NAME = "ShieldX"

APP_VERSION = "1.0.0"

APP_DESCRIPTION = (
    "ShieldX phishing and scam detection backend"
)