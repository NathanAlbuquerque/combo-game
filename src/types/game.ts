export type ObjectCategory = 'cat1' | 'cat2' | 'cat3' | 'cat4' | 'cat5' | 'cat6';

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
  // Mão oculta do jogador (quantas e quais cartas ele tem)
  hand: Card[];
  // Área visível com os objetos travados e coringas
  objectArea: Card[]; 
}

export interface GameState {
  status: 'lobby' | 'playing' | 'finished';
  players: Record<string, Player>;
  creatorId: string | null;
  
  // Estruturas da mesa
  deck: Card[];
  discard: Card[];
  
  // Controle de turno e vitória
  currentTurnPlayerId: string | null;
  winnerId: string | null;
}

// Mensagens enviadas do cliente para o servidor
export type ClientMessage = 
  | { type: 'join'; name: string }
  | { type: 'start_game' }
  // Ações futuras preparadas
  | { type: 'draw_card' }
  | { type: 'play_card'; cardId: string; targetId?: string }
  | { type: 'trade_card'; myCardId: string; targetPlayerId: string; targetCardId: string };

// Mensagens enviadas do servidor para o cliente
export type ServerMessage = 
  | { type: 'sync'; state: GameState }
  | { type: 'error'; message: string };
