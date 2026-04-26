import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Match } from '../../core/models/match.model';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-admin-data',
  imports: [FormsModule],
  template: `
    <section class="mx-auto max-w-4xl space-y-6">
      <div>
        <p class="text-sm font-black uppercase tracking-[0.18em] text-amber-300">Local data helper</p>
        <h1 class="mt-2 text-4xl font-black text-white">Admin data loader</h1>
        <p class="mt-3 leading-7 text-slate-300">
          This page is protected only by being unlinked from the main navigation. It is useful for local/dev seed updates,
          not for secure production administration.
        </p>
      </div>

      <div class="page-card border-amber-300/30 bg-amber-300/10">
        <p class="font-bold text-amber-100">Production warning</p>
        <p class="mt-2 text-sm leading-6 text-amber-50/80">
          Do not expose a Supabase service role key in frontend code. For real result updates, use the Supabase dashboard,
          SQL editor, or a properly secured server-side function.
        </p>
      </div>

      <div class="page-card space-y-4">
        <label class="block space-y-2">
          <span class="label">Matches JSON</span>
          <textarea class="field min-h-72 font-mono text-sm" [(ngModel)]="jsonText"></textarea>
        </label>
        <button class="btn-primary" type="button" [disabled]="saving()" (click)="loadJson()">
          {{ saving() ? 'Loading...' : 'Upsert matches' }}
        </button>
        @if (message()) {
          <p class="rounded-md border border-emerald-300/30 bg-emerald-400/10 p-3 text-sm text-emerald-100">{{ message() }}</p>
        }
        @if (error()) {
          <p class="rounded-md border border-red-300/30 bg-red-400/10 p-3 text-sm text-red-100">{{ error() }}</p>
        }
      </div>
    </section>
  `,
})
export class AdminDataComponent {
  readonly saving = signal(false);
  readonly message = signal('');
  readonly error = signal('');
  jsonText = JSON.stringify(
    [
      {
        stage: 'Group stage',
        group_name: 'Group A',
        match_number: 1,
        home_team: 'Team A1',
        away_team: 'Team A2',
        kickoff_at: null,
        status: 'scheduled',
      },
    ],
    null,
    2,
  );

  constructor(private readonly supabase: SupabaseService) {}

  async loadJson(): Promise<void> {
    this.saving.set(true);
    this.message.set('');
    this.error.set('');

    try {
      const matches = JSON.parse(this.jsonText) as Partial<Match>[];
      if (!Array.isArray(matches)) {
        throw new Error('JSON must be an array of matches.');
      }

      const cleanMatches = matches.map((match) => ({
        stage: match.stage,
        group_name: match.group_name ?? null,
        match_number: match.match_number,
        home_team: match.home_team,
        away_team: match.away_team,
        kickoff_at: match.kickoff_at ?? null,
        home_score: match.home_score ?? null,
        away_score: match.away_score ?? null,
        winner_team: match.winner_team ?? null,
        status: match.status ?? 'scheduled',
      }));

      const { error } = await this.supabase.client.from('matches').upsert(cleanMatches, { onConflict: 'match_number' });
      if (error) {
        throw new Error(error.message);
      }

      this.message.set(`Loaded ${cleanMatches.length} matches.`);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Could not load JSON.');
    } finally {
      this.saving.set(false);
    }
  }
}
