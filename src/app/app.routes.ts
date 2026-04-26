import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
    title: 'World Cup 2026 Pickems',
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./features/onboarding/onboarding.component').then((m) => m.OnboardingComponent),
    title: 'Choose Profile',
  },
  {
    path: 'pickems',
    loadComponent: () => import('./features/pickems/pickems.component').then((m) => m.PickemsComponent),
    title: 'My Pickems',
  },
  {
    path: 'rooms',
    loadComponent: () => import('./features/rooms/rooms.component').then((m) => m.RoomsComponent),
    title: 'Rooms',
  },
  {
    path: 'leaderboard',
    loadComponent: () => import('./features/leaderboard/leaderboard.component').then((m) => m.LeaderboardComponent),
    title: 'Leaderboard',
  },
  {
    path: 'rules',
    loadComponent: () => import('./features/rules/rules.component').then((m) => m.RulesComponent),
    title: 'Rules',
  },
  {
    path: 'admin-data',
    loadComponent: () => import('./features/admin-data/admin-data.component').then((m) => m.AdminDataComponent),
    title: 'Admin Data',
  },
  { path: '**', redirectTo: '' },
];
