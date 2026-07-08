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
    path: 'recovery',
    loadComponent: () => import('./features/auth/recovery/recovery.component').then(m => m.RecoveryComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'perfil',
    loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent),
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
    loadComponent: () => import('./features/notifications/notification-dashboard/notification-dashboard.component').then(m => m.NotificationDashboardComponent),
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
  // ====== D├¡a Predicaci├│n (antes Semanas) ======
  {
    path: 'dia-predicacion',
    loadComponent: () => import('./features/programa-predicacion/programa-predicacion-list.component').then(m => m.ProgramaPredicacionListComponent),
    canActivate: [authGuard]
  },
  // ====== Predicaci├│n Visita ======
  {
    path: 'predicacion-visita',
    loadComponent: () => import('./features/programa-visita/programa-visita-list.component').then(m => m.ProgramaVisitaListComponent),
    canActivate: [authGuard]
  },
  // Las siguientes rutas /semanas/:id son usadas por otros m├│dulos (asignaciones)
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
    path: 'asignaciones/semana/:id',
    loadComponent: () => import('./features/asignaciones/semana-editar.component').then(m => m.SemanaEditarComponent),
    canActivate: [authGuard]
  },
  // ====== Backoffice: Gesti├│n de Usuarios ======
  {
    path: 'usuarios',
    loadComponent: () => import('./features/admin/usuarios/usuarios-list.component').then(m => m.UsuariosListComponent),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
