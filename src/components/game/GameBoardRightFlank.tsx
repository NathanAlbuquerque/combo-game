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
  onLeaveRoom,
}: GameBoardRightFlankProps) {
  return (
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
          onClick={onOpenLeaderboard}
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
          onClick={onOpenPlayersDrawer}
          className="w-full flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 active:scale-[0.98] border border-zinc-800/80 hover:border-primary/50 text-left transition-all cursor-pointer shadow-md group"
        >
          <div className="relative w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0 border border-primary/30 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5 shrink-0" />
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
              {playersCount}
            </span>
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-black text-zinc-200 tracking-tight group-hover:text-primary transition-colors">
              Jogadores
            </span>
            <span className="block text-[10px] text-zinc-400 truncate">
              {playersCount} participante(s)
            </span>
          </div>
        </button>

        {/* Botão Como Jogar */}
        <button
          type="button"
          onClick={onOpenHelp}
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

        {/* Botão Configurações */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="w-full flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 active:scale-[0.98] border border-zinc-800/80 hover:border-primary/50 text-left transition-all cursor-pointer shadow-md group"
        >
          <div className="w-9 h-9 rounded-xl bg-zinc-700/20 text-zinc-300 flex items-center justify-center shrink-0 border border-zinc-700/40 group-hover:scale-105 transition-transform">
            <Settings className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-black text-zinc-200 tracking-tight group-hover:text-primary transition-colors">
              Configurações
            </span>
            <span className="block text-[10px] text-zinc-400 truncate">
              {roomSettings?.turnTimerEnabled
                ? `Anti-Stall: ${roomSettings.turnTimerDuration}s`
                : "Anti-Stall e regras"}
            </span>
          </div>
        </button>

        {/* Botão Tela Cheia */}
        {isFullscreenSupported && (
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="w-full flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 active:scale-[0.98] border border-zinc-800/80 hover:border-zinc-500/50 text-left transition-all cursor-pointer shadow-md group"
          >
            <div className="w-9 h-9 rounded-xl bg-zinc-700/20 text-zinc-300 flex items-center justify-center shrink-0 border border-zinc-700/40 group-hover:scale-105 transition-transform">
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-black text-zinc-200 tracking-tight group-hover:text-zinc-100 transition-colors">
                {isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
              </span>
              <span className="block text-[10px] text-zinc-400 truncate">
                {isFullscreen ? "Reduzir janela" : "Modo imersivo PWA"}
              </span>
            </div>
          </button>
        )}
      </div>

      {/* Rodapé com Botão Sair */}
      <div className="pt-3 border-t border-zinc-800/80 mt-auto">
        <button
          type="button"
          onClick={onLeaveRoom}
          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-900/40 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 text-zinc-400 border border-zinc-800/60 text-xs font-bold transition-all cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sair da Sala</span>
        </button>
      </div>
    </aside>
  );
}
