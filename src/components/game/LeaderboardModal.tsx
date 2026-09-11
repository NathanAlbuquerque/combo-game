"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Trophy, X, RefreshCw, Globe, Home, Medal, Flame } from "lucide-react";
import { PlayerRankEntry, LeaderboardData } from "@/types/game";
import { Button } from "@/components/ui/button";

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomLeaderboard?: Record<string, PlayerRankEntry>;
  currentRoomId?: string;
}

export function LeaderboardModal({
  isOpen,
  onClose,
  roomLeaderboard,
  currentRoomId,
}: LeaderboardModalProps) {
  const hasRoomOption = Boolean(currentRoomId || roomLeaderboard);
  const [activeTab, setActiveTab] = useState<"global" | "room">("global");
  const [globalData, setGlobalData] = useState<LeaderboardData>(() => ({
    global: [],
    lastResetAt: Date.now(),
  }));
  const [isLoading, setIsLoading] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  // Atualiza relógio do countdown a cada 30 segundos
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Tecla ESC para fechar
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const loadGlobalLeaderboard = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const res = await fetch("/api/leaderboard", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as LeaderboardData;
        setGlobalData(data);
        setIsLoading(false);
        return;
      }
    } catch {
      // Fallback para PartyKit direto
      try {
        const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999";
        const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
        const res = await fetch(`${protocol}://${host}/parties/main/global-registry?type=leaderboard`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = (await res.json()) as LeaderboardData;
          setGlobalData(data);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Falha ao buscar ranking no fallback:", err);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    const fetchInitial = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/leaderboard", { cache: "no-store" });
        if (res.ok && isMounted) {
          const data = (await res.json()) as LeaderboardData;
          setGlobalData(data);
        }
      } catch (e) {
        console.warn("Erro ao buscar leaderboard inicial:", e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchInitial();
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Countdown para o reset diário de 24h
  const resetCountdown = useMemo(() => {
    const nextReset = (globalData.lastResetAt || now) + 24 * 60 * 60 * 1000;
    const diff = Math.max(0, nextReset - now);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes.toString().padStart(2, "0")}m`;
  }, [globalData.lastResetAt, now]);

  // Lista ordenada do ranking da sala
  const roomRanks = useMemo(() => {
    if (!roomLeaderboard) return [];
    const list = Object.values(roomLeaderboard);
    list.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.lastWinAt !== a.lastWinAt) return b.lastWinAt - a.lastWinAt;
      return a.matchesPlayed - b.matchesPlayed;
    });
    return list;
  }, [roomLeaderboard]);

  if (!isOpen) return null;

  const currentList = activeTab === "global" ? globalData.global : roomRanks;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Classificação de jogadores"
    >
      <div className="relative flex flex-col max-w-sm sm:max-w-md w-full bg-card border border-border/70 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center border border-amber-500/40 shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground flex items-center gap-1.5">
                Ranking de Campeões
              </h2>
              <p className="text-[11px] text-muted-foreground font-medium">
                {activeTab === "global" ? "Classificação geral diária" : `Placar da sala #${currentRoomId || ""}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {activeTab === "global" && (
              <button
                type="button"
                onClick={() => loadGlobalLeaderboard(true)}
                disabled={isLoading}
                className="w-8 h-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
                title="Atualizar ranking"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-primary" : ""}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Fechar modal de ranking"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Abas: Geral vs Desta Sala */}
        <div className="p-3 pb-2">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/50">
            <button
              type="button"
              onClick={() => setActiveTab("global")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "global"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Geral (Global)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("room")}
              disabled={!hasRoomOption}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "room"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : !hasRoomOption
                  ? "opacity-40 cursor-not-allowed text-muted-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
              title={!hasRoomOption ? "Disponível apenas dentro de uma partida" : undefined}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Desta Sala {roomRanks.length > 0 ? `(${roomRanks.length})` : ""}</span>
            </button>
          </div>

          {/* Banner de Reset Diário (Aba Geral) */}
          {activeTab === "global" && (
            <div className="mt-2.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
              <span className="flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>Ciclo Diário de 24h</span>
              </span>
              <span className="font-mono font-bold">Reseta em: {resetCountdown}</span>
            </div>
          )}
        </div>

        {/* Lista de Classificação */}
        <div className="p-3 pt-1 max-h-[380px] overflow-y-auto space-y-2">
          {isLoading && activeTab === "global" && globalData.global.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center gap-2 text-muted-foreground animate-pulse">
              <RefreshCw className="w-6 h-6 animate-spin text-primary" />
              <p className="text-xs font-medium">Carregando placar de campeões...</p>
            </div>
          ) : currentList.length === 0 ? (
            <div className="py-10 text-center flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-border/60 bg-muted/10">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-lg mb-2">
                🏆
              </div>
              <p className="text-xs font-bold text-foreground">
                {activeTab === "global"
                  ? "Nenhuma partida registrada ainda hoje."
                  : "Nenhuma partida finalizada nesta sala ainda."}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 max-w-[260px]">
                {activeTab === "global"
                  ? "Seja o primeiro a vencer e conquiste o topo do ranking diário!"
                  : "Jogue uma rodada até o fim para registrar os pontos deste grupo!"}
              </p>
            </div>
          ) : (
            currentList.map((entry, index) => {
              const position = index + 1;
              const isFirst = position === 1;
              const isSecond = position === 2;
              const isThird = position === 3;
              const winRate = entry.matchesPlayed > 0
                ? Math.round((entry.wins / entry.matchesPlayed) * 100)
                : 0;

              return (
                <div
                  key={entry.name + position}
                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 shadow-2xs ${
                    isFirst
                      ? "bg-amber-500/10 border-amber-500/40"
                      : isSecond
                      ? "bg-slate-300/10 border-slate-400/40"
                      : isThird
                      ? "bg-amber-700/10 border-amber-700/40"
                      : "bg-card/70 border-border/60 hover:bg-muted/30"
                  }`}
                >
                  {/* Posição + Nome */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Badge de Posição */}
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                        isFirst
                          ? "bg-amber-500/20 text-amber-500 border border-amber-500/50"
                          : isSecond
                          ? "bg-slate-300/20 text-slate-300 border border-slate-300/50"
                          : isThird
                          ? "bg-amber-700/20 text-amber-600 dark:text-amber-500 border border-amber-700/50"
                          : "bg-muted text-muted-foreground font-mono"
                      }`}
                    >
                      {isFirst ? "🥇" : isSecond ? "🥈" : isThird ? "🥉" : `#${position}`}
                    </div>

                    <div className="min-w-0">
                      <p className="font-extrabold text-xs sm:text-sm text-foreground truncate">
                        {entry.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                        <span>{entry.matchesPlayed} {entry.matchesPlayed === 1 ? "partida" : "partidas"}</span>
                        <span>•</span>
                        <span>{winRate}% vitórias</span>
                      </p>
                    </div>
                  </div>

                  {/* Vitórias */}
                  <div className="text-right shrink-0">
                    <span className="inline-flex items-center gap-1 font-black text-xs sm:text-sm text-primary">
                      <Medal className="w-3.5 h-3.5 fill-current" />
                      <span>{entry.wins}</span>
                    </span>
                    <p className="text-[9.5px] text-muted-foreground uppercase font-bold tracking-wider">
                      {entry.wins === 1 ? "vitória" : "vitórias"}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border/60 bg-muted/20 flex justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            className="w-full font-bold text-xs h-9 cursor-pointer"
          >
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
