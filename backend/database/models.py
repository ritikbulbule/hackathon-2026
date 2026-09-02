import json

from database.db import get_connection


def save_scan(
    input_type,
    input_value,
    risk_level,
    risk_score,
    prediction,
    indicators
):
    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        INSERT INTO scans (
            input_type,
            input_value,
            risk_level,
            risk_score,
            prediction,
            indicators
        )
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            input_type,
            input_value,
            risk_level,
            risk_score,
            prediction,
            json.dumps(indicators),
        )
    )

    connection.commit()

    scan_id = cursor.lastrowid

    connection.close()

    return scan_id


def get_recent_scans(limit=20):
    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT *
        FROM scans
        ORDER BY timestamp DESC
        LIMIT ?
        """,
        (limit,)
    )

    rows = cursor.fetchall()

    connection.close()

    results = []

    for row in rows:
        item = dict(row)

        try:
            item["indicators"] = json.loads(
                item["indicators"]
            )
        except Exception:
            item["indicators"] = []

        results.append(item)

    return results


def get_total_scan_count():
    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        "SELECT COUNT(*) AS count FROM scans"
    )

    result = cursor.fetchone()

    connection.close()

    return result["count"]


def get_stats():
    connection = get_connection()

    cursor = connection.cursor()

    cursor.execute(
        """
        SELECT
            COUNT(*) AS total,
            SUM(
                CASE
                    WHEN risk_level = 'SAFE'
                    THEN 1 ELSE 0
                END
            ) AS safe,
            SUM(
                CASE
                    WHEN risk_level = 'SUSPICIOUS'
                    THEN 1 ELSE 0
                END
            ) AS suspicious,
            SUM(
                CASE
                    WHEN risk_level = 'HIGH'
                    THEN 1 ELSE 0
                END
            ) AS high
        FROM scans
        """
    )

    result = dict(cursor.fetchone())

    connection.close()

    return {
        "total": result["total"] or 0,
        "safe": result["safe"] or 0,
        "suspicious": result["suspicious"] or 0,
        "high": result["high"] or 0,
    }