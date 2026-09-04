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
}

export interface Player {
  id: string;
  name: string;
  isCreator: boolean;
  hand: Card[];
  objectArea: Card[]; 
  skipNextTurn?: boolean; // Controle de bloqueio
  isEliminated?: boolean; // Jogador sem cartas perde
}

export type PendingAction = {
  type: 'discard';
  playerId: string;
  amount: 1;
};

export interface GameState {
  status: 'lobby' | 'playing' | 'finished';
  players: Record<string, Player>;
  creatorId: string | null;
  deck: Card[];
  discard: Card[];
  currentTurnPlayerId: string | null;
  winnerId: string | null;
  
  actionLog: string[]; // Histórico de eventos
  pendingAction: PendingAction | null; // Interrupção do fluxo de turno
}

export type ClientMessage = 
  | { type: 'join'; name: string }
  | { type: 'start_game' }
  | { type: 'draw_card' }
  | { type: 'play_card'; cardId: string; targetId?: string }
  | { type: 'trade_card'; targetPlayerId: string }
  | { type: 'discard_card'; cardId: string }
  | { type: 'return_to_lobby' };

// Mensagens enviadas do servidor para o cliente
export type ServerMessage = 
  | { type: 'sync'; state: GameState }
  | { type: 'error'; message: string };
