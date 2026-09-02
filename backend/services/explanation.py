def explain_url(features: dict) -> list:
    indicators = []

    if features["has_ip"]:
        indicators.append(
            "The URL uses an IP address instead of a normal domain."
        )

    if features["has_at_symbol"]:
        indicators.append(
            "The URL contains an @ symbol, which can obscure the real destination."
        )

    if features["is_shortened"]:
        indicators.append(
            "The URL uses a URL shortening service."
        )

    if features["has_suspicious_tld"]:
        indicators.append(
            "The domain uses a potentially suspicious top-level domain."
        )

    if features["has_punycode"]:
        indicators.append(
            "The domain contains punycode, which can be used in look-alike domains."
        )

    if features["has_port"]:
        indicators.append(
            "The URL specifies a non-standard port."
        )

    if features["has_double_slash_redirect"]:
        indicators.append(
            "The URL contains a double-slash path pattern."
        )

    if features["suspicious_keyword_count"] > 0:
        indicators.append(
            "The URL contains words commonly associated with phishing "
            "or account manipulation."
        )

    if features["url_length"] > 100:
        indicators.append(
            "The URL is unusually long."
        )

    if features["subdomain_count"] >= 3:
        indicators.append(
            "The URL contains multiple subdomain levels."
        )

    if features["hyphen_count"] >= 3:
        indicators.append(
            "The domain contains an unusually high number of hyphens."
        )

    if not features["has_https"]:
        indicators.append(
            "The URL does not use HTTPS."
        )

    if not indicators:
        indicators.append(
            "No major structural warning signs were detected."
        )

    return indicators


def explain_message(analysis: dict) -> list:
    reasons = []

    if analysis.get("urgency"):
        reasons.append(
            "The message creates a sense of urgency."
        )

    if analysis.get("account_threat"):
        reasons.append(
            "The message threatens account suspension or loss of access."
        )

    if analysis.get("credentials"):
        reasons.append(
            "The message asks for login or credential information."
        )

    if analysis.get("financial"):
        reasons.append(
            "The message contains financial or payment-related requests."
        )

    if analysis.get("otp"):
        reasons.append(
            "The message requests or mentions an OTP/verification code."
        )

    if analysis.get("social_engineering"):
        reasons.append(
            "The message contains social-engineering language."
        )

    if analysis.get("links"):
        reasons.append(
            "The message contains one or more links."
        )

    if analysis.get("suspicious_urls"):
        reasons.append(
            "One or more URLs in the message show suspicious characteristics."
        )

    if not reasons:
        reasons.append(
            "No major phishing indicators were detected."
        )

    return reasons