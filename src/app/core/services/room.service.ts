import { Injectable } from '@angular/core';
import { Room, RoomMember } from '../models/room.model';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class RoomService {
  constructor(private readonly supabase: SupabaseService) {}

  async createRoom(name: string, playerId: string): Promise<Room> {
    const cleanName = name.replace(/\s+/g, ' ').trim().slice(0, 48);

    if (cleanName.length < 3) {
      throw new Error('Room name must be at least 3 characters.');
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const code = this.generateRoomCode();
      const { data, error } = await this.supabase.client
        .from('rooms')
        .insert({
          code,
          name: cleanName,
          created_by_player_id: playerId,
        })
        .select()
        .single();

      if (!error && data) {
        const room = data as Room;
        await this.joinRoomById(room.id, playerId);
        return room;
      }

      if (!error || error.code !== '23505') {
        throw new Error('We could not create that room. Please try again.');
      }
    }

    throw new Error('We could not create a room code. Please try again.');
  }

  async joinRoom(code: string, playerId: string): Promise<Room> {
    const cleanCode = code.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 8);

    const { data, error } = await this.supabase.client
      .from('rooms')
      .select('*')
      .eq('code', cleanCode)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error('No room found with that code.');
    }

    await this.joinRoomById((data as Room).id, playerId);
    return data as Room;
  }

  async listPlayerRooms(playerId: string): Promise<Room[]> {
    const { data, error } = await this.supabase.client
      .from('room_members')
      .select('rooms(*)')
      .eq('player_id', playerId)
      .order('joined_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((row: any) => row.rooms).filter(Boolean) as Room[];
  }

  async getRoom(roomId: string): Promise<Room | null> {
    const { data, error } = await this.supabase.client.from('rooms').select('*').eq('id', roomId).maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    return (data as Room | null) ?? null;
  }

  async listRoomMembers(roomId: string): Promise<RoomMember[]> {
    const { data, error } = await this.supabase.client
      .from('room_members')
      .select('id, room_id, player_id, joined_at, player:players(id, device_token_hash, nickname, nationality, created_at, updated_at)')
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as unknown as RoomMember[];
  }

  async deleteRoom(roomId: string, playerId: string): Promise<void> {
    const { error } = await this.supabase.client.rpc('delete_room_as_creator', {
      p_room_id: roomId,
      p_player_id: playerId,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  private async joinRoomById(roomId: string, playerId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('room_members')
      .upsert({ room_id: roomId, player_id: playerId }, { onConflict: 'room_id,player_id' });

    if (error) {
      throw new Error(error.message);
    }
  }

  private generateRoomCode(): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const values = crypto.getRandomValues(new Uint8Array(6));
    return Array.from(values)
      .map((value) => alphabet[value % alphabet.length])
      .join('');
  }
}
