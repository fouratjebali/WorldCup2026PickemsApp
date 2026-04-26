import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Player } from '../../core/models/player.model';
import { Room, RoomMember } from '../../core/models/room.model';
import { PlayerService } from '../../core/services/player.service';
import { RoomService } from '../../core/services/room.service';

@Component({
  selector: 'app-room-members',
  imports: [RouterLink],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p class="text-sm font-black uppercase tracking-[0.18em] text-emerald-300">Room members</p>
          <h1 class="mt-2 text-4xl font-black text-white">{{ room()?.name || 'Members' }}</h1>
          <p class="mt-3 max-w-2xl leading-7 text-slate-300">
            See everyone in this room and open their saved pickems in read-only mode.
          </p>
        </div>
        <a routerLink="/rooms" class="btn-secondary">Back to rooms</a>
      </div>

      @if (loading()) {
        <div class="page-card">Loading members...</div>
      } @else if (error()) {
        <div class="page-card border-red-300/30 bg-red-400/10 text-red-100">{{ error() }}</div>
      } @else {
        <div class="overflow-hidden rounded-lg border border-white/10 bg-white/[0.06]">
          <div class="grid grid-cols-[1fr_90px] gap-3 border-b border-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-400 sm:grid-cols-[1fr_170px_90px]">
            <span>Player</span>
            <span class="hidden sm:block">Joined</span>
            <span class="text-right">Pickems</span>
          </div>

          @if (!members().length) {
            <p class="p-4 text-slate-300">No members found.</p>
          } @else {
            @for (member of members(); track member.id) {
              <div class="grid grid-cols-[1fr_90px] items-center gap-3 border-b border-white/5 px-4 py-3 last:border-b-0 sm:grid-cols-[1fr_170px_90px]">
                <span class="min-w-0">
                  <span class="block truncate font-bold text-white">
                    {{ member.player?.nickname || 'Player' }}
                    @if (member.player_id === currentPlayer()?.id) {
                      <span class="ml-2 rounded-md bg-emerald-400/15 px-2 py-1 text-xs font-black text-emerald-200">You</span>
                    }
                  </span>
                  <span class="text-sm text-slate-400">{{ member.player?.nationality || 'Unknown nationality' }}</span>
                </span>

                <span class="hidden text-sm text-slate-400 sm:block">{{ joinedDate(member.joined_at) }}</span>

                <a
                  class="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/10 text-emerald-100 transition hover:border-emerald-300/60 hover:bg-emerald-400/15"
                  [routerLink]="['/rooms', room()?.id, 'members', member.player_id, 'pickems']"
                  [attr.aria-label]="'View picks for ' + (member.player?.nickname || 'player')"
                  title="View member pickems"
                >
                  <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </a>
              </div>
            }
          }
        </div>
      }
    </section>
  `,
})
export class RoomMembersComponent implements OnInit {
  readonly loading = signal(true);
  readonly error = signal('');
  readonly room = signal<Room | null>(null);
  readonly members = signal<RoomMember[]>([]);
  readonly currentPlayer = signal<Player | null>(null);

  constructor(
    private readonly playerService: PlayerService,
    private readonly roomService: RoomService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    const roomId = this.route.snapshot.paramMap.get('roomId');

    if (!roomId) {
      this.error.set('Missing room.');
      this.loading.set(false);
      return;
    }

    try {
      const player = await this.playerService.loadStoredPlayer();
      if (!player) {
        await this.router.navigate(['/onboarding'], { queryParams: { returnUrl: this.router.url } });
        return;
      }

      const [room, members] = await Promise.all([this.roomService.getRoom(roomId), this.roomService.listRoomMembers(roomId)]);

      if (!room) {
        throw new Error('Room not found.');
      }

      if (!members.some((member) => member.player_id === player.id)) {
        throw new Error('Join this room before viewing its members.');
      }

      this.currentPlayer.set(player);
      this.room.set(room);
      this.members.set(members);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'We could not load the room members. Please refresh and try again.');
    } finally {
      this.loading.set(false);
    }
  }

  joinedDate(value: string): string {
    return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
  }
}
