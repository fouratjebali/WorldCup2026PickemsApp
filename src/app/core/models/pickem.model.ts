export interface Pickem {
  id: string;
  player_id: string;
  room_id: string | null;
  match_id: string;
  predicted_home_score: number | null;
  predicted_away_score: number | null;
  predicted_winner_team: string | null;
  points: number;
  locked: boolean;
  created_at: string;
  updated_at: string;
}
