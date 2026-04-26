import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Match } from '../../core/models/match.model';
import { Pickem } from '../../core/models/pickem.model';
import { Player } from '../../core/models/player.model';
import { Room } from '../../core/models/room.model';
import { MatchService } from '../../core/services/match.service';
import { PickemsService } from '../../core/services/pickems.service';
import { PlayerService } from '../../core/services/player.service';
import { RoomService } from '../../core/services/room.service';

interface PredictionDraft {
  homeScore: number | null;
  awayScore: number | null;
  saving: boolean;
  saved: boolean;
}

@Component({
  selector: 'app-pickems',
  imports: [DatePipe, FormsModule, RouterLink],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p class="text-sm font-black uppercase tracking-[0.18em] text-emerald-300">Pickems</p>
          <h1 class="mt-2 text-4xl font-black text-white">Predict the road to the final</h1>
          <p class="mt-3 max-w-2xl leading-7 text-slate-300">
            Scores can be changed until kickoff or until the match status is no longer scheduled.
          </p>
        </div>
        @if (room()) {
          <div class="page-card py-3">
            <p class="text-sm text-slate-400">Room picks</p>
            <p class="font-black">{{ room()?.name }} · {{ room()?.code }}</p>
          </div>
        }
      </div>

      @if (loading()) {
        <div class="page-card">Loading matches and saved picks...</div>
      } @else if (error()) {
        <div class="page-card border-red-300/30 bg-red-400/10 text-red-100">
          {{ error() }}
          <a routerLink="/onboarding" class="mt-3 block font-bold underline">Create or update profile</a>
        </div>
      } @else {
        @for (stage of stages; track stage) {
          @if (stageMatches(stage).length) {
            <div class="space-y-3">
              <h2 class="text-2xl font-black text-white">{{ stage }}</h2>
              <div class="grid gap-3">
                @for (match of stageMatches(stage); track match.id) {
                  <article class="page-card">
                    <div class="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
                      <div>
                        <div class="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                          <span>Match {{ match.match_number }}</span>
                          @if (match.group_name) {
                            <span>{{ match.group_name }}</span>
                          }
                          <span [class]="isLocked(match) ? 'text-red-200' : 'text-emerald-200'">
                            {{ isLocked(match) ? 'Locked' : 'Open' }}
                          </span>
                        </div>
                        <div class="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                          <p class="font-black text-white">{{ match.home_team }}</p>
                          <span class="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-slate-300">vs</span>
                          <p class="text-right font-black text-white">{{ match.away_team }}</p>
                        </div>
                        @if (match.kickoff_at) {
                          <p class="mt-2 text-sm text-slate-400">{{ match.kickoff_at | date: 'medium' }}</p>
                        }
                      </div>

                      <div class="grid gap-3 sm:grid-cols-[76px_76px_auto] sm:items-end">
                        <label class="space-y-1">
                          <span class="text-xs font-bold text-slate-400">Home</span>
                          <input
                            class="field text-center"
                            type="number"
                            min="0"
                            max="20"
                            [disabled]="isLocked(match)"
                            [(ngModel)]="drafts[match.id].homeScore"
                          />
                        </label>
                        <label class="space-y-1">
                          <span class="text-xs font-bold text-slate-400">Away</span>
                          <input
                            class="field text-center"
                            type="number"
                            min="0"
                            max="20"
                            [disabled]="isLocked(match)"
                            [(ngModel)]="drafts[match.id].awayScore"
                          />
                        </label>
                        <button class="btn-primary" type="button" [disabled]="isLocked(match) || drafts[match.id].saving" (click)="save(match)">
                          {{ drafts[match.id].saving ? 'Saving...' : drafts[match.id].saved ? 'Saved' : 'Save' }}
                        </button>
                      </div>
                    </div>
                  </article>
                }
              </div>
            </div>
          }
        }
      }
    </section>
  `,
})
export class PickemsComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal('');
  readonly player = signal<Player | null>(null);
  readonly room = signal<Room | null>(null);
  readonly stages = ['Group stage', 'Round of 32', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Third-place match', 'Final'];
  readonly matches = signal<Match[]>([]);
  drafts: Record<string, PredictionDraft> = {};
  private roomId: string | null = null;

  constructor(
    private readonly playerService: PlayerService,
    private readonly matchService: MatchService,
    private readonly pickemsService: PickemsService,
    private readonly roomService: RoomService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    this.roomId = this.route.snapshot.queryParamMap.get('roomId');

    try {
      const player = await this.playerService.loadStoredPlayer();
      if (!player) {
        await this.router.navigate(['/onboarding'], { queryParams: { returnUrl: this.router.url } });
        return;
      }

      this.player.set(player);
      const [matches, pickems] = await Promise.all([
        this.matchService.listMatches(),
        this.pickemsService.listPlayerPickems(player.id, this.roomId),
      ]);

      if (this.roomId) {
        this.room.set(await this.roomService.getRoom(this.roomId));
      }

      this.matches.set(matches);
      this.hydrateDrafts(matches, pickems);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Could not load pickems.');
    } finally {
      this.loading.set(false);
    }
  }

  stageMatches(stage: string): Match[] {
    return this.matches().filter((match) => match.stage === stage);
  }

  isLocked(match: Match): boolean {
    return this.matchService.isLocked(match);
  }

  async save(match: Match): Promise<void> {
    const player = this.player();
    const draft = this.drafts[match.id];

    if (!player || this.isLocked(match) || draft.homeScore === null || draft.awayScore === null) {
      return;
    }

    draft.saving = true;
    this.error.set('');

    try {
      await this.pickemsService.savePickem({
        playerId: player.id,
        roomId: this.roomId,
        matchId: match.id,
        predictedHomeScore: Number(draft.homeScore),
        predictedAwayScore: Number(draft.awayScore),
        predictedWinnerTeam: this.predictedWinner(match, Number(draft.homeScore), Number(draft.awayScore)),
      });
      draft.saved = true;
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Could not save pick.');
    } finally {
      draft.saving = false;
    }
  }

  private hydrateDrafts(matches: Match[], pickems: Pickem[]): void {
    const pickemsByMatchId = new Map(pickems.map((pickem) => [pickem.match_id, pickem]));

    this.drafts = matches.reduce<Record<string, PredictionDraft>>((drafts, match) => {
      const pickem = pickemsByMatchId.get(match.id);
      drafts[match.id] = {
        homeScore: pickem?.predicted_home_score ?? null,
        awayScore: pickem?.predicted_away_score ?? null,
        saving: false,
        saved: Boolean(pickem),
      };
      return drafts;
    }, {});
  }

  private predictedWinner(match: Match, homeScore: number, awayScore: number): string {
    if (homeScore === awayScore) {
      return 'Draw';
    }

    return homeScore > awayScore ? match.home_team : match.away_team;
  }
}
