"use client";

import { cn } from "@/lib/utils";
import type { GameMode } from "@/lib/morpion-ai";
import { Users, Brain, Cpu } from "lucide-react";

interface ModeSelectorProps {
  selectedMode: GameMode;
  onModeSelect: (mode: GameMode) => void;
}

const modes: { id: GameMode; label: string; description: string; icon: React.ElementType }[] = [
  {
    id: "human",
    label: "Humain vs Humain",
    description: "Deux joueurs s'affrontent",
    icon: Users,
  },
  {
    id: "ml",
    label: "Humain vs IA (ML)",
    description: "L'IA utilise des modèles ML",
    icon: Brain,
  },
  {
    id: "hybrid",
    label: "Humain vs IA (Hybride)",
    description: "Minimax + ML combinés",
    icon: Cpu,
  },
];

export function ModeSelector({ selectedMode, onModeSelect }: ModeSelectorProps) {
  return (
    <div className="w-full max-w-md space-y-3">
      <h2 className="text-sm font-medium text-muted-foreground text-center uppercase tracking-wider">
        Mode de jeu
      </h2>
      <div className="grid gap-2">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => onModeSelect(mode.id)}
              className={cn(
                "relative flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                selectedMode === mode.id
                  ? "bg-primary/10 border-primary text-foreground"
                  : "bg-secondary/30 border-border hover:bg-secondary/50 hover:border-muted-foreground/30"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-lg",
                  selectedMode === mode.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-semibold">{mode.label}</div>
                <div className="text-sm text-muted-foreground">{mode.description}</div>
              </div>
              {selectedMode === mode.id && (
                <div className="absolute right-4 w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
