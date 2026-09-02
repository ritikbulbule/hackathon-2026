from pathlib import Path

import joblib
import pandas as pd

from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

from services.url_features import (
    extract_url_features,
    FEATURE_COLUMNS,
)


BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_DIR = BASE_DIR / "model" / "saved_model"

MODEL_PATH = (
    MODEL_DIR /
    "phishing_url_model.joblib"
)

FEATURE_COLUMNS_PATH = (
    MODEL_DIR /
    "feature_columns.joblib"
)


DEMO_DATA = [
    # Safe examples
    ("https://www.google.com", 0),
    ("https://www.microsoft.com", 0),
    ("https://www.apple.com", 0),
    ("https://www.amazon.com", 0),
    ("https://www.wikipedia.org", 0),
    ("https://github.com", 0),
    ("https://www.python.org", 0),
    ("https://www.nasa.gov", 0),
    ("https://www.linkedin.com", 0),
    ("https://www.youtube.com", 0),

    # Phishing-like examples
    ("http://192.168.1.20/login", 1),
    ("http://secure-login-example.tk/verify", 1),
    ("http://account-security.xyz/update-password", 1),
    ("http://verify-user.top/login/account", 1),
    ("http://paypal-secure-login.click/verify", 1),
    ("http://bank-account-security.ml/login", 1),
    ("http://free-prize-claim.xyz/winner", 1),
    ("http://urgent-account-verify.tk/security", 1),
    ("http://wallet-confirmation.top/verify", 1),
    ("http://xn--paypa1-secure-123.xyz/login", 1),
]


def build_dataset():

    rows = []

    for url, label in DEMO_DATA:

        features = extract_url_features(
            url
        )

        features["label"] = label

        rows.append(features)

    return pd.DataFrame(rows)


def train():

    print("Creating ShieldX URL dataset...")

    dataframe = build_dataset()

    X = dataframe[
        FEATURE_COLUMNS
    ]

    y = dataframe["label"]

    X_train, X_test, y_train, y_test = (
        train_test_split(
            X,
            y,
            test_size=0.25,
            random_state=42,
            stratify=y
        )
    )

    model = RandomForestClassifier(
        n_estimators=200,
        random_state=42,
        class_weight="balanced"
    )

    model.fit(
        X_train,
        y_train
    )

    predictions = model.predict(
        X_test
    )

    accuracy = accuracy_score(
        y_test,
        predictions
    )

    MODEL_DIR.mkdir(
        parents=True,
        exist_ok=True
    )

    joblib.dump(
        model,
        MODEL_PATH
    )

    joblib.dump(
        FEATURE_COLUMNS,
        FEATURE_COLUMNS_PATH
    )

    print()
    print("===================================")
    print("ShieldX model trained successfully")
    print("===================================")
    print(f"Demo accuracy: {accuracy:.2%}")
    print(f"Model: {MODEL_PATH}")
    print(f"Features: {FEATURE_COLUMNS_PATH}")
    print()
    print(
        "NOTE: This is a demonstration model "
        "trained on a small synthetic dataset."
    )
    print(
        "For production use, train on a large "
        "real-world phishing dataset."
    )


if __name__ == "__main__":
    train()