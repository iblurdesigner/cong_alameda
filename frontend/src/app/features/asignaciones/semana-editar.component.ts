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
      </header>

      <!-- Resumen: Lista de Personas con sus Asignaciones -->
      <div class="resumen-lista">
        @for (tipo of tipos(); track tipo.id) {
          @if (getPersonasConAsignaciones(tipo.id); as personas) {
            @if (personas.length > 0) {
              <div class="tipo-seccion">
                <h3 class="tipo-titulo">
                  <span class="icono">{{ tipo.icono || '📋' }}</span>
                  {{ getTipoNombre(tipo.nombre) }}
                </h3>
                
                <div class="personas-list">
                  @for (persona of personas; track persona.diaSemana + '-' + persona.userId + '-' + persona.grupoId) {
                    <div class="persona-card">
                      <span class="persona-nombre">{{ persona.nombre }}</span>
                      <span class="persona-dia">{{ getDiaNombre(persona.diaSemana) }}</span>
                      @if (persona.esGrupo) {
                        <span class="grupo-badge">Grupo</span>
                      }
                      @if (authService.isSuperintendente() || authService.isSuperAdmin()) {
                        <button class="btn-edit" (click)="editAsignacionDirecta(persona.asignacionId, tipo.id, persona.diaSemana)">
                          ✏️
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>
            }
          }
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
    
    /* Resumen Lista - Diseño simple */
    .resumen-lista {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .tipo-seccion {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1rem;
    }
    .tipo-seccion.sin-asignar {
      border-color: var(--warning-color);
      background: rgba(245, 158, 11, 0.05);
    }
    .tipo-titulo {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0 0 0.75rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .tipo-titulo .icono {
      font-size: 1.25rem;
    }
    .personas-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .persona-card {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: var(--background-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
    }
    .persona-nombre {
      font-weight: 500;
      color: var(--text-primary);
    }
    .persona-dia {
      font-size: 0.75rem;
      color: var(--text-secondary);
      background: var(--surface-color);
      padding: 0.125rem 0.5rem;
      border-radius: var(--radius-sm);
    }
    .grupo-badge {
      display: inline-block;
      padding: 0.125rem 0.375rem;
      background: #dcfce7;
      color: #166534;
      border-radius: 8px;
      font-size: 0.625rem;
      font-weight: 500;
    }
    .btn-edit {
      padding: 0.125rem 0.25rem;
      font-size: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background: transparent;
      cursor: pointer;
    }
    .btn-edit:hover {
      background: var(--primary-light);
    }
    .dias-sin-asignar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .dia-sin-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.25rem 0.5rem;
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid var(--warning-color);
      border-radius: var(--radius-md);
      font-size: 0.75rem;
      color: var(--warning-color);
    }
    .btn-add-small {
      padding: 0 0.25rem;
      font-size: 0.75rem;
      background: transparent;
      border: none;
      color: var(--warning-color);
      cursor: pointer;
    }
    .btn-add-small:hover {
      font-weight: bold;
    }
    .sin-asignar .tipo-titulo {
      color: var(--warning-color);
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
    // Load ALL users from the users endpoint
    this.authService.getUsers().subscribe({
      next: (res: any) => {
        this.users.set(res.data || res);
      },
      error: (err) => {
        console.error('Error loading users:', err);
        // Fallback: try loading from existing asignaciones
        this.asignacionService.loadAsignaciones().subscribe(() => {
          const allAsigs = this.asignacionService.asignaciones();
          const uniqueUsers = new Map();
          allAsigs.forEach(a => {
            if (a.user) uniqueUsers.set(a.user.id, a.user);
          });
          this.users.set(Array.from(uniqueUsers.values()));
        });
      }
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
      'Tesoro': 'Tesoro',
      'LECTOR_ATALAYA': 'Lector Atalaya',
      'PRESIDENTE': 'Presidente'
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

  // Obtiene las personas asignadas para un tipo específico
  getPersonasConAsignaciones(tipoId: string): { nombre: string; diaSemana: number; esGrupo: boolean; userId?: string; grupoId?: string; asignacionId: string }[] {
    const tipoAsignaciones = this.asignaciones().filter(a => a.tipo_asignacion_id === tipoId);
    const result: { nombre: string; diaSemana: number; esGrupo: boolean; userId?: string; grupoId?: string; asignacionId: string }[] = [];
    
    for (const asignacion of tipoAsignaciones) {
      if (asignacion.user) {
        result.push({
          nombre: asignacion.user.nombre,
          diaSemana: asignacion.dia_semana,
          esGrupo: false,
          userId: asignacion.user_id,
          asignacionId: asignacion.id
        });
      }
      if (asignacion.grupo) {
        result.push({
          nombre: asignacion.grupo.nombre,
          diaSemana: asignacion.dia_semana,
          esGrupo: true,
          grupoId: asignacion.grupo_id,
          asignacionId: asignacion.id
        });
      }
    }
    
    // Ordenar por día de la semana
    return result.sort((a, b) => a.diaSemana - b.diaSemana);
  }

  // Obtiene los días sin asignar para un tipo específico
  getDiasSinAsignar(tipoId: string): number[] {
    const diasAsignados = this.asignaciones()
      .filter(a => a.tipo_asignacion_id === tipoId)
      .map(a => a.dia_semana);
    
    const todosDias = [0, 1, 2, 3, 4, 5, 6]; // Lunes a Domingo
    return todosDias.filter(dia => !diasAsignados.includes(dia));
  }

  // Abre el modal de asignación para un tipo y día específicos
  openAssignModalByTipoAndDia(tipoId: string, diaSemana: number) {
    const tipo = this.tipos().find(t => t.id === tipoId);
    if (tipo) {
      this.openAssignModal(tipo, diaSemana);
    }
  }

  // Edita una asignación directa por ID
  editAsignacionDirecta(asignacionId: string, tipoId: string, diaSemana: number) {
    const asignacion = this.asignaciones().find(a => a.id === asignacionId);
    const tipo = this.tipos().find(t => t.id === tipoId);
    if (asignacion && tipo) {
      this.editAsignacion(asignacion, tipo, diaSemana);
    }
  }

  goBack() {
    this.router.navigate(['/asignaciones']);
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
