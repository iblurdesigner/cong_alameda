import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AsignacionService, TipoAsignacion, Asignacion, SemanaConAsignaciones } from '../../core/services/asignacion.service';
import { SemanaService, Semana } from '../../core/services/semana.service';
import { AuthService } from '../../core/services/auth.service';
import { GrupoService, Grupo } from '../../core/services/grupo.service';

@Component({
  selector: 'app-semana-editar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="semana-editar-page">
      <!-- Header -->
      <header class="header">
        <div class="header-left">
          <button class="btn-back" (click)="goBack()">
            ← Volver
          </button>
          <div class="title-section">
            <h1>📅 {{ semana()?.nombre || 'Semana' }}</h1>
            <p class="date-range">{{ formatDateRange() }}</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" (click)="exportToPDF()">
            📄 Exportar PDF
          </button>
        </div>
      </header>

      <!-- Week Grid - 7 Days -->
      <div class="week-grid">
        @for (day of weekDays; track day.diaSemana) {
          <div class="day-column" [class.weekend]="day.diaSemana === 0 || day.diaSemana === 6">
            <div class="day-header">
              <span class="day-name">{{ getDiaNombre(day.diaSemana) }}</span>
              <span class="day-date">{{ day.fecha }}</span>
            </div>
            
            <div class="day-assignments">
              @for (tipo of tipos(); track tipo.id) {
                @if (getAsignacionForDay(day.diaSemana, tipo.id); as asignacion) {
                  <div class="assignment-card" [class.empty]="!asignacion.user && !asignacion.grupo">
                    <div class="assignment-type">
                      <span class="icono">{{ tipo.icono || '📋' }}</span>
                      <span class="nombre">{{ getTipoNombre(tipo.nombre) }}</span>
                    </div>
                    @if (asignacion.user || asignacion.grupo) {
                      <div class="assignment-person">
                        <span class="person-name">
                          {{ asignacion.user?.nombre || asignacion.grupo?.nombre || 'Asignado' }}
                          @if (asignacion.grupo) {
                            <span class="grupo-badge">Grupo</span>
                          }
                        </span>
                        @if (authService.isSuperintendente() || authService.isSuperAdmin()) {
                          <button class="btn-icon" (click)="editAsignacion(asignacion, tipo, day.diaSemana)">
                            ✏️
                          </button>
                        }
                      </div>
                    } @else {
                      <div class="no-assignment">
                        @if (authService.isSuperintendente() || authService.isSuperAdmin()) {
                          <button class="btn btn-outline btn-sm" (click)="openAssignModal(tipo, day.diaSemana)">
                            Asignar
                          </button>
                        } @else {
                          <span>Sin asignar</span>
                        }
                      </div>
                    }
                  </div>
                } @else {
                  <div class="assignment-card empty">
                    <div class="assignment-type">
                      <span class="icono">{{ tipo.icono || '📋' }}</span>
                      <span class="nombre">{{ getTipoNombre(tipo.nombre) }}</span>
                    </div>
                    <div class="no-assignment">
                      @if (authService.isSuperintendente() || authService.isSuperAdmin()) {
                        <button class="btn btn-outline btn-sm" (click)="openAssignModal(tipo, day.diaSemana)">
                          Asignar
                        </button>
                      } @else {
                        <span>Sin asignar</span>
                      }
                    </div>
                  </div>
                }
              }
            </div>
          </div>
        }
      </div>

      <!-- Assign Modal -->
      @if (showAssignModal) {
        <div class="modal-overlay" (click)="closeAssignModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ assignForm.isEditing ? '✏️ Editar Asignación' : 'Agregar Persona' }}</h2>
              <button class="btn-close" (click)="closeAssignModal()">×</button>
            </div>
            <div class="modal-body">
              @if (assignForm.isEditing && editingAsignacion) {
                <div class="current-assignment-info">
                  <p><strong>Asignación actual:</strong> 
                    {{ editingAsignacion.user?.nombre || editingAsignacion.grupo?.nombre || 'Sin asignar' }}
                    @if (editingAsignacion.grupo) {
                      <span class="grupo-badge">Grupo</span>
                    }
                  </p>
                </div>
              }

              <div class="form-group">
                <label for="tipoAsignacion">Tipo de Asignación *</label>
                <select id="tipoAsignacion" [(ngModel)]="assignForm.tipo_id" disabled>
                  @for (tipo of tipos(); track tipo.id) {
                    <option [value]="tipo.id">{{ tipo.icono }} {{ getTipoNombre(tipo.nombre) }}</option>
                  }
                </select>
              </div>

              @if (assignForm.tipo_id === 'b10c74a7-ba4c-4a71-b639-1248aa404eb4') {
                <div class="form-group">
                  <label for="grupoSelect">Seleccionar Grupo:</label>
                  <select id="grupoSelect" [(ngModel)]="assignForm.grupo_id">
                    <option value="">Seleccionar grupo...</option>
                    @for (grupo of grupos(); track grupo.id) {
                      <option [value]="grupo.id">{{ grupo.nombre }} ({{ grupo.numero }})</option>
                    }
                  </select>
                </div>
              }
              
              <div class="form-group">
                <label for="nuevaPersona">{{ assignForm.tipo_id === 'b10c74a7-ba4c-4a71-b639-1248aa404eb4' ? 'O seleccionar Persona:' : 'Seleccionar Persona:' }}</label>
                <select id="nuevaPersona" [(ngModel)]="assignForm.user_id">
                  <option value="">Seleccionar persona...</option>
                  @for (user of users(); track user.id) {
                    <option [value]="user.id">{{ user.nombre }} ({{ user.rol }})</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label for="observaciones">Observaciones:</label>
                <textarea id="observaciones" [(ngModel)]="assignForm.observaciones" rows="2" 
                  placeholder="Observaciones opcionales..."></textarea>
              </div>
            </div>
            <div class="modal-footer">
              @if (assignForm.isEditing) {
                <button class="btn btn-danger" (click)="deleteAsignacion()">🗑️ Eliminar</button>
              }
              <button class="btn btn-outline" (click)="closeAssignModal()">Cancelar</button>
              <button 
                class="btn btn-primary" 
                (click)="saveAsignacion()"
                [disabled]="!assignForm.user_id && !assignForm.grupo_id"
              >
                {{ assignForm.isEditing ? '💾 Guardar Cambios' : '➕ Agregar' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .semana-editar-page {
      padding: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }
    .header-left {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }
    .btn-back {
      background: transparent;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.5rem 1rem;
      cursor: pointer;
      color: var(--text-primary);
      font-size: 0.875rem;
    }
    .btn-back:hover {
      background: var(--primary-light);
      border-color: var(--primary-color);
    }
    .title-section h1 {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
    }
    .date-range {
      color: var(--text-secondary);
      margin-top: 0.25rem;
    }
    
    /* Week Grid */
    .week-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0.75rem;
    }
    .day-column {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }
    .day-column.weekend {
      border-color: var(--dot-weekend);
      border-width: 2px;
    }
    .day-header {
      background: var(--primary-color);
      color: white;
      padding: 0.75rem;
      text-align: center;
    }
    .day-column.weekend .day-header {
      background: var(--dot-weekend);
    }
    .day-name {
      display: block;
      font-weight: 600;
      font-size: 0.875rem;
    }
    .day-date {
      display: block;
      font-size: 0.75rem;
      opacity: 0.9;
    }
    
    .day-assignments {
      padding: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 500px;
      overflow-y: auto;
    }
    
    .assignment-card {
      background: var(--background-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.5rem;
    }
    .assignment-card.empty {
      opacity: 0.6;
    }
    .assignment-type {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      margin-bottom: 0.25rem;
    }
    .assignment-type .icono {
      font-size: 1rem;
    }
    .assignment-type .nombre {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .assignment-person {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.25rem;
    }
    .assignment-person .person-name {
      font-size: 0.75rem;
      color: var(--primary-color);
      font-weight: 500;
    }
    .no-assignment {
      text-align: center;
    }
    .no-assignment span {
      font-size: 0.625rem;
      color: var(--text-secondary);
    }
    .btn-sm {
      padding: 0.25rem 0.5rem;
      font-size: 0.625rem;
    }
    
    .grupo-badge {
      display: inline-block;
      margin-left: 0.25rem;
      padding: 0.125rem 0.375rem;
      background: #dcfce7;
      color: #166534;
      border-radius: 12px;
      font-size: 0.625rem;
      font-weight: 500;
    }
    
    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal {
      background: var(--surface-color);
      border-radius: var(--radius-lg);
      width: 90%;
      max-width: 450px;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }
    .modal-header h2 {
      margin: 0;
      font-size: 1.25rem;
    }
    .btn-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      line-height: 1;
    }
    .modal-body {
      padding: 1.5rem;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.5rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-color);
    }
    .form-group {
      margin-bottom: 1rem;
    }
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      font-size: 0.875rem;
    }
    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--surface-color);
      color: var(--text-primary);
      font-size: 0.875rem;
    }
    .current-assignment-info {
      margin-bottom: 1rem;
      padding: 0.75rem;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: var(--radius-md);
    }
    .current-assignment-info p {
      margin: 0;
      font-size: 0.875rem;
      color: #1e40af;
    }
    .btn-icon {
      padding: 0.125rem 0.25rem;
      background: transparent;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      cursor: pointer;
      font-size: 0.625rem;
    }
    .btn-icon:hover {
      background: var(--surface-color);
    }
    .btn-danger {
      background: var(--danger-color);
      color: white;
      border: none;
      border-radius: var(--radius-md);
      padding: 0.5rem 1rem;
      cursor: pointer;
    }
  `]
})
export class SemanaEditarComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  asignacionService = inject(AsignacionService);
  semanaService = inject(SemanaService);
  authService = inject(AuthService);
  grupoService = inject(GrupoService);

  semana = signal<Semana | null>(null);
  tipos = signal<TipoAsignacion[]>([]);
  users = signal<any[]>([]);
  grupos = signal<Grupo[]>([]);
  asignaciones = signal<Asignacion[]>([]);
  
  weekDays: { diaSemana: number; fecha: string }[] = [];
  
  showAssignModal = false;
  assignForm = { user_id: '', grupo_id: '', observaciones: '', tipo_id: '', isEditing: false };
  editingAsignacion: Asignacion | null = null;
  editingDiaSemana = -1;

  ngOnInit() {
    const semanaId = this.route.snapshot.paramMap.get('id');
    if (semanaId) {
      this.loadData(semanaId);
    }
  }

  loadData(semanaId: string) {
    console.log('Cargando datos para semana:', semanaId);
    
    // Load semana details
    this.semanaService.getSemana(semanaId).subscribe({
      next: (semana) => {
        console.log('Semana cargada:', semana);
        this.semana.set(semana);
        this.generateWeekDays(semana);
      },
      error: (err) => {
        console.error('Error cargando semana:', err);
        // Si es 401, no navegar al login - solo mostrar error
        if (err.status === 401) {
          console.warn('Token inválido o expirado');
        }
      }
    });
    
    // Load asignaciones for this semana
    this.asignacionService.loadAsignacionesBySemana(semanaId).subscribe({
      next: (data) => {
        console.log('Asignaciones cargadas:', data);
        this.asignaciones.set(data.asignaciones || []);
      },
      error: (err) => {
        console.error('Error cargando asignaciones:', err);
        if (err.status === 401) {
          console.warn('Token inválido o expirado');
        }
      }
    });
    
    // Load tipos
    this.asignacionService.loadTiposAsignacion().subscribe({
      next: () => {
        this.tipos.set(this.asignacionService.tipos());
      },
      error: (err) => {
        console.error('Error cargando tipos:', err);
        if (err.status === 401) {
          console.warn('Token inválido o expirado');
        }
      }
    });
    
    // Load users and grupos
    this.loadUsersAndGrupos();
  }

  generateWeekDays(semana: any) {
    const inicio = new Date(semana.fecha_inicio);
    this.weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(inicio);
      date.setDate(inicio.getDate() + i);
      this.weekDays.push({
        diaSemana: i, // 0 = Monday in our display
        fecha: this.formatDateISO(date)
      });
    }
  }

  formatDateISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadUsersAndGrupos() {
    // Load users
    this.asignacionService.loadAsignaciones().subscribe(() => {
      // Get unique users from existing asignaciones
      const allAsigs = this.asignacionService.asignaciones();
      const uniqueUsers = new Map();
      allAsigs.forEach(a => {
        if (a.user) uniqueUsers.set(a.user.id, a.user);
      });
      this.users.set(Array.from(uniqueUsers.values()));
    });
    
    // Load grupos
    this.grupoService.loadGrupos().subscribe(() => {
      this.grupos.set(this.grupoService.grupos());
    });
  }

  getDiaNombre(diaSemana: number): string {
    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    return dias[diaSemana] || '';
  }

  getTipoNombre(nombre: string): string {
    const nombres: Record<string, string> = {
      'Aseo Salon': 'Aseo Salon',
      'Microfono': 'Microfono',
      'Presidente': 'Presidente',
      'Lectura': 'Lectura',
      'Tesoro': 'Tesoro'
    };
    return nombres[nombre] || nombre;
  }

  formatDateRange(): string {
    const semana = this.semana();
    if (!semana) return '';
    const inicio = new Date(semana.fecha_inicio);
    const fin = new Date(semana.fecha_fin);
    return `${this.formatDate(inicio)} - ${this.formatDate(fin)}`;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  getAsignacionForDay(diaSemana: number, tipoId: string): Asignacion | null {
    return this.asignaciones().find(a => a.dia_semana === diaSemana && a.tipo_asignacion_id === tipoId) || null;
  }

  goBack() {
    this.router.navigate(['/asignaciones']);
  }

  exportToPDF() {
    // TODO: Implement PDF export
    console.log('Export PDF');
  }

  openAssignModal(tipo: TipoAsignacion, diaSemana: number) {
    this.assignForm = { user_id: '', grupo_id: '', observaciones: '', tipo_id: tipo.id, isEditing: false };
    this.editingDiaSemana = diaSemana;
    this.showAssignModal = true;
  }

  editAsignacion(asignacion: Asignacion, tipo: TipoAsignacion, diaSemana: number) {
    this.assignForm = { 
      user_id: asignacion.user_id || '', 
      grupo_id: asignacion.grupo_id || '', 
      observaciones: asignacion.observaciones || '', 
      tipo_id: tipo.id, 
      isEditing: true 
    };
    this.editingAsignacion = asignacion;
    this.editingDiaSemana = diaSemana;
    this.showAssignModal = true;
  }

  closeAssignModal() {
    this.showAssignModal = false;
    this.editingAsignacion = null;
  }

  saveAsignacion() {
    const semana = this.semana();
    if (!semana) return;

    if (this.assignForm.isEditing && this.editingAsignacion) {
      // Update existing
      this.asignacionService.updateAsignacion(
        this.editingAsignacion.id,
        this.assignForm.user_id || undefined,
        this.assignForm.grupo_id || undefined,
        this.assignForm.observaciones
      ).subscribe(() => {
        this.closeAssignModal();
        this.loadData(semana.id);
      });
    } else {
      // Create new
      this.asignacionService.createAsignacion({
        semana_id: semana.id,
        tipo_asignacion_id: this.assignForm.tipo_id,
        user_id: this.assignForm.user_id,
        dia_semana: this.editingDiaSemana,
        observaciones: this.assignForm.observaciones
      }).subscribe(() => {
        this.closeAssignModal();
        this.loadData(semana.id);
      });
    }
  }

  deleteAsignacion() {
    if (!this.editingAsignacion) return;
    const semana = this.semana();
    
    if (confirm('¿Estás seguro de eliminar esta asignación?')) {
      this.asignacionService.deleteAsignacion(this.editingAsignacion.id).subscribe(() => {
        this.closeAssignModal();
        if (semana) this.loadData(semana.id);
      });
    }
  }
}
