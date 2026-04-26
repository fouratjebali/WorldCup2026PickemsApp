export interface LeaderboardEntry {
  id: string;
  scope: 'global' | 'room' | string;
  room_id: string | null;
  player_id: string;
  total_points: number;
  correct_winners: number;
  exact_scores: number;
  updated_at: string;
  player?: {
    nickname: string;
    nationality: string;
  };
}
