import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GroupStandingPick } from '../../core/models/group-standing-pick.model';
import { Match } from '../../core/models/match.model';
import { Pickem } from '../../core/models/pickem.model';
import { Player } from '../../core/models/player.model';
import { Room } from '../../core/models/room.model';
import { MatchService } from '../../core/services/match.service';
import { PickemsService } from '../../core/services/pickems.service';
import { PlayerService } from '../../core/services/player.service';
import { RoomService } from '../../core/services/room.service';

type MemberPickemsView = 'groups' | 'knockout';

@Component({
  selector: 'app-member-pickems',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p class="text-sm font-black uppercase tracking-[0.18em] text-emerald-300">Room member pickems</p>
          <h1 class="mt-2 text-4xl font-black text-white">{{ targetPlayer()?.nickname || 'Member' }}</h1>
          <p class="mt-3 max-w-2xl leading-7 text-slate-300">
            {{ targetPlayer()?.nationality || 'Unknown nationality' }} in {{ room()?.name || 'this room' }}. This page is read-only.
          </p>
        </div>
        <a routerLink="/rooms" class="btn-secondary">Back to rooms</a>
      </div>

      @if (loading()) {
        <div class="page-card">Loading member pickems...</div>
      } @else if (error()) {
        <div class="page-card border-red-300/30 bg-red-400/10 text-red-100">{{ error() }}</div>
      } @else {
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-md px-4 py-2 font-black transition"
            [class.bg-emerald-400]="currentView() === 'groups'"
            [class.text-slate-950]="currentView() === 'groups'"
            [class.bg-white/10]="currentView() !== 'groups'"
            [class.text-white]="currentView() !== 'groups'"
            (click)="showGroups()"
          >
            Groups
          </button>
          <button
            type="button"
            class="rounded-md px-4 py-2 font-black transition"
            [class.bg-emerald-400]="currentView() === 'knockout'"
            [class.text-slate-950]="currentView() === 'knockout'"
            [class.bg-white/10]="currentView() !== 'knockout'"
            [class.text-white]="currentView() !== 'knockout'"
            (click)="showKnockout()"
          >
            Knockout
          </button>
        </div>

        @if (sectionError()) {
          <div class="page-card border-red-300/30 bg-red-400/10 text-red-100">{{ sectionError() }}</div>
        }

        @if (currentView() === 'groups') {
          <div class="space-y-5">
            <div class="flex gap-2 overflow-x-auto pb-2">
              @for (group of groups(); track group; let index = $index) {
                <button
                  type="button"
                  class="min-w-24 rounded-md px-3 py-2 text-sm font-black transition"
                  [class.bg-emerald-400]="isCurrentGroup(index)"
                  [class.text-slate-950]="isCurrentGroup(index)"
                  [class.bg-white/10]="!isCurrentGroup(index)"
                  [class.text-slate-200]="!isCurrentGroup(index)"
                  (click)="goToGroup(index)"
                >
                  {{ group.replace('Group ', '') }}
                </button>
              }
            </div>

            @if (sectionLoading()) {
              <div class="page-card">Loading {{ currentGroup() }}...</div>
            } @else {
              <article class="page-card">
                <div class="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                  <div>
                    <p class="text-sm font-black uppercase tracking-[0.18em] text-emerald-300">Group stage</p>
                    <h2 class="mt-2 text-3xl font-black text-white">{{ currentGroup() }}</h2>
                    <p class="mt-1 text-sm text-slate-400">
                      {{ selectedCount(currentGroupMatches()) }} / {{ currentGroupMatches().length }} matches picked
                    </p>
                  </div>

                  @if (isLastGroup()) {
                    <button class="btn-primary" type="button" (click)="showKnockout()">View bracket picks</button>
                  } @else {
                    <button class="btn-primary" type="button" (click)="goToNextGroup()">Next group</button>
                  }
                </div>

                <div class="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                  <div class="space-y-3">
                    @for (match of currentGroupMatches(); track match.id) {
                      <div class="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                        <div class="mb-3 flex items-center justify-between text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                          <span>Match {{ match.match_number }}</span>
                          <span>{{ selectedWinner(match.id) || 'No pick' }}</span>
                        </div>
                        <div class="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                          <div [class]="teamClass(match.id, match.home_team)">{{ match.home_team }}</div>
                          <span class="hidden rounded-md bg-white/10 px-3 py-2 text-center text-xs font-black text-slate-300 sm:block">VS</span>
                          <div [class]="teamClass(match.id, match.away_team)">{{ match.away_team }}</div>
                        </div>
                      </div>
                    }
                  </div>

                  <div class="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                    <h3 class="font-black text-white">Saved standing</h3>
                    @if (!currentGroupStandings().length) {
                      <p class="mt-3 text-sm text-slate-400">No standing saved for this group yet.</p>
                    } @else {
                      <div class="mt-3 space-y-2">
                        @for (standing of currentGroupStandings(); track standing.team) {
                          <div class="grid grid-cols-[36px_1fr_52px] gap-3 rounded-md bg-slate-950/60 px-3 py-2 text-sm">
                            <span class="font-black text-emerald-200">#{{ standing.rank }}</span>
                            <span class="truncate font-bold text-white">{{ standing.team }}</span>
                            <span class="text-right text-slate-300">{{ standing.points }} pts</span>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              </article>
            }
          </div>
        } @else {
          <div class="space-y-5">
            <div class="flex gap-2 overflow-x-auto pb-2">
              @for (stage of knockoutStages; track stage; let index = $index) {
                <button
                  type="button"
                  class="min-w-36 rounded-md px-3 py-2 text-sm font-black transition"
                  [class.bg-emerald-400]="isCurrentStage(index)"
                  [class.text-slate-950]="isCurrentStage(index)"
                  [class.bg-white/10]="!isCurrentStage(index)"
                  [class.text-slate-200]="!isCurrentStage(index)"
                  (click)="goToStage(index)"
                >
                  {{ stage }}
                </button>
              }
            </div>

            @if (sectionLoading()) {
              <div class="page-card">Loading {{ currentStage() }}...</div>
            } @else {
              <article class="page-card">
                <div class="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                  <div>
                    <p class="text-sm font-black uppercase tracking-[0.18em] text-emerald-300">Knockout</p>
                    <h2 class="mt-2 text-3xl font-black text-white">{{ currentStage() }}</h2>
                    <p class="mt-1 text-sm text-slate-400">
                      {{ selectedCount(currentStageMatches()) }} / {{ currentStageMatches().length }} matches picked
                    </p>
                  </div>

                  @if (!isFinalStage()) {
                    <button class="btn-primary" type="button" (click)="goToNextStage()">Next round</button>
                  }
                </div>

                <div class="grid gap-3 md:grid-cols-2">
                  @for (match of currentStageMatches(); track match.id) {
                    <div class="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                      <div class="mb-3 flex items-center justify-between text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                        <span>Match {{ match.match_number }}</span>
                        <span>{{ selectedWinner(match.id) ? 'Picked' : 'No pick' }}</span>
                      </div>
                      <div class="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                        <div [class]="teamClass(match.id, match.home_team)">{{ match.home_team }}</div>
                        <span class="hidden rounded-md bg-white/10 px-3 py-2 text-center text-xs font-black text-slate-300 sm:block">VS</span>
                        <div [class]="teamClass(match.id, match.away_team)">{{ match.away_team }}</div>
                      </div>
                      <p class="mt-3 rounded-md bg-emerald-400/10 px-3 py-2 text-sm font-black text-emerald-100">
                        Winner: {{ selectedWinner(match.id) || 'No winner selected' }}
                      </p>
                    </div>
                  }
                </div>
              </article>
            }
          </div>
        }
      }
    </section>
  `,
})
export class MemberPickemsComponent implements OnInit {
  readonly loading = signal(true);
  readonly sectionLoading = signal(false);
  readonly error = signal('');
  readonly sectionError = signal('');
  readonly room = signal<Room | null>(null);
  readonly targetPlayer = signal<Player | null>(null);
  readonly matches = signal<Match[]>([]);
  readonly pickemsByMatch = signal<Record<string, Pickem>>({});
  readonly standingsByGroup = signal<Record<string, GroupStandingPick[]>>({});
  readonly currentView = signal<MemberPickemsView>('groups');
  readonly currentGroupIndex = signal(0);
  readonly currentStageIndex = signal(0);
  readonly knockoutStages = ['Round of 32', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Third-place match', 'Final'];
  readonly groups = computed(() =>
    [...new Set(this.matches().filter((match) => match.stage === 'Group stage' && match.group_name).map((match) => match.group_name!))].sort(),
  );
  readonly currentGroup = computed(() => this.groups()[this.currentGroupIndex()] ?? '');
  readonly currentGroupMatches = computed(() => this.matchesForGroup(this.currentGroup()));
  readonly currentGroupStandings = computed(() => this.standingsByGroup()[this.currentGroup()] ?? []);
  readonly currentStage = computed(() => this.knockoutStages[this.currentStageIndex()] ?? this.knockoutStages[0]);
  readonly currentStageMatches = computed(() => this.matchesForStage(this.currentStage()));

  private roomId: string | null = null;
  private targetPlayerId: string | null = null;
  private readonly loadedPickemSections = new Set<string>();
  private readonly loadedStandingGroups = new Set<string>();

  constructor(
    private readonly matchService: MatchService,
    private readonly pickemsService: PickemsService,
    private readonly playerService: PlayerService,
    private readonly roomService: RoomService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    this.roomId = this.route.snapshot.paramMap.get('roomId');
    this.targetPlayerId = this.route.snapshot.paramMap.get('playerId');

    if (!this.roomId || !this.targetPlayerId) {
      this.error.set('Missing room or member.');
      this.loading.set(false);
      return;
    }

    try {
      const currentPlayer = await this.playerService.loadStoredPlayer();
      if (!currentPlayer) {
        await this.router.navigate(['/onboarding'], { queryParams: { returnUrl: this.router.url } });
        return;
      }

      const [room, members] = await Promise.all([
        this.roomService.getRoom(this.roomId),
        this.roomService.listRoomMembers(this.roomId),
      ]);

      if (!room) {
        throw new Error('Room not found.');
      }

      const currentMember = members.find((member) => member.player_id === currentPlayer.id);
      const targetMember = members.find((member) => member.player_id === this.targetPlayerId);

      if (!currentMember) {
        throw new Error('Join this room before viewing member pickems.');
      }

      if (!targetMember) {
        throw new Error('This player is not a member of the room.');
      }

      this.room.set(room);
      this.targetPlayer.set(targetMember.player ?? null);
      this.matches.set(await this.matchService.listMatches());
      await this.loadCurrentGroup();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'We could not load these pickems. Please refresh and try again.');
    } finally {
      this.loading.set(false);
    }
  }

  async showGroups(): Promise<void> {
    this.currentView.set('groups');
    await this.loadCurrentGroup();
  }

  async showKnockout(): Promise<void> {
    this.currentView.set('knockout');
    await this.loadCurrentStage();
  }

  async goToGroup(index: number): Promise<void> {
    this.currentGroupIndex.set(index);
    await this.loadCurrentGroup();
  }

  async goToNextGroup(): Promise<void> {
    if (this.isLastGroup()) {
      await this.showKnockout();
      return;
    }

    await this.goToGroup(this.currentGroupIndex() + 1);
  }

  async goToStage(index: number): Promise<void> {
    this.currentStageIndex.set(index);
    await this.loadCurrentStage();
  }

  async goToNextStage(): Promise<void> {
    await this.goToStage(Math.min(this.currentStageIndex() + 1, this.knockoutStages.length - 1));
  }

  isCurrentGroup(index: number): boolean {
    return this.currentGroupIndex() === index;
  }

  isLastGroup(): boolean {
    return this.currentGroupIndex() === this.groups().length - 1;
  }

  isCurrentStage(index: number): boolean {
    return this.currentStageIndex() === index;
  }

  isFinalStage(): boolean {
    return this.currentStage() === 'Final';
  }

  matchesForGroup(group: string): Match[] {
    return this.matches().filter((match) => match.group_name === group).sort((a, b) => a.match_number - b.match_number);
  }

  matchesForStage(stage: string): Match[] {
    return this.matches().filter((match) => match.stage === stage).sort((a, b) => a.match_number - b.match_number);
  }

  selectedWinner(matchId: string): string {
    return this.pickemsByMatch()[matchId]?.predicted_winner_team ?? '';
  }

  selectedCount(matches: Match[]): number {
    return matches.filter((match) => this.selectedWinner(match.id)).length;
  }

  teamClass(matchId: string, team: string): string {
    const selected = this.selectedWinner(matchId);
    const base = 'min-h-14 rounded-lg border px-4 py-3 font-black';

    if (selected === team) {
      return `${base} border-emerald-300 bg-emerald-400 text-slate-950`;
    }

    if (selected) {
      return `${base} border-red-300/30 bg-red-400/15 text-red-100`;
    }

    return `${base} border-white/10 bg-white/5 text-slate-300`;
  }

  private async loadCurrentGroup(): Promise<void> {
    const group = this.currentGroup();
    const matches = this.currentGroupMatches();

    if (!group || !matches.length) {
      return;
    }

    const sectionKey = `group:${group}`;
    await this.loadSection(sectionKey, async () => {
      const [pickems, standings] = await Promise.all([
        this.loadedPickemSections.has(sectionKey)
          ? Promise.resolve([])
          : this.pickemsService.listPlayerPickemsForMatches(this.targetPlayerId!, this.roomId, matches.map((match) => match.id)),
        this.loadedStandingGroups.has(group)
          ? Promise.resolve([])
          : this.pickemsService.listPlayerGroupStandingsForGroup(this.targetPlayerId!, this.roomId, group),
      ]);

      this.cachePickems(sectionKey, pickems);

      if (!this.loadedStandingGroups.has(group)) {
        this.standingsByGroup.update((current) => ({ ...current, [group]: standings }));
        this.loadedStandingGroups.add(group);
      }
    });
  }

  private async loadCurrentStage(): Promise<void> {
    const stage = this.currentStage();
    const matches = this.currentStageMatches();

    if (!stage || !matches.length) {
      return;
    }

    const sectionKey = `stage:${stage}`;
    await this.loadSection(sectionKey, async () => {
      if (this.loadedPickemSections.has(sectionKey)) {
        return;
      }

      const pickems = await this.pickemsService.listPlayerPickemsForMatches(
        this.targetPlayerId!,
        this.roomId,
        matches.map((match) => match.id),
      );
      this.cachePickems(sectionKey, pickems);
    });
  }

  private async loadSection(sectionKey: string, loader: () => Promise<void>): Promise<void> {
    this.sectionLoading.set(true);
    this.sectionError.set('');

    try {
      await loader();
    } catch (error) {
      this.sectionError.set(error instanceof Error ? error.message : 'We could not load this section. Please try again.');
    } finally {
      this.sectionLoading.set(false);
    }
  }

  private cachePickems(sectionKey: string, pickems: Pickem[]): void {
    if (this.loadedPickemSections.has(sectionKey)) {
      return;
    }

    this.pickemsByMatch.update((current) => ({
      ...current,
      ...Object.fromEntries(pickems.map((pickem) => [pickem.match_id, pickem])),
    }));
    this.loadedPickemSections.add(sectionKey);
  }
}
