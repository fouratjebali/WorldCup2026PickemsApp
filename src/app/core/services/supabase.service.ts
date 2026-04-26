import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly supabaseClient: SupabaseClient | null;

  constructor() {
    const configured =
      environment.supabaseUrl.startsWith('https://') &&
      !environment.supabaseUrl.includes('your-project-ref') &&
      !environment.supabaseAnonKey.includes('your-public-anon-key');

    this.supabaseClient = configured
      ? createClient(environment.supabaseUrl, environment.supabaseAnonKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
          global: {
            headers: {
              'x-application-name': environment.appName,
            },
          },
        })
      : null;
  }

  get client(): SupabaseClient {
    if (!this.supabaseClient) {
      throw new Error(
        'Supabase is not configured yet. Update src/environments/environment.ts with your project URL and anon key.',
      );
    }

    return this.supabaseClient;
  }

  isConfigured(): boolean {
    return this.supabaseClient !== null;
  }
}
