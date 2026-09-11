"use client";

import { Player } from "@/types/game";
import { Button } from "@/components/ui/button";
import { BarChart3 } from "lucide-react";

interface GameOverViewProps {
  winner: Player | null;
  isMe: boolean;
  isLeader: boolean;
  categories: string[];
  onOpenStats: () => void;
  onReturnToLobby: () => void;
}

export function GameOverView({
  winner,
  isMe,
  isLeader,
  categories,
  onOpenStats,
  onReturnToLobby,
}: GameOverViewProps) {
  return (
    <div className="min-h-screen w-full bg-zinc-950 bg-gradient-to-b from-zinc-900/60 via-zinc-950 to-black flex justify-center items-center overflow-x-hidden font-sans select-none">
      <div className="w-full max-w-[440px] sm:max-w-[480px] min-h-[100dvh] bg-background shadow-2xl relative flex flex-col justify-center items-center p-6 border-x border-border/40">
        <div className="bg-card text-card-foreground border p-6 sm:p-8 rounded-3xl w-full shadow-lg flex flex-col items-center gap-4 animate-in zoom-in duration-500">
          <span className="text-5xl mb-1">{isMe ? "🎉" : "🏆"}</span>
          <h2 className="text-2xl font-black text-primary uppercase tracking-wider text-center">
            Fim de Jogo!
          </h2>

          <div className="my-1 py-3 border-y border-border w-full text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
              O Vencedor é
            </p>
            <p className="text-3xl font-black text-foreground truncate px-2">{winner?.name}</p>
          </div>

          {categories.length > 0 && (
            <div className="w-full">
              <p className="text-[11px] font-bold text-muted-foreground uppercase text-center mb-2">
                Categorias Reunidas
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                {categories.map((cat, i) => (
                  <span
                    key={i}
                    className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      cat === "CARTA CORINGA"
                        ? "bg-gradient-to-r from-red-500 via-green-500 to-blue-500 text-white"
                        : "bg-primary/20 text-primary border border-primary/30"
                    }`}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="w-full flex flex-col gap-2 mt-2">
            <Button
              variant="outline"
              onClick={onOpenStats}
              className="w-full font-bold gap-2 cursor-pointer h-10 text-xs border-primary/30 hover:bg-primary/10"
            >
              <BarChart3 className="w-4 h-4 text-primary" />
              <span>Ver Estatísticas da Partida</span>
            </Button>

            {isLeader ? (
              <Button
                onClick={onReturnToLobby}
                className="w-full font-black h-11 text-sm shadow-md cursor-pointer"
              >
                Reiniciar e Voltar ao Lobby
              </Button>
            ) : (
              <p className="text-xs text-center text-muted-foreground animate-pulse py-2">
                Aguardando o líder reiniciar a partida...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
