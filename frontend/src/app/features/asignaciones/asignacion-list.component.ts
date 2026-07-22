import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AsignacionService, Asignacion, TipoAsignacion } from '../../core/services/asignacion.service';
import { SemanaService, Semana } from '../../core/services/semana.service';
import { AuthService } from '../../core/services/auth.service';
import { GrupoService, Grupo } from '../../core/services/grupo.service';

@Component({
  selector: 'app-asignacion-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="asignaciones-container">
      <!-- Calescence Header -->
      <header class="top-header">
        <div class="title-section">
          <div class="icon-badge">
            <span class="material-symbols-outlined">assignment</span>
          </div>
          <div>
            <h1>Asignaciones Semanales</h1>
            <p class="subtitle">Gestión de equipos y funciones de servicio por semana</p>
          </div>
        </div>

        <div class="header-actions">
          <button class="pill-btn btn-secondary" (click)="openPdfExportModal()">
            <span class="material-symbols-outlined icon">picture_as_pdf</span>
            <span>Exportar PDF</span>
          </button>
          @if (authService.isSuperintendente() || authService.isSuperAdmin()) {
            <button class="pill-btn btn-primary" (click)="openBulkModal()">
              <span class="material-symbols-outlined icon">add_task</span>
              <span>Programación Masiva</span>
            </button>
          }
        </div>
      </header>

      <!-- Week Selector Bar -->
      <div class="week-selector-card">
        <div class="week-selector-info">
          <span class="material-symbols-outlined week-icon">calendar_today</span>
          <div class="week-select-wrapper">
            <label for="semanaSelect">Semana de Servicio:</label>
            <select 
              id="semanaSelect" 
              [(ngModel)]="selectedSemanaId" 
              (change)="onSemanaSelectChange()"
              class="semana-dropdown"
            >
              <option value="" disabled>Selecciona una semana...</option>
              @for (semana of semanas(); track semana.id) {
                <option [value]="semana.id">
                  {{ semana.nombre }} ({{ formatDate(semana.fecha_inicio) }} - {{ formatDate(semana.fecha_fin) }})
                  {{ semana.archivado ? '[Archivada]' : '' }}
                </option>
              }
            </select>
          </div>
        </div>

        @if (semanaActual) {
          <div class="week-stats-pills">
            <div class="stat-pill pill-dark">
              <span class="stat-num">{{ getTotalAsignacionesSemana() }}</span>
              <span class="stat-lbl">Asignaciones</span>
            </div>
            <div class="stat-pill pill-lime">
              <span class="stat-num">{{ getDiasConAsignacionesCount() }}/7</span>
              <span class="stat-lbl">Días Cubiertos</span>
            </div>
          </div>
        }
      </div>

      <!-- Weekly Days Grid View (No monthly calendar) -->
      @if (!selectedSemanaId) {
        <div class="empty-selection-card">
          <span class="material-symbols-outlined empty-icon">date_range</span>
          <h3>Selecciona una semana arriba para ver y gestionar las asignaciones</h3>
          <p>Podrás ver los roles asignados día por día (Presidente, Lector, Micrófonos, Aseo, etc.)</p>
        </div>
      } @else if (loading()) {
        <div class="loading-card">
          <span class="material-symbols-outlined spin">sync</span>
          <p>Cargando asignaciones de la semana...</p>
        </div>
      } @else {
        <div class="days-stream-grid">
          @for (dia of diasSemana; track dia.numero) {
            <div class="day-card" [class.is-today]="isTodayDia(dia.numero)" [class.has-data]="getAssignmentsForDia(dia.numero).length > 0">
              <!-- Day Card Header -->
              <div class="day-card-header">
                <div class="day-title-group">
                  <span class="day-name">{{ dia.nombre }}</span>
                  <span class="day-date">{{ getFechaForDia(dia.numero) }}</span>
                </div>
                @if (isTodayDia(dia.numero)) {
                  <span class="badge-today">HOY</span>
                }
              </div>

              <!-- Roles Slots List -->
              <div class="roles-slot-list">
                @for (tipo of getTiposList(); track tipo.id) {
                  @let asig = getAsignacionForDiaAndTipo(dia.numero, tipo.id);
                  <div class="role-slot" [class.filled]="!!asig">
                    <div class="role-info">
                      <span class="role-type-name">{{ getTipoNombre(tipo.nombre) }}</span>
                      
                      @if (asig) {
                        <div class="assigned-badge">
                          <span class="material-symbols-outlined user-icon">
                            {{ asig.grupo_id ? 'groups' : 'person' }}
                          </span>
                          <span class="person-name">
                            {{ asig.user?.nombre || asig.grupo?.nombre || 'Asignado' }}
                          </span>
                          @if (asig.grupo?.numero) {
                            <span class="grupo-pill">G{{ asig.grupo?.numero }}</span>
                          }
                        </div>
                      } @else {
                        <span class="slot-empty-text">Sin asignar</span>
                      }
                    </div>

                    @if (authService.isSuperintendente() || authService.isSuperAdmin()) {
                      <div class="slot-actions">
                        @if (asig) {
                          <button 
                            class="action-icon-btn edit-btn" 
                            (click)="editAsignacion(asig, tipo, dia.numero)"
                            title="Editar asignación"
                          >
                            <span class="material-symbols-outlined">edit</span>
                          </button>
                        } @else {
                          <button 
                            class="action-icon-btn add-btn" 
                            (click)="openAssignModal(tipo, dia.numero)"
                            title="Asignar rol"
                          >
                            <span class="material-symbols-outlined">add</span>
                          </button>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Modal para Crear/Editar Asignación Individual -->
      @if (showAssignModal) {
        <div class="modal-backdrop" (click)="closeAssignModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editingAsignacion ? 'Editar' : 'Nueva' }} Asignación</h2>
              <button class="close-btn" (click)="closeAssignModal()">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="modal-body">
              <div class="info-pill-bar">
                <span><strong>Función:</strong> {{ getTipoNombre(editingTipo?.nombre || '') }}</span>
                <span><strong>Día:</strong> {{ getDiaNombre(editingDiaSemana) }}</span>
              </div>

              @if (editingTipo?.nombre === 'ASEO_SALON') {
                <div class="form-group">
                  <label for="grupoSelect">Grupo de Servicio (Requerido para Aseo):</label>
                  <select id="grupoSelect" [(ngModel)]="assignForm.grupo_id" class="form-input">
                    <option value="">Selecciona un Grupo...</option>
                    @for (grupo of grupos(); track grupo.id) {
                      <option [value]="grupo.id">Grupo {{ grupo.numero }} - {{ grupo.nombre }}</option>
                    }
                  </select>
                </div>
              } @else {
                <div class="form-group">
                  <label for="userSelect">Publicador Asignado:</label>
                  <select id="userSelect" [(ngModel)]="assignForm.user_id" class="form-input">
                    <option value="">Selecciona un Usuario...</option>
                    @for (user of getUsersList(); track user.id) {
                      <option [value]="user.id">{{ user.nombre }} ({{ user.rol }})</option>
                    }
                  </select>
                </div>
              }

              <div class="form-group">
                <label for="obsInput">Observaciones (Opcional):</label>
                <input id="obsInput" type="text" [(ngModel)]="assignForm.observaciones" placeholder="Ej: Confirmado..." class="form-input" />
              </div>
            </div>

            <div class="modal-footer">
              <button class="pill-btn btn-secondary" (click)="closeAssignModal()">Cancelar</button>
              <button class="pill-btn btn-primary" (click)="saveAsignacion()">Guardar Asignación</button>
            </div>
          </div>
        </div>
      }

      <!-- Modal de Exportación a PDF -->
      @if (showPdfExportModal) {
        <div class="modal-backdrop" (click)="closePdfExportModal()">
          <div class="modal-card modal-lg" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Exportar Programa a PDF</h2>
              <button class="close-btn" (click)="closePdfExportModal()">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <div class="modal-body">
              <p>Selecciona las semanas que deseas incluir en el documento imprimible:</p>
              <div class="weeks-checklist">
                @for (semana of semanas(); track semana.id) {
                  <label class="week-checkbox-row">
                    <input 
                      type="checkbox" 
                      [checked]="isSemanaSelectedForExport(semana.id)"
                      (change)="toggleSemanaSelection(semana.id)"
                    />
                    <span class="week-row-name">{{ semana.nombre }}</span>
                    <span class="week-row-date">({{ formatDate(semana.fecha_inicio) }} - {{ formatDate(semana.fecha_fin) }})</span>
                  </label>
                }
              </div>
            </div>
            <div class="modal-footer">
              <button class="pill-btn btn-secondary" (click)="closePdfExportModal()">Cancelar</button>
              <button class="pill-btn btn-primary" (click)="generatePdfWithSelection()">Generar PDF</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .asignaciones-container {
      max-width: 1300px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .top-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .title-section {
      display: flex;
      align-items: center;
      gap: 1rem;

      .icon-badge {
        width: 48px;
        height: 48px;
        background: #121316;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--accent-lime);
        box-shadow: var(--shadow-sm);

        span { font-size: 1.6rem; }
      }

      h1 {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 1.85rem;
        font-weight: 800;
        margin: 0;
        color: var(--text-primary);
        letter-spacing: -0.02em;
      }

      .subtitle {
        color: var(--text-secondary);
        font-size: 0.9rem;
        margin-top: 0.2rem;
      }
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .pill-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 1.35rem;
      border-radius: var(--radius-pill);
      font-size: 0.875rem;
      font-weight: 600;
      border: none;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: var(--shadow-sm);

      &:hover {
        transform: translateY(-2px);
      }

      span.icon { font-size: 1.15rem; }
    }

    .btn-primary {
      background: #121316;
      color: #ffffff;

      span.icon { color: var(--accent-lime); }
      &:hover { box-shadow: 0 8px 20px rgba(18, 19, 22, 0.3); }
    }

    .btn-secondary {
      background: var(--surface-color);
      color: var(--text-primary);
      border: 1px solid var(--border-color);

      span.icon { color: var(--primary-color); }
      &:hover { background: var(--background-color); }
    }

    .week-selector-card {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 24px;
      padding: 1.25rem 1.75rem;
      box-shadow: var(--shadow-card);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .week-selector-info {
      display: flex;
      align-items: center;
      gap: 1rem;

      .week-icon {
        font-size: 1.6rem;
        color: var(--primary-color);
        background: rgba(37, 99, 235, 0.1);
        padding: 0.5rem;
        border-radius: 50%;
      }
    }

    .week-select-wrapper {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      label {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--text-secondary);
        letter-spacing: 0.05em;
      }
    }

    .semana-dropdown {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-pill);
      background: var(--background-color);
      color: var(--text-primary);
      font-weight: 600;
      font-size: 0.95rem;
      min-width: 320px;
      outline: none;
      cursor: pointer;

      &:focus {
        border-color: var(--primary-color);
      }
    }

    .week-stats-pills {
      display: flex;
      gap: 0.75rem;
    }

    .stat-pill {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.45rem 1rem;
      border-radius: var(--radius-pill);
      font-size: 0.85rem;

      .stat-num {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-weight: 800;
        font-size: 1.1rem;
      }
      .stat-lbl { font-weight: 500; }
    }

    .pill-dark {
      background: var(--dark-card-bg);
      color: #ffffff;
      .stat-num { color: var(--accent-lime); }
    }

    .pill-lime {
      background: var(--accent-lime);
      color: #121316;
      .stat-num { color: #121316; }
      .stat-lbl { font-weight: 600; }
    }

    .empty-selection-card, .loading-card {
      background: var(--surface-color);
      border: 1px dashed var(--border-color);
      border-radius: 24px;
      padding: 4rem 2rem;
      text-align: center;
      color: var(--text-secondary);

      .empty-icon, .spin {
        font-size: 3rem;
        color: var(--primary-color);
        margin-bottom: 0.75rem;
      }

      .spin { animation: spin 1s linear infinite; }
      h3 { font-family: 'Plus Jakarta Sans', sans-serif; color: var(--text-primary); margin-bottom: 0.5rem; }
    }

    /* Days Stream Grid (Responsive 7-day cards view) */
    .days-stream-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1.25rem;
    }

    .day-card {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 24px;
      padding: 1.35rem;
      box-shadow: var(--shadow-card);
      display: flex;
      flex-direction: column;
      gap: 1rem;
      transition: transform 0.2s ease, box-shadow 0.2s ease;

      &:hover {
        transform: translateY(-3px);
        box-shadow: var(--shadow-md);
      }

      &.is-today {
        border: 2px solid var(--primary-color);
        box-shadow: 0 0 20px rgba(37, 99, 235, 0.2);
      }
    }

    .day-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border-color);
    }

    .day-title-group {
      display: flex;
      flex-direction: column;

      .day-name {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 1.15rem;
        font-weight: 800;
        color: var(--text-primary);
      }

      .day-date {
        font-size: 0.8rem;
        color: var(--text-secondary);
        font-weight: 500;
      }
    }

    .badge-today {
      background: var(--primary-color);
      color: #ffffff;
      font-weight: 800;
      font-size: 0.7rem;
      padding: 0.2rem 0.6rem;
      border-radius: var(--radius-pill);
      letter-spacing: 0.05em;
    }

    .roles-slot-list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .role-slot {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.65rem 0.85rem;
      background: var(--background-color);
      border-radius: var(--radius-lg);
      border: 1px solid transparent;
      transition: all 0.2s ease;

      &.filled {
        background: var(--surface-color);
        border-color: var(--border-color);
      }
    }

    .role-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      .role-type-name {
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .slot-empty-text {
        font-size: 0.85rem;
        color: var(--text-secondary);
        font-style: italic;
        opacity: 0.7;
      }
    }

    .assigned-badge {
      display: flex;
      align-items: center;
      gap: 0.4rem;

      .user-icon {
        font-size: 1rem;
        color: var(--primary-color);
      }

      .person-name {
        font-weight: 600;
        font-size: 0.875rem;
        color: var(--text-primary);
      }

      .grupo-pill {
        background: #dcfce7;
        color: #166534;
        font-size: 0.7rem;
        font-weight: 700;
        padding: 0.1rem 0.4rem;
        border-radius: var(--radius-pill);
      }
    }

    .slot-actions {
      display: flex;
      align-items: center;
    }

    .action-icon-btn {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid var(--border-color);
      background: var(--surface-color);
      color: var(--text-primary);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;

      span { font-size: 1.1rem; }

      &.add-btn:hover {
        background: var(--primary-color);
        color: #ffffff;
        border-color: var(--primary-color);
      }

      &.edit-btn:hover {
        background: var(--dark-card-bg);
        color: var(--accent-lime);
        border-color: var(--dark-card-bg);
      }
    }

    /* Modal Backdrop & Cards */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-card {
      background: var(--surface-color);
      border-radius: 24px;
      width: 100%;
      max-width: 480px;
      padding: 1.75rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      display: flex;
      flex-direction: column;
      gap: 1.25rem;

      &.modal-lg { max-width: 600px; }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      h2 {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 1.3rem;
        font-weight: 800;
        margin: 0;
        color: var(--text-primary);
      }

      .close-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        color: var(--text-secondary);
        display: flex;

        &:hover { color: var(--text-primary); }
      }
    }

    .info-pill-bar {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: var(--background-color);
      border-radius: var(--radius-lg);
      font-size: 0.85rem;
      color: var(--text-primary);
      margin-bottom: 1rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 1rem;

      label {
        font-size: 0.85rem;
        font-weight: 600;
        color: var(--text-primary);
      }
    }

    .form-input {
      padding: 0.65rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--surface-color);
      color: var(--text-primary);
      font-size: 0.9rem;
      outline: none;

      &:focus { border-color: var(--primary-color); }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .weeks-checklist {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 260px;
      overflow-y: auto;
      margin-top: 1rem;
    }

    .week-checkbox-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.85rem;
      background: var(--background-color);
      border-radius: var(--radius-md);
      cursor: pointer;

      .week-row-name { font-weight: 600; color: var(--text-primary); }
      .week-row-date { font-size: 0.8rem; color: var(--text-secondary); }
    }

    @keyframes spin { 100% { transform: rotate(360deg); } }
  `]
})
export class AsignacionListComponent implements OnInit {
  private asignacionService = inject(AsignacionService);
  private semanaService = inject(SemanaService);
  public authService = inject(AuthService);
  private grupoService = inject(GrupoService);

  semanas = signal<Semana[]>([]);
  users = signal<any[]>([]);
  tipos = signal<TipoAsignacion[]>([]);
  grupos = signal<Grupo[]>([]);
  semanaActual: any = null;

  selectedSemanaId = '';
  loading = signal(false);

  showAssignModal = false;
  showPdfExportModal = false;
  showBulkModal = false;

  editingTipo: TipoAsignacion | null = null;
  editingDiaSemana = -1;
  editingAsignacion: Asignacion | null = null;

  assignForm = { user_id: '', grupo_id: '', tipo_id: '', observaciones: '' };
  selectedWeeksForExportSignal = signal<string[]>([]);

  private asignacionMap = signal<Map<string, Asignacion>>(new Map());

  diasSemana = [
    { numero: 0, nombre: 'Domingo' },
    { numero: 1, nombre: 'Lunes' },
    { numero: 2, nombre: 'Martes' },
    { numero: 3, nombre: 'Miércoles' },
    { numero: 4, nombre: 'Jueves' },
    { numero: 5, nombre: 'Viernes' },
    { numero: 6, nombre: 'Sábado' }
  ];

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
      next: (res) => {
        this.semanas.set(res.data);
        if (res.data.length > 0 && !this.selectedSemanaId) {
          // Select first active week by default
          const active = res.data.find((s: Semana) => !s.archivado) || res.data[0];
          this.selectedSemanaId = active.id;
          this.loadSemana();
        }
      }
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

  onSemanaSelectChange() {
    this.loadSemana();
  }

  loadSemana() {
    if (!this.selectedSemanaId) return;
    this.loading.set(true);

    this.asignacionService.loadAsignacionesBySemana(this.selectedSemanaId).subscribe({
      next: (data: any) => {
        this.semanaActual = data;
        const map = new Map<string, Asignacion>();
        data.asignaciones?.forEach((a: Asignacion) => {
          const key = `${a.dia_semana}-${a.tipo_asignacion_id}`;
          map.set(key, a);
        });
        this.asignacionMap.set(map);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getAsignacionForDiaAndTipo(diaSemana: number, tipoId: string): Asignacion | null {
    const map = this.asignacionMap();
    return map.get(`${diaSemana}-${tipoId}`) || null;
  }

  getAssignmentsForDia(diaSemana: number): Asignacion[] {
    const map = this.asignacionMap();
    const result: Asignacion[] = [];
    map.forEach((val) => {
      if (val.dia_semana === diaSemana) {
        result.push(val);
      }
    });
    return result;
  }

  getTotalAsignacionesSemana(): number {
    return this.asignacionMap().size;
  }

  getDiasConAsignacionesCount(): number {
    const dias = new Set<number>();
    this.asignacionMap().forEach((val) => dias.add(val.dia_semana));
    return dias.size;
  }

  getDiaNombre(diaSemana: number): string {
    const d = this.diasSemana.find(item => item.numero === diaSemana);
    return d ? d.nombre : '';
  }

  getTipoNombre(nombre: string): string {
    const nombres: Record<string, string> = {
      'PRESIDENTE': 'Presidente',
      'LECTOR_ATALAYA': 'Lector Atalaya',
      'ACOMODADOR_SALON': 'Acomodador',
      'PARQUEADERO': 'Parqueadero',
      'MICROFONO': 'Micrófono',
      'PLATAFORMA': 'Plataforma',
      'ASEO_SALON': 'Aseo del Salón'
    };
    return nombres[nombre] || nombre;
  }

  getTiposList(): TipoAsignacion[] {
    const t = this.tipos();
    if (Array.isArray(t) && t.length > 0) {
      return [...t].sort((a, b) => {
        const order: Record<string, number> = {
          'PRESIDENTE': 1,
          'LECTOR_ATALAYA': 2,
          'MICROFONO': 3,
          'PLATAFORMA': 4,
          'ACOMODADOR_SALON': 5,
          'PARQUEADERO': 6,
          'ASEO_SALON': 7
        };
        return (order[a.nombre] ?? 99) - (order[b.nombre] ?? 99);
      });
    }
    return [
      { id: '1', nombre: 'PRESIDENTE', icono: '🎯', descripcion: 'Presidente' },
      { id: '2', nombre: 'LECTOR_ATALAYA', icono: '📖', descripcion: 'Lector Atalaya' },
      { id: '3', nombre: 'MICROFONO', icono: '🎤', descripcion: 'Micrófono' },
      { id: '4', nombre: 'PLATAFORMA', icono: '📺', descripcion: 'Plataforma' },
      { id: '5', nombre: 'ACOMODADOR_SALON', icono: '🪑', descripcion: 'Acomodador' },
      { id: '6', nombre: 'PARQUEADERO', icono: '🚗', descripcion: 'Parqueadero' },
      { id: '7', nombre: 'ASEO_SALON', icono: '🧹', descripcion: 'Aseo del Salón' }
    ] as TipoAsignacion[];
  }

  getUsersList(): any[] {
    const u = this.users();
    return Array.isArray(u) ? u : [];
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  getFechaForDia(diaSemana: number): string {
    if (!this.semanaActual || !this.semanaActual.semana) return '';
    const start = new Date(this.semanaActual.semana.fecha_inicio);
    const date = new Date(start);
    date.setDate(start.getDate() + diaSemana);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  isTodayDia(diaSemana: number): boolean {
    if (!this.semanaActual || !this.semanaActual.semana) return false;
    const start = new Date(this.semanaActual.semana.fecha_inicio);
    const date = new Date(start);
    date.setDate(start.getDate() + diaSemana);
    const today = new Date();
    return date.toDateString() === today.toDateString();
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

  openBulkModal() {
    if (!this.selectedSemanaId) return;
    alert('Función de programación masiva habilitada.');
  }

  openPdfExportModal() {
    this.showPdfExportModal = true;
    if (this.selectedSemanaId) {
      this.selectedWeeksForExportSignal.set([this.selectedSemanaId]);
    }
  }

  closePdfExportModal() {
    this.showPdfExportModal = false;
  }

  isSemanaSelectedForExport(semanaId: string): boolean {
    return this.selectedWeeksForExportSignal().includes(semanaId);
  }

  toggleSemanaSelection(semanaId: string) {
    const current = this.selectedWeeksForExportSignal();
    if (current.includes(semanaId)) {
      this.selectedWeeksForExportSignal.set(current.filter(id => id !== semanaId));
    } else {
      this.selectedWeeksForExportSignal.set([...current, semanaId]);
    }
  }

  generatePdfWithSelection() {
    window.print();
    this.closePdfExportModal();
  }
}
