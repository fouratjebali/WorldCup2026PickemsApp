export type MatchStage =
  | 'Group stage'
  | 'Round of 32'
  | 'Round of 16'
  | 'Quarter-finals'
  | 'Semi-finals'
  | 'Third-place match'
  | 'Final';

export interface Match {
  id: string;
  stage: MatchStage | string;
  group_name: string | null;
  match_number: number;
  home_team: string;
  away_team: string;
  kickoff_at: string | null;
  home_score: number | null;
  away_score: number | null;
  winner_team: string | null;
  status: 'scheduled' | 'locked' | 'in_progress' | 'finished' | string;
}
