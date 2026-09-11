"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Users, Play } from "lucide-react";
import { RoomSummary } from "@/types/game";
import { Button } from "@/components/ui/button";

interface PublicRoomsListProps {
  playerName?: string;
  onRequireName?: () => void;
}

export function PublicRoomsList({ playerName = "" }: PublicRoomsListProps) {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadRooms = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      // 1. Tenta a rota interna /api/rooms (proxy seguro e sem problemas de CORS)
      const res = await fetch("/api/rooms", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as RoomSummary[];
        setRooms(Array.isArray(data) ? data : []);
        setIsLoading(false);
        return;
      }
    } catch {
      // Fallback para PartyKit direto se a API local falhar
      try {
        const host = process.env.NEXT_PUBLIC_PARTYKIT_HOST || "localhost:1999";
        const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
        const res = await fetch(`${protocol}://${host}/parties/main/global-registry`, { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as RoomSummary[];
          setRooms(Array.isArray(data) ? data : []);
          setIsLoading(false);
          return;
        }
      } catch (e) {
        console.warn("Falha ao buscar salas no fallback direto:", e);
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchInitial = async () => {
      try {
        const res = await fetch("/api/rooms", { cache: "no-store" });
        if (res.ok && isMounted) {
          const data = (await res.json()) as RoomSummary[];
          setRooms(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.warn("Erro ao buscar salas inicialmente:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchInitial();
    const interval = setInterval(() => {
      loadRooms(false);
    }, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [loadRooms]);

  const handleJoin = (roomId: string) => {
    const cleanName = playerName.trim();
    if (cleanName) {
      router.push(`/room/${roomId}?name=${encodeURIComponent(cleanName)}`);
    } else {
      router.push(`/room/${roomId}`);
    }
  };

  return (
    <section className="w-full space-y-3 pt-2">
      {/* Cabeçalho da seção */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-black tracking-tight text-foreground flex items-center gap-1.5">
            🌐 Salas Abertas
          </span>
          {rooms.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/20 text-primary font-bold">
              {rooms.length}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => loadRooms(true)}
          disabled={isLoading}
          className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer p-1 rounded-md hover:bg-muted active:scale-95 disabled:opacity-50"
          title="Atualizar lista de salas"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-primary" : ""}`} />
          <span className="text-[10px]">Atualizar</span>
        </button>
      </div>

      {/* Lista ou Estados de Loading / Vazio */}
      {isLoading && rooms.length === 0 ? (
        <div className="p-4 rounded-xl border border-border/50 bg-card/40 flex flex-col items-center justify-center gap-2 text-center text-muted-foreground animate-pulse">
          <RefreshCw className="w-5 h-5 animate-spin text-primary/70" />
          <p className="text-xs font-medium">Buscando salas disponíveis...</p>
        </div>
      ) : rooms.length === 0 ? (
        <div className="p-4 rounded-xl border border-dashed border-border/60 bg-muted/20 flex flex-col items-center justify-center gap-1.5 text-center">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
            🎲
          </div>
          <p className="text-xs font-bold text-foreground">Nenhuma sala pública no momento</p>
          <p className="text-[11px] text-muted-foreground max-w-[280px]">
            Que tal criar uma nova sala acima e convidar seus amigos para jogar?
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5 scrollbar-none">
          {rooms.map((room) => {
            const isLobby = room.status === "lobby";
            const isPlaying = room.status === "playing";

            return (
              <div
                key={room.id}
                className="p-3 rounded-xl border border-border/60 bg-card/80 hover:bg-card hover:border-primary/40 transition-all flex items-center justify-between gap-3 shadow-xs"
              >
                {/* Detalhes da Sala */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs sm:text-sm text-primary tracking-widest">
                      #{room.id}
                    </span>
                    <span className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                      <Users className="w-3 h-3 shrink-0" />
                      <span className="truncate">{room.leaderName || "Líder"}</span>
                    </span>
                  </div>

                  {/* Badge de Status */}
                  <div className="flex items-center gap-1.5">
                    {isLobby ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                        <span>
                          Aguardando Jogadores ({room.playerCount}/{room.maxPlayers || 5})
                        </span>
                      </span>
                    ) : isPlaying ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        <Play className="w-2.5 h-2.5 fill-current" />
                        <span>
                          Em Andamento ({room.playerCount}/{room.maxPlayers || 5}) • Assistir
                        </span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-500/15 text-zinc-400 border border-zinc-500/30">
                        Partida Finalizada
                      </span>
                    )}
                  </div>
                </div>

                {/* Botão de Ação */}
                <Button
                  size="sm"
                  variant={isLobby ? "default" : "secondary"}
                  onClick={() => handleJoin(room.id)}
                  className="font-bold text-xs h-8 px-3 cursor-pointer shrink-0"
                >
                  {isLobby ? "Entrar" : "Assistir"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
