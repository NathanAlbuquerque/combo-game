"use client";

import {
  Sparkles,
  Timer,
  QrCode,
  Users,
  Settings,
  Trophy,
  HelpCircle,
  Maximize,
  Minimize,
} from "lucide-react";
import { CopyRoomButton } from "./CopyRoomButton";
import { PendingAction, RoomSettings } from "@/types/game";
import { cn } from "@/lib/utils";

interface GameBoardMobileHeaderProps {
  roomId?: string;
  isMyTurnActive: boolean;
  isActiveTurn: boolean;
  isSpectator: boolean;
  isEliminated?: boolean;
  isPendingMyAction: boolean;
  isMyExtraPlay: boolean;
  pendingAction: PendingAction | null;
  targetingCardId: string | null;
  currentTurnPlayerName?: string;
  remainingSeconds: number | null;
  roomSettings?: RoomSettings;
  playersCount: number;
  isFullscreenSupported: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenShareModal: () => void;
  onOpenPlayersDrawer: () => void;
  onOpenSettingsModal: () => void;
  onOpenLeaderboard: () => void;
  onOpenHelp: () => void;
}

export function GameBoardMobileHeader({
  roomId,
  isMyTurnActive,
  isActiveTurn,
  isSpectator,
  isEliminated,
  isPendingMyAction,
  isMyExtraPlay,
  pendingAction,
  targetingCardId,
  currentTurnPlayerName,
  remainingSeconds,
  roomSettings,
  playersCount,
  isFullscreenSupported,
  isFullscreen,
  onToggleFullscreen,
  onOpenShareModal,
  onOpenPlayersDrawer,
  onOpenSettingsModal,
  onOpenLeaderboard,
  onOpenHelp,
}: GameBoardMobileHeaderProps) {
  return (
    <div className="w-full px-2.5 h-9 sm:h-10 flex items-center justify-between gap-1.5 shrink-0 z-10 border-b border-border/30 bg-card/20 backdrop-blur-xs select-none">
      {/* Status / Turn Indicator */}
      <div className="flex-1 flex items-center justify-center overflow-hidden min-w-0">
        <div
          className={cn(
            "px-3 py-0.5 rounded-full border shadow-xs text-center flex items-center justify-center gap-1.5 max-w-full transition-all duration-300",
            isMyTurnActive
              ? "bg-primary/15 border-primary/60 shadow-md shadow-primary/25 ring-2 ring-primary/30"
              : isSpectator
              ? "bg-amber-500/10 border-amber-500/30"
              : "bg-background/95 backdrop-blur-md"
          )}
        >
          {isSpectator ? (
            <span className="text-amber-700 dark:text-amber-400 font-bold text-xs truncate flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              <span>Modo Espectador 👁️</span>
            </span>
          ) : isEliminated ? (
            <span className="text-muted-foreground font-black text-xs">Você foi eliminado 💀</span>
          ) : isPendingMyAction ? (
            <span className="text-destructive font-black animate-pulse text-xs leading-none truncate">
              {pendingAction?.type === "CHOOSE_CARD_TO_DISCARD"
                ? "🚨 Descarte 1 carta"
                : "📜 Entregue 1 carta"}
            </span>
          ) : pendingAction ? (
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
              Vez de: {currentTurnPlayerName || "..."}
            </span>
          )}

          {roomSettings?.turnTimerEnabled && remainingSeconds !== null && (
            <span
              className={cn(
                "shrink-0 ml-1.5 px-1.5 py-0.5 rounded-full font-mono text-[10px] font-bold border flex items-center gap-1",
                remainingSeconds <= 5
                  ? "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40 animate-pulse"
                  : remainingSeconds <= 10
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                  : "bg-primary/10 text-primary border-primary/20"
              )}
              title={`Tempo restante: ${remainingSeconds}s`}
            >
              <Timer className="w-3 h-3 shrink-0" />
              <span>{remainingSeconds}s</span>
            </span>
          )}
        </div>
      </div>

      {/* Fallback de Botões Utilitários para Telas Mobile (lg:hidden) */}
      <div className="lg:hidden flex items-center gap-1 shrink-0">
        {roomId && (
          <div className="flex items-center gap-0.5 bg-zinc-900/90 px-2 py-0.5 rounded-full border border-zinc-700/80 shrink-0">
            <span className="font-mono font-black text-[11px] text-zinc-100 tracking-wider select-all">
              #{roomId}
            </span>
            <CopyRoomButton
              roomId={roomId}
              variant="ghost"
              size="sm"
              iconOnly
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            />
          </div>
        )}
        {roomId && (
          <button
            type="button"
            onClick={onOpenShareModal}
            className="shrink-0 text-primary hover:text-primary/80 h-7 w-7 rounded-full hover:bg-muted/80 flex items-center justify-center transition-colors cursor-pointer"
            title="Compartilhar com QR Code"
            aria-label="Compartilhar com QR Code"
          >
            <QrCode className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={onOpenPlayersDrawer}
          className="relative shrink-0 text-muted-foreground hover:text-foreground h-7 w-7 rounded-full hover:bg-muted/80 flex items-center justify-center transition-colors cursor-pointer"
          title="Jogadores na sala"
          aria-label="Jogadores na sala"
        >
          <Users className="w-4.5 h-4.5 shrink-0" />
          <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
            {playersCount}
          </span>
        </button>
        <button
          type="button"
          onClick={onOpenSettingsModal}
          className="shrink-0 text-muted-foreground hover:text-foreground h-7 w-7 rounded-full hover:bg-muted/80 flex items-center justify-center transition-colors cursor-pointer"
          title="Configurações da sala"
          aria-label="Configurações da sala"
        >
          <Settings className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onOpenLeaderboard}
          className="shrink-0 text-amber-500 hover:text-amber-400 h-7 w-7 rounded-full hover:bg-muted/80 flex items-center justify-center transition-colors cursor-pointer"
          title="Ranking de vitórias"
          aria-label="Ranking de vitórias"
        >
          <Trophy className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onOpenHelp}
          className="shrink-0 text-muted-foreground hover:text-foreground h-7 w-7 rounded-full hover:bg-muted/80 flex items-center justify-center transition-colors cursor-pointer"
          title="Como jogar"
          aria-label="Como jogar"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
        {isFullscreenSupported && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="shrink-0 text-muted-foreground hover:text-foreground h-7 w-7 rounded-full hover:bg-muted/80 flex items-center justify-center transition-colors cursor-pointer"
            title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
            aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}
