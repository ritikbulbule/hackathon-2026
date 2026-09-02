from config import (
    SAFE_THRESHOLD,
    SUSPICIOUS_THRESHOLD,
)


def classify_risk(score: int) -> dict:
    score = max(0, min(100, int(score)))

    if score <= SAFE_THRESHOLD:
        risk_level = "SAFE"
    elif score <= SUSPICIOUS_THRESHOLD:
        risk_level = "SUSPICIOUS"
    else:
        risk_level = "HIGH"

    return {
        "risk_level": risk_level,
        "risk_score": score,
    }


def get_recommendation(risk_level: str) -> str:
    risk_level = risk_level.upper()

    if risk_level == "SAFE":
        return (
            "This input appears relatively safe. "
            "Continue to stay alert and avoid sharing "
            "sensitive information unnecessarily."
        )

    if risk_level == "SUSPICIOUS":
        return (
            "Be careful with this input. "
            "Do not provide passwords, OTPs, banking details, "
            "or other sensitive information until you verify "
            "the source independently."
        )

    return (
        "Do not interact with this input. "
        "Avoid opening suspicious links or sharing passwords, "
        "OTPs, financial information, or personal data."
    )