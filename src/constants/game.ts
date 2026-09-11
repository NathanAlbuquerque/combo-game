/**
 * Constantes Globais de Regras, Tempos e Armazenamento do "Combo The Game"
 */

// ==========================================
// Regras e Metas da Partida
// ==========================================
export const VICTORY_OBJECTS_REQUIRED = 5;
export const MAX_PLAYERS_PER_ROOM = 5;
export const MIN_PLAYERS_AUTO_START = 2;
export const AUTO_START_COUNTDOWN_SECONDS = 60;
export const DEFAULT_TURN_TIMER_SECONDS = 30;

// ==========================================
// Tempos de Interface e Animações (em milissegundos)
// ==========================================
export const TURN_FLASH_DURATION_MS = 1200;
export const TOAST_DISMISS_DURATION_MS = 4000;
export const TOAST_SHORT_DURATION_MS = 3000;
export const REACTION_LIFETIME_MS = 2600;
export const REACTION_RATE_LIMIT_MS = 2000;
export const REACTION_RATE_LIMIT_MAX = 3;

// ==========================================
// Chaves de Armazenamento Local / Sessão
// ==========================================
export const STORAGE_KEYS = {
  PLAYER_ID_PREFIX: "combo_player_id_",
  PLAYER_ID: "combo_player_id",
  NICKNAME: "combo_nickname",
} as const;

// ==========================================
// Cartas de Efeito com Seleção Obrigatória de Alvo
// ==========================================
export const TARGET_EFFECT_NAMES = [
  "Senha Fraca Detectada",
  "Rede de Apoio",
  "Tomou Block!",
  "Vídeo Deepfake",
  "Esqueceu a Senha",
  "Plágio Detectado",
  "Alerta de Phishing",
  "LI E ACEITO!",
] as const;

export type TargetEffectName = typeof TARGET_EFFECT_NAMES[number];

// ==========================================
// Opções de Duração do Cronômetro Anti-Stall
// ==========================================
export const TURN_TIMER_OPTIONS = [
  { value: 15, label: "15s", desc: "Modo Blitz ⚡" },
  { value: 30, label: "30s", desc: "Padrão ⏱️" },
  { value: 45, label: "45s", desc: "Moderado ⏳" },
  { value: 60, label: "60s", desc: "Longo 🐢" },
] as const;

// ==========================================
// Host Padrão do Servidor PartyKit (Produção)
// ==========================================
export const DEFAULT_PARTYKIT_HOST = "combo.nathanalbuquerque.partykit.dev";

