"""
ml/loader.py
Charge les bundles de modeles ML depuis le disque.
Chaque bundle est un dict {"model": classifier, "scaler": StandardScaler}.
"""

import joblib
from config import MODEL_XWINS_PATH, MODEL_DRAW_PATH


def _load(path: str) -> dict | None:
    try:
        bundle = joblib.load(path)
        print(f"[OK] Modele charge : {path}")
        return bundle
    except Exception as exc:
        print(f"[ERREUR] Impossible de charger {path} : {exc}")
        return None


MODEL_XWINS = _load(MODEL_XWINS_PATH)
MODEL_DRAW  = _load(MODEL_DRAW_PATH)
