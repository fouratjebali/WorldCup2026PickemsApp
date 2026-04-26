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
        <h2 class="text-xl font-black text-amber-100">Picks lock when a match starts</h2>
        <p class="mt-2 leading-7 text-amber-50/80">
          Match data starts as placeholders. Update real fixtures and results in Supabase when official World Cup 2026
          information is ready.
        </p>
      </div>

      <a routerLink="/pickems" class="btn-primary">Make picks</a>
    </section>
  `,
})
export class RulesComponent {
  readonly rules = [
    { points: '+5', title: 'Exact score', description: 'You predicted both teams scores exactly.' },
    { points: '+3', title: 'Correct winner or draw', description: 'You got the outcome right, including a draw.' },
    { points: '+1', title: 'Goal-difference bonus', description: 'You got the exact goal difference on top of the outcome.' },
    { points: '0', title: 'Wrong prediction', description: 'The match outcome did not match your prediction.' },
  ];
}
