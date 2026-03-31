"""
ml/predictor.py
Encodage du plateau et evaluation ML via les deux modeles charges.
"""

import numpy as np
from ml.loader import MODEL_XWINS, MODEL_DRAW


def encode(board: list) -> list:
    """
    Encode un plateau de 9 cases en 18 features binaires.
    Pour chaque case i : [ci_x, ci_o]
        ci_x = 1 si X occupe la case, 0 sinon
        ci_o = 1 si O occupe la case, 0 sinon
    """
    feat = []
    for cell in board:
        feat.append(1 if cell == 1  else 0)
        feat.append(1 if cell == -1 else 0)
    return feat


def ml_score(board: list) -> tuple[float, float]:
    """
    Evalue un plateau via les deux modeles ML.

    Retourne :
        (p_xwins, p_draw) — probabilites en jeu parfait depuis cet etat
    """
    if MODEL_XWINS is None or MODEL_DRAW is None:
        return 0.5, 0.5

    X = np.array([encode(board)])

    p_xw = float(
        MODEL_XWINS["model"].predict_proba(
            MODEL_XWINS["scaler"].transform(X)
        )[0][1]
    )
    p_dr = float(
        MODEL_DRAW["model"].predict_proba(
            MODEL_DRAW["scaler"].transform(X)
        )[0][1]
    )
    return p_xw, p_dr


def hybrid_evaluate(board: list) -> float:
    """
    Fonction d'evaluation pour le mode Hybride.
    Convertit (p_xwins, p_draw) en un score scalaire dans [-1, 1].
    Score > 0  => favorable a X
    Score < 0  => favorable a O
    Score = 0  => nul
    """
    p_xw, p_dr = ml_score(board)
    p_ow = max(0.0, 1.0 - p_xw - p_dr)
    return p_xw - p_ow
