"""
retrain_best_models.py
======================
Compare toutes les pistes du hackathon sur les deux cibles (x_wins, is_draw)
puis sauvegarde le MEILLEUR modèle pour chaque cible dans ressources/.

Pistes évaluées :
  - LogisticRegression   (baseline)
  - DecisionTreeClassifier
  - RandomForestClassifier
  - GradientBoostingClassifier  ← généralement le meilleur sur données tabulaires
  - MLPClassifier               (current)
"""

import pandas as pd
import numpy as np
import joblib
import os

from sklearn.model_selection      import train_test_split, cross_val_score
from sklearn.preprocessing        import StandardScaler
from sklearn.linear_model         import LogisticRegression
from sklearn.tree                 import DecisionTreeClassifier
from sklearn.ensemble             import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neural_network       import MLPClassifier
from sklearn.metrics              import accuracy_score, f1_score, classification_report

# ── Chargement du dataset ─────────────────────────────────────────────────────
RESSOURCES = os.path.join(os.path.dirname(__file__), "ressources")
df = pd.read_csv(os.path.join(RESSOURCES, "dataset.csv"))

FEATURES = [f"c{i}_{p}" for i in range(9) for p in ("x", "o")]
X = df[FEATURES].values

print(f"Dataset : {len(df)} lignes | {len(FEATURES)} features")
print(f"x_wins   : {df['x_wins'].mean():.1%} positifs")
print(f"is_draw  : {df['is_draw'].mean():.1%} positifs\n")

# ── Modèles candidats ─────────────────────────────────────────────────────────
CANDIDATES = {
    "LogisticRegression":   LogisticRegression(max_iter=1000, C=1.0),
    "DecisionTree":         DecisionTreeClassifier(max_depth=None, random_state=42),
    "RandomForest":         RandomForestClassifier(n_estimators=200, max_depth=None,
                                                    n_jobs=-1, random_state=42),
    "GradientBoosting":     GradientBoostingClassifier(n_estimators=300, learning_rate=0.1,
                                                        max_depth=4, random_state=42),
    "MLP":                  MLPClassifier(hidden_layer_sizes=(128, 64, 32),
                                          max_iter=500, random_state=42),
}

def train_and_pick_best(target_col: str) -> tuple:
    """
    Entraîne tous les candidats sur `target_col`,
    retourne (nom_meilleur, modèle_entraîné, scaler).
    """
    y = df[target_col].values
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    scaler = StandardScaler()
    X_tr_s = scaler.fit_transform(X_train)
    X_te_s = scaler.transform(X_test)

    print(f"\n{'='*60}")
    print(f"  Cible : {target_col}")
    print(f"{'='*60}")

    best_name  = None
    best_f1    = -1.0
    best_model = None

    rows = []
    for name, clf in CANDIDATES.items():
        clf.fit(X_tr_s, y_train)
        y_pred = clf.predict(X_te_s)
        acc = accuracy_score(y_test, y_pred)
        f1  = f1_score(y_test, y_pred, average="macro")
        rows.append({"Modèle": name, "Accuracy": f"{acc:.4f}", "F1-macro": f"{f1:.4f}"})

        if f1 > best_f1:
            best_f1    = f1
            best_name  = name
            best_model = clf

        print(f"  {name:<25}  acc={acc:.4f}  f1={f1:.4f}")

    print(f"\n  ✅ MEILLEUR : {best_name}  (F1-macro={best_f1:.4f})")

    # Ré-entraîner le meilleur sur TOUTES les données
    scaler_full = StandardScaler()
    X_all_s     = scaler_full.fit_transform(X)
    best_model.fit(X_all_s, y)
    print(f"  ✅ Modèle ré-entraîné sur {len(y)} exemples complets.")

    return best_name, best_model, scaler_full

# ── x_wins ───────────────────────────────────────────────────────────────────
name_xw, model_xw, scaler_xw = train_and_pick_best("x_wins")

# ── is_draw ───────────────────────────────────────────────────────────────────
name_dr, model_dr, scaler_dr = train_and_pick_best("is_draw")

# ── Sauvegarde ────────────────────────────────────────────────────────────────
path_xw = os.path.join(RESSOURCES, "model_xwins.pkl")
path_dr = os.path.join(RESSOURCES, "model_draw.pkl")

joblib.dump({"model": model_xw, "scaler": scaler_xw}, path_xw)
joblib.dump({"model": model_dr, "scaler": scaler_dr}, path_dr)

print(f"\n{'='*60}")
print(f"  Sauvegardé : {path_xw}")
print(f"  Sauvegardé : {path_dr}")
print(f"\n  model_xwins → {name_xw}")
print(f"  model_draw  → {name_dr}")
print(f"{'='*60}\n")
print("✅ Terminé — relancez Flask pour utiliser les nouveaux modèles.")
