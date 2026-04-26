import { Component, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GroupStandingPick } from '../../core/models/group-standing-pick.model';
import { Match } from '../../core/models/match.model';
import { Pickem } from '../../core/models/pickem.model';
import { Player } from '../../core/models/player.model';
import { Room, RoomMember } from '../../core/models/room.model';
import { MatchService } from '../../core/services/match.service';
import { PickemsService } from '../../core/services/pickems.service';
import { PlayerService } from '../../core/services/player.service';
import { RoomService } from '../../core/services/room.service';

@Component({
  selector: 'app-member-pickems',
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
        @if (!pickems().length) {
          <div class="page-card text-slate-300">This member has not saved any room pickems yet.</div>
        }

        <div class="space-y-4">
          <div>
            <p class="text-sm font-black uppercase tracking-[0.18em] text-emerald-300">Group stage</p>
            <h2 class="mt-2 text-3xl font-black text-white">Saved group picks</h2>
          </div>

          @for (group of groups(); track group) {
            <article class="page-card">
              <div class="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <h3 class="text-2xl font-black text-white">{{ group }}</h3>
                  <p class="mt-1 text-sm text-slate-400">{{ selectedCount(matchesForGroup(group)) }} / {{ matchesForGroup(group).length }} matches picked</p>
                </div>
              </div>

              <div class="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                <div class="space-y-3">
                  @for (match of matchesForGroup(group); track match.id) {
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
                  <h4 class="font-black text-white">Saved standing</h4>
                  @if (!standingsForGroup(group).length) {
                    <p class="mt-3 text-sm text-slate-400">No standing saved for this group yet.</p>
                  } @else {
                    <div class="mt-3 space-y-2">
                      @for (standing of standingsForGroup(group); track standing.team) {
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

        <div class="space-y-4">
          <div>
            <p class="text-sm font-black uppercase tracking-[0.18em] text-emerald-300">Knockout</p>
            <h2 class="mt-2 text-3xl font-black text-white">Saved bracket picks</h2>
          </div>

          @for (stage of knockoutStages; track stage) {
            <article class="page-card">
              <div class="mb-4 flex items-center justify-between gap-3">
                <h3 class="text-2xl font-black text-white">{{ stage }}</h3>
                <span class="rounded-md bg-white/10 px-3 py-1 text-xs font-black text-slate-300">
                  {{ selectedCount(matchesForStage(stage)) }} / {{ matchesForStage(stage).length }}
                </span>
              </div>

              <div class="grid gap-3 md:grid-cols-2">
                @for (match of matchesForStage(stage); track match.id) {
                  <div class="rounded-lg border border-white/10 bg-slate-950/60 p-3">
                    <div class="mb-2 flex items-center justify-between text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                      <span>Match {{ match.match_number }}</span>
                      <span>{{ selectedWinner(match.id) ? 'Picked' : 'No pick' }}</span>
                    </div>
                    <p class="text-sm text-slate-300">{{ match.home_team }} vs {{ match.away_team }}</p>
                    <p class="mt-2 text-lg font-black text-emerald-200">{{ selectedWinner(match.id) || 'No winner selected' }}</p>
                  </div>
                }
              </div>
            </article>
          }
        </div>
      }
    </section>
  `,
})
export class MemberPickemsComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal('');
  readonly room = signal<Room | null>(null);
  readonly targetPlayer = signal<Player | null>(null);
  readonly matches = signal<Match[]>([]);
  readonly pickems = signal<Pickem[]>([]);
  readonly standings = signal<GroupStandingPick[]>([]);
  readonly knockoutStages = ['Round of 32', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Third-place match', 'Final'];
  readonly groups = computed(() =>
    [...new Set(this.matches().filter((match) => match.stage === 'Group stage' && match.group_name).map((match) => match.group_name!))].sort(),
  );

  constructor(
    private readonly matchService: MatchService,
    private readonly pickemsService: PickemsService,
    private readonly playerService: PlayerService,
    private readonly roomService: RoomService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    const roomId = this.route.snapshot.paramMap.get('roomId');
    const playerId = this.route.snapshot.paramMap.get('playerId');

    if (!roomId || !playerId) {
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
        this.roomService.getRoom(roomId),
        this.roomService.listRoomMembers(roomId),
      ]);

      if (!room) {
        throw new Error('Room not found.');
      }

      const currentMember = members.find((member) => member.player_id === currentPlayer.id);
      const targetMember = members.find((member) => member.player_id === playerId);

      if (!currentMember) {
        throw new Error('Join this room before viewing member pickems.');
      }

      if (!targetMember) {
        throw new Error('This player is not a member of the room.');
      }

      const [matches, pickems, standings] = await Promise.all([
        this.matchService.listMatches(),
        this.pickemsService.listPlayerPickems(playerId, roomId),
        this.pickemsService.listPlayerGroupStandings(playerId, roomId),
      ]);

      this.room.set(room);
      this.targetPlayer.set(targetMember.player ?? null);
      this.matches.set(matches);
      this.pickems.set(pickems);
      this.standings.set(standings);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Could not load member pickems.');
    } finally {
      this.loading.set(false);
    }
  }

  matchesForGroup(group: string): Match[] {
    return this.matches().filter((match) => match.group_name === group).sort((a, b) => a.match_number - b.match_number);
  }

  matchesForStage(stage: string): Match[] {
    return this.matches().filter((match) => match.stage === stage).sort((a, b) => a.match_number - b.match_number);
  }

  standingsForGroup(group: string): GroupStandingPick[] {
    return this.standings()
      .filter((standing) => standing.group_name === group)
      .sort((a, b) => a.rank - b.rank);
  }

  selectedWinner(matchId: string): string {
    return this.pickems().find((pickem) => pickem.match_id === matchId)?.predicted_winner_team ?? '';
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
}
