/**
 * api.ts
 * Service layer — appels vers le backend Flask (http://localhost:5000)
 */

const API_BASE = 'http://localhost:5000';

export interface BestMoveResponse {
  move: number;
  score: number;
  status: 'success' | 'terminal';
}

export interface HealthResponse {
  status: string;
  model_xwins_loaded: boolean;
  model_draw_loaded: boolean;
}

/** Vérifie que le serveur et les modèles sont prêts */
export async function checkHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error('Backend inaccessible');
  return res.json();
}

/**
 * Mode IA ML pur — évalue chaque coup légal avec les modèles ML.
 * @param board  tableau de 9 entiers (1=X, -1=O, 0=vide)
 * @param turn   joueur courant (1=X, -1=O)
 */
export async function getBestMoveML(
  board: number[],
  turn: number
): Promise<BestMoveResponse> {
  const res = await fetch(`${API_BASE}/best_move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board, turn }),
  });
  if (!res.ok) throw new Error('Erreur /best_move');
  return res.json();
}

/**
 * Mode IA Hybride — Minimax-AlphaBeta (profondeur 3) + ML aux feuilles.
 * @param board  tableau de 9 entiers (1=X, -1=O, 0=vide)
 * @param turn   joueur courant (1=X, -1=O)
 */
export async function getBestMoveHybrid(
  board: number[],
  turn: number
): Promise<BestMoveResponse> {
  const res = await fetch(`${API_BASE}/best_move_hybrid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ board, turn }),
  });
  if (!res.ok) throw new Error('Erreur /best_move_hybrid');
  return res.json();
}
