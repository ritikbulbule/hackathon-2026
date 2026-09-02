from flask import Blueprint, jsonify, request

from database.models import get_recent_scans
from utils.validators import validate_pagination


history_bp = Blueprint(
    "history",
    __name__
)


@history_bp.route(
    "/history",
    methods=["GET"]
)
def history():

    limit = validate_pagination(
        request.args.get(
            "limit",
            20
        )
    )

    scans = get_recent_scans(
        limit
    )

    return jsonify({
        "success": True,
        "history": scans
    })