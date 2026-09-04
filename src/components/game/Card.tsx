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
    "relative flex flex-col items-center justify-center rounded-xl border-2 transition-all cursor-pointer shadow-sm overflow-hidden",
    size === "normal" ? "w-24 h-36 p-2 text-sm" : "w-12 h-16 p-1 text-[10px]",
    selected ? "border-primary -translate-y-2 ring-4 ring-primary/20" : "border-border hover:-translate-y-1 hover:shadow-md",
    isBack ? "bg-primary" : "bg-card text-card-foreground"
  );

  if (isBack) {
    return (
      <div className={baseClasses} onClick={onClick}>
        <div className="absolute inset-1 border border-primary-foreground/20 rounded-lg flex items-center justify-center">
          <span className="font-bold text-primary-foreground opacity-50 rotate-45 text-xs">COMBO</span>
        </div>
      </div>
    );
  }

  // Cores dinâmicas por categoria para melhorar UX
  const catColors: Record<string, string> = {
    cat1: "bg-red-500",
    cat2: "bg-blue-500",
    cat3: "bg-green-500",
    cat4: "bg-yellow-500",
    cat5: "bg-purple-500",
    cat6: "bg-orange-500",
  };

  return (
    <div className={baseClasses} onClick={onClick}>
      {card.type === "object" && (
        <>
          <div className={cn("w-full h-3 rounded-full mb-1", card.category ? catColors[card.category] : "bg-zinc-500")} />
          <span className="font-semibold text-center leading-tight truncate w-full">{card.name}</span>
          <span className="text-[10px] text-muted-foreground mt-auto uppercase">{card.category}</span>
        </>
      )}

      {card.type === "joker" && (
        <>
          <div className="w-full h-3 rounded-full mb-1 bg-gradient-to-r from-red-500 via-green-500 to-blue-500" />
          <span className="font-bold text-center leading-tight text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-blue-500">
            {card.name}
          </span>
          <span className="text-[10px] text-muted-foreground mt-auto uppercase">Wild</span>
        </>
      )}

      {card.type === "effect" && (
        <>
          <div className="w-full h-3 rounded-full mb-1 bg-zinc-800 dark:bg-zinc-200" />
          <span className="font-semibold text-center leading-tight">{card.name}</span>
          <span className="text-[10px] text-muted-foreground mt-auto uppercase text-center truncate w-full">Action</span>
        </>
      )}
    </div>
  );
}
