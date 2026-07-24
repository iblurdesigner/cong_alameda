import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AsignacionService, Asignacion, TipoAsignacion } from '../../core/services/asignacion.service';
import { SemanaService, Semana } from '../../core/services/semana.service';
import { AuthService } from '../../core/services/auth.service';
import { GrupoService, Grupo } from '../../core/services/grupo.service';
import { forkJoin, Observable } from 'rxjs';

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
                      @if (tipo.nombre === 'ASEO_SALON') {
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
                    <span class="sidebar-label">Semanas ({{ selectedWeeksForExportSignal().length }}):</span>
                    <div class="sidebar-btns">
                      <button type="button" class="text-btn" (click)="selectAllWeeksForExport()">Todas</button>
                      <span class="sep">|</span>
                      <button type="button" class="text-btn" (click)="deselectAllWeeksForExport()">Ninguna</button>
                    </div>
                  </div>
                  <div class="weeks-checklist">
                    @for (semana of semanas(); track semana.id) {
                      <label class="week-checkbox-row" [class.selected]="isSemanaSelectedForExport(semana.id)">
                        <input 
                          type="checkbox" 
                          [checked]="isSemanaSelectedForExport(semana.id)"
                          (change)="toggleSemanaSelection(semana.id)"
                        />
                        <div class="week-info">
                          <span class="week-row-name">{{ semana.nombre }}</span>
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

    .week-nav-container {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      flex: 1;
    }

    .nav-arrow-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.55rem 1.1rem;
      border-radius: var(--radius-pill);
      border: 1px solid var(--border-color);
      background: var(--background-color);
      color: var(--text-primary);
      font-weight: 700;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: var(--primary-color);
        color: #ffffff;
        border-color: var(--primary-color);
      }

      .material-symbols-outlined {
        font-size: 1.25rem;
      }
    }

    .week-current-picker {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: var(--background-color);
      padding: 0.5rem 1.25rem;
      border-radius: var(--radius-pill);
      border: 1px solid var(--border-color);
      flex: 1;
      min-width: 280px;

      .week-icon {
        color: var(--primary-color);
        font-size: 1.5rem;
      }
    }

    .week-date-input-wrapper {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      width: 100%;

      .week-display-title {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 0.95rem;
        font-weight: 800;
        color: var(--text-primary);
      }

      .date-picker-input {
        position: absolute;
        opacity: 0;
        width: 0;
        height: 0;
        border: none;
        padding: 0;
        margin: 0;
      }

      .btn-change-date {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.35rem 0.75rem;
        border-radius: var(--radius-pill);
        background: var(--surface-color);
        border: 1px solid var(--border-color);
        color: var(--text-primary);
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: var(--primary-color);
          color: #ffffff;
          border-color: var(--primary-color);
        }

        .material-symbols-outlined {
          font-size: 1rem;
        }
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

    .day-header-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .edit-card-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.4rem 0.75rem;
      border-radius: var(--radius-pill);
      background: rgba(37, 99, 235, 0.08);
      color: var(--primary-color);
      border: 1px solid rgba(37, 99, 235, 0.2);
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;

      span.material-symbols-outlined {
        font-size: 1.1rem;
      }

      &:hover {
        background: var(--primary-color);
        color: #ffffff;
        border-color: var(--primary-color);
        transform: translateY(-1px);
      }
    }

    .day-bulk-body {
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .section-desc {
        font-size: 0.9rem;
        color: var(--text-secondary);
        margin: 0;
      }
    }

    .roles-edit-grid {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-height: 420px;
      overflow-y: auto;
      padding-right: 0.5rem;
    }

    .role-edit-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0.75rem 1rem;
      background: var(--background-color);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border-color);

      .role-label {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        min-width: 180px;

        .role-icon {
          font-size: 1.25rem;
        }

        .role-name {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-primary);
        }
      }

      .role-input-group {
        flex: 1;
        max-width: 320px;

        .form-input {
          width: 100%;
          padding: 0.5rem 0.85rem;
          border-radius: var(--radius-pill);
          border: 1px solid var(--border-color);
          background: var(--surface-color);
          color: var(--text-primary);
          font-size: 0.875rem;
          outline: none;

          &:focus {
            border-color: var(--primary-color);
          }
        }
      }
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

    /* Estilos Modal PDF y Vista Previa Imprimible */
    .pdf-modal-card {
      max-width: 1100px !important;
      width: 95vw !important;
      height: 88vh !important;
      display: flex;
      flex-direction: column;
      padding: 1.5rem !important;
    }

    .pdf-modal-title {
      display: flex;
      align-items: center;
      gap: 1rem;

      .icon {
        font-size: 2.2rem;
        color: #ef4444;
      }
      h2 {
        font-size: 1.35rem;
        margin: 0;
      }
      .subtitle {
        font-size: 0.85rem;
        color: var(--text-secondary);
        margin: 0.1rem 0 0 0;
      }
    }

    .pdf-modal-body {
      flex: 1;
      overflow: hidden;
      padding: 0.5rem 0;
      display: flex;
    }

    .pdf-split-layout {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 1.25rem;
      width: 100%;
      height: 100%;
    }

    .pdf-sidebar {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1rem;
      overflow: hidden;
    }

    .sidebar-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-color);

      .sidebar-label {
        font-weight: 700;
        font-size: 0.85rem;
        color: var(--text-primary);
      }

      .sidebar-btns {
        display: flex;
        align-items: center;
        gap: 0.35rem;
        .sep { color: var(--text-secondary); font-size: 0.8rem; }
      }

      .text-btn {
        background: none;
        border: none;
        color: var(--primary-color);
        font-weight: 600;
        font-size: 0.8rem;
        cursor: pointer;
        padding: 0 0.2rem;

        &:hover { text-decoration: underline; }
      }
    }

    .weeks-checklist {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: none;
      margin-top: 0;
    }

    .week-checkbox-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.65rem 0.85rem;
      background: var(--background-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        border-color: var(--primary-color);
      }

      &.selected {
        border-color: var(--primary-color);
        background: rgba(37, 99, 235, 0.08);
      }

      input[type="checkbox"] {
        width: 18px;
        height: 18px;
        accent-color: var(--primary-color);
        cursor: pointer;
      }

      .week-info {
        display: flex;
        flex-direction: column;
      }

      .week-row-name { font-weight: 600; font-size: 0.88rem; color: var(--text-primary); }
      .week-row-date { font-size: 0.78rem; color: var(--text-secondary); }
    }

    .pdf-preview-container {
      display: flex;
      flex-direction: column;
      background: #f1f5f9;
      border-radius: var(--radius-lg);
      border: 1px solid #cbd5e1;
      overflow: hidden;
    }

    .pdf-preview-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.65rem 1.25rem;
      background: #e2e8f0;
      border-bottom: 1px solid #cbd5e1;

      .toolbar-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 700;
        font-size: 0.88rem;
        color: #334155;

        .material-symbols-outlined { font-size: 1.15rem; color: #2563eb; }
      }

      .toolbar-badge {
        font-size: 0.75rem;
        font-weight: 700;
        background: #ffffff;
        color: #475569;
        padding: 0.2rem 0.65rem;
        border-radius: 999px;
        border: 1px solid #cbd5e1;
      }
    }

    .pdf-preview-viewport {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }

    /* Hoja imprimible simulada en la previsualización */
    .pdf-printable-sheet {
      background: #ffffff;
      color: #1e293b;
      width: 100%;
      max-width: 740px;
      min-height: 700px;
      padding: 2.25rem;
      border-radius: 4px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      font-family: 'Plus Jakarta Sans', Arial, sans-serif;

      .sheet-header {
        text-align: center;
        border-bottom: 2px solid #0f172a;
        padding-bottom: 0.85rem;
        margin-bottom: 1.5rem;

        .sheet-org {
          font-size: 1.35rem;
          font-weight: 900;
          letter-spacing: 0.05em;
          color: #0f172a;
          margin: 0;
        }

        .sheet-doc-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #475569;
          margin: 0.3rem 0 0 0;
          text-transform: uppercase;
        }
      }

      .sheet-week-block {
        margin-bottom: 0.5rem;
        page-break-inside: avoid;
      }

      .sheet-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.74rem;

        th, td {
          border: 1px solid #64748b;
          padding: 2px 6px;
          text-align: left;
        }

        .row-week-header th {
          background: #e2e8f0;
          color: #0f172a;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 0.76rem;
          padding: 3px 6px;
        }

        .col-role { width: 30%; }
        .col-assigned { width: 70%; }

        .cell-role {
          background: #ffffff;
          color: #1e293b;
          font-weight: 700;
        }

        .cell-assigned {
          color: #0f172a;
          font-weight: 600;
        }
      }

      .preview-empty, .preview-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem 2rem;
        text-align: center;
        color: #64748b;
        gap: 1rem;

        .material-symbols-outlined { font-size: 3rem; color: #94a3b8; }
        p { max-width: 320px; font-size: 0.92rem; margin: 0; }
      }
    }

    /* Reglas especiales de Impresión / PDF A4 Estricto */
    @media print {
      @page {
        size: A4 portrait;
        margin: 6mm 10mm;
      }

      /* Ocultar UI web que no corresponde al PDF */
      header, nav, .sidebar, .sidebar-header, .logo-container, .overlay, .user-card, .nav-list,
      .top-header, .week-selector-card, .weekly-stream-container, 
      .pdf-header, .pdf-sidebar, .pdf-preview-toolbar, .modal-footer, .close-btn,
      .empty-selection-card, .loading-card {
        display: none !important;
        visibility: hidden !important;
      }

      *, *::before, *::after {
        box-sizing: border-box !important;
      }

      /* Reset completo de contenedores padres en impresión */
      html, body, app-root, .asignaciones-container, .modal-backdrop, .modal-card,
      .pdf-modal-backdrop, .pdf-modal-card, .pdf-modal-body, .pdf-split-layout,
      .pdf-preview-container, .pdf-preview-viewport {
        position: static !important;
        background: transparent !important;
        background-color: transparent !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        border: none !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
        display: block !important;
        transform: none !important;
      }

      /* Hoja imprimible limpia alineada y sin desbordes */
      .pdf-printable-sheet {
        position: relative !important;
        left: auto !important;
        top: auto !important;
        width: 100% !important;
        max-width: 100% !important;
        background: #ffffff !important;
        box-shadow: none !important;
        border: none !important;
        padding: 0 !important;
        margin: 0 auto !important;
        font-size: 8.5px !important;
        display: block !important;
        box-sizing: border-box !important;
      }

      .sheet-header {
        padding-bottom: 0.2rem !important;
        margin-bottom: 0.35rem !important;
        border-bottom: 1.5px solid #0f172a !important;
        width: 100% !important;
        box-sizing: border-box !important;

        .sheet-org {
          font-size: 1.1rem !important;
        }
        .sheet-doc-title {
          font-size: 0.76rem !important;
          margin-top: 0.1rem !important;
        }
      }

      .sheet-week-block {
        margin-bottom: 0.3rem !important;
        page-break-inside: avoid !important;
        width: 100% !important;
        box-sizing: border-box !important;
      }

      .sheet-table {
        font-size: 8.5px !important;
        width: 100% !important;
        box-sizing: border-box !important;
        table-layout: fixed !important;

        th, td {
          padding: 2px 6px !important;
          line-height: 1.15 !important;
          box-sizing: border-box !important;
          word-break: break-word !important;
        }

        .row-week-header th {
          font-size: 8.8px !important;
          padding: 2.5px 6px !important;
        }

        .col-role { width: 33% !important; }
        .col-assigned { width: 67% !important; }
      }
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
  showEditDiaModal = false;
  showPdfExportModal = false;
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

  loadSemanas() {
    this.semanaService.loadSemanas().subscribe({
      next: (res) => {
        this.semanas.set(res.data);
        if (res.data.length > 0 && !this.selectedSemanaId) {
          const active = res.data.find((s: Semana) => !s.archivado) || res.data[0];
          this.selectedSemanaId = active.id;
          if (active.fecha_inicio) {
            this.currentRefDate = new Date(active.fecha_inicio);
            this.selectedDateInput = active.fecha_inicio.substring(0, 10);
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
    return this.getAsignacionForTipo(tipoId);
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
      'ASEO_SALON': 'Aseo del Salón'
    };
    return nombres[nombre] || nombre;
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
            'ASEO_SALON': 9
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
      { id: '9', nombre: 'ASEO_SALON', icono: '🧹', descripcion: 'Aseo del Salón' }
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
      if (form && (form.user_id || form.grupo_id)) {
        const payload = {
          semana_id: this.selectedSemanaId,
          tipo_asignacion_id: tipo.id,
          user_id: form.user_id || undefined,
          grupo_id: form.grupo_id || undefined,
          dia_semana: this.editingDiaSemana,
          observaciones: form.observaciones || undefined
        };
        requests.push(this.asignacionService.createAsignacion(payload as any));
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
          this.closeEditDiaModal();
        },
        error: (err) => {
          console.error('Error guardando asignaciones del día', err);
          this.savingDia = false;
          this.loadSemana();
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

  selectAllWeeksForExport() {
    const allIds = this.semanas().map((s: Semana) => s.id);
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
    const allSemanas = this.semanas();
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
}
