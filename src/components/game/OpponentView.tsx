import { Player } from "@/types/game";
import { UserCircle2, Eye, Search } from "lucide-react";
import { Card } from "./Card";

interface OpponentViewProps {
  player: Player;
  isActiveTurn: boolean;
  onActionClick?: () => void;
  actionLabel?: string;
  areHandsRevealed?: boolean;
  onInspect?: () => void;
}

export function OpponentView({
  player,
  isActiveTurn,
  onActionClick,
  actionLabel,
  areHandsRevealed = false,
  onInspect,
}: OpponentViewProps) {
  const isDead = player.isEliminated;
  const isTargetable = Boolean(actionLabel && onActionClick && !isDead);

  return (
    <div
      onClick={isTargetable ? onActionClick : undefined}
      className={`flex flex-col min-w-[190px] sm:min-w-[210px] flex-1 max-w-[320px] items-center p-3 rounded-2xl border-2 transition-all shrink-0 relative select-none ${
        isTargetable
          ? "border-primary ring-2 ring-primary ring-offset-2 animate-pulse shadow-xl shadow-primary/20 bg-primary/10 cursor-pointer hover:scale-[1.02]"
          : isActiveTurn
          ? "border-primary/80 bg-primary/5 shadow-md"
          : "border-border/80 bg-card/90 shadow-sm"
      } ${isDead ? "opacity-50 grayscale pointer-events-none" : ""}`}
    >
      {/* Top Info Header */}
      <div className="flex items-center gap-2 mb-2 w-full justify-between">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <UserCircle2 className={`w-5 h-5 shrink-0 ${isActiveTurn ? "text-primary" : "text-muted-foreground"}`} />
          <span className="font-bold text-sm truncate max-w-[100px] sm:max-w-[130px] text-foreground" title={player.name}>
            {player.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-mono flex items-center gap-1 ${
              areHandsRevealed ? "bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold" : "bg-muted text-muted-foreground"
            }`}
            title={areHandsRevealed ? "Mão Revelada!" : `${player.hand.length} cartas na mão`}
          >
            {areHandsRevealed && <Eye className="w-3 h-3" />}
            {player.hand.length} 🃏
          </span>

          {onInspect && player.objectArea.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onInspect();
              }}
              className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              title="Inspecionar mesa completa"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Área de Objetos da Mesa (Visualização completa com scroll horizontal sem ocultar "+1") */}
      <div className="w-full bg-black/5 dark:bg-white/5 rounded-xl p-1.5 border border-border/40">
        <div className="flex items-center justify-between px-1 mb-1 text-[9px] text-muted-foreground uppercase font-bold tracking-wider">
          <span>Mesa ({player.objectArea.length})</span>
          {player.objectArea.length > 0 && (
            <span className="text-[8.5px] lowercase font-normal opacity-75">role ➔</span>
          )}
        </div>

        <div className="flex gap-1.5 min-h-[94px] w-full items-center overflow-x-auto scrollbar-thin py-0.5 px-0.5">
          {player.objectArea.length === 0 ? (
            <span className="text-[11px] text-muted-foreground font-medium italic text-center w-full py-4">
              Nenhum objeto
            </span>
          ) : (
            player.objectArea.map((card) => (
              <div
                key={card.id}
                className="shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                onClick={(e) => {
                  if (onInspect) {
                    e.stopPropagation();
                    onInspect();
                  }
                }}
                title={`Clique para inspecionar: ${card.name} (${card.category || "Coringa"})`}
              >
                <Card card={card} size="small" />
              </div>
            ))
          )}
        </div>
      </div>

      {/* Mão Revelada (Vazamento de Dados / Senha Fraca) */}
      {areHandsRevealed && !isDead && (
        <div className="w-full mt-2 pt-1.5 border-t border-dashed border-amber-500/40 flex flex-col items-center">
          <div className="flex items-center gap-1 text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
            <Eye className="w-3 h-3" />
            <span>Mão Revelada ({player.hand.length})</span>
          </div>
          <div className="flex gap-1.5 max-w-full overflow-x-auto scrollbar-thin py-1 px-1 items-center">
            {player.hand.length === 0 ? (
              <span className="text-[9px] text-muted-foreground italic">Sem cartas</span>
            ) : (
              player.hand.map((card) => (
                <div key={card.id} className="shrink-0">
                  <Card card={card} size="small" />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Botões de Ação Dinâmicos (Trocar, Alvo de Efeito, etc) */}
      {actionLabel && onActionClick && !isDead && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onActionClick();
          }}
          className="mt-2.5 w-full text-xs uppercase font-black bg-primary text-primary-foreground py-1.5 px-3 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md flex items-center justify-center gap-1.5 animate-bounce"
        >
          <span>🎯</span>
          <span>{actionLabel}</span>
        </button>
      )}
      
      {/* Aviso de Pulou Turno ou Eliminado */}
      {isDead ? (
        <span className="mt-2 text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full shadow-inner">
          Eliminado 💀
        </span>
      ) : (player.skipNextTurn || player.isBlocked) ? (
        <span className="mt-2 text-[10px] uppercase font-bold text-destructive bg-destructive/10 border border-destructive/20 px-2.5 py-0.5 rounded-full">
          Bloqueado 🚫
        </span>
      ) : null}
    </div>
  );
}
