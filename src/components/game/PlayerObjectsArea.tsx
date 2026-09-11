"use client";

import { memo } from "react";
import { Card as CardType } from "@/types/game";
import { VICTORY_OBJECTS_REQUIRED } from "@/constants";
import { CATEGORY_STYLES } from "./Card";

interface PlayerObjectsAreaProps {
  objects: CardType[];
  onInspectCard: (card: CardType) => void;
}

const CATEGORY_ASSETS: Record<string, { icon: string; emoji: string }> = {
  "SEGURANÇA DIGITAL": {
    icon: "/images/categories/seguranca.svg",
    emoji: "🛡️",
  },
  "PRIVACIDADE E PROTEÇÃO DE DADOS": {
    icon: "/images/categories/privacidade.svg",
    emoji: "🔒",
  },
  "INFORMAÇÃO E PENSAMENTO CRÍTICO": {
    icon: "/images/categories/informacao.svg",
    emoji: "💡",
  },
  "COMUNICAÇÃO E CIDADANIA DIGITAL": {
    icon: "/images/categories/cidadania.svg",
    emoji: "🌐",
  },
  "COMPETÊNCIAS E FERRAMENTAS DIGITAIS": {
    icon: "/images/categories/ferramentas.svg",
    emoji: "⚙️",
  },
  "INTELIGÊNCIA ARTIFICIAL E USO CRÍTICO": {
    icon: "/images/categories/ia.svg",
    emoji: "🤖",
  },
};

const JOKER_STYLE = {
  bg: "#7c3aed",
  border: "#a855f7",
  text: "#ffffff",
  icon: "/images/categories/coringa.svg",
  emoji: "🃏",
};

export const PlayerObjectsArea = memo(function PlayerObjectsArea({
  objects,
  onInspectCard,
}: PlayerObjectsAreaProps) {
  const totalSlots = Math.max(VICTORY_OBJECTS_REQUIRED, objects.length);

  return (
    <div className="border-t bg-card/40 flex flex-col py-2 px-3 shrink-0 shadow-inner select-none">
      <div className="flex items-center justify-between px-0.5 mb-1.5 shrink-0">
        <span className="text-[10px] sm:text-[11px] font-black text-foreground uppercase tracking-widest flex items-center gap-1.5">
          Meus Objetos na Mesa ({objects.length}/{VICTORY_OBJECTS_REQUIRED})
        </span>
      </div>

      <div className="flex gap-2 items-center overflow-x-auto scrollbar-thin px-0.5 py-0.5">
        {Array.from({ length: totalSlots }).map((_, idx) => {
          const card = objects[idx];
          if (!card) {
            return (
              <div
                key={`empty-slot-${idx}`}
                className="w-11 h-14 sm:w-12 sm:h-16 md:w-14 md:h-20 rounded-lg sm:rounded-xl border border-dashed border-border/50 bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0 text-muted-foreground/40 font-mono text-[10px] sm:text-xs font-bold"
              >
                <span>{idx + 1}</span>
              </div>
            );
          }

          const isJoker = card.type === "joker";
          const catStyle = card.category ? CATEGORY_STYLES[card.category] : null;
          const catAsset = card.category ? CATEGORY_ASSETS[card.category] : null;

          const bg = isJoker ? JOKER_STYLE.bg : catStyle?.bg || "#3b82f6";
          const border = isJoker ? JOKER_STYLE.border : catStyle?.border || "#2563eb";
          const textColor = isJoker ? JOKER_STYLE.text : catStyle?.text || "#ffffff";
          const iconUrl = isJoker ? JOKER_STYLE.icon : catAsset?.icon;
          const emoji = isJoker ? JOKER_STYLE.emoji : catAsset?.emoji || "📦";

          return (
            <div
              key={card.id}
              onClick={() => onInspectCard(card)}
              className="w-11 h-14 sm:w-12 sm:h-16 md:w-14 md:h-20 rounded-lg sm:rounded-xl border shadow-sm flex flex-col items-center justify-center p-1 cursor-pointer transition-transform hover:scale-105 active:scale-95 shrink-0 overflow-hidden relative select-none"
              style={{
                backgroundColor: bg,
                borderColor: border,
                color: textColor,
              }}
              title={card.name}
            >
              {iconUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={iconUrl}
                  alt={card.category || "Coringa"}
                  className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 object-contain drop-shadow-sm"
                  draggable={false}
                />
              ) : (
                <span className="text-base sm:text-lg md:text-xl">{emoji}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
