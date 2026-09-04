import { Card as CardType } from "@/types/game";
import { Card } from "./Card";

interface PlayerHandProps {
  hand: CardType[];
  isActiveTurn: boolean;
  onPlayCard: (cardId: string) => void;
}

export function PlayerHand({ hand, isActiveTurn, onPlayCard }: PlayerHandProps) {
  return (
    <div className="w-full flex justify-center items-end px-4 pt-4 pb-2">
      {hand.length === 0 ? (
        <div className="h-36 flex items-center justify-center text-muted-foreground text-sm uppercase tracking-wider">
          Mão Vazia
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
                className="relative -ml-6 first:ml-0 transition-transform duration-200 hover:-translate-y-6 hover:z-50 focus-within:z-50"
                style={{ 
                  zIndex: index,
                  transform: `rotate(${rotation}deg) translateY(${translateY}px)` 
                }}
              >
                <Card 
                  card={card} 
                  onClick={() => isActiveTurn && onPlayCard(card.id)} 
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
