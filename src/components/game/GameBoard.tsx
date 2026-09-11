"use client";

import { GameState, Card as CardType } from "@/types/game";
import { OpponentView } from "./OpponentView";
import { PlayerHand } from "./PlayerHand";
import { Card } from "./Card";
import { CardPreviewModal } from "./CardPreviewModal";
import { CopyRoomButton } from "./CopyRoomButton";
import { Button } from "@/components/ui/button";
import {
  HelpCircle,
  X,
  Eye,
  UserCircle2,
  Sparkles,
  AlertTriangle,
  FileText,
  Users,
  Trophy,
  History,
  LogOut,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { RoomPlayersDrawer } from "./RoomPlayersDrawer";
import { LeaderboardModal } from "./LeaderboardModal";

function playTurnNotificationSound() {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Arpejo senoidal C5 (523.25 Hz) -> G5 (783.99 Hz) sintetizado nativamente (~0.35s)
    const notes = [
      { freq: 523.25, start: 0, duration: 0.16, gain: 0.2 },
      { freq: 783.99, start: 0.14, duration: 0.22, gain: 0.25 },
    ];

    notes.forEach(({ freq, start, duration, gain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + start);

      gainNode.gain.setValueAtTime(0, now + start);
      gainNode.gain.linearRampToValueAtTime(gain, now + start + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now + start);
      osc.stop(now + start + duration);
    });

    // Auto-fechamento do contexto de áudio após o término do arpejo
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 450);
  } catch (err) {
    console.debug("Web Audio unavailable or blocked", err);
  }
}

function triggerTurnHaptics() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate([100, 50, 100]);
    } catch {
      // Ignora silenciosamente se houver restrição no dispositivo
    }
  }
}

