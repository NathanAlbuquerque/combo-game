"use client";

import { GameState } from "@/types/game";
import { Users, X, Crown, Sparkles, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VICTORY_OBJECTS_REQUIRED } from "@/constants";

interface RoomPlayersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  state: GameState;
  myId: string;
}

export function RoomPlayersDrawer({
  isOpen,
  onClose,
  state,
  myId,
}: RoomPlayersDrawerProps) {
  if (!isOpen) return null;

  const allPlayers = Object.values(state.players);
  const spectators = allPlayers.filter((p) => p.isSpectating);
  
  // Ordem sequencial da rodada (definida no início da partida ou fallback ordenado)
  const orderIds = (state.turnOrder && state.turnOrder.length > 0)
    ? state.turnOrder
    : allPlayers.filter((p) => !p.isSpectating).map((p) => p.id);

  // Mapeia jogadores ativos de acordo com turnOrder
  const activePlayers = orderIds
    .map((id) => state.players[id])
    .filter(Boolean);

  // Caso haja algum jogador ativo não contemplado no turnOrder (fallback de segurança)
  allPlayers.forEach((p) => {
    if (!p.isSpectating && !activePlayers.some((ap) => ap.id === p.id)) {
      activePlayers.push(p);
    }
  });

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-[360px] sm:max-w-[400px] h-full bg-card border-l border-border/80 shadow-2xl flex flex-col relative animate-in slide-in-from-right duration-300 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-border/60 bg-muted/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/25 text-primary flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-sm text-foreground uppercase tracking-wider flex items-center gap-2">
                Jogadores da Sala
              </h3>
              <p className="text-[11px] text-muted-foreground">
                {allPlayers.length} {allPlayers.length === 1 ? "conectado" : "conectados"} • {activePlayers.length} em jogo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            title="Fechar gaveta"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Seção 1: Jogadores Ativos & Ordem da Rodada */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-black text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <span>Ordem da Rodada</span>
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.2 rounded-md font-mono">
                  {activePlayers.length}
                </span>
              </span>
              <span className="text-[10px] text-muted-foreground italic">
                Sequência de turnos
              </span>
            </div>

            {activePlayers.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-3 text-center">
                Nenhum jogador ativo na rodada atual.
              </p>
            ) : (
              <div className="space-y-2">
                {activePlayers.map((player, index) => {
                  const isCurrentTurn = state.currentTurnPlayerId === player.id;
                  const isMe = player.id === myId;
                  const isLeader = player.id === state.creatorId;

                  return (
                    <div
                      key={player.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        isCurrentTurn
                          ? "bg-primary/10 border-primary shadow-md shadow-primary/15 ring-1 ring-primary/40"
                          : isMe
                          ? "bg-muted/40 border-border/80"
                          : "bg-card border-border/50"
                      } ${player.isEliminated ? "opacity-50 grayscale" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                          {/* Badge de Ordem Sequencial */}
                          <span className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${
                            isCurrentTurn
                              ? "bg-primary text-primary-foreground font-mono"
                              : "bg-muted text-muted-foreground font-mono"
                          }`}>
                            {index + 1}º
                          </span>

                          <span className="font-black text-sm text-foreground truncate" title={player.name}>
                            {player.name}
                          </span>

                          {isMe && (
                            <span className="text-[9.5px] bg-primary/20 text-primary px-1.5 py-0.2 rounded font-bold shrink-0">
                              Você
                            </span>
                          )}

                          {player.isBot && (
                            <span className="text-[9.5px] bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/30 px-1.5 py-0.2 rounded font-bold shrink-0">
                              BOT
                            </span>
                          )}

                          {isLeader && (
                            <span className="text-[9.5px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded font-bold flex items-center gap-0.5 shrink-0" title="Criador da sala">
                              <Crown className="w-2.5 h-2.5" />
                              Líder
                            </span>
                          )}
                        </div>

                        {/* Status de Turno ou Bloqueio */}
                        {isCurrentTurn && (
                          <span className="text-[10px] uppercase font-black bg-primary text-primary-foreground px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 shrink-0 animate-pulse">
                            <Sparkles className="w-3 h-3" />
                            Turno
                          </span>
                        )}
                        {player.isEliminated && (
                          <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                            Eliminado 💀
                          </span>
                        )}
                        {!player.isEliminated && (player.skipNextTurn || player.isBlocked) && (
                          <span className="text-[10px] uppercase font-bold text-destructive bg-destructive/15 border border-destructive/25 px-2 py-0.5 rounded-full shrink-0">
                            Bloqueado 🚫
                          </span>
                        )}
                      </div>

                      {/* Métricas: Cartas na Mão & Objetos na Mesa */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium pt-1 border-t border-border/30">
                        <span className="flex items-center gap-1">
                          <span className="text-sm">🃏</span>
                          <strong>{player.hand.length}</strong> na mão
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="text-sm">🧩</span>
                          <strong>{player.objectArea.length}/{VICTORY_OBJECTS_REQUIRED}</strong> na mesa
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Seção 2: Modo de Espera (Espectadores) */}
          <div className="pt-3 border-t border-border/60">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5" />
                <span>Modo de Espera (Espectadores)</span>
                <span className="text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded-md font-mono font-bold">
                  {spectators.length}
                </span>
              </span>
            </div>

            {spectators.length === 0 ? (
              <div className="p-3 bg-muted/20 border border-dashed rounded-xl text-center">
                <p className="text-xs text-muted-foreground italic">
                  Nenhum espectador na sala no momento.
                </p>
                <p className="text-[10px] text-muted-foreground/75 mt-0.5">
                  Novos jogadores que entrarem durante o jogo aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {spectators.map((spec) => {
                  const isMe = spec.id === myId;
                  return (
                    <div
                      key={spec.id}
                      className="p-2.5 rounded-xl border bg-amber-500/5 border-amber-500/25 flex items-center justify-between gap-2 shadow-xs"
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Eye className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-xs text-foreground truncate" title={spec.name}>
                          {spec.name}
                        </span>
                        {isMe && (
                          <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.2 rounded font-bold shrink-0">
                            Você
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full shrink-0">
                        Entra na próxima rodada ⏳
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border/60 bg-muted/20 shrink-0">
          <Button onClick={onClose} variant="outline" className="w-full font-bold h-10">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
