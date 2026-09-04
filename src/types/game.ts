export interface Player {
  id: string;
  name: string;
  isCreator: boolean;
}

export interface GameState {
  status: 'lobby' | 'playing';
  players: Record<string, Player>;
  creatorId: string | null;
}

// Mensagens enviadas do cliente para o servidor
export type ClientMessage = 
  | { type: 'join'; name: string }
  | { type: 'start_game' };

// Mensagens enviadas do servidor para o cliente
export type ServerMessage = 
  | { type: 'sync'; state: GameState }
  | { type: 'error'; message: string };
