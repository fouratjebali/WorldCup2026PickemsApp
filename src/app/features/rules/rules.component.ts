import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-rules',
  imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-5xl space-y-6">
      <div>
        <p class="text-sm font-black uppercase tracking-[0.18em] text-emerald-300">Rules</p>
        <h1 class="mt-2 text-4xl font-black text-white">Simple scoring for quick competition</h1>
        <p class="mt-3 max-w-2xl leading-7 text-slate-300">
          Pick the winner of each match. Correct picks are worth more points as the World Cup gets closer to the trophy.
        </p>
      </div>

      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (rule of scoringRules; track rule.title) {
          <div class="page-card">
            <p class="text-3xl font-black text-emerald-300">{{ rule.points }}</p>
            <h2 class="mt-2 text-xl font-black text-white">{{ rule.title }}</h2>
            <p class="mt-2 leading-6 text-slate-300">{{ rule.description }}</p>
          </div>
        }
      </div>

      <a routerLink="/pickems" class="btn-primary">Make picks</a>
    </section>
  `,
})
export class RulesComponent {
  readonly scoringRules = [
    { points: '+1', title: 'Group stage', description: 'Every correct group match winner is worth 1 point.' },
    { points: '+2', title: 'Round of 32', description: 'Every correct Round of 32 winner is worth 2 points.' },
    { points: '+3', title: 'Round of 16', description: 'Every correct Round of 16 winner is worth 3 points.' },
    { points: '+5', title: 'Quarter-finals', description: 'Every correct quarter-final winner is worth 5 points.' },
    { points: '+8', title: 'Semi-finals', description: 'Every correct semi-final winner is worth 8 points.' },
    { points: '+10', title: 'Third place', description: 'The correct third-place match winner is worth 10 points.' },
    { points: '+15', title: 'Final', description: 'The correct final winner is worth 15 points.' },
  ];
}
