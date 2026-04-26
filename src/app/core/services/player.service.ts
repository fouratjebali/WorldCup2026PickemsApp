import { Injectable, signal } from '@angular/core';
import { Player } from '../models/player.model';
import { SupabaseService } from './supabase.service';

const DEVICE_TOKEN_KEY = 'wc2026_pickems_device_token';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  readonly currentPlayer = signal<Player | null>(null);
  private loadPromise: Promise<Player | null> | null = null;

  constructor(private readonly supabase: SupabaseService) {}

  async loadStoredPlayer(): Promise<Player | null> {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.fetchStoredPlayer();
    return this.loadPromise;
  }

  async saveProfile(nickname: string, nationality: string): Promise<Player> {
    const cleanNickname = this.cleanText(nickname, 30);
    const cleanNationality = this.cleanText(nationality, 56);

    if (cleanNickname.length < 2) {
      throw new Error('Nickname must be at least 2 characters.');
    }

    if (!cleanNationality) {
      throw new Error('Choose a nationality.');
    }

    const tokenHash = await this.getDeviceTokenHash();
    const { data, error } = await this.supabase.client
      .from('players')
      .upsert(
        {
          device_token_hash: tokenHash,
          nickname: cleanNickname,
          nationality: cleanNationality,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'device_token_hash' },
      )
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const player = data as Player;
    this.currentPlayer.set(player);
    this.loadPromise = Promise.resolve(player);
    return player;
  }

  clearLocalIdentity(): void {
    localStorage.removeItem(DEVICE_TOKEN_KEY);
    this.currentPlayer.set(null);
    this.loadPromise = null;
  }

  private async fetchStoredPlayer(): Promise<Player | null> {
    const tokenHash = await this.getDeviceTokenHash();
    const { data, error } = await this.supabase.client
      .from('players')
      .select('*')
      .eq('device_token_hash', tokenHash)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    const player = (data as Player | null) ?? null;
    this.currentPlayer.set(player);
    return player;
  }

  private getOrCreateDeviceToken(): string {
    const existing = localStorage.getItem(DEVICE_TOKEN_KEY);

    if (existing) {
      return existing;
    }

    const token = crypto.randomUUID();
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
    return token;
  }

  private async getDeviceTokenHash(): Promise<string> {
    const token = this.getOrCreateDeviceToken();
    const encoded = new TextEncoder().encode(token);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  private cleanText(value: string, maxLength: number): string {
    // Angular escapes interpolated text in templates; trimming and length limits keep stored data tidy.
    return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
  }
}
