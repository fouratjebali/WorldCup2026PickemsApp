import { Injectable } from '@angular/core';
import { LeaderboardEntry } from '../models/leaderboard-entry.model';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class LeaderboardService {
  constructor(private readonly supabase: SupabaseService) {}

  async listGlobal(limit = 50): Promise<LeaderboardEntry[]> {
    const { data, error } = await this.supabase.client
      .from('leaderboard_cache')
      .select('*, player:players(nickname,nationality)')
      .eq('scope', 'global')
      .order('total_points', { ascending: false })
      .order('exact_scores', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as LeaderboardEntry[];
  }

  async listRoom(roomId: string, limit = 50): Promise<LeaderboardEntry[]> {
    const { data, error } = await this.supabase.client
      .from('leaderboard_cache')
      .select('*, player:players(nickname,nationality)')
      .eq('scope', 'room')
      .eq('room_id', roomId)
      .order('total_points', { ascending: false })
      .order('exact_scores', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as LeaderboardEntry[];
  }
}
