/**
 * lib/morpion-ai.ts
 * Types, helpers de jeu, et appels réels au backend Flask.
 * Les fonctions mlSelectMove / hybridSelectMove ne vivent plus ici —
 * elles sont remplacées par des appels fetch directs dans morpion-game.tsx.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type Player   = 'X' | 'O' | null;
export type Board    = Player[];
export type GameMode = 'human' | 'ml' | 'hybrid';

// ── Constantes ────────────────────────────────────────────────────────────────

export const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

// ── Helpers de jeu (purement locaux, pas de ML) ────────────────────────────────

export function checkWinner(board: Board): { winner: Player; winningCombo: number[] | null } {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], winningCombo: combo };
    }
  }
  return { winner: null, winningCombo: null };
}

export function checkDraw(board: Board): boolean {
  return board.every(cell => cell !== null) && !checkWinner(board).winner;
}

export function getAvailableMoves(board: Board): number[] {
  return board.reduce((acc: number[], cell, i) => {
    if (cell === null) acc.push(i);
    return acc;
  }, []);
}

// ── Encodage plateau → format backend ─────────────────────────────────────────
// Backend attend : tableau de 9 entiers — 1=X, -1=O, 0=vide

export function encodeBoard(board: Board): number[] {
  return board.map(cell => (cell === 'X' ? 1 : cell === 'O' ? -1 : 0));
}

// ── Appels backend Flask ───────────────────────────────────────────────────────

const API_BASE = 'http://localhost:5000';

/**
 * Mode IA ML pur — POST /best_move
 * L'IA joue toujours O (-1).
 * Retourne l'index de la case choisie (0–8), ou -1 si terminal.
 */
export async function fetchBestMoveML(board: Board): Promise<number> {
  const encoded = encodeBoard(board);
  const res = await fetch(`${API_BASE}/best_move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board: encoded, turn: -1 }),  // O joue
  });
  if (!res.ok) throw new Error(`/best_move HTTP ${res.status}`);
  const data = await res.json();
  return data.move ?? -1;
}

/**
 * Mode IA Hybride — POST /best_move_hybrid
 * Minimax-AlphaBeta (profondeur 3) + ML aux feuilles.
 * Retourne l'index de la case choisie (0–8), ou -1 si terminal.
 */
export async function fetchBestMoveHybrid(board: Board): Promise<number> {
  const encoded = encodeBoard(board);
  const res = await fetch(`${API_BASE}/best_move_hybrid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board: encoded, turn: -1, depth: 3 }),  // O joue
  });
  if (!res.ok) throw new Error(`/best_move_hybrid HTTP ${res.status}`);
  const data = await res.json();
  return data.move ?? -1;
}

/**
 * Texte affiché pendant que l'IA réfléchit.
 */
export function getAIThinkingText(mode: GameMode): string {
  if (mode === 'ml')     return "IA ML analyse les positions…";
  if (mode === 'hybrid') return "Minimax + ML en cours…";
  return "";
}
