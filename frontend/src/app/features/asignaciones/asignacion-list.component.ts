import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AsignacionService, Asignacion, TipoAsignacion } from '../../core/services/asignacion.service';
import { SemanaService, Semana } from '../../core/services/semana.service';
import { AuthService } from '../../core/services/auth.service';
import { GrupoService, Grupo } from '../../core/services/grupo.service';
import { NotificationService } from '../../core/services/notification.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, Observable } from 'rxjs';

@Component({
  selector: 'app-asignacion-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  styleUrls: ['./asignacion-list.component.scss'],
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
          <a routerLink="/asignaciones/vida-y-ministerio" class="pill-btn btn-secondary" style="text-decoration: none;">
            <span class="material-symbols-outlined icon">menu_book</span>
            <span>Vida y Ministerio</span>
          </a>
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

      <!-- Week Navigator Bar -->
      <div class="week-selector-card">
        <div class="week-nav-container">
          <button class="nav-arrow-btn" (click)="navigateWeek(-1)" title="Semana anterior">
            <span class="material-symbols-outlined">chevron_left</span>
            <span class="nav-text">Anterior</span>
          </button>

          <div class="week-current-picker">
            <span class="material-symbols-outlined week-icon">calendar_month</span>
            <div class="week-date-input-wrapper">
              <span class="week-display-title">
                {{ getSelectedWeekDisplayTitle() }}
              </span>
              <input 
                type="date" 
                #picker
                [ngModel]="selectedDateInput" 
                (change)="onDateInputChange($event)"
                class="date-picker-input"
              >
              <button type="button" class="btn-change-date" (click)="openDatePicker(picker)" title="Seleccionar cualquier fecha en el calendario">
                <span class="material-symbols-outlined">edit_calendar</span>
                <span>Elegir Fecha</span>
              </button>
            </div>
          </div>

          <button class="nav-arrow-btn" (click)="navigateWeek(1)" title="Semana siguiente">
            <span class="nav-text">Siguiente</span>
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        @if (semanaActual) {
          <div class="week-stats-pills">
            <div class="stat-pill pill-dark">
              <span class="stat-num">{{ getTotalAsignacionesSemana() }}</span>
              <span class="stat-lbl">Asignaciones</span>
            </div>
            <div class="stat-pill pill-lime">
              <span class="stat-num">{{ getDiasConAsignacionesCount() }}/2</span>
              <span class="stat-lbl">Reuniones Cubiertas</span>
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
          <p>Podrás ver y asignar la lista semanal de funciones (Presidente, Lector, Micrófonos, Plataforma, Aseo, etc.)</p>
        </div>
      } @else if (loading()) {
        <div class="loading-card">
          <span class="material-symbols-outlined spin">sync</span>
          <p>Cargando asignaciones de la semana...</p>
        </div>
      } @else {
        <div class="weekly-stream-container">
          <div class="day-card weekly-card">
            <!-- Weekly Card Header -->
            <div class="day-card-header">
              <div class="day-title-group">
                <span class="day-name">Programa Semanal</span>
                <span class="day-date">{{ getSelectedWeekDisplayTitle() }}</span>
              </div>
              <div class="day-header-right">
                @if (authService.isSuperintendente() || authService.isSuperAdmin()) {
                  <button class="btn-whatsapp-header" (click)="openWhatsAppModal()" title="Enviar recordatorios por WhatsApp">
                    <span class="material-symbols-outlined icon">chat</span>
                    <span>Recordatorios WhatsApp</span>
                  </button>
                  <button class="edit-card-btn" (click)="openEditDiaModal(3)" title="Editar asignaciones de esta semana">
                    <span class="material-symbols-outlined">edit_note</span>
                    <span>Editar tarjeta semanal</span>
                  </button>
                }
              </div>
            </div>

            <!-- Roles Slots List -->
            <div class="roles-slot-list">
              @for (tipo of getTiposList(); track tipo.id) {
                @let asig = getAsignacionForTipo(tipo.id);
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
                          (click)="editAsignacion(asig, tipo, 3)"
                          title="Editar asignación"
                        >
                          <span class="material-symbols-outlined">edit</span>
                        </button>
                      } @else {
                        <button 
                          class="action-icon-btn add-btn" 
                          (click)="openAssignModal(tipo, 3)"
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
                <span><strong>Semana:</strong> {{ getSelectedWeekDisplayTitle() }}</span>
              </div>

              @if (isGroupType(editingTipo?.nombre)) {
                <div class="form-group">
                  <label for="grupoSelect">Grupo de Servicio:</label>
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
              <button class="pill-btn btn-primary" (click)="saveAsignacion()">Guardar</button>
            </div>
          </div>
        </div>
      }

      <!-- Modal para Editar Tarjeta Completa de la Semana -->
      @if (showEditDiaModal) {
        <div class="modal-backdrop" (click)="closeEditDiaModal()">
          <div class="modal-card modal-lg" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Editar Asignaciones de la Semana</h2>
              <button class="close-btn" (click)="closeEditDiaModal()">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="modal-body">
              <p class="subtitle">Asigna rápidamente las funciones semanales:</p>
              
              <div class="day-roles-edit-list">
                @for (tipo of getTiposList(); track tipo.id) {
                  <div class="role-edit-row">
                    <div class="role-label-group">
                      <span class="role-icon">{{ tipo.icono || 'assignment' }}</span>
                      <span class="role-name">{{ getTipoNombre(tipo.nombre) }}</span>
                    </div>

                    <div class="role-input-group">
                      @if (isGroupType(tipo.nombre)) {
                        <select [(ngModel)]="dayFormMap[tipo.id].grupo_id" class="form-input">
                          <option value="">-- Sin asignar --</option>
                          @for (grupo of grupos(); track grupo.id) {
                            <option [value]="grupo.id">Grupo {{ grupo.numero }} - {{ grupo.nombre }}</option>
                          }
                        </select>
                      } @else {
                        <select [(ngModel)]="dayFormMap[tipo.id].user_id" class="form-input">
                          <option value="">-- Sin asignar --</option>
                          @for (user of getUsersList(); track user.id) {
                            <option [value]="user.id">{{ user.nombre }} ({{ user.rol }})</option>
                          }
                        </select>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="modal-footer">
              <button class="pill-btn btn-secondary" (click)="closeEditDiaModal()">Cancelar</button>
              <button class="pill-btn btn-primary" (click)="saveDiaAsignaciones()" [disabled]="savingDia">
                @if (savingDia) {
                  <span class="material-symbols-outlined spin">sync</span>
                  <span>Guardando...</span>
                } @else {
                  <span>Guardar Asignaciones</span>
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal de Exportación a PDF con Vista Previa en Vivo -->
      @if (showPdfExportModal) {
        <div class="modal-backdrop pdf-modal-backdrop" (click)="closePdfExportModal()">
          <div class="modal-card pdf-modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header pdf-header">
              <div class="pdf-modal-title">
                <span class="material-symbols-outlined icon">picture_as_pdf</span>
                <div>
                  <h2>Exportar Programa a PDF</h2>
                  <p class="subtitle">Previsualiza y selecciona las semanas a incluir en el documento imprimible</p>
                </div>
              </div>
              <button class="close-btn" (click)="closePdfExportModal()">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="modal-body pdf-modal-body">
              <div class="pdf-split-layout">
                <!-- Sidebar de selección de semanas -->
                <div class="pdf-sidebar">
                  <div class="sidebar-actions">
                    <div class="sidebar-header-row">
                      <span class="sidebar-label">Semanas ({{ selectedWeeksForExportSignal().length }}):</span>
                      <div class="sidebar-btns">
                        <button type="button" class="text-btn" (click)="selectAllWeeksForExport()">Todas</button>
                        <span class="sep">|</span>
                        <button type="button" class="text-btn" (click)="deselectAllWeeksForExport()">Ninguna</button>
                      </div>
                    </div>
                    <div class="sidebar-quick-filters">
                      <button type="button" class="filter-chip-btn" (click)="selectCurrentMonthWeeks()">
                        <span class="material-symbols-outlined">calendar_today</span>
                        <span>Mes Actual</span>
                      </button>
                      <button type="button" class="filter-chip-btn" (click)="selectNext4Weeks()">
                        <span class="material-symbols-outlined">date_range</span>
                        <span>Próximas 4</span>
                      </button>
                    </div>
                  </div>
                  <div class="weeks-checklist">
                    @for (semana of deduplicatedSemanas(); track semana.id) {
                      <label class="week-checkbox-row" [class.selected]="isSemanaSelectedForExport(semana.id)">
                        <input 
                          type="checkbox" 
                          [checked]="isSemanaSelectedForExport(semana.id)"
                          (change)="toggleSemanaSelection(semana.id)"
                        />
                        <div class="week-info">
                          <div class="week-title-row">
                            <span class="week-row-name">{{ getWeekFormattedTitle(semana) }}</span>
                            @if (isCurrentWeek(semana)) {
                              <span class="current-week-badge">Actual</span>
                            }
                          </div>
                          <span class="week-row-date">{{ formatDate(semana.fecha_inicio) }} - {{ formatDate(semana.fecha_fin) }}</span>
                        </div>
                      </label>
                    }
                  </div>
                </div>

                <!-- Panel de Vista Previa del Documento Imprimible (Formato Oficial Congregación) -->
                <div class="pdf-preview-container">
                  <div class="pdf-preview-toolbar">
                    <span class="toolbar-title">
                      <span class="material-symbols-outlined">visibility</span>
                      Vista Previa en Vivo
                    </span>
                    <span class="toolbar-badge">A4 Imprimible</span>
                  </div>

                  <div class="pdf-preview-viewport">
                    <div class="pdf-printable-sheet">
                      <div class="sheet-header">
                        <h1 class="sheet-org">CONGREGACIÓN ALAMEDA</h1>
                        <h2 class="sheet-doc-title">PROGRAMA DE ASIGNACIONES DE REUNIONES</h2>
                      </div>

                      @if (loadingPreview()) {
                        <div class="preview-loading">
                          <span class="material-symbols-outlined spin">sync</span>
                          <span>Cargando vista previa del documento...</span>
                        </div>
                      } @else if (selectedWeeksForExportSignal().length === 0) {
                        <div class="preview-empty">
                          <span class="material-symbols-outlined">find_in_page</span>
                          <p>Selecciona al menos una semana en el panel izquierdo para generar la vista previa.</p>
                        </div>
                      } @else {
                        @for (semanaId of getOrderedSelectedWeeks(); track semanaId) {
                          @let weekData = getPreviewWeekData(semanaId);
                          @if (weekData) {
                            <div class="sheet-week-block">
                              <table class="sheet-table">
                                <thead>
                                  <tr class="row-week-header">
                                    <th class="col-role">FECHA:</th>
                                    <th class="col-assigned">{{ getWeekDisplayTitleForPdf(weekData) }}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  @for (tipo of getTiposList(); track tipo.id) {
                                    <tr>
                                      <td class="cell-role">
                                        <span>{{ getTipoNombre(tipo.nombre) }}:</span>
                                      </td>
                                      <td class="cell-assigned">
                                        {{ getPreviewAsignadoSemanal(weekData, tipo.id) }}
                                      </td>
                                    </tr>
                                  }
                                </tbody>
                              </table>
                            </div>
                          }
                        }
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="pill-btn btn-secondary" (click)="closePdfExportModal()">Cancelar</button>
              <button class="pill-btn btn-primary" (click)="generatePdfWithSelection()" [disabled]="selectedWeeksForExportSignal().length === 0">
                <span class="material-symbols-outlined icon">print</span>
                <span>Generar PDF / Imprimir</span>
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Modal de Recordatorios por WhatsApp -->
      @if (showWhatsAppModal) {
        <div class="modal-backdrop wa-modal-backdrop" (click)="closeWhatsAppModal()">
          <div class="modal-card modal-lg wa-modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header wa-header">
              <div class="wa-title-group">
                <span class="material-symbols-outlined wa-icon">chat</span>
                <div>
                  <h2>Recordatorios por WhatsApp</h2>
                  <p class="subtitle">Notifica a los hermanos asignados para {{ getSelectedWeekDisplayTitle() }}</p>
                </div>
              </div>
              <button class="close-btn" (click)="closeWhatsAppModal()">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <div class="modal-body wa-modal-body">
              @let assignedList = getAssignedListForWhatsApp();
              @if (assignedList.length === 0) {
                <div class="wa-empty-state">
                  <span class="material-symbols-outlined icon">info</span>
                  <p>No hay asignaciones registradas en esta semana para enviar recordatorios.</p>
                </div>
              } @else {
                <div class="wa-cards-grid">
                  @for (item of assignedList; track item.tipo_id) {
                    <div class="wa-item-card">
                      <div class="wa-item-header">
                        <span class="wa-role-pill">{{ item.tipo_nombre }}</span>
                        @if (item.telefono) {
                          <span class="wa-phone-pill">
                            <span class="material-symbols-outlined">phone</span>
                            {{ item.telefono }}
                          </span>
                        } @else {
                          <span class="wa-phone-pill no-phone">
                            <span class="material-symbols-outlined">warning</span>
                            Sin teléfono
                          </span>
                        }
                      </div>

                      <div class="wa-person-info">
                        <span class="material-symbols-outlined icon">person</span>
                        <strong class="person-name">{{ item.nombre_asignado }}</strong>
                      </div>

                      <div class="wa-message-preview">
                        <label>Mensaje a enviar:</label>
                        <div class="message-box">{{ item.mensaje_preview }}</div>
                      </div>

                      <div class="wa-item-actions">
                        <button 
                          class="btn-send-wa" 
                          (click)="sendWhatsAppReminder(item)" 
                          [disabled]="!item.telefono"
                          [title]="item.telefono ? 'Abrir chat de WhatsApp con el mensaje' : 'El usuario no tiene teléfono registrado'"
                        >
                          <span class="material-symbols-outlined">send</span>
                          <span>Enviar WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="modal-footer">
              <button class="pill-btn btn-secondary" (click)="closeWhatsAppModal()">Cerrar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class AsignacionListComponent implements OnInit {
  private asignacionService = inject(AsignacionService);
  private semanaService = inject(SemanaService);
  public authService = inject(AuthService);
  private grupoService = inject(GrupoService);
  private notificationService = inject(NotificationService);
  private route = inject(ActivatedRoute);

  semanas = signal<Semana[]>([]);
  deduplicatedSemanas = computed(() => {
    const list = this.semanas();
    const seen = new Set<string>();
    const result: Semana[] = [];
    const sorted = [...list].sort((a, b) => {
      const dateA = a.fecha_inicio ? a.fecha_inicio.substring(0, 10) : '';
      const dateB = b.fecha_inicio ? b.fecha_inicio.substring(0, 10) : '';
      return dateA.localeCompare(dateB);
    });
    for (const s of sorted) {
      const key = s.fecha_inicio ? s.fecha_inicio.substring(0, 10) : s.id;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(s);
      }
    }
    return result;
  });
  users = signal<any[]>([]);
  tipos = signal<TipoAsignacion[]>([]);
  grupos = signal<Grupo[]>([]);
  semanaActual: any = null;

  selectedSemanaId = '';
  loading = signal(false);

  showAssignModal = false;
  showEditDiaModal = false;
  showPdfExportModal = false;
  showWhatsAppModal = false;
  showBulkModal = false;
  savingDia = false;

  editingTipo: TipoAsignacion | null = null;
  editingDiaSemana = -1;
  editingAsignacion: Asignacion | null = null;

  assignForm = { user_id: '', grupo_id: '', tipo_id: '', observaciones: '' };
  dayFormMap: Record<string, { user_id: string; grupo_id: string; observaciones: string }> = {};
  selectedWeeksForExportSignal = signal<string[]>([]);
  previewWeeksDataMap = signal<Map<string, { semana: Semana; asignaciones: Asignacion[]; map: Map<string, Asignacion> }>>(new Map());
  loadingPreview = signal<boolean>(false);

  private asignacionMap = signal<Map<string, Asignacion>>(new Map());

  diasSemana = [
    { numero: 3, nombre: 'Miércoles (Entre semana)' },
    { numero: 6, nombre: 'Sábado (Fin de semana)' }
  ];

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['semana_id']) {
        this.selectedSemanaId = params['semana_id'];
      }
      this.loadSemanas();
    });
    this.loadTipos();
    this.loadUsers();
    this.loadGrupos();
  }

  loadGrupos() {
    this.grupoService.loadGrupos().subscribe({
      next: (res: any) => this.grupos.set(res.data)
    });
  }

  currentRefDate: Date = new Date();
  selectedDateInput: string = '';

  openDatePicker(picker: HTMLInputElement) {
    if (picker && typeof picker.showPicker === 'function') {
      picker.showPicker();
    } else if (picker) {
      picker.focus();
      picker.click();
    }
  }

  getMonday(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  }

  formatDateToISO(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getSelectedWeekDisplayTitle(): string {
    if (this.semanaActual && this.semanaActual.nombre) {
      return `${this.semanaActual.nombre} (${this.formatDate(this.semanaActual.fecha_inicio)} - ${this.formatDate(this.semanaActual.fecha_fin)})`;
    }
    const mon = this.getMonday(this.currentRefDate);
    const sun = new Date(mon);
    sun.setDate(sun.getDate() + 6);
    return `Semana del ${mon.getDate()} al ${sun.getDate()}`;
  }

  navigateWeek(offsetWeeks: number) {
    const newDate = new Date(this.currentRefDate);
    newDate.setDate(newDate.getDate() + (offsetWeeks * 7));
    this.currentRefDate = newDate;
    this.selectedDateInput = this.formatDateToISO(newDate);
    this.selectOrCreateWeekForDate(newDate);
  }

  onDateInputChange(event: Event) {
    const val = (event.target as HTMLInputElement).value;
    if (!val) return;
    const parts = val.split('-');
    if (parts.length === 3) {
      const pickedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      this.currentRefDate = pickedDate;
      this.selectedDateInput = val;
      this.selectOrCreateWeekForDate(pickedDate);
    }
  }

  selectOrCreateWeekForDate(date: Date) {
    const monday = this.getMonday(date);
    const mondayISO = this.formatDateToISO(monday);

    const existing = this.semanas().find((s: Semana) => {
      const semStart = s.fecha_inicio.substring(0, 10);
      return semStart === mondayISO;
    });

    if (existing) {
      this.selectedSemanaId = existing.id;
      this.loadSemana();
    } else {
      this.loading.set(true);
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      const nombreSemana = `Semana del ${monday.getDate()} al ${sunday.getDate()} de ${monday.toLocaleString('es-ES', { month: 'long' })} ${monday.getFullYear()}`;

      this.semanaService.createSemana({ fecha_inicio: mondayISO, nombre: nombreSemana }).subscribe({
        next: (newSem: any) => {
          this.semanaService.loadSemanas().subscribe({
            next: (res) => {
              this.semanas.set(res.data);
              const foundNew = res.data.find((s: Semana) => s.fecha_inicio.substring(0, 10) === mondayISO);
              this.selectedSemanaId = newSem.id || (foundNew ? foundNew.id : '');
              this.loadSemana();
            }
          });
        },
        error: () => {
          this.loading.set(false);
        }
      });
    }
  }

  parseLocalDate(dateStr: string): Date {
    if (!dateStr) return new Date();
    const parts = dateStr.substring(0, 10).split('-');
    if (parts.length === 3) {
      return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    return new Date(dateStr);
  }

  loadSemanas() {
    this.semanaService.loadSemanas().subscribe({
      next: (res) => {
        this.semanas.set(res.data);
        if (res.data.length > 0) {
          let selected = res.data.find((s: Semana) => s.id === this.selectedSemanaId);
          if (!selected) {
            const todayISO = this.formatDateToISO(new Date());
            const mondayISO = this.formatDateToISO(this.getMonday(new Date()));

            // 1. Semana del lunes actual
            selected = res.data.find((s: Semana) => !s.archivado && s.fecha_inicio.substring(0, 10) === mondayISO);

            // 2. O semana que abarca la fecha actual
            if (!selected) {
              selected = res.data.find((s: Semana) => {
                if (s.archivado) return false;
                const start = s.fecha_inicio.substring(0, 10);
                const end = s.fecha_fin ? s.fecha_fin.substring(0, 10) : '';
                return start <= todayISO && (!end || todayISO <= end);
              });
            }

            // 3. O la semana activa más cercana a hoy
            if (!selected) {
              const activeSemanas = res.data.filter((s: Semana) => !s.archivado);
              const candidates = activeSemanas.length > 0 ? activeSemanas : res.data;
              const todayTime = new Date().getTime();
              selected = candidates.reduce((prev: Semana, curr: Semana) => {
                const prevDist = Math.abs(this.parseLocalDate(prev.fecha_inicio).getTime() - todayTime);
                const currDist = Math.abs(this.parseLocalDate(curr.fecha_inicio).getTime() - todayTime);
                return currDist < prevDist ? curr : prev;
              }, candidates[0]);
            }

            if (selected) {
              this.selectedSemanaId = selected.id;
            }
          }
          if (selected && selected.fecha_inicio) {
            this.currentRefDate = this.parseLocalDate(selected.fecha_inicio);
            this.selectedDateInput = selected.fecha_inicio.substring(0, 10);
          }
          this.loadSemana();
        }
      }
    });
  }

  loadTipos() {
    this.asignacionService.loadTiposAsignacion().subscribe({
      next: (res: any) => this.tipos.set(res.data)
    });
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

  getAsignacionForTipo(tipoId: string): Asignacion | null {
    const map = this.asignacionMap();
    for (const val of map.values()) {
      if (val.tipo_asignacion_id === tipoId) {
        return val;
      }
    }
    return null;
  }

  getAsignacionForDiaAndTipo(diaSemana: number, tipoId: string): Asignacion | null {
    const map = this.asignacionMap();
    const key = `${diaSemana}-${tipoId}`;
    return map.get(key) || this.getAsignacionForTipo(tipoId);
  }

  getAssignmentsForDia(diaSemana: number): Asignacion[] {
    const map = this.asignacionMap();
    return Array.from(map.values());
  }

  getTotalAsignacionesSemana(): number {
    return this.asignacionMap().size;
  }

  getDiasConAsignacionesCount(): number {
    return this.asignacionMap().size > 0 ? 1 : 0;
  }

  getDiaNombre(diaSemana: number): string {
    return 'Semanal';
  }

  getWeekDisplayTitleForPdf(weekData: any): string {
    if (!weekData || !weekData.semana) return '';
    const sem = weekData.semana;
    if (sem.fecha_inicio && sem.fecha_fin) {
      const partsStart = sem.fecha_inicio.substring(0, 10).split('-');
      const partsEnd = sem.fecha_fin.substring(0, 10).split('-');
      if (partsStart.length === 3 && partsEnd.length === 3) {
        const months = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
        const dayStart = parseInt(partsStart[2], 10);
        const dayEnd = parseInt(partsEnd[2], 10);
        const monthIndex = parseInt(partsEnd[1], 10) - 1;
        const monthName = months[monthIndex] || '';
        return `Semana del ${dayStart} al ${dayEnd} ${monthName}`;
      }
    }
    return sem.nombre || '';
  }

  getPreviewAsignadoSemanal(weekData: any, tipoId: string): string {
    if (!weekData || !weekData.asignaciones) return '—';
    const asigs: Asignacion[] = weekData.asignaciones.filter((a: Asignacion) => a.tipo_asignacion_id === tipoId);
    if (asigs.length === 0) return '—';

    const names: string[] = [];
    for (const asig of asigs) {
      if (asig.grupo) {
        names.push(`Grupo ${asig.grupo.numero ? asig.grupo.numero + ' - ' : ''}${asig.grupo.nombre}`);
      } else if (asig.user && asig.user.nombre) {
        names.push(asig.user.nombre);
      } else if (asig.user_id) {
        const u = this.users().find((usr: any) => usr.id === asig.user_id);
        if (u) names.push(u.nombre);
      }
    }

    return names.length > 0 ? names.join(' / ') : '—';
  }

  getTipoNombre(nombre: string): string {
    const nombres: Record<string, string> = {
      'PRESIDENTE': 'Presidente',
      'LECTOR_ATALAYA': 'Lector Atalaya',
      'MICROFONO': 'Micrófono',
      'MICROFONO_IZQ': 'Micrófono Izquierda',
      'MICROFONO_DER': 'Micrófono Derecha',
      'PLATAFORMA': 'Plataforma',
      'ACOMODADOR_SALON': 'Acomodador',
      'ACOMODADOR_1': 'Acomodador 1',
      'ACOMODADOR_2': 'Acomodador 2',
      'PARQUEADERO': 'Parqueadero',
      'ASEO_SALON': 'Aseo del Salón',
      'HOSPITALIDAD': 'Hospitalidad'
    };
    return nombres[nombre] || nombre;
  }

  isGroupType(nombre?: string | null): boolean {
    return nombre === 'ASEO_SALON' || nombre === 'HOSPITALIDAD';
  }

  getTiposList(): TipoAsignacion[] {
    const t = this.tipos();
    if (Array.isArray(t) && t.length > 0) {
      return t
        .filter(item => item.nombre !== 'MICROFONO' && item.nombre !== 'ACOMODADOR_SALON')
        .sort((a, b) => {
          const order: Record<string, number> = {
            'PRESIDENTE': 1,
            'LECTOR_ATALAYA': 2,
            'MICROFONO_IZQ': 3,
            'MICROFONO_DER': 4,
            'PLATAFORMA': 5,
            'ACOMODADOR_1': 6,
            'ACOMODADOR_2': 7,
            'PARQUEADERO': 8,
            'ASEO_SALON': 9,
            'HOSPITALIDAD': 10
          };
          return (order[a.nombre] ?? 99) - (order[b.nombre] ?? 99);
        });
    }
    return [
      { id: '1', nombre: 'PRESIDENTE', icono: '🎯', descripcion: 'Presidente' },
      { id: '2', nombre: 'LECTOR_ATALAYA', icono: '📖', descripcion: 'Lector Atalaya' },
      { id: '3', nombre: 'MICROFONO_IZQ', icono: '🎤', descripcion: 'Micrófono Izquierda' },
      { id: '4', nombre: 'MICROFONO_DER', icono: '🎤', descripcion: 'Micrófono Derecha' },
      { id: '5', nombre: 'PLATAFORMA', icono: '📺', descripcion: 'Plataforma' },
      { id: '6', nombre: 'ACOMODADOR_1', icono: '🪑', descripcion: 'Acomodador 1' },
      { id: '7', nombre: 'ACOMODADOR_2', icono: '🪑', descripcion: 'Acomodador 2' },
      { id: '8', nombre: 'PARQUEADERO', icono: '🚗', descripcion: 'Parqueadero' },
      { id: '9', nombre: 'ASEO_SALON', icono: '🧹', descripcion: 'Aseo del Salón' },
      { id: '10', nombre: 'HOSPITALIDAD', icono: '☕', descripcion: 'Hospitalidad' }
    ] as TipoAsignacion[];
  }

  getUsersList(): any[] {
    const u = this.users();
    return Array.isArray(u) ? u : [];
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return this.parseLocalDate(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  getWeekFormattedTitle(semana: Semana): string {
    if (!semana || !semana.fecha_inicio) return semana?.nombre || '';
    const start = this.parseLocalDate(semana.fecha_inicio);
    const end = semana.fecha_fin ? this.parseLocalDate(semana.fecha_fin) : new Date(start.getTime() + 6 * 86400000);
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const startMonth = months[start.getMonth()];
    const endMonth = months[end.getMonth()];
    const year = end.getFullYear();

    if (start.getMonth() === end.getMonth()) {
      return `Semana del ${start.getDate()} al ${end.getDate()} de ${startMonth} ${year}`;
    }
    return `Semana del ${start.getDate()} de ${startMonth} al ${end.getDate()} de ${endMonth} ${year}`;
  }

  isCurrentWeek(semana: Semana): boolean {
    if (!semana || !semana.fecha_inicio) return false;
    const mondayISO = this.formatDateToISO(this.getMonday(new Date()));
    return semana.fecha_inicio.substring(0, 10) === mondayISO;
  }

  getFechaForDia(diaSemana: number): string {
    if (!this.semanaActual || !this.semanaActual.semana) return '';
    const start = this.parseLocalDate(this.semanaActual.semana.fecha_inicio);
    const date = new Date(start);
    date.setDate(start.getDate() + diaSemana);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  isTodayDia(diaSemana: number): boolean {
    if (!this.semanaActual || !this.semanaActual.semana) return false;
    const start = this.parseLocalDate(this.semanaActual.semana.fecha_inicio);
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

    if (this.editingAsignacion) {
      this.asignacionService.updateAsignacion(
        this.editingAsignacion.id,
        this.assignForm.user_id || undefined,
        this.assignForm.grupo_id || undefined,
        this.assignForm.observaciones || undefined
      ).subscribe({
        next: () => {
          this.loadSemana();
          this.notificationService.loadNotifications().subscribe();
          this.closeAssignModal();
        }
      });
    } else {
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
          this.notificationService.loadNotifications().subscribe();
          this.closeAssignModal();
        }
      });
    }
  }

  openEditDiaModal(diaSemana: number) {
    this.editingDiaSemana = diaSemana;
    this.dayFormMap = {};

    const tipos = this.getTiposList();
    tipos.forEach(tipo => {
      const existing = this.getAsignacionForDiaAndTipo(diaSemana, tipo.id);
      this.dayFormMap[tipo.id] = {
        user_id: existing?.user_id || '',
        grupo_id: existing?.grupo_id || '',
        observaciones: existing?.observaciones || ''
      };
    });

    this.showEditDiaModal = true;
  }

  closeEditDiaModal() {
    this.showEditDiaModal = false;
    this.editingDiaSemana = -1;
    this.dayFormMap = {};
  }

  saveDiaAsignaciones() {
    if (!this.selectedSemanaId || this.editingDiaSemana === -1) return;
    this.savingDia = true;

    const tipos = this.getTiposList();
    const requests: Observable<any>[] = [];

    for (const tipo of tipos) {
      const form = this.dayFormMap[tipo.id];
      const existing = this.getAsignacionForDiaAndTipo(this.editingDiaSemana, tipo.id);
      const isGroup = this.isGroupType(tipo.nombre);

      const selectedUserId = !isGroup && form?.user_id ? form.user_id : undefined;
      const selectedGrupoId = isGroup && form?.grupo_id ? form.grupo_id : undefined;

      if (selectedUserId || selectedGrupoId) {
        if (existing) {
          requests.push(this.asignacionService.updateAsignacion(
            existing.id,
            selectedUserId,
            selectedGrupoId,
            form?.observaciones || undefined
          ));
        } else {
          const payload = {
            semana_id: this.selectedSemanaId,
            tipo_asignacion_id: tipo.id,
            user_id: selectedUserId || null,
            grupo_id: selectedGrupoId || null,
            dia_semana: this.editingDiaSemana,
            observaciones: form?.observaciones || undefined
          };
          requests.push(this.asignacionService.createAsignacion(payload as any));
        }
      } else if (existing) {
        requests.push(this.asignacionService.deleteAsignacion(existing.id));
      }
    }

    if (requests.length === 0) {
      this.savingDia = false;
      this.closeEditDiaModal();
      return;
    }

    forkJoin(requests).subscribe({
        next: () => {
          this.savingDia = false;
          this.loadSemana();
          this.notificationService.loadNotifications().subscribe();
          this.closeEditDiaModal();
        },
        error: (err) => {
          console.error('Error guardando asignaciones del día', err);
          this.savingDia = false;
          this.loadSemana();
          this.notificationService.loadNotifications().subscribe();
          this.closeEditDiaModal();
        }
      });
  }

  openBulkModal() {
    if (!this.selectedSemanaId) return;
    alert('Función de programación masiva habilitada.');
  }

  openPdfExportModal() {
    this.showPdfExportModal = true;
    if (this.selectedSemanaId && this.selectedWeeksForExportSignal().length === 0) {
      this.selectedWeeksForExportSignal.set([this.selectedSemanaId]);
    }
    this.fetchPreviewDataForSelectedWeeks();
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
    this.fetchPreviewDataForSelectedWeeks();
  }

  selectCurrentMonthWeeks() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const monthIds = this.deduplicatedSemanas()
      .filter((s: Semana) => {
        if (!s.fecha_inicio) return false;
        const d = this.parseLocalDate(s.fecha_inicio);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .map((s: Semana) => s.id);

    this.selectedWeeksForExportSignal.set(monthIds);
    this.fetchPreviewDataForSelectedWeeks();
  }

  selectNext4Weeks() {
    const todayMondayISO = this.formatDateToISO(this.getMonday(new Date()));
    const upcoming = this.deduplicatedSemanas()
      .filter((s: Semana) => (s.fecha_inicio ? s.fecha_inicio.substring(0, 10) >= todayMondayISO : false))
      .slice(0, 4)
      .map((s: Semana) => s.id);

    this.selectedWeeksForExportSignal.set(upcoming.length > 0 ? upcoming : this.deduplicatedSemanas().slice(0, 4).map(s => s.id));
    this.fetchPreviewDataForSelectedWeeks();
  }

  selectAllWeeksForExport() {
    const allIds = this.deduplicatedSemanas().map((s: Semana) => s.id);
    this.selectedWeeksForExportSignal.set(allIds);
    this.fetchPreviewDataForSelectedWeeks();
  }

  deselectAllWeeksForExport() {
    this.selectedWeeksForExportSignal.set([]);
  }

  fetchPreviewDataForSelectedWeeks() {
    const selectedIds = this.selectedWeeksForExportSignal();
    if (selectedIds.length === 0) return;

    const currentMap = new Map(this.previewWeeksDataMap());
    const missingIds = selectedIds.filter(id => !currentMap.has(id));

    if (missingIds.length === 0) return;

    this.loadingPreview.set(true);
    const requests = missingIds.map(id => this.asignacionService.loadAsignacionesBySemana(id));

    forkJoin(requests).subscribe({
      next: (results: any[]) => {
        const updatedMap = new Map(this.previewWeeksDataMap());
        results.forEach((data: any) => {
          if (data && data.id) {
            const asigMap = new Map<string, Asignacion>();
            data.asignaciones?.forEach((a: Asignacion) => {
              asigMap.set(`${a.dia_semana}-${a.tipo_asignacion_id}`, a);
            });
            updatedMap.set(data.id, {
              semana: data,
              asignaciones: data.asignaciones || [],
              map: asigMap
            });
          }
        });
        this.previewWeeksDataMap.set(updatedMap);
        this.loadingPreview.set(false);
      },
      error: (err) => {
        console.error('Error cargando semanas para previsualización PDF', err);
        this.loadingPreview.set(false);
      }
    });
  }

  getOrderedSelectedWeeks(): string[] {
    const allSemanas = this.deduplicatedSemanas();
    const selectedIds = this.selectedWeeksForExportSignal();
    const set = new Set<string>();
    const result: string[] = [];
    for (const s of allSemanas) {
      if (selectedIds.includes(s.id) && !set.has(s.id)) {
        set.add(s.id);
        result.push(s.id);
      }
    }
    return result;
  }

  getPreviewWeekData(semanaId: string): any {
    return this.previewWeeksDataMap().get(semanaId) || null;
  }

  getPreviewAsignado(weekData: any, diaSemana: number, tipoId: string): string {
    if (!weekData || !weekData.map) return '—';
    const asig: Asignacion | undefined = weekData.map.get(`${diaSemana}-${tipoId}`);
    if (!asig) return '—';

    if (asig.grupo) {
      return `Grupo ${asig.grupo.numero ? asig.grupo.numero + ' - ' : ''}${asig.grupo.nombre}`;
    }
    if (asig.user && asig.user.nombre) {
      return asig.user.nombre;
    }
    if (asig.user_id) {
      const u = this.users().find((usr: any) => usr.id === asig.user_id);
      if (u) return u.nombre;
    }
    return '—';
  }

  generatePdfWithSelection() {
    window.print();
  }

  openWhatsAppModal() {
    this.showWhatsAppModal = true;
  }

  closeWhatsAppModal() {
    this.showWhatsAppModal = false;
  }

  getAssignedListForWhatsApp(): any[] {
    const tipos = this.getTiposList();
    const result: any[] = [];
    const semanaTitle = this.getSelectedWeekDisplayTitle();

    tipos.forEach(tipo => {
      const asig = this.getAsignacionForTipo(tipo.id);
      if (asig) {
        let nombreAsignado = '';
        let telefono = '';

        if (asig.grupo) {
          nombreAsignado = `Grupo ${asig.grupo.numero ? asig.grupo.numero + ' - ' : ''}${asig.grupo.nombre}`;
        } else if (asig.user && asig.user.nombre) {
          nombreAsignado = asig.user.nombre;
          telefono = asig.user.telefono || '';
          if (!telefono && asig.user?.id) {
            const u = this.users().find((usr: any) => usr.id === asig.user?.id);
            if (u && u.telefono) telefono = u.telefono;
          }
        } else if (asig.user_id) {
          const u = this.users().find((usr: any) => usr.id === asig.user_id);
          if (u) {
            nombreAsignado = u.nombre;
            telefono = u.telefono || '';
          }
        }

        if (nombreAsignado) {
          const tipoNombre = this.getTipoNombre(tipo.nombre);
          const msg = `Hola *${nombreAsignado}*, te recordamos tu asignación en la Congregación Alameda para la *${semanaTitle}*:\n\n📌 *Función:* ${tipoNombre}\n🗓️ *Período:* ${semanaTitle}\n\n¡Muchas gracias por tu colaboración y apoyo! 🙏`;
          result.push({
            tipo_id: tipo.id,
            tipo_nombre: tipoNombre,
            nombre_asignado: nombreAsignado,
            telefono: telefono,
            mensaje_raw: msg,
            mensaje_preview: msg
          });
        }
      }
    });

    return result;
  }

  cleanPhoneNumber(phone: string): string {
    if (!phone) return '';
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    } else if (cleaned.startsWith('0')) {
      cleaned = '593' + cleaned.substring(1);
    }
    return cleaned;
  }

  sendWhatsAppReminder(item: any) {
    if (!item.telefono) return;
    const phone = this.cleanPhoneNumber(item.telefono);
    const encoded = encodeURIComponent(item.mensaje_raw);
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`;
    window.open(url, '_blank');
  }
}
