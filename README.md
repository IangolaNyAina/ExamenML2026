# Hackathon Machine Learning — Morpion & IA

<div align="center">

**[Institut Supérieur Polytechnique de Madagascar](https://www.ispm-edu.com)**  
Master 1 · Semestre 1 · Machine Learning

</div>

---

## Groupe IMTICIA 4 (LastLight)

| Rôle                            | Nom                             | Numéro    | Classe    |
| ------------------------------- | ------------------------------- | --------- | --------- |
| Data Engineer / Algo Specialist | HERMANCE Iangola Ny Aina Ashley | numéro 17 | IMTICIA 4 |
| Data Analyst                    | RAZAKA RAHARIJAO Johanna        | numéro 18 | IMTICIA 4 |
| ML Engineer                     | SETA Gaëtanuo Moryantes         | numéro 23 | IMTICIA 4 |
| Dev Interface                   | SETA Gaëtanuo Moryantes         | numéro 23 | IMTICIA 4 |

---

## Description du projet

Ce projet implémente un pipeline Machine Learning complet autour du jeu de **Morpion (Tic-Tac-Toe)**.  
L'objectif est de construire une IA adaptative capable d'évaluer et de jouer intelligemment les positions du jeu,
en partant de la génération des données jusqu'à une interface jouable.

Le pipeline comprend :

1. **Génération du dataset** — parcours exhaustif des états valides via Minimax Alpha-Beta
2. **EDA** — analyse exploratoire des distributions et des corrélations
3. **Baseline** — deux modèles de Régression Logistique (x_wins / is_draw)
4. **Modèles avancés** — Decision Tree, Random Forest, Gradient Boosting, MLP
5. **Backend API Flask** — sert les prédictions à l'interface de jeu
6. **Interface jouable** — 3 modes : Humain vs Humain, vs IA ML, vs IA Hybride

---

## Structure du dépôt

```
ML_HACKATHON/
│
├── ML_Backend_PY/                  # Backend Python — API Flask + ML
│   ├── app.py                      # Point d'entrée Flask
│   ├── config.py                   # Chemins et constantes globales
│   ├── generate_dataset.py         # Étape 0 : générateur Minimax-AlphaBeta + CSV
│   ├── notebook.ipynb              # EDA · Baseline · Coefficients · Modèles avancés
│   ├── retrain_best_models.py      # Ré-entraînement et sauvegarde des modèles
│   │
│   ├── ml/
│   │   ├── loader.py               # Chargement des deux modèles .pkl
│   │   └── predictor.py            # Encodage 18 features + évaluation ML
│   │
│   ├── game/
│   │   └── logic.py                # check_win · is_terminal · Minimax Alpha-Beta
│   │
│   ├── routes/
│   │   └── api.py                  # Blueprint Flask — tous les endpoints REST
│   │
│   └── ressources/
│       ├── dataset.csv             # Dataset généré (18 features + x_wins + is_draw)
│       ├── model_xwins.pkl         # Meilleur modèle entraîné sur x_wins
│       ├── model_draw.pkl          # Meilleur modèle entraîné sur is_draw
│       └── *.png                   # Graphiques EDA et comparaisons
│
├── ML_frontend/                    # Interface jouable — Next.js 16 + React 19
│   ├── app/                        # Routes Next.js (App Router)
│   │   └── page.tsx                # Page principale — monte <MorpionGame />
│   │
│   ├── components/
│   │   ├── morpion/
│   │   │   ├── morpion-game.tsx    # Composant racine — gestion des états de jeu
│   │   │   ├── game-board.tsx      # Plateau 3×3 interactif
│   │   │   ├── game-status.tsx     # Affichage du résultat + boutons de contrôle
│   │   │   ├── mode-selector.tsx   # Sélecteur des 3 modes (PvP / ML / Hybride)
│   │   │   └── score-board.tsx     # Tableau des scores
│   │   ├── ui/                     # Composants shadcn/ui (Button, Card…)
│   │   └── theme-provider.tsx      # Gestion du thème clair/sombre
│   │
│   ├── lib/
│   │   ├── morpion-ai.ts           # Types, helpers, appels fetch au backend Flask
│   │   └── utils.ts                # Utilitaire cn() pour les classes Tailwind
│   │
│   ├── styles/                     # Feuilles de style globales
│   ├── public/                     # Assets statiques
│   ├── next.config.mjs             # Configuration Next.js
│   ├── tailwind.config.*           # Configuration Tailwind CSS v4
│   ├── tsconfig.json               # Configuration TypeScript
│   └── package.json                # Dépendances Node.js
│
├── .gitignore
└── README.md
```

---

## Lancer le projet

### Backend Flask

```bash
cd ML_Backend_PY

# 1. Créer et activer l'environnement virtuel
python -m venv venv
.\venv\Scripts\activate        # Windows
source venv/bin/activate       # Linux / macOS

# 2. Installer les dépendances
pip install flask flask-cors joblib numpy scikit-learn pandas

# 3. (Optionnel) Régénérer le dataset et ré-entraîner les modèles
python generate_dataset.py
python retrain_best_models.py

# 4. Lancer le serveur
python app.py
```

Le backend démarre sur **http://localhost:5000**.

---

### Frontend (interface jouable)

> **Prérequis :** Node.js >= 18 et npm >= 9

```bash
cd ML_frontend

# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement
npm run dev
```

L'interface est accessible sur **http://localhost:3000**.

> **Important :** le backend Flask (`localhost:5000`) doit être démarré **avant** de jouer en mode _vs IA ML_ ou _vs IA Hybride_. Le mode _Humain vs Humain_ fonctionne sans backend.

#### Stack technique du frontend

| Technologie | Version | Rôle |
| --- | --- | --- |
| [Next.js](https://nextjs.org) | 16 | Framework React (App Router) |
| [React](https://react.dev) | 19 | UI réactive |
| [Tailwind CSS](https://tailwindcss.com) | v4 | Styles utilitaires |
| [shadcn/ui](https://ui.shadcn.com) | — | Composants accessibles (Radix UI) |
| [TypeScript](https://www.typescriptlang.org) | 5.7 | Typage statique |

#### Commandes utiles

```bash
npm run build    # Build de production
npm run lint     # Vérification ESLint
npm run start    # Serveur de production (après build)
```

---

## API REST — Référence

### `GET /health`

Vérifie que le serveur et les modèles sont prêts.

```json
// Réponse 200
{ "status": "ok", "model_xwins_loaded": true, "model_draw_loaded": true }
```

---

### `POST /predict`

Évalue un plateau et retourne les probabilités ML en jeu parfait.

**Corps :**

```json
{ "board": [0, 0, 0, 0, 1, 0, 0, 0, 0] }
```

_Conventions : `1` = X · `-1` = O · `0` = vide_

**Réponse :**

```json
{
  "p_xwins": 0.0994,
  "p_draw": 0.9184,
  "p_owins": 0.0,
  "status": "success"
}
```

---

### `POST /best_move`

Mode **IA ML pur** — retourne l'indice du meilleur coup selon les modèles ML.

**Corps :**

```json
{ "board": [1, 0, 0, 0, -1, 0, 0, 0, 0], "turn": 1 }
```

**Réponse :**

```json
{ "move": 8, "score": 0.743, "status": "success" }
```

_`move` est un indice de case entre 0 et 8 (ligne par ligne, gauche→droite)._

---

### `POST /best_move_hybrid`

Mode **IA Hybride** — Minimax-AlphaBeta jusqu'à `depth` coups, puis ML aux feuilles.

**Corps :**

```json
{ "board": [1, 0, 0, 0, -1, 0, 0, 0, 0], "turn": 1, "depth": 3 }
```

**Réponse :**

```json
{ "move": 2, "score": 0.891, "status": "success" }
```

---

## Résultats ML

### Baseline — Régression Logistique

| Cible     | Accuracy | F1-Score |
| --------- | -------- | -------- |
| `x_wins`  | ~0.87    | ~0.85    |
| `is_draw` | ~0.91    | ~0.89    |

### Modèles avancés (meilleurs résultats)

| Modèle            | x_wins Acc. | is_draw Acc. |
| ----------------- | ----------- | ------------ |
| Decision Tree     | ~0.91       | ~0.93        |
| Random Forest     | ~0.95       | ~0.96        |
| Gradient Boosting | ~0.96       | ~0.97        |
| **MLP (retenu)**  | **~0.97**   | **~0.98**    |

> Les modèles retenus sont des **MLPClassifier** (réseau de neurones) avec un StandardScaler, sauvegardés dans `ressources/model_xwins.pkl` et `ressources/model_draw.pkl`.

---

## Réponses aux questions (Q1–Q4)

### Q1 — Analyse des coefficients

L'analyse des 18 coefficients de la Régression Logistique (carte `ci_x` et `ci_o` sur le plateau 3×3) révèle que :

- **Pour `x_wins`** : les coefficients les plus élevés en valeur absolue correspondent aux cases `c4_x` (centre) et aux cases de coin (`c0_x`, `c2_x`, `c6_x`, `c8_x`). Occuper le centre avec X est le signal le plus fort de victoire future.
- **Pour `is_draw`** : les coefficients `ci_o` des coins et du centre sont les plus influents — un O bien placé force le jeu vers la nulle.
- **La case centrale (case 4)** joue un rôle particulier dans les deux modèles, avec les coefficients les plus élevés. Ce résultat est cohérent avec la stratégie humaine : le centre offre le plus de lignes gagnantes potentielles (4 lignes passent par la case 4 contre 2 pour les bords).

---

### Q2 — Déséquilibre des classes

| Cible     | Classe 1        | Classe 0               |
| --------- | --------------- | ---------------------- |
| `x_wins`  | ~46 % (X gagne) | ~54 % (X ne gagne pas) |
| `is_draw` | ~26 % (nulle)   | ~74 % (pas nulle)      |

Le dataset est **modérément déséquilibré pour `x_wins`** et **nettement déséquilibré pour `is_draw`** (la nulle est minoritaire car seul le jeu parfait des deux côtés garantit une nulle).

La métrique privilégiée est le **F1-Score** plutôt que l'Accuracy, car l'Accuracy peut être trompeuse sur des classes déséquilibrées : un modèle trivial qui prédit toujours 0 pour `is_draw` obtiendrait déjà ~74 % d'accuracy sans rien apprendre.

---

### Q3 — Comparaison des deux classificateurs

Le modèle `x_wins` est légèrement plus difficile à apprendre que `is_draw` en Régression Logistique, car la victoire de X dépend d'une combinaison subtile des positions des deux joueurs, sans frontière de décision linéaire claire. À l'inverse, la nulle correspond à un pattern plus structuré (jeu parfait des deux côtés) que les modèles non-linéaires capturent mieux. Les erreurs se concentrent principalement sur les **états milieu de partie** (3–4 pièces posées), là où les deux issues restent encore possibles et où la frontière de décision est la plus ambiguë.

---

### Q4 — Mode hybride vs IA ML pur

En mode Hybride, l'IA adopte un comportement **plus défensif et stratégique** qu'en mode ML pur. La recherche Minimax à profondeur 3 permet d'éviter les pièges immédiats (fourchettes à 2 coups) que l'évaluation ML seule ne détecte pas toujours — le modèle ML prédit l'issue en jeu parfait depuis l'état courant, mais il ne simule pas explicitement les coups adverses. En combinant les deux, le joueur hybride bloque mieux les menaces directes tout en guidant sa recherche vers les positions que le ML juge favorables. Qualitativement, le mode hybride perd nettement moins souvent contre un humain moyen que le mode ML pur.

---

## Vidéo de présentation

> [Lien vers la vidéo (3–5 min)](https://youtu.be/LIEN_A_COMPLETER)

Contenu : présentation de l'équipe · EDA · Baseline vs modèle final · Démo de l'interface jouable.

---

<div align="center">
<sub>ISPM — Institut Supérieur Polytechnique de Madagascar · <a href="https://www.ispm-edu.com">www.ispm-edu.com</a></sub>
</div>
