import { Component, inject, OnInit, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VisitaService, VisitaStats } from '../../core/services/visita.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="dashboard">
      <header class="page-header">
        <div class="header-content">
          <h1>Dashboard</h1>
          <p class="header-subtitle">Resumen del sistema</p>
        </div>
      </header>
      
      @if (loading()) {
        <div class="loading">Cargando...</div>
      } @else if (stats()) {
        <div class="stats-grid">
          <div class="stat-card">
            <re-icon icon="home" size="28" weight="outline" class="stat-icon"></re-icon>
            <div class="stat-content">
              <span class="stat-value">{{ stats()!.total_casas }}</span>
              <span class="stat-label">Total Casas</span>
            </div>
          </div>
          
          <div class="stat-card">
            <re-icon icon="forbidden-circle" size="28" weight="outline" class="stat-icon"></re-icon>
            <div class="stat-content">
              <span class="stat-value">{{ stats()!.casas_no_visitar }}</span>
              <span class="stat-label">No Visitar</span>
            </div>
          </div>
          
          <div class="stat-card">
            <re-icon icon="clock-circle" size="28" weight="outline" class="stat-icon"></re-icon>
            <div class="stat-content">
              <span class="stat-value">{{ stats()!.casas_en_espera }}</span>
              <span class="stat-label">En Espera</span>
            </div>
          </div>
          
          <div class="stat-card">
            <re-icon icon="help-circle" size="28" weight="outline" class="stat-icon"></re-icon>
            <div class="stat-content">
              <span class="stat-value">{{ stats()!.casas_recontactadas }}</span>
              <span class="stat-label">Recontactadas</span>
            </div>
          </div>
          
          <div class="stat-card">
            <re-icon icon="calendar-12" size="28" weight="outline" class="stat-icon"></re-icon>
            <div class="stat-content">
              <span class="stat-value">{{ stats()!.visitas_mes }}</span>
              <span class="stat-label">Visitas del Mes</span>
            </div>
          </div>
          
          <div class="stat-card stat-success">
            <re-icon icon="check-circle" size="28" weight="outline" class="stat-icon"></re-icon>
            <div class="stat-content">
              <span class="stat-value">{{ stats()!.casas_activas }}</span>
              <span class="stat-label">Activas</span>
            </div>
          </div>
        </div>
        
        <div class="quick-actions">
          <h2>Acciones Rápidas</h2>
          <div class="actions-grid">
            <a routerLink="/casas/new" class="action-card">
              <re-icon icon="add-square2" size="24" weight="outline" class="action-icon"></re-icon>
              <span class="action-label">Registrar Casa</span>
            </a>
            <a routerLink="/casas" class="action-card">
              <re-icon icon="home" size="24" weight="outline" class="action-icon"></re-icon>
              <span class="action-label">Ver Casas</span>
            </a>
            <a routerLink="/visitas" class="action-card">
              <re-icon icon="calendar-12" size="24" weight="outline" class="action-icon"></re-icon>
              <span class="action-label">Ver Visitas</span>
            </a>
            <a routerLink="/notificaciones" class="action-card">
              <re-icon icon="bell-ring" size="24" weight="outline" class="action-icon"></re-icon>
              <span class="action-label">Notificaciones</span>
            </a>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .page-header {
      margin-bottom: 2rem;
      
      h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text-primary);
      }
      
      .header-subtitle {
        color: var(--text-secondary);
        margin-top: 0.25rem;
      }
    }
    
    .loading {
      text-align: center;
      padding: 3rem;
      color: var(--text-secondary);
    }
    
    .stats-grid {
      display: grid;
      gap: 1rem;
      grid-template-columns: repeat(2, 1fr);
      margin-bottom: 2rem;
    }
    
    .stat-card {
      background: var(--surface-color);
      border-radius: var(--radius-lg);
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--border-color);
      
      .stat-icon {
        font-size: 1.75rem;
        flex-shrink: 0;
      }
      
      .stat-content {
        display: flex;
        flex-direction: column;
        min-width: 0;
        
        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
        }
        
        .stat-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          white-space: nowrap;
        }
      }
      
      &.stat-success {
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%);
        border-color: rgba(16, 185, 129, 0.2);
      }
    }
    
    .quick-actions {
      h2 {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 1rem;
      }
    }
    
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }
    
    .action-card {
      background: var(--surface-color);
      border-radius: var(--radius-lg);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      border: 1px solid var(--border-color);
      transition: all 0.2s;
      min-height: 100px;
      justify-content: center;
      
      &:hover {
        border-color: var(--primary-color);
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);
      }
      
      .action-icon {
        font-size: 1.5rem;
      }
      
      .action-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--text-primary);
        text-align: center;
      }
    }

    @media (max-width: 768px) {
      .page-header h1 { font-size: 1.5rem; }
      .stats-grid { grid-template-columns: 1fr; }
      .actions-grid { grid-template-columns: 1fr; }
      .stat-card { padding: 0.875rem; }
      .action-card { min-height: 90px; padding: 1rem; }
    }

    @media (min-width: 1024px) {
      .stats-grid { grid-template-columns: repeat(3, 1fr); }
    }

    @media (min-width: 1200px) {
      .stats-grid { grid-template-columns: repeat(6, 1fr); }
      .actions-grid { grid-template-columns: repeat(4, 1fr); }
    }
  `]
})
export class DashboardComponent implements OnInit {
  private visitaService = inject(VisitaService);
  
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
