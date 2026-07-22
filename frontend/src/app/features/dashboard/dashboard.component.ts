import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VisitaService, VisitaStats } from '../../core/services/visita.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="calescence-dashboard">
      <!-- Calescence Header -->
      <header class="top-header">
        <div class="greeting-section">
          <h1>Hola, {{ authService.currentUser()?.nombre || 'Usuario' }}</h1>
          <p class="subtitle">Bienvenido al resumen de Congregación Alameda</p>
        </div>
        <div class="header-pills">
          <div class="pill-date">
            <span class="material-symbols-outlined">calendar_today</span>
            <span>Resumen Activo 2026</span>
          </div>
          <a routerLink="/casas/new" class="pill-action">
            <span class="material-symbols-outlined">add</span>
            <span>Registrar Casa</span>
          </a>
        </div>
      </header>
      
      @if (loading()) {
        <div class="loading-state">
          <span class="material-symbols-outlined spin">sync</span>
          <p>Cargando información...</p>
        </div>
      } @else if (stats()) {
        <!-- Primary Cards Grid (Calescence style) -->
        <div class="metrics-grid">
          <!-- Dark Contrast Hero Card -->
          <div class="metric-card card-dark">
            <div class="card-top">
              <div class="icon-circle dark-icon">
                <span class="material-symbols-outlined">home</span>
              </div>
              <span class="badge-lime">+100% Cobertura</span>
            </div>
            <div class="card-main">
              <span class="metric-value">{{ stats()!.total_casas }}</span>
              <span class="metric-title">Total Casas Registradas</span>
            </div>
          </div>
          
          <!-- Electric Lime Accent Card -->
          <div class="metric-card card-lime">
            <div class="card-top">
              <div class="icon-circle lime-icon">
                <span class="material-symbols-outlined">check_circle</span>
              </div>
              <span class="badge-dark">Activas</span>
            </div>
            <div class="card-main">
              <span class="metric-value">{{ stats()!.casas_activas }}</span>
              <span class="metric-title">Casas en Seguimiento</span>
            </div>
          </div>

          <!-- White Surface Cards -->
          <div class="metric-card card-white">
            <div class="card-top">
              <div class="icon-circle blue-icon">
                <span class="material-symbols-outlined">event_available</span>
              </div>
              <span class="badge-blue">Este Mes</span>
            </div>
            <div class="card-main">
              <span class="metric-value">{{ stats()!.visitas_mes }}</span>
              <span class="metric-title">Visitas Realizadas</span>
            </div>
          </div>

          <div class="metric-card card-white">
            <div class="card-top">
              <div class="icon-circle amber-icon">
                <span class="material-symbols-outlined">schedule</span>
              </div>
              <span class="badge-amber">En Espera</span>
            </div>
            <div class="card-main">
              <span class="metric-value">{{ stats()!.casas_en_espera }}</span>
              <span class="metric-title">Pendientes de Visita</span>
            </div>
          </div>
        </div>

        <!-- Secondary Grid: Quick Actions + System Overview -->
        <div class="content-grid">
          <!-- Quick Actions Panel -->
          <div class="panel-card">
            <div class="panel-header">
              <h2>Acciones Rápidas</h2>
              <span class="pill-tag">Accesos Directos</span>
            </div>
            <div class="actions-grid">
              <a routerLink="/casas/new" class="action-pill-card">
                <span class="material-symbols-outlined action-icon">add_home</span>
                <span class="action-name">Registrar Casa</span>
                <span class="material-symbols-outlined arrow">arrow_forward</span>
              </a>
              <a routerLink="/casas" class="action-pill-card">
                <span class="material-symbols-outlined action-icon">home_work</span>
                <span class="action-name">Ver Casas</span>
                <span class="material-symbols-outlined arrow">arrow_forward</span>
              </a>
              <a routerLink="/visitas" class="action-pill-card">
                <span class="material-symbols-outlined action-icon">history</span>
                <span class="action-name">Historial Visitas</span>
                <span class="material-symbols-outlined arrow">arrow_forward</span>
              </a>
              <a routerLink="/notificaciones" class="action-pill-card">
                <span class="material-symbols-outlined action-icon">notifications</span>
                <span class="action-name">Notificaciones</span>
                <span class="material-symbols-outlined arrow">arrow_forward</span>
              </a>
            </div>
          </div>

          <!-- Status Distribution Panel -->
          <div class="panel-card">
            <div class="panel-header">
              <h2>Estado de Casas</h2>
              <span class="pill-tag">Resumen</span>
            </div>
            <div class="status-rows">
              <div class="status-row">
                <div class="status-info">
                  <span class="material-symbols-outlined text-green">task_alt</span>
                  <span class="status-name">Casas Recontactadas</span>
                </div>
                <span class="status-count">{{ stats()!.casas_recontactadas }}</span>
              </div>
              <div class="status-row">
                <div class="status-info">
                  <span class="material-symbols-outlined text-red">block</span>
                  <span class="status-name">No Visitar</span>
                </div>
                <span class="status-count">{{ stats()!.casas_no_visitar }}</span>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .calescence-dashboard {
      max-width: 1300px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }

    .top-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .greeting-section {
      h1 {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 2rem;
        font-weight: 800;
        color: var(--text-primary);
        letter-spacing: -0.02em;
        margin: 0;
      }
      .subtitle {
        color: var(--text-secondary);
        font-size: 0.95rem;
        margin-top: 0.25rem;
      }
    }

    .header-pills {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .pill-date {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem 1.2rem;
        background: var(--surface-color);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-pill);
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-primary);
        box-shadow: var(--shadow-sm);

        span.material-symbols-outlined {
          font-size: 1.15rem;
          color: var(--primary-color);
        }
      }

      .pill-action {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        padding: 0.6rem 1.25rem;
        background: #121316;
        color: #ffffff;
        border-radius: var(--radius-pill);
        font-size: 0.875rem;
        font-weight: 600;
        text-decoration: none;
        box-shadow: var(--shadow-pill);
        transition: transform 0.2s ease, box-shadow 0.2s ease;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(18, 19, 22, 0.3);
        }

        span.material-symbols-outlined {
          font-size: 1.25rem;
          color: var(--accent-lime);
        }
      }
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
    }

    .metric-card {
      border-radius: 24px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 160px;
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease;

      &:hover {
        transform: translateY(-4px);
      }
    }

    .card-dark {
      background: var(--dark-card-bg);
      color: #ffffff;
      box-shadow: 0 12px 28px -6px rgba(0, 0, 0, 0.3);

      .metric-value { color: #ffffff; }
      .metric-title { color: rgba(255, 255, 255, 0.7); }
    }

    .card-lime {
      background: var(--accent-lime);
      color: #121316;
      box-shadow: 0 12px 28px -6px rgba(196, 248, 42, 0.35);

      .metric-value { color: #121316; }
      .metric-title { color: rgba(18, 19, 22, 0.75); font-weight: 600; }
    }

    .card-white {
      background: var(--surface-color);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      box-shadow: var(--shadow-card);

      .metric-value { color: var(--text-primary); }
      .metric-title { color: var(--text-secondary); }
    }

    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .icon-circle {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;

      span { font-size: 1.4rem; }
    }

    .dark-icon { background: rgba(255, 255, 255, 0.12); color: var(--accent-lime); }
    .lime-icon { background: #121316; color: var(--accent-lime); }
    .blue-icon { background: rgba(37, 99, 235, 0.12); color: var(--primary-color); }
    .amber-icon { background: rgba(245, 158, 11, 0.12); color: var(--warning-color); }

    .badge-lime { background: var(--accent-lime); color: #121316; font-weight: 700; font-size: 0.75rem; padding: 0.25rem 0.65rem; border-radius: var(--radius-pill); }
    .badge-dark { background: #121316; color: #ffffff; font-weight: 600; font-size: 0.75rem; padding: 0.25rem 0.65rem; border-radius: var(--radius-pill); }
    .badge-blue { background: rgba(37, 99, 235, 0.1); color: var(--primary-color); font-weight: 600; font-size: 0.75rem; padding: 0.25rem 0.65rem; border-radius: var(--radius-pill); }
    .badge-amber { background: rgba(245, 158, 11, 0.1); color: var(--warning-color); font-weight: 600; font-size: 0.75rem; padding: 0.25rem 0.65rem; border-radius: var(--radius-pill); }

    .card-main {
      margin-top: 1rem;
      display: flex;
      flex-direction: column;

      .metric-value {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 2.25rem;
        font-weight: 800;
        line-height: 1.1;
        letter-spacing: -0.02em;
      }

      .metric-title {
        font-size: 0.85rem;
        margin-top: 0.35rem;
      }
    }

    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.25rem;
    }

    .panel-card {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 24px;
      padding: 1.5rem;
      box-shadow: var(--shadow-card);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h2 {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 1.2rem;
        font-weight: 700;
        margin: 0;
        color: var(--text-primary);
      }

      .pill-tag {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-secondary);
        background: var(--background-color);
        padding: 0.25rem 0.65rem;
        border-radius: var(--radius-pill);
      }
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .action-pill-card {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 1rem 1.25rem;
      background: var(--background-color);
      border-radius: var(--radius-xl);
      text-decoration: none;
      color: var(--text-primary);
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      &:hover {
        background: var(--surface-color);
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);

        .arrow { transform: translateX(3px); color: var(--primary-color); }
        .action-icon { color: var(--primary-color); }
      }

      .action-icon {
        font-size: 1.4rem;
        color: var(--text-secondary);
        transition: color 0.2s ease;
      }

      .action-name {
        font-weight: 600;
        font-size: 0.9rem;
        flex: 1;
      }

      .arrow {
        font-size: 1.1rem;
        color: var(--text-secondary);
        transition: transform 0.2s ease, color 0.2s ease;
      }
    }

    .status-rows {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .status-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.85rem 1rem;
      background: var(--background-color);
      border-radius: var(--radius-lg);

      .status-info {
        display: flex;
        align-items: center;
        gap: 0.65rem;

        .text-green { color: var(--success-color); }
        .text-red { color: var(--danger-color); }

        .status-name {
          font-weight: 500;
          font-size: 0.9rem;
          color: var(--text-primary);
        }
      }

      .status-count {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-weight: 800;
        font-size: 1.25rem;
        color: var(--text-primary);
      }
    }

    .loading-state {
      text-align: center;
      padding: 4rem;
      color: var(--text-secondary);

      .spin {
        font-size: 2.5rem;
        animation: spin 1s linear infinite;
      }
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 900px) {
      .content-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private visitaService = inject(VisitaService);
  public authService = inject(AuthService);
  
  stats = signal<VisitaStats | null>(null);
  loading = signal(true);
  
  ngOnInit() {
    this.visitaService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
