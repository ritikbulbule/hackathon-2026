import os
import re


def sanitize_filename(filename):
    """
    Remove unsafe characters from uploaded filenames.
    """

    filename = os.path.basename(
        filename or "upload"
    )

    filename = re.sub(
        r"[^A-Za-z0-9._-]",
        "_",
        filename
    )

    return filename


def error_response(message):
    return {
        "success": False,
        "error": message
    }