import { Component, inject, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @if (authService.isAuthenticated()) {
      <div class="app-layout">
        <!-- Overlay para m├│vil -->
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
                <re-icon icon="chart-square" size="18" weight="outline" class="icon"></re-icon>
                Dashboard
              </a>
            </li>
            <li>
              <a routerLink="/perfil" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <re-icon icon="user-circle" size="18" weight="outline" class="icon"></re-icon>
                Mi Perfil
              </a>
            </li>
            <li>
              <a routerLink="/casas" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <re-icon icon="home" size="18" weight="outline" class="icon"></re-icon>
                Casas
              </a>
            </li>
            <li>
              <a routerLink="/visitas" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <re-icon icon="calendar-12" size="18" weight="outline" class="icon"></re-icon>
                Visitas
              </a>
            </li>
            <li>
              <a routerLink="/notificaciones" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <re-icon icon="bell-ring" size="18" weight="outline" class="icon"></re-icon>
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
                <re-icon icon="crown-12" size="18" weight="outline" class="icon"></re-icon>
                Grupos
              </a>
            </li>
            <li>
              <a routerLink="/territorios" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <re-icon icon="folder-open" size="18" weight="outline" class="icon"></re-icon>
                Territorios
              </a>
            </li>
            <li>
              <a routerLink="/dia-predicacion" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <re-icon icon="calendar-12" size="18" weight="outline" class="icon"></re-icon>
                D├¡a Predicaci├│n
              </a>
            </li>
            <li>
              <a routerLink="/predicacion-visita" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <re-icon icon="smart-car2" size="18" weight="outline" class="icon"></re-icon>
                Predicaci├│n Visita
              </a>
            </li>
            <!-- Fase 3: Asignaciones Internas -->
            <li class="nav-section">
              <span class="section-label">Asignaciones</span>
            </li>
            <li>
              <a routerLink="/asignaciones" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <re-icon icon="setting-22" size="18" weight="outline" class="icon"></re-icon>
                Asignaciones
              </a>
            </li>
            <!-- Backoffice - Solo SUPER_ADMIN -->
            @if (authService.isSuperAdmin()) {
              <li class="nav-section">
                <span class="section-label">Administraci├│n</span>
              </li>
              <li>
                <a routerLink="/usuarios" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                  <re-icon icon="user-circle" size="18" weight="outline" class="icon"></re-icon>
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
              @if (themeService.isDark()) {
              <re-icon icon="moon-stars" size="18" weight="outline"></re-icon>
            } @else {
              <re-icon icon="sun-12" size="18" weight="outline"></re-icon>
            }
              <span class="theme-label">{{ themeService.isDark() ? 'Modo Claro' : 'Modo Oscuro' }}</span>
            </button>
            <button class="btn-logout" (click)="logout()">
              Cerrar Sesi├│n
            </button>
          </div>
        </nav>
        <main class="main-content">
          <header class="mobile-header">
            <button class="hamburger-btn" (click)="toggleSidebar()" aria-label="Men├║">
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

    /* Overlay para m├│vil */
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
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
      flex-shrink: 0;
      
      h2 {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--primary-color);
      }
    }

    .nav-list {
      list-style: none;
      padding: 0.5rem 0;
      flex: 1;
      overflow-y: auto;

      li {
        margin: 0.125rem 0;
      }

      a {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.625rem 1.25rem;
        color: var(--text-secondary);
        text-decoration: none;
        font-weight: 500;
        transition: all 0.15s;
        cursor: pointer;
        font-size: 0.9rem;

        .icon {
          font-size: 1.125rem;
        }

        .badge {
          margin-left: auto;
          background: var(--danger-color);
          color: white;
          font-size: 0.7rem;
          padding: 0.125rem 0.4rem;
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
      padding: 0.75rem 1.25rem 0.375rem;
      
      .section-label {
        font-size: 0.6rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--text-secondary);
      }
    }

    .sidebar-footer {
      padding: 1rem 1.25rem;
      border-top: 1px solid var(--border-color);
      background: var(--surface-color);
      flex-shrink: 0;
      
      .user-info {
        margin-bottom: 0.75rem;
        
        .user-name {
          display: block;
          font-weight: 600;
          color: var(--text-primary);
          font-size: 0.9rem;
        }
        
        .user-role {
          display: block;
          font-size: 0.7rem;
          color: var(--text-secondary);
          text-transform: uppercase;
        }
      }
      
      .btn-logout {
        width: 100%;
        padding: 0.625rem 0.75rem;
        background: var(--background-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        cursor: pointer;
        transition: all 0.15s;
        margin-top: 0.5rem;
        font-weight: 500;
        
        &:hover {
          background: var(--danger-color);
          border-color: var(--danger-color);
          color: white;
        }
      }

      .theme-toggle {
        width: 100%;
        padding: 0.625rem 0.75rem;
        background: var(--background-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        cursor: pointer;
        transition: all 0.15s;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        font-weight: 500;
        
        .theme-icon {
          font-size: 1.125rem;
        }
        
        .theme-label {
          font-size: 0.875rem;
        }
        
        &:hover {
          background: var(--primary-color);
          border-color: var(--primary-color);
          color: white;
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

    /* Header m├│vil */
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

    /* Responsive - Tablet y m├│vil */
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
    // Cerrar sidebar al hacer click en m├│vil
    if (window.innerWidth <= 768) {
      this.sidebarOpen.set(false);
    }
  }

  logout() {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
