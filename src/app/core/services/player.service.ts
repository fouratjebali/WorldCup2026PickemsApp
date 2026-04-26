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

    const token = this.createDeviceToken();
    localStorage.setItem(DEVICE_TOKEN_KEY, token);
    return token;
  }

  private createDeviceToken(): string {
    if (typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  private async getDeviceTokenHash(): Promise<string> {
    const token = this.getOrCreateDeviceToken();
    if (!crypto.subtle?.digest) {
      return this.fallbackTokenHash(token);
    }

    const encoded = new TextEncoder().encode(token);
    const digest = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  private fallbackTokenHash(token: string): string {
    // Older or non-secure browser contexts may not expose Web Crypto digest.
    // This is not a password hash; it is only a stable lookup key for the local anonymous device token.
    let hash = 0x811c9dc5;

    for (let index = 0; index < token.length; index += 1) {
      hash ^= token.charCodeAt(index);
      hash = Math.imul(hash, 0x01000193);
    }

    return `fallback-${(hash >>> 0).toString(16).padStart(8, '0')}`;
  }

  private cleanText(value: string, maxLength: number): string {
    // Angular escapes interpolated text in templates; trimming and length limits keep stored data tidy.
    return value.replace(/\s+/g, ' ').trim().slice(0, maxLength);
  }
}
