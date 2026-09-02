import re

from PIL import Image
import pytesseract

from services.message_analyzer import analyze_message
from services.url_features import extract_url_features


URL_PATTERN = re.compile(
    r"https?://[^\s<>\"]+",
    re.IGNORECASE
)


def check_ocr_available() -> bool:
    try:
        pytesseract.get_tesseract_version()
        return True
    except Exception:
        return False


def analyze_screenshot(file_stream) -> dict:
    if not check_ocr_available():
        return {
            "success": False,
            "error": (
                "Tesseract OCR is not installed or "
                "is not available in PATH."
            )
        }

    try:
        image = Image.open(file_stream)

        # Convert to RGB for better OCR compatibility
        image = image.convert("RGB")

        extracted_text = pytesseract.image_to_string(
            image
        ).strip()

        message_analysis = analyze_message(
            extracted_text
        )

        urls = URL_PATTERN.findall(
            extracted_text
        )

        url_features = []

        for url in urls:
            try:
                url_features.append({
                    "url": url,
                    "features": extract_url_features(url)
                })
            except Exception:
                pass

        return {
            "success": True,
            "text": extracted_text,
            "message_analysis": message_analysis,
            "urls": urls,
            "url_features": url_features,
        }

    except Exception as error:
        return {
            "success": False,
            "error": str(error)
        }