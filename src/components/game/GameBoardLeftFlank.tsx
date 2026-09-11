"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CopyRoomButton } from "./CopyRoomButton";
import { QrCode, Timer, ChevronDown, ChevronUp, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEFAULT_TURN_TIMER_SECONDS } from "@/constants";

interface GameBoardLeftFlankProps {
  roomId?: string;
  actionLog: string[];
  isMyTurnActive: boolean;
  isSpectator: boolean;
  isMyExtraPlay: boolean;
  currentTurnPlayerName?: string;
  remainingSeconds: number | null;
  turnTimerDuration?: number;
  turnTimerEnabled?: boolean;
  onOpenShareModal: () => void;
}

export function GameBoardLeftFlank({
  roomId,
  actionLog,
  isMyTurnActive,
  isSpectator,
  isMyExtraPlay,
  currentTurnPlayerName,
  remainingSeconds,
  turnTimerDuration = DEFAULT_TURN_TIMER_SECONDS,
  turnTimerEnabled = false,
  onOpenShareModal,
}: GameBoardLeftFlankProps) {
  const [isActionLogExpanded, setIsActionLogExpanded] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActionLogExpanded) {
      logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [actionLog.length, isActionLogExpanded]);

  return (
    <aside className="hidden lg:flex flex-col w-[230px] xl:w-[250px] p-3.5 py-4 shrink-0 justify-between gap-3 select-none">
      <div className="space-y-3 shrink-0">
        {/* 1. Cabeçalho com Código da Sala e Copiar Link */}
        <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-3.5 shadow-md space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Código da Sala
            </span>
            <span className="font-mono font-black text-sm text-zinc-100 tracking-widest bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-700/80 select-all shadow-inner">
              #{roomId || "---"}
            </span>
          </div>
          {roomId && (
            <div className="flex flex-col gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenShareModal}
                className="w-full justify-center font-bold text-xs h-8 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-500 text-zinc-100 hover:text-white cursor-pointer gap-1.5 shadow-2xs transition-all"
              >
                <QrCode className="w-3.5 h-3.5 text-zinc-100" />
                <span>QR Code / Convidar</span>
              </Button>
              <CopyRoomButton
                roomId={roomId}
                variant="secondary"
                size="sm"
                className="w-full justify-center font-bold text-xs h-8 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-500 text-zinc-100 hover:text-white cursor-pointer transition-all"
              />
            </div>
          )}
        </div>

        {/* 2. Indicador Fixo de Turno */}
        <div
          className={cn(
            "p-3.5 rounded-2xl border backdrop-blur-md shadow-md transition-all duration-300",
            isMyTurnActive
              ? "bg-emerald-950/40 border-emerald-500/60 shadow-emerald-950/30"
              : isSpectator
              ? "bg-amber-950/30 border-amber-500/40"
              : "bg-zinc-900/60 border-zinc-800/80"
          )}
        >
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              Turno Atual
            </span>
            {isSpectator ? (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-black">
                ESPECTADOR
              </span>
            ) : !isMyTurnActive ? (
              <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-bold">
                EM ANDAMENTO
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border",
                isMyTurnActive
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs"
                  : "bg-zinc-800 text-zinc-300 border-zinc-700"
              )}
            >
              {isMyTurnActive ? "⚡" : (currentTurnPlayerName || "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  "text-xs font-black truncate",
                  isMyTurnActive ? "text-emerald-400" : "text-zinc-200"
                )}
              >
                {isMyTurnActive ? "Você" : currentTurnPlayerName || "Aguardando..."}
              </p>
              <p className="text-[10px] text-zinc-400 truncate">
                {isMyTurnActive
                  ? isMyExtraPlay
                    ? "Jogada extra (Objeto)"
                    : "Sua vez de jogar"
                  : isSpectator
                  ? "Assistindo à partida"
                  : "Aguardando jogada"}
              </p>
            </div>
          </div>

          {turnTimerEnabled && remainingSeconds !== null && (
            <div className="mt-2.5 pt-2.5 border-t border-zinc-800/80 space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-zinc-400 flex items-center gap-1 font-bold">
                  <Timer className="w-3 h-3 text-zinc-400" /> Tempo
                </span>
                <span
                  className={cn(
                    "font-black px-1.5 py-0.5 rounded",
                    remainingSeconds <= 5
                      ? "text-red-400 bg-red-500/10 font-bold animate-pulse"
                      : remainingSeconds <= 10
                      ? "text-amber-400 bg-amber-500/10"
                      : "text-primary"
                  )}
                >
                  {remainingSeconds}s
                </span>
              </div>
              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full transition-all duration-200 ease-linear rounded-full",
                    remainingSeconds > 10
                      ? "bg-primary"
                      : remainingSeconds > 5
                      ? "bg-amber-500"
                      : "bg-red-500 animate-pulse"
                  )}
                  style={{
                    width: `${Math.min(100, Math.max(0, (remainingSeconds / turnTimerDuration) * 100))}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Acordeão do Histórico de Jogadas */}
      <div
        className={cn(
          "flex flex-col transition-all duration-300",
          isActionLogExpanded ? "flex-1 min-h-0" : "shrink-0"
        )}
      >
        <button
          type="button"
          onClick={() => setIsActionLogExpanded(!isActionLogExpanded)}
          className="w-full flex items-center justify-between p-3 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 active:scale-[0.99] border border-zinc-800/80 hover:border-zinc-700 text-left transition-all cursor-pointer shadow-md group"
        >
          <div className="flex items-center gap-2 truncate">
            <span className="text-sm shrink-0">📜</span>
            <span className="text-xs font-black text-zinc-200 tracking-tight group-hover:text-primary transition-colors truncate">
              Histórico ({actionLog.length})
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isActionLogExpanded ? (
              <ChevronUp className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 transition-transform" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 transition-transform" />
            )}
          </div>
        </button>

        {isActionLogExpanded && (
          <div className="flex-1 flex flex-col min-h-0 bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-3 shadow-xl mt-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
              {actionLog.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-3 text-zinc-500 text-xs gap-1.5">
                  <History className="w-6 h-6 opacity-30" />
                  <span>Aguardando o início das jogadas...</span>
                </div>
              ) : (
                actionLog.map((log, index) => (
                  <div
                    key={index}
                    className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-[11px] leading-snug text-zinc-300 shadow-2xs"
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
        )}
      </div>
    </aside>
  );
}
