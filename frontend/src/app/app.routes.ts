import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'casas',
    loadComponent: () => import('./features/casas/casa-list/casa-list.component').then(m => m.CasaListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'casas/new',
    loadComponent: () => import('./features/casas/casa-form/casa-form.component').then(m => m.CasaFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'casas/:id',
    loadComponent: () => import('./features/casas/casa-detail/casa-detail.component').then(m => m.CasaDetailComponent),
    canActivate: [authGuard]
  },
  {
    path: 'casas/:id/edit',
    loadComponent: () => import('./features/casas/casa-form/casa-form.component').then(m => m.CasaFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'visitas',
    loadComponent: () => import('./features/visitas/visita-list/visita-list.component').then(m => m.VisitaListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'notificaciones',
    loadComponent: () => import('./features/notifications/notification-list/notification-list.component').then(m => m.NotificationListComponent),
    canActivate: [authGuard]
  },
  // ====== FASE 2: Grupos, Territorios, Semanas ======
  {
    path: 'grupos',
    loadComponent: () => import('./features/grupos/grupo-list.component').then(m => m.GrupoListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'grupos/:id',
    loadComponent: () => import('./features/grupos/grupo-detail.component').then(m => m.GrupoDetailComponent),
    canActivate: [authGuard]
  },
  {
    path: 'territorios',
    loadComponent: () => import('./features/territorios/territorio-list.component').then(m => m.TerritorioListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'semanas',
    loadComponent: () => import('./features/semanas/semana-list.component').then(m => m.SemanaListComponent),
    canActivate: [authGuard]
  },
  {
    path: 'semanas/:id',
    loadComponent: () => import('./features/semanas/semana-detail.component').then(m => m.SemanaDetailComponent),
    canActivate: [authGuard]
  },
  // ====== FASE 3: Asignaciones Internas ======
  {
    path: 'asignaciones',
    loadComponent: () => import('./features/asignaciones/asignacion-list.component').then(m => m.AsignacionListComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
