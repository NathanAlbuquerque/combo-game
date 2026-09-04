import { Player } from "@/types/game";
import { UserCircle2 } from "lucide-react";
import { Card } from "./Card";

interface OpponentViewProps {
  player: Player;
  isActiveTurn: boolean;
  onTradeClick?: () => void;
  canTrade?: boolean;
}

export function OpponentView({ player, isActiveTurn, onTradeClick, canTrade }: OpponentViewProps) {
  return (
    <div className={`flex flex-col min-w-[140px] items-center p-3 rounded-xl border-2 transition-colors ${isActiveTurn ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}>
      <div className="flex items-center gap-2 mb-2 w-full justify-between">
        <div className="flex items-center gap-1 overflow-hidden">
          <UserCircle2 className={`w-5 h-5 shrink-0 ${isActiveTurn ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className="font-semibold text-sm truncate max-w-[80px]" title={player.name}>
            {player.name}
          </span>
        </div>
        <span className="text-xs bg-muted px-2 rounded-full font-mono">{player.hand.length} 🃏</span>
      </div>

      {/* Resumo da área de objetos */}
      <div className="flex gap-1 h-16 w-full items-center justify-center bg-black/5 dark:bg-white/5 rounded-lg p-1 overflow-hidden">
        {player.objectArea.length === 0 ? (
          <span className="text-[10px] text-muted-foreground uppercase">Mesa vazia</span>
        ) : (
          player.objectArea.slice(0, 3).map(card => (
            <div key={card.id} className="scale-75 origin-center -mx-2">
              <Card card={card} size="small" />
            </div>
          ))
        )}
        {player.objectArea.length > 3 && (
          <span className="text-xs font-bold text-muted-foreground ml-1">+{player.objectArea.length - 3}</span>
        )}
      </div>

      {/* Botão de Trocar Carta (quando for o caso) */}
      {canTrade && (
        <button 
          onClick={onTradeClick}
          className="mt-2 text-[10px] uppercase font-bold bg-primary text-primary-foreground px-3 py-1 rounded-full hover:opacity-80 active:scale-95 transition-transform"
        >
          Trocar
        </button>
      )}
    </div>
  );
}
