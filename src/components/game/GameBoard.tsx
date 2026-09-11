"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { GameState, Card as CardType, RoomSettings } from "@/types/game";
import { useFullscreen, useTurnAlerts, useTurnTimer } from "@/hooks";
import {
  TurnSplashAlert,
  GameBoardLeftFlank,
  GameBoardRightFlank,
  GameBoardMobileHeader,
  DeckDiscardPiles,
  PlayerObjectsArea,
  PendingActionModal,
  OpponentView,
  PlayerHand,
  ReactionPicker,
  CardPreviewModal,
  RoomPlayersDrawer,
  LeaderboardModal,
  ShareRoomModal,
  RoomSettingsModal,
  Card,
} from "./";
import { Eye, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TARGET_EFFECT_NAMES,
  TargetEffectName,
  TOAST_DISMISS_DURATION_MS,
  VICTORY_OBJECTS_REQUIRED,
} from "@/constants";

interface GameBoardProps {
  state: GameState;
  myId: string;
  roomId?: string;
  onDraw: () => void;
  onPlay: (cardId: string, targetId?: string) => void;
  onDiscard: (cardId: string) => void;
  onResolvePendingAction?: (cardId: string) => void;
  onSkipExtraPlay?: () => void;
  onUpdateSettings?: (settings: Partial<RoomSettings>) => void;
  onSendReaction?: (emoji: string) => void;
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
  onUpdateSettings,
  onSendReaction,
}: GameBoardProps) {
  const router = useRouter();
  const { isFullscreen, isSupported: isFullscreenSupported, toggleFullscreen } = useFullscreen();

  // Estados de Modais e Interações
  const [targetingCardId, setTargetingCardId] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isPlayersDrawerOpen, setIsPlayersDrawerOpen] = useState(false);
  const [inspectingPlayerId, setInspectingPlayerId] = useState<string | null>(null);
  const [previewCard, setPreviewCard] = useState<CardType | null>(null);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [mobileToast, setMobileToast] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const lastLogLengthRef = useRef(state.actionLog.length);
  const me = state.players[myId];
  const isSpectator = Boolean(me?.isSpectating);
  const inspectingPlayer = inspectingPlayerId ? state.players[inspectingPlayerId] : null;

  // Jogadores ativos da partida (exclui espectadores para não poluir o carrossel de oponentes)
  const activePlayers = useMemo(
    () => Object.values(state.players).filter((p) => !p.isSpectating),
    [state.players]
  );
  const opponents = useMemo(
    () => (isSpectator ? activePlayers : activePlayers.filter((p) => p.id !== myId)),
    [activePlayers, isSpectator, myId]
  );

  const isGlobalHandsRevealed = Boolean(state.revealedHandsUntilTurnOfPlayerId);
  const isAnyHandRevealed =
    isGlobalHandsRevealed || Boolean(state.revealedPlayerIds && state.revealedPlayerIds.length > 0);
  const isMyHandRevealed = isGlobalHandsRevealed || Boolean(state.revealedPlayerIds?.includes(myId));

  const isMyTurn = state.currentTurnPlayerId === myId;
  const isPendingMyAction = state.pendingAction?.requiredPlayerId === myId;
  const isMyExtraPlay = state.extraPlayPlayerId === myId;
  const isActiveTurn = isMyTurn && !state.pendingAction && !isSpectator;
  const isMyTurnActive = Boolean(
    (isActiveTurn || isMyExtraPlay) && !me?.isEliminated && !isSpectator && !state.pendingAction
  );

  // Hook desacoplado de Alertas de Turno (Som, Vibração e Flash)
  const { showTurnFlash } = useTurnAlerts(isMyTurnActive, Boolean(isMyExtraPlay));

  // Hook desacoplado de Cronômetro Anti-Stall
  const { remainingSeconds } = useTurnTimer({
    enabled: state.roomSettings?.turnTimerEnabled,
    turnExpiresAt: state.turnExpiresAt,
    duration: state.roomSettings?.turnTimerDuration,
    isActive: state.status === "playing",
  });

  // Notificação flutuante de ActionLog em telas mobile
  useEffect(() => {
    if (state.actionLog.length > 0 && state.actionLog.length !== lastLogLengthRef.current) {
      lastLogLengthRef.current = state.actionLog.length;
      const latest = state.actionLog[state.actionLog.length - 1];
      const showTimer = setTimeout(() => setMobileToast(latest), 0);
      const hideTimer = setTimeout(() => setMobileToast(null), TOAST_DISMISS_DURATION_MS);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [state.actionLog]);

  const topDiscard = state.discard.length > 0 ? state.discard[state.discard.length - 1] : undefined;

  const handleResolvePending = useCallback(
    (cardId: string) => {
      if (onResolvePendingAction) {
        onResolvePendingAction(cardId);
      } else {
        onDiscard(cardId);
      }
    },
    [onResolvePendingAction, onDiscard]
  );

  const handlePlayCard = useCallback(
    (cardId: string) => {
      if (isPendingMyAction) {
        handleResolvePending(cardId);
        return;
      }

      const card = me?.hand.find((c) => c.id === cardId);
      if (!card) return;

      if (isMyExtraPlay) {
        if (card.type === "object") onPlay(cardId);
        return;
      }

      if (card.type === "effect" && card.name && TARGET_EFFECT_NAMES.includes(card.name as TargetEffectName)) {
        setTargetingCardId(cardId);
      } else {
        onPlay(cardId);
      }
    },
    [isPendingMyAction, handleResolvePending, me?.hand, isMyExtraPlay, onPlay]
  );

  const handleInspectCard = useCallback(
    (card: CardType) => {
      if (isPendingMyAction) {
        handleResolvePending(card.id);
        return;
      }
      setPreviewCard(card);
    },
    [isPendingMyAction, handleResolvePending]
  );

  const handleConfirmPlayFromPreview = useCallback(
    (card: CardType) => {
      setPreviewCard(null);
      handlePlayCard(card.id);
    },
    [handlePlayCard]
  );

  const canPlayPreviewCard = Boolean(
    previewCard && (isMyExtraPlay ? previewCard.type === "object" : isActiveTurn)
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

  const handleOpponentClick = useCallback(
    (targetId: string) => {
      if (targetingCardId) {
        onPlay(targetingCardId, targetId);
        setTargetingCardId(null);
      }
    },
    [targetingCardId, onPlay]
  );

  return (
    <div className="min-h-screen w-full bg-zinc-950 bg-gradient-to-b from-zinc-900/60 via-zinc-950 to-black flex justify-center items-center overflow-x-hidden font-sans relative">
      {/* Flash Luminoso e Splash Central de Turno */}
      <TurnSplashAlert show={showTurnFlash} />

      <div className="w-full flex justify-center items-stretch h-[100dvh] max-h-[100dvh]">
        {/* FLANCO ESQUERDO DESKTOP */}
        <GameBoardLeftFlank
          roomId={roomId}
          actionLog={state.actionLog}
          isMyTurnActive={isMyTurnActive}
          isSpectator={isSpectator}
          isMyExtraPlay={Boolean(isMyExtraPlay)}
          currentTurnPlayerName={state.players[state.currentTurnPlayerId || ""]?.name}
          remainingSeconds={remainingSeconds}
          turnTimerDuration={state.roomSettings?.turnTimerDuration}
          turnTimerEnabled={state.roomSettings?.turnTimerEnabled}
          onOpenShareModal={() => setIsShareModalOpen(true)}
        />

        {/* CONTÊINER CENTRAL DO JOGO */}
        <div className="w-full max-w-[440px] sm:max-w-[480px] h-[100dvh] max-h-[100dvh] bg-background shadow-2xl relative flex flex-col justify-between overflow-hidden border-x border-border/40 select-none shrink-0">
          {/* Banner de Modo Espectador */}
          {isSpectator && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-[400px] bg-amber-500 text-amber-950 font-black text-xs px-3.5 py-2 rounded-2xl shadow-xl border border-amber-400/90 backdrop-blur-md flex items-center justify-between gap-2 animate-in slide-in-from-top-3 duration-300">
              <div className="flex items-center gap-2 truncate">
                <span className="text-base shrink-0">👁️</span>
                <span className="truncate">Partida em andamento • Você entrará na próxima rodada!</span>
              </div>
              <span className="text-[10px] bg-amber-600/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0">
                Espectador
              </span>
            </div>
          )}

          {/* Toast Flutuante de ActionLog no Mobile */}
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

          {/* AREA 1: Oponentes (Topo) */}
          <div className="relative w-full border-b bg-card/40 backdrop-blur-sm shadow-xs shrink-0">
            {opponents.length >= 2 && (
              <>
                <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-background/90 via-background/40 to-transparent z-10" />
                <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-background/90 via-background/40 to-transparent z-10" />
              </>
            )}

            <div
              className={`w-full overflow-x-auto flex items-stretch justify-start px-3 gap-2.5 py-2.5 shrink-0 scrollbar-none transition-all duration-300 ${
                isAnyHandRevealed ? "min-h-[255px] h-auto" : "min-h-[170px] h-auto"
              }`}
            >
              {opponents.length === 0 ? (
                <div className="w-full text-center text-xs text-muted-foreground py-4">
                  {isSpectator ? "Aguardando jogadores entrarem na partida..." : "Esperando oponentes..."}
                </div>
              ) : (
                opponents.map((opp) => {
                  const isOppTurn = state.currentTurnPlayerId === opp.id;
                  const isOppRevealed =
                    isGlobalHandsRevealed || Boolean(state.revealedPlayerIds?.includes(opp.id));
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

          {/* AREA 2: Mesa Central (Deck, Descarte e Meus Objetos) */}
          <div className="flex-1 w-full flex flex-col justify-between overflow-hidden relative min-h-0 bg-muted/5">
            <GameBoardMobileHeader
              roomId={roomId}
              isMyTurnActive={isMyTurnActive}
              isActiveTurn={isActiveTurn}
              isSpectator={isSpectator}
              isEliminated={me?.isEliminated}
              isPendingMyAction={isPendingMyAction}
              isMyExtraPlay={Boolean(isMyExtraPlay)}
              pendingAction={state.pendingAction}
              targetingCardId={targetingCardId}
              currentTurnPlayerName={state.players[state.currentTurnPlayerId || ""]?.name}
              remainingSeconds={remainingSeconds}
              roomSettings={state.roomSettings}
              playersCount={Object.keys(state.players).length}
              isFullscreenSupported={isFullscreenSupported}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
              onOpenShareModal={() => setIsShareModalOpen(true)}
              onOpenPlayersDrawer={() => setIsPlayersDrawerOpen(true)}
              onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
              onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
              onOpenHelp={() => setIsHelpOpen(true)}
            />

            <DeckDiscardPiles
              topDiscard={topDiscard}
              deckCount={state.deck.length}
              isActiveTurn={isActiveTurn}
              isMyExtraPlay={Boolean(isMyExtraPlay)}
              isTargeting={Boolean(targetingCardId)}
              onDraw={onDraw}
              onCancelTargeting={() => setTargetingCardId(null)}
            />

            <PlayerObjectsArea
              objects={me?.objectArea || []}
              onInspectCard={handleInspectCard}
            />
          </div>

          {/* AREA 3: Minha Mão / Modo Espectador */}
          <div
            className={`min-h-[165px] max-h-[195px] w-full border-t bg-card flex flex-col shrink-0 shadow-[0_-4px_10px_-2px_rgba(0,0,0,0.08)] z-20 overflow-visible relative transition-all duration-300 ${
              isMyTurnActive
                ? "border-t-2 border-primary/70 shadow-[0_-8px_25px_-5px_rgba(var(--primary),0.3)]"
                : ""
            }`}
          >
            {onSendReaction && (
              <div className="lg:hidden absolute -top-4.5 right-3 z-30">
                <ReactionPicker onSendReaction={onSendReaction} />
              </div>
            )}

            {isSpectator ? (
              <div className="h-full flex flex-col items-center justify-center p-4 text-center space-y-1.5 select-none bg-muted/10">
                <div className="w-8 h-8 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center text-base">
                  👁️
                </div>
                <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                  Modo Espectador Ativo
                </h4>
                <p className="text-[11px] text-muted-foreground max-w-[320px]">
                  Você está assistindo à rodada em tempo real. Assim que esta partida for concluída e
                  reiniciada pelo líder, você receberá cartas e jogará normalmente!
                </p>
              </div>
            ) : (
              <>
                {isMyTurnActive && (
                  <div className="pointer-events-none absolute inset-0 ring-4 ring-primary ring-inset animate-pulse z-30" />
                )}

                {isMyExtraPlay && (
                  <div className="w-full bg-primary/15 border-b border-primary/30 text-foreground text-xs font-semibold py-1.5 px-3 flex items-center justify-between gap-2 animate-in fade-in shrink-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 animate-pulse" />
                      <span className="text-[11px] truncate">
                        <strong>Prompt Perfeito:</strong> Baixe o novo objeto!
                      </span>
                    </div>
                    {onSkipExtraPlay && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-[10px] font-bold border-primary text-primary hover:bg-primary hover:text-primary-foreground shrink-0 shadow-xs"
                        onClick={onSkipExtraPlay}
                      >
                        Pular
                      </Button>
                    )}
                  </div>
                )}

                {isMyHandRevealed && !isMyExtraPlay && (
                  <div className="w-full bg-amber-500/10 border-b border-amber-500/30 text-amber-700 dark:text-amber-400 text-[10.5px] font-semibold py-0.5 px-3 flex items-center justify-center gap-1.5 shrink-0">
                    <Eye className="w-3 h-3 shrink-0" />
                    <span className="truncate">Sua mão está visível para todos os jogadores!</span>
                  </div>
                )}

                <PlayerHand
                  hand={me?.hand || []}
                  isActiveTurn={isActiveTurn || isMyExtraPlay}
                  onCardClick={handleInspectCard}
                />
              </>
            )}
          </div>
        </div>

        {/* FLANCO DIREITO DESKTOP */}
        <GameBoardRightFlank
          playersCount={Object.keys(state.players).length}
          roomSettings={state.roomSettings}
          isFullscreenSupported={isFullscreenSupported}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
          onOpenPlayersDrawer={() => setIsPlayersDrawerOpen(true)}
          onOpenHelp={() => setIsHelpOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          onSendReaction={onSendReaction}
          onLeaveRoom={() => router.push("/")}
        />
      </div>

      {/* MODAL BLOQUEADOR DE AÇÃO PENDENTE */}
      {isPendingMyAction && state.pendingAction && (
        <PendingActionModal
          pendingAction={state.pendingAction}
          hand={me?.hand || []}
          initiatorName={state.players[state.pendingAction.initiatorPlayerId]?.name}
          onResolve={handleResolvePending}
        />
      )}

      {/* MODAL DE PRÉ-VISUALIZAÇÃO DE CARTA */}
      <CardPreviewModal
        card={previewCard}
        isOpen={Boolean(previewCard)}
        onClose={() => setPreviewCard(null)}
        onConfirmPlay={handleConfirmPlayFromPreview}
        canPlay={canPlayPreviewCard}
        canPlayReason={canPlayReason}
      />

      {/* GAVETAS E MODAIS AUXILIARES */}
      <RoomPlayersDrawer
        isOpen={isPlayersDrawerOpen}
        onClose={() => setIsPlayersDrawerOpen(false)}
        state={state}
        myId={myId}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        roomLeaderboard={state.roomLeaderboard}
        currentRoomId={roomId}
      />

      <ShareRoomModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        roomId={roomId || ""}
      />

      <RoomSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={state.roomSettings}
        isLeader={state.creatorId === myId}
        onUpdateSettings={onUpdateSettings || (() => {})}
      />

      {/* MODAL DE REGRAS ("COMO JOGAR") */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none">
          <div className="bg-card text-card-foreground border p-5 rounded-2xl max-w-md w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-black text-base flex items-center gap-2">Como Jogar Combo</h3>
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs space-y-3 leading-relaxed text-muted-foreground">
              <p>
                <strong>Objetivo:</strong> Colete e baixe <strong>{VICTORY_OBJECTS_REQUIRED} Cartas-Objeto</strong> de temas
                diferentes ou Coringas na sua área para vencer a partida.
              </p>
              <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-foreground font-medium">
                <strong>No seu turno:</strong> Compre 1 carta do deck e jogue 1 carta da sua mão (baixe
                um Objeto na sua mesa ou use um Efeito).
              </div>
              <p>
                <strong>Cartas de Efeito:</strong> Descarte-as para aplicar regras instantâneas contra
                adversários ou proteger seus objetos.
              </p>
              <p>
                <strong>Cartas Coringa:</strong> Podem substituir qualquer um dos temas que faltam para
                sua vitória!
              </p>
            </div>
            <Button
              className="w-full font-bold cursor-pointer"
              size="sm"
              onClick={() => setIsHelpOpen(false)}
            >
              Entendido
            </Button>
          </div>
        </div>
      )}

      {/* GAVETA DE INSPEÇÃO DE JOGADOR */}
      {inspectingPlayer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
          <div className="bg-card text-card-foreground border rounded-t-3xl sm:rounded-2xl max-w-md w-full max-h-[80vh] flex flex-col p-4 shadow-2xl animate-in slide-in-from-bottom-5 duration-200">
            <div className="flex items-center justify-between pb-3 border-b mb-3">
              <div>
                <h3 className="font-black text-base">{inspectingPlayer.name}</h3>
                <span className="text-[11px] text-muted-foreground">
                  Objetos na Mesa ({inspectingPlayer.objectArea.length}/{VICTORY_OBJECTS_REQUIRED})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInspectingPlayerId(null)}
                className="text-muted-foreground hover:text-foreground cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 p-1">
              {inspectingPlayer.objectArea.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">
                  Nenhum objeto baixado por este jogador ainda.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 justify-center">
                  {inspectingPlayer.objectArea.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setPreviewCard(c)}
                      className="cursor-pointer hover:scale-105 transition-transform"
                      title={`Clique para inspecionar: ${c.name}`}
                    >
                      <Card card={c} size="small" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
