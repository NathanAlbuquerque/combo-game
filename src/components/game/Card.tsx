import { Card as CardType } from "@/types/game";
import { cn } from "@/lib/utils";

interface CardProps {
  card?: CardType; // se undefined, renderiza o verso
  size?: "normal" | "small";
  onClick?: () => void;
  selected?: boolean;
}

const categoryAssets: Record<string, string> = {
  "SEGURANÇA DIGITAL": "/Categorias/Segurança.svg",
  "PRIVACIDADE E PROTEÇÃO DE DADOS": "/Categorias/Privacidade.svg",
  "INFORMAÇÃO E PENSAMENTO CRÍTICO": "/Categorias/Informação.svg",
  "COMUNICAÇÃO E CIDADANIA DIGITAL": "/Categorias/Cidadania.svg",
  "COMPETÊNCIAS E FERRAMENTAS DIGITAIS": "/Categorias/Ferramentas.svg",
  "INTELIGÊNCIA ARTIFICIAL E USO CRÍTICO": "/Categorias/IA.svg",
};

export function Card({ card, size = "normal", onClick, selected }: CardProps) {
  const isBack = !card;

  const baseClasses = cn(
    "relative flex flex-col justify-between rounded-xl transition-all cursor-pointer shadow-md overflow-hidden select-none border",
    size === "normal"
      ? "w-28 sm:w-32 aspect-[182/252] text-sm"
      : "w-16 aspect-[182/252] text-[10px]",
    selected
      ? "border-primary ring-2 ring-primary ring-offset-2 -translate-y-4 shadow-xl"
      : "border-border/60 hover:-translate-y-2 hover:shadow-lg hover:border-primary/50"
  );

  if (isBack) {
    return (
      <div
        className={cn(baseClasses, "bg-primary border-primary hover:-translate-y-0 cursor-default")}
        onClick={onClick}
      >
        <div className="absolute inset-1.5 border-2 border-primary-foreground/30 rounded-lg flex items-center justify-center pointer-events-none">
          <span className="font-black text-primary-foreground opacity-60 -rotate-45 tracking-widest text-base sm:text-lg">
            COMBO
          </span>
        </div>
      </div>
    );
  }

  const bgAsset =
    card.type === "object" && card.category
      ? categoryAssets[card.category]
      : card.type === "joker"
      ? "/Categorias/Coringa.svg"
      : null;

  const tooltipText = card
    ? [
        card.name,
        card.description ? `• ${card.description}` : "",
        card.tip ? `💡 Dica: ${card.tip}` : "",
        card.fact ? `💬 Fato: ${card.fact}` : "",
      ]
        .filter(Boolean)
        .join(" ")
    : undefined;

  return (
    <div className={baseClasses} onClick={onClick} title={tooltipText}>
      {/* 1. Imagem de Fundo (SVG da Categoria ou Coringa) cobrindo 100% da carta */}
      {bgAsset && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={encodeURI(bgAsset)}
          alt=""
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
        />
      )}

      {/* Fundo Neutro para Cartas de Efeito */}
      {card.type === "effect" && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950 border border-zinc-700/80 rounded-xl pointer-events-none z-0" />
          <div className="relative z-10 pt-2 flex items-center justify-center pointer-events-none">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-inner">
              <span className="text-sm sm:text-base">⚡</span>
            </div>
          </div>
        </>
      )}

      {/* 2. Gradiente escuro de suporte para contraste e legibilidade, sem tapar o ícone no topo */}
      <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black/95 via-black/75 to-transparent pointer-events-none z-0 rounded-b-xl" />

      {/* 3. Conteúdo da Carta (Título, Categoria e Descrição) */}
      <div className="relative z-10 flex flex-col justify-end h-full">
        {card.type === "object" && (
          <>
            {size === "normal" ? (
              <div className="p-2 sm:p-2.5 flex flex-col text-center text-white">
                {card.category && (
                  <span className="text-[7.5px] sm:text-[8px] font-bold tracking-wider text-white/70 uppercase truncate mb-0.5">
                    {card.category}
                  </span>
                )}
                <span className="font-extrabold leading-tight text-[11px] sm:text-[12px] text-white drop-shadow-md line-clamp-2">
                  {card.name}
                </span>
                {card.description && (
                  <p className="text-[8px] sm:text-[8.5px] text-white/85 leading-snug line-clamp-3 mt-1 pt-1 border-t border-white/20">
                    {card.description}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-1 pb-1.5 flex flex-col text-center text-white">
                <span className="font-extrabold leading-tight text-[8px] text-white drop-shadow-md line-clamp-2">
                  {card.name}
                </span>
              </div>
            )}
          </>
        )}

        {card.type === "joker" && (
          <>
            {size === "normal" ? (
              <div className="p-2 sm:p-2.5 flex flex-col text-center text-white">
                <span className="text-[7.5px] sm:text-[8px] font-bold tracking-wider uppercase text-amber-300 drop-shadow-sm mb-0.5">
                  CARTA CORINGA
                </span>
                <span className="font-extrabold leading-tight text-[13px] sm:text-[14px] text-white drop-shadow-md">
                  {card.name || "Coringa"}
                </span>
                {card.description && (
                  <p className="text-[8px] sm:text-[8.5px] text-white/85 leading-snug line-clamp-3 mt-1 pt-1 border-t border-white/20">
                    {card.description}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-1 pb-1.5 flex flex-col text-center text-white">
                <span className="font-extrabold leading-tight text-[8px] text-white drop-shadow-md">
                  {card.name || "Coringa"}
                </span>
              </div>
            )}
          </>
        )}

        {card.type === "effect" && (
          <>
            {size === "normal" ? (
              <div className="p-2 sm:p-2.5 flex flex-col text-center text-white">
                <span className="text-[7.5px] sm:text-[8px] font-bold tracking-wider uppercase text-amber-400 drop-shadow-sm mb-0.5">
                  EFEITO ESPECIAL
                </span>
                <span className="font-extrabold leading-tight text-[11px] sm:text-[12px] text-white drop-shadow-md line-clamp-2">
                  {card.name}
                </span>
                {card.description && (
                  <p className="text-[8px] sm:text-[8.5px] text-zinc-300 leading-snug line-clamp-3 mt-1 pt-1 border-t border-zinc-700">
                    {card.description}
                  </p>
                )}
                {(card.tip || card.fact) && (
                  <p
                    className="text-[7px] sm:text-[7.5px] text-amber-300/90 leading-tight italic line-clamp-2 mt-0.5"
                    title={card.tip ? `Dica: ${card.tip}` : `Fato: ${card.fact}`}
                  >
                    {card.tip ? `💡 ${card.tip}` : `💬 ${card.fact}`}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-1 pb-1.5 flex flex-col text-center text-white">
                <span className="font-extrabold leading-tight text-[8px] text-white drop-shadow-md line-clamp-2">
                  {card.name}
                </span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
