import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GroupStandingPick } from '../../core/models/group-standing-pick.model';
import { Match } from '../../core/models/match.model';
import { Pickem } from '../../core/models/pickem.model';
import { Player } from '../../core/models/player.model';
import { MatchService } from '../../core/services/match.service';
import { PickemsService } from '../../core/services/pickems.service';
import { PlayerService } from '../../core/services/player.service';

interface TeamStanding {
  team: string;
  played: number;
  wins: number;
  points: number;
}

@Component({
  selector: 'app-pickems',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p class="text-sm font-black uppercase tracking-[0.18em] text-emerald-300">Group picks</p>
          <h1 class="mt-2 text-4xl font-black text-white">Pick every group winner</h1>
          <p class="mt-3 max-w-2xl leading-7 text-slate-300">
            Choose one winner per match. The selected team turns green, the other team turns red, and the group table
            updates immediately. Saved groups are locked.
          </p>
        </div>

        <div class="page-card py-3">
          <p class="text-sm text-slate-400">Progress</p>
          <p class="font-black">{{ savedGroupCount() }} / {{ groups().length }} groups saved</p>
        </div>
      </div>

      @if (loading()) {
        <div class="page-card">Loading group matches...</div>
      } @else if (error()) {
        <div class="page-card border-red-300/30 bg-red-400/10 text-red-100">
          {{ error() }}
          <a routerLink="/onboarding" class="mt-3 block font-bold underline">Create or update profile</a>
        </div>
      } @else {
        <div class="flex gap-2 overflow-x-auto pb-2">
          @for (group of groups(); track group; let index = $index) {
            <button
              type="button"
              class="min-w-24 rounded-md px-3 py-2 text-sm font-black transition"
              [class.bg-emerald-400]="isCurrentGroup(index)"
              [class.text-slate-950]="isCurrentGroup(index)"
              [class.bg-white]="!isCurrentGroup(index) && isGroupSaved(group)"
              [class.text-slate-950]="!isCurrentGroup(index) && isGroupSaved(group)"
              [class.bg-white/10]="!isCurrentGroup(index) && !isGroupSaved(group)"
              [class.text-slate-200]="!isCurrentGroup(index) && !isGroupSaved(group)"
              (click)="goToGroup(index)"
            >
              {{ group.replace('Group ', '') }}
            </button>
          }
        </div>

        <div class="grid gap-5 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div class="space-y-3">
            <div class="flex items-center justify-between gap-3">
              <div>
                <h2 class="text-3xl font-black text-white">{{ currentGroup() }}</h2>
                <p class="mt-1 text-sm text-slate-400">
                  {{ selectedCount(currentGroup()) }} / {{ currentGroupMatches().length }} matches picked
                </p>
              </div>
              @if (isGroupSaved(currentGroup())) {
                <span class="rounded-md bg-emerald-400 px-3 py-2 text-sm font-black text-slate-950">Saved</span>
              }
            </div>

            @for (match of currentGroupMatches(); track match.id) {
              <article class="page-card">
                <div class="mb-3 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                  <span>Match {{ match.match_number }}</span>
                  <span>{{ isMatchLocked(match) ? 'Locked' : 'Choose winner' }}</span>
                </div>

                <div class="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <button
                    type="button"
                    [class]="teamButtonClass(match, match.home_team)"
                    [disabled]="isMatchLocked(match)"
                    (click)="selectWinner(match, match.home_team)"
                  >
                    {{ match.home_team }}
                  </button>

                  <span class="hidden rounded-md bg-white/10 px-3 py-2 text-center text-xs font-black text-slate-300 sm:block">
                    VS
                  </span>

                  <button
                    type="button"
                    [class]="teamButtonClass(match, match.away_team)"
                    [disabled]="isMatchLocked(match)"
                    (click)="selectWinner(match, match.away_team)"
                  >
                    {{ match.away_team }}
                  </button>
                </div>
              </article>
            }

            <div class="page-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="font-black text-white">{{ currentGroup() }} status</p>
                <p class="mt-1 text-sm text-slate-400">
                  Save this group when every match has a selected winner. You cannot edit it afterward.
                </p>
              </div>

              @if (allGroupsSaved()) {
                <a class="btn-primary" routerLink="/bracket" [queryParams]="roomId ? { roomId: roomId } : null">Go to bracket</a>
              } @else if (isGroupSaved(currentGroup())) {
                <button class="btn-primary" type="button" (click)="goToNextGroup()">Next group</button>
              } @else {
                <button class="btn-primary" type="button" [disabled]="!canSaveCurrentGroup() || saving()" (click)="saveCurrentGroup()">
                  {{ saving() ? 'Saving...' : 'Save group' }}
                </button>
              }
            </div>
          </div>

          <aside class="page-card sticky top-6">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-2xl font-black text-white">{{ currentGroup() }} table</h2>
              <span class="rounded-md bg-white/10 px-2 py-1 text-xs font-black text-slate-300">Live</span>
            </div>

            <div class="mt-4 overflow-hidden rounded-lg border border-white/10">
              <div class="grid grid-cols-[40px_1fr_72px_44px_44px_44px] gap-2 bg-slate-950/80 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                <span>#</span>
                <span>Team</span>
                <span class="text-center">Tie</span>
                <span class="text-right">P</span>
                <span class="text-right">W</span>
                <span class="text-right">Pts</span>
              </div>

              @for (standing of currentStandings(); track standing.team; let index = $index) {
                <div
                  class="grid grid-cols-[40px_1fr_72px_44px_44px_44px] items-center gap-2 border-t border-white/5 px-3 py-3"
                  [class.bg-emerald-400/10]="index < 2"
                  [class.bg-amber-300/10]="index === 2"
                >
                  <span class="font-black" [class.text-emerald-200]="index < 2" [class.text-amber-200]="index === 2">
                    {{ index + 1 }}
                  </span>
                  <span class="truncate font-bold text-white">{{ standing.team }}</span>
                  <span class="flex justify-center gap-1">
                    <button
                      type="button"
                      class="rounded bg-white/10 px-2 py-1 text-xs font-black text-white disabled:opacity-25"
                      [disabled]="!canMoveStandingUp(index)"
                      (click)="moveStanding(index, -1)"
                      title="Move up inside tied teams"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      class="rounded bg-white/10 px-2 py-1 text-xs font-black text-white disabled:opacity-25"
                      [disabled]="!canMoveStandingDown(index)"
                      (click)="moveStanding(index, 1)"
                      title="Move down inside tied teams"
                    >
                      ↓
                    </button>
                  </span>
                  <span class="text-right text-slate-300">{{ standing.played }}</span>
                  <span class="text-right text-slate-300">{{ standing.wins }}</span>
                  <span class="text-right font-black text-white">{{ standing.points }}</span>
                </div>
              }
            </div>

            <p class="mt-4 text-sm leading-6 text-slate-400">
              If teams are tied on points, use the arrows to choose their order before saving. The top two teams qualify
              automatically, and the bracket also uses the best eight third-place teams.
            </p>
          </aside>
        </div>
      }
    </section>
  `,
})
export class PickemsComponent implements OnInit {
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly player = signal<Player | null>(null);
  readonly matches = signal<Match[]>([]);
  readonly groups = signal<string[]>([]);
  readonly currentGroupIndex = signal(0);
  readonly selections = signal<Record<string, string>>({});
  readonly lockedMatchIds = signal<string[]>([]);
  readonly manualGroupOrders = signal<Record<string, string[]>>({});
  readonly currentGroup = computed(() => this.groups()[this.currentGroupIndex()] ?? '');
  readonly currentGroupMatches = computed(() => this.matchesForGroup(this.currentGroup()));
  readonly currentStandings = computed(() => this.calculateStandings(this.currentGroup()));
  roomId: string | null = null;

  constructor(
    private readonly playerService: PlayerService,
    private readonly matchService: MatchService,
    private readonly pickemsService: PickemsService,
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
      const [matches, pickems, standingPicks] = await Promise.all([
        this.matchService.listMatches(),
        this.pickemsService.listPlayerPickems(player.id, this.roomId),
        this.pickemsService.listPlayerGroupStandings(player.id, this.roomId),
      ]);
      const groupMatches = matches.filter((match) => match.stage === 'Group stage' && match.group_name);

      this.matches.set(groupMatches);
      this.groups.set([...new Set(groupMatches.map((match) => match.group_name!))].sort());
      this.hydrateSelections(pickems);
      this.hydrateManualOrders(standingPicks);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Could not load group picks.');
    } finally {
      this.loading.set(false);
    }
  }

  goToGroup(index: number): void {
    this.currentGroupIndex.set(index);
  }

  goToNextGroup(): void {
    const next = Math.min(this.currentGroupIndex() + 1, this.groups().length - 1);
    this.currentGroupIndex.set(next);
  }

  isCurrentGroup(index: number): boolean {
    return this.currentGroupIndex() === index;
  }

  selectWinner(match: Match, team: string): void {
    if (this.isMatchLocked(match)) {
      return;
    }

    this.selections.update((current) => ({ ...current, [match.id]: team }));
  }

  teamButtonClass(match: Match, team: string): string {
    const selected = this.selections()[match.id];
    const base =
      'min-h-16 rounded-lg border px-4 py-3 text-left font-black transition disabled:cursor-not-allowed disabled:opacity-80';

    if (selected === team) {
      return `${base} border-emerald-300 bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/30`;
    }

    if (selected) {
      return `${base} border-red-300/30 bg-red-400/15 text-red-100`;
    }

    return `${base} border-white/10 bg-slate-950/70 text-white hover:border-emerald-300/60 hover:bg-white/10`;
  }

  isMatchLocked(match: Match): boolean {
    return this.lockedMatchIds().includes(match.id) || this.matchService.isLocked(match);
  }

  isGroupSaved(group: string): boolean {
    const matches = this.matchesForGroup(group);
    return matches.length > 0 && matches.every((match) => this.lockedMatchIds().includes(match.id));
  }

  selectedCount(group: string): number {
    return this.matchesForGroup(group).filter((match) => this.selections()[match.id]).length;
  }

  canMoveStandingUp(index: number): boolean {
    const standings = this.currentStandings();
    return !this.isGroupSaved(this.currentGroup()) && index > 0 && standings[index]?.points === standings[index - 1]?.points;
  }

  canMoveStandingDown(index: number): boolean {
    const standings = this.currentStandings();
    return (
      !this.isGroupSaved(this.currentGroup()) &&
      index < standings.length - 1 &&
      standings[index]?.points === standings[index + 1]?.points
    );
  }

  moveStanding(index: number, direction: -1 | 1): void {
    const target = index + direction;
    if ((direction === -1 && !this.canMoveStandingUp(index)) || (direction === 1 && !this.canMoveStandingDown(index))) {
      return;
    }

    const group = this.currentGroup();
    const standings = this.currentStandings();
    const order = standings.map((standing) => standing.team);
    [order[index], order[target]] = [order[target], order[index]];

    this.manualGroupOrders.update((current) => ({ ...current, [group]: order }));
  }

  savedGroupCount(): number {
    return this.groups().filter((group) => this.isGroupSaved(group)).length;
  }

  allGroupsSaved(): boolean {
    return this.groups().length > 0 && this.savedGroupCount() === this.groups().length;
  }

  canSaveCurrentGroup(): boolean {
    const group = this.currentGroup();
    const matches = this.matchesForGroup(group);
    return !this.isGroupSaved(group) && matches.length > 0 && matches.every((match) => this.selections()[match.id]);
  }

  async saveCurrentGroup(): Promise<void> {
    const player = this.player();
    if (!player || !this.canSaveCurrentGroup() || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.error.set('');

    try {
      const matches = this.currentGroupMatches();
      await this.pickemsService.savePickems(
        matches.map((match) => ({
          playerId: player.id,
          roomId: this.roomId,
          matchId: match.id,
          predictedHomeScore: null,
          predictedAwayScore: null,
          predictedWinnerTeam: this.selections()[match.id],
          locked: true,
        })),
      );

      await this.pickemsService.saveGroupStandings(
        this.currentStandings().map((standing, index) => ({
          playerId: player.id,
          roomId: this.roomId,
          groupName: this.currentGroup(),
          team: standing.team,
          rank: index + 1,
          points: standing.points,
          wins: standing.wins,
          locked: true,
        })),
      );

      this.lockedMatchIds.update((ids) => [...new Set([...ids, ...matches.map((match) => match.id)])]);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Could not save this group. Please retry.');
    } finally {
      this.saving.set(false);
    }
  }

  private matchesForGroup(group: string): Match[] {
    return this.matches()
      .filter((match) => match.group_name === group)
      .sort((a, b) => a.match_number - b.match_number);
  }

  private calculateStandings(group: string): TeamStanding[] {
    const table = new Map<string, TeamStanding>();
    const ensureTeam = (team: string): TeamStanding => {
      if (!table.has(team)) {
        table.set(team, { team, played: 0, wins: 0, points: 0 });
      }

      return table.get(team)!;
    };

    for (const match of this.matchesForGroup(group)) {
      const home = ensureTeam(match.home_team);
      const away = ensureTeam(match.away_team);
      const winner = this.selections()[match.id];

      if (!winner) {
        continue;
      }

      home.played += 1;
      away.played += 1;

      const winningTeam = ensureTeam(winner);
      winningTeam.wins += 1;
      winningTeam.points += 3;
    }

    const manualOrder = this.manualGroupOrders()[group] ?? [];
    const orderIndex = (team: string): number => {
      const index = manualOrder.indexOf(team);
      return index === -1 ? Number.MAX_SAFE_INTEGER : index;
    };

    return [...table.values()].sort(
      (a, b) => b.points - a.points || orderIndex(a.team) - orderIndex(b.team) || a.team.localeCompare(b.team),
    );
  }

  private hydrateSelections(pickems: Pickem[]): void {
    const selections: Record<string, string> = {};
    const lockedIds: string[] = [];

    for (const pickem of pickems) {
      if (pickem.predicted_winner_team) {
        selections[pickem.match_id] = pickem.predicted_winner_team;
      }

      if (pickem.locked) {
        lockedIds.push(pickem.match_id);
      }
    }

    this.selections.set(selections);
    this.lockedMatchIds.set(lockedIds);
  }

  private hydrateManualOrders(standingPicks: GroupStandingPick[]): void {
    const orders = standingPicks.reduce<Record<string, string[]>>((groups, standing) => {
      groups[standing.group_name] = groups[standing.group_name] ?? [];
      groups[standing.group_name][standing.rank - 1] = standing.team;
      return groups;
    }, {});

    this.manualGroupOrders.set(orders);
  }
}
