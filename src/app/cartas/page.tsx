"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Layers, ShieldCheck, Sparkles, Search } from "lucide-react";
import { Card as CardType, ObjectCategory } from "@/types/game";
import { ALL_GALLERY_CARDS } from "@/data/cards";
import { Card, CATEGORY_STYLES } from "@/components/game/Card";
import { CardPreviewModal } from "@/components/game/CardPreviewModal";
import { Button } from "@/components/ui/button";

type TabType = "all" | "objects" | "effects";
type CategoryFilter = "all" | ObjectCategory | "coringa";

const CATEGORY_OPTIONS: { id: CategoryFilter; label: string; color?: string }[] = [
  { id: "all", label: "Todas as Categorias" },
  { id: "SEGURANÇA DIGITAL", label: "Segurança", color: CATEGORY_STYLES["SEGURANÇA DIGITAL"].bg },
  { id: "PRIVACIDADE E PROTEÇÃO DE DADOS", label: "Privacidade", color: CATEGORY_STYLES["PRIVACIDADE E PROTEÇÃO DE DADOS"].bg },
  { id: "INFORMAÇÃO E PENSAMENTO CRÍTICO", label: "Informação", color: CATEGORY_STYLES["INFORMAÇÃO E PENSAMENTO CRÍTICO"].bg },
  { id: "COMUNICAÇÃO E CIDADANIA DIGITAL", label: "Cidadania", color: CATEGORY_STYLES["COMUNICAÇÃO E CIDADANIA DIGITAL"].bg },
  { id: "COMPETÊNCIAS E FERRAMENTAS DIGITAIS", label: "Ferramentas", color: CATEGORY_STYLES["COMPETÊNCIAS E FERRAMENTAS DIGITAIS"].bg },
  { id: "INTELIGÊNCIA ARTIFICIAL E USO CRÍTICO", label: "IA & Crítica", color: CATEGORY_STYLES["INTELIGÊNCIA ARTIFICIAL E USO CRÍTICO"].bg },
  { id: "coringa", label: "🃏 Coringas" },
];

export default function CardsGalleryPage() {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null);

  const filteredCards = useMemo(() => {
    return ALL_GALLERY_CARDS.filter((card) => {
      // 1. Filtro por Aba Principal
      if (activeTab === "objects") {
        if (card.type !== "object" && card.type !== "joker") return false;
        if (selectedCategory === "coringa") {
          if (card.type !== "joker") return false;
        } else if (selectedCategory !== "all") {
          if (card.category !== selectedCategory) return false;
        }
      } else if (activeTab === "effects") {
        if (card.type !== "effect") return false;
      }

      // 2. Filtro por Busca de Texto
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchName = card.name?.toLowerCase().includes(query);
        const matchDesc = card.description?.toLowerCase().includes(query);
        const matchTip = card.tip?.toLowerCase().includes(query);
        const matchFact = card.fact?.toLowerCase().includes(query);
        const matchCat = card.category?.toLowerCase().includes(query);
        return matchName || matchDesc || matchTip || matchFact || matchCat;
      }

      return true;
    });
  }, [activeTab, selectedCategory, searchQuery]);

  return (
    <div className="min-h-screen w-full bg-zinc-950 bg-gradient-to-b from-zinc-900/60 via-zinc-950 to-black flex justify-center items-center overflow-x-hidden font-sans">
      <div className="w-full max-w-[440px] sm:max-w-[480px] min-h-[100dvh] bg-background shadow-2xl relative flex flex-col p-4 sm:p-5 overflow-hidden border-x border-border/40">
        
        {/* Cabeçalho */}
        <header className="w-full flex items-center justify-between pb-3 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground cursor-pointer">
                <ArrowLeft className="w-4 h-4 mr-1" />
                <span className="text-xs font-semibold">Início</span>
              </Button>
            </Link>
          </div>
          <div className="text-right">
            <h1 className="text-base sm:text-lg font-black tracking-tight text-foreground flex items-center gap-1.5 justify-end">
              <BookOpen className="w-4 h-4 text-primary shrink-0" />
              <span>Enciclopédia</span>
            </h1>
            <p className="text-[10px] text-muted-foreground font-medium">
              48 cartas pedagógicas
            </p>
          </div>
        </header>

        {/* Abas Principais de Filtro */}
        <div className="pt-3 pb-2 space-y-2 shrink-0">
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/60 rounded-xl border border-border/50">
            <button
              type="button"
              onClick={() => {
                setActiveTab("all");
                setSelectedCategory("all");
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Todas ({ALL_GALLERY_CARDS.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("objects")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "objects"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Objetos (32)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("effects");
                setSelectedCategory("all");
              }}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "effects"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Efeitos (16)</span>
            </button>
          </div>

          {/* Subfiltro de Categorias (apenas quando na aba Objetos) */}
          {activeTab === "objects" && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-none text-[11px]">
              {CATEGORY_OPTIONS.map((opt) => {
                const isActive = selectedCategory === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedCategory(opt.id)}
                    className={`whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-muted/50 text-muted-foreground hover:text-foreground border-border/50 hover:bg-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Campo de Busca Rápida */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome, efeito ou conselho..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border bg-background text-xs placeholder:text-muted-foreground/70 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground hover:text-foreground font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Contador de resultados */}
          <div className="flex items-center justify-between text-[11px] text-muted-foreground px-0.5">
            <span>
              {filteredCards.length} {filteredCards.length === 1 ? "carta encontrada" : "cartas encontradas"}
            </span>
            <span className="text-[10px] italic">Toque em uma carta para inspecionar</span>
          </div>
        </div>

        {/* Grade de Cartas com Scroll Vertical */}
        <main className="flex-1 overflow-y-auto pr-0.5 py-2">
          {filteredCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center p-4">
              <span className="text-3xl mb-2">🔍</span>
              <p className="text-xs font-bold text-foreground">Nenhuma carta encontrada</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Tente ajustar os termos de pesquisa ou selecionar outra categoria.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setActiveTab("all");
                }}
                className="mt-3 text-xs"
              >
                Limpar Filtros
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3">
              {filteredCards.map((card) => (
                <div
                  key={card.id}
                  onClick={() => setSelectedCard(card)}
                  className="transition-transform duration-150 hover:scale-105 active:scale-95 cursor-pointer"
                  title={`Clique para inspecionar ${card.name}`}
                >
                  <Card card={card} size="normal" />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modal de Inspeção Somente-Leitura */}
      <CardPreviewModal
        card={selectedCard}
        isOpen={Boolean(selectedCard)}
        onClose={() => setSelectedCard(null)}
      />
    </div>
  );
}
