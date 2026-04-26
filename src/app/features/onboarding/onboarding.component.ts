import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PlayerService } from '../../core/services/player.service';

@Component({
  selector: 'app-onboarding',
  imports: [ReactiveFormsModule],
  template: `
    <section class="mx-auto max-w-2xl space-y-6">
      <div>
        <p class="text-sm font-black uppercase tracking-[0.18em] text-emerald-300">Player profile</p>
        <h1 class="mt-2 text-3xl font-black text-white sm:text-5xl">Choose your pickems identity</h1>
        <p class="mt-3 leading-7 text-slate-300">
          This profile is tied to a random token stored in this browser. There is no account recovery without real
          authentication.
        </p>
      </div>

      <form class="page-card space-y-5" [formGroup]="form" (ngSubmit)="save()">
        <label class="block space-y-2">
          <span class="label">Nickname</span>
          <input class="field" maxlength="30" formControlName="nickname" placeholder="Fouratinho" />
          <span class="text-xs text-slate-500">2-30 characters.</span>
        </label>

        <label class="block space-y-2">
          <span class="label">Nationality</span>
          <select class="field" formControlName="nationality">
            <option value="">Choose a country</option>
            @for (country of countries; track country) {
              <option [value]="country">{{ country }}</option>
            }
          </select>
        </label>

        @if (error()) {
          <p class="rounded-md border border-red-300/30 bg-red-400/10 p-3 text-sm text-red-100">{{ error() }}</p>
        }

        <button class="btn-primary w-full sm:w-auto" type="submit" [disabled]="form.invalid || saving()">
          {{ saving() ? 'Saving...' : 'Save profile' }}
        </button>
      </form>
    </section>
  `,
})
export class OnboardingComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly countries = [
    'United States',
    'Canada',
    'Mexico',
    'Morocco',
    'France',
    'Argentina',
    'Brazil',
    'England',
    'Spain',
    'Germany',
    'Japan',
    'Other',
  ];

  readonly form = this.fb.nonNullable.group({
    nickname: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(30)]],
    nationality: ['', Validators.required],
  });

  constructor(
    private readonly playerService: PlayerService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const player = await this.playerService.loadStoredPlayer();
      if (player) {
        this.form.patchValue({ nickname: player.nickname, nationality: player.nationality });
      }
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Could not load stored profile.');
    }
  }

  async save(): Promise<void> {
    if (this.form.invalid || this.saving()) {
      return;
    }

    this.saving.set(true);
    this.error.set('');

    try {
      await this.playerService.saveProfile(this.form.controls.nickname.value, this.form.controls.nationality.value);
      await this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('returnUrl') || '/pickems');
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Could not save profile. Please retry.');
    } finally {
      this.saving.set(false);
    }
  }
}
