"""
Étape 0 — Génération du Dataset
Minimax avec Alpha-Bêta Pruning
Parcourt tous les états valides où c'est au tour de X et labellise via Minimax.
"""

import pandas as pd
import os

# ─────────────────────────────────────────────
# Utilitaires plateau
# ─────────────────────────────────────────────

WIN_STATES = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]

def check_win(board, player):
    return any(all(board[i] == player for i in line) for line in WIN_STATES)

def is_terminal(board):
    return check_win(board, 1) or check_win(board, -1) or 0 not in board

def count_pieces(board):
    x_count = board.count(1)
    o_count = board.count(-1)
    return x_count, o_count

def is_valid_state(board):
    """Un état valide : x_count == o_count (tour de X) ou x_count == o_count + 1 (tour de O)."""
    x, o = count_pieces(board)
    return x == o or x == o + 1

def x_turn(board):
    """Retourne True si c'est au tour de X."""
    x, o = count_pieces(board)
    return x == o

# ─────────────────────────────────────────────
# Minimax Alpha-Bêta
# ─────────────────────────────────────────────

def minimax(board, is_maximizing, alpha, beta):
    if check_win(board, 1):  return 1   # X gagne
    if check_win(board, -1): return -1  # O gagne
    if 0 not in board:       return 0   # Nulle

    if is_maximizing:
        best = -2
        for i in range(9):
            if board[i] == 0:
                board[i] = 1
                score = minimax(board, False, alpha, beta)
                board[i] = 0
                best = max(best, score)
                alpha = max(alpha, score)
                if beta <= alpha:
                    break
        return best
    else:
        best = 2
        for i in range(9):
            if board[i] == 0:
                board[i] = -1
                score = minimax(board, True, alpha, beta)
                board[i] = 0
                best = min(best, score)
                beta = min(beta, score)
                if beta <= alpha:
                    break
        return best

# ─────────────────────────────────────────────
# Encodage en 18 features
# ─────────────────────────────────────────────

def encode_board(board):
    """Encode un plateau en 18 colonnes binaires : c0_x, c0_o, c1_x, c1_o, ..."""
    row = []
    for i in range(9):
        row.append(1 if board[i] == 1  else 0)  # ci_x
        row.append(1 if board[i] == -1 else 0)  # ci_o
    return row

# ─────────────────────────────────────────────
# Parcours récursif de tous les états valides
# ─────────────────────────────────────────────

def generate_all_states(board, current_player, records):
    """Parcourt récursivement tous les états valides du plateau."""
    # Si c'est au tour de X → on labellise et on enregistre
    if current_player == 1 and not is_terminal(board):
        outcome = minimax(board, True, -2, 2)
        x_wins = 1 if outcome == 1 else 0
        is_draw = 1 if outcome == 0 else 0
        records.append(encode_board(board) + [x_wins, is_draw])

    if is_terminal(board):
        return

    empty = [i for i in range(9) if board[i] == 0]
    seen = set()
    for i in empty:
        board[i] = current_player
        key = tuple(board)
        if key not in seen:
            seen.add(key)
            generate_all_states(board, -current_player, records)
        board[i] = 0

# ─────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────

def generate_dataset():
    print("Génération du dataset — Minimax Alpha-Bêta sur tous les états valides...")
    records = []
    board = [0] * 9
    generate_all_states(board, 1, records)   # X commence toujours

    # Colonnes : c0_x, c0_o, c1_x, c1_o, ..., c8_x, c8_o, x_wins, is_draw
    columns = []
    for i in range(9):
        columns.extend([f'c{i}_x', f'c{i}_o'])
    columns += ['x_wins', 'is_draw']

    df = pd.DataFrame(records, columns=columns).drop_duplicates()
    os.makedirs('ressources', exist_ok=True)
    df.to_csv('ressources/dataset.csv', index=False)
    print(f"✅ Dataset généré : {len(df)} états uniques sauvegardés dans ressources/dataset.csv")
    print(f"   x_wins=1 : {df['x_wins'].sum()} | is_draw=1 : {df['is_draw'].sum()} | o_wins : {(df['x_wins']==0) & (df['is_draw']==0)}.sum()")
    return df

if __name__ == "__main__":
    generate_dataset()