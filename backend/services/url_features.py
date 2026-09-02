import re
from urllib.parse import urlparse


SUSPICIOUS_KEYWORDS = [
    "login",
    "signin",
    "verify",
    "verification",
    "account",
    "secure",
    "security",
    "update",
    "confirm",
    "password",
    "credential",
    "wallet",
    "payment",
    "bank",
    "billing",
    "unlock",
    "suspended",
    "bonus",
    "free",
    "claim",
    "urgent",
]


SHORTENERS = {
    "bit.ly",
    "tinyurl.com",
    "t.co",
    "goo.gl",
    "ow.ly",
    "is.gd",
    "buff.ly",
    "cutt.ly",
    "rb.gy",
}


SUSPICIOUS_TLDS = {
    "tk",
    "ml",
    "ga",
    "cf",
    "gq",
    "top",
    "xyz",
    "click",
    "download",
    "zip",
}


FEATURE_COLUMNS = [
    "url_length",
    "domain_length",
    "path_length",
    "query_length",
    "dot_count",
    "subdomain_count",
    "hyphen_count",
    "digit_count",
    "special_char_count",
    "query_param_count",
    "has_at_symbol",
    "has_https",
    "has_ip",
    "is_shortened",
    "suspicious_keyword_count",
    "has_suspicious_tld",
    "has_port",
    "has_double_slash_redirect",
    "has_punycode",
    "unusual_domain_structure",
]


IP_PATTERN = re.compile(
    r"^(?:\d{1,3}\.){3}\d{1,3}$"
)


def extract_url_features(url: str) -> dict:
    """
    Extract lexical and structural URL features.

    This function never sends a request to the submitted URL.
    """

    url = url.strip()

    parsed = urlparse(url)

    domain = parsed.netloc.lower()

    # Remove username/password portion
    if "@" in domain:
        domain_without_credentials = domain.split("@")[-1]
    else:
        domain_without_credentials = domain

    # Remove port
    hostname = domain_without_credentials.split(":")[0]

    path = parsed.path or ""
    query = parsed.query or ""

    labels = hostname.split(".") if hostname else []

    subdomain_count = max(len(labels) - 2, 0)

    tld = ""
    if "." in hostname:
        tld = hostname.rsplit(".", 1)[-1]

    suspicious_keyword_count = sum(
        1
        for keyword in SUSPICIOUS_KEYWORDS
        if keyword in url.lower()
    )

    special_characters = sum(
        1
        for char in url
        if char in "@#$%^&*_=+[]{}|;:'\",<>?"
    )

    query_param_count = (
        len(query.split("&"))
        if query
        else 0
    )

    has_ip = bool(IP_PATTERN.match(hostname))

    has_https = parsed.scheme.lower() == "https"

    is_shortened = hostname in SHORTENERS

    has_suspicious_tld = tld in SUSPICIOUS_TLDS

    has_port = parsed.port is not None if hostname else False

    # "//" appearing inside the path can be used to hide the real destination
    has_double_slash_redirect = "//" in path

    has_punycode = "xn--" in hostname

    unusual_domain_structure = (
        len(labels) > 4
        or hostname.startswith(".")
        or hostname.endswith(".")
        or ".." in hostname
    )

    features = {
        "url_length": len(url),
        "domain_length": len(hostname),
        "path_length": len(path),
        "query_length": len(query),
        "dot_count": url.count("."),
        "subdomain_count": subdomain_count,
        "hyphen_count": url.count("-"),
        "digit_count": sum(char.isdigit() for char in url),
        "special_char_count": special_characters,
        "query_param_count": query_param_count,
        "has_at_symbol": int("@" in url),
        "has_https": int(has_https),
        "has_ip": int(has_ip),
        "is_shortened": int(is_shortened),
        "suspicious_keyword_count": suspicious_keyword_count,
        "has_suspicious_tld": int(has_suspicious_tld),
        "has_port": int(has_port),
        "has_double_slash_redirect": int(has_double_slash_redirect),
        "has_punycode": int(has_punycode),
        "unusual_domain_structure": int(unusual_domain_structure),
    }

    return features


def features_to_vector(features: dict):
    """
    Convert feature dictionary into the exact order expected by ML model.
    """

    return [
        features[column]
        for column in FEATURE_COLUMNS
    ]