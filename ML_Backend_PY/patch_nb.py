"""
patch_nb.py
Nettoie le notebook.ipynb :
  1. Supprime tous les emojis des sources de cellules
  2. Supprime les commentaires marqueurs d'IA en anglais
  3. Remplace les sections de comparaison textuelle par des graphiques Matplotlib
"""

import json
import re
import sys

NOTEBOOK_PATH = "notebook.ipynb"

# ─────────────────────────────────────────────
# 1. Suppression des emojis
# ─────────────────────────────────────────────

EMOJI_RE = re.compile(
    "["
    "\U0001F600-\U0001F64F"   # emoticons
    "\U0001F300-\U0001F5FF"   # symbols & pictographs
    "\U0001F680-\U0001F6FF"   # transport & map
    "\U0001F1E0-\U0001F1FF"   # flags
    "\U00002700-\U000027BF"   # dingbats
    "\U0001F900-\U0001F9FF"   # supplemental symbols
    "\U00002600-\U000026FF"   # misc symbols
    "\U00002300-\U000023FF"   # misc technical
    "\U00002B00-\U00002BFF"   # misc arrows
    "\U0001FA00-\U0001FA6F"
    "\U0001FA70-\U0001FAFF"
    "\u2705\u274C\u2714\u2716\u26A0\u2728\u2B50\u2B55"
    "\u25FB-\u25FE\u2614\u2615\u2648-\u2653"
    "\u2702\u2705\u2708-\u270D\u270F"
    "\u231A\u231B\u23E9-\u23F3\u23F8-\u23FA"
    "]+",
    flags=re.UNICODE,
)

def strip_emojis(text: str) -> str:
    cleaned = EMOJI_RE.sub("", text)
    # Supprimer les espaces en début de ligne laissés après retrait d'emojis
    lines = [ln.rstrip() for ln in cleaned.splitlines()]
    # Supprimer les lignes qui ne contiennent plus que des espaces
    return "\n".join(lines)


# ─────────────────────────────────────────────
# 2. Suppression des commentaires AI en anglais
# ─────────────────────────────────────────────

# Patterns de commentaires typiquement générés par une IA en anglais
AI_COMMENT_PATTERNS = [
    re.compile(r"^\s*#\s*(Let'?s|Now let'?s|Here we|This will|This is|Note that|We (will|can|use|need|start|now|then|also|have)|First,|Next,|Finally,|As (a result|you can|we can)|The (above|following|result|code|output)|In (this|the next|summary)|Step \d|Simply|Essentially|Basically|Below we|Import the|Load the|Define the|Create the|Train the|Fit the|Evaluate the|Print the|Plot the|Display the|Show the|Check the|Calculate the|Compute the|Generate the|Build the|Initialize the|Set (up|the)).+",
                re.IGNORECASE),
]

INLINE_AI_COMMENT_PATTERNS = [
    re.compile(r"#\s*(Load (data|model|the)|Import|Train|Fit|Predict|Evaluate|Print|Plot|Display|Initialize|Define|Create|Build|This (is|will|shows?|represents?)|Note:|TODO:|FIXME:|for (training|testing|evaluation))\b.+",
               re.IGNORECASE),
]

def strip_ai_comments(source: str) -> str:
    lines = source.splitlines()
    cleaned_lines = []
    for line in lines:
        stripped = line.strip()
        # Lignes entièrement commentaire en anglais → supprimer
        is_full_comment = stripped.startswith("#") and not stripped.startswith("#!")
        if is_full_comment:
            skip = any(p.match(line) for p in AI_COMMENT_PATTERNS)
            if skip:
                continue
        # Commentaires inline en anglais → supprimer la partie commentaire
        # (on conserve le code)
        for pat in INLINE_AI_COMMENT_PATTERNS:
            if not stripped.startswith("#"):
                if "#" in line:
                    code_part, _, _ = line.partition("#")
                    # Ne supprimer que si le commentaire matche ET le code existe
                    if code_part.strip():
                        match = pat.search(line)
                        if match:
                            line = code_part.rstrip()
                            break
        cleaned_lines.append(line)
    return "\n".join(cleaned_lines)


