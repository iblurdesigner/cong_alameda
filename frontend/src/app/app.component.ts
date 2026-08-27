import { Component, inject, signal } from '@angular/core';
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
            <div class="logo-container">
              <span class="material-symbols-outlined logo-icon">hub</span>
              <h2>App Alameda</h2>
            </div>
          </div>
          <ul class="nav-list">
            <li>
              <a routerLink="/dashboard" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <span class="material-symbols-outlined icon">dashboard</span>
                <span>Dashboard</span>
              </a>
            </li>
            <li>
              <a routerLink="/perfil" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <span class="material-symbols-outlined icon">account_circle</span>
                <span>Mi Perfil</span>
              </a>
            </li>
            <li>
              <a routerLink="/casas" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <span class="material-symbols-outlined icon">home</span>
                <span>Casas</span>
              </a>
            </li>
            <li>
              <a routerLink="/visitas" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <span class="material-symbols-outlined icon">event_available</span>
                <span>Visitas</span>
              </a>
            </li>
            <li>
              <a routerLink="/notificaciones" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <span class="material-symbols-outlined icon">notifications</span>
                <span>Notificaciones</span>
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
                <span class="material-symbols-outlined icon">groups</span>
                <span>Grupos</span>
              </a>
            </li>
            <li>
              <a routerLink="/territorios" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <span class="material-symbols-outlined icon">map</span>
                <span>Territorios</span>
              </a>
            </li>
            <li>
              <a routerLink="/dia-predicacion" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <span class="material-symbols-outlined icon">today</span>
                <span>Día Predicación</span>
              </a>
            </li>
            <li>
              <a routerLink="/predicacion-visita" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <span class="material-symbols-outlined icon">directions_car</span>
                <span>Predicación Visita</span>
              </a>
            </li>
            <!-- Fase 3: Asignaciones Internas -->
            <li class="nav-section">
              <span class="section-label">Asignaciones</span>
            </li>
            <li>
              <a routerLink="/asignaciones" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                <span class="material-symbols-outlined icon">assignment</span>
                <span>Asignaciones</span>
              </a>
            </li>
            <!-- Backoffice - Solo SUPER_ADMIN -->
            @if (authService.isSuperAdmin()) {
              <li class="nav-section">
                <span class="section-label">Administración</span>
              </li>
              <li>
                <a routerLink="/usuarios" routerLinkActive="active" (click)="closeSidebarOnMobile()">
                  <span class="material-symbols-outlined icon">manage_accounts</span>
                  <span>Usuarios</span>
                </a>
              </li>
            }
          </ul>
          <div class="sidebar-footer">
            <div class="user-card">
              <span class="material-symbols-outlined user-avatar">person</span>
              <div class="user-info">
                <span class="user-name">{{ authService.currentUser()?.nombre }}</span>
                <span class="user-role">{{ authService.currentUser()?.rol }}</span>
              </div>
            </div>
            <div class="footer-actions">
              <button class="theme-toggle" (click)="themeService.toggle()" [attr.aria-label]="themeService.isDark() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'">
                <span class="material-symbols-outlined theme-icon">{{ themeService.isDark() ? 'light_mode' : 'dark_mode' }}</span>
                <span class="theme-label">{{ themeService.isDark() ? 'Modo Claro' : 'Modo Oscuro' }}</span>
              </button>
              <button class="btn-logout" (click)="logout()" aria-label="Cerrar Sesión">
                <span class="material-symbols-outlined logout-icon">logout</span>
                <span>Cerrar Sesión</span>
              </button>
            </div>
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
      background-color: var(--background-color);
    }

    /* Overlay para móvil */
    .overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(4px);
      z-index: 40;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .sidebar {
      width: 250px;
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-card);
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 1rem;
      left: 1rem;
      height: calc(100vh - 2rem);
      z-index: 50;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .sidebar-header {
      padding: 1.5rem 1.25rem 1rem;
      flex-shrink: 0;
      
      .logo-container {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .logo-icon {
          font-size: 1.6rem;
          color: var(--accent-lime);
          background: #121316;
          padding: 0.45rem;
          border-radius: 14px;
          box-shadow: 0 4px 12px rgba(18, 19, 22, 0.25);
        }

        h2 {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 1.2rem;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }
      }
    }

    .nav-list {
      list-style: none;
      padding: 0.5rem 0.75rem;
      flex: 1;
      overflow-y: auto;

      li {
        margin: 0.35rem 0;
      }

      a {
        display: flex;
        align-items: center;
        gap: 0.85rem;
        padding: 0.7rem 1rem;
        color: var(--text-secondary);
        text-decoration: none;
        font-weight: 500;
        border-radius: var(--radius-pill);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
        font-size: 0.9rem;
        position: relative;

        .icon {
          font-size: 1.25rem;
          color: var(--text-secondary);
          transition: transform 0.2s ease, color 0.2s ease;
        }

        .badge {
          margin-left: auto;
          background: var(--accent-lime);
          color: #121316;
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.15rem 0.5rem;
          border-radius: 9999px;
          box-shadow: 0 2px 6px rgba(196, 248, 42, 0.4);
        }

        &:hover {
          background: rgba(37, 99, 235, 0.08);
          color: var(--primary-color);

          .icon {
            color: var(--primary-color);
            transform: translateX(3px);
          }
        }

        &.active {
          background: #121316;
          color: #ffffff;
          font-weight: 600;
          box-shadow: 0 6px 16px -2px rgba(18, 19, 22, 0.3);

          .icon {
            color: var(--accent-lime);
          }
        }
      }
    }
    
    .nav-section {
      padding: 1rem 1rem 0.35rem;
      
      .section-label {
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-secondary);
        opacity: 0.8;
      }
    }

    .sidebar-footer {
      padding: 1rem 1.25rem;
      border-top: 1px solid var(--border-color);
      background: var(--surface-color);
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      
      .user-card {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.5rem;
        border-radius: var(--radius-md);
        background: var(--background-color);

        .user-avatar {
          font-size: 1.5rem;
          color: var(--primary-color);
          background: var(--primary-light);
          padding: 0.35rem;
          border-radius: 50%;
        }

        .user-info {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          
          .user-name {
            font-weight: 600;
            color: var(--text-primary);
            font-size: 0.875rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .user-role {
            font-size: 0.68rem;
            font-weight: 600;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.04em;
          }
        }
      }

      .footer-actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      
      .btn-logout {
        width: 100%;
        padding: 0.55rem 0.75rem;
        background: transparent;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        color: var(--text-secondary);
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 500;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;

        .logout-icon {
          font-size: 1.1rem;
        }
        
        &:hover {
          background: rgba(239, 68, 68, 0.08);
          border-color: var(--danger-color);
          color: var(--danger-color);
        }
      }

      .theme-toggle {
        width: 100%;
        padding: 0.55rem 0.75rem;
        background: var(--background-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        font-weight: 500;
        font-size: 0.85rem;
        
        .theme-icon {
          font-size: 1.1rem;
        }
        
        .theme-label {
          font-size: 0.85rem;
        }
        
        &:hover {
          background: var(--primary-light);
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
    void this.router.navigate(['/login']);
  }
}
