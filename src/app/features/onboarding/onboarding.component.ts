import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PlayerService } from '../../core/services/player.service';

const COUNTRY_CODES = [
  'AF',
  'AX',
  'AL',
  'DZ',
  'AS',
  'AD',
  'AO',
  'AI',
  'AQ',
  'AG',
  'AR',
  'AM',
  'AW',
  'AU',
  'AT',
  'AZ',
  'BS',
  'BH',
  'BD',
  'BB',
  'BY',
  'BE',
  'BZ',
  'BJ',
  'BM',
  'BT',
  'BO',
  'BQ',
  'BA',
  'BW',
  'BV',
  'BR',
  'IO',
  'BN',
  'BG',
  'BF',
  'BI',
  'KH',
  'CM',
  'CA',
  'CV',
  'KY',
  'CF',
  'TD',
  'CL',
  'CN',
  'CX',
  'CC',
  'CO',
  'KM',
  'CG',
  'CD',
  'CK',
  'CR',
  'CI',
  'HR',
  'CU',
  'CW',
  'CY',
  'CZ',
  'DK',
  'DJ',
  'DM',
  'DO',
  'EC',
  'EG',
  'SV',
  'GQ',
  'ER',
  'EE',
  'SZ',
  'ET',
  'FK',
  'FO',
  'FJ',
  'FI',
  'FR',
  'GF',
  'PF',
  'TF',
  'GA',
  'GM',
  'GE',
  'DE',
  'GH',
  'GI',
  'GR',
  'GL',
  'GD',
  'GP',
  'GU',
  'GT',
  'GG',
  'GN',
  'GW',
  'GY',
  'HT',
  'HM',
  'VA',
  'HN',
  'HK',
  'HU',
  'IS',
  'IN',
  'ID',
  'IR',
  'IQ',
  'IE',
  'IM',
  'IL',
  'IT',
  'JM',
  'JP',
  'JE',
  'JO',
  'KZ',
  'KE',
  'KI',
  'KP',
  'KR',
  'KW',
  'KG',
  'LA',
  'LV',
  'LB',
  'LS',
  'LR',
  'LY',
  'LI',
  'LT',
  'LU',
  'MO',
  'MG',
  'MW',
  'MY',
  'MV',
  'ML',
  'MT',
  'MH',
  'MQ',
  'MR',
  'MU',
  'YT',
  'MX',
  'FM',
  'MD',
  'MC',
  'MN',
  'ME',
  'MS',
  'MA',
  'MZ',
  'MM',
  'NA',
  'NR',
  'NP',
  'NL',
  'NC',
  'NZ',
  'NI',
  'NE',
  'NG',
  'NU',
  'NF',
  'MK',
  'MP',
  'NO',
  'OM',
  'PK',
  'PW',
  'PS',
  'PA',
  'PG',
  'PY',
  'PE',
  'PH',
  'PN',
  'PL',
  'PT',
  'PR',
  'QA',
  'RE',
  'RO',
  'RU',
  'RW',
  'BL',
  'SH',
  'KN',
  'LC',
  'MF',
  'PM',
  'VC',
  'WS',
  'SM',
  'ST',
  'SA',
  'SN',
  'RS',
  'SC',
  'SL',
  'SG',
  'SX',
  'SK',
  'SI',
  'SB',
  'SO',
  'ZA',
  'GS',
  'SS',
  'ES',
  'LK',
  'SD',
  'SR',
  'SJ',
  'SE',
  'CH',
  'SY',
  'TW',
  'TJ',
  'TZ',
  'TH',
  'TL',
  'TG',
  'TK',
  'TO',
  'TT',
  'TN',
  'TR',
  'TM',
  'TC',
  'TV',
  'UG',
  'UA',
  'AE',
  'GB',
  'US',
  'UM',
  'UY',
  'UZ',
  'VU',
  'VE',
  'VN',
  'VG',
  'VI',
  'WF',
  'EH',
  'YE',
  'ZM',
  'ZW',
];

function buildCountryList(): string[] {
  const displayNames = new Intl.DisplayNames(['en'], { type: 'region' });
  const countries = COUNTRY_CODES.map((code) => displayNames.of(code)).filter((country): country is string => Boolean(country));

  return [...new Set([...countries, 'England', 'Scotland', 'Wales', 'Northern Ireland', 'Other'])].sort((a, b) =>
    a.localeCompare(b),
  );
}

@Component({
  selector: 'app-onboarding',
  imports: [ReactiveFormsModule],
  template: `
    <section class="mx-auto max-w-2xl space-y-6">
      <div>
        <p class="text-sm font-black uppercase tracking-[0.18em] text-emerald-300">Player profile</p>
        <h1 class="mt-2 text-3xl font-black text-white sm:text-5xl">Choose your pickems identity</h1>
        <p class="mt-3 leading-7 text-slate-300">
          Your profile is saved on this browser, so you can come back later from the same device and continue your picks.
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
  readonly countries = buildCountryList();

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
      this.error.set('We could not load your profile. You can still save your details again.');
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
      this.error.set('We could not save your profile. Please check your details and try again.');
    } finally {
      this.saving.set(false);
    }
  }
}
