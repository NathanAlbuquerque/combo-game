"use client";

import { memo } from "react";
import { Card as CardType } from "@/types/game";
import { Card } from "./Card";
import { Button } from "@/components/ui/button";

interface DeckDiscardPilesProps {
  topDiscard?: CardType;
  deckCount: number;
  isActiveTurn: boolean;
  isMyExtraPlay: boolean;
  isTargeting: boolean;
  onDraw: () => void;
  onCancelTargeting: () => void;
}

export const DeckDiscardPiles = memo(function DeckDiscardPiles({
  topDiscard,
  deckCount,
  isActiveTurn,
  isMyExtraPlay,
  isTargeting,
  onDraw,
  onCancelTargeting,
}: DeckDiscardPilesProps) {
  const canDraw = isActiveTurn && !isMyExtraPlay;

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-2.5 py-1 shrink-0 min-h-0 select-none">
      <div className="flex gap-8 sm:gap-12 items-center justify-center">
        {/* Pilha de Descarte */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[9.5px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded-full">
            Descarte
          </span>
          <div className="h-[105px] sm:h-[115px] flex items-center justify-center">
            {topDiscard ? (
              <div className="animate-in zoom-in-90 duration-200">
                <Card card={topDiscard} size="small" />
              </div>
            ) : (
              <div className="w-[76px] sm:w-[84px] aspect-[182/252] border-2 border-dashed border-border rounded-xl flex items-center justify-center opacity-40 bg-muted">
                <span className="text-[8px] text-muted-foreground">Vazio</span>
              </div>
            )}
          </div>
        </div>

        {/* Deck Principal */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[9.5px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-0.5 rounded-full">
            Deck ({deckCount})
          </span>
          <div className="h-[135px] sm:h-[145px] flex items-center justify-center">
            <div
              className={`transition-transform duration-300 ${
                canDraw
                  ? "hover:-translate-y-2 cursor-pointer drop-shadow-md ring-4 ring-primary/50 ring-offset-2 ring-offset-background rounded-xl scale-105"
                  : "opacity-50 cursor-not-allowed grayscale"
              }`}
              onClick={() => canDraw && onDraw()}
            >
              {deckCount > 0 ? (
                <Card />
              ) : (
                <div className="w-24 sm:w-28 aspect-[182/252] border-2 border-dashed border-border rounded-xl flex items-center justify-center opacity-50 bg-muted">
                  <span className="text-[9px] text-muted-foreground uppercase tracking-widest">
                    Vazio
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controles de Targeting (Cancelar) */}
      <div className="h-7 flex items-center justify-center">
        {isTargeting && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCancelTargeting}
            className="h-7 text-xs font-bold border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground cursor-pointer"
          >
            Cancelar Escolha
          </Button>
        )}
      </div>
    </div>
  );
});
