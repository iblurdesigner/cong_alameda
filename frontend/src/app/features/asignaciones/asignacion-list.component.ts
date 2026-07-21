import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AsignacionService, TipoAsignacion, Asignacion } from '../../core/services/asignacion.service';
import { SemanaService, Semana } from '../../core/services/semana.service';
import { AuthService } from '../../core/services/auth.service';
import { GrupoService, Grupo } from '../../core/services/grupo.service';

@Component({
  selector: 'app-asignacion-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="header-content">
          <h1>Asignaciones Semanales</h1>
          <p>Programa las asignaciones internas: acomodadores, parqueadero, micrófono, plataforma</p>
        </div>
        @if (authService.isSuperintendente()) {
          <button class="btn btn-primary" (click)="openBulkModal()">
            ✏️ Programar Semana
          </button>
        }
      </header>
      
      <div class="filters-bar">
        <select [(ngModel)]="selectedSemanaId" (ngModelChange)="loadSemana()">
          <option value="">Seleccionar semana...</option>
          @for (semana of semanas(); track semana.id) {
            <option [value]="semana.id">{{ semana.nombre }}</option>
          }
        </select>
      </div>
      
      @if (asignacionService.loading()) {
        <div class="loading">Cargando...</div>
      } @else if (!selectedSemanaId) {
        <div class="empty-state">
          <p>Selecciona una semana para ver sus asignaciones</p>
        </div>
      } @else if (semanaActual) {
        <div class="semana-info">
          <h2>{{ semanaActual.nombre }}</h2>
          <span class="date-range">
            {{ formatDate(semanaActual.fecha_inicio) }} - {{ formatDate(semanaActual.fecha_fin) }}
          </span>
        </div>
        
        <div class="dias-grid">
          @for (dia of semanaActual.dias; track dia.id) {
            <div class="dia-card">
              <div class="dia-header">
                <h3>{{ getDiaNombre(dia.dia_semana) }}</h3>
                <span class="fecha">{{ formatDiaFecha(dia.dia_semana, semanaActual.fecha_inicio) }}</span>
              </div>
              
              <div class="asignaciones-list">
                @for (tipo of tipos(); track tipo.id) {
                  <ng-container *ngTemplateOutlet="asignacionItem; context: {tipo: tipo, dia: dia}"></ng-container>
                }
              </div>
            </div>
          }
        </div>
        
        <ng-template #asignacionItem let-tipo="tipo" let-dia="dia">
          <ng-container *ngIf="getAsignacionForDiaAndTipo(dia.dia_semana, tipo.id) as asignacion">
            <div class="asignacion-item" [class.empty]="!asignacion">
            <div class="tipo-info">
              <span class="icono">{{ tipo.icono || '📋' }}</span>
              <span class="nombre">{{ getTipoNombre(tipo.nombre) }}</span>
            </div>
            @if (asignacion) {
              <div class="persona-asignada">
                <span class="nombre">{{ asignacion.user?.nombre || 'Asignado' }}</span>
                @if (authService.isSuperintendente()) {
                  <button class="btn-icon" (click)="editAsignacion(asignacion, tipo, dia.dia_semana)">
                    ✏️
                  </button>
                }
              </div>
            } @else {
              <div class="no-asignado">
                @if (authService.isSuperintendente()) {
                  <button class="btn btn-outline btn-sm" (click)="openAssignModal(tipo, dia.dia_semana)">
                    Asignar
                  </button>
                } @else {
                  <span>Sin asignar</span>
                }
              </div>
            }
          </div>
          </ng-container>
        </ng-template>
      }
    </div>

    <!-- Assign Modal -->
    @if (showAssignModal) {
      <div class="modal-overlay" (click)="closeAssignModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Asignar - {{ editingTipo ? getTipoNombre(editingTipo.nombre) : '' }}</h2>
            <button class="btn-close" (click)="closeAssignModal()">×</button>
          </div>
          <div class="modal-body">
            @if (assignForm.tipo_id === 'b10c74a7-ba4c-4a71-b639-1248aa404eb4') {
              <!-- ONLY group selector for ASEO_SALON -->
              <div class="form-group">
                <label for="grupoSelect">Grupo *</label>
                <select id="grupoSelect" [(ngModel)]="assignForm.grupo_id">
                  <option value="">Seleccionar grupo...</option>
                  @for (grupo of grupos(); track grupo.id) {
                    <option [value]="grupo.id">{{ grupo.nombre }} ({{ grupo.numero }})</option>
                  }
                </select>
              </div>
            } @else {
              <!-- ONLY person selector for other types -->
              <div class="form-group">
                <label for="persona">Persona *</label>
                <select id="persona" [(ngModel)]="assignForm.user_id">
                  <option value="">Seleccionar persona...</option>
                  @for (user of users(); track user.id) {
                    <option [value]="user.id">{{ user.nombre }} ({{ user.rol }})</option>
                  }
                </select>
              </div>
            }
            <div class="form-group">
              <label for="observaciones">Observaciones</label>
              <textarea id="observaciones" [(ngModel)]="assignForm.observaciones" rows="2"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeAssignModal()">Cancelar</button>
            <button 
              class="btn btn-primary" 
              (click)="saveAsignacion()"
              [disabled]="!assignForm.user_id && !assignForm.grupo_id"
            >
              Asignar
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Bulk Assign Modal -->
    @if (showBulkModal) {
      <div class="modal-overlay" (click)="closeBulkModal()">
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Programar Semana Completa</h2>
            <button class="btn-close" (click)="closeBulkModal()">×</button>
          </div>
          <div class="modal-body">
            <p class="modal-info">
              Esta acción reemplazará todas las asignaciones existentes de la semana seleccionada.
            </p>
            @for (dia of bulkDias; track dia.dia) {
              <div class="bulk-dia">
                <h4>{{ dia.nombre }}</h4>
                <div class="bulk-asignaciones">
                  @for (tipo of tipos(); track tipo.id) {
                    <div class="bulk-item">
                      <label>{{ tipo.icono }} {{ getTipoNombre(tipo.nombre) }}</label>
                      <select [(ngModel)]="dia.asignaciones[tipo.id]">
                        <option value="">Sin asignar</option>
                        @for (user of users(); track user.id) {
                          <option [value]="user.id">{{ user.nombre }}</option>
                        }
                      </select>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeBulkModal()">Cancelar</button>
            <button class="btn btn-primary" (click)="saveBulkAsignaciones()">
              Guardar Semana
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-container { max-width: 1200px; margin: 0 auto; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h1 { font-size: 1.75rem; font-weight: 700; }
    .page-header p { color: var(--text-secondary); margin-top: 0.25rem; }
    .filters-bar { margin-bottom: 1.5rem; }
    .filters-bar select { padding: 0.625rem 0.875rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: white; min-width: 250px; }
    .loading, .empty-state { text-align: center; padding: 3rem; color: var(--text-secondary); }
    .semana-info { margin-bottom: 1.5rem; }
    .semana-info h2 { margin: 0; font-size: 1.25rem; }
    .semana-info .date-range { color: var(--text-secondary); font-size: 0.875rem; }
    .dias-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
    .dia-card { background: white; border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden; }
    .dia-header { background: var(--primary-color); color: white; padding: 0.75rem 1rem; display: flex; justify-content: space-between; align-items: center; }
    .dia-header h3 { margin: 0; font-size: 1rem; font-weight: 600; }
    .dia-header .fecha { font-size: 0.75rem; opacity: 0.9; }
    .asignaciones-list { padding: 0.75rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .asignacion-item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; border-radius: var(--radius-sm); background: var(--background-color); }
    .asignacion-item.empty { opacity: 0.6; }
    .tipo-info { display: flex; align-items: center; gap: 0.5rem; }
    .tipo-info .icono { font-size: 1.125rem; }
    .tipo-info .nombre { font-size: 0.875rem; font-weight: 500; }
    .persona-asignada { display: flex; align-items: center; gap: 0.5rem; }
    .persona-asignada .nombre { font-size: 0.875rem; color: var(--primary-color); }
    .no-asignado { font-size: 0.75rem; color: var(--text-secondary); }
    .btn-icon { padding: 0.25rem 0.375rem; background: transparent; border: 1px solid var(--border-color); border-radius: var(--radius-sm); cursor: pointer; font-size: 0.75rem; }
    .btn-icon:hover { background: white; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: white; border-radius: var(--radius-lg); width: 90%; max-width: 450px; max-height: 90vh; overflow-y: auto; }
    .modal.modal-lg { max-width: 700px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); }
    .modal-header h2 { margin: 0; font-size: 1.25rem; }
    .btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; padding: 0; line-height: 1; }
    .modal-body { padding: 1.5rem; }
    .modal-body .modal-info { background: #fef3c7; border: 1px solid #fcd34d; border-radius: var(--radius-sm); padding: 0.75rem; font-size: 0.875rem; margin-bottom: 1rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
    .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.625rem 0.875rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: var(--primary-color); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
    .bulk-dia { margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); }
    .bulk-dia:last-child { border-bottom: none; }
    .bulk-dia h4 { margin: 0 0 0.75rem 0; font-size: 1rem; color: var(--primary-color); }
    .bulk-asignaciones { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
    .bulk-item label { display: block; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem; }
    .bulk-item select { width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.875rem; }
  `]
})
export class AsignacionListComponent implements OnInit {
  asignacionService = inject(AsignacionService);
  semanaService = inject(SemanaService);
  authService = inject(AuthService);
  grupoService = inject(GrupoService);
  
  semanas = signal<Semana[]>([]);
  users = signal<any[]>([]);
  tipos = signal<TipoAsignacion[]>([]);
  grupos = signal<Grupo[]>([]);
  semanaActual: any = null;
  
  selectedSemanaId = '';
  showAssignModal = false;
  showBulkModal = false;
  editingTipo: TipoAsignacion | null = null;
  editingDiaSemana = -1;
  editingAsignacion: Asignacion | null = null;
  
  assignForm = { user_id: '', grupo_id: '', tipo_id: '', observaciones: '' };
  bulkDias: { dia: number; nombre: string; asignaciones: Record<string, string> }[] = [];
  
  private asignacionMap = signal<Map<string, Asignacion>>(new Map());
  
  ngOnInit() {
    this.loadSemanas();
    this.loadTipos();
    this.loadUsers();
    this.loadGrupos();
  }
  
  loadGrupos() {
    this.grupoService.loadGrupos().subscribe({
      next: (res: any) => this.grupos.set(res.data)
    });
  }
  
  loadSemanas() {
    this.semanaService.loadSemanas().subscribe({
      next: (res) => this.semanas.set(res.data)
    });
  }
  
  loadTipos() {
    this.asignacionService.loadTiposAsignacion().subscribe();
  }
  
  loadUsers() {
    this.authService.getUsers().subscribe({
      next: (res: any) => this.users.set(res)
    });
  }
  
  loadSemana() {
    if (!this.selectedSemanaId) return;
    
    this.asignacionService.loadAsignacionesBySemana(this.selectedSemanaId).subscribe({
      next: (data: any) => {
        this.semanaActual = data;
        const map = new Map<string, Asignacion>();
        data.asignaciones?.forEach((a: Asignacion) => {
          const key = `${a.dia_semana}-${a.tipo_asignacion_id}`;
          map.set(key, a);
        });
        this.asignacionMap.set(map);
      }
    });
  }
  
  getAsignacionForDiaAndTipo(diaSemana: number, tipoId: string): Asignacion | null {
    const map = this.asignacionMap();
    return map.get(`${diaSemana}-${tipoId}`) || null;
  }
  
  getDiaNombre(diaSemana: number): string {
    const nombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return nombres[diaSemana] || '';
  }
  
  getTipoNombre(nombre: string): string {
    const nombres: Record<string, string> = {
      'ACOMODADOR_SALON': 'Acomodador',
      'PARQUEADERO': 'Parqueadero',
      'MICROFONO': 'Micrófono',
      'PLATAFORMA': 'Plataforma'
    };
    return nombres[nombre] || nombre;
  }
  
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
  
  formatDiaFecha(diaSemana: number, fechaInicio: string): string {
    const start = new Date(fechaInicio);
    const fecha = new Date(start);
    fecha.setDate(start.getDate() + diaSemana);
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
  
  openAssignModal(tipo: TipoAsignacion, diaSemana: number) {
    this.editingTipo = tipo;
    this.editingDiaSemana = diaSemana;
    this.editingAsignacion = null;
    this.assignForm = { user_id: '', grupo_id: '', tipo_id: tipo.id, observaciones: '' };
    this.showAssignModal = true;
  }
  
  editAsignacion(asignacion: Asignacion, tipo: TipoAsignacion, diaSemana: number) {
    this.editingTipo = tipo;
    this.editingDiaSemana = diaSemana;
    this.editingAsignacion = asignacion;
    this.assignForm = {
      user_id: asignacion.user_id || '',
      grupo_id: asignacion.grupo_id || '',
      tipo_id: tipo.id,
      observaciones: asignacion.observaciones || ''
    };
    this.showAssignModal = true;
  }
  
  closeAssignModal() {
    this.showAssignModal = false;
    this.editingTipo = null;
    this.editingDiaSemana = -1;
    this.editingAsignacion = null;
  }
  
  saveAsignacion() {
    if (!this.assignForm.user_id && !this.assignForm.grupo_id) return;
    
    const asignacion = {
      semana_id: this.selectedSemanaId,
      tipo_asignacion_id: this.editingTipo!.id,
      user_id: this.assignForm.user_id || undefined,
      grupo_id: this.assignForm.grupo_id || undefined,
      dia_semana: this.editingDiaSemana,
      observaciones: this.assignForm.observaciones || undefined
    };
    
    this.asignacionService.createAsignacion(asignacion as any).subscribe({
      next: () => {
        this.loadSemana();
        this.closeAssignModal();
      }
    });
  }

  onTipoChange() {
    // Changing the assignment type must clear both person and group so a
    // previously selected value from the other branch is never submitted.
    this.assignForm.user_id = '';
    this.assignForm.grupo_id = '';
  }
  
  openBulkModal() {
    if (!this.selectedSemanaId) {
      alert('Selecciona una semana primero');
      return;
    }
    this.bulkDias = [0, 1, 2, 3, 4, 5, 6].map(dia => ({ dia, nombre: this.getDiaNombre(dia), asignaciones: {} }));
    this.showBulkModal = true;
  }
  
  closeBulkModal() {
    this.showBulkModal = false;
  }
  
  saveBulkAsignaciones() {
    const asignaciones: any[] = [];
    this.bulkDias.forEach(dia => {
      this.tipos().forEach(tipo => {
        const userId = dia.asignaciones[tipo.id];
        if (userId) {
          asignaciones.push({ tipo_asignacion_id: tipo.id, user_id: userId, dia_semana: dia.dia });
        }
      });
    });
    
    this.asignacionService.bulkCreateAsignaciones(this.selectedSemanaId, asignaciones).subscribe({
      next: () => {
        this.loadSemana();
        this.closeBulkModal();
      }
    });
  }
}
