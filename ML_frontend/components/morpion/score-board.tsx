"use client";

import { cn } from "@/lib/utils";
import type { Player, GameMode } from "@/lib/morpion-ai";

interface ScoreBoardProps {
  scores: { X: number; O: number; draws: number };
  currentPlayer: Player;
  gameMode: GameMode;
  isAIThinking: boolean;
}

export function ScoreBoard({ scores, currentPlayer, gameMode, isAIThinking }: ScoreBoardProps) {
  const isAIGame = gameMode !== "human";
  
  return (
    <div className="w-full max-w-md">
      <div className="grid grid-cols-3 gap-3">
        {/* Player X */}
        <div
          className={cn(
            "relative p-4 rounded-xl border-2 text-center transition-all duration-300",
            currentPlayer === "X" && !isAIThinking
              ? "bg-[var(--player-x)]/10 border-[var(--player-x)] scale-105"
              : "bg-secondary/30 border-border"
          )}
        >
          <div className="text-2xl font-bold text-[var(--player-x)] drop-shadow-[0_0_5px_var(--player-x)]">
            X
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {isAIGame ? "Vous" : "Joueur 1"}
          </div>
          <div className="text-2xl font-bold mt-2">{scores.X}</div>
          {currentPlayer === "X" && !isAIThinking && (
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--player-x)] animate-pulse" />
          )}
        </div>

        {/* Draws */}
        <div className="p-4 rounded-xl border-2 bg-secondary/30 border-border text-center">
          <div className="text-2xl font-bold text-muted-foreground">=</div>
          <div className="text-xs text-muted-foreground mt-1">Égalités</div>
          <div className="text-2xl font-bold mt-2">{scores.draws}</div>
        </div>

        {/* Player O */}
        <div
          className={cn(
            "relative p-4 rounded-xl border-2 text-center transition-all duration-300",
            currentPlayer === "O" && !isAIThinking
              ? "bg-[var(--player-o)]/10 border-[var(--player-o)] scale-105"
              : "bg-secondary/30 border-border",
            isAIThinking && currentPlayer === "O" && "ai-thinking"
          )}
        >
          <div className="text-2xl font-bold text-[var(--player-o)] drop-shadow-[0_0_5px_var(--player-o)]">
            O
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {isAIGame ? "IA" : "Joueur 2"}
          </div>
          <div className="text-2xl font-bold mt-2">{scores.O}</div>
          {currentPlayer === "O" && !isAIThinking && (
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--player-o)] animate-pulse" />
          )}
          {isAIThinking && (
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--player-o)] animate-ping" />
          )}
        </div>
      </div>
    </div>
  );
}
