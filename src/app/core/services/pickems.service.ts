import { Injectable } from '@angular/core';
import { GroupStandingPick } from '../models/group-standing-pick.model';
import { Pickem } from '../models/pickem.model';
import { SupabaseService } from './supabase.service';

export interface PickemDraft {
  playerId: string;
  roomId: string | null;
  matchId: string;
  predictedHomeScore: number | null;
  predictedAwayScore: number | null;
  predictedWinnerTeam: string | null;
  locked?: boolean;
}

export interface GroupStandingDraft {
  playerId: string;
  roomId: string | null;
  groupName: string;
  team: string;
  rank: number;
  points: number;
  wins: number;
  locked?: boolean;
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
          locked: draft.locked ?? false,
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

  async savePickems(drafts: PickemDraft[]): Promise<Pickem[]> {
    if (!drafts.length) {
      return [];
    }

    const { data, error } = await this.supabase.client
      .from('pickems')
      .upsert(
        drafts.map((draft) => ({
          player_id: draft.playerId,
          room_id: draft.roomId,
          match_id: draft.matchId,
          predicted_home_score: draft.predictedHomeScore,
          predicted_away_score: draft.predictedAwayScore,
          predicted_winner_team: draft.predictedWinnerTeam,
          locked: draft.locked ?? false,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'player_id,room_id,match_id' },
      )
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as Pickem[];
  }

  async listPlayerGroupStandings(playerId: string, roomId: string | null): Promise<GroupStandingPick[]> {
    let query = this.supabase.client.from('group_standing_picks').select('*').eq('player_id', playerId);

    query = roomId ? query.eq('room_id', roomId) : query.is('room_id', null);

    const { data, error } = await query.order('group_name', { ascending: true }).order('rank', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as GroupStandingPick[];
  }

  async saveGroupStandings(drafts: GroupStandingDraft[]): Promise<GroupStandingPick[]> {
    if (!drafts.length) {
      return [];
    }

    const { data, error } = await this.supabase.client
      .from('group_standing_picks')
      .upsert(
        drafts.map((draft) => ({
          player_id: draft.playerId,
          room_id: draft.roomId,
          group_name: draft.groupName,
          team: draft.team,
          rank: draft.rank,
          points: draft.points,
          wins: draft.wins,
          locked: draft.locked ?? false,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'player_id,room_id,group_name,team' },
      )
      .select();

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as GroupStandingPick[];
  }

  async hasGlobalPickems(playerId: string): Promise<boolean> {
    const { count, error } = await this.supabase.client
      .from('pickems')
      .select('id', { count: 'exact', head: true })
      .eq('player_id', playerId)
      .is('room_id', null);

    if (error) {
      throw new Error(error.message);
    }

    return (count ?? 0) > 0;
  }

  async hasRoomPickems(playerId: string, roomId: string): Promise<boolean> {
    const { count, error } = await this.supabase.client
      .from('pickems')
      .select('id', { count: 'exact', head: true })
      .eq('player_id', playerId)
      .eq('room_id', roomId);

    if (error) {
      throw new Error(error.message);
    }

    return (count ?? 0) > 0;
  }

  async copyGlobalPickemsToRoom(playerId: string, roomId: string): Promise<void> {
    const [globalPickems, globalStandings] = await Promise.all([
      this.listPlayerPickems(playerId, null),
      this.listPlayerGroupStandings(playerId, null),
    ]);

    await Promise.all([
      this.savePickems(
        globalPickems.map((pickem) => ({
          playerId,
          roomId,
          matchId: pickem.match_id,
          predictedHomeScore: pickem.predicted_home_score,
          predictedAwayScore: pickem.predicted_away_score,
          predictedWinnerTeam: pickem.predicted_winner_team,
          locked: pickem.locked,
        })),
      ),
      this.saveGroupStandings(
        globalStandings.map((standing) => ({
          playerId,
          roomId,
          groupName: standing.group_name,
          team: standing.team,
          rank: standing.rank,
          points: standing.points,
          wins: standing.wins,
          locked: standing.locked,
        })),
      ),
    ]);
  }
}
