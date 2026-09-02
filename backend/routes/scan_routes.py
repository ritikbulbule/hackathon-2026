from flask import Blueprint, jsonify, request

from services.url_detector import predict_url
from services.message_analyzer import analyze_message
from services.screenshot_analyzer import analyze_screenshot
from services.risk_classifier import (
    classify_risk,
    get_recommendation,
)
from services.explanation import (
    explain_url,
    explain_message,
)

from database.models import save_scan

from utils.validators import (
    validate_url,
    validate_message,
    validate_upload,
)


scan_bp = Blueprint(
    "scan",
    __name__
)


def indicator_object(
    indicator_id,
    label,
    triggered,
    detail
):
    return {
        "id": indicator_id,
        "label": label,
        "triggered": bool(triggered),
        "detail": detail,
    }


def build_url_indicators(features):
    return [
        indicator_object(
            "ip-address",
            "IP Address",
            features["has_ip"],
            "The URL uses an IP address instead of a domain."
        ),

        indicator_object(
            "at-symbol",
            "@ Symbol",
            features["has_at_symbol"],
            "The URL contains an @ symbol."
        ),

        indicator_object(
            "shortened-url",
            "Shortened URL",
            features["is_shortened"],
            "The URL appears to use a shortening service."
        ),

        indicator_object(
            "suspicious-tld",
            "Suspicious TLD",
            features["has_suspicious_tld"],
            "The domain uses a potentially suspicious top-level domain."
        ),

        indicator_object(
            "punycode",
            "Punycode Domain",
            features["has_punycode"],
            "The domain contains punycode."
        ),

        indicator_object(
            "suspicious-keywords",
            "Suspicious Keywords",
            features["suspicious_keyword_count"] > 0,
            "The URL contains phishing-related keywords."
        ),

        indicator_object(
            "https",
            "HTTPS",
            not features["has_https"],
            "The URL does not use HTTPS."
        ),

        indicator_object(
            "long-url",
            "Long URL",
            features["url_length"] > 100,
            "The URL is unusually long."
        ),

        indicator_object(
            "many-subdomains",
            "Multiple Subdomains",
            features["subdomain_count"] >= 3,
            "The URL contains multiple subdomain levels."
        ),
    ]


def build_message_indicators(analysis):
    return [
        indicator_object(
            "urgency",
            "Urgency",
            analysis["urgency"],
            "The message attempts to create urgency."
        ),

        indicator_object(
            "account-threat",
            "Account Threat",
            analysis["account_threat"],
            "The message threatens account suspension or blocking."
        ),

        indicator_object(
            "credentials",
            "Credential Request",
            analysis["credentials"],
            "The message references passwords or login credentials."
        ),

        indicator_object(
            "financial",
            "Financial Request",
            analysis["financial"],
            "The message contains payment or financial language."
        ),

        indicator_object(
            "otp",
            "OTP Request",
            analysis["otp"],
            "The message references an OTP or verification code."
        ),

        indicator_object(
            "social-engineering",
            "Social Engineering",
            analysis["social_engineering"],
            "The message contains social-engineering language."
        ),

        indicator_object(
            "links",
            "Links",
            analysis["links"],
            "The message contains a URL."
        ),

        indicator_object(
            "suspicious-url",
            "Suspicious URL",
            bool(analysis["suspicious_urls"]),
            "One or more URLs appear suspicious."
        ),
    ]


def build_url_breakdown(features):
    return [
        {
            "label": "URL Structure",
            "value": min(
                100,
                (
                    features["url_length"] // 2
                    + features["hyphen_count"] * 3
                    + features["dot_count"] * 2
                )
            )
        },
        {
            "label": "Suspicious Keywords",
            "value": min(
                100,
                features["suspicious_keyword_count"] * 20
            )
        },
        {
            "label": "Domain Risk",
            "value": min(
                100,
                (
                    features["has_ip"] * 40
                    + features["has_suspicious_tld"] * 30
                    + features["has_punycode"] * 30
                )
            )
        },
        {
            "label": "Security",
            "value": 0 if features["has_https"] else 70
        },
    ]


def build_message_breakdown(analysis):
    return [
        {
            "label": "Urgency",
            "value": 100 if analysis["urgency"] else 0
        },
        {
            "label": "Account Threat",
            "value": 100 if analysis["account_threat"] else 0
        },
        {
            "label": "Credentials",
            "value": 100 if analysis["credentials"] else 0
        },
        {
            "label": "Financial",
            "value": 100 if analysis["financial"] else 0
        },
        {
            "label": "OTP",
            "value": 100 if analysis["otp"] else 0
        },
        {
            "label": "Social Engineering",
            "value": 100 if analysis["social_engineering"] else 0
        },
    ]


