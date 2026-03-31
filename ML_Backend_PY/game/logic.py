"""
game/logic.py
Logique pure du Morpion : verification des victoires, etat terminal,
et algorithme Minimax avec Alpha-Beta pruning.
"""

WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
]


def check_win(board: list, player: int) -> bool:
    """Renvoie True si le joueur a une ligne gagnante."""
    return any(all(board[i] == player for i in line) for line in WIN_LINES)


def is_terminal(board: list) -> bool:
    """Renvoie True si la partie est terminee (victoire ou plateau plein)."""
    return check_win(board, 1) or check_win(board, -1) or 0 not in board


def minimax(board: list, maximizing: bool, alpha: float, beta: float,
            depth: int, max_depth: int, evaluate_fn) -> float:
    """
    Minimax Alpha-Beta recursif.
    """
    if check_win(board, 1):  return  10.0 - depth
    if check_win(board, -1): return -10.0 + depth
    if 0 not in board:       return  0.0

    if depth >= max_depth:
        return evaluate_fn(board)

    if maximizing:
        best = -999.0
        for i in range(9):
            if board[i] == 0:
                board[i] = 1
                val = minimax(board, False, alpha, beta, depth + 1, max_depth, evaluate_fn)
                board[i] = 0
                best  = max(best, val)
                alpha = max(alpha, val)
                if beta <= alpha:
                    break
        return best
    else:
        best = 999.0
        for i in range(9):
            if board[i] == 0:
                board[i] = -1
                val = minimax(board, True, alpha, beta, depth + 1, max_depth, evaluate_fn)
                board[i] = 0
                best = min(best, val)
                beta = min(beta, val)
                if beta <= alpha:
                    break
        return best
