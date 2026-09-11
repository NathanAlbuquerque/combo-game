"use client";

import {
  Trophy,
  Users,
  HelpCircle,
  Settings,
  Maximize,
  Minimize,
  LogOut,
} from "lucide-react";
import { RoomSettings } from "@/types/game";
import { ReactionPicker } from "./ReactionPicker";

interface GameBoardRightFlankProps {
  playersCount: number;
  roomSettings?: RoomSettings;
  isFullscreenSupported: boolean;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenLeaderboard: () => void;
  onOpenPlayersDrawer: () => void;
  onOpenHelp: () => void;
  onOpenSettings: () => void;
  onSendReaction?: (emoji: string) => void;
  onLeaveRoom: () => void;
}

export function GameBoardRightFlank({
  playersCount,
  roomSettings,
  isFullscreenSupported,
  isFullscreen,
  onToggleFullscreen,
  onOpenLeaderboard,
  onOpenPlayersDrawer,
  onOpenHelp,
  onOpenSettings,
  onSendReaction,
  onLeaveRoom,
}: GameBoardRightFlankProps) {
  return (
    <aside className="hidden lg:flex flex-col w-16 xl:w-20 p-2.5 py-4 shrink-0 justify-between items-center select-none">
      <div className="flex flex-col items-center gap-2.5 shrink-0">
        {/* 🏆 Botão Ranking */}
        <button
          type="button"
          onClick={onOpenLeaderboard}
          className="w-11 h-11 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 active:scale-95 border border-zinc-700/80 hover:border-amber-500/60 text-amber-400 hover:text-amber-300 flex items-center justify-center transition-all cursor-pointer shadow-md"
          title="Ranking da Sala"
          aria-label="Ranking da Sala"
        >
          <Trophy className="w-5 h-5" />
        </button>

        {/* 👥 Botão Jogadores */}
        <button
          type="button"
          onClick={onOpenPlayersDrawer}
          className="relative w-11 h-11 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 active:scale-95 border border-zinc-700/80 hover:border-zinc-500 text-zinc-100 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
          title={`Jogadores na sala (${playersCount})`}
          aria-label={`Jogadores na sala (${playersCount})`}
        >
          <Users className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-xs border border-zinc-900">
            {playersCount}
          </span>
        </button>

        {/* ❓ Botão Como Jogar / Regras */}
        <button
          type="button"
          onClick={onOpenHelp}
          className="w-11 h-11 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 active:scale-95 border border-zinc-700/80 hover:border-indigo-500/60 text-zinc-100 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
          title="Como Jogar / Regras"
          aria-label="Como Jogar / Regras"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        {/* ⚙️ Botão Configurações da Sala */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="relative w-11 h-11 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 active:scale-95 border border-zinc-700/80 hover:border-zinc-500 text-zinc-100 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
          title={
            roomSettings?.turnTimerEnabled
              ? `Configurações da Sala (Anti-Stall: ${roomSettings.turnTimerDuration}s)`
              : "Configurações da Sala"
          }
          aria-label="Configurações da Sala"
        >
          <Settings className="w-5 h-5" />
          {roomSettings?.turnTimerEnabled && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-zinc-900" />
          )}
        </button>

        {/* ⛶ Botão Tela Cheia */}
        {isFullscreenSupported && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="w-11 h-11 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 active:scale-95 border border-zinc-700/80 hover:border-zinc-500 text-zinc-100 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
            title={isFullscreen ? "Sair da Tela Cheia" : "Modo Tela Cheia"}
            aria-label={isFullscreen ? "Sair da Tela Cheia" : "Modo Tela Cheia"}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        )}

        {/* 😊 Botão Reações de Emojis */}
        {onSendReaction && (
          <ReactionPicker
            onSendReaction={onSendReaction}
            popoverPlacement="left"
            triggerClassName="w-11 h-11 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 active:scale-95 border border-zinc-700/80 hover:border-amber-500/60 text-amber-400 hover:text-amber-300 flex items-center justify-center transition-all cursor-pointer shadow-md"
          />
        )}
      </div>

      {/* 🚪 Rodapé com Botão Sair da Sala */}
      <div className="pt-3 border-t border-zinc-800/80 mt-auto flex flex-col items-center">
        <button
          type="button"
          onClick={onLeaveRoom}
          className="w-11 h-11 rounded-2xl bg-zinc-900/90 hover:bg-red-500/20 active:scale-95 border border-zinc-700/80 hover:border-red-500/50 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-all cursor-pointer shadow-md"
          title="Sair da Sala"
          aria-label="Sair da Sala"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </aside>
  );
}
