import { GameState, Player, Card as CardType } from "@/types/game";
import { OpponentView } from "./OpponentView";
import { PlayerHand } from "./PlayerHand";
import { Card } from "./Card";
import { CardPreviewModal } from "./CardPreviewModal";
import { CopyRoomButton } from "./CopyRoomButton";
import { Button } from "@/components/ui/button";
import { HelpCircle, X, Eye, UserCircle2, Sparkles, AlertTriangle, FileText } from "lucide-react";
import { useState } from "react";

interface GameBoardProps {
  state: GameState;
  myId: string;
  roomId?: string;
  onDraw: () => void;
  onPlay: (cardId: string, targetId?: string) => void;
  onTrade: (targetPlayerId: string) => void;
  onDiscard: (cardId: string) => void;
  onResolvePendingAction?: (cardId: string) => void;
  onSkipExtraPlay?: () => void;
}

export function GameBoard({
  state,
  myId,
  roomId,
  onDraw,
  onPlay,
  onTrade,
  onDiscard,
  onResolvePendingAction,
  onSkipExtraPlay,
}: GameBoardProps) {
  const [tradingMode, setTradingMode] = useState(false);
  const [targetingCardId, setTargetingCardId] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [inspectingPlayer, setInspectingPlayer] = useState<Player | null>(null);
  const [previewCard, setPreviewCard] = useState<CardType | null>(null);

  const me = state.players[myId];
  const opponents = Object.values(state.players).filter((p) => p.id !== myId);
  
  const isGlobalHandsRevealed = Boolean(state.revealedHandsUntilTurnOfPlayerId);
  const isAnyHandRevealed = isGlobalHandsRevealed || Boolean(state.revealedPlayerIds && state.revealedPlayerIds.length > 0);
  const isMyHandRevealed = isGlobalHandsRevealed || Boolean(state.revealedPlayerIds?.includes(myId));
  
  const isMyTurn = state.currentTurnPlayerId === myId;
  const isPendingMyAction = state.pendingAction?.requiredPlayerId === myId;
  const isMyExtraPlay = state.extraPlayPlayerId === myId;
  
  // O turno é "ativo" se for minha vez normal e NÃO houver pendingAction rolando (que pausa o jogo)
  const isActiveTurn = isMyTurn && !state.pendingAction;

  const topDiscard = state.discard.length > 0 ? state.discard[state.discard.length - 1] : undefined;

  const handleResolvePending = (cardId: string) => {
    if (onResolvePendingAction) {
      onResolvePendingAction(cardId);
    } else {
      onDiscard(cardId);
    }
  };

  const handlePlayCard = (cardId: string) => {
    if (isPendingMyAction) {
      handleResolvePending(cardId);
      return;
    }

    const card = me.hand.find(c => c.id === cardId);
    if (!card) return;

    if (isMyExtraPlay) {
      if (card.type === 'object') {
        onPlay(cardId);
      }
      return;
    }
    
    const targetEffects = [
      'Senha Fraca Detectada',
      'Rede de Apoio',
      'Tomou Block!',
      'Vídeo Deepfake',
      'Esqueceu a Senha',
      'Plágio Detectado',
      'Alerta de Phishing',
      'LI E ACEITO!'
    ];
    if (card.type === 'effect' && card.name && targetEffects.includes(card.name)) {
      setTargetingCardId(cardId);
      setTradingMode(false); // desliga o trade se estivesse on
    } else {
      onPlay(cardId);
    }
  };

  const handleInspectCard = (card: CardType) => {
    if (isPendingMyAction) {
      handleResolvePending(card.id);
      return;
    }
    setPreviewCard(card);
  };

  const handleConfirmPlayFromPreview = (card: CardType) => {
    setPreviewCard(null);
    handlePlayCard(card.id);
  };

  const canPlayPreviewCard = Boolean(
    previewCard &&
    (isMyExtraPlay
      ? previewCard.type === "object"
      : isActiveTurn)
  );

  const canPlayReason = !previewCard
    ? undefined
    : !isMyTurn
    ? "Não é seu turno"
    : state.pendingAction
    ? "Ação pendente em andamento"
    : isMyExtraPlay && previewCard.type !== "object"
    ? "Apenas Cartas-Objeto na jogada extra"
    : undefined;

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
    <div className="min-h-screen w-full bg-zinc-950 bg-gradient-to-b from-zinc-900/60 via-zinc-950 to-black flex justify-center items-center overflow-x-hidden font-sans">
      <div className="w-full max-w-[440px] sm:max-w-[480px] h-[100dvh] max-h-[100dvh] bg-background shadow-2xl relative flex flex-col justify-between overflow-hidden border-x border-border/40 select-none">
        
        {/* AREA 1: Oponentes (Topo - Carrossel Compacto) */}
        <div className={`w-full border-b bg-card/40 backdrop-blur-sm shadow-xs overflow-x-auto flex items-center justify-start px-2.5 gap-2.5 py-2 shrink-0 scrollbar-none transition-all duration-300 ${
          isAnyHandRevealed ? "min-h-[185px] h-auto" : "h-[145px] sm:h-[155px]"
        }`}>
          {opponents.length === 0 ? (
            <div className="w-full text-center text-xs text-muted-foreground py-4">Esperando oponentes...</div>
          ) : (
            opponents.map(opp => {
              const isOppTurn = state.currentTurnPlayerId === opp.id;
              const isOppRevealed = isGlobalHandsRevealed || Boolean(state.revealedPlayerIds?.includes(opp.id));
              
              let actionLabel = "";
              let canClick = false;
              
              if (targetingCardId && isActiveTurn && !opp.isEliminated) {
                actionLabel = "Usar Efeito";
                canClick = true;
              } else if (tradingMode && isActiveTurn && opp.hand.length > 0 && me.hand.length > 0 && !opp.isEliminated) {
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
                  areHandsRevealed={isOppRevealed}
                  onInspect={() => setInspectingPlayer(opp)}
                />
              );
            })
          )}
        </div>

        {/* AREA 2: Mesa Central (Deck, Descarte, Info de Turno, Meus Objetos na Mesa) */}
        <div className="flex-1 w-full flex flex-col justify-between overflow-hidden relative min-h-0 bg-muted/5">
          
          {/* Topo da Mesa Central: Info do Turno / Status do Jogo / Ações Rápidas */}
          <div className="w-full px-3 pt-2 pb-1 flex flex-col gap-1.5 shrink-0 z-10 border-b border-border/30 bg-card/20 backdrop-blur-xs">
            <div className="flex items-center justify-between gap-2">
              {roomId && (
                <CopyRoomButton 
                  roomId={roomId} 
                  variant="outline" 
                  size="sm"
                  className="bg-background/90 backdrop-blur shadow-xs text-xs h-7 px-2.5 shrink-0" 
                />
              )}

              <div className="flex-1 flex justify-center px-1 overflow-hidden">
                <div className="bg-background/95 backdrop-blur-md px-3 py-1 rounded-full border shadow-xs text-center flex items-center justify-center gap-1.5 max-w-full">
                  {me?.isEliminated ? (
                    <span className="text-muted-foreground font-black text-xs">Você foi eliminado 💀</span>
                  ) : isPendingMyAction ? (
                    <span className="text-destructive font-black animate-pulse text-xs leading-none truncate">
                      {state.pendingAction?.type === 'CHOOSE_CARD_TO_DISCARD'
                        ? "🚨 Descarte 1 carta"
                        : "📜 Entregue 1 carta"}
                    </span>
                  ) : state.pendingAction ? (
                    <span className="text-amber-600 dark:text-amber-400 font-bold text-xs animate-pulse truncate">
                      Aguardando adversário...
                    </span>
                  ) : targetingCardId ? (
                    <span className="text-primary font-black animate-pulse text-xs truncate">
                      🎯 Escolha o oponente no topo!
                    </span>
                  ) : tradingMode ? (
                    <span className="text-primary font-black animate-pulse text-xs truncate">
                      🔄 Escolha o oponente para trocar!
                    </span>
                  ) : isMyExtraPlay ? (
                    <span className="text-violet-600 dark:text-violet-400 font-black animate-pulse text-xs truncate">
                      Prompt Perfeito: Baixe um Objeto!
                    </span>
                  ) : isActiveTurn ? (
                    <span className="text-primary font-black animate-pulse text-xs">Sua vez de jogar!</span>
                  ) : (
                    <span className="text-muted-foreground text-xs font-semibold truncate">
                      Vez de: {state.players[state.currentTurnPlayerId!]?.name || "..."}
                    </span>
                  )}
                </div>
              </div>

              <button 
                onClick={() => setIsHelpOpen(true)}
                className="shrink-0 bg-card border rounded-full shadow-xs hover:bg-muted transition-colors text-muted-foreground hover:text-foreground h-7 w-7 flex items-center justify-center"
                title="Como jogar"
                aria-label="Como jogar"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Action Log / Notificação de Mão Revelada */}
            <div className="flex flex-col gap-1 w-full">
              {isAnyHandRevealed && (
                <div className="flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10.5px] font-bold animate-pulse text-center">
                  <Eye className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {isGlobalHandsRevealed ? "Vazamento de Dados: Mãos Reveladas!" : "Senha Fraca: Mão Revelada!"}
                  </span>
                </div>
              )}
              
              {state.actionLog.length > 0 && (
                <div 
                  key={state.actionLog.length} 
                  className="text-[10px] sm:text-[10.5px] font-medium bg-black/80 dark:bg-white/90 text-white dark:text-black px-2.5 py-0.5 rounded-lg shadow-xs text-center truncate animate-in fade-in duration-200"
                >
                  {state.actionLog[state.actionLog.length - 1]}
                </div>
              )}
            </div>
          </div>

          {/* Pilhas Centrais (Deck e Descarte) */}
          <div className="flex-1 flex flex-col items-center justify-center gap-2 py-1.5 shrink-0 min-h-0">
            <div className="flex gap-8 sm:gap-10 items-center justify-center">
              {/* Pilha de Descarte (Miniatura) */}
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[9.5px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-0.5 rounded-full">
                  Descarte
                </span>
                <div className="h-[96px] flex items-center justify-center">
                  {topDiscard ? (
                    <div className="animate-in zoom-in-90 duration-200">
                      <Card card={topDiscard} size="small" />
                    </div>
                  ) : (
                    <div className="w-[76px] aspect-[182/252] border-2 border-dashed border-border rounded-xl flex items-center justify-center opacity-40 bg-muted">
                      <span className="text-[8px] text-muted-foreground">Vazio</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Deck Principal */}
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[9.5px] font-black text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded-full">
                  Deck ({state.deck.length})
                </span>
                <div className="h-[125px] flex items-center justify-center">
                  <div 
                    className={`transition-transform duration-300 ${
                      isActiveTurn && !isMyExtraPlay
                        ? 'hover:-translate-y-2 cursor-pointer drop-shadow-md ring-4 ring-primary/50 ring-offset-2 ring-offset-background rounded-xl scale-105'
                        : 'opacity-50 cursor-not-allowed grayscale'
                    }`}
                    onClick={() => isActiveTurn && !isMyExtraPlay && onDraw()}
                  >
                    {state.deck.length > 0 ? (
                      <Card /> // Verso
                    ) : (
                      <div className="w-24 sm:w-28 aspect-[182/252] border-2 border-dashed border-border rounded-xl flex items-center justify-center opacity-50 bg-muted">
                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest">Vazio</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Controles Extras (Modo Troca / Targeting) */}
            <div className="h-8 flex items-center justify-center">
              {(targetingCardId || tradingMode) ? (
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={cancelTargeting} className="h-7 text-xs font-bold border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground">
                    Cancelar Escolha
                  </Button>
                </div>
              ) : isActiveTurn && !isMyExtraPlay && me.hand.length > 0 && opponents.length > 0 ? (
                <Button 
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs font-bold shadow-xs hover:bg-primary/10 hover:text-primary"
                  onClick={() => setTradingMode(true)}
                >
                  Trocar Carta (Trade)
                </Button>
              ) : null}
            </div>
          </div>

          {/* Minha Área de Objetos na Mesa (MAIOR, MAIS ALTA E CONFORTÁVEL) */}
          <div className="h-[185px] sm:h-[200px] border-t bg-card/40 flex flex-col p-2 shrink-0 shadow-inner">
            <div className="flex items-center justify-between px-1 mb-1 shrink-0">
              <span className="text-[11px] font-black text-foreground uppercase tracking-widest flex items-center gap-1.5">
                Meus Objetos na Mesa ({me.objectArea.length}/6)
              </span>
              {me.objectArea.length > 0 && (
                <span className="text-[9.5px] text-muted-foreground font-semibold flex items-center gap-1">
                  <Eye className="w-3 h-3 text-primary" /> Toque para inspecionar
                </span>
              )}
            </div>

            <div className="flex gap-2.5 overflow-x-auto px-1 pb-1 pt-0.5 h-full items-center scrollbar-thin">
              {me.objectArea.length === 0 ? (
                <span className="text-xs text-muted-foreground italic w-full text-center py-6">
                  Nenhum objeto baixado na mesa ainda
                </span>
              ) : (
                me.objectArea.map(card => (
                  <div 
                    key={card.id} 
                    className="shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                    onClick={() => handleInspectCard(card)}
                    title={`Clique para inspecionar: ${card.name}`}
                  >
                    <Card card={card} size="normal" />
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* AREA 3: Minha Mão (Base Fixa) */}
        <div className="min-h-[165px] max-h-[195px] w-full border-t bg-card flex flex-col shrink-0 shadow-[0_-4px_10px_-2px_rgba(0,0,0,0.08)] z-20 overflow-visible relative">
          {/* Banner de Jogada Extra do Prompt Perfeito */}
          {isMyExtraPlay && (
            <div className="w-full bg-primary/15 border-b border-primary/30 text-foreground text-xs font-semibold py-1.5 px-3 flex items-center justify-between gap-2 animate-in fade-in shrink-0">
              <div className="flex items-center gap-1.5 truncate">
                <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 animate-pulse" />
                <span className="text-[11px] truncate">
                  <strong>Prompt Perfeito:</strong> Baixe o novo objeto!
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-6 px-2 text-[10px] font-bold border-primary text-primary hover:bg-primary hover:text-primary-foreground shrink-0 shadow-xs"
                onClick={onSkipExtraPlay}
              >
                Pular
              </Button>
            </div>
          )}

          {isMyHandRevealed && !isMyExtraPlay && (
            <div className="w-full bg-amber-500/10 border-b border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10.5px] font-semibold py-0.5 px-3 flex items-center justify-center gap-1.5 shrink-0">
              <Eye className="w-3 h-3 shrink-0" />
              <span className="truncate">
                Sua mão está visível para todos os jogadores!
              </span>
            </div>
          )}
          <PlayerHand 
            hand={me.hand} 
            isActiveTurn={isActiveTurn || isMyExtraPlay}
            onCardClick={handleInspectCard}
          />
        </div>

      {/* MODAL BLOQUEADOR DE AÇÃO PENDENTE (Phishing / LI E ACEITO!) */}
      {isPendingMyAction && state.pendingAction && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border-2 border-primary/40 text-card-foreground p-6 rounded-2xl max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col items-center text-center">
            <div className="mb-4">
              <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary mb-3">
                {state.pendingAction.type === 'CHOOSE_CARD_TO_DISCARD' ? (
                  <AlertTriangle className="w-8 h-8 text-destructive animate-bounce" />
                ) : (
                  <FileText className="w-8 h-8 text-primary animate-pulse" />
                )}
              </div>
              <h3 className="text-xl font-black text-foreground tracking-tight mb-1">
                {state.pendingAction.type === 'CHOOSE_CARD_TO_DISCARD'
                  ? '🚨 Alerta de Phishing!'
                  : '📜 LI E ACEITO!'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {state.pendingAction.type === 'CHOOSE_CARD_TO_DISCARD' ? (
                  <>Escolha <strong>1 carta</strong> da sua mão para descartar.</>
                ) : (
                  <>
                    Escolha <strong>1 carta</strong> da sua mão para entregar a{" "}
                    <strong className="text-primary">
                      {state.players[state.pendingAction.initiatorPlayerId]?.name || "adversário"}
                    </strong>.
                  </>
                )}
              </p>
            </div>

            <div className="w-full max-h-[50vh] overflow-y-auto p-3 flex flex-wrap gap-3 justify-center items-center rounded-xl bg-muted/20 border">
              {me.hand.map((card) => (
                <div
                  key={card.id}
                  className="cursor-pointer transition-transform hover:scale-105 active:scale-95 shrink-0"
                  onClick={() => handleResolvePending(card.id)}
                >
                  <Card card={card} size={me.hand.length > 4 ? "small" : "normal"} />
                </div>
              ))}
            </div>

            <span className="text-[11px] text-muted-foreground mt-4 animate-pulse">
              Clique em uma carta acima para confirmar sua escolha
            </span>
          </div>
        </div>
      )}

      {/* MODAL DE SELEÇÃO DE ALVO */}
      {targetingCardId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border text-card-foreground p-5 rounded-2xl max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={cancelTargeting}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-extrabold text-primary uppercase tracking-wider mb-1 flex items-center gap-2">
              🎯 Selecionar Alvo
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Escolha um adversário para o efeito <strong>{me.hand.find(c => c.id === targetingCardId)?.name}</strong>:
            </p>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {opponents.filter(o => !o.isEliminated).length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-4">Nenhum oponente disponível.</p>
              ) : (
                opponents.filter(o => !o.isEliminated).map(opp => (
                  <button
                    key={opp.id}
                    onClick={() => handleOpponentClick(opp.id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border bg-muted/40 hover:bg-primary/10 hover:border-primary transition-all text-left group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <UserCircle2 className="w-6 h-6 text-primary group-hover:scale-110 transition-transform shrink-0" />
                      <div className="overflow-hidden">
                        <span className="font-bold text-sm text-foreground block truncate">{opp.name}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {opp.hand.length} carta(s) na mão • {opp.objectArea.length} objeto(s)
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-primary shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform">
                      Escolher →
                    </span>
                  </button>
                ))
              )}
            </div>

            <Button variant="outline" onClick={cancelTargeting} className="w-full mt-4">
              Cancelar
            </Button>
          </div>
        </div>
      )}

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

      {/* MODAL DE INSPEÇÃO DA MESA DO OPONENTE */}
      {inspectingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border-2 border-border text-card-foreground p-6 rounded-3xl max-w-xl w-full shadow-2xl relative animate-in zoom-in-95 duration-200 flex flex-col">
            <button 
              onClick={() => setInspectingPlayer(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <UserCircle2 className="w-7 h-7 text-primary" />
              <div>
                <h3 className="text-lg font-black text-foreground">
                  Mesa de {inspectingPlayer.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {inspectingPlayer.objectArea.length} objeto(s) baixado(s) • {inspectingPlayer.hand.length} carta(s) na mão
                </p>
              </div>
            </div>

            <div className="w-full max-h-[60vh] overflow-y-auto p-4 flex flex-wrap gap-4 justify-center items-center rounded-2xl bg-muted/20 border">
              {inspectingPlayer.objectArea.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-8 text-center">
                  Este jogador ainda não baixou nenhum objeto na mesa.
                </p>
              ) : (
                inspectingPlayer.objectArea.map((card) => (
                  <div key={card.id} className="shrink-0 animate-in zoom-in-95">
                    <Card card={card} size="normal" />
                  </div>
                ))
              )}
            </div>

            <Button onClick={() => setInspectingPlayer(null)} className="w-full mt-5 font-bold">
              Fechar
            </Button>
          </div>
        </div>
      )}

      {/* MODAL DE PRÉ-VISUALIZAÇÃO E INSPEÇÃO DA CARTA */}
      <CardPreviewModal
        isOpen={Boolean(previewCard)}
        card={previewCard}
        canPlay={canPlayPreviewCard}
        canPlayReason={canPlayReason}
        onClose={() => setPreviewCard(null)}
        onConfirmPlay={handleConfirmPlayFromPreview}
      />

      </div>
    </div>
  );
}
