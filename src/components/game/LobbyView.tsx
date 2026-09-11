"use client";

import { Player, RoomSettings } from "@/types/game";
import { Button } from "@/components/ui/button";
import { CopyRoomButton } from "./CopyRoomButton";
import { Settings, QrCode, Users, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

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
        {/* FLANCO ESQUERDO DO LOBBY (Desktop: hidden lg:flex) */}
        {/* ========================================================= */}
        <aside className="hidden lg:flex flex-col w-[230px] xl:w-[250px] p-3.5 py-4 shrink-0 justify-between gap-3 select-none">
          <div className="space-y-3 shrink-0">
            {/* Código da Sala e Ações de Compartilhamento */}
            <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-3.5 shadow-md space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Código da Sala
                </span>
                <span className="font-mono font-black text-sm text-zinc-100 tracking-widest bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-700/80 select-all shadow-inner">
                  #{roomId}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onOpenShareModal}
                  className="w-full justify-center font-bold text-xs h-8 bg-primary/10 hover:bg-primary/20 text-primary border-primary/30 cursor-pointer gap-1.5 shadow-2xs"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QR Code / Convidar</span>
                </Button>
                <CopyRoomButton
                  roomId={roomId}
                  variant="secondary"
                  size="sm"
                  className="w-full justify-center font-bold text-xs h-8 bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-100 border-zinc-700 cursor-pointer"
                />
              </div>
            </div>

            {/* Regras e Metadados da Sala */}
            <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-2xl p-3.5 shadow-md space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block">
                Regras da Sala
              </span>
              <div className="text-xs space-y-2 text-zinc-300">
                <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/60">
                  <span className="text-zinc-400 text-[11px]">Participantes:</span>
                  <span className="font-mono font-bold text-zinc-100 text-xs">{playersList.length} / 6</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800/60">
                  <span className="text-zinc-400 text-[11px]">Anti-Stall:</span>
                  <span
                    className={cn(
                      "font-bold text-[11px]",
                      roomSettings?.turnTimerEnabled ? "text-primary" : "text-zinc-500"
                    )}
                  >
                    {roomSettings?.turnTimerEnabled
                      ? `${roomSettings.turnTimerDuration}s / turno`
                      : "Desativado"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400 text-[11px]">Vitória:</span>
                  <span className="font-bold text-zinc-100 text-[11px]">5 Objetos</span>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ========================================================= */}
        {/* CONTÊINER CENTRAL DO LOBBY (Mobile & Desktop) */}
        {/* ========================================================= */}
        <div className="w-full max-w-[440px] sm:max-w-[480px] h-[100dvh] max-h-[100dvh] bg-background shadow-2xl relative flex flex-col justify-between p-4 sm:p-5 overflow-hidden border-x border-border/40 select-none shrink-0">
          {/* Topo Mobile (lg:hidden) */}
          <header className="lg:hidden w-full flex items-center justify-between gap-2 pb-3 border-b shrink-0">
            <div className="flex items-center gap-1.5 bg-zinc-900/90 px-2.5 py-1 rounded-lg border border-zinc-700/80">
              <span className="font-mono font-black text-sm text-zinc-100 tracking-wider select-all">
                #{roomId}
              </span>
              <CopyRoomButton roomId={roomId} size="sm" iconOnly className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground cursor-pointer" />
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenSettingsModal}
                className="h-8 px-2 text-xs font-bold cursor-pointer"
                title="Configurações da sala"
              >
                <Settings className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenShareModal}
                className="h-8 px-2 text-xs font-bold cursor-pointer text-primary border-primary/30 bg-primary/10 hover:bg-primary/20"
                title="Compartilhar com QR Code"
              >
                <QrCode className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLeaveRoom}
                className="text-xs text-muted-foreground hover:text-destructive h-8 px-2 cursor-pointer"
              >
                Sair
              </Button>
            </div>
          </header>

          {/* Conteúdo Central: Conectar amigos, QR Code e Lista de Participantes */}
          <main className="w-full flex-1 flex flex-col justify-between py-2 sm:py-3 space-y-3 min-h-0 overflow-y-auto">
            {/* Banner de Início Automático */}
            {autoStartSeconds !== null && (
              <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs animate-pulse text-center shrink-0">
                <span>⏳ Partida iniciando automaticamente em {autoStartSeconds}s... Preparem-se!</span>
              </div>
            )}

            {/* Card de Convidar / QR Code de Onboarding */}
            <div className="p-3.5 bg-muted/60 border rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 shadow-xs">
              <div className="text-center sm:text-left">
                <span className="text-xs font-black uppercase tracking-wider text-foreground block">
                  Convidar Jogadores
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Código <strong className="font-mono text-foreground font-bold">#{roomId}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onOpenShareModal}
                  className="font-bold text-xs gap-1.5 h-8 cursor-pointer flex-1 sm:flex-initial"
                >
                  <QrCode className="w-3.5 h-3.5 text-primary" />
                  <span>QR Code</span>
                </Button>
                <CopyRoomButton roomId={roomId} size="sm" variant="secondary" className="flex-1 sm:flex-initial" />
              </div>
            </div>

            {/* Lista de Participantes Conectados */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between pb-2 mb-1.5 border-b border-border/50 shrink-0">
                <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary shrink-0" />
                  <span>Participantes Conectados ({playersList.length})</span>
                </h2>
                <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Min. 2 jogadores
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

            {/* Botão de Iniciar Jogo no Mobile (lg:hidden) */}
            <div className="lg:hidden pt-2 border-t shrink-0">
              {isCreator ? (
                <Button
                  onClick={onStartGame}
                  disabled={playersList.length < 2}
                  className="w-full font-black h-12 text-base shadow-lg cursor-pointer"
                >
                  {playersList.length < 2 ? "Aguardando mais jogadores..." : "Iniciar Jogo"}
                </Button>
              ) : (
                <div className="text-center py-2 text-xs text-muted-foreground animate-pulse font-medium">
                  Aguardando o líder iniciar a partida...
                </div>
              )}
            </div>
          </main>
        </div>

        {/* ========================================================= */}
        {/* FLANCO DIREITO DO LOBBY (Desktop: hidden lg:flex) */}
        {/* ========================================================= */}
        <aside className="hidden lg:flex flex-col w-[230px] xl:w-[250px] p-3.5 py-4 shrink-0 justify-between gap-3 select-none">
          <div className="space-y-3 shrink-0">
            <div className="px-1 pb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                Ações do Lobby
              </span>
            </div>

            {/* Botão Iniciar Jogo (ou status de espera se não for criador) */}
            {isCreator ? (
              <Button
                onClick={onStartGame}
                disabled={playersList.length < 2}
                className="w-full h-14 font-black text-sm tracking-wide shadow-xl cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl flex flex-col items-center justify-center gap-0.5"
              >
                <span>{playersList.length < 2 ? "Aguardando Jogadores" : "Iniciar Jogo Agora"}</span>
                <span className="text-[10px] font-normal opacity-80">
                  {playersList.length < 2 ? "Mínimo 2 jogadores" : `${playersList.length} conectados`}
                </span>
              </Button>
            ) : (
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center space-y-1.5 shadow-md">
                <span className="text-xs font-black text-zinc-200 block">Aguardando o Líder</span>
                <span className="text-[11px] text-zinc-400 block animate-pulse">
                  O líder da sala iniciará o jogo em breve...
                </span>
              </div>
            )}

            {/* Botão Configurações da Sala */}
            <button
              type="button"
              onClick={onOpenSettingsModal}
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
          </div>

          {/* Rodapé com Botão Sair da Sala */}
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
      </div>
    </div>
  );
}
