import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LeaderboardEntry } from '../../core/models/leaderboard-entry.model';
import { Room } from '../../core/models/room.model';
import { LeaderboardService } from '../../core/services/leaderboard.service';
import { RoomService } from '../../core/services/room.service';

@Component({
  selector: 'app-leaderboard',
  imports: [RouterLink],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p class="text-sm font-black uppercase tracking-[0.18em] text-emerald-300">Leaderboard</p>
          <h1 class="mt-2 text-4xl font-black text-white">
            {{ room() ? room()?.name : 'Global standings' }}
          </h1>
          <p class="mt-3 max-w-2xl leading-7 text-slate-300">
            Cached standings keep page loads light. Recalculate cache after match results are updated.
          </p>
        </div>
        @if (room()) {
          <a routerLink="/leaderboard" class="btn-secondary">View global</a>
        } @else {
          <a routerLink="/rooms" class="btn-secondary">Choose a room</a>
        }
      </div>

      @if (loading()) {
        <div class="page-card">Loading leaderboard...</div>
      } @else if (error()) {
        <div class="page-card border-red-300/30 bg-red-400/10 text-red-100">{{ error() }}</div>
      } @else {
        <div class="overflow-hidden rounded-lg border border-white/10 bg-white/[0.06]">
          <div class="grid grid-cols-[56px_1fr_90px_90px] gap-3 border-b border-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            <span>Rank</span>
            <span>Player</span>
            <span class="text-right">Points</span>
            <span class="text-right">Correct</span>
          </div>
          @if (!entries().length) {
            <p class="p-4 text-slate-300">No leaderboard entries yet.</p>
          } @else {
            @for (entry of entries(); track entry.id; let index = $index) {
              <div class="grid grid-cols-[56px_1fr_90px_90px] gap-3 border-b border-white/5 px-4 py-3 last:border-b-0">
                <span class="font-black text-emerald-200">#{{ index + 1 }}</span>
                <span class="min-w-0">
                  <span class="block truncate font-bold text-white">{{ entry.player?.nickname || 'Player' }}</span>
                  <span class="text-sm text-slate-400">{{ entry.player?.nationality || 'Unknown' }}</span>
                </span>
                <span class="text-right font-black">{{ entry.total_points }}</span>
                <span class="text-right">{{ entry.correct_winners }}</span>
              </div>
            }
          }
        </div>
      }
    </section>
  `,
})
export class LeaderboardComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal('');
  readonly entries = signal<LeaderboardEntry[]>([]);
  readonly room = signal<Room | null>(null);

  constructor(
    private readonly leaderboardService: LeaderboardService,
    private readonly roomService: RoomService,
    private readonly route: ActivatedRoute,
  ) {}

  async ngOnInit(): Promise<void> {
    const roomId = this.route.snapshot.queryParamMap.get('roomId');

    try {
      if (roomId) {
        this.room.set(await this.roomService.getRoom(roomId));
        this.entries.set(await this.leaderboardService.listRoom(roomId));
      } else {
        this.entries.set(await this.leaderboardService.listGlobal());
      }
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Could not load leaderboard.');
    } finally {
      this.loading.set(false);
    }
  }
}