def build_frontend_result(
    risk,
    indicators,
    reasons,
    breakdown
):
    return {
        "riskLevel": risk["risk_level"].lower(),
        "score": risk["risk_score"],
        "indicators": indicators,
        "reasons": reasons,
        "breakdown": breakdown,
        "recommendation": get_recommendation(
            risk["risk_level"]
        ),
    }


@scan_bp.route(
    "/analyze-url",
    methods=["POST"]
)
def analyze_url_route():

    data = request.get_json(
        silent=True
    ) or {}

    url = data.get("url", "")

    valid, error = validate_url(url)

    if not valid:
        return jsonify({
            "error": error
        }), 400

    try:
        analysis = predict_url(url)

        features = analysis["features"]

        risk = classify_risk(
            analysis["risk_score"]
        )

        indicators = build_url_indicators(
            features
        )

        reasons = explain_url(
            features
        )

        breakdown = build_url_breakdown(
            features
        )

        response = build_frontend_result(
            risk,
            indicators,
            reasons,
            breakdown
        )

        save_scan(
            input_type="url",
            input_value=url,
            risk_level=risk["risk_level"],
            risk_score=risk["risk_score"],
            prediction=str(
                analysis["prediction"]
            ),
            indicators=reasons,
        )

        return jsonify(response), 200

    except Exception as error:
        print("URL analysis error:", error)

        return jsonify({
            "error": (
                "URL analysis failed. "
                "Make sure the ML model has been trained."
            )
        }), 500


@scan_bp.route(
    "/analyze-message",
    methods=["POST"]
)
def analyze_message_route():

    data = request.get_json(
        silent=True
    ) or {}

    message = data.get(
        "message",
        ""
    )

    valid, error = validate_message(
        message
    )

    if not valid:
        return jsonify({
            "error": error
        }), 400

    try:
        analysis = analyze_message(
            message
        )

        risk = classify_risk(
            analysis["score"]
        )

        indicators = build_message_indicators(
            analysis
        )

        reasons = explain_message(
            analysis
        )

        breakdown = build_message_breakdown(
            analysis
        )

        response = build_frontend_result(
            risk,
            indicators,
            reasons,
            breakdown
        )

        save_scan(
            input_type="message",
            input_value=message,
            risk_level=risk["risk_level"],
            risk_score=risk["risk_score"],
            prediction="rule-based",
            indicators=reasons,
        )

        return jsonify(response), 200

    except Exception as error:
        print("Message analysis error:", error)

        return jsonify({
            "error": "Message analysis failed."
        }), 500


@scan_bp.route(
    "/analyze-screenshot",
    methods=["POST"]
)
def analyze_screenshot_route():

    uploaded_file = request.files.get(
        "file"
    )

    valid, error = validate_upload(
        uploaded_file
    )

    if not valid:
        return jsonify({
            "error": error
        }), 400

    try:
        analysis = analyze_screenshot(
            uploaded_file.stream
        )

        if not analysis["success"]:
            return jsonify({
                "error": analysis["error"]
            }), 500

        message_analysis = analysis[
            "message_analysis"
        ]

        score = message_analysis["score"]

        # Add extra risk when suspicious URLs
        # were found in the screenshot.
        if analysis["urls"]:
            score += 5

        if message_analysis[
            "suspicious_urls"
        ]:
            score += 15

        score = min(score, 100)

        risk = classify_risk(score)

        indicators = build_message_indicators(
            message_analysis
        )

        reasons = explain_message(
            message_analysis
        )

        if analysis["urls"]:
            reasons.append(
                "The screenshot contains a detected URL."
            )

        breakdown = build_message_breakdown(
            message_analysis
        )

        response = build_frontend_result(
            risk,
            indicators,
            reasons,
            breakdown
        )

        # Save OCR text rather than image itself.
        save_scan(
            input_type="screenshot",
            input_value=analysis["text"][:10000],
            risk_level=risk["risk_level"],
            risk_score=risk["risk_score"],
            prediction="ocr-rule-based",
            indicators=reasons,
        )

        return jsonify(response), 200

    except Exception as error:
        print(
            "Screenshot analysis error:",
            error
        )

        return jsonify({
            "error": (
                "Screenshot analysis failed."
            )
        }), 500