export type Rarity = 'common' | 'rare' | 'epic';

export interface Prize {
  id: string;
  name: string;
  emoji: string;
  rarity: Rarity;
  color: string; // Tailwind color class for background
  requiresCheckIn?: boolean;
}

export type GameState = 'idle' | 'moving' | 'dropping' | 'grabbing' | 'retracting' | 'resolving';

export interface RoundResult {
  success: boolean;
  prize?: Prize;
  timestamp: number;
}

export interface ClawConfig {
  stageWidth: number; // Percent 0-100 or pixels
  clawSpeed: number;
  dropSpeed: number;
}
