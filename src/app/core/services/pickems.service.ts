import { Injectable } from '@angular/core';
import { Pickem } from '../models/pickem.model';
import { SupabaseService } from './supabase.service';

export interface PickemDraft {
  playerId: string;
  roomId: string | null;
  matchId: string;
  predictedHomeScore: number | null;
  predictedAwayScore: number | null;
  predictedWinnerTeam: string | null;
}

@Injectable({ providedIn: 'root' })
export class PickemsService {
  constructor(private readonly supabase: SupabaseService) {}

  async listPlayerPickems(playerId: string, roomId: string | null): Promise<Pickem[]> {
    let query = this.supabase.client.from('pickems').select('*').eq('player_id', playerId);

    query = roomId ? query.eq('room_id', roomId) : query.is('room_id', null);

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as Pickem[];
  }

  async savePickem(draft: PickemDraft): Promise<Pickem> {
    const { data, error } = await this.supabase.client
      .from('pickems')
      .upsert(
        {
          player_id: draft.playerId,
          room_id: draft.roomId,
          match_id: draft.matchId,
          predicted_home_score: draft.predictedHomeScore,
          predicted_away_score: draft.predictedAwayScore,
          predicted_winner_team: draft.predictedWinnerTeam,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'player_id,room_id,match_id' },
      )
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Pickem;
  }
}
