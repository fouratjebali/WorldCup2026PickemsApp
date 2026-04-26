import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Player } from '../../core/models/player.model';
import { MatchService } from '../../core/services/match.service';
import { PlayerService } from '../../core/services/player.service';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <section class="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
      <div class="space-y-6">
        <p class="text-sm font-black uppercase tracking-[0.18em] text-emerald-300">World Cup 2026</p>
        <div class="space-y-4">
          <h1 class="max-w-3xl text-4xl font-black leading-tight text-white sm:text-6xl">
            Predict every stage. Climb your room table.
          </h1>
          <p class="max-w-2xl text-lg leading-8 text-slate-300">
            Build your tournament picks from the group phase to the final, create private rooms for friends, and compare
            scores on room and global leaderboards.
          </p>
        </div>

        @if (player()) {
          <div class="page-card max-w-xl">
            <p class="text-sm text-slate-400">Welcome back</p>
            <p class="mt-1 text-xl font-black">{{ player()?.nickname }} · {{ player()?.nationality }}</p>
          </div>
        } @else {
          <div class="page-card max-w-xl border-amber-300/30 bg-amber-300/10">
            <p class="font-bold text-amber-100">No classic login here.</p>
            <p class="mt-2 text-sm leading-6 text-amber-50/80">
              Your anonymous identity lives in this browser's localStorage. If you clear browser data or switch devices,
              the app treats you as a new player.
            </p>
          </div>
        }

        @if (error()) {
          <p class="rounded-md border border-red-300/30 bg-red-400/10 p-3 text-sm text-red-100">{{ error() }}</p>
        }

        <div class="flex flex-wrap gap-3">
          <a routerLink="/pickems" class="btn-primary">Start Pickems</a>
          <a routerLink="/rooms" class="btn-secondary">Create Room</a>
          <a routerLink="/rooms" class="btn-secondary">Join Room</a>
          <a routerLink="/leaderboard" class="btn-secondary">View Global Leaderboard</a>
        </div>
      </div>

      <div class="page-card">
        <div class="grid grid-cols-2 gap-3">
          @for (item of stats(); track item.label) {
            <div class="rounded-lg bg-slate-950/70 p-4">
              <p class="text-3xl font-black text-white">{{ item.value }}</p>
              <p class="mt-1 text-sm text-slate-400">{{ item.label }}</p>
            </div>
          }
        </div>
        <div class="mt-5 rounded-lg border border-white/10 bg-gradient-to-br from-emerald-400/20 via-white/5 to-red-400/20 p-5">
          <p class="text-sm font-bold uppercase tracking-[0.16em] text-emerald-200">Scoring</p>
          <p class="mt-3 text-2xl font-black">Winner-only picks: 1 group, 2 R32, 3 R16, 5 QF, 8 SF, 10 third, 15 final.</p>
        </div>
      </div>
    </section>
  `,
})
export class HomeComponent implements OnInit {
  readonly player = signal<Player | null>(null);
  readonly error = signal('');
  readonly stats = signal([
    { value: '-', label: 'tournament matches' },
    { value: '-', label: 'groups in draw' },
    { value: '-', label: 'stages supported' },
    { value: '-', label: 'knockout matches' },
  ]);

  constructor(
    private readonly playerService: PlayerService,
    private readonly matchService: MatchService,
    private readonly supabase: SupabaseService,
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.supabase.isConfigured()) {
      this.error.set('Supabase is not configured yet. Add your URL and anon key in src/environments/environment.ts.');
      return;
    }

    try {
      const [player, matches] = await Promise.all([this.playerService.loadStoredPlayer(), this.matchService.listMatches()]);
      const groups = new Set(matches.filter((match) => match.stage === 'Group stage' && match.group_name).map((match) => match.group_name));
      const stages = new Set(matches.map((match) => match.stage));
      const knockoutMatches = matches.filter((match) => match.stage !== 'Group stage');

      this.player.set(player);
      this.stats.set([
        { value: String(matches.length), label: 'tournament matches' },
        { value: String(groups.size), label: 'groups in draw' },
        { value: String(stages.size), label: 'stages supported' },
        { value: String(knockoutMatches.length), label: 'knockout matches' },
      ]);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Could not load home data.');
    }
  }
}