interface GameBoardProps {
  state: GameState;
  myId: string;
  roomId?: string;
  onDraw: () => void;
  onPlay: (cardId: string, targetId?: string) => void;
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
  onDiscard,
  onResolvePendingAction,
  onSkipExtraPlay,
}: GameBoardProps) {
  const [targetingCardId, setTargetingCardId] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isPlayersDrawerOpen, setIsPlayersDrawerOpen] = useState(false);
  const [inspectingPlayerId, setInspectingPlayerId] = useState<string | null>(null);
  const [previewCard, setPreviewCard] = useState<CardType | null>(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [mobileToast, setMobileToast] = useState<string | null>(null);
  
  const router = useRouter();
  const lastLogLengthRef = useRef(state.actionLog.length);
  const logEndRef = useRef<HTMLDivElement>(null);

  const me = state.players[myId];
  const isSpectator = Boolean(me?.isSpectating);
  const inspectingPlayer = inspectingPlayerId ? state.players[inspectingPlayerId] : null;

  // Jogadores ativos da partida (exclui espectadores para não poluir o carrossel de oponentes)
  const activePlayers = Object.values(state.players).filter((p) => !p.isSpectating);
  const opponents = isSpectator
    ? activePlayers
    : activePlayers.filter((p) => p.id !== myId);
  
  const isGlobalHandsRevealed = Boolean(state.revealedHandsUntilTurnOfPlayerId);
  const isAnyHandRevealed = isGlobalHandsRevealed || Boolean(state.revealedPlayerIds && state.revealedPlayerIds.length > 0);
  const isMyHandRevealed = isGlobalHandsRevealed || Boolean(state.revealedPlayerIds?.includes(myId));
  
  const isMyTurn = state.currentTurnPlayerId === myId;
  const isPendingMyAction = state.pendingAction?.requiredPlayerId === myId;
  const isMyExtraPlay = state.extraPlayPlayerId === myId;
  
  // O turno é "ativo" se for minha vez normal e NÃO houver pendingAction rolando (que pausa o jogo)
  const isActiveTurn = isMyTurn && !state.pendingAction && !isSpectator;
  const isMyTurnActive = Boolean((isActiveTurn || isMyExtraPlay) && !me?.isEliminated && !isSpectator && !state.pendingAction);

  // Efeito sonoro nativo sintetizado (Web Audio) e feedback tátil (Vibration API) na troca de turno
  const wasTurnActiveRef = useRef(false);
  const wasExtraPlayRef = useRef(false);

  useEffect(() => {
    const becameMyTurn = isMyTurnActive && !wasTurnActiveRef.current;
    const becameExtraPlay = isMyExtraPlay && !wasExtraPlayRef.current;

    if (becameMyTurn || becameExtraPlay) {
      playTurnNotificationSound();
      triggerTurnHaptics();
    }

    wasTurnActiveRef.current = isMyTurnActive;
    wasExtraPlayRef.current = Boolean(isMyExtraPlay);
  }, [isMyTurnActive, isMyExtraPlay]);

  useEffect(() => {
    if (state.actionLog.length > 0 && state.actionLog.length !== lastLogLengthRef.current) {
      lastLogLengthRef.current = state.actionLog.length;
      const latest = state.actionLog[state.actionLog.length - 1];
      const showTimer = setTimeout(() => {
        setMobileToast(latest);
      }, 0);
      const hideTimer = setTimeout(() => {
        setMobileToast(null);
      }, 4000);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [state.actionLog]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state.actionLog.length]);

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
    }
  };

  const cancelTargeting = () => {
    setTargetingCardId(null);
  };

  return (
    <div className="min-h-screen w-full bg-zinc-950 bg-gradient-to-b from-zinc-900/60 via-zinc-950 to-black flex justify-center items-center overflow-x-hidden font-sans relative">
      <div className="w-full flex justify-center items-stretch h-[100dvh] max-h-[100dvh]">
        
        {/* ========================================================= */}
        {/* FLANCO ESQUERDO (Desktop: hidden lg:flex) */}
        {/* ========================================================= */}
        <aside className="hidden lg:flex flex-col w-[220px] xl:w-[240px] p-3.5 py-4 shrink-0 justify-between gap-3 select-none">
          {/* Cabeçalho com Código da Sala e Copiar Link */}
          <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-3.5 shadow-md space-y-2.5 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Código da Sala
              </span>
              <span className="font-mono font-black text-sm text-primary tracking-widest">
                #{roomId || "---"}
              </span>
            </div>
            {roomId && (
              <CopyRoomButton
                roomId={roomId}
                variant="secondary"
                size="sm"
                className="w-full justify-center font-bold text-xs h-8 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-100 border-zinc-700 cursor-pointer"
              />
            )}
          </div>

          {/* Painel Dedicado de Histórico de Jogadas */}
          <div className="flex-1 flex flex-col min-h-0 bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-3.5 shadow-xl">
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                <span className="text-xs font-black uppercase tracking-wider text-zinc-200">
                  Histórico
                </span>
              </div>
              {state.actionLog.length > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-bold">
                  {state.actionLog.length}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              {state.actionLog.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-3 text-zinc-500 text-xs gap-1.5">
                  <History className="w-7 h-7 opacity-30" />
                  <span>Aguardando o início das jogadas...</span>
                </div>
              ) : (
                state.actionLog.map((log, index) => (
                  <div
                    key={index}
                    className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-[11px] leading-snug text-zinc-300 animate-in fade-in duration-200 shadow-2xs"
                  >
                    <span className="text-[9.5px] font-mono font-bold text-zinc-500 block mb-0.5">
                      #{index + 1}
                    </span>
                    <p className="break-words font-medium">{log}</p>
                  </div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* CONTÊINER CENTRAL DO JOGO (Mobile & Desktop) */}
        {/* ========================================================= */}
        <div className="w-full max-w-[440px] sm:max-w-[480px] h-[100dvh] max-h-[100dvh] bg-background shadow-2xl relative flex flex-col justify-between overflow-hidden border-x border-border/40 select-none shrink-0">
          
          {/* Banner Flutuante de Modo Espectador */}
          {isSpectator && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-[400px] bg-amber-500 text-amber-950 font-black text-xs px-3.5 py-2 rounded-2xl shadow-xl border border-amber-400/90 backdrop-blur-md flex items-center justify-between gap-2 animate-in slide-in-from-top-3 duration-300">
              <div className="flex items-center gap-2 truncate">
                <span className="text-base shrink-0">👁️</span>
                <span className="truncate">
                  Partida em andamento • Você entrará na próxima rodada!
                </span>
              </div>
              <span className="text-[10px] bg-amber-600/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
                Espectador
              </span>
            </div>
          )}

          {/* Toast Flutuante de ActionLog no Mobile (lg:hidden) */}
          {mobileToast && (
            <div
              onClick={() => setMobileToast(null)}
              className="lg:hidden absolute top-12 left-1/2 -translate-x-1/2 z-40 max-w-[90%] bg-zinc-950/95 text-white border border-zinc-700/80 px-3 py-1.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200 cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              <span className="text-[10.5px] font-medium truncate">{mobileToast}</span>
              <X className="w-3 h-3 text-zinc-400 hover:text-white shrink-0 ml-1" />
            </div>
          )}

          {/* Notificação Flutuante de Mão Revelada */}
          {isAnyHandRevealed && (
            <div className="absolute top-11 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex items-center justify-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-500 text-[10px] font-bold shadow-md backdrop-blur-md animate-pulse">
              <Eye className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {isGlobalHandsRevealed ? "Vazamento de Dados: Mãos Reveladas!" : "Senha Fraca: Mão Revelada!"}
              </span>
            </div>
          )}

          {/* AREA 1: Oponentes (Topo - Carrossel Flexível com Sinalizadores de Rolagem) */}
          <div className="relative w-full border-b bg-card/40 backdrop-blur-sm shadow-xs shrink-0">
            {/* Sombras sutis nas bordas para indicar rolagem horizontal quando houver múltiplos oponentes */}
            {opponents.length >= 2 && (
              <>
                <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-background/90 via-background/40 to-transparent z-10" />
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-background/90 via-background/40 to-transparent z-10" />
              </>
            )}

            <div className={`w-full overflow-x-auto flex items-stretch justify-start px-3 gap-2.5 py-2.5 shrink-0 scrollbar-none transition-all duration-300 ${
              isAnyHandRevealed ? "min-h-[255px] h-auto" : "min-h-[170px] h-auto"
            }`}>
              {opponents.length === 0 ? (
                <div className="w-full text-center text-xs text-muted-foreground py-4">
                  {isSpectator ? "Aguardando jogadores entrarem na partida..." : "Esperando oponentes..."}
                </div>
              ) : (
                opponents.map(opp => {
                  const isOppTurn = state.currentTurnPlayerId === opp.id;
                  const isOppRevealed = isGlobalHandsRevealed || Boolean(state.revealedPlayerIds?.includes(opp.id));
                  
                  let actionLabel = "";
                  let canClick = false;
                  
                  if (targetingCardId && isActiveTurn && !opp.isEliminated && !isSpectator) {
                    actionLabel = "Usar Efeito";
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
                      onInspect={() => setInspectingPlayerId(opp.id)}
                    />
                  );
                })
              )}
            </div>
          </div>

          {/* AREA 2: Mesa Central (Deck, Descarte, Info de Turno, Meus Objetos na Mesa) */}
          <div className="flex-1 w-full flex flex-col justify-between overflow-hidden relative min-h-0 bg-muted/5">
            
            {/* Topo da Mesa Central: Barra Minimalista com Turno e Fallback Mobile */}
            <div className="w-full px-2.5 h-9 sm:h-10 flex items-center justify-between gap-1.5 shrink-0 z-10 border-b border-border/30 bg-card/20 backdrop-blur-xs">
              {/* Status / Turn Indicator */}
              <div className="flex-1 flex items-center justify-center overflow-hidden min-w-0">
                <div className={`px-3 py-0.5 rounded-full border shadow-xs text-center flex items-center justify-center gap-1.5 max-w-full transition-all duration-300 ${
                  isMyTurnActive
                    ? "bg-primary/15 border-primary/60 shadow-md shadow-primary/25 ring-2 ring-primary/30"
                    : isSpectator
                    ? "bg-amber-500/10 border-amber-500/30"
                    : "bg-background/95 backdrop-blur-md"
                }`}>
                  {isSpectator ? (
                    <span className="text-amber-700 dark:text-amber-400 font-bold text-xs truncate flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                      <span>Modo Espectador 👁️</span>
                    </span>
                  ) : me?.isEliminated ? (
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
                  ) : isMyExtraPlay ? (
                    <span className="text-violet-600 dark:text-violet-400 font-black animate-pulse text-xs truncate flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 shrink-0 animate-spin" />
                      <span>Prompt Perfeito: Baixe um Objeto!</span>
                    </span>
                  ) : isActiveTurn ? (
                    <span className="text-primary font-black animate-pulse text-xs sm:text-sm tracking-wide flex items-center gap-1.5">
                      <span className="inline-block w-2 h-2 rounded-full bg-primary animate-ping shrink-0" />
                      <span>Sua vez de jogar! ⚡</span>
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs font-semibold truncate">
                      Vez de: {state.players[state.currentTurnPlayerId!]?.name || "..."}
                    </span>
                  )}
                </div>
              </div>

              {/* Fallback de Botões Utilitários para Telas Mobile (lg:hidden) */}
              <div className="lg:hidden flex items-center gap-1 shrink-0">
                {roomId && (
                  <CopyRoomButton 
                    roomId={roomId} 
                    variant="ghost" 
                    size="sm"
                    iconOnly
                    className="h-7 w-7 p-0 rounded-full text-muted-foreground hover:text-foreground shrink-0 cursor-pointer" 
                  />
                )}
                <button 
                  type="button"
                  onClick={() => setIsPlayersDrawerOpen(true)}
                  className="relative shrink-0 text-muted-foreground hover:text-foreground h-7 w-7 rounded-full hover:bg-muted/80 flex items-center justify-center transition-colors cursor-pointer"
                  title="Jogadores na sala"
                  aria-label="Jogadores na sala"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {Object.keys(state.players).length}
                  </span>
                </button>
                <button 
                  type="button"
                  onClick={() => setIsLeaderboardOpen(true)}
                  className="shrink-0 text-amber-500 hover:text-amber-400 h-7 w-7 rounded-full hover:bg-muted/80 flex items-center justify-center transition-colors cursor-pointer"
                  title="Ranking de vitórias"
                  aria-label="Ranking de vitórias"
                >
                  <Trophy className="w-3.5 h-3.5" />
                </button>
                <button 
                  type="button"
                  onClick={() => setIsHelpOpen(true)}
                  className="shrink-0 text-muted-foreground hover:text-foreground h-7 w-7 rounded-full hover:bg-muted/80 flex items-center justify-center transition-colors cursor-pointer"
                  title="Como jogar"
                  aria-label="Como jogar"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Pilhas Centrais (Deck e Descarte) */}
            <div className="flex-1 flex flex-col items-center justify-center gap-2.5 py-1 shrink-0 min-h-0">
              <div className="flex gap-8 sm:gap-12 items-center justify-center">
                {/* Pilha de Descarte (Miniatura) */}
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
                    Deck ({state.deck.length})
                  </span>
                  <div className="h-[135px] sm:h-[145px] flex items-center justify-center">
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
              
              {/* Controles Extras (Targeting) */}
              <div className="h-7 flex items-center justify-center">
                {targetingCardId && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={cancelTargeting} className="h-7 text-xs font-bold border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground cursor-pointer">
                      Cancelar Escolha
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Minha Área de Objetos na Mesa (MAIOR, MAIS ALTA E CONFORTÁVEL) */}
            <div className="h-[210px] sm:h-[230px] border-t bg-card/40 flex flex-col p-2.5 shrink-0 shadow-inner">
              <div className="flex items-center justify-between px-1 mb-1.5 shrink-0">
                <span className="text-[11px] font-black text-foreground uppercase tracking-widest flex items-center gap-1.5">
                  Meus Objetos na Mesa ({me.objectArea.length}/5)
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

        {/* AREA 3: Minha Mão / Modo Espectador */}
        <div className={`min-h-[165px] max-h-[195px] w-full border-t bg-card flex flex-col shrink-0 shadow-[0_-4px_10px_-2px_rgba(0,0,0,0.08)] z-20 overflow-visible relative transition-all duration-300 ${
          isMyTurnActive
            ? "border-t-2 border-primary/70 shadow-[0_-8px_25px_-5px_rgba(var(--primary),0.3)]"
            : ""
        }`}>
          {isSpectator ? (
            <div className="h-full flex flex-col items-center justify-center p-4 text-center space-y-1.5 select-none bg-muted/10">
              <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-base">
                👁️
              </div>
              <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                Modo Espectador Ativo
              </h4>
              <p className="text-[11px] text-muted-foreground max-w-[320px]">
                Você está assistindo à rodada em tempo real. Assim que esta partida for concluída e reiniciada pelo líder, você receberá cartas e jogará normalmente!
              </p>
            </div>
          ) : (
            <>
              {/* Luminous ring pulsante no container da mão quando for a vez do jogador */}
              {isMyTurnActive && (
                <div className="pointer-events-none absolute inset-0 ring-4 ring-primary ring-inset animate-pulse z-30" />
              )}

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
            </>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* FLANCO DIREITO (Desktop: hidden lg:flex) */}
      {/* ========================================================= */}
      <aside className="hidden lg:flex flex-col w-[220px] xl:w-[240px] p-3.5 py-4 shrink-0 justify-between gap-3 select-none">
        <div className="space-y-2.5 shrink-0">
          <div className="px-1 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Menu da Partida
            </span>
          </div>

          {/* Botão Ranking */}
          <button
            type="button"
            onClick={() => setIsLeaderboardOpen(true)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 active:scale-[0.98] border border-zinc-800/80 hover:border-amber-500/50 text-left transition-all cursor-pointer shadow-md group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/30 group-hover:scale-105 transition-transform">
              <Trophy className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-black text-zinc-200 tracking-tight group-hover:text-amber-400 transition-colors">
                Ranking
              </span>
              <span className="block text-[10px] text-zinc-400 truncate">
                Placar e vitórias
              </span>
            </div>
          </button>

          {/* Botão Jogadores */}
          <button
            type="button"
            onClick={() => setIsPlayersDrawerOpen(true)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 active:scale-[0.98] border border-zinc-800/80 hover:border-primary/50 text-left transition-all cursor-pointer shadow-md group"
          >
            <div className="relative w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 border border-primary/30 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {Object.keys(state.players).length}
              </span>
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-black text-zinc-200 tracking-tight group-hover:text-primary transition-colors">
                Jogadores
              </span>
              <span className="block text-[10px] text-zinc-400 truncate">
                {Object.keys(state.players).length} participante(s)
              </span>
            </div>
          </button>

          {/* Botão Como Jogar */}
          <button
            type="button"
            onClick={() => setIsHelpOpen(true)}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 active:scale-[0.98] border border-zinc-800/80 hover:border-indigo-500/50 text-left transition-all cursor-pointer shadow-md group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30 group-hover:scale-105 transition-transform">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-black text-zinc-200 tracking-tight group-hover:text-indigo-400 transition-colors">
                Como Jogar
              </span>
              <span className="block text-[10px] text-zinc-400 truncate">
                Regras e objetivos
              </span>
            </div>
          </button>
        </div>

        {/* Rodapé do Flanco Direito com Botão Sair */}
        <div className="pt-3 border-t border-zinc-800/80 mt-auto">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-900/40 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 text-zinc-400 border border-zinc-800/60 text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair da Sala</span>
          </button>
        </div>
      </aside>

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
                          {opp.hand.length} carta(s) na mão • {opp.objectArea.length}/5 objeto(s)
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
                  Você pode escolher uma ação: comprar uma carta do deck principal ou jogar (baixar um objeto novo na mesa ou ativar um efeito da sua mão).
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
              onClick={() => setInspectingPlayerId(null)}
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
                  {inspectingPlayer.objectArea.length}/5 objeto(s) baixado(s) • {inspectingPlayer.hand.length} carta(s) na mão
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
                  <div 
                    key={card.id} 
                    className="shrink-0 animate-in zoom-in-95 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                    onClick={() => setPreviewCard(card)}
                    title={`Toque para ver detalhes de ${card.name}`}
                  >
                    <Card card={card} size="normal" />
                  </div>
                ))
              )}
            </div>

            <Button onClick={() => setInspectingPlayerId(null)} className="w-full mt-5 font-bold">
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

      {/* GAVETA DE JOGADORES DA SALA */}
      <RoomPlayersDrawer
        isOpen={isPlayersDrawerOpen}
        onClose={() => setIsPlayersDrawerOpen(false)}
        state={state}
        myId={myId}
      />

      {/* MODAL DE RANKINGS */}
      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        roomLeaderboard={state.roomLeaderboard}
        currentRoomId={roomId}
      />

    </div>
  );
}
