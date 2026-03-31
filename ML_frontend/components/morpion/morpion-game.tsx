"use client";

/**
 * morpion-game.tsx
 * Composant principal du jeu Morpion.
 *
 * Modes IA :
 *  - "ml"     → appel POST /best_move     (IA ML pure, backend Flask)
 *  - "hybrid" → appel POST /best_move_hybrid (Minimax + ML, backend Flask)
 *
 * L'IA locale a été entièrement supprimée.
 * Toute décision de l'IA passe par le backend Python.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import type { Board, Player, GameMode } from "@/lib/morpion-ai";
import {
  checkWinner,
  checkDraw,
  fetchBestMoveML,
  fetchBestMoveHybrid,
} from "@/lib/morpion-ai";
import { GameBoard }    from "./game-board";
import { ModeSelector } from "./mode-selector";
import { ScoreBoard }   from "./score-board";
import { GameStatus }   from "./game-status";
import { cn }           from "@/lib/utils";

const INITIAL_BOARD: Board = Array(9).fill(null);

export function MorpionGame() {
  const [board, setBoard]               = useState<Board>(INITIAL_BOARD);
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");
  const [gameMode, setGameMode]         = useState<GameMode>("human");
  const [scores, setScores]             = useState({ X: 0, O: 0, draws: 0 });
  const [winningCombo, setWinningCombo] = useState<number[] | null>(null);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [gameStarted, setGameStarted]   = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  // Garde pour éviter les appels double en mode StrictMode
  const aiInProgress = useRef(false);

  const { winner } = checkWinner(board);
  const isDraw     = checkDraw(board);
  const isGameOver = !!winner || isDraw;

  // ── Clic humain ─────────────────────────────────────────────────────────────
  const handleCellClick = useCallback(
    (index: number) => {
      if (board[index] || isGameOver || isAIThinking) return;
      // En mode IA, seul X (humain) peut cliquer
      if ((gameMode === "ml" || gameMode === "hybrid") && currentPlayer !== "X") return;

      const newBoard = [...board] as Board;
      newBoard[index] = currentPlayer;
      setBoard(newBoard);
      setBackendError(null);

      const result = checkWinner(newBoard);
      if (result.winner) {
        setWinningCombo(result.winningCombo);
        setScores(prev => ({ ...prev, [result.winner as "X" | "O"]: prev[result.winner as "X" | "O"] + 1 }));
        return;
      }
      if (checkDraw(newBoard)) {
        setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
        return;
      }

      setCurrentPlayer(currentPlayer === "X" ? "O" : "X");
    },
    [board, currentPlayer, isGameOver, isAIThinking, gameMode]
  );

  // ── Tour de l'IA : appel au backend ─────────────────────────────────────────
  useEffect(() => {
    // Ne rien faire si : mode humain, partie terminée, pas au tour d'O, déjà en cours
    if (gameMode === "human")     return;
    if (currentPlayer !== "O")    return;
    if (isGameOver)               return;
    if (aiInProgress.current)     return;
    // Plateau vide = humain n'a pas encore joué
    if (board.every(c => c === null)) return;

    aiInProgress.current = true;
    setIsAIThinking(true);
    setBackendError(null);

    const fetchMove = gameMode === "ml" ? fetchBestMoveML : fetchBestMoveHybrid;

    fetchMove(board)
      .then(move => {
        if (move === -1) {
          // Terminal selon le backend
          setIsAIThinking(false);
          aiInProgress.current = false;
          return;
        }

        const newBoard = [...board] as Board;
        newBoard[move] = "O";
        setBoard(newBoard);

        const result = checkWinner(newBoard);
        if (result.winner) {
          setWinningCombo(result.winningCombo);
          setScores(prev => ({ ...prev, O: prev.O + 1 }));
        } else if (checkDraw(newBoard)) {
          setScores(prev => ({ ...prev, draws: prev.draws + 1 }));
        } else {
          setCurrentPlayer("X");
        }
      })
      .catch(err => {
        console.error("Erreur backend IA :", err);
        setBackendError(
          "❌ Impossible de joindre le backend Flask (http://localhost:5000). " +
          "Lancez : venv\\Scripts\\python.exe app.py"
        );
      })
      .finally(() => {
        setIsAIThinking(false);
        aiInProgress.current = false;
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayer, gameMode, isGameOver]);
  // Note : on dépend de currentPlayer (déclenche l'effet quand c'est au tour d'O)
  // et non de `board` pour éviter les double-déclenchements.

  // ── Nouvelle partie ──────────────────────────────────────────────────────────
  const handleNewGame = useCallback(() => {
    setBoard(INITIAL_BOARD);
    setCurrentPlayer("X");
    setWinningCombo(null);
    setIsAIThinking(false);
    setBackendError(null);
    aiInProgress.current = false;
    setGameStarted(true);
  }, []);

  // ── Réinitialisation complète ────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    setBoard(INITIAL_BOARD);
    setCurrentPlayer("X");
    setWinningCombo(null);
    setScores({ X: 0, O: 0, draws: 0 });
    setIsAIThinking(false);
    setBackendError(null);
    aiInProgress.current = false;
    setGameStarted(false);
  }, []);

  // ── Changement de mode ───────────────────────────────────────────────────────
  const handleModeChange = useCallback((mode: GameMode) => {
    setGameMode(mode);
    setBoard(INITIAL_BOARD);
    setCurrentPlayer("X");
    setWinningCombo(null);
    setIsAIThinking(false);
    setBackendError(null);
    aiInProgress.current = false;
    setGameStarted(false);
  }, []);

  // ── Rendu ────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold text-[var(--player-x)]">X</span>
              <span className="text-2xl font-bold text-muted-foreground">/</span>
              <span className="text-2xl font-bold text-[var(--player-o)]">O</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Morpion</h1>
              <p className="text-xs text-muted-foreground">ISPM Hackathon · IA ML</p>
            </div>
          </div>

          {/* Badge mode courant */}
          <span
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium",
              gameMode === "human"  && "bg-secondary text-secondary-foreground",
              gameMode === "ml"     && "bg-primary/20 text-primary",
              gameMode === "hybrid" && "bg-accent/20 text-accent"
            )}
          >
            {gameMode === "human" ? "PvP" : gameMode === "ml" ? "vs ML" : "vs Hybride"}
          </span>
        </div>
      </header>

      {/* Bannière d'erreur backend */}
      {backendError && (
        <div className="bg-destructive/15 border-b border-destructive/30 text-destructive text-sm px-4 py-2 text-center">
          {backendError}
        </div>
      )}

      {/* Contenu principal */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-8">

        {!gameStarted ? (
          // ── Écran de sélection du mode ──────────────────────────────────────
          <div className="flex flex-col items-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-balance">Bienvenue au Morpion</h2>
              <p className="text-muted-foreground">Choisissez votre mode de jeu</p>
            </div>

            <ModeSelector selectedMode={gameMode} onModeSelect={handleModeChange} />

            {/* Info backend pour les modes IA */}
            {gameMode !== "human" && (
              <p className="text-xs text-muted-foreground text-center max-w-sm">
                ⚡ L&apos;IA utilise le backend Flask sur{" "}
                <code className="bg-muted px-1 rounded">localhost:5000</code>.
                Assurez-vous qu&apos;il est démarré avant de jouer.
              </p>
            )}

            <button
              onClick={handleNewGame}
              className="mt-4 py-4 px-8 rounded-xl font-bold text-lg bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
            >
              Commencer la partie
            </button>
          </div>

        ) : (
          // ── Écran de jeu ────────────────────────────────────────────────────
          <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <ScoreBoard
              scores={scores}
              currentPlayer={currentPlayer}
              gameMode={gameMode}
              isAIThinking={isAIThinking}
            />

            <GameBoard
              board={board}
              winningCombo={winningCombo}
              currentPlayer={currentPlayer}
              onCellClick={handleCellClick}
              disabled={isGameOver || isAIThinking}
            />

            <GameStatus
              winner={winner}
              isDraw={isDraw}
              currentPlayer={currentPlayer}
              gameMode={gameMode}
              isAIThinking={isAIThinking}
              onNewGame={handleNewGame}
              onReset={handleReset}
            />

            <button
              onClick={() => setGameStarted(false)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
            >
              Changer de mode
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 px-4 text-center text-sm text-muted-foreground">
        {gameMode === "ml" && (
          <p>
            <span className="font-medium text-primary">Mode ML :</span>{" "}
            L&apos;IA appelle <code className="bg-muted px-1 rounded">/best_move</code>{" "}
            — Random Forest + Gradient Boosting entraînés sur toutes les positions optimales.
          </p>
        )}
        {gameMode === "hybrid" && (
          <p>
            <span className="font-medium text-accent">Mode Hybride :</span>{" "}
            Minimax-AlphaBeta (profondeur 3) via{" "}
            <code className="bg-muted px-1 rounded">/best_move_hybrid</code>{" "}
            + ML comme fonction d&apos;évaluation des feuilles.
          </p>
        )}
        {gameMode === "human" && (
          <p>
            <span className="font-medium">Mode PvP :</span>{" "}
            Deux joueurs humains s&apos;affrontent — aucun appel backend.
          </p>
        )}
      </footer>
    </div>
  );
}
