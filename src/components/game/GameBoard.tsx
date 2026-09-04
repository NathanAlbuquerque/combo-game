import { GameState, Player, Card as CardType } from "@/types/game";
import { OpponentView } from "./OpponentView";
import { PlayerHand } from "./PlayerHand";
import { Card } from "./Card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface GameBoardProps {
  state: GameState;
  myId: string;
  onDraw: () => void;
  onPlay: (cardId: string) => void;
  onTrade: (targetPlayerId: string) => void;
}

export function GameBoard({ state, myId, onDraw, onPlay, onTrade }: GameBoardProps) {
  const [tradingMode, setTradingMode] = useState(false);

  const me = state.players[myId];
  const opponents = Object.values(state.players).filter((p) => p.id !== myId);
  const isActiveTurn = state.currentTurnPlayerId === myId;
  const topDiscard = state.discard.length > 0 ? state.discard[state.discard.length - 1] : undefined;

  const handleTradeClick = (targetId: string) => {
    onTrade(targetId);
    setTradingMode(false);
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-zinc-50 dark:bg-black overflow-hidden font-sans">
      
      {/* AREA 1: Oponentes (Topo) */}
      <div className="h-1/5 min-h-[140px] w-full border-b bg-card/50 shadow-sm overflow-x-auto flex items-center px-4 gap-4 py-2 shrink-0">
        {opponents.length === 0 ? (
          <div className="w-full text-center text-sm text-muted-foreground">Esperando oponentes...</div>
        ) : (
          opponents.map(opp => (
            <OpponentView 
              key={opp.id} 
              player={opp} 
              isActiveTurn={state.currentTurnPlayerId === opp.id}
              canTrade={tradingMode && isActiveTurn && opp.hand.length > 0 && me.hand.length > 0}
              onTradeClick={() => handleTradeClick(opp.id)}
            />
          ))
        )}
      </div>

      {/* AREA 2: Mesa Central (Deck, Descarte, Info de Turno, Minha Área) */}
      <div className="flex-1 w-full flex flex-col relative overflow-hidden">
        
        {/* Info do Turno */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-background/80 backdrop-blur px-4 py-1.5 rounded-full border shadow-sm">
          <p className="text-sm font-semibold">
            {isActiveTurn ? (
              <span className="text-primary animate-pulse">Sua vez!</span>
            ) : (
              <span className="text-muted-foreground">Vez de: {state.players[state.currentTurnPlayerId!]?.name}</span>
            )}
          </p>
        </div>

        {/* Pilhas Centrais */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 pt-8">
          
          <div className="flex gap-8 items-center">
            {/* Pilha de Descarte */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Descarte</span>
              {topDiscard ? (
                <Card card={topDiscard} />
              ) : (
                <div className="w-24 h-36 border-2 border-dashed border-border rounded-xl flex items-center justify-center opacity-50">
                  <span className="text-xs text-muted-foreground">Vazio</span>
                </div>
              )}
            </div>

            {/* Deck Principal */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Deck ({state.deck.length})</span>
              <div 
                className={`transition-transform ${isActiveTurn ? 'hover:-translate-y-2 cursor-pointer' : 'opacity-80'}`}
                onClick={() => isActiveTurn && onDraw()}
              >
                {state.deck.length > 0 ? (
                  <Card /> // Verso
                ) : (
                  <div className="w-24 h-36 border-2 border-dashed border-border rounded-xl flex items-center justify-center opacity-50">
                    <span className="text-xs text-muted-foreground">Vazio</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Controles Extras (Modo Troca) */}
          {isActiveTurn && me.hand.length > 0 && opponents.length > 0 && (
            <Button 
              variant={tradingMode ? "default" : "outline"}
              size="sm"
              onClick={() => setTradingMode(!tradingMode)}
              className="mt-2"
            >
              {tradingMode ? "Cancele a Escolha" : "Trocar Carta (Trade)"}
            </Button>
          )}

        </div>

        {/* Minha Área de Objetos */}
        <div className="h-1/4 min-h-[130px] border-t bg-card/30 flex flex-col p-2">
          <span className="text-[10px] font-bold text-muted-foreground uppercase mb-2 px-2 tracking-widest">Meus Objetos na Mesa</span>
          <div className="flex gap-2 overflow-x-auto px-2 pb-2 h-full items-center">
            {me.objectArea.length === 0 ? (
              <span className="text-xs text-muted-foreground italic w-full text-center">Nenhum objeto baixado</span>
            ) : (
              me.objectArea.map(card => (
                <div key={card.id} className="shrink-0">
                  <Card card={card} />
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* AREA 3: Minha Mão (Base) */}
      <div className="h-1/4 max-h-[180px] w-full border-t bg-card flex flex-col shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
        <PlayerHand 
          hand={me.hand} 
          isActiveTurn={isActiveTurn}
          onPlayCard={onPlay}
        />
      </div>

    </div>
  );
}
