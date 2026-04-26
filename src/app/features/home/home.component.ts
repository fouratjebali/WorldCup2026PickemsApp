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
            <p class="font-bold text-amber-100">It's your first time here!</p>
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
        <div class="mt-5 rounded-lg border border-white/10 bg-linear-to-br from-emerald-400/20 via-white/5 to-red-400/20 p-5">
          <p class="text-sm font-bold uppercase tracking-[0.16em] text-emerald-200">Enjoy WC26 Pickems!</p>
          <p class="mt-3 text-2xl font-black">Choose your country. Predict the World Cup. Compete with fans around the world!</p>
        </div>
      </div>
    </section>

    <footer class="mt-10 border-t border-white/10 pt-4">
      <div class="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
        <p class="font-medium text-slate-200">Developed by Fourat Jebali</p>
        <div class="flex items-center gap-2">
          <a
            class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-emerald-300/60 hover:bg-emerald-400/10 hover:text-white"
            href="https://github.com/fouratjebali"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub profile"
            title="GitHub"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.77.6-3.35-1.18-3.35-1.18-.45-1.16-1.1-1.47-1.1-1.47-.9-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.33 1.09 2.9.83.09-.65.35-1.09.63-1.34-2.21-.25-4.54-1.1-4.54-4.9 0-1.08.38-1.97 1.02-2.66-.1-.25-.44-1.26.1-2.62 0 0 .83-.27 2.7 1.02a9.35 9.35 0 0 1 4.92 0c1.87-1.29 2.7-1.02 2.7-1.02.54 1.36.2 2.37.1 2.62.64.69 1.02 1.58 1.02 2.66 0 3.81-2.33 4.65-4.55 4.9.36.31.68.92.68 1.86v2.76c0 .26.18.57.69.48A10 10 0 0 0 12 2Z" />
            </svg>
          </a>
          <a
            class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-emerald-300/60 hover:bg-emerald-400/10 hover:text-white"
            href="https://www.linkedin.com/in/fouratjebali/"
            target="_blank"
            rel="noreferrer"
            aria-label="LinkedIn profile"
            title="LinkedIn"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor" aria-hidden="true">
              <path d="M6.94 6.5a1.94 1.94 0 1 1-3.88 0 1.94 1.94 0 0 1 3.88 0ZM3.5 21V8.5h3.1V21H3.5Zm5.4 0V8.5h2.98v1.71h.04c.42-.8 1.45-1.64 2.99-1.64 3.2 0 3.79 2.1 3.79 4.84V21h-3.1v-5.1c0-1.22-.02-2.79-1.7-2.79-1.71 0-1.98 1.33-1.98 2.7V21H8.9Z" />
            </svg>
          </a>
          <a
            class="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-emerald-300/60 hover:bg-emerald-400/10 hover:text-white"
            href="mailto:fouratcs@gmail.com"
            aria-label="Email Fourat Jebali"
            title="Email"
          >
            <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="m4 7 8 6 8-6" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
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
      this.error.set('The app is not ready yet. Please try again later.');
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
      this.error.set('We could not load the latest tournament info. Refresh the page to try again.');
    }
  }
}
