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

export const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string; label: string }> = {
  "SEGURANÇA DIGITAL": {
    bg: "#00C4EE",
    text: "#000000",
    border: "#0099cc",
    label: "Segurança",
  },
  "PRIVACIDADE E PROTEÇÃO DE DADOS": {
    bg: "#F4E000",
    text: "#000000",
    border: "#d4c200",
    label: "Privacidade",
  },
  "INFORMAÇÃO E PENSAMENTO CRÍTICO": {
    bg: "#7120E3",
    text: "#ffffff",
    border: "#5812bb",
    label: "Informação",
  },
  "COMUNICAÇÃO E CIDADANIA DIGITAL": {
    bg: "#FF2F2F",
    text: "#ffffff",
    border: "#cc1818",
    label: "Cidadania",
  },
  "COMPETÊNCIAS E FERRAMENTAS DIGITAIS": {
    bg: "#FF8800",
    text: "#ffffff",
    border: "#cc6d00",
    label: "Ferramentas",
  },
  "INTELIGÊNCIA ARTIFICIAL E USO CRÍTICO": {
    bg: "#079433",
    text: "#ffffff",
    border: "#056a24",
    label: "Inteligência Art.",
  },
};

export function Card({ card, size = "normal", onClick, selected }: CardProps) {
  const isBack = !card;

  const baseClasses = cn(
    "relative flex flex-col justify-between rounded-xl transition-all cursor-pointer shadow-md overflow-hidden select-none border",
    size === "normal"
      ? "w-28 sm:w-32 aspect-[182/252] text-sm"
      : "w-[76px] sm:w-[84px] aspect-[182/252] text-[10px]",
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
        card.visualDetail ? `🎨 Visual: ${card.visualDetail}` : "",
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
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-950 border border-amber-500/30 rounded-xl pointer-events-none z-0 shadow-inner" />
      )}

      {/* 2. Gradientes escuros de suporte para contraste e legibilidade no topo e base */}
      {card.type !== "effect" && (
        <>
          <div className="absolute inset-x-0 top-0 h-[38%] bg-gradient-to-b from-black/85 via-black/50 to-transparent pointer-events-none z-0 rounded-t-xl" />
          <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-black/95 via-black/80 to-transparent pointer-events-none z-0 rounded-b-xl" />
        </>
      )}

      {/* 3. Conteúdo da Carta (Layout dedicado para Efeitos e Objeto/Coringa) */}
      {card.type === "effect" ? (
        <div className="relative z-10 flex flex-col justify-between h-full w-full">
          {size === "normal" ? (
            <>
              {/* Destaque no topo: Badge / Tag "EFEITO" com ícone de raio ⚡ */}
              <div className="pt-2 px-2 flex items-center justify-center shrink-0">
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-extrabold tracking-widest text-[8px] sm:text-[9px] shadow-sm uppercase">
                  <span className="text-[10px] leading-none">⚡</span>
                  <span>EFEITO</span>
                </div>
              </div>

              {/* Centro: Título da carta em negrito com contraste limpo + Descrição da mecânica ("Efeito: ...") */}
              <div className="flex-1 flex flex-col items-center justify-center px-2 py-1 text-center my-auto w-full">
                <span className="font-extrabold leading-tight text-[11px] sm:text-[12px] text-white drop-shadow-md line-clamp-2 mb-1.5">
                  {card.name}
                </span>
                {card.description && (
                  <div className="w-full bg-zinc-950/70 rounded-lg px-1.5 py-1 sm:py-1.5 border border-zinc-700/60 shadow-inner">
                    <p className="text-[8.5px] sm:text-[9.5px] text-zinc-200 leading-tight font-medium line-clamp-3">
                      <span className="text-amber-400 font-bold mr-1">Efeito:</span>
                      {card.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Rodapé: Exibição elegante do texto educativo com ícone sutil */}
              {(card.tip || card.fact) && (
                <div className="px-2 pb-2 pt-1 text-center border-t border-zinc-800/80 bg-black/40 shrink-0 w-full rounded-b-xl">
                  <p
                    className="text-[8px] sm:text-[8.5px] leading-tight italic line-clamp-2 text-zinc-300"
                    title={card.tip ? `Dica: ${card.tip}` : `Fato: ${card.fact}`}
                  >
                    {card.tip ? (
                      <>
                        <span className="text-amber-400 font-bold not-italic mr-1">💡 Dica:</span>
                        <span>{card.tip}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-sky-400 font-bold not-italic mr-1">💬 Fato:</span>
                        <span>{card.fact}</span>
                      </>
                    )}
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col justify-between h-full p-1 text-center">
              <div className="pt-0.5 flex items-center justify-center shrink-0">
                <span className="text-[9px] leading-none">⚡</span>
              </div>
              <span className="font-extrabold leading-tight text-[8px] text-white drop-shadow-md line-clamp-2">
                {card.name}
              </span>
              <span className="text-[6.5px] text-amber-400/90 font-semibold uppercase tracking-wider">
                Efeito
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="relative z-10 flex flex-col justify-between h-full w-full">
          {card.type === "object" && (
            <>
              {/* Top: Tag/Badge com a cor oficial da categoria */}
              <div className="pt-1.5 px-1.5 flex items-center justify-center shrink-0 w-full">
                {card.category && (
                  <div
                    className={cn(
                      "inline-flex items-center justify-center px-1.5 py-0.5 rounded border font-black uppercase tracking-wider text-center shadow-sm w-full truncate",
                      size === "normal"
                        ? "text-[7.5px] sm:text-[8px] leading-tight"
                        : "text-[6.5px] sm:text-[7px] leading-none"
                    )}
                    style={{
                      backgroundColor: (card.category && CATEGORY_STYLES[card.category]?.bg) || "#3b82f6",
                      color: (card.category && CATEGORY_STYLES[card.category]?.text) || "#ffffff",
                      borderColor: (card.category && CATEGORY_STYLES[card.category]?.border) || "transparent",
                    }}
                    title={card.category}
                  >
                    {size === "normal"
                      ? card.category
                      : (card.category && CATEGORY_STYLES[card.category]?.label) || card.category}
                  </div>
                )}
              </div>

              {/* Bottom: Título do objeto perfeitamente legível */}
              {size === "normal" ? (
                <div className="p-2 sm:p-2.5 flex flex-col text-center text-white">
                  <span className="font-extrabold leading-tight text-[11px] sm:text-[12px] text-white drop-shadow-md line-clamp-2">
                    {card.name}
                  </span>
                  {card.description && (
                    <p className="text-[8px] sm:text-[8.5px] text-white/90 leading-snug line-clamp-3 mt-1 pt-1 border-t border-white/20">
                      {card.description}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-1 pb-1.5 flex flex-col text-center text-white">
                  <span className="font-black leading-tight text-[8.5px] sm:text-[9.5px] text-white drop-shadow-md line-clamp-2">
                    {card.name}
                  </span>
                </div>
              )}
            </>
          )}

          {card.type === "joker" && (
            <>
              {/* Top: Tag/Badge Coringa */}
              <div className="pt-1.5 px-1.5 flex items-center justify-center shrink-0 w-full">
                <div
                  className={cn(
                    "inline-flex items-center justify-center px-1.5 py-0.5 rounded border border-amber-300/70 bg-gradient-to-r from-red-500 via-amber-400 to-sky-500 text-white font-black uppercase tracking-wider text-center shadow-sm w-full truncate",
                    size === "normal"
                      ? "text-[7.5px] sm:text-[8px] leading-tight"
                      : "text-[6.5px] sm:text-[7px] leading-none"
                  )}
                  title="CARTA CORINGA"
                >
                  🃏 CORINGA
                </div>
              </div>

              {/* Bottom: Título Coringa */}
              {size === "normal" ? (
                <div className="p-2 sm:p-2.5 flex flex-col text-center text-white">
                  <span className="font-extrabold leading-tight text-[13px] sm:text-[14px] text-white drop-shadow-md">
                    {card.name || "Coringa"}
                  </span>
                  {card.description && (
                    <p className="text-[8px] sm:text-[8.5px] text-white/90 leading-snug line-clamp-3 mt-1 pt-1 border-t border-white/20">
                      {card.description}
                    </p>
                  )}
                </div>
              ) : (
                <div className="p-1 pb-1.5 flex flex-col text-center text-white">
                  <span className="font-black leading-tight text-[9px] sm:text-[10px] text-white drop-shadow-md">
                    {card.name || "Coringa"}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