# ─────────────────────────────────────────────
# 3. Remplacement des comparaisons par des graphiques
# ─────────────────────────────────────────────

COMPARISON_CHART_CODE = '''\
# ── Comparaison visuelle des modèles ────────────────────────────────────────

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

modeles   = ["Régression\\nLogistique", "Decision\\nTree", "Random\\nForest", "Gradient\\nBoosting", "MLP"]
colors_xw = ["#6C8EBF", "#82B366", "#B85450", "#9673A6", "#D6B656"]
colors_dr = ["#AED6F1", "#A9DFBF", "#F1948A", "#BB8FCE", "#F8C471"]

# --- Données x_wins ---
acc_xw   = [results_xw[m]["acc"]  for m in results_xw]
f1_xw    = [results_xw[m]["f1"]   for m in results_xw]
auc_xw   = [results_xw[m].get("auc", 0) for m in results_xw]
names_xw = list(results_xw.keys())

# --- Données is_draw ---
acc_dr   = [results_dr[m]["acc"]  for m in results_dr]
f1_dr    = [results_dr[m]["f1"]   for m in results_dr]
auc_dr   = [results_dr[m].get("auc", 0) for m in results_dr]
names_dr = list(results_dr.keys())

x        = np.arange(len(names_xw))
bar_w    = 0.25

# ── Graphique 1 : comparaison x_wins ────────────────────────────────────────
fig, ax = plt.subplots(figsize=(10, 5))
b1 = ax.bar(x - bar_w,     acc_xw,  bar_w, label="Accuracy",  color="#5B9BD5", edgecolor="white")
b2 = ax.bar(x,             f1_xw,   bar_w, label="F1-Score",  color="#ED7D31", edgecolor="white")
b3 = ax.bar(x + bar_w,     auc_xw,  bar_w, label="AUC-ROC",   color="#70AD47", edgecolor="white")

for bars in [b1, b2, b3]:
    for bar in bars:
        h = bar.get_height()
        ax.text(bar.get_x() + bar.get_width() / 2, h + 0.005,
                f"{h:.3f}", ha="center", va="bottom", fontsize=7.5, fontweight="bold")

ax.set_xticks(x)
ax.set_xticklabels(names_xw, rotation=15, ha="right", fontsize=9)
ax.set_ylim(0, 1.12)
ax.set_ylabel("Score", fontsize=11)
ax.set_title("Comparaison des modèles — Cible : x_wins", fontsize=13, fontweight="bold", pad=12)
ax.legend(fontsize=9, framealpha=0.8)
ax.axhline(0.9, color="grey", linestyle="--", linewidth=0.8, alpha=0.6)
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)
plt.tight_layout()
plt.savefig("ressources/comparaison_xwins.png", dpi=150, bbox_inches="tight")
plt.show()

# ── Graphique 2 : comparaison is_draw ───────────────────────────────────────
x2 = np.arange(len(names_dr))
fig, ax = plt.subplots(figsize=(10, 5))
b1 = ax.bar(x2 - bar_w,   acc_dr,  bar_w, label="Accuracy",  color="#5B9BD5", edgecolor="white")
b2 = ax.bar(x2,            f1_dr,   bar_w, label="F1-Score",  color="#ED7D31", edgecolor="white")
b3 = ax.bar(x2 + bar_w,   auc_dr,  bar_w, label="AUC-ROC",   color="#70AD47", edgecolor="white")

for bars in [b1, b2, b3]:
    for bar in bars:
        h = bar.get_height()
        ax.text(bar.get_x() + bar.get_width() / 2, h + 0.005,
                f"{h:.3f}", ha="center", va="bottom", fontsize=7.5, fontweight="bold")

ax.set_xticks(x2)
ax.set_xticklabels(names_dr, rotation=15, ha="right", fontsize=9)
ax.set_ylim(0, 1.12)
ax.set_ylabel("Score", fontsize=11)
ax.set_title("Comparaison des modèles — Cible : is_draw", fontsize=13, fontweight="bold", pad=12)
ax.legend(fontsize=9, framealpha=0.8)
ax.axhline(0.9, color="grey", linestyle="--", linewidth=0.8, alpha=0.6)
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)
plt.tight_layout()
plt.savefig("ressources/comparaison_draw.png", dpi=150, bbox_inches="tight")
plt.show()

# ── Graphique 3 : radar / heatmap synthèse ──────────────────────────────────
fig, axes = plt.subplots(1, 2, figsize=(13, 4))

# Construire les matrices
metrics = ["Accuracy", "F1-Score", "AUC-ROC"]
mat_xw  = np.array([acc_xw, f1_xw, auc_xw])
mat_dr  = np.array([acc_dr, f1_dr, auc_dr])

for ax_i, (mat, names, title) in enumerate([
        (mat_xw, names_xw, "Heatmap des scores — x_wins"),
        (mat_dr, names_dr, "Heatmap des scores — is_draw"),
]):
    ax = axes[ax_i]
    im = ax.imshow(mat, aspect="auto", cmap="YlGn", vmin=0.5, vmax=1.0)
    ax.set_xticks(range(len(names)))
    ax.set_xticklabels(names, rotation=20, ha="right", fontsize=8)
    ax.set_yticks(range(len(metrics)))
    ax.set_yticklabels(metrics, fontsize=9)
    ax.set_title(title, fontsize=11, fontweight="bold")
    for r in range(mat.shape[0]):
        for c in range(mat.shape[1]):
            ax.text(c, r, f"{mat[r, c]:.3f}", ha="center", va="center",
                    fontsize=8, color="black" if mat[r, c] < 0.9 else "white", fontweight="bold")
    plt.colorbar(im, ax=ax, fraction=0.04, pad=0.02)

plt.tight_layout()
plt.savefig("ressources/heatmap_comparaison.png", dpi=150, bbox_inches="tight")
plt.show()

# ── Résumé textuel ──────────────────────────────────────────────────────────
print("\\n=== Synthèse — Meilleurs modèles ===")
best_xw = max(results_xw, key=lambda m: results_xw[m]["f1"])
best_dr = max(results_dr, key=lambda m: results_dr[m]["f1"])
print(f"  x_wins → {best_xw}  |  Acc={results_xw[best_xw]['acc']:.4f}  |  F1={results_xw[best_xw]['f1']:.4f}")
print(f"  is_draw → {best_dr}  |  Acc={results_dr[best_dr]['acc']:.4f}  |  F1={results_dr[best_dr]['f1']:.4f}")
'''

