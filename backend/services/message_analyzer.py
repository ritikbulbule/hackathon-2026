import re

from services.url_features import extract_url_features


URGENCY_PATTERNS = [
    r"\burgent\b",
    r"\bimmediately\b",
    r"\bact now\b",
    r"\blast chance\b",
    r"\bwithin \d+ (minutes?|hours?)\b",
    r"\bexpires?\b",
    r"\btoday only\b",
]


ACCOUNT_THREAT_PATTERNS = [
    r"\baccount.*(suspend|block|disable|close)\b",
    r"\b(suspend|blocked|disabled|closed).*account\b",
    r"\bverify.*account\b",
    r"\bunusual activity\b",
    r"\bsecurity alert\b",
]


CREDENTIAL_PATTERNS = [
    r"\bpassword\b",
    r"\blogin\b",
    r"\bsign in\b",
    r"\busername\b",
    r"\bcredential\b",
    r"\buser id\b",
]


FINANCIAL_PATTERNS = [
    r"\bbank\b",
    r"\bpayment\b",
    r"\bpay\b",
    r"\bcredit card\b",
    r"\bdebit card\b",
    r"\bupi\b",
    r"\brefund\b",
    r"\bwallet\b",
    r"\btransaction\b",
    r"\btransfer\b",
]


OTP_PATTERNS = [
    r"\botp\b",
    r"\bone[- ]time password\b",
    r"\bverification code\b",
    r"\bsecurity code\b",
    r"\bverification otp\b",
]


SOCIAL_ENGINEERING_PATTERNS = [
    r"\bclick here\b",
    r"\bclaim\b",
    r"\bcongratulations\b",
    r"\byou have won\b",
    r"\bprize\b",
    r"\breward\b",
    r"\bfree gift\b",
    r"\bconfirm now\b",
    r"\bverify now\b",
]


URL_PATTERN = re.compile(
    r"https?://[^\s<>\"]+",
    re.IGNORECASE
)


def contains_any(text: str, patterns: list) -> bool:
    return any(
        re.search(pattern, text, re.IGNORECASE)
        for pattern in patterns
    )


def analyze_message(message: str) -> dict:
    message = message.strip()

    urgency = contains_any(
        message,
        URGENCY_PATTERNS
    )

    account_threat = contains_any(
        message,
        ACCOUNT_THREAT_PATTERNS
    )

    credentials = contains_any(
        message,
        CREDENTIAL_PATTERNS
    )

    financial = contains_any(
        message,
        FINANCIAL_PATTERNS
    )

    otp = contains_any(
        message,
        OTP_PATTERNS
    )

    social_engineering = contains_any(
        message,
        SOCIAL_ENGINEERING_PATTERNS
    )

    urls = URL_PATTERN.findall(message)

    suspicious_urls = []

    for url in urls:
        try:
            features = extract_url_features(url)

            suspicious = (
                features["has_ip"]
                or features["has_at_symbol"]
                or features["is_shortened"]
                or features["has_suspicious_tld"]
                or features["has_punycode"]
                or features["suspicious_keyword_count"] >= 2
                or not features["has_https"]
            )

            if suspicious:
                suspicious_urls.append(url)

        except Exception:
            suspicious_urls.append(url)

    # Weighted rule-based score
    score = 0

    if urgency:
        score += 8

    if account_threat:
        score += 12

    if credentials:
        score += 15

    if financial:
        score += 10

    if otp:
        score += 12

    if social_engineering:
        score += 6

    if urls:
        score += 5

    if suspicious_urls:
        score += 12

    score = min(score, 100)

    return {
        "score": score,

        "urgency": urgency,

        "account_threat": account_threat,

        "credentials": credentials,

        "financial": financial,

        "otp": otp,

        "social_engineering": social_engineering,

        "links": bool(urls),

        "urls": urls,

        "suspicious_urls": suspicious_urls,
    }