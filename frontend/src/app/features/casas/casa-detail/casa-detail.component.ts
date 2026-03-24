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
                  <span class="value motivo">{{ casa()!.motivo_no_volver || 'Sin motivo' }}</span>
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
                    <div class="visit-item" (click)="openVisitDetail(visita)" style="cursor: pointer;">
                      <div class="visit-header">
                        <span class="visit-date">
                          @if (visita.estado === 'REALIZADA' && visita.fecha_realizada) {
                            ✅ {{ formatDate(visita.fecha_realizada) }}
                          } @else {
                            📅 {{ formatDate(visita.fecha_programada) }}
                          }
                        </span>
                        <span class="badge" [ngClass]="getVisitaEstadoClass(visita.estado)">
                          {{ getVisitaEstadoLabel(visita.estado) }}
                        </span>
                      </div>
                      
                      @if (visita.visitante_1_nombre || visita.visitante_2_nombre) {
                        <p class="visit-visitors">
                          👥 {{ [visita.visitante_1_nombre, visita.visitante_2_nombre].filter(n => n).join(', ') }}
                        </p>
                      }
                      
                      @if (visita.observaciones && visita.observaciones.length > 50) {
                        <p class="visit-obs-preview">{{ visita.observaciones | slice:0:50 }}...</p>
                      } @else if (visita.observaciones) {
                        <p class="visit-obs">{{ visita.observaciones }}</p>
                      }
                      
                      <span class="click-hint">Click para ver detalles →</span>
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

    <!-- Modal de Detalles de Visita -->
    @if (selectedVisit()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Detalle de la Visita</h2>
            <button class="modal-close" (click)="closeModal()">✕</button>
          </div>
          
          <div class="modal-body">
            <div class="detail-section">
              <h3>📅 Programación</h3>
              <div class="detail-row">
                <span class="detail-label">Fecha Programada:</span>
                <span class="detail-value">{{ formatDate(selectedVisit()!.fecha_programada) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Estado:</span>
                <span class="badge" [ngClass]="getVisitaEstadoClass(selectedVisit()!.estado)">
                  {{ getVisitaEstadoLabel(selectedVisit()!.estado) }}
                </span>
              </div>
            </div>

            @if (selectedVisit()!.fecha_realizada) {
              <div class="detail-section">
                <h3>✅ Visita Realizada</h3>
                <div class="detail-row">
                  <span class="detail-label">Fecha de Realización:</span>
                  <span class="detail-value">{{ formatDate(selectedVisit()!.fecha_realizada!) }}</span>
                </div>
              </div>
            }

            <div class="detail-section">
              <h3>👥 Visitantes</h3>
              <div class="detail-row">
                <span class="detail-label">Visitante 1:</span>
                <span class="detail-value">{{ selectedVisit()!.visitante_1_nombre || 'No asignado' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Visitante 2:</span>
                <span class="detail-value">{{ selectedVisit()!.visitante_2_nombre || 'No asignado' }}</span>
              </div>
            </div>

            @if (selectedVisit()!.observaciones) {
              <div class="detail-section">
                <h3>📝 Observaciones</h3>
                <div class="observaciones-box">{{ selectedVisit()!.observaciones }}</div>
              </div>
            }

            @if (selectedVisit()!.desea_seguir_recibiendo !== undefined) {
              <div class="detail-section">
                <h3>📢 Respuesta del Habitante</h3>
                <div class="detail-row">
                  <span class="detail-label">Desea seguir recibiendo:</span>
                  <span class="detail-value" [class.text-success]="selectedVisit()!.desea_seguir_recibiendo" [class.text-danger]="!selectedVisit()!.desea_seguir_recibiendo">
                    {{ selectedVisit()!.desea_seguir_recibiendo ? '✅ Sí' : '❌ No' }}
                  </span>
                </div>
              </div>
            }
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeModal()">Cerrar</button>
          </div>
        </div>
      </div>
    }
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
      @media (max-width: 768px) { grid-template-columns: 1fr; }
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
      border: 1px solid var(--border-color);
      transition: all 0.2s ease;
      
      &:hover {
        border-color: var(--primary-color);
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      
      .visit-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }
      .visit-visitors { font-size: 0.875rem; color: var(--text-primary); margin: 0.25rem 0; }
      .visit-obs { font-size: 0.8rem; color: var(--text-secondary); margin: 0.25rem 0; }
      .visit-obs-preview { font-size: 0.8rem; color: var(--text-secondary); margin: 0.25rem 0; font-style: italic; }
      .click-hint { font-size: 0.7rem; color: var(--primary-color); opacity: 0.7; }
    }
    
    .actions-sidebar {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      .btn-block { width: 100%; justify-content: center; }
    }
    
    .btn { padding: 0.625rem 1rem; border-radius: var(--radius-md); font-weight: 500; text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; cursor: pointer; border: none; }
    .btn-primary { background: var(--primary-color); color: white; &:hover { background: var(--primary-dark); } }
    .btn-outline { background: transparent; border: 1px solid var(--border-color); color: var(--text-primary); &:hover { background: var(--border-color); } }
    .btn-secondary { padding: 0.625rem 1.25rem; background: transparent; color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-md); cursor: pointer; font-size: 0.875rem; font-weight: 500; &:hover { background: var(--border-color); } }
    
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

    /* Modal */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal-content { background: var(--surface-color); border-radius: var(--radius-xl); width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-lg); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); h2 { font-size: 1.25rem; font-weight: 600; margin: 0; } }
    .modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary); padding: 0.25rem; &:hover { color: var(--text-primary); } }
    .modal-body { padding: 1.5rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); }
    
    .detail-section { margin-bottom: 1.5rem; &:last-child { margin-bottom: 0; } h3 { font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--text-primary); border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; } }
    .detail-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem; }
    .detail-label { font-size: 0.875rem; color: var(--text-secondary); }
    .detail-value { font-size: 0.875rem; color: var(--text-primary); font-weight: 500; }
    .text-success { color: var(--success-color) !important; }
    .text-danger { color: var(--danger-color) !important; }
    
    .observaciones-box {
      background: var(--background-color);
      padding: 1rem;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      color: var(--text-primary);
      white-space: pre-wrap;
      border: 1px solid var(--border-color);
    }
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
  selectedVisit = signal<Visita | null>(null);
  
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
  
  openVisitDetail(visita: Visita) {
    this.selectedVisit.set(visita);
  }
  
  closeModal() {
    this.selectedVisit.set(null);
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