# Patterns qui identifient une cellule de comparaison textuelle
COMPARISON_CELL_TRIGGERS = [
    "Meilleurs modèles",
    "best_xw_name",
    "best_dr_name",
    "results_xw[best",
    "results_dr[best",
    "--- Meilleurs",
]

def is_comparison_cell(source: str) -> bool:
    return any(trigger in source for trigger in COMPARISON_CELL_TRIGGERS)


# ─────────────────────────────────────────────
# 4. Pipeline principal
# ─────────────────────────────────────────────

def process_source(source: str, cell_type: str) -> str:
    if cell_type == "markdown":
        return strip_emojis(source)
    # Code cell
    source = strip_emojis(source)
    source = strip_ai_comments(source)
    # Remplacer section de comparaison par graphiques
    if is_comparison_cell(source):
        source = COMPARISON_CHART_CODE
    return source


def patch_notebook(path: str):
    with open(path, "r", encoding="utf-8") as f:
        nb = json.load(f)

    changed = 0
    for cell in nb["cells"]:
        raw = cell["source"]
        original = "".join(raw) if isinstance(raw, list) else raw
        cleaned  = process_source(original, cell["cell_type"])
        if cleaned != original:
            cell["source"] = cleaned
            changed += 1

    with open(path, "w", encoding="utf-8") as f:
        json.dump(nb, f, ensure_ascii=False, indent=1)

    print(f"Notebook nettoyé : {changed} cellule(s) modifiée(s).")


if __name__ == "__main__":
    patch_notebook(NOTEBOOK_PATH)
