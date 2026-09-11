"use client";

import { Player, RoomSettings } from "@/types/game";
import { Button } from "@/components/ui/button";
import { CopyRoomButton } from "./CopyRoomButton";
import { Settings, QrCode, Users, LogOut, Play } from "lucide-react";
import { MIN_PLAYERS_AUTO_START } from "@/constants";

interface LobbyViewProps {
  roomId: string;
  isCreator: boolean;
  playersList: Player[];
  myId: string;
  roomSettings?: RoomSettings;
  autoStartSeconds: number | null;
  onStartGame: () => void;
  onOpenShareModal: () => void;
  onOpenSettingsModal: () => void;
  onLeaveRoom: () => void;
}

export function LobbyView({
  roomId,
  isCreator,
  playersList,
  myId,
  roomSettings,
  autoStartSeconds,
  onStartGame,
  onOpenShareModal,
  onOpenSettingsModal,
  onLeaveRoom,
}: LobbyViewProps) {
  return (
    <div className="min-h-screen w-full bg-zinc-950 bg-gradient-to-b from-zinc-900/60 via-zinc-950 to-black flex justify-center items-center overflow-x-hidden font-sans relative select-none">
      <div className="w-full flex justify-center items-stretch h-[100dvh] max-h-[100dvh]">
        {/* ========================================================= */}
        {/* TARJA ESCURA LATERAL ESQUERDA (Desktop: hidden lg:flex) */}
        {/* ========================================================= */}
        <aside className="hidden lg:flex flex-col w-[230px] xl:w-[250px] p-3.5 py-4 shrink-0 justify-between gap-3 select-none">
          <div className="space-y-3 shrink-0">
            <div className="px-1 pb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Compartilhar Sala
              </span>
            </div>

            {/* 1. Botão Copiar Link */}
            <CopyRoomButton
              roomId={roomId}
              variant="secondary"
              size="default"
              className="w-full justify-center font-bold text-xs h-10 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-500 text-zinc-100 hover:text-white cursor-pointer transition-all shadow-md rounded-xl"
            />

            {/* 2. Botão QR Code */}
            <Button
              variant="outline"
              size="default"
              onClick={onOpenShareModal}
              className="w-full justify-center font-bold text-xs h-10 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 hover:border-zinc-500 text-zinc-100 hover:text-white cursor-pointer gap-2 shadow-md transition-all rounded-xl"
            >
              <QrCode className="w-4 h-4 text-zinc-100" />
              <span>QR Code / Convidar</span>
            </Button>
          </div>

          {/* 3. Botão Sair da Sala */}
          <div className="pt-3 border-t border-zinc-800/80 mt-auto">
            <button
              type="button"
              onClick={onLeaveRoom}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-zinc-900/90 hover:bg-red-500/20 active:scale-95 border border-zinc-700/80 hover:border-red-500/50 text-zinc-400 hover:text-red-400 text-xs font-bold transition-all cursor-pointer shadow-md"
              title="Sair da Sala"
              aria-label="Sair da Sala"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da Sala</span>
            </button>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* CONTÊINER CENTRAL DO LOBBY (Mobile & Desktop) */}
        {/* ========================================================= */}
        <div className="w-full max-w-[440px] sm:max-w-[480px] h-[100dvh] max-h-[100dvh] bg-background shadow-2xl relative flex flex-col justify-between p-4 sm:p-5 overflow-hidden border-x border-border/40 select-none shrink-0">
          {/* Cabeçalho do Lobby com Código Grande em Destaque */}
          <header className="w-full flex items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-border/60 shrink-0">
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Código da Sala
              </span>
              <span className="font-mono font-black text-2xl sm:text-3xl text-primary tracking-widest select-all truncate">
                #{roomId}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenSettingsModal}
                className="h-9 px-3 text-xs font-bold cursor-pointer gap-1.5 rounded-xl border-border/80 hover:bg-muted"
                title="Configurações da sala"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Configurações</span>
                {roomSettings?.turnTimerEnabled && (
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
              </Button>

              {/* Botões rápidos apenas no mobile para suprir as tarjas laterais ausentes */}
              <div className="lg:hidden flex items-center gap-1">
                <CopyRoomButton roomId={roomId} size="sm" iconOnly className="h-9 w-9 p-0 cursor-pointer rounded-xl" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenShareModal}
                  className="h-9 w-9 p-0 text-xs font-bold cursor-pointer text-primary border-primary/30 bg-primary/10 hover:bg-primary/20 rounded-xl"
                  title="Compartilhar com QR Code"
                >
                  <QrCode className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLeaveRoom}
                  className="text-xs text-muted-foreground hover:text-destructive h-9 px-2 cursor-pointer"
                  title="Sair da sala"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Conteúdo Central: Lista de Participantes Conectados */}
          <main className="w-full flex-1 flex flex-col justify-between py-3 min-h-0 overflow-y-auto">
            {/* Banner de Início Automático (se ativo) */}
            {autoStartSeconds !== null && (
              <div className="p-3 mb-2 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs animate-pulse text-center shrink-0">
                <span>⏳ Partida iniciando automaticamente em {autoStartSeconds}s... Preparem-se!</span>
              </div>
            )}

            {/* Lista de Participantes Conectados */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50 shrink-0">
                <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary shrink-0" />
                  <span>Participantes Conectados ({playersList.length})</span>
                </h2>
                <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Mín. {MIN_PLAYERS_AUTO_START} jogadores
                </span>
              </div>

              <ul className="space-y-2 flex-1 overflow-y-auto pr-0.5 scrollbar-thin">
                {playersList.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between p-3 bg-card border rounded-xl shadow-xs transition-all hover:border-primary/40"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary font-black text-xs flex items-center justify-center border border-primary/20 shrink-0">
                        {p.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-sm block truncate">{p.name}</span>
                        <span className="text-[10px] text-muted-foreground block truncate">
                          {p.isCreator ? "Criador da sala" : "Participante"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {p.id === myId && (
                        <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                          Você
                        </span>
                      )}
                      {p.isCreator && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">
                          Líder
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Botão de Iniciar Jogo (Mobile & Desktop) */}
            <div className="pt-3 border-t border-border/60 shrink-0">
              {isCreator ? (
                <Button
                  onClick={onStartGame}
                  disabled={playersList.length < MIN_PLAYERS_AUTO_START}
                  className="w-full h-13 sm:h-14 font-black text-sm sm:text-base tracking-wide shadow-xl cursor-pointer bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-500/30"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>
                    {playersList.length < MIN_PLAYERS_AUTO_START
                      ? `Aguardando Jogadores (Mín. ${MIN_PLAYERS_AUTO_START})`
                      : "Iniciar Partida"}
                  </span>
                </Button>
              ) : (
                <div className="w-full p-3 sm:p-3.5 rounded-2xl bg-muted/50 border border-border/60 text-center space-y-1">
                  <span className="text-xs font-black text-foreground block">Aguardando o Líder</span>
                  <span className="text-[11px] text-muted-foreground block animate-pulse">
                    O líder da sala iniciará a partida em breve...
                  </span>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Espaçador simétrico no desktop para centralizar o contêiner branco perfeitamente */}
        <div className="hidden lg:block w-[230px] xl:w-[250px] pointer-events-none shrink-0" aria-hidden="true" />
      </div>
    </div>
  );
}
