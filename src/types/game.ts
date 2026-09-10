export type ObjectCategory = 
  | 'SEGURANÇA DIGITAL' 
  | 'PRIVACIDADE E PROTEÇÃO DE DADOS' 
  | 'INFORMAÇÃO E PENSAMENTO CRÍTICO' 
  | 'COMUNICAÇÃO E CIDADANIA DIGITAL' 
  | 'COMPETÊNCIAS E FERRAMENTAS DIGITAIS' 
  | 'INTELIGÊNCIA ARTIFICIAL E USO CRÍTICO';

export type CardType = 'object' | 'effect' | 'joker';

export interface Card {
  id: string;
  type: CardType;
  // Apenas cartas do tipo 'object' precisam ter uma categoria predefinida.
  // Coringas assumem a categoria que faltar para o jogador.
  category?: ObjectCategory;
  name?: string;
  description?: string;
  tip?: string;
  fact?: string;
  visualDetail?: string;
  imageUrl?: string;
}

export interface Player {
  id: string;
  name: string;
  isCreator: boolean;
  hand: Card[];
  objectArea: Card[]; 
  skipNextTurn?: boolean; // Controle de bloqueio
  isBlocked?: boolean; // Controle de bloqueio (Tomou Block!)
  isEliminated?: boolean; // Jogador sem cartas perde
  isSpectating?: boolean; // Modo espectador/espera
}

export type PendingAction = {
  type: 'CHOOSE_CARD_TO_DISCARD' | 'CHOOSE_CARD_TO_GIVE';
  requiredPlayerId: string; // Adversário que deve tomar a decisão
  initiatorPlayerId: string; // Jogador que usou a carta
  sourceCardName: string;
};

export type MatchStats = {
  startedAt: number;
  finishedAt?: number;
  totalTurns: number;
  totalCardsDrawn: number;
  totalEffectsPlayed: number;
  totalObjectsPlayed: number;
  playerStats: Record<string, {
    playerName: string;
    cardsDrawn: number;
    effectsPlayed: number;
    objectsPlayed: number;
    eliminated: boolean;
  }>;
};

export interface GameState {
  status: 'lobby' | 'playing' | 'finished';
  players: Record<string, Player>;
  creatorId: string | null;
  deck: Card[];
  discard: Card[];
  currentTurnPlayerId: string | null;
  winnerId: string | null;
  turnOrder?: string[]; // Ordem sequencial oficial da rodada
  
  actionLog: string[]; // Histórico de eventos
  pendingAction: PendingAction | null; // Interrupção do fluxo de turno
  extraPlayPlayerId?: string | null; // Jogada extra opcional/imediata (Prompt Perfeito)
  revealedHandsUntilTurnOfPlayerId?: string | null; // Visibilidade global temporária (Vazamento de Dados)
  revealedPlayerIds?: string[]; // IDs de jogadores com mão revelada temporariamente (Senha Fraca Detectada)
  revealedPlayerUntilTurn?: Record<string, string>; // targetPlayerId -> activatorPlayerId
  stats?: MatchStats | null; // Estatísticas consolidadas da partida
}

export type ClientMessage = 
  | { type: 'join'; name: string; playerId?: string }
  | { type: 'start_game' }
  | { type: 'draw_card' }
  | { type: 'play_card'; cardId: string; targetId?: string; targetPlayerId?: string }
  | { type: 'play_effect'; cardId: string; targetPlayerId?: string; targetId?: string }
  | { type: 'trade_card'; targetPlayerId: string }
  | { type: 'discard_card'; cardId: string }
  | { type: 'resolve_pending_action'; cardId: string }
  | { type: 'skip_extra_play' }
  | { type: 'end_turn' }
  | { type: 'return_to_lobby' };

// Mensagens enviadas do servidor para o cliente
export type ServerMessage = 
  | { type: 'sync'; state: GameState }
  | { type: 'error'; message: string };
