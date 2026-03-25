import { Component, inject, signal, computed } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @if (authService.isAuthenticated()) {
      <div class="app-layout">
        <!-- Overlay para móvil -->
        @if (sidebarOpen()) {
          <div class="overlay" (click)="closeSidebar()"></div>
        }
        
        <nav class="sidebar" [class.open]="sidebarOpen()">
          <div class="sidebar-header">
            <h2>App Alameda</h2>
          </div>
          <ul class="nav-list">
            <li>
              <a routerLink="/dashboard" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <span class="icon">📊</span>
                Dashboard
              </a>
            </li>
            <li>
              <a routerLink="/casas" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <span class="icon">🏠</span>
                Casas
              </a>
            </li>
            <li>
              <a routerLink="/visitas" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <span class="icon">📅</span>
                Visitas
              </a>
            </li>
            <li>
              <a routerLink="/notificaciones" routerLinkActive="active" (click)="closeSidebarOnMobile()">
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
              <a routerLink="/grupos" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <span class="icon">👥</span>
                Grupos
              </a>
            </li>
            <li>
              <a routerLink="/territorios" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <span class="icon">📁</span>
                Territorios
              </a>
            </li>
            <li>
              <a routerLink="/semanas" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <span class="icon">📅</span>
                Semanas
              </a>
            </li>
            <!-- Fase 3: Asignaciones Internas -->
            <li class="nav-section">
              <span class="section-label">Asignaciones</span>
            </li>
            <li>
              <a routerLink="/asignaciones" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <span class="icon">📋</span>
                Asignaciones
              </a>
            </li>
            <!-- Backoffice - Solo SUPER_ADMIN -->
            @if (authService.isSuperAdmin()) {
              <li class="nav-section">
                <span class="section-label">Administración</span>
              </li>
              <li>
                <a routerLink="/usuarios" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                  <span class="icon">👤</span>
                  Usuarios
                </a>
              </li>
            }
          </ul>
          <div class="sidebar-footer">
            <div class="user-info">
              <span class="user-name">{{ authService.currentUser()?.nombre }}</span>
              <span class="user-role">{{ authService.currentUser()?.rol }}</span>
            </div>
            <button class="theme-toggle" (click)="themeService.toggle()" [attr.aria-label]="themeService.isDark() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'">
              <span class="theme-icon">{{ themeService.isDark() ? '☀️' : '🌙' }}</span>
              <span class="theme-label">{{ themeService.isDark() ? 'Modo Claro' : 'Modo Oscuro' }}</span>
            </button>
            <button class="btn-logout" (click)="logout()">
              Cerrar Sesión
            </button>
          </div>
        </nav>
        <main class="main-content">
          <header class="mobile-header">
            <button class="hamburger-btn" (click)="toggleSidebar()" aria-label="Menú">
              <span class="hamburger-icon" [class.open]="sidebarOpen()">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
            <span class="mobile-title">App Alameda</span>
          </header>
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

    /* Overlay para móvil */
    .overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 40;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .sidebar {
      width: 260px;
      background: var(--surface-color);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 0;
      left: 0;
      height: 100vh;
      z-index: 50;
      transition: transform 0.3s ease;
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
        cursor: pointer;

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
        margin-top: 0.5rem;
        
        &:hover {
          background: var(--background-color);
          color: var(--danger-color);
          border-color: var(--danger-color);
        }
      }

      .theme-toggle {
        width: 100%;
        padding: 0.5rem;
        background: transparent;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.15s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        
        .theme-icon {
          font-size: 1.125rem;
        }
        
        .theme-label {
          font-size: 0.875rem;
        }
        
        &:hover {
          background: var(--background-color);
          border-color: var(--primary-color);
          color: var(--primary-color);
        }
      }
    }

    .main-content {
      flex: 1;
      padding: 2rem;
      overflow-y: auto;
      margin-left: 260px;
      transition: margin-left 0.3s ease;
    }

    /* Header móvil */
    .mobile-header {
      display: none;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
    }

    .hamburger-btn {
      background: none;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .hamburger-icon {
      display: flex;
      flex-direction: column;
      gap: 5px;
      width: 24px;
      
      span {
        display: block;
        width: 100%;
        height: 2px;
        background: var(--text-primary);
        border-radius: 2px;
        transition: all 0.3s ease;
      }

      &.open {
        span:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }
        span:nth-child(2) {
          opacity: 0;
        }
        span:nth-child(3) {
          transform: rotate(-45deg) translate(5px, -5px);
        }
      }
    }

    .mobile-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--primary-color);
    }

    /* Responsive - Tablet y móvil */
    @media (max-width: 768px) {
      .overlay {
        display: block;
      }

      .sidebar {
        transform: translateX(-100%);
      }

      .sidebar.open {
        transform: translateX(0);
      }

      .main-content {
        margin-left: 0;
        padding: 1rem;
      }

      .mobile-header {
        display: flex;
      }
    }
  `]
})
export class AppComponent {
  authService = inject(AuthService);
  notificationService = inject(NotificationService);
  themeService = inject(ThemeService);
  private router = inject(Router);
  
  sidebarOpen = signal(false);

  constructor() {
    if (this.authService.isAuthenticated()) {
      this.notificationService.loadNotifications();
    }
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }

  closeSidebarOnMobile() {
    // Cerrar sidebar al hacer click en móvil
    if (window.innerWidth <= 768) {
      this.sidebarOpen.set(false);
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
