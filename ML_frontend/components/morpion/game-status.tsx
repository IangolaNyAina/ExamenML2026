"use client";

import { cn } from "@/lib/utils";
import type { Player, GameMode } from "@/lib/morpion-ai";
import { getAIThinkingText } from "@/lib/morpion-ai";
import { Trophy, Handshake, Loader2 } from "lucide-react";

interface GameStatusProps {
  winner: Player;
  isDraw: boolean;
  currentPlayer: Player;
  gameMode: GameMode;
  isAIThinking: boolean;
  onNewGame: () => void;
  onReset: () => void;
}

export function GameStatus({
  winner,
  isDraw,
  currentPlayer,
  gameMode,
  isAIThinking,
  onNewGame,
  onReset,
}: GameStatusProps) {
  const isGameOver = winner || isDraw;
  const isAIGame = gameMode !== "human";

  const getStatusText = () => {
    if (winner) {
      if (isAIGame) {
        return winner === "X" ? "Vous avez gagné !" : "L'IA a gagné !";
      }
      return `Joueur ${winner} a gagné !`;
    }
    if (isDraw) return "Match nul !";
    if (isAIThinking) return getAIThinkingText(gameMode);
    if (isAIGame) {
      return currentPlayer === "X" ? "À vous de jouer" : "Tour de l'IA";
    }
    return `Tour du joueur ${currentPlayer}`;
  };

  const getStatusIcon = () => {
    if (winner) return <Trophy className="w-5 h-5" />;
    if (isDraw) return <Handshake className="w-5 h-5" />;
    if (isAIThinking) return <Loader2 className="w-5 h-5 animate-spin" />;
    return null;
  };

  return (
    <div className="w-full max-w-md space-y-4">
      {/* Status Message */}
      <div
        className={cn(
          "flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-lg transition-all duration-300",
          winner === "X" && "bg-[var(--player-x)]/20 text-[var(--player-x)]",
          winner === "O" && "bg-[var(--player-o)]/20 text-[var(--player-o)]",
          isDraw && "bg-muted text-muted-foreground",
          !isGameOver && currentPlayer === "X" && "bg-[var(--player-x)]/10 text-[var(--player-x)]",
          !isGameOver && currentPlayer === "O" && "bg-[var(--player-o)]/10 text-[var(--player-o)]",
          isAIThinking && "ai-thinking"
        )}
      >
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={onNewGame}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl font-semibold transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
            isGameOver
              ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-[1.02]"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          Nouvelle Partie
        </button>
        <button
          onClick={onReset}
          className="py-3 px-4 rounded-xl font-semibold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
        >
          Reset Scores
        </button>
      </div>
    </div>
  );
}
