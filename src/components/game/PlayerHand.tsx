import { Card as CardType } from "@/types/game";
import { Card } from "./Card";

interface PlayerHandProps {
  hand: CardType[];
  isActiveTurn: boolean;
  onCardClick: (card: CardType) => void;
}

export function PlayerHand({ hand, isActiveTurn, onCardClick }: PlayerHandProps) {
  return (
    <div className="w-full flex justify-center items-end px-4 pt-4 pb-2">
      {hand.length === 0 ? (
        <div className="h-36 flex flex-col items-center justify-center text-muted-foreground">
          <span className="text-sm uppercase tracking-wider font-bold mb-1">Mão Vazia</span>
          {isActiveTurn && <span className="text-xs text-primary animate-pulse">Compre uma carta do baralho!</span>}
        </div>
      ) : (
        <div className="flex relative items-end" style={{ width: Math.min(hand.length * 60 + 40, 100) + '%' }}>
          {hand.map((card, index) => {
            // Se houver muitas cartas, aplicamos overlap dinâmico
            const rotation = (index - (hand.length - 1) / 2) * 5;
            const translateY = Math.abs(index - (hand.length - 1) / 2) * 2;
            
            return (
              <div 
                key={card.id} 
                className={`relative -ml-6 first:ml-0 transition-transform duration-200 cursor-pointer hover:z-50 focus-within:z-50 ${
                  isActiveTurn
                    ? 'hover:-translate-y-6'
                    : 'opacity-85 hover:opacity-100 hover:-translate-y-4'
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
}
