from pathlib import Path

import joblib
import pandas as pd

from config import MODEL_PATH, FEATURE_COLUMNS_PATH
from services.url_features import (
    extract_url_features,
    FEATURE_COLUMNS,
)


_model = None
_feature_columns = None


def load_model():
    global _model
    global _feature_columns

    if _model is None:
        if not Path(MODEL_PATH).exists():
            raise FileNotFoundError(
                "ML model not found. Run: "
                "python model/train_model.py"
            )

        _model = joblib.load(MODEL_PATH)

    if _feature_columns is None:
        if Path(FEATURE_COLUMNS_PATH).exists():
            _feature_columns = joblib.load(
                FEATURE_COLUMNS_PATH
            )
        else:
            _feature_columns = FEATURE_COLUMNS

    return _model, _feature_columns


def predict_url(url: str) -> dict:
    """
    Analyze a URL using the trained RandomForest model.
    """

    model, feature_columns = load_model()

    features = extract_url_features(url)

    dataframe = pd.DataFrame(
        [[features[column] for column in feature_columns]],
        columns=feature_columns
    )

    prediction = model.predict(dataframe)[0]

    probabilities = model.predict_proba(dataframe)[0]

    classes = list(model.classes_)

    phishing_probability = 0.0

    for class_name, probability in zip(
        classes,
        probabilities
    ):
        normalized = str(class_name).lower()

        if normalized in {
            "1",
            "phishing",
            "malicious",
            "fraud",
            "true"
        }:
            phishing_probability = float(probability)

    risk_score = round(
        phishing_probability * 100
    )

    return {
        "prediction": int(prediction)
        if str(prediction).isdigit()
        else str(prediction),

        "risk_score": risk_score,

        "phishing_probability": phishing_probability,

        "features": features,
    }