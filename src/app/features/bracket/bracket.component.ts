import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GroupStandingPick } from '../../core/models/group-standing-pick.model';
import { Match } from '../../core/models/match.model';
import { Pickem } from '../../core/models/pickem.model';
import { Player } from '../../core/models/player.model';
import { MatchService } from '../../core/services/match.service';
import { PickemsService } from '../../core/services/pickems.service';
import { PlayerService } from '../../core/services/player.service';

interface GroupStanding {
  group: string;
  team: string;
  played: number;
  wins: number;
  points: number;
}

interface BracketMatch {
  match: Match;
  homeTeam: string;
  awayTeam: string;
  canPick: boolean;
}

@Component({
  selector: 'app-bracket',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p class="text-sm font-black uppercase tracking-[0.18em] text-emerald-300">Knockout bracket</p>
          <h1 class="mt-2 text-4xl font-black text-white">Build your champion path</h1>
          <p class="mt-3 max-w-2xl leading-7 text-slate-300">
            Pick one knockout round at a time. Finish the Round of 32, move to the Round of 16, and keep advancing teams
            until you choose the champion.
          </p>
        </div>

        <a class="btn-secondary" routerLink="/pickems" [queryParams]="roomId ? { roomId: roomId } : null">Back to groups</a>
      </div>

      @if (loading()) {
        <div class="page-card">Loading bracket...</div>
      } @else if (error()) {
        <div class="page-card border-red-300/30 bg-red-400/10 text-red-100">{{ error() }}</div>
      } @else if (!groupsComplete()) {
        <div class="page-card border-amber-300/30 bg-amber-300/10">
          <h2 class="text-2xl font-black text-amber-100">Finish the groups first</h2>
          <p class="mt-2 leading-7 text-amber-50/80">
            The bracket needs all group picks saved so the qualified teams can be placed correctly.
          </p>
          <a class="btn-primary mt-4" routerLink="/pickems" [queryParams]="roomId ? { roomId: roomId } : null">Continue groups</a>
        </div>
      } @else {
        @if (isBracketSaved()) {
          <div class="page-card border-emerald-300/30 bg-emerald-400/10">
            <p class="text-sm font-black uppercase tracking-[0.16em] text-emerald-200">Saved champion</p>
            <p class="mt-2 text-4xl font-black text-white">{{ champion() }}</p>
            <p class="mt-2 text-sm text-slate-300">These bracket picks are locked.</p>
          </div>
        }

        <div class="flex gap-2 overflow-x-auto pb-2">
          @for (stage of knockoutStages; track stage; let index = $index) {
            <button
              type="button"
              class="min-w-36 rounded-md px-3 py-2 text-sm font-black transition"
              [class.bg-emerald-400]="isCurrentStage(index)"
              [class.text-slate-950]="isCurrentStage(index)"
              [class.bg-white]="!isCurrentStage(index) && isStageComplete(stage)"
              [class.text-slate-950]="!isCurrentStage(index) && isStageComplete(stage)"
              [class.bg-white/10]="!isCurrentStage(index) && !isStageComplete(stage)"
              [class.text-slate-200]="!isCurrentStage(index) && !isStageComplete(stage)"
              [disabled]="!canOpenStage(index)"
              (click)="goToStage(index)"
            >
              {{ stage }}
            </button>
          }
        </div>

        <div class="grid gap-5 lg:grid-cols-[1fr_320px] lg:items-start">
          <div class="space-y-3">
            <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <h2 class="text-3xl font-black text-white">{{ currentStage() }}</h2>
                <p class="mt-1 text-sm text-slate-400">
                  {{ selectedCount(currentStage()) }} / {{ currentStageMatches().length }} matches picked
                </p>
              </div>

              @if (isStageComplete(currentStage())) {
                <span class="rounded-md bg-emerald-400 px-3 py-2 text-sm font-black text-slate-950">Complete</span>
              }
            </div>

            @for (bracketMatch of currentStageMatches(); track bracketMatch.match.id) {
              <article class="page-card">
                <div class="mb-3 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                  <span>Match {{ bracketMatch.match.match_number }}</span>
                  <span>{{ selectedWinner(bracketMatch.match.id) || 'Pending' }}</span>
                </div>

                <div class="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                  <button
                    type="button"
                    [class]="teamButtonClass(bracketMatch.match.id, bracketMatch.homeTeam)"
                    [disabled]="!bracketMatch.canPick || isBracketSaved()"
                    (click)="selectWinner(bracketMatch.match.id, bracketMatch.homeTeam)"
                  >
                    {{ bracketMatch.homeTeam }}
                  </button>

                  <span class="hidden rounded-md bg-white/10 px-3 py-2 text-center text-xs font-black text-slate-300 sm:block">
                    VS
                  </span>

                  <button
                    type="button"
                    [class]="teamButtonClass(bracketMatch.match.id, bracketMatch.awayTeam)"
                    [disabled]="!bracketMatch.canPick || isBracketSaved()"
                    (click)="selectWinner(bracketMatch.match.id, bracketMatch.awayTeam)"
                  >
                    {{ bracketMatch.awayTeam }}
                  </button>
                </div>
              </article>
            }

            <div class="page-card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p class="font-black text-white">{{ currentStageActionTitle() }}</p>
                <p class="mt-1 text-sm text-slate-400">{{ currentStageActionText() }}</p>
              </div>

              @if (isFinalStage()) {
                <button class="btn-primary" type="button" [disabled]="!champion() || isBracketSaved() || saving()" (click)="saveBracket()">
                  {{ saving() ? 'Saving...' : isBracketSaved() ? 'Saved' : 'Save bracket' }}
                </button>
              } @else {
                <button class="btn-primary" type="button" [disabled]="!isStageComplete(currentStage())" (click)="goToNextStage()">
                  Next round
                </button>
              }
            </div>
          </div>

          <aside class="page-card sticky top-6">
            <h2 class="text-2xl font-black text-white">Path summary</h2>
            <div class="mt-4 space-y-3">
              @for (stage of knockoutStages; track stage) {
                <div class="rounded-lg bg-slate-950/70 p-3">
                  <div class="flex items-center justify-between gap-3">
                    <p class="font-black text-white">{{ stage }}</p>
                    <p class="text-sm font-bold text-slate-400">{{ selectedCount(stage) }} / {{ bracketMatches(stage).length }}</p>
                  </div>
                  @if (stage === 'Final' && champion()) {
                    <p class="mt-2 text-sm text-emerald-200">Champion: {{ champion() }}</p>
                  }
                </div>
              }
            </div>
          </aside>
        </div>
      }
    </section>
  `,
})
export class BracketComponent implements OnInit {
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly player = signal<Player | null>(null);
  readonly allMatches = signal<Match[]>([]);
  readonly groupPickems = signal<Pickem[]>([]);
  readonly savedGroupStandings = signal<GroupStandingPick[]>([]);
  readonly selections = signal<Record<string, string>>({});
  readonly lockedMatchIds = signal<string[]>([]);
  readonly currentStageIndex = signal(0);
  readonly knockoutStages = ['Round of 32', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Third-place match', 'Final'];
  readonly groupStandingsCache = computed(() => this.buildGroupStandings());
  readonly bracketMatchesByStage = computed(() => this.buildBracketMatchesByStage());
  readonly currentStage = computed(() => this.knockoutStages[this.currentStageIndex()] ?? this.knockoutStages[0]);
  readonly currentStageMatches = computed(() => this.bracketMatches(this.currentStage()));
  readonly thirdPlaceAssignments = computed(() => this.buildThirdPlaceAssignments());
  readonly champion = computed(() => {
    const final = this.allMatches().find((match) => match.stage === 'Final');
    return final ? this.selections()[final.id] ?? '' : '';
  });
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

      this.allMatches.set(matches);
      this.groupPickems.set(pickems.filter((pickem) => this.matchById(pickem.match_id)?.stage === 'Group stage'));
      this.savedGroupStandings.set(standingPicks);
      this.hydrateKnockoutSelections(pickems);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Could not load bracket.');
    } finally {
      this.loading.set(false);
    }
  }

  groupsComplete(): boolean {
    const groupMatches = this.groupMatches();
    const groupPickIds = new Set(this.groupPickems().filter((pickem) => pickem.locked).map((pickem) => pickem.match_id));
    return groupMatches.length === 72 && groupMatches.every((match) => groupPickIds.has(match.id));
  }

  bracketMatches(stage: string): BracketMatch[] {
    return this.bracketMatchesByStage()[stage] ?? [];
  }

  goToStage(index: number): void {
    if (this.canOpenStage(index)) {
      this.currentStageIndex.set(index);
    }
  }

  goToNextStage(): void {
    const next = Math.min(this.currentStageIndex() + 1, this.knockoutStages.length - 1);
    if (this.canOpenStage(next)) {
      this.currentStageIndex.set(next);
    }
  }

  isCurrentStage(index: number): boolean {
    return this.currentStageIndex() === index;
  }

  canOpenStage(index: number): boolean {
    if (index <= 0 || this.isBracketSaved()) {
      return true;
    }

    return this.knockoutStages.slice(0, index).every((stage) => this.isStageComplete(stage));
  }

  isStageComplete(stage: string): boolean {
    const matches = this.bracketMatches(stage);
    return matches.length > 0 && matches.every((bracketMatch) => Boolean(this.selections()[bracketMatch.match.id]));
  }

  selectedCount(stage: string): number {
    return this.bracketMatches(stage).filter((bracketMatch) => this.selections()[bracketMatch.match.id]).length;
  }

  isFinalStage(): boolean {
    return this.currentStage() === 'Final';
  }

  currentStageActionTitle(): string {
    if (this.isFinalStage()) {
      return this.champion() ? `Champion: ${this.champion()}` : 'Choose your champion';
    }

    return this.isStageComplete(this.currentStage()) ? 'Round complete' : 'Finish this round';
  }

  currentStageActionText(): string {
    if (this.isFinalStage()) {
      return 'Save the bracket after choosing the final winner. You cannot edit it afterward.';
    }

    return 'Pick every winner in this round to unlock the next round.';
  }

  selectWinner(matchId: string, team: string): void {
    if (this.isBracketSaved() || team.startsWith('Winner ') || team.startsWith('Loser ')) {
      return;
    }

    this.selections.update((current) => {
      const next = { ...current, [matchId]: team };
      return this.removeInvalidDownstreamSelections(next);
    });
  }

  selectedWinner(matchId: string): string {
    return this.selections()[matchId] ?? '';
  }

  teamButtonClass(matchId: string, team: string): string {
    const selected = this.selections()[matchId];
    const pending = team.startsWith('Winner ') || team.startsWith('Loser ');
    const base =
      'min-h-14 rounded-lg border px-4 py-3 text-left font-black disabled:cursor-not-allowed disabled:opacity-70';

    if (pending) {
      return `${base} border-white/10 bg-slate-900/80 text-slate-500`;
    }

    if (selected === team) {
      return `${base} border-emerald-300 bg-emerald-400 text-slate-950`;
    }

    if (selected) {
      return `${base} border-red-300/30 bg-red-400/15 text-red-100`;
    }

    return `${base} border-white/10 bg-slate-950/70 text-white hover:border-emerald-300/60 hover:bg-white/10`;
  }

  isBracketSaved(): boolean {
    const knockoutIds = this.knockoutMatches().map((match) => match.id);
    return knockoutIds.length > 0 && knockoutIds.every((id) => this.lockedMatchIds().includes(id));
  }

  async saveBracket(): Promise<void> {
    const player = this.player();
    const selections = this.selections();

    if (!player || !this.champion() || this.saving()) {
      return;
    }

    const knockoutMatches = this.knockoutMatches();
    if (!knockoutMatches.every((match) => selections[match.id])) {
      this.error.set('Pick a winner for every knockout match before saving.');
      return;
    }

    this.saving.set(true);
    this.error.set('');

    try {
      await this.pickemsService.savePickems(
        knockoutMatches.map((match) => ({
          playerId: player.id,
          roomId: this.roomId,
          matchId: match.id,
          predictedHomeScore: null,
          predictedAwayScore: null,
          predictedWinnerTeam: selections[match.id],
          locked: true,
        })),
      );

      this.lockedMatchIds.set(knockoutMatches.map((match) => match.id));
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Could not save bracket. Please retry.');
    } finally {
      this.saving.set(false);
    }
  }

  private groupMatches(): Match[] {
    return this.allMatches().filter((match) => match.stage === 'Group stage');
  }

  private knockoutMatches(): Match[] {
    return this.allMatches().filter((match) => match.stage !== 'Group stage').sort((a, b) => a.match_number - b.match_number);
  }

  private buildBracketMatchesByStage(): Record<string, BracketMatch[]> {
    const stages = this.knockoutStages.reduce<Record<string, BracketMatch[]>>((accumulator, stage) => {
      accumulator[stage] = [];
      return accumulator;
    }, {});

    for (const stage of this.knockoutStages) {
      const stageMatches = this.allMatches()
        .filter((match) => match.stage === stage)
        .sort((a, b) => a.match_number - b.match_number);

      for (const match of stageMatches) {
        const homeTeam = this.resolveSlot(match.home_team, stages);
        const awayTeam = this.resolveSlot(match.away_team, stages);

        stages[stage].push({
          match,
          homeTeam,
          awayTeam,
          canPick:
            !homeTeam.startsWith('Winner ') &&
            !homeTeam.startsWith('Loser ') &&
            !awayTeam.startsWith('Winner ') &&
            !awayTeam.startsWith('Loser '),
        });
      }
    }

    return stages;
  }

  private buildThirdPlaceAssignments(): Record<string, string> {
    const thirdSlots = this.allMatches()
      .filter((match) => match.stage === 'Round of 32')
      .sort((a, b) => a.match_number - b.match_number)
      .flatMap((match) => [match.home_team, match.away_team])
      .filter((slot) => slot.startsWith('Third Group '));
    const thirdTeams = this.bestThirdTeams();
    const slotsByFewestOptions = [...thirdSlots].sort((a, b) => this.thirdSlotLetters(a).length - this.thirdSlotLetters(b).length);
    const assignments: Record<string, string> = {};
    const usedTeams = new Set<string>();

    const assign = (slotIndex: number): boolean => {
      if (slotIndex >= slotsByFewestOptions.length) {
        return true;
      }

      const slot = slotsByFewestOptions[slotIndex];
      const letters = this.thirdSlotLetters(slot);
      const options = thirdTeams.filter(
        (standing) => letters.includes(standing.group.replace('Group ', '')) && !usedTeams.has(standing.team),
      );

      for (const option of options) {
        assignments[slot] = option.team;
        usedTeams.add(option.team);

        if (assign(slotIndex + 1)) {
          return true;
        }

        usedTeams.delete(option.team);
        delete assignments[slot];
      }

      return false;
    };

    const fullyAssigned = assign(0);

    if (!fullyAssigned) {
      for (const slot of thirdSlots) {
        if (assignments[slot]) {
          continue;
        }

        const letters = this.thirdSlotLetters(slot);
        const fallback =
          thirdTeams.find((standing) => letters.includes(standing.group.replace('Group ', '')) && !usedTeams.has(standing.team)) ??
          thirdTeams.find((standing) => !usedTeams.has(standing.team));

        if (fallback) {
          assignments[slot] = fallback.team;
          usedTeams.add(fallback.team);
        }
      }
    }

    return assignments;
  }

  private buildGroupStandings(): GroupStanding[] {
    if (this.savedGroupStandings().length) {
      return this.savedGroupStandings()
        .map((standing) => ({
          group: standing.group_name,
          team: standing.team,
          played: 3,
          wins: standing.wins,
          points: standing.points,
        }))
        .sort((a, b) => a.group.localeCompare(b.group) || this.savedRank(a.group, a.team) - this.savedRank(b.group, b.team));
    }

    const pickemsByMatchId = new Map(this.groupPickems().map((pickem) => [pickem.match_id, pickem]));
    const table = new Map<string, GroupStanding>();
    const keyFor = (group: string, team: string) => `${group}:${team}`;
    const ensureTeam = (group: string, team: string): GroupStanding => {
      const key = keyFor(group, team);
      if (!table.has(key)) {
        table.set(key, { group, team, played: 0, wins: 0, points: 0 });
      }

      return table.get(key)!;
    };

    for (const match of this.groupMatches()) {
      const group = match.group_name ?? '';
      const pickem = pickemsByMatchId.get(match.id);
      const home = ensureTeam(group, match.home_team);
      const away = ensureTeam(group, match.away_team);

      if (!pickem?.predicted_winner_team) {
        continue;
      }

      home.played += 1;
      away.played += 1;
      const winner = ensureTeam(group, pickem.predicted_winner_team);
      winner.wins += 1;
      winner.points += 3;
    }

    return [...table.values()].sort((a, b) => a.group.localeCompare(b.group) || b.points - a.points || b.wins - a.wins || a.team.localeCompare(b.team));
  }

  private savedRank(group: string, team: string): number {
    return this.savedGroupStandings().find((standing) => standing.group_name === group && standing.team === team)?.rank ?? 99;
  }

  private groupRank(group: string, rank: number): string {
    return this.groupStandingsCache().filter((standing) => standing.group === group)[rank - 1]?.team ?? `${group} #${rank}`;
  }

  private bestThirdTeams(): GroupStanding[] {
    const groups = [...new Set(this.groupMatches().map((match) => match.group_name ?? ''))];
    return groups
      .map((group) => this.groupStandingsCache().filter((standing) => standing.group === group)[2])
      .filter(Boolean)
      .sort((a, b) => b.points - a.points || b.wins - a.wins || a.team.localeCompare(b.team))
      .slice(0, 8);
  }

  private thirdSlotLetters(slot: string): string[] {
    return slot.replace('Third Group ', '').split('/');
  }

  private resolveSlot(slot: string, stages: Record<string, BracketMatch[]>): string {
    const groupWinner = /^Winner Group ([A-L])$/.exec(slot);
    if (groupWinner) {
      return this.groupRank(`Group ${groupWinner[1]}`, 1);
    }

    const groupRunnerUp = /^Runner-up Group ([A-L])$/.exec(slot);
    if (groupRunnerUp) {
      return this.groupRank(`Group ${groupRunnerUp[1]}`, 2);
    }

    if (slot.startsWith('Third Group ')) {
      return this.thirdPlaceAssignments()[slot] ?? slot;
    }

    const matchWinner = /^Winner Match (\d+)$/.exec(slot);
    if (matchWinner) {
      const sourceMatch = this.allMatches().find((match) => match.match_number === Number(matchWinner[1]));
      return sourceMatch ? this.selections()[sourceMatch.id] ?? slot : slot;
    }

    const matchLoser = /^Loser Match (\d+)$/.exec(slot);
    if (matchLoser) {
      const sourceMatch = this.allMatches().find((match) => match.match_number === Number(matchLoser[1]));
      if (!sourceMatch) {
        return slot;
      }

      const winner = this.selections()[sourceMatch.id];
      const source = stages[sourceMatch.stage]?.find((bracketMatch) => bracketMatch.match.id === sourceMatch.id);
      if (!winner || !source) {
        return slot;
      }

      return source.homeTeam === winner ? source.awayTeam : source.homeTeam;
    }

    return slot;
  }

  private removeInvalidDownstreamSelections(selections: Record<string, string>): Record<string, string> {
    const next = { ...selections };

    for (const match of this.knockoutMatches()) {
      const bracketMatch = this.bracketMatches(match.stage).find((item) => item.match.id === match.id);
      const selected = next[match.id];

      if (selected && bracketMatch && selected !== bracketMatch.homeTeam && selected !== bracketMatch.awayTeam) {
        delete next[match.id];
      }
    }

    return next;
  }

  private matchById(matchId: string): Match | undefined {
    return this.allMatches().find((match) => match.id === matchId);
  }

  private hydrateKnockoutSelections(pickems: Pickem[]): void {
    const knockoutMatchIds = new Set(this.knockoutMatches().map((match) => match.id));
    const selections: Record<string, string> = {};
    const lockedIds: string[] = [];

    for (const pickem of pickems) {
      if (!knockoutMatchIds.has(pickem.match_id)) {
        continue;
      }

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
}
