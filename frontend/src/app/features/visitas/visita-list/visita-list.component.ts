import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VisitaService, Visita } from '../../../core/services/visita.service';
import { UserService, User } from '../../../core/services/user.service';

@Component({
  selector: 'app-visita-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="header-content">
          <h1>Visitas</h1>
          <p class="header-subtitle">Programación y seguimiento de visitas</p>
        </div>
      </header>
      
      <div class="filters-bar">
        <select [(ngModel)]="estadoFilter" (ngModelChange)="loadVisitas()" class="filter-select">
          <option value="">Todos los estados</option>
          <option value="PROGRAMADA">Programada</option>
          <option value="REALIZADA">Realizada</option>
          <option value="CANCELADA">Cancelada</option>
        </select>
      </div>
      
      @if (visitaService.loading()) {
        <div class="loading">Cargando...</div>
      } @else if (visitas().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <p>No hay visitas registradas</p>
        </div>
      } @else {
        <div class="visitas-grid">
          @for (visita of visitas(); track visita.id) {
            <div class="visita-card">
              <div class="visita-header">
                <span class="visita-date">{{ formatDate(visita.fecha_programada) }}</span>
                <span class="badge" [ngClass]="getEstadoClass(visita.estado)">
                  {{ getEstadoLabel(visita.estado) }}
                </span>
              </div>
              
              @if (visita.casa) {
                <div class="visita-address">
                  📍 {{ visita.casa.calle_principal }} {{ visita.casa.numeracion }}
                  @if (visita.casa.calle_secundaria) {
                    , {{ visita.casa.calle_secundaria }}
                  }
                  <span class="sector-badge">{{ visita.casa.sector }}</span>
                </div>
                @if (visita.casa.referencia) {
                  <p class="visita-ref">📝 {{ visita.casa.referencia }}</p>
                }
              }
              
              @if (visita.fecha_realizada) {
                <p class="visita-realizada">✅ Realizada: {{ formatDate(visita.fecha_realizada) }}</p>
              }
              
              @if (visita.observaciones) {
                <p class="visita-obs">{{ visita.observaciones }}</p>
              }
              
              @if (visita.desea_seguir_recibiendo !== undefined) {
                <p class="visita-resp">
                  {{ visita.desea_seguir_recibiendo ? '✅ Desea visitas' : '❌ No desea visitas' }}
                </p>
              }

              <button class="btn-ver" (click)="openDetail(visita)">👁️ Ver</button>
            </div>
          }
        </div>
      }
    </div>

    <!-- Modal de Detalles -->
    @if (selectedVisita()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Detalles de la Visita</h2>
            <button class="modal-close" (click)="closeModal()">✕</button>
          </div>
          
          <div class="modal-body">
            <!-- Info de la Casa -->
            <div class="detail-section">
              <h3>🏠 Información de la Casa</h3>
              @if (selectedVisita()!.casa) {
                <div class="detail-row">
                  <span class="detail-label">Dirección:</span>
                  <span class="detail-value">
                    {{ selectedVisita()!.casa!.calle_principal }} {{ selectedVisita()!.casa!.numeracion }}
                    @if (selectedVisita()!.casa!.calle_secundaria) {
                      , {{ selectedVisita()!.casa!.calle_secundaria }}
                    }
                  </span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Sector:</span>
                  <span class="detail-value sector-badge-lg">{{ selectedVisita()!.casa!.sector }}</span>
                </div>
                @if (selectedVisita()!.casa!.referencia) {
                  <div class="detail-row">
                    <span class="detail-label">Referencia:</span>
                    <span class="detail-value">{{ selectedVisita()!.casa!.referencia }}</span>
                  </div>
                }
              }
            </div>

            <!-- Programación -->
            <div class="detail-section">
              <h3>📅 Programación</h3>
              <div class="detail-row">
                <span class="detail-label">Fecha programada:</span>
                <span class="detail-value">{{ formatDate(selectedVisita()!.fecha_programada) }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Estado:</span>
                <span class="badge" [ngClass]="getEstadoClass(selectedVisita()!.estado)">
                  {{ getEstadoLabel(selectedVisita()!.estado) }}
                </span>
              </div>
            </div>

            <!-- Asignación de Visitantes -->
            <div class="detail-section">
              <h3>👥 Asignar Visitantes</h3>
              <div class="form-group">
                <label>Visitante 1:</label>
                <select [(ngModel)]="visitante1Id" class="form-select">
                  <option value="">Seleccionar...</option>
                  @for (user of users(); track user.id) {
                    <option [value]="user.id">{{ user.nombre }} ({{ user.rol }})</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>Visitante 2:</label>
                <select [(ngModel)]="visitante2Id" class="form-select">
                  <option value="">Seleccionar...</option>
                  @for (user of users(); track user.id) {
                    <option [value]="user.id">{{ user.nombre }} ({{ user.rol }})</option>
                  }
                </select>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeModal()">Cancelar</button>
            <button class="btn-primary" (click)="saveVisitantes()" [disabled]="saving()">
              {{ saving() ? 'Guardando...' : '💾 Guardar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-container { max-width: 1000px; margin: 0 auto; }
    
    .page-header { margin-bottom: 1.5rem; h1 { font-size: 1.75rem; font-weight: 700; } .header-subtitle { color: var(--text-secondary); margin-top: 0.25rem; } }
    
    .filters-bar { margin-bottom: 1.5rem; .filter-select { padding: 0.625rem 2rem 0.625rem 0.875rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 1rem; min-height: 44px; width: 100%; max-width: 300px; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.75rem center; } }
    
    .loading, .empty-state { text-align: center; padding: 3rem; color: var(--text-secondary); }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; .empty-icon { font-size: 3rem; opacity: 0.5; } }
    
    .visitas-grid { display: grid; gap: 1rem; grid-template-columns: 1fr; }
    
    .visita-card { background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1rem; transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.05); &:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); transform: translateY(-2px); } }
    
    .visita-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem; }
    .visita-date { font-weight: 600; font-size: 1rem; }
    .visita-address { font-size: 0.9rem; color: var(--text-primary); margin: 0.5rem 0; font-weight: 500; }
    .sector-badge { display: inline-block; background: var(--primary-light); color: var(--primary-color); padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 500; margin-left: 0.5rem; }
    .visita-ref { font-size: 0.8rem; color: var(--text-secondary); margin: 0.25rem 0; font-style: italic; }
    .visita-realizada, .visita-obs, .visita-resp { font-size: 0.875rem; color: var(--text-secondary); margin: 0.25rem 0; }
    
    .btn-ver { margin-top: 0.75rem; padding: 0.5rem 1rem; background: var(--primary-color); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-size: 0.875rem; font-weight: 500; width: 100%; &:hover { background: var(--primary-dark); } }
    
    .badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; min-height: 28px; display: inline-flex; align-items: center; }
    .badge-warning { background: rgba(245, 158, 11, 0.1); color: var(--warning-color); }
    .badge-success { background: rgba(16, 185, 129, 0.1); color: var(--success-color); }
    .badge-danger { background: rgba(239, 68, 68, 0.1); color: var(--danger-color); }

    /* Modal */
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal-content { background: var(--surface-color); border-radius: var(--radius-xl); width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-lg); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); h2 { font-size: 1.25rem; font-weight: 600; margin: 0; } }
    .modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary); padding: 0.25rem; &:hover { color: var(--text-primary); } }
    .modal-body { padding: 1.5rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); }
    
    .detail-section { margin-bottom: 1.5rem; &:last-child { margin-bottom: 0; } h3 { font-size: 1rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--text-primary); } }
    .detail-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem; }
    .detail-label { font-size: 0.875rem; color: var(--text-secondary); }
    .detail-value { font-size: 0.875rem; color: var(--text-primary); font-weight: 500; }
    .sector-badge-lg { background: var(--primary-light); color: var(--primary-color); padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
    
    .form-group { margin-bottom: 1rem; label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.375rem; color: var(--text-primary); } }
    .form-select { width: 100%; padding: 0.625rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.875rem; background: var(--surface-color); color: var(--text-primary); min-height: 44px; }
    
    .btn-primary { padding: 0.625rem 1.25rem; background: var(--primary-color); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-size: 0.875rem; font-weight: 500; &:hover:not(:disabled) { background: var(--primary-dark); } &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .btn-secondary { padding: 0.625rem 1.25rem; background: transparent; color: var(--text-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-md); cursor: pointer; font-size: 0.875rem; font-weight: 500; &:hover { background: var(--border-color); } }

    @media (max-width: 768px) { .page-header h1 { font-size: 1.5rem; } .filters-bar .filter-select { max-width: 100%; } .visitas-grid { gap: 0.75rem; } .visita-card { padding: 0.875rem; } }
    @media (min-width: 769px) { .visitas-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1200px) { .visitas-grid { grid-template-columns: repeat(3, 1fr); } }
  `]
})
export class VisitaListComponent implements OnInit {
  visitaService = inject(VisitaService);
  userService = inject(UserService);
  
  visitas = signal<Visita[]>([]);
  users = signal<User[]>([]);
  selectedVisita = signal<Visita | null>(null);
  saving = signal(false);
  
  visitante1Id = '';
  visitante2Id = '';
  
  estadoFilter = '';
  
  ngOnInit() {
    this.loadVisitas();
    this.loadUsers();
  }
  
  loadVisitas() {
    this.visitaService.loadVisitas({ estado: this.estadoFilter || undefined }).subscribe({
      next: (res) => this.visitas.set(res.data)
    });
  }
  
  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (users) => this.users.set(users)
    });
  }
  
  openDetail(visita: Visita) {
    this.selectedVisita.set(visita);
    // Set current values
    if (visita.visitante_1_id && visita.visitante_1_id !== '00000000-0000-0000-0000-000000000000') {
      this.visitante1Id = visita.visitante_1_id;
    } else {
      this.visitante1Id = '';
    }
    if (visita.visitante_2_id && visita.visitante_2_id !== '00000000-0000-0000-0000-000000000000') {
      this.visitante2Id = visita.visitante_2_id;
    } else {
      this.visitante2Id = '';
    }
  }
  
  closeModal() {
    this.selectedVisita.set(null);
    this.visitante1Id = '';
    this.visitante2Id = '';
  }
  
  saveVisitantes() {
    const visita = this.selectedVisita();
    if (!visita) return;
    
    this.saving.set(true);
    
    const updates: any = {};
    if (this.visitante1Id) {
      updates.visitante_1_id = this.visitante1Id;
    }
    if (this.visitante2Id) {
      updates.visitante_2_id = this.visitante2Id;
    }
    
    if (Object.keys(updates).length === 0) {
      this.saving.set(false);
      return;
    }
    
    this.visitaService.updateVisita(visita.id, updates).subscribe({
      next: (updated) => {
        // Update local state
        this.visitas.update(visitas => 
          visitas.map(v => v.id === visita.id ? updated : v)
        );
        this.saving.set(false);
        this.closeModal();
      },
      error: () => {
        this.saving.set(false);
        alert('Error al guardar');
      }
    });
  }
  
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES');
  }
  
  getEstadoClass(estado: string): string {
    const classes: Record<string, string> = { PROGRAMADA: 'badge-warning', REALIZADA: 'badge-success', CANCELADA: 'badge-danger' };
    return classes[estado] || '';
  }
  
  getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = { PROGRAMADA: 'Programada', REALIZADA: 'Realizada', CANCELADA: 'Cancelada' };
    return labels[estado] || estado;
  }
}
