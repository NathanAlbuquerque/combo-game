"use client";

import { Settings, Timer, Lock, X, ShieldAlert, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RoomSettings } from "@/types/game";
import { cn } from "@/lib/utils";

interface RoomSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: RoomSettings;
  isLeader: boolean;
  onUpdateSettings: (settings: Partial<RoomSettings>) => void;
}

const DURATION_OPTIONS = [
  { value: 15, label: "15s", desc: "Modo Blitz ⚡" },
  { value: 30, label: "30s", desc: "Padrão ⏱️" },
  { value: 45, label: "45s", desc: "Moderado ⏳" },
  { value: 60, label: "60s", desc: "Longo 🐢" },
];

export function RoomSettingsModal({
  isOpen,
  onClose,
  settings,
  isLeader,
  onUpdateSettings,
}: RoomSettingsModalProps) {
  if (!isOpen) return null;

  const currentSettings: RoomSettings = settings || {
    turnTimerEnabled: false,
    turnTimerDuration: 30,
  };

  const handleToggleTimer = () => {
    if (!isLeader) return;
    onUpdateSettings({ turnTimerEnabled: !currentSettings.turnTimerEnabled });
  };

  const handleSelectDuration = (duration: number) => {
    if (!isLeader) return;
    onUpdateSettings({ turnTimerDuration: duration });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-card border-2 border-border text-card-foreground rounded-3xl max-w-md w-full flex flex-col shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between bg-muted/30 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-foreground uppercase tracking-wider">
                Configurações da Sala
              </h2>
              <p className="text-xs text-muted-foreground">
                Regras de tempo e controle da partida
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Informação sobre permissão do Líder */}
          {!isLeader && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-amber-600 dark:text-amber-400 font-medium">
              <Lock className="w-4 h-4 shrink-0" />
              <span>Apenas o líder da sala pode alterar as configurações. Você está em modo somente leitura.</span>
            </div>
          )}

          {/* Seção Anti-Stall */}
          <div className="bg-muted/30 border border-border/80 rounded-2xl p-4 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Timer className="w-4 h-4 text-primary" />
                  <span className="text-sm font-black text-foreground">
                    Cronômetro Anti-Stall
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                      currentSettings.turnTimerEnabled
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-muted text-muted-foreground border border-border"
                    )}
                  >
                    {currentSettings.turnTimerEnabled ? "Ativado" : "Desativado"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Limita o tempo de cada turno. Se o tempo expirar sem ação do jogador, o servidor realiza uma ação segura de passar a vez (compra 1 carta ou descarta a última).
                </p>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                role="switch"
                aria-checked={currentSettings.turnTimerEnabled}
                disabled={!isLeader}
                onClick={handleToggleTimer}
                className={cn(
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1",
                  currentSettings.turnTimerEnabled ? "bg-primary" : "bg-zinc-700"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
                    currentSettings.turnTimerEnabled ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>

            {/* Seletor de Duração (quando ativo) */}
            {currentSettings.turnTimerEnabled && (
              <div className="pt-3 border-t border-border/60 space-y-2.5 animate-in fade-in duration-200">
                <span className="text-xs font-bold text-foreground block">
                  Duração do Turno:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {DURATION_OPTIONS.map((opt) => {
                    const isSelected = currentSettings.turnTimerDuration === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={!isLeader}
                        onClick={() => handleSelectDuration(opt.value)}
                        className={cn(
                          "flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer disabled:cursor-not-allowed",
                          isSelected
                            ? "bg-primary/15 border-primary/60 text-primary shadow-xs"
                            : "bg-background/80 hover:bg-muted/80 border-border/80 text-foreground"
                        )}
                      >
                        <div>
                          <div className="text-xs font-black">{opt.label}</div>
                          <div className="text-[10px] text-muted-foreground">{opt.desc}</div>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Dica de Jogo */}
          <div className="p-3 bg-muted/20 border border-border/40 rounded-xl flex items-center gap-2.5 text-[11px] text-muted-foreground">
            <ShieldAlert className="w-4 h-4 text-primary shrink-0" />
            <span>O Anti-Stall garante partidas dinâmicas mesmo se um participante perder a conexão temporariamente.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-border bg-muted/20 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="font-bold cursor-pointer">
            Concluir
          </Button>
        </div>
      </div>
    </div>
  );
}
