import { Injectable } from '@angular/core';
import { Match } from '../models/match.model';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class MatchService {
  constructor(private readonly supabase: SupabaseService) {}

  async listMatches(): Promise<Match[]> {
    const { data, error } = await this.supabase.client
      .from('matches')
      .select('*')
      .order('match_number', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as Match[];
  }

  isLocked(match: Match): boolean {
    if (match.status !== 'scheduled') {
      return true;
    }

    return match.kickoff_at ? new Date(match.kickoff_at).getTime() <= Date.now() : false;
  }
}
