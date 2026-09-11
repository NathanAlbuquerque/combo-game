import { memo } from "react";
import { Card as CardType } from "@/types/game";
import { Card } from "./Card";

interface PlayerHandProps {
  hand: CardType[];
  isActiveTurn: boolean;
  onCardClick: (card: CardType) => void;
}

export const PlayerHand = memo(function PlayerHand({ hand, isActiveTurn, onCardClick }: PlayerHandProps) {
  return (
    <div className="w-full flex justify-center items-end px-4 pt-4 pb-2">
      {hand.length === 0 ? (
        <div className="h-36 flex flex-col items-center justify-center text-muted-foreground">
          <span className="text-sm uppercase tracking-wider font-bold mb-1">Mão Vazia</span>
          {isActiveTurn && <span className="text-xs text-primary animate-pulse">Compre uma carta do baralho!</span>}
        </div>
      ) : (
        <div className="flex relative items-end justify-center max-w-full overflow-x-auto scrollbar-none px-2 pb-1">
          {hand.map((card, index) => {
            // Rotação e sobreposição dinâmicas ajustadas para a largura mobile de até 480px
            const maxArc = hand.length > 5 ? 18 : 12;
            const stepRotation = hand.length > 1 ? Math.min(5, (maxArc * 2) / (hand.length - 1)) : 0;
            const rotation = (index - (hand.length - 1) / 2) * stepRotation;
            const translateY = Math.abs(index - (hand.length - 1) / 2) * 1.5;

            // Overlap progressivo para acomodar várias cartas sem quebrar a tela
            const overlapClass =
              index === 0
                ? ""
                : hand.length <= 3
                ? "-ml-4 sm:-ml-5"
                : hand.length <= 4
                ? "-ml-6 sm:-ml-7"
                : hand.length <= 5
                ? "-ml-8 sm:-ml-9"
                : hand.length <= 6
                ? "-ml-10 sm:-ml-11"
                : "-ml-12 sm:-ml-14";
            
            return (
              <div 
                key={card.id} 
                className={`relative ${overlapClass} transition-transform duration-200 cursor-pointer hover:z-50 focus-within:z-50 ${
                  isActiveTurn
                    ? 'hover:-translate-y-6 hover:scale-105'
                    : 'opacity-85 hover:opacity-100 hover:-translate-y-4 hover:scale-102'
                }`}
                style={{ 
                  zIndex: index,
                  transform: `rotate(${rotation}deg) translateY(${translateY}px)` 
                }}
              >
                <div>
                  <Card 
                    card={card} 
                    onClick={() => onCardClick(card)} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
