import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { VisitaService, Visita, CasaInfo } from '../../../core/services/visita.service';
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
          <p class="header-subtitle">Programaci├│n y seguimiento de visitas</p>
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
          <div class="empty-icon">≡ƒôà</div>
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
                  ≡ƒôì {{ visita.casa.calle_principal }} {{ visita.casa.numeracion }}
                  @if (visita.casa.calle_secundaria) {
                    , {{ visita.casa.calle_secundaria }}
                  }
                  <span class="sector-badge">{{ visita.casa.sector }}</span>
                </div>
                <!-- Foto de la casa si existe -->
                @if (visita.casa.foto_url) {
                  <img [src]="visita.casa.foto_url" alt="Foto casa" class="casa-thumbnail" />
                } @else {
                  <div class="casa-no-foto">
                    <span>≡ƒô╖ Sin foto</span>
                  </div>
                }
                @if (visita.casa.referencia) {
                  <p class="visita-ref">≡ƒô¥ {{ visita.casa.referencia }}</p>
                }
                
                <!-- Mapa embebido si hay coordenadas -->
                @if (hasExactLocation(visita.casa)) {
                  <div class="visita-map">
                    <iframe 
                      [src]="getGoogleMapsEmbedUrl(visita.casa)"
                      width="100%" 
                      height="120" 
                      style="border:0; border-radius: 8px;" 
                      allowfullscreen 
                      loading="lazy"
                      referrerpolicy="no-referrer-when-downgrade">
                    </iframe>
                    <a [href]="getExactLocationUrl(visita.casa)" target="_blank" class="btn-maps">
                      ≡ƒôì Ver en Google Maps
                    </a>
                  </div>
                }
              }
              
              @if (visita.fecha_realizada) {
                <p class="visita-realizada">Γ£à Realizada: {{ formatDate(visita.fecha_realizada) }}</p>
              }
              
              @if (visita.observaciones) {
                <p class="visita-obs">{{ visita.observaciones }}</p>
              }
              
              @if (visita.desea_seguir_recibiendo !== undefined) {
                <p class="visita-resp">
                  {{ visita.desea_seguir_recibiendo ? 'Γ£à Desea visitas' : 'Γ¥î No desea visitas' }}
                </p>
              }

              <button class="btn-ver" (click)="openDetail(visita)">≡ƒæü∩╕Å Ver</button>
            </div>
          }
        </div>
      }
    </div>

    <!-- Modal de Detalles -->
    @if (selectedVisit()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Detalles de la Visita</h2>
            <button class="modal-close" (click)="closeModal()">Γ£ò</button>
          </div>
          
          <div class="modal-body">
            <!-- Info de la Casa -->
            @if (selectedVisit()!.casa) {
              <div class="detail-section">
                <h3>≡ƒÅá Informaci├│n de la Casa</h3>
                <!-- Foto de la casa -->
                <div class="detail-foto-container">
                  @if (selectedVisit()!.casa!.foto_url) {
                    <img [src]="selectedVisit()!.casa!.foto_url" alt="Foto casa" class="detail-foto" />
                  } @else {
                    <div class="detail-foto-placeholder">
                      <span class="placeholder-icon">≡ƒÅá</span>
                      <span class="placeholder-text">Sin foto</span>
                    </div>
                  }
                </div>
                <div class="detail-row">
                  <span class="detail-label">Direcci├│n:</span>
                  <span class="detail-value">
                    {{ selectedVisit()!.casa!.calle_principal }} {{ selectedVisit()!.casa!.numeracion }}
                    @if (selectedVisit()!.casa!.calle_secundaria) {
                      , {{ selectedVisit()!.casa!.calle_secundaria }}
                    }
                  </span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Sector:</span>
                  <span class="detail-value sector-badge-lg">{{ selectedVisit()!.casa!.sector }}</span>
                </div>
                @if (selectedVisit()!.casa!.referencia) {
                  <div class="detail-row">
                    <span class="detail-label">Referencia:</span>
                    <span class="detail-value">{{ selectedVisit()!.casa!.referencia }}</span>
                  </div>
                }
                @if (hasExactLocation(selectedVisit()!.casa)) {
                  <div class="detail-map">
                    <iframe 
                      [src]="getGoogleMapsEmbedUrl(selectedVisit()!.casa!)"
                      width="100%" 
                      height="150" 
                      style="border:0; border-radius: 8px;" 
                      allowfullscreen 
                      loading="lazy"
                      referrerpolicy="no-referrer-when-downgrade">
                    </iframe>
                    <a [href]="getExactLocationUrl(selectedVisit()!.casa!)" target="_blank" class="btn-maps">
                      ≡ƒôì Ver en Google Maps
                    </a>
                  </div>
                }
              </div>
            }

            <!-- Programaci├│n -->
            <div class="detail-section">
              <h3>≡ƒôà Programaci├│n</h3>
              <div class="detail-row">
                <span class="detail-label">Fecha programada:</span>
                <span class="detail-value">{{ formatDate(selectedVisit()!.fecha_programada) }}</span>
              </div>
              <div class="form-group">
                <label>Estado:</label>
                <select [(ngModel)]="estado" class="form-select">
                  <option value="PROGRAMADA">Programada</option>
                  <option value="REALIZADA">Realizada</option>
                  <option value="CANCELADA">Cancelada</option>
                </select>
              </div>
              @if (estado === 'REALIZADA') {
                <div class="form-group">
                  <label>Fecha de realizaci├│n:</label>
                  <input type="date" [(ngModel)]="fechaRealizada" class="form-input" />
                </div>
              }
            </div>

            @if (estado === 'REALIZADA') {
              <div class="detail-section">
                <h3>Γ£à Resultado de la Visita</h3>
                <div class="form-group">
                  <label>Observaciones:</label>
                  <textarea [(ngModel)]="observaciones" class="form-textarea" rows="3" placeholder="Observaciones de la visita..."></textarea>
                </div>
                <div class="form-group">
                  <label>┬┐Desea seguir recibiendo visitas?</label>
                  <select [(ngModel)]="deseaSeguirRecibiendo" class="form-select">
                    <option value="">No especificado</option>
                    <option value="true">S├¡, desea seguir recibiendo</option>
                    <option value="false">No, no desea recibir m├ís</option>
                  </select>
                </div>
              </div>
            }

            <!-- Asignaci├│n de Visitantes -->
            <div class="detail-section">
              <h3>≡ƒæÑ Asignar Visitantes</h3>
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
              {{ saving() ? 'Guardando...' : '≡ƒÆ╛ Guardar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-container { max-width: 1000px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; h1 { font-size: 1.75rem; font-weight: 700; } .header-subtitle { color: var(--text-secondary); margin-top: 0.25rem; } }
    .filters-bar { margin-bottom: 1.5rem; .filter-select { padding: 0.625rem 2rem 0.625rem 0.875rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--surface-color); color: var(--text-primary); font-size: 1rem; min-height: 44px; width: 100%; max-width: 300px; cursor: pointer; appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.75rem center; } }
    .loading, .empty-state { text-align: center; padding: 3rem; color: var(--text-secondary); }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; .empty-icon { font-size: 3rem; opacity: 0.5; } }
    .visitas-grid { display: grid; gap: 1rem; grid-template-columns: 1fr; }
    .visita-card { background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1rem; transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.05); &:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); transform: translateY(-2px); } }
    .visita-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap; gap: 0.5rem; }
    .visita-date { font-weight: 600; font-size: 1rem; }
    .visita-address { font-size: 0.9rem; color: var(--text-primary); margin: 0.5rem 0; font-weight: 500; }
    .sector-badge { display: inline-block; background: var(--primary-light); color: var(--primary-color); padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 500; margin-left: 0.5rem; }
    .sector-badge-lg { background: var(--primary-light); color: var(--primary-color); padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
    .visita-ref { font-size: 0.8rem; color: var(--text-secondary); margin: 0.25rem 0; font-style: italic; }
    .visita-map { margin-top: 0.5rem; .btn-maps { display: block; text-align: center; padding: 0.375rem 0.75rem; background: var(--primary-light); color: var(--primary-color); border-radius: var(--radius-md); font-size: 0.75rem; font-weight: 500; margin-top: 0.375rem; text-decoration: none; &:hover { background: var(--primary-color); color: white; } } }
    .casa-thumbnail { width: 100%; max-height: 150px; object-fit: cover; border-radius: var(--radius-md); margin-top: 0.5rem; }
    .casa-no-foto { width: 100%; height: 80px; background: var(--border-color); border-radius: var(--radius-md); margin-top: 0.5rem; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; color: var(--text-secondary); }
    .visita-realizada, .visita-obs, .visita-resp { font-size: 0.875rem; color: var(--text-secondary); margin: 0.25rem 0; }
    .btn-ver { margin-top: 0.75rem; padding: 0.5rem 1rem; background: var(--primary-color); color: white; border: none; border-radius: var(--radius-md); cursor: pointer; font-size: 0.875rem; font-weight: 500; width: 100%; &:hover { background: var(--primary-dark); } }
    .badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; min-height: 28px; display: inline-flex; align-items: center; }
    .badge-warning { background: rgba(245, 158, 11, 0.1); color: var(--warning-color); }
    .badge-success { background: rgba(16, 185, 129, 0.1); color: var(--success-color); }
    .badge-danger { background: rgba(239, 68, 68, 0.1); color: var(--danger-color); }
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
    .detail-foto { width: 100%; max-height: 250px; object-fit: cover; border-radius: var(--radius-md); margin-bottom: 0.75rem; }
    .detail-foto-container { margin-bottom: 0.75rem; }
    .detail-foto-placeholder { width: 100%; height: 150px; background: var(--border-color); border-radius: var(--radius-md); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; color: var(--text-secondary); .placeholder-icon { font-size: 2rem; opacity: 0.5; } .placeholder-text { font-size: 0.875rem; } }
    .detail-map { margin-top: 0.75rem; .btn-maps { display: block; text-align: center; padding: 0.375rem 0.75rem; background: var(--primary-light); color: var(--primary-color); border-radius: var(--radius-md); font-size: 0.75rem; font-weight: 500; margin-top: 0.375rem; text-decoration: none; &:hover { background: var(--primary-color); color: white; } } }
    .form-group { margin-bottom: 1rem; label { display: block; font-size: 0.875rem; font-weight: 500; margin-bottom: 0.375rem; color: var(--text-primary); } }
    .form-select, .form-input, .form-textarea { width: 100%; padding: 0.625rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.875rem; background: var(--surface-color); color: var(--text-primary); min-height: 44px; }
    .form-textarea { resize: vertical; min-height: 80px; }
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
  private sanitizer = inject(DomSanitizer);
  
  visitas = signal<Visita[]>([]);
  users = signal<User[]>([]);
  selectedVisit = signal<Visita | null>(null);
  saving = signal(false);
  
  visitante1Id = '';
  visitante2Id = '';
  estado = '';
  fechaRealizada = '';
  observaciones = '';
  deseaSeguirRecibiendo = '';
  
  estadoFilter = '';
  
  ngOnInit() {
    this.loadVisitas();
    this.loadUsers();
  }
  
  loadVisitas() {
    this.visitaService.loadVisitas({ estado: this.estadoFilter || undefined }).subscribe({
      next: (res: { data: Visita[] }) => this.visitas.set(res.data)
    });
  }
  
  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (users: User[]) => this.users.set(users)
    });
  }
  
  openDetail(visita: Visita) {
    this.selectedVisit.set(visita);
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
    this.estado = visita.estado;
    this.fechaRealizada = visita.fecha_realizada || '';
    this.observaciones = visita.observaciones || '';
    if (visita.desea_seguir_recibiendo !== undefined) {
      this.deseaSeguirRecibiendo = visita.desea_seguir_recibiendo ? 'true' : 'false';
    } else {
      this.deseaSeguirRecibiendo = '';
    }
  }
  
  closeModal() {
    this.selectedVisit.set(null);
    this.visitante1Id = '';
    this.visitante2Id = '';
    this.estado = '';
    this.fechaRealizada = '';
    this.observaciones = '';
    this.deseaSeguirRecibiendo = '';
  }
  
  saveVisitantes() {
    const visita = this.selectedVisit();
    if (!visita) return;
    
    this.saving.set(true);
    
    const updates: Partial<Visita> = {};
    
    if (this.estado && this.estado !== visita.estado) {
      updates.estado = this.estado as Visita['estado'];
    }
    if (this.visitante1Id) {
      updates.visitante_1_id = this.visitante1Id;
    }
    if (this.visitante2Id) {
      updates.visitante_2_id = this.visitante2Id;
    }
    if (this.fechaRealizada) {
      updates.fecha_realizada = this.fechaRealizada;
    }
    if (this.observaciones) {
      updates.observaciones = this.observaciones;
    }
    if (this.deseaSeguirRecibiendo !== '') {
      updates.desea_seguir_recibiendo = this.deseaSeguirRecibiendo === 'true';
    }
    
    if (Object.keys(updates).length === 0) {
      this.saving.set(false);
      return;
    }
    
    this.visitaService.updateVisita(visita.id, updates).subscribe({
      next: (updated: Visita) => {
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
  
  // === Mapa methods ===
  hasExactLocation(casa: CasaInfo | undefined): boolean {
    if (!casa) return false;
    return !!(casa.latitud && casa.longitud);
  }
  
  getExactLocationUrl(casa: CasaInfo): string {
    if (casa.latitud && casa.longitud) {
      return `https://www.google.com/maps?q=${casa.latitud},${casa.longitud}&z=17`;
    }
    return '';
  }
  
  getGoogleMapsEmbedUrl(casa: CasaInfo): SafeResourceUrl {
    if (casa.latitud && casa.longitud) {
      const coords = `${casa.latitud},${casa.longitud}`;
      const url = `https://www.google.com/maps?q=${encodeURIComponent(coords)}&output=embed&z=16`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
    return '';
  }
}
