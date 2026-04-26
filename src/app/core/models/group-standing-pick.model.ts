export interface GroupStandingPick {
  id: string;
  player_id: string;
  room_id: string | null;
  group_name: string;
  team: string;
  rank: number;
  points: number;
  wins: number;
  locked: boolean;
  created_at: string;
  updated_at: string;
}
