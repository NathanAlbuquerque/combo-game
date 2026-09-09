"use client";

import { MatchStats, Player } from "@/types/game";
import { Button } from "@/components/ui/button";
import { BarChart3, Clock, Zap, Layers, Trophy, X, RotateCcw } from "lucide-react";

interface MatchStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats?: MatchStats | null;
  winnerId?: string | null;
  players?: Record<string, Player>;
}

function formatDuration(startedAt: number, finishedAt?: number): string {
  const end = finishedAt || Date.now();
  const diffSecs = Math.max(0, Math.floor((end - startedAt) / 1000));
  const mins = Math.floor(diffSecs / 60);
  const secs = diffSecs % 60;
  if (mins === 0) {
    return `${secs}s`;
  }
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}

export function MatchStatsModal({
  isOpen,
  onClose,
  stats,
  winnerId,
  players = {},
}: MatchStatsModalProps) {
  if (!isOpen) return null;

  const playerStatsList = stats?.playerStats
    ? Object.entries(stats.playerStats).map(([pid, pStats]) => ({
        pid,
        name: pStats.playerName || players[pid]?.name || "Jogador",
        cardsDrawn: pStats.cardsDrawn,
        effectsPlayed: pStats.effectsPlayed,
        objectsPlayed: pStats.objectsPlayed,
        eliminated: pStats.eliminated,
        isWinner: pid === winnerId,
      }))
    : [];

  // Ordena os jogadores: vencedor no topo, depois por maior número de objetos
  playerStatsList.sort((a, b) => {
    if (a.isWinner) return -1;
    if (b.isWinner) return 1;
    return b.objectsPlayed - a.objectsPlayed;
  });

  const maxObjects = Math.max(1, ...playerStatsList.map((p) => p.objectsPlayed));
  const maxEffects = Math.max(1, ...playerStatsList.map((p) => p.effectsPlayed));
  const maxDrawn = Math.max(1, ...playerStatsList.map((p) => p.cardsDrawn));

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-card border-2 border-border text-card-foreground rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-border flex items-center justify-between bg-card/60 backdrop-blur shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-foreground uppercase tracking-wider flex items-center gap-1.5">
                Estatísticas da Partida
              </h2>
              <p className="text-xs text-muted-foreground">
                Resumo completo da rodada e desempenho dos jogadores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted/50 transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6">
          
          {/* 1. Resumo Geral da Rodada (4 Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <div className="bg-muted/30 border rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Duração</span>
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <span className="text-lg sm:text-xl font-black text-foreground">
                {stats ? formatDuration(stats.startedAt, stats.finishedAt) : "--"}
              </span>
            </div>

            <div className="bg-muted/30 border rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Turnos</span>
                <RotateCcw className="w-4 h-4 text-sky-500" />
              </div>
              <span className="text-lg sm:text-xl font-black text-foreground">
                {stats?.totalTurns ?? 0}
              </span>
            </div>

            <div className="bg-muted/30 border rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Compras</span>
                <Layers className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-lg sm:text-xl font-black text-foreground">
                {stats?.totalCardsDrawn ?? 0}
              </span>
            </div>

            <div className="bg-muted/30 border rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between text-muted-foreground mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider">Efeitos</span>
                <Zap className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-lg sm:text-xl font-black text-foreground">
                {stats?.totalEffectsPlayed ?? 0}
              </span>
            </div>
          </div>

          {/* 2. Grid Comparativo de Jogadores */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span>Desempenho Individual</span>
              </h3>
              <div className="flex items-center gap-3 text-[10px] sm:text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  Objetos
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                  Efeitos
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block" />
                  Compras
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {playerStatsList.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6 italic">
                  Nenhuma estatística disponível para esta partida.
                </p>
              ) : (
                playerStatsList.map((p) => (
                  <div
                    key={p.pid}
                    className={`border rounded-2xl p-3 sm:p-4 transition-all ${
                      p.isWinner
                        ? "bg-amber-500/10 border-amber-500/40 shadow-sm"
                        : "bg-muted/20 hover:bg-muted/30"
                    }`}
                  >
                    {/* Header do Jogador */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-extrabold text-sm sm:text-base text-foreground truncate">
                          {p.name}
                        </span>
                        {p.isWinner && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider shrink-0">
                            <Trophy className="w-3 h-3" /> Vencedor
                          </span>
                        )}
                        {p.eliminated && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-destructive/15 text-destructive text-[10px] font-bold uppercase tracking-wider shrink-0">
                            Eliminado 💀
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Barras de Progresso Comparativas */}
                    <div className="space-y-2 text-xs">
                      {/* Objetos */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                          <span>Objetos Baixados</span>
                          <span className="text-emerald-500 font-bold">{p.objectsPlayed}</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                            style={{ width: `${(p.objectsPlayed / maxObjects) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Efeitos */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                          <span>Efeitos Disparados</span>
                          <span className="text-amber-500 font-bold">{p.effectsPlayed}</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500 rounded-full transition-all duration-500"
                            style={{ width: `${(p.effectsPlayed / maxEffects) * 100}%` }}
                          />
                        </div>
                      </div>

                      {/* Cartas Compradas */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                          <span>Cartas Compradas</span>
                          <span className="text-sky-500 font-bold">{p.cardsDrawn}</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-sky-500 rounded-full transition-all duration-500"
                            style={{ width: `${(p.cardsDrawn / maxDrawn) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-border bg-card/60 backdrop-blur flex justify-end shrink-0">
          <Button onClick={onClose} variant="outline" className="w-full sm:w-auto px-6 font-bold">
            Fechar
          </Button>
        </div>

      </div>
    </div>
  );
}
