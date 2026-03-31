"use client";

import { cn } from "@/lib/utils";
import type { Board, Player } from "@/lib/morpion-ai";

interface GameBoardProps {
  board: Board;
  winningCombo: number[] | null;
  currentPlayer: Player;
  onCellClick: (index: number) => void;
  disabled: boolean;
}

export function GameBoard({
  board,
  winningCombo,
  currentPlayer,
  onCellClick,
  disabled,
}: GameBoardProps) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full max-w-[320px] sm:max-w-[380px] aspect-square">
      {board.map((cell, index) => (
        <button
          key={index}
          onClick={() => onCellClick(index)}
          disabled={disabled || cell !== null}
          className={cn(
            "relative aspect-square rounded-xl sm:rounded-2xl border-2 transition-all duration-200",
            "flex items-center justify-center text-4xl sm:text-5xl md:text-6xl font-bold",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
            cell === null && !disabled
              ? "bg-secondary/50 border-border hover:bg-secondary hover:border-primary/50 hover:scale-[1.02] cursor-pointer"
              : "bg-secondary/30 border-border/50",
            cell !== null && "cell-animate",
            winningCombo?.includes(index) && "win-cell border-[var(--win-glow)]"
          )}
          aria-label={`Cell ${index + 1}${cell ? `, ${cell}` : ", empty"}`}
        >
          {cell === "X" && (
            <span
              className="text-[var(--player-x)] drop-shadow-[0_0_10px_var(--player-x)]"
              aria-hidden="true"
            >
              X
            </span>
          )}
          {cell === "O" && (
            <span
              className="text-[var(--player-o)] drop-shadow-[0_0_10px_var(--player-o)]"
              aria-hidden="true"
            >
              O
            </span>
          )}
          {cell === null && !disabled && (
            <span
              className={cn(
                "absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-20 transition-opacity",
                currentPlayer === "X"
                  ? "text-[var(--player-x)]"
                  : "text-[var(--player-o)]"
              )}
            >
              {currentPlayer}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
