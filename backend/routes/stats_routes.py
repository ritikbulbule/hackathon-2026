from flask import Blueprint, jsonify

from database.models import get_stats


stats_bp = Blueprint(
    "stats",
    __name__
)


@stats_bp.route(
    "/stats",
    methods=["GET"]
)
def stats():

    statistics = get_stats()

    return jsonify({
        "success": True,
        "stats": statistics
    })