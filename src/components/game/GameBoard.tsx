import { GameState, Player, Card as CardType } from "@/types/game";
import { OpponentView } from "./OpponentView";
import { PlayerHand } from "./PlayerHand";
import { Card } from "./Card";
import { Button } from "@/components/ui/button";
import { UserCircle2, HelpCircle, X } from "lucide-react";
import { useState } from "react";

interface GameBoardProps {
  state: GameState;
  myId: string;
  onDraw: () => void;
  onPlay: (cardId: string, targetId?: string) => void;
  onTrade: (targetPlayerId: string) => void;
  onDiscard: (cardId: string) => void;
}

export function GameBoard({ state, myId, onDraw, onPlay, onTrade, onDiscard }: GameBoardProps) {
  const [tradingMode, setTradingMode] = useState(false);
  const [targetingCardId, setTargetingCardId] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const me = state.players[myId];
  const opponents = Object.values(state.players).filter((p) => p.id !== myId);
  
  const isMyTurn = state.currentTurnPlayerId === myId;
  const isPendingMyDiscard = state.pendingAction?.playerId === myId && state.pendingAction?.type === 'discard';
  
  // O turno é "ativo" se for minha vez normal e NÃO houver pendingAction rolando (que pausa o jogo)
  const isActiveTurn = isMyTurn && !state.pendingAction;

  const topDiscard = state.discard.length > 0 ? state.discard[state.discard.length - 1] : undefined;

  const handlePlayCard = (cardId: string) => {
    if (isPendingMyDiscard) {
      onDiscard(cardId);
      return;
    }

    const card = me.hand.find(c => c.id === cardId);
    if (!card) return;
    
    const targetEffects = ['Rede de Apoio', 'Alerta de Phishing', 'Tomou Block!', 'Vídeo Deepfake', 'Esqueceu a Senha'];
    if (card.type === 'effect' && card.name && targetEffects.includes(card.name)) {
      setTargetingCardId(cardId);
      setTradingMode(false); // desliga o trade se estivesse on
    } else {
      onPlay(cardId);
    }
  };

  const handleOpponentClick = (targetId: string) => {
    if (targetingCardId) {
      onPlay(targetingCardId, targetId);
      setTargetingCardId(null);
    } else if (tradingMode) {
      onTrade(targetId);
      setTradingMode(false);
    }
  };

  const cancelTargeting = () => {
    setTargetingCardId(null);
    setTradingMode(false);
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-zinc-50 dark:bg-black overflow-hidden font-sans">
      
      {/* AREA 1: Oponentes (Topo) */}
      <div className="h-1/5 min-h-[140px] w-full border-b bg-card/50 shadow-sm overflow-x-auto flex items-center px-4 gap-4 py-2 shrink-0">
        {opponents.length === 0 ? (
          <div className="w-full text-center text-sm text-muted-foreground">Esperando oponentes...</div>
        ) : (
          opponents.map(opp => {
            const isOppTurn = state.currentTurnPlayerId === opp.id;
            
            let actionLabel = "";
            let canClick = false;
            
            if (targetingCardId && isActiveTurn) {
              actionLabel = "Usar Efeito";
              canClick = true;
            } else if (tradingMode && isActiveTurn && opp.hand.length > 0 && me.hand.length > 0) {
              actionLabel = "Trocar";
              canClick = true;
            }

            return (
              <OpponentView 
                key={opp.id} 
                player={opp} 
                isActiveTurn={isOppTurn}
                actionLabel={actionLabel}
                onActionClick={canClick ? () => handleOpponentClick(opp.id) : undefined}
              />
            );
          })
        )}
      </div>

      {/* AREA 2: Mesa Central (Deck, Descarte, Info de Turno, Minha Área) */}
      <div className="flex-1 w-full flex flex-col relative overflow-hidden">
        
        {/* Info do Turno / Status do Jogo */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex w-full max-w-xl px-4 justify-between items-start">
          <div className="flex-1 flex justify-center">
            <div className="bg-background/90 backdrop-blur px-6 py-2 rounded-full border shadow-sm text-center transition-all duration-300 flex flex-col items-center gap-2">
              {me?.isEliminated ? (
                <span className="text-muted-foreground font-bold text-sm">Você foi eliminado 💀</span>
              ) : isPendingMyDiscard ? (
                <span className="text-destructive font-bold animate-pulse text-sm">DESCARTE UMA CARTA AGORA!</span>
              ) : state.pendingAction ? (
                <span className="text-amber-500 font-bold text-sm">Pausado: Aguardando descarte...</span>
              ) : isActiveTurn ? (
                <span className="text-primary font-bold animate-pulse text-sm">Sua vez!</span>
              ) : (
                <span className="text-muted-foreground text-sm">Vez de: {state.players[state.currentTurnPlayerId!]?.name}</span>
              )}
              
              {/* Action Log (Mostra a última ação com animação de entrada) */}
              {state.actionLog.length > 0 && (
                <div 
                  key={state.actionLog.length} 
                  className="text-[11px] font-mono bg-black/80 dark:bg-white/90 text-white dark:text-black px-4 py-1.5 rounded-full shadow-lg max-w-sm text-center truncate animate-in fade-in slide-in-from-top-2 duration-300"
                >
                  {state.actionLog[state.actionLog.length - 1]}
                </div>
              )}
            </div>
          </div>
          
          {/* Botão de Ajuda */}
          <button 
            onClick={() => setIsHelpOpen(true)}
            className="shrink-0 bg-card border rounded-full p-2 shadow-sm hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Pilhas Centrais */}
        <div className="flex-1 flex flex-col items-center justify-center gap-8 pt-10">
          
          <div className="flex gap-12 items-center">
            {/* Pilha de Descarte (Miniatura) */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded-full">Descarte</span>
              <div className="h-[100px] flex items-center justify-center">
                {topDiscard ? (
                  <div className="animate-in zoom-in-90 duration-200">
                    <Card card={topDiscard} size="small" />
                  </div>
                ) : (
                  <div className="w-16 aspect-[5/7] border-2 border-dashed border-border rounded-xl flex items-center justify-center opacity-50 bg-muted">
                    <span className="text-[8px] text-muted-foreground">Vazio</span>
                  </div>
                )}
              </div>
            </div>

            {/* Deck Principal */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full">Deck ({state.deck.length})</span>
              <div className="h-[140px] flex items-center justify-center">
                <div 
                  className={`transition-transform duration-300 ${isActiveTurn ? 'hover:-translate-y-2 cursor-pointer drop-shadow-md ring-4 ring-primary/50 ring-offset-2 ring-offset-background rounded-xl scale-105' : 'opacity-50 cursor-not-allowed grayscale'}`}
                  onClick={() => isActiveTurn && onDraw()}
                >
                  {state.deck.length > 0 ? (
                    <Card /> // Verso
                  ) : (
                    <div className="w-28 sm:w-32 aspect-[5/7] border-2 border-dashed border-border rounded-xl flex items-center justify-center opacity-50 bg-muted">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Vazio</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Controles Extras (Modo Troca / Targeting) */}
          <div className="h-10 flex items-center justify-center mt-2">
            {(targetingCardId || tradingMode) && (
              <div className="flex flex-col items-center">
                <span className="text-xs text-primary font-bold animate-pulse mb-1">
                  Selecione um oponente no topo!
                </span>
                <Button variant="outline" size="sm" onClick={cancelTargeting}>
                  Cancelar Escolha
                </Button>
              </div>
            )}

            {isActiveTurn && !targetingCardId && !tradingMode && me.hand.length > 0 && opponents.length > 0 && (
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setTradingMode(true)}
              >
                Trocar Carta (Trade)
              </Button>
            )}
          </div>

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
          isActiveTurn={isActiveTurn || isPendingMyDiscard}
          onPlayCard={handlePlayCard}
        />
      </div>

      {/* MODAL COMO JOGAR */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border text-card-foreground p-6 rounded-2xl max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsHelpOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-black text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <HelpCircle className="w-6 h-6" />
              Como Jogar
            </h3>
            
            <div className="space-y-4 text-sm">
              <div>
                <strong className="text-foreground block mb-1">1. Objetivo Principal</strong>
                <p className="text-muted-foreground leading-snug">
                  Seja o primeiro a baixar <span className="text-primary font-bold">5 categorias diferentes</span> de objetos na sua área da mesa.
                </p>
              </div>
              
              <div>
                <strong className="text-foreground block mb-1">2. No Seu Turno</strong>
                <p className="text-muted-foreground leading-snug">
                  Você pode escolher uma ação: comprar uma carta do deck principal, jogar (baixar um objeto novo na mesa ou ativar um efeito da sua mão) ou trocar cartas.
                </p>
              </div>
              
              <div>
                <strong className="text-foreground block mb-1">3. Coringas Mágicos</strong>
                <p className="text-muted-foreground leading-snug">
                  As cartas Coringas valem por <span className="font-bold underline">qualquer</span> categoria que você ainda não possua na sua mesa, ajudando muito no combo final.
                </p>
              </div>
            </div>

            <Button onClick={() => setIsHelpOpen(false)} className="w-full mt-6">Entendi!</Button>
          </div>
        </div>
      )}

    </div>
  );
}
