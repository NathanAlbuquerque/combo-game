"use client";

import { memo } from "react";
import { Eye } from "lucide-react";
import { Card as CardType } from "@/types/game";
import { Card } from "./Card";
import { VICTORY_OBJECTS_REQUIRED } from "@/constants";

interface PlayerObjectsAreaProps {
  objects: CardType[];
  onInspectCard: (card: CardType) => void;
}

export const PlayerObjectsArea = memo(function PlayerObjectsArea({
  objects,
  onInspectCard,
}: PlayerObjectsAreaProps) {
  return (
    <div className="h-[210px] sm:h-[230px] border-t bg-card/40 flex flex-col p-2.5 shrink-0 shadow-inner select-none">
      <div className="flex items-center justify-between px-1 mb-1.5 shrink-0">
        <span className="text-[11px] font-black text-foreground uppercase tracking-widest flex items-center gap-1.5">
          Meus Objetos na Mesa ({objects.length}/{VICTORY_OBJECTS_REQUIRED})
        </span>
        {objects.length > 0 && (
          <span className="text-[9.5px] text-muted-foreground font-semibold flex items-center gap-1">
            <Eye className="w-3 h-3 text-primary" /> Toque para inspecionar
          </span>
        )}
      </div>

      <div className="flex gap-2.5 overflow-x-auto px-1 pb-1 pt-0.5 h-full items-center scrollbar-thin">
        {objects.length === 0 ? (
          <span className="text-xs text-muted-foreground italic w-full text-center py-6">
            Nenhum objeto baixado na mesa ainda
          </span>
        ) : (
          objects.map((card) => (
            <div
              key={card.id}
              className="shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              onClick={() => onInspectCard(card)}
              title={`Clique para inspecionar: ${card.name}`}
            >
              <Card card={card} size="normal" />
            </div>
          ))
        )}
      </div>
    </div>
  );
});
