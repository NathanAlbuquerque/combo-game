import { Card as CardType } from "@/types/game";
import { cn } from "@/lib/utils";

interface CardProps {
  card?: CardType; // se undefined, renderiza o verso
  size?: "small" | "normal";
  onClick?: () => void;
  selected?: boolean;
}

export function Card({ card, size = "normal", onClick, selected }: CardProps) {
  const isBack = !card;

  const baseClasses = cn(
    "relative flex flex-col justify-between rounded-xl transition-all cursor-pointer shadow-md overflow-hidden bg-white dark:bg-zinc-900 border",
    size === "normal" ? "w-28 sm:w-32 aspect-[5/7] p-2 text-sm" : "w-16 aspect-[5/7] p-1 text-[10px]",
    selected ? "border-primary ring-2 ring-primary ring-offset-2 -translate-y-4" : "border-border hover:-translate-y-2 hover:shadow-lg hover:border-primary/50"
  );

  if (isBack) {
    return (
      <div className={cn(baseClasses, "bg-primary border-primary hover:-translate-y-0 cursor-default")} onClick={onClick}>
        <div className="absolute inset-1.5 border-2 border-primary-foreground/30 rounded-lg flex items-center justify-center pointer-events-none">
          <span className="font-black text-primary-foreground opacity-60 -rotate-45 tracking-widest text-base sm:text-lg">COMBO</span>
        </div>
      </div>
    );
  }

  const catColors: Record<string, string> = {
    "SEGURANÇA DIGITAL": "bg-red-500 text-white",
    "PRIVACIDADE E PROTEÇÃO DE DADOS": "bg-blue-500 text-white",
    "INFORMAÇÃO E PENSAMENTO CRÍTICO": "bg-green-600 text-white",
    "COMUNICAÇÃO E CIDADANIA DIGITAL": "bg-yellow-500 text-black",
    "COMPETÊNCIAS E FERRAMENTAS DIGITAIS": "bg-purple-500 text-white",
    "INTELIGÊNCIA ARTIFICIAL E USO CRÍTICO": "bg-orange-500 text-black",
  };

  return (
    <div className={baseClasses} onClick={onClick}>
      {/* Imagem de Fundo (Moldura SVG) */}
      <div 
        className="absolute inset-0 z-0 opacity-10 dark:opacity-20 bg-cover bg-center pointer-events-none" 
        style={{ backgroundImage: 'url(/card-test.svg)' }}
      />
      
      {/* Container do Conteúdo (z-10 para ficar acima do SVG) */}
      <div className="relative z-10 flex flex-col h-full">
        {card.type === "object" && (
          <>
            <div className={cn(
              "w-full px-1 py-0.5 rounded text-[7px] sm:text-[8px] font-bold tracking-wider mb-2 uppercase text-center line-clamp-2",
              card.category ? catColors[card.category] : "bg-zinc-500 text-white"
            )}>
              {card.category}
            </div>
            <div className="flex-1 flex items-center justify-center">
              <span className="font-black text-center leading-tight text-xs sm:text-sm">{card.name}</span>
            </div>
            {size === "normal" && card.description && (
              <div className="mt-auto border-t pt-1.5 border-border/50">
                <p className="text-[9px] text-muted-foreground leading-tight text-center line-clamp-3">{card.description}</p>
              </div>
            )}
          </>
        )}

        {card.type === "joker" && (
          <>
            <div className="w-full px-1 py-0.5 rounded text-[7px] sm:text-[8px] font-bold tracking-wider mb-2 uppercase text-center bg-gradient-to-r from-red-500 via-green-500 to-blue-500 text-white">
              CARTA CORINGA
            </div>
            <div className="flex-1 flex items-center justify-center">
              <span className="font-black text-center leading-tight text-base sm:text-lg text-transparent bg-clip-text bg-gradient-to-br from-red-500 via-green-500 to-blue-500">
                {card.name}
              </span>
            </div>
            {size === "normal" && card.description && (
              <div className="mt-auto border-t pt-1.5 border-border/50">
                <p className="text-[9px] text-muted-foreground leading-tight text-center line-clamp-3">{card.description}</p>
              </div>
            )}
          </>
        )}

        {card.type === "effect" && (
          <>
            <div className="w-full px-1 py-0.5 rounded text-[7px] sm:text-[8px] font-bold tracking-wider mb-2 uppercase text-center bg-zinc-800 text-white dark:bg-zinc-200 dark:text-black">
              EFEITO ESPECIAL
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-1">
               <span className="text-xl sm:text-2xl">⚡</span>
              <span className="font-black text-center leading-tight text-xs sm:text-sm">{card.name}</span>
            </div>
            {size === "normal" && card.description && (
              <div className="mt-auto border-t pt-1.5 border-border/50">
                <p className="text-[9px] font-medium text-foreground leading-tight text-center line-clamp-3">{card.description}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
