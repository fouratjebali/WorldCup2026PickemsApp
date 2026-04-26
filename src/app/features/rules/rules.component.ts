import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-rules',
  imports: [RouterLink],
  template: `
    <section class="mx-auto max-w-3xl space-y-6">
      <div>
        <p class="text-sm font-black uppercase tracking-[0.18em] text-emerald-300">Rules</p>
        <h1 class="mt-2 text-4xl font-black text-white">Simple scoring for quick competition</h1>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        @for (rule of rules; track rule.title) {
          <div class="page-card">
            <p class="text-3xl font-black text-emerald-300">{{ rule.points }}</p>
            <h2 class="mt-2 text-xl font-black text-white">{{ rule.title }}</h2>
            <p class="mt-2 leading-6 text-slate-300">{{ rule.description }}</p>
          </div>
        }
      </div>

      <div class="page-card border-amber-300/30 bg-amber-300/10">
        <h2 class="text-xl font-black text-amber-100">Saved picks are locked</h2>
        <p class="mt-2 leading-7 text-amber-50/80">
          Picks are winner-only in this version. Once a group or bracket is saved, those picks are locked and cannot be
          edited from the app.
        </p>
      </div>

      <a routerLink="/pickems" class="btn-primary">Make picks</a>
    </section>
  `,
})
export class RulesComponent {
  readonly rules = [
    { points: '+3', title: 'Correct winner', description: 'You picked the team that actually wins the match.' },
    { points: '0', title: 'Wrong winner', description: 'Your selected team did not win the match.' },
    { points: 'Lock', title: 'Saved groups', description: 'A group becomes read-only once every match in it is saved.' },
    { points: 'Lock', title: 'Saved bracket', description: 'The bracket becomes read-only after you save the champion path.' },
  ];
}
