import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Player } from '../../core/models/player.model';
import { Room } from '../../core/models/room.model';
import { PickemsService } from '../../core/services/pickems.service';
import { PlayerService } from '../../core/services/player.service';
import { RoomService } from '../../core/services/room.service';

@Component({
  selector: 'app-rooms',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="space-y-6">
      <div>
        <p class="text-sm font-black uppercase tracking-[0.18em] text-emerald-300">Rooms</p>
        <h1 class="mt-2 text-4xl font-black text-white">Create a league for friends</h1>
        <p class="mt-3 max-w-2xl leading-7 text-slate-300">
          Each room gets a short code. Share it with friends so everyone can compete on the same leaderboard.
        </p>
      </div>

      @if (error()) {
        <div class="page-card border-red-300/30 bg-red-400/10 text-red-100">{{ error() }}</div>
      }

      @if (pendingRoom()) {
        <div class="page-card border-emerald-300/30 bg-emerald-400/10">
          <p class="text-sm font-black uppercase tracking-[0.16em] text-emerald-200">Room ready</p>
          <h2 class="mt-2 text-2xl font-black text-white">{{ pendingRoom()?.name }}</h2>
          <p class="mt-2 leading-7 text-slate-200">
            You already have global pickems. Copy them into this room, or start a fresh room-only bracket.
          </p>
          <div class="mt-4 flex flex-wrap gap-3">
            <button class="btn-primary" type="button" [disabled]="busy()" (click)="copyGlobalToRoom()">
              {{ busy() ? 'Copying...' : 'Copy my pickems' }}
            </button>
            <button class="btn-secondary" type="button" [disabled]="busy()" (click)="startFreshRoomPickems()">
              Start fresh
            </button>
          </div>
        </div>
      }

      <div class="grid gap-4 lg:grid-cols-2">
        <form class="page-card space-y-4" (ngSubmit)="createRoom()">
          <h2 class="text-2xl font-black">Create room</h2>
          <label class="block space-y-2">
            <span class="label">Room name</span>
            <input class="field" maxlength="48" [(ngModel)]="roomName" name="roomName" placeholder="Office bracket" />
          </label>
          <button class="btn-primary" type="submit" [disabled]="busy()">{{ busy() ? 'Working...' : 'Create room' }}</button>
        </form>

        <form class="page-card space-y-4" (ngSubmit)="joinRoom()">
          <h2 class="text-2xl font-black">Join room</h2>
          <label class="block space-y-2">
            <span class="label">Room code</span>
            <input class="field uppercase" maxlength="8" [(ngModel)]="roomCode" name="roomCode" placeholder="ABC123" />
          </label>
          <button class="btn-secondary" type="submit" [disabled]="busy()">{{ busy() ? 'Working...' : 'Join room' }}</button>
        </form>
      </div>

      <div class="space-y-3">
        <h2 class="text-2xl font-black">Your rooms</h2>
        @if (loading()) {
          <div class="page-card">Loading rooms...</div>
        } @else if (!rooms().length) {
          <div class="page-card text-slate-300">No rooms joined yet.</div>
        } @else {
          <div class="grid gap-3 md:grid-cols-2">
            @for (room of rooms(); track room.id) {
              <article class="page-card">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-xl font-black">{{ room.name }}</p>
                    <p class="mt-1 font-mono text-sm text-emerald-200">{{ room.code }}</p>
                  </div>
                  <div class="flex flex-col items-end gap-2">
                    <span class="rounded-md bg-white/10 px-2 py-1 text-xs font-black">Private</span>
                    @if (isRoomCreator(room)) {
                      <span class="rounded-md bg-emerald-400/15 px-2 py-1 text-xs font-black text-emerald-200">Creator</span>
                    }
                  </div>
                </div>
                <div class="mt-4 flex flex-wrap gap-2">
                  <a class="btn-primary" [routerLink]="['/pickems']" [queryParams]="{ roomId: room.id }">Room picks</a>
                  <a class="btn-secondary" [routerLink]="['/bracket']" [queryParams]="{ roomId: room.id }">Bracket</a>
                  <a class="btn-secondary" [routerLink]="['/leaderboard']" [queryParams]="{ roomId: room.id }">Leaderboard</a>
                  <a class="btn-secondary" [routerLink]="['/rooms', room.id, 'members']">Members</a>
                  @if (isRoomCreator(room)) {
                    <button
                      class="inline-flex items-center justify-center rounded-md border border-red-300/30 bg-red-400/10 px-4 py-2 font-bold text-red-100 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                      type="button"
                      [disabled]="busy()"
                      (click)="deleteRoom(room)"
                    >
                      Delete
                    </button>
                  }
                </div>
              </article>
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class RoomsComponent implements OnInit {
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly rooms = signal<Room[]>([]);
  readonly pendingRoom = signal<Room | null>(null);
  roomName = '';
  roomCode = '';
  private player: Player | null = null;

  constructor(
    private readonly playerService: PlayerService,
    private readonly roomService: RoomService,
    private readonly pickemsService: PickemsService,
    private readonly router: Router,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.player = await this.playerService.loadStoredPlayer();
      if (!this.player) {
        await this.router.navigate(['/onboarding'], { queryParams: { returnUrl: '/rooms' } });
        return;
      }

      await this.reloadRooms();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Could not load rooms.');
    } finally {
      this.loading.set(false);
    }
  }

  async createRoom(): Promise<void> {
    if (!this.player || this.busy()) {
      return;
    }

    await this.runRoomAction(async () => {
      const room = await this.roomService.createRoom(this.roomName, this.player!.id);
      this.roomName = '';
      await this.handleJoinedRoom(room);
    });
  }

  async joinRoom(): Promise<void> {
    if (!this.player || this.busy()) {
      return;
    }

    await this.runRoomAction(async () => {
      const room = await this.roomService.joinRoom(this.roomCode, this.player!.id);
      this.roomCode = '';
      await this.handleJoinedRoom(room);
    });
  }

  async copyGlobalToRoom(): Promise<void> {
    const room = this.pendingRoom();
    if (!this.player || !room || this.busy()) {
      return;
    }

    this.busy.set(true);
    this.error.set('');

    try {
      await this.pickemsService.copyGlobalPickemsToRoom(this.player.id, room.id);
      this.pendingRoom.set(null);
      await this.router.navigate(['/pickems'], { queryParams: { roomId: room.id } });
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Could not copy your pickems. Please retry.');
    } finally {
      this.busy.set(false);
    }
  }

  async startFreshRoomPickems(): Promise<void> {
    const room = this.pendingRoom();
    if (!room) {
      return;
    }

    this.pendingRoom.set(null);
    await this.router.navigate(['/pickems'], { queryParams: { roomId: room.id } });
  }

  async deleteRoom(room: Room): Promise<void> {
    if (!this.player || this.busy() || !this.isRoomCreator(room)) {
      return;
    }

    const confirmed = window.confirm(`Delete "${room.name}"? This removes the room for every member and cannot be undone.`);
    if (!confirmed) {
      return;
    }

    await this.runRoomAction(async () => {
      await this.roomService.deleteRoom(room.id, this.player!.id);

      if (this.pendingRoom()?.id === room.id) {
        this.pendingRoom.set(null);
      }
    });
  }

  isRoomCreator(room: Room): boolean {
    return this.player?.id === room.created_by_player_id;
  }

  private async runRoomAction(action: () => Promise<void>): Promise<void> {
    this.busy.set(true);
    this.error.set('');

    try {
      await action();
      await this.reloadRooms();
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Room action failed. Please retry.');
    } finally {
      this.busy.set(false);
    }
  }

  private async reloadRooms(): Promise<void> {
    if (this.player) {
      this.rooms.set(await this.roomService.listPlayerRooms(this.player.id));
    }
  }

  private async handleJoinedRoom(room: Room): Promise<void> {
    if (!this.player) {
      return;
    }

    const [hasGlobalPickems, hasRoomPickems] = await Promise.all([
      this.pickemsService.hasGlobalPickems(this.player.id),
      this.pickemsService.hasRoomPickems(this.player.id, room.id),
    ]);

    if (hasRoomPickems) {
      await this.router.navigate(['/pickems'], { queryParams: { roomId: room.id } });
      return;
    }

    if (hasGlobalPickems) {
      this.pendingRoom.set(room);
      return;
    }

    await this.router.navigate(['/pickems'], { queryParams: { roomId: room.id } });
  }
}
