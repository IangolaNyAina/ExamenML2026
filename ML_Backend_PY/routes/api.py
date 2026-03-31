"""
routes/api.py
Blueprint Flask — tous les endpoints de l'API Morpion IA.

Endpoints disponibles :
    GET  /health              — verifie que le serveur et les modeles sont prets
    POST /predict             — evalue un plateau (p_xwins, p_draw, p_owins)
    POST /best_move           — meilleur coup en mode IA ML pur
    POST /best_move_hybrid    — meilleur coup en mode Hybride (Minimax + ML)
"""

from flask import Blueprint, request, jsonify
from ml.loader    import MODEL_XWINS, MODEL_DRAW
from ml.predictor import ml_score, hybrid_evaluate
from game.logic   import is_terminal, minimax, check_win
from config       import MINIMAX_DEFAULT_DEPTH

api_blueprint = Blueprint("api", __name__)


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------

@api_blueprint.route("/health", methods=["GET"])
def health():
    """
    Verifie que le serveur tourne et que les modeles sont charges.

    Reponse 200 :
        {
            "status": "ok",
            "model_xwins_loaded": bool,
            "model_draw_loaded":  bool
        }
    """
    return jsonify({
        "status":             "ok",
        "model_xwins_loaded": MODEL_XWINS is not None,
        "model_draw_loaded":  MODEL_DRAW  is not None,
    })


# ---------------------------------------------------------------------------
# POST /predict
# ---------------------------------------------------------------------------

@api_blueprint.route("/predict", methods=["POST"])
def predict():
    """
    Evalue un plateau avec les deux modeles ML et retourne les probabilites.

    Corps JSON :
        {
            "board": [int x 9]   // 1 = X, -1 = O, 0 = vide
        }

    Reponse 200 :
        {
            "p_xwins": float,    // probabilite que X gagne en jeu parfait
            "p_draw":  float,    // probabilite de nulle
            "p_owins": float,    // probabilite que O gagne
            "status":  "success"
        }

    Erreur 400 si le plateau ne contient pas exactement 9 cases.
    """
    data  = request.get_json(force=True)
    board = data.get("board")

    if not board or len(board) != 9:
        return jsonify({"error": "Le plateau doit contenir exactement 9 cases."}), 400

    p_xw, p_dr = ml_score(board)
    p_ow = max(0.0, 1.0 - p_xw - p_dr)

    return jsonify({
        "p_xwins": round(p_xw, 4),
        "p_draw":  round(p_dr,  4),
        "p_owins": round(p_ow,  4),
        "status":  "success",
    })


# ---------------------------------------------------------------------------
# Utilitaire : detection des menaces immédiates
# ---------------------------------------------------------------------------

def _can_win_immediately(board: list, player: int) -> int:
    """
    Retourne l'indice de la case où `player` peut gagner immédiatement,
    ou -1 si aucune telle case n'existe.
    """
    for i in range(9):
        if board[i] == 0:
            board[i] = player
            won = check_win(board, player)
            board[i] = 0
            if won:
                return i
    return -1


# ---------------------------------------------------------------------------
# POST /best_move
# ---------------------------------------------------------------------------

@api_blueprint.route("/best_move", methods=["POST"])
def best_move():
    """
    Mode IA ML pur : evalue chaque coup legal avec les modeles ML
    et retourne l'indice du coup optimal.

    Strategie en 3 niveaux :
        1. Gagner immédiatement si possible.
        2. Bloquer la victoire immédiate de l'adversaire.
        3. Choisir le coup avec le meilleur score ML.

    Corps JSON :
        {
            "board": [int x 9],
            "turn":  int           // 1 = X joue, -1 = O joue  (defaut : -1)
        }

    Reponse 200 :
        {
            "move":   int,         // indice 0-8 du meilleur coup
            "score":  float,       // score ML associe
            "status": "success" | "terminal"
        }
    """
    data  = request.get_json(force=True)
    board = list(data.get("board", []))
    turn  = int(data.get("turn", -1))

    if len(board) != 9:
        return jsonify({"error": "Plateau invalide (9 cases requises)."}), 400

    if is_terminal(board):
        return jsonify({"move": -1, "status": "terminal"})

    # --- Niveau 1 : victoire immédiate ---
    win_move = _can_win_immediately(board, turn)
    if win_move != -1:
        return jsonify({"move": win_move, "score": 999.0, "status": "success"})

    # --- Niveau 2 : bloquer la victoire immédiate de l'adversaire ---
    block_move = _can_win_immediately(board, -turn)
    if block_move != -1:
        return jsonify({"move": block_move, "score": 998.0, "status": "success"})

    # --- Niveau 3 : meilleur coup selon le modele ML ---
    best_idx   = -1
    best_score = -9999.0

    for i in range(9):
        if board[i] == 0:
            board[i] = turn
            p_xw, p_dr = ml_score(board)
            if turn == 1:
                score = p_xw + 0.5 * p_dr
            else:
                p_ow  = max(0.0, 1.0 - p_xw - p_dr)
                score = p_ow + 0.5 * p_dr
            board[i] = 0

            if score > best_score:
                best_score = score
                best_idx   = i

    return jsonify({
        "move":   best_idx,
        "score":  round(best_score, 4),
        "status": "success",
    })


# ---------------------------------------------------------------------------
# POST /best_move_hybrid
# ---------------------------------------------------------------------------

@api_blueprint.route("/best_move_hybrid", methods=["POST"])
def best_move_hybrid():
    """
    Mode IA Hybride : Minimax-AlphaBeta complet (profondeur illimitee par defaut),
    avec les modeles ML comme fonction d'evaluation uniquement si depth est fourni
    et inferieur a la profondeur totale.

    Pour un plateau 3x3, l'espace de recherche est petit (< 9! = 362880 feuilles),
    donc Minimax complet (max_depth=9) est exact et joue de maniere optimale.
    """
    data      = request.get_json(force=True)
    board     = list(data.get("board", []))
    turn      = int(data.get("turn",  -1))
    max_depth = int(data.get("depth", 9))   # 9 = Minimax complet

    if len(board) != 9:
        return jsonify({"error": "Plateau invalide (9 cases requises)."}), 400

    if is_terminal(board):
        return jsonify({"move": -1, "status": "terminal"})

    best_idx   = -1
    best_score = -9999.0
    maximizing = (turn == 1)

    for i in range(9):
        if board[i] == 0:
            board[i] = turn

            if check_win(board, turn):
                score = 999.0
            elif 0 not in board:
                score = 0.0
            else:
                score = minimax(
                    board,
                    not maximizing,
                    -999.0, 999.0,
                    depth=1,
                    max_depth=max_depth,
                    evaluate_fn=hybrid_evaluate,
                )

            board[i] = 0

            # Minimax renvoie un score dans le referentiel global (X = +, O = -)
            # On veut maximiser du point de vue du joueur courant.
            adjusted = score if maximizing else -score

            if adjusted > best_score:
                best_score = adjusted
                best_idx   = i

    return jsonify({
        "move":   best_idx,
        "score":  round(best_score, 4),
        "status": "success",
    })
