from urllib.parse import urlparse

from config import (
    MAX_URL_LENGTH,
    MAX_MESSAGE_LENGTH,
    ALLOWED_IMAGE_EXTENSIONS,
)


def validate_url(url):
    if not isinstance(url, str):
        return False, "URL must be a string."

    url = url.strip()

    if not url:
        return False, "URL is required."

    if len(url) > MAX_URL_LENGTH:
        return False, "URL is too long."

    parsed = urlparse(url)

    if parsed.scheme not in {"http", "https"}:
        return False, "URL must use HTTP or HTTPS."

    if not parsed.netloc:
        return False, "Invalid URL."

    return True, None


def validate_message(message):
    if not isinstance(message, str):
        return False, "Message must be a string."

    message = message.strip()

    if not message:
        return False, "Message is required."

    if len(message) > MAX_MESSAGE_LENGTH:
        return False, "Message is too long."

    return True, None


def validate_upload(file):
    if file is None:
        return False, "No file uploaded."

    filename = file.filename or ""

    if "." not in filename:
        return False, "File must have an image extension."

    extension = filename.rsplit(
        ".",
        1
    )[1].lower()

    if extension not in ALLOWED_IMAGE_EXTENSIONS:
        return False, (
            "Only PNG, JPG, JPEG and WEBP images are supported."
        )

    return True, None


def validate_pagination(limit):
    try:
        limit = int(limit)
    except (TypeError, ValueError):
        limit = 20

    limit = max(1, min(limit, 100))

    return limit