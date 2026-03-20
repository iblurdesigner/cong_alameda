import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CasaService, Casa } from '../../../core/services/casa.service';
import { VisitaService, Visita } from '../../../core/services/visita.service';

@Component({
  selector: 'app-casa-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">
      <header class="page-header">
        <a routerLink="/casas" class="back-link">← Volver a Casas</a>
      </header>
      
      @if (loading()) {
        <div class="loading">Cargando...</div>
      } @else if (casa()) {
        <div class="detail-layout">
          <div class="main-content">
            <div class="card">
              <div class="card-header">
                <h2>Información de la Casa</h2>
                <span class="badge" [ngClass]="getEstadoClass(casa()!.estado)">
                  {{ getEstadoLabel(casa()!.estado) }}
                </span>
              </div>
              
              <div class="info-grid">
                <div class="info-item">
                  <label>Dirección</label>
                  <span class="value">
                    {{ casa()!.calle_principal }} {{ casa()!.numeracion }}
                    @if (casa()!.calle_secundaria) {
                      <br><small>Entre {{ casa()!.calle_secundaria }}</small>
                    }
                  </span>
                </div>
                
                <div class="info-item">
                  <label>Sector</label>
                  <span class="value">{{ casa()!.sector }}</span>
                </div>
                
                @if (casa()!.referencia) {
                  <div class="info-item">
                    <label>Referencia</label>
                    <span class="value">{{ casa()!.referencia }}</span>
                  </div>
                }
                
                <div class="info-item full-width">
                  <label>Motivo "No Visitar"</label>
                  <span class="value motivo">{{ casa()!.motivo_no_volver }}</span>
                </div>
                
                <div class="info-item">
                  <label>Registrada por</label>
                  <span class="value">{{ casa()!.persona_registra }}</span>
                </div>
                
                <div class="info-item">
                  <label>Fecha de Registro</label>
                  <span class="value">{{ formatDate(casa()!.fecha_registro) }}</span>
                </div>
              </div>
            </div>
            
            <div class="card">
              <div class="card-header">
                <h3>Historial de Visitas</h3>
              </div>
              
              @if (visitas().length === 0) {
                <p class="no-visits">No hay visitas registradas</p>
              } @else {
                <div class="visits-list">
                  @for (visita of visitas(); track visita.id) {
                    <div class="visit-item">
                      <div class="visit-header">
                        <span class="visit-date">{{ formatDate(visita.fecha_programada) }}</span>
                        <span class="badge" [ngClass]="getVisitaEstadoClass(visita.estado)">
                          {{ getVisitaEstadoLabel(visita.estado) }}
                        </span>
                      </div>
                      @if (visita.observaciones) {
                        <p class="visit-obs">{{ visita.observaciones }}</p>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          </div>
          
          <div class="actions-sidebar">
            <a [routerLink]="['/casas', casa()!.id, 'edit']" class="btn btn-primary btn-block">
              ✏️ Editar Casa
            </a>
            <a [routerLink]="['/visitas']" [queryParams]="{casa_id: casa()!.id}" class="btn btn-outline btn-block">
              📅 Ver Visitas
            </a>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { max-width: 1000px; margin: 0 auto; }
    
    .page-header { margin-bottom: 1.5rem; }
    
    .back-link {
      color: var(--primary-color);
      text-decoration: none;
      font-weight: 500;
      &:hover { text-decoration: underline; }
    }
    
    .loading { text-align: center; padding: 3rem; color: var(--text-secondary); }
    
    .detail-layout {
      display: grid;
      grid-template-columns: 1fr 250px;
      gap: 1.5rem;
      @media (max-width: 768px) {
        grid-template-columns: 1fr;
      }
    }
    
    .card {
      background: var(--surface-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      border: 1px solid var(--border-color);
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        h2, h3 { font-size: 1.25rem; font-weight: 600; }
      }
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      @media (max-width: 600px) { grid-template-columns: 1fr; }
    }
    
    .info-item {
      &.full-width { grid-column: 1 / -1; }
      label {
        display: block;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--text-secondary);
        margin-bottom: 0.25rem;
      }
      .value {
        font-size: 1rem;
        color: var(--text-primary);
        &.motivo {
          background: rgba(239, 68, 68, 0.1);
          padding: 0.75rem;
          border-radius: var(--radius-md);
          color: var(--danger-color);
        }
        small { color: var(--text-secondary); }
      }
    }
    
    .no-visits { color: var(--text-secondary); text-align: center; padding: 1rem; }
    
    .visits-list { display: flex; flex-direction: column; gap: 1rem; }
    
    .visit-item {
      padding: 1rem;
      background: var(--background-color);
      border-radius: var(--radius-md);
      .visit-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }
      .visit-obs { font-size: 0.875rem; color: var(--text-secondary); margin: 0; }
    }
    
    .actions-sidebar {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      .btn-block { width: 100%; justify-content: center; }
    }
    
    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 500;
    }
    .badge-danger { background: rgba(239, 68, 68, 0.1); color: var(--danger-color); }
    .badge-warning { background: rgba(245, 158, 11, 0.1); color: var(--warning-color); }
    .badge-primary { background: rgba(37, 99, 235, 0.1); color: var(--primary-color); }
    .badge-success { background: rgba(16, 185, 129, 0.1); color: var(--success-color); }
  `]
})
export class CasaDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private casaService = inject(CasaService);
  private visitaService = inject(VisitaService);
  
  casa = signal<Casa | null>(null);
  visitas = signal<Visita[]>([]);
  loading = signal(true);
  
  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadCasa(id);
    }
  }
  
  loadCasa(id: string) {
    this.casaService.getCasa(id).subscribe({
      next: (casa) => {
        this.casa.set(casa);
        this.loadVisitas(id);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/casas']);
      }
    });
  }
  
  loadVisitas(casaId: string) {
    this.visitaService.loadVisitas({ casa_id: casaId }).subscribe({
      next: (res) => this.visitas.set(res.data)
    });
  }
  
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES');
  }
  
  getEstadoClass(estado: string): string {
    const classes: Record<string, string> = {
      'NO_VISITAR': 'badge-danger',
      'EN_ESPERA_VISITA': 'badge-warning',
      'RECONTACTADA': 'badge-primary',
      'ACTIVA': 'badge-success'
    };
    return classes[estado] || 'badge-primary';
  }
  
  getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      'NO_VISITAR': 'No Visitar',
      'EN_ESPERA_VISITA': 'En Espera',
      'RECONTACTADA': 'Recontactada',
      'ACTIVA': 'Activa'
    };
    return labels[estado] || estado;
  }
  
  getVisitaEstadoClass(estado: string): string {
    const classes: Record<string, string> = {
      'PROGRAMADA': 'badge-warning',
      'REALIZADA': 'badge-success',
      'CANCELADA': 'badge-danger'
    };
    return classes[estado] || 'badge-primary';
  }
  
  getVisitaEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      'PROGRAMADA': 'Programada',
      'REALIZADA': 'Realizada',
      'CANCELADA': 'Cancelada'
    };
    return labels[estado] || estado;
  }
}
