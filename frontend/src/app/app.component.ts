import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @if (authService.isAuthenticated()) {
      <div class="app-layout">
        <nav class="sidebar">
          <div class="sidebar-header">
            <h2>App Alameda</h2>
          </div>
          <ul class="nav-list">
            <li>
              <a routerLink="/dashboard" routerLinkActive="active">
                <span class="icon">📊</span>
                Dashboard
              </a>
            </li>
            <li>
              <a routerLink="/casas" routerLinkActive="active">
                <span class="icon">🏠</span>
                Casas
              </a>
            </li>
            <li>
              <a routerLink="/visitas" routerLinkActive="active">
                <span class="icon">📅</span>
                Visitas
              </a>
            </li>
            <li>
              <a routerLink="/notificaciones" routerLinkActive="active">
                <span class="icon">🔔</span>
                Notificaciones
                @if (notificationService.unreadCount() > 0) {
                  <span class="badge">{{ notificationService.unreadCount() }}</span>
                }
              </a>
            </li>
            <!-- Fase 2: Visita Superintendente -->
            <li class="nav-section">
              <span class="section-label">Visita Superintendente</span>
            </li>
            <li>
              <a routerLink="/grupos" routerLinkActive="active">
                <span class="icon">👥</span>
                Grupos
              </a>
            </li>
            <li>
              <a routerLink="/territorios" routerLinkActive="active">
                <span class="icon">📁</span>
                Territorios
              </a>
            </li>
            <li>
              <a routerLink="/semanas" routerLinkActive="active">
                <span class="icon">📅</span>
                Semanas
              </a>
            </li>
            <!-- Fase 3: Asignaciones Internas -->
            <li class="nav-section">
              <span class="section-label">Asignaciones</span>
            </li>
            <li>
              <a routerLink="/asignaciones" routerLinkActive="active">
                <span class="icon">📋</span>
                Asignaciones
              </a>
            </li>
          </ul>
          <div class="sidebar-footer">
            <div class="user-info">
              <span class="user-name">{{ authService.currentUser()?.nombre }}</span>
              <span class="user-role">{{ authService.currentUser()?.rol }}</span>
            </div>
            <button class="btn-logout" (click)="logout()">
              Cerrar Sesión
            </button>
          </div>
        </nav>
        <main class="main-content">
          <router-outlet />
        </main>
      </div>
    } @else {
      <router-outlet />
    }
  `,
  styles: [`
    .app-layout {
      display: flex;
      min-height: 100vh;
    }

    .sidebar {
      width: 260px;
      background: var(--surface-color);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
    }

    .sidebar-header {
      padding: 1.5rem;
      border-bottom: 1px solid var(--border-color);
      
      h2 {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--primary-color);
      }
    }

    .nav-list {
      list-style: none;
      padding: 1rem 0;
      flex: 1;

      li {
        margin: 0.25rem 0;
      }

      a {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1.5rem;
        color: var(--text-secondary);
        text-decoration: none;
        font-weight: 500;
        transition: all 0.15s;

        .icon {
          font-size: 1.25rem;
        }

        .badge {
          margin-left: auto;
          background: var(--danger-color);
          color: white;
          font-size: 0.75rem;
          padding: 0.125rem 0.5rem;
          border-radius: 9999px;
        }

        &:hover {
          background: var(--background-color);
          color: var(--text-primary);
        }

        &.active {
          background: rgba(37, 99, 235, 0.1);
          color: var(--primary-color);
          border-right: 3px solid var(--primary-color);
        }
      }
    }
    
    .nav-section {
      padding: 1rem 1.5rem 0.5rem;
      
      .section-label {
        font-size: 0.625rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-secondary);
      }
    }

    .sidebar-footer {
      padding: 1.5rem;
      border-top: 1px solid var(--border-color);
      
      .user-info {
        margin-bottom: 1rem;
        
        .user-name {
          display: block;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .user-role {
          display: block;
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: uppercase;
        }
      }
      
      .btn-logout {
        width: 100%;
        padding: 0.5rem;
        background: transparent;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.15s;
        
        &:hover {
          background: var(--background-color);
          color: var(--danger-color);
          border-color: var(--danger-color);
        }
      }
    }

    .main-content {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
    }
  `]
})
export class AppComponent {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  private router = inject(Router);

  constructor() {
    if (this.authService.isAuthenticated()) {
      this.notificationService.loadNotifications();
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
