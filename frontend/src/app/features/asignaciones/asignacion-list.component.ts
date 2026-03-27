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
    <div class="asignaciones-page">
      <!-- Header -->
      <header class="header">
        <div class="header-left">
          <h1>📅 Asignaciones Semanales</h1>
          <p>Programa el equipo de servicio para cada día de la semana</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" (click)="toggleAllWeeksView()">
            📋 {{ showAllWeeksView ? 'Volver al Calendario' : 'Ver Todas las Semanas' }}
          </button>
          <button class="btn btn-outline" (click)="exportAllToPDF()">
            📄 Exportar PDF
          </button>
          @if (authService.isSuperintendente() || authService.isSuperAdmin()) {
            <button class="btn btn-primary btn-lg" (click)="openBulkModal()">
              ➕ Nueva Programación
            </button>
          }
        </div>
      </header>

      @if (showAllWeeksView) {
        <!-- All Weeks View - Table Format -->
        <div class="all-weeks-table-view">
          <h2>Todas las Asignaciones</h2>
          <div class="table-container">
            <table class="assignments-table">
              <thead>
                <tr>
                  <th>Semana</th>
                  <th>Día</th>
                  <th>Tipo</th>
                  <th>Asignado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                @for (semana of getAllAssignmentsFlat(); track semana.key) {
                  <tr>
                    <td>{{ semana.semanaNombre }}</td>
                    <td>{{ getDiaNombre(semana.diaSemana) }}</td>
                    <td>
                      <span class="tipo-icon">{{ semana.tipoIcono }}</span>
                      {{ semana.tipoNombre }}
                    </td>
                    <td>
                      {{ semana.asignadoNombre }}
                      @if (semana.esGrupo) {
                        <span class="grupo-badge">Grupo</span>
                      }
                    </td>
                    <td>
                      @if (semana.asignacionId) {
                        <button class="btn-icon" (click)="editAssignmentById(semana)">
                          ✏️
                        </button>
                      } @else {
                        <button class="btn-icon btn-add" (click)="addAssignmentByTipo(semana)">
                          ➕
                        </button>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="empty-message">No hay asignaciones registradas</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      } @else {
        <!-- Calendar View -->
        <div class="calendar-container">
          <div class="calendar">
            <div class="calendar-header">
              <button class="nav-btn" (click)="previousMonth()">❮</button>
              <span class="month-title">{{ getMonthName(calendarMonth) }} {{ calendarYear }}</span>
              <button class="nav-btn" (click)="nextMonth()">❯</button>
            </div>
            <div class="weekdays">
              <span>Dom</span><span>Lun</span><span>Mar</span><span>Mié</span><span>Jue</span><span>Vie</span><span>Sáb</span>
            </div>
            <div class="days">
              @for (day of calendarDays; track $index) {
                <button 
                  class="day"
                  [class.other-month]="day.otherMonth"
                  [class.today]="day.isToday"
                  [class.has-assignments]="hasAssignments(day.date)"
                  [class.selected]="isSelectedDay(day.date)"
                  [class.weekend]="getDayOfWeek(day.date) === 0 || getDayOfWeek(day.date) === 6"
                  (click)="selectDay(day)"
                >
                  <span class="day-number" 
                        [class.with-assignments]="hasAssignments(day.date)"
                        [class.selected]="isSelectedDay(day.date)"
                        [class.weekend]="getDayOfWeek(day.date) === 0 || getDayOfWeek(day.date) === 6">
                    {{ day.day }}
                  </span>
                </button>
              }
            </div>
          </div>

          <!-- Leyenda -->
          <div class="leyenda">
            <div class="leyenda-item">
              <span class="leyenda-badge normal"></span>
              <span>Disponible</span>
            </div>
            <div class="leyenda-item">
              <span class="leyenda-badge selected"></span>
              <span>Seleccionado</span>
            </div>
            <div class="leyenda-item">
              <span class="leyenda-badge has-assignments"></span>
              <span>Con asignaciones</span>
            </div>
            <div class="leyenda-item">
              <span class="leyenda-badge weekend"></span>
              <span>Fin de semana</span>
            </div>
          </div>
        </div>

        <!-- Selected Day Panel -->
        @if (selectedDate) {
          <div class="day-panel">
            <div class="panel-header">
              <div class="panel-title">
                <span class="day-name">{{ getDiaNombre(getDayOfWeek(selectedDate)) }}</span>
                <span class="full-date">{{ formatFullDate(selectedDate) }}</span>
              </div>
              @if (authService.isSuperintendente() || authService.isSuperAdmin()) {
                <button class="btn btn-primary" (click)="openAssignModal(null!, getDayOfWeek(selectedDate))">
                  ➕ Agregar Persona
                </button>
              }
            </div>

            <!-- Categories Grid -->
            <div class="categories-grid">
              @for (tipo of getTiposList(); track tipo.id) {
                @if (getAsignacionForDayAndTipo(selectedDate!, tipo.id); as asignacion) {
                  <div class="assignment-card">
                    <div class="assignment-type">
                      <span class="icono">{{ tipo.icono || '📋' }}</span>
                      <span class="nombre">{{ getTipoNombre(tipo.nombre) }}</span>
                    </div>
                    @if (asignacion && (asignacion.user || asignacion.grupo)) {
                      <div class="assignment-person">
                        <span class="person-name">
                          {{ asignacion.user?.nombre || asignacion.grupo?.nombre || 'Asignado' }}
                          @if (asignacion.grupo) {
                            <span class="grupo-badge">Grupo</span>
                          }
                        </span>
                        @if (authService.isSuperintendente() || authService.isSuperAdmin()) {
                          <button class="btn-icon" (click)="editAsignacion(asignacion, tipo, getDayOfWeek(selectedDate!))">
                            ✏️
                          </button>
                        }
                      </div>
                    } @else {
                      <div class="no-assignment">
                        @if (authService.isSuperintendente() || authService.isSuperAdmin()) {
                          <button class="btn btn-outline btn-sm" (click)="openAssignModal(tipo, getDayOfWeek(selectedDate!))">
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
                        <button class="btn btn-outline btn-sm" (click)="openAssignModal(tipo, getDayOfWeek(selectedDate!))">
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
        } @else {
          <div class="empty-state">
            <p>Selecciona un día del calendario para ver sus asignaciones</p>
          </div>
        }
      }

    <!-- Assign Modal -->

    <!-- Assign Modal -->
    @if (showAssignModal) {
      <div class="modal-overlay" (click)="closeAssignModal()">
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ assignForm.isEditing ? '✏️ Editar Asignación' : 'Agregar Persona' }}</h2>
            <button class="btn-close" (click)="closeAssignModal()">×</button>
          </div>
          <div class="modal-body">
            <!-- Show current assignment info when editing -->
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

            <!-- Assignment Type Selector -->
            <div class="form-group">
              <label for="tipoAsignacion">Tipo de Asignación *</label>
              <select id="tipoAsignacion" [(ngModel)]="assignForm.tipo_id" (ngModelChange)="onTipoChange()">
                <option value="">Seleccionar tipo...</option>
                @for (tipo of getTiposList(); track tipo.id) {
                  <option [value]="tipo.id">{{ tipo.icono }} {{ getTipoNombre(tipo.nombre) }}</option>
                }
              </select>
            </div>

            <!-- Show assignments for selected type (only when not editing) -->
            @if (!assignForm.isEditing && assignForm.tipo_id && getCurrentAssignmentsForTipo().length > 0) {
              <div class="current-assignments">
                <h4>Personas Asignadas:</h4>
                @for (assignment of getCurrentAssignmentsForTipo(); track assignment.id) {
                  <div class="assignment-item">
                    <span>{{ assignment.user?.nombre || assignment.grupo?.nombre || 'Asignado' }}</span>
                    <button class="btn-icon btn-danger" (click)="removeAssignment(assignment.id)">🗑️</button>
                  </div>
                }
              </div>
            }

            <!-- Add/Edit person -->
            @if (assignForm.tipo_id) {
              <!-- Show groups for ASEO_SALON type -->
              @if (assignForm.tipo_id === 'b10c74a7-ba4c-4a71-b639-1248aa404eb4') {
                <div class="form-group">
                  <label for="grupoSelect">Seleccionar Grupo:</label>
                  <select id="grupoSelect" [(ngModel)]="assignForm.grupo_id">
                    <option value="">Seleccionar grupo...</option>
                    @for (grupo of getGruposList(); track grupo.id) {
                      <option [value]="grupo.id">{{ grupo.nombre }} ({{ grupo.numero }})</option>
                    }
                  </select>
                </div>
              }
              
              <div class="form-group">
                <label for="nuevaPersona">{{ assignForm.tipo_id === 'b10c74a7-ba4c-4a71-b639-1248aa404eb4' ? 'O seleccionar Persona:' : 'Seleccionar Persona:' }}</label>
                <div class="add-person-row">
                  <select id="nuevaPersona" [(ngModel)]="assignForm.user_id">
                    <option value="">Seleccionar persona...</option>
                    @for (user of getAvailableUsersForTipo(); track user.id) {
                      <option [value]="user.id">{{ user.nombre }} ({{ user.rol }})</option>
                    }
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label for="observaciones">Observaciones:</label>
                <textarea id="observaciones" [(ngModel)]="assignForm.observaciones" rows="2" 
                  placeholder="Observaciones opcionales..."></textarea>
              </div>
            }
          </div>
          <div class="modal-footer">
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

    <!-- Bulk Assign Modal - NEW DESIGN -->
    @if (showBulkModal) {
      <div class="modal-overlay" (click)="closeBulkModal()">
        <div class="modal-full" (click)="$event.stopPropagation()">
          <div class="modal-header-simple">
            <h2>📅 Programar Asignaciones</h2>
            <button class="btn-close" (click)="closeBulkModal()">×</button>
          </div>
          
          <div class="modal-content">
            <!-- Calendar Section -->
            <div class="calendar-section">
              <h3>Selecciona una fecha</h3>
              <div class="mini-calendar">
                <div class="mini-cal-header">
                  <button class="nav-btn-sm" (click)="previousMonth()">❮</button>
                  <span>{{ getMonthName(calendarMonth) }} {{ calendarYear }}</span>
                  <button class="nav-btn-sm" (click)="nextMonth()">❯</button>
                </div>
                <div class="mini-weekdays">
                  <span>D</span><span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span>
                </div>
                <div class="mini-days">
                  @for (day of calendarDays; track $index) {
                    <button 
                      class="mini-day"
                      [class.other-month]="day.otherMonth"
                      [class.selected]="selectedBulkDate === day.date"
                      (click)="selectBulkDate(day.date)"
                    >
                      {{ day.day }}
                    </button>
                  }
                </div>
              </div>
              
              @if (selectedBulkDate) {
                <div class="selected-date-display">
                  <span class="date-label">Fecha seleccionada:</span>
                  <span class="date-value">{{ formatFullDate(selectedBulkDate) }}</span>
                </div>
              }
            </div>

            <!-- Categories Section -->
            <div class="categories-section">
              <h3>Categorías y Personal</h3>
              
              @for (tipo of getTiposList(); track tipo.id) {
                <div class="category-card">
                  <div class="category-header">
                    <span class="category-icon">{{ tipo.icono }}</span>
                    <span class="category-name">{{ getTipoNombre(tipo.nombre) }}</span>
                  </div>
                  
                  <div class="category-assignments">
                    @for (assignment of getBulkAssignments(tipo.id); track $index) {
                      <div class="assignment-chip">
                        <span>{{ getUserName(assignment.userId) }}</span>
                        <button class="remove-btn" (click)="removeBulkAssignment(tipo.id, $index)">×</button>
                      </div>
                    }
                  </div>
                  
                  <div class="add-assignment">
                    @if (isAseoSalon(tipo.nombre)) {
                      <select [(ngModel)]="newAssignmentUserId[tipo.id]" (change)="addBulkAssignmentFromSelect(tipo.id)">
                        <option value="">+ Agregar grupo...</option>
                        @for (grupo of getGruposList(); track grupo.id) {
                          <option [value]="'grupo_' + grupo.id">{{ grupo.nombre }}</option>
                        } @empty {
                          <option value="">No hay grupos</option>
                        }
                      </select>
                    } @else {
                      <select [(ngModel)]="newAssignmentUserId[tipo.id]" (change)="addBulkAssignmentFromSelect(tipo.id)">
                        <option value="">+ Agregar persona...</option>
                        @for (user of getAllUsers(); track user.id) {
                          <option [value]="user.id">{{ user.nombre }}</option>
                        } @empty {
                          <option value="">No hay usuarios</option>
                        }
                      </select>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="modal-footer-simple">
            <button class="btn btn-outline" (click)="closeBulkModal()">Cancelar</button>
            <button class="btn btn-primary" (click)="saveBulkAsignaciones()">
              💾 Guardar Asignaciones
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Summary Modal -->
    @if (showSummaryModalFlag) {
      <div class="modal-overlay" (click)="closeSummaryModal()">
        <div class="modal modal-xl" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>✅ Asignaciones Guardadas</h2>
            <button class="btn-close" (click)="closeSummaryModal()">×</button>
          </div>
          <div class="modal-body">
            <p class="summary-intro">Se han guardado las siguientes asignaciones:</p>
            
            @for (semanaData of getSortedSummaryData(); track semanaData.semana.id) {
              <div class="summary-semana">
                <h3>{{ semanaData.semana.nombre }}</h3>
                <p class="date-range">
                  {{ formatDate(semanaData.semana.fecha_inicio) }} - {{ formatDate(semanaData.semana.fecha_fin) }}
                </p>
                
                @for (tipo of getTiposList(); track tipo.id) {
                  @if (getAssignmentsForTipoAndSemana(semanaData, tipo.id).length > 0) {
                    <div class="summary-tipo">
                      <span class="tipo-icon">{{ tipo.icono }}</span>
                      <span class="tipo-name">{{ getTipoNombre(tipo.nombre) }}</span>
                      <div class="tipo-personas">
                        @for (asig of getAssignmentsForTipoAndSemana(semanaData, tipo.id); track asig.id) {
                          <span class="person-tag">{{ asig.user?.nombre || 'Usuario' }}</span>
                        }
                      </div>
                    </div>
                  }
                }
              </div>
            }
            
            @if (summaryData.length === 0) {
              <div class="empty-summary">
                <p>No hay asignaciones guardadas todavía.</p>
              </div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="exportToPDF()">
              📄 Exportar PDF
            </button>
            <button class="btn btn-primary" (click)="closeSummaryModal()">
              Aceptar
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
    .header-actions { display: flex; gap: 0.75rem; }
    .filters-bar { margin-bottom: 1.5rem; }
    .filters-bar select { padding: 0.625rem 0.875rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--surface-color); color: var(--text-primary); min-width: 250px; }
    .loading, .empty-state { text-align: center; padding: 3rem; color: var(--text-secondary); }
    .semana-info { margin-bottom: 1.5rem; }
    .semana-info h2 { margin: 0; font-size: 1.25rem; color: var(--text-primary); }
    .semana-info .date-range { color: var(--text-secondary); font-size: 0.875rem; }
    .dias-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
    .dia-card { background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden; }
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
    .btn-icon:hover { background: var(--surface-color); }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background: var(--surface-color); border-radius: var(--radius-lg); width: 90%; max-width: 450px; max-height: 90vh; overflow-y: auto; }
    .modal.modal-lg { max-width: 700px; }
    .modal.modal-xl { max-width: 900px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); }
    .modal-header h2 { margin: 0; font-size: 1.25rem; color: var(--text-primary); }
    .btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; padding: 0; line-height: 1; color: var(--text-primary); }
    .modal-body { padding: 1.5rem; }
    .modal-body .modal-info { background: #fef3c7; border: 1px solid #fcd34d; border-radius: var(--radius-sm); padding: 0.75rem; font-size: 0.875rem; margin-bottom: 1rem; }
    .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: var(--text-primary); }
    .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.625rem 0.875rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); background: var(--surface-color); color: var(--text-primary); }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: var(--primary-color); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
    .bulk-dia { margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color); }
    .bulk-dia:last-child { border-bottom: none; }
    .bulk-dia h4 { margin: 0 0 0.75rem 0; font-size: 1rem; color: var(--primary-color); }
    .bulk-asignaciones { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.75rem; }
    .bulk-item label { display: block; font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 0.25rem; }
    .bulk-item select { width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm); font-size: 0.875rem; }
    
    /* Calendar styles */
    .calendar-nav { display: flex; align-items: center; justify-content: center; gap: 1.5rem; margin-bottom: 1.5rem; }
    .calendar-nav .nav-btn { background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 0.5rem 1rem; cursor: pointer; font-size: 1.25rem; color: var(--text-primary); }
    .calendar-nav .nav-btn:hover { background: var(--primary-color); color: white; border-color: var(--primary-color); }
    .calendar-nav .month-title { margin: 0; font-size: 1.5rem; color: var(--text-primary); min-width: 200px; text-align: center; }
    .calendar-grid { background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 2rem; }
    .calendar-header { display: grid; grid-template-columns: repeat(7, 1fr); background: var(--primary-color); color: white; }
    .calendar-header span { padding: 0.75rem; text-align: center; font-weight: 600; font-size: 0.875rem; }
    .calendar-days { display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; background: var(--border-color); }
    .calendar-day { background: var(--surface-color); padding: 0.75rem 0.5rem; min-height: 60px; border: none; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.25rem; transition: all 0.2s; }
    .calendar-day.other-month { background: var(--background-color); color: var(--text-secondary); opacity: 0.5; cursor: default; }
    .calendar-day:not(.other-month):hover { background: var(--primary-light); }
    .calendar-day.today { background: #fef3c7; }
    .calendar-day.today .day-number { color: #b45309; font-weight: 700; }
    .calendar-day.selected { background: var(--primary-color); color: white; }
    .calendar-day.selected .day-number { color: white; }
    .calendar-day .day-number { font-size: 1rem; font-weight: 500; color: var(--text-primary); }
    .calendar-day .assignment-dot { font-size: 0.5rem; color: var(--primary-color); }
    .calendar-day.selected .assignment-dot { color: white; }
    
    .selected-day-section { margin-top: 2rem; }
    .selected-day-section .day-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding: 1rem; background: var(--surface-color); border-radius: var(--radius-md); border: 1px solid var(--border-color); }
    .selected-day-section .day-header h2 { margin: 0; font-size: 1.25rem; color: var(--text-primary); }
    
    .assignments-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; }
    .assignment-card { background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .assignment-card.empty { opacity: 0.6; }
    .assignment-type { display: flex; align-items: center; gap: 0.5rem; }
    .assignment-type .icono { font-size: 1.5rem; }
    .assignment-type .nombre { font-weight: 600; color: var(--text-primary); }
    .assignment-person { display: flex; align-items: center; justify-content: space-between; }
    .assignment-person .person-name { color: var(--primary-color); font-weight: 500; }
    
    .btn-sm { padding: 0.375rem 0.75rem; font-size: 0.875rem; }
    
    /* Role sections in bulk modal */
    .role-sections { display: flex; flex-direction: column; gap: 1.5rem; }
    .role-section { background: var(--background-color); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 1rem; }
    .role-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid var(--border-color); }
    .role-icon { font-size: 1.5rem; }
    .role-name { font-weight: 600; color: var(--text-primary); font-size: 1.125rem; }
    .role-count { color: var(--text-secondary); font-size: 0.875rem; margin-left: auto; }
    .role-assignments { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
    .assignment-row { display: flex; gap: 0.5rem; align-items: center; }
    .assignment-row select { flex: 1; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--surface-color); color: var(--text-primary); }
    .btn-danger { color: #dc2626; }
    .btn-danger:hover { background: #fee2e2; }
    
    .modal-lg { max-width: 600px; }
    .current-assignments { margin: 1rem 0; padding: 1rem; background: var(--background-color); border-radius: var(--radius-md); }
    .current-assignments h4 { margin: 0 0 0.75rem 0; font-size: 0.875rem; color: var(--text-secondary); }
    .assignment-item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: var(--surface-color); border-radius: var(--radius-sm); margin-bottom: 0.5rem; }
    .assignment-item:last-child { margin-bottom: 0; }
    .add-person-row { display: flex; gap: 0.5rem; }
    .add-person-row select { flex: 1; }
    .current-assignment-info { margin-bottom: 1rem; padding: 1rem; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: var(--radius-md); }
    .current-assignment-info p { margin: 0; color: #1e40af; }
    .grupo-badge { display: inline-block; margin-left: 0.5rem; padding: 0.125rem 0.5rem; background: #dcfce7; color: #166534; border-radius: 12px; font-size: 0.75rem; font-weight: 500; }
    .person-name .grupo-badge { margin-left: 0.5rem; }
    
    /* Summary modal styles */
    .summary-intro { margin-bottom: 1.5rem; color: var(--text-primary); }
    .summary-semana { margin-bottom: 1.5rem; padding: 1rem; background: var(--background-color); border-radius: var(--radius-md); }
    .summary-semana h3 { margin: 0 0 0.5rem 0; color: var(--primary-color); font-size: 1.125rem; }
    .summary-semana .date-range { color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 1rem; }
    .summary-tipo { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; padding: 0.5rem; background: var(--surface-color); border-radius: var(--radius-sm); }
    .summary-tipo .tipo-icon { font-size: 1.25rem; }
    .summary-tipo .tipo-name { font-weight: 600; color: var(--text-primary); min-width: 120px; }
    .summary-tipo .tipo-personas { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .person-tag { display: inline-block; padding: 0.25rem 0.5rem; background: var(--primary-light); color: var(--primary-color); border-radius: var(--radius-sm); font-size: 0.875rem; }
    .empty-summary { text-align: center; padding: 2rem; color: var(--text-secondary); }
    .modal-footer { display: flex; justify-content: space-between; gap: 0.75rem; }
    
    /* All Weeks Table View Styles */
    .all-weeks-table-view { margin-bottom: 2rem; }
    .all-weeks-table-view h2 { margin-bottom: 1rem; font-size: 1.5rem; color: var(--text-primary); }
    .table-container { overflow-x: auto; }
    .assignments-table { width: 100%; border-collapse: collapse; background: var(--surface-color); border-radius: var(--radius-lg); overflow: hidden; }
    .assignments-table th { background: var(--primary-color); color: white; padding: 1rem; text-align: left; font-weight: 600; }
    .assignments-table td { padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); }
    .assignments-table tr:hover { background: var(--background-color); }
    .assignments-table .empty-message { text-align: center; color: var(--text-secondary); padding: 2rem; }
    .assignments-table .tipo-icon { margin-right: 0.5rem; }
    .assignment-row-edit .btn-add { color: var(--primary-color); }
    
    /* Main Page Calendar Styles */
    .asignaciones-page { padding: 1.5rem; max-width: 1200px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .header-left h1 { font-size: 1.75rem; font-weight: 700; margin: 0; }
    .header-left p { color: var(--text-secondary); margin-top: 0.25rem; }
    .btn-lg { padding: 0.75rem 1.5rem; font-size: 1rem; }
    
    .calendar-container {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .calendar { margin-bottom: 1rem; }
    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .nav-btn {
      background: transparent;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.5rem 1rem;
      cursor: pointer;
      font-size: 1rem;
      color: var(--text-primary);
    }
    .nav-btn:hover { background: var(--primary-color); color: white; border-color: var(--primary-color); }
    .month-title { font-size: 1.25rem; font-weight: 600; color: var(--text-primary); }
    .weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0.25rem;
      margin-bottom: 0.5rem;
    }
    .weekdays span {
      text-align: center;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-secondary);
      padding: 0.5rem;
    }
    .days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0.25rem;
    }
    .day {
      aspect-ratio: 1;
      border: none;
      background: var(--background-color);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      border-radius: var(--radius-md);
      transition: all 0.2s;
    }
    .day:hover:not(.other-month) { background: var(--primary-light); }
    .day.other-month { opacity: 0.4; cursor: default; }
    .day.today { background: #fef3c7; }
    .day.today .day-number { color: #b45309; font-weight: 700; }
    .day.selected { background: var(--primary-color); }
    .day.selected .day-number { color: var(--primary-color); }
    .day.weekend { background: rgba(245, 158, 11, 0.15); }
    .day.selected.weekend { background: var(--primary-color); }
    
    // Badge/globo alrededor del número
    .day-number {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-primary);
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s;
    }
    
    // Estado: día con asignaciones
    .day-number.with-assignments {
      background: var(--dot-assignments);
      color: white;
      font-weight: 600;
      box-shadow: 0 0 10px var(--dot-assignments);
    }
    
    // Estado: fin de semana
    .day-number.weekend:not(.selected) {
      color: var(--dot-weekend);
      font-weight: 600;
    }
    .day-number.weekend.with-assignments {
      background: var(--dot-assignments);
      box-shadow: 0 0 10px var(--dot-assignments);
    }
    
    // Estado: seleccionado
    .day-number.selected {
      background: white;
      color: var(--primary-color);
      font-weight: 700;
    }
    
    .leyenda {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }
    .leyenda-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; color: var(--text-secondary); }
    .leyenda-badge { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.625rem; font-weight: 600; }
    .leyenda-badge.normal { background: var(--surface-color); border: 2px solid var(--border-color); color: var(--text-secondary); }
    .leyenda-badge.selected { background: var(--primary-color); color: white; }
    .leyenda-badge.has-assignments { background: var(--dot-assignments); color: white; box-shadow: 0 0 8px var(--dot-assignments); }
    .leyenda-badge.weekend { background: transparent; border: 2px solid var(--dot-weekend); color: var(--dot-weekend); }
    
    .day-panel {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border-color);
    }
    .panel-title { display: flex; flex-direction: column; }
    .day-name { font-size: 1.25rem; font-weight: 600; color: var(--primary-color); }
    .full-date { font-size: 0.875rem; color: var(--text-secondary); }
    
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }
    .assignment-card {
      background: var(--background-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem;
    }
    .assignment-card.empty { opacity: 0.6; }
    .assignment-type { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
    .assignment-type .icono { font-size: 1.5rem; }
    .assignment-type .nombre { font-weight: 600; color: var(--text-primary); }
    .assignment-person { display: flex; align-items: center; justify-content: space-between; }
    .assignment-person .person-name { color: var(--primary-color); font-weight: 500; }
    .no-assignment { text-align: center; padding: 0.5rem; }
    .no-assignment span { color: var(--text-secondary); font-size: 0.875rem; }
    
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--text-secondary);
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
    }
    
    /* New Bulk Modal Styles */
    .modal-full {
      background: var(--surface-color);
      border-radius: var(--radius-lg);
      width: 95%;
      max-width: 1000px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .modal-header-simple {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      background: var(--primary-color);
      color: white;
    }
    .modal-header-simple h2 { margin: 0; font-size: 1.25rem; }
    .modal-content {
      display: flex;
      flex: 1;
      overflow: hidden;
    }
    .calendar-section {
      width: 320px;
      padding: 1.5rem;
      border-right: 1px solid var(--border-color);
      background: var(--background-color);
    }
    .calendar-section h3 { margin: 0 0 1rem 0; font-size: 1rem; color: var(--text-primary); }
    .mini-calendar {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.75rem;
    }
    .mini-cal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .mini-cal-header span { font-weight: 600; font-size: 0.875rem; }
    .nav-btn-sm {
      background: transparent;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      padding: 0.25rem 0.5rem;
      cursor: pointer;
      font-size: 0.75rem;
    }
    .nav-btn-sm:hover { background: var(--primary-color); color: white; }
    .mini-weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      text-align: center;
      font-size: 0.625rem;
      color: var(--text-secondary);
      margin-bottom: 0.25rem;
    }
    .mini-days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
    }
    .mini-day {
      aspect-ratio: 1;
      border: none;
      background: transparent;
      cursor: pointer;
      font-size: 0.75rem;
      border-radius: var(--radius-sm);
    }
    .mini-day:hover { background: var(--primary-light); }
    .mini-day.other-month { color: var(--text-secondary); opacity: 0.5; }
    .mini-day.selected { background: var(--primary-color); color: white; }
    .selected-date-display {
      margin-top: 1rem;
      padding: 0.75rem;
      background: var(--surface-color);
      border-radius: var(--radius-md);
      border: 1px solid var(--primary-color);
    }
    .date-label { display: block; font-size: 0.75rem; color: var(--text-secondary); }
    .date-value { display: block; font-weight: 600; color: var(--primary-color); margin-top: 0.25rem; }
    
    .categories-section {
      flex: 1;
      padding: 1.5rem;
      overflow-y: auto;
    }
    .categories-section h3 { margin: 0 0 1rem 0; font-size: 1rem; color: var(--text-primary); }
    .category-card {
      background: var(--background-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem;
      margin-bottom: 1rem;
    }
    .category-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
    .category-icon { font-size: 1.25rem; }
    .category-name { font-weight: 600; color: var(--text-primary); }
    .category-assignments {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      min-height: 2rem;
      margin-bottom: 0.75rem;
    }
    .assignment-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.375rem 0.75rem;
      background: var(--primary-light);
      color: var(--primary-color);
      border-radius: 999px;
      font-size: 0.875rem;
    }
    .remove-btn {
      background: transparent;
      border: none;
      color: var(--primary-color);
      cursor: pointer;
      padding: 0;
      font-size: 1rem;
      line-height: 1;
      opacity: 0.7;
    }
    .remove-btn:hover { opacity: 1; }
    .add-assignment select {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background: var(--surface-color);
      color: var(--text-primary);
      font-size: 0.875rem;
    }
    .modal-footer-simple {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-color);
    }
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
  
  assignForm = { user_id: '', grupo_id: '', observaciones: '', tipo_id: '', isEditing: false };
  bulkDias: { dia: number; nombre: string; asignaciones: Record<string, string> }[] = [];
  
  // New bulk assignment properties
  selectedBulkDay = 0;
  selectedBulkDate: string | null = null;
  bulkAssignments: { [tipoId: string]: { userId: string }[] } = {};
  newAssignmentUserId: { [tipoId: string]: string } = {};
  
  private asignacionMap = signal<Map<string, Asignacion>>(new Map());
  
  // Calendar properties
  calendarMonth = new Date().getMonth();
  calendarYear = new Date().getFullYear();
  calendarDays: { day: number; date: string; otherMonth: boolean; isToday: boolean }[] = [];
  selectedDate: string | null = null;
  allAsignaciones: Asignacion[] = [];
  showAllWeeksView = false;
  editingSemanaId: string | null = null;
  
  ngOnInit() {
    this.loadSemanas();
    this.loadTipos();
    this.loadUsers();
    this.loadGrupos();
    this.generateCalendar();
    // Load all assignments after loading weeks
    setTimeout(() => this.loadAllAsignaciones(), 1000);
  }

  // Calendar methods
  generateCalendar() {
    const firstDay = new Date(this.calendarYear, this.calendarMonth, 1);
    const lastDay = new Date(this.calendarYear, this.calendarMonth + 1, 0);
    const startDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    const today = new Date();
    const days: { day: number; date: string; otherMonth: boolean; isToday: boolean }[] = [];
    
    // Previous month days
    const prevMonthLastDay = new Date(this.calendarYear, this.calendarMonth, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(this.calendarYear, this.calendarMonth - 1, day);
      days.push({
        day,
        date: this.formatDateISO(date),
        otherMonth: true,
        isToday: false
      });
    }
    
    // Current month days
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(this.calendarYear, this.calendarMonth, day);
      const isToday = date.toDateString() === today.toDateString();
      days.push({
        day,
        date: this.formatDateISO(date),
        otherMonth: false,
        isToday
      });
    }
    
    // Next month days
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(this.calendarYear, this.calendarMonth + 1, day);
      days.push({
        day,
        date: this.formatDateISO(date),
        otherMonth: true,
        isToday: false
      });
    }
    
    this.calendarDays = days;
  }

  formatDateISO(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  previousMonth() {
    this.calendarMonth--;
    if (this.calendarMonth < 0) {
      this.calendarMonth = 11;
      this.calendarYear--;
    }
    this.generateCalendar();
  }

  nextMonth() {
    this.calendarMonth++;
    if (this.calendarMonth > 11) {
      this.calendarMonth = 0;
      this.calendarYear++;
    }
    this.generateCalendar();
  }

  getMonthName(month: number): string {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[month];
  }

  selectDay(day: { day: number; date: string; otherMonth: boolean; isToday: boolean }) {
    if (day.otherMonth) return;
    this.selectedDate = day.date;
  }

  isSelectedDay(date: string): boolean {
    return this.selectedDate === date;
  }

  hasAssignments(date: string): boolean {
    if (!this.allAsignaciones.length) return false;
    const dayOfWeek = new Date(date).getDay();
    return this.allAsignaciones.some(a => a.dia_semana === dayOfWeek);
  }

  getDayOfWeek(dateStr: string): number {
    // Parse date as local time to avoid timezone issues
    const parts = dateStr.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    return new Date(year, month, day).getDay();
  }
  
  formatFullDate(dateStr: string): string {
    // Parse date as local time to avoid timezone issues
    const parts = dateStr.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    const date = new Date(year, month, day);
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  getAsignacionForDayAndTipo(dateStr: string, tipoId: string): Asignacion | null {
    const dayOfWeek = this.getDayOfWeek(dateStr);
    const key = `${dayOfWeek}-${tipoId}`;
    return this.asignacionMap().get(key) || null;
  }

  // Bulk modal methods
  selectBulkDate(date: string) {
    this.selectedBulkDate = date;
    // Load existing assignments for this date
    this.loadBulkAssignmentsForDate(date);
  }

  loadBulkAssignmentsForDate(date: string) {
    const dayOfWeek = this.getDayOfWeek(date);
    
    // Reset assignments
    const tiposArray = this.tipos() || [];
    tiposArray.forEach((tipo: TipoAsignacion) => {
      this.bulkAssignments[tipo.id] = [{ userId: '' }];
    });
    
    // Get the week ID that contains this date
    const targetSemana = this.semanas().find(semana => {
      const inicio = new Date(semana.fecha_inicio);
      const fin = new Date(semana.fecha_fin);
      const targetDate = new Date(date);
      return targetDate >= inicio && targetDate <= fin;
    });
    
    // Load existing assignments for this specific week AND day of week
    if (targetSemana && this.allAsignaciones.length > 0) {
      this.allAsignaciones
        .filter((a: Asignacion) => {
          // Must match the week AND the day of week
          const matchesSemana = (a as any).semana_id === targetSemana.id;
          const matchesDia = a.dia_semana === dayOfWeek;
          return matchesSemana && matchesDia;
        })
        .forEach((a: Asignacion) => {
          // Check for user assignments
          if (a.user_id && a.tipo_asignacion_id) {
            if (!this.bulkAssignments[a.tipo_asignacion_id]) {
              this.bulkAssignments[a.tipo_asignacion_id] = [];
            }
            // Add existing assignments (skip the first empty one)
            if (this.bulkAssignments[a.tipo_asignacion_id].length === 1 && !this.bulkAssignments[a.tipo_asignacion_id][0].userId) {
              this.bulkAssignments[a.tipo_asignacion_id][0].userId = a.user_id;
            } else {
              this.bulkAssignments[a.tipo_asignacion_id].push({ userId: a.user_id });
            }
          }
          // Check for group assignments (grupo_id)
          if (a.grupo_id && a.tipo_asignacion_id) {
            if (!this.bulkAssignments[a.tipo_asignacion_id]) {
              this.bulkAssignments[a.tipo_asignacion_id] = [];
            }
            // Add group with "grupo_" prefix
            if (this.bulkAssignments[a.tipo_asignacion_id].length === 1 && !this.bulkAssignments[a.tipo_asignacion_id][0].userId) {
              this.bulkAssignments[a.tipo_asignacion_id][0].userId = 'grupo_' + a.grupo_id;
            } else {
              this.bulkAssignments[a.tipo_asignacion_id].push({ userId: 'grupo_' + a.grupo_id });
            }
          }
        });
    }
  }

  getUserName(userId: string): string {
    // Check if it's a grupo (userId starts with "grupo_")
    if (userId.startsWith('grupo_')) {
      const grupoId = userId.replace('grupo_', '');
      const grupo = this.grupos().find(g => g.id === grupoId);
      return grupo ? grupo.nombre : 'Grupo';
    }
    // Otherwise it's a regular user
    const user = this.users().find(u => u.id === userId);
    return user ? user.nombre : 'Usuario';
  }

  addBulkAssignmentFromSelect(tipoId: string) {
    const userId = this.newAssignmentUserId[tipoId];
    if (userId) {
      if (!this.bulkAssignments[tipoId]) {
        this.bulkAssignments[tipoId] = [];
      }
      // Find first empty slot
      const emptySlot = this.bulkAssignments[tipoId].findIndex(a => !a.userId);
      if (emptySlot >= 0) {
        this.bulkAssignments[tipoId][emptySlot].userId = userId;
      } else {
        this.bulkAssignments[tipoId].push({ userId });
      }
      // Reset select
      this.newAssignmentUserId[tipoId] = '';
    }
  }

  // Load all assignments from all weeks
  loadAllAsignaciones() {
    // Load assignments for each week
    this.semanas().forEach(semana => {
      this.asignacionService.loadAsignacionesBySemana(semana.id).subscribe({
        next: (data) => {
          if (data && data.asignaciones) {
            this.allAsignaciones = [...this.allAsignaciones, ...data.asignaciones];
            data.asignaciones.forEach(a => {
              const key = `${a.dia_semana}-${a.tipo_asignacion_id}`;
              this.asignacionMap().set(key, a);
            });
            this.asignacionMap.set(new Map(this.asignacionMap()));
          }
        }
      });
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
    console.log('Loading users...');
    this.authService.getUsers().subscribe({
      next: (res: any) => {
        console.log('Users loaded:', res);
        this.users.set(res);
      },
      error: (err) => {
        console.error('Error loading users:', err);
      }
    });
  }
  
  loadGrupos() {
    console.log('Loading grupos...');
    this.grupoService.loadGrupos().subscribe({
      next: (res: any) => {
        console.log('Grupos loaded:', res);
        // Extract data from response if it's wrapped
        const gruposData = res.data || res;
        this.grupos.set(gruposData);
      },
      error: (err) => {
        console.error('Error loading grupos:', err);
      }
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
    // Parse date as local time to avoid timezone issues
    const parts = dateStr.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    return new Date(year, month, day).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
  
  formatDiaFecha(diaSemana: number, fechaInicio: string): string {
    // Parse date as local time to avoid timezone issues
    const parts = fechaInicio.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);
    const fecha = new Date(year, month, day + diaSemana);
    return fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }
  
  openAssignModal(tipo: TipoAsignacion, diaSemana: number) {
    this.editingTipo = tipo;
    this.editingDiaSemana = diaSemana;
    this.editingAsignacion = null;
    // If tipo is provided, set it in the form; otherwise leave empty for user to select
    const tipoId = tipo ? tipo.id : '';
    this.assignForm = { user_id: '', grupo_id: '', observaciones: '', tipo_id: tipoId, isEditing: false };
    this.showAssignModal = true;
  }
  
  editAsignacion(asignacion: Asignacion, tipo: TipoAsignacion, diaSemana: number) {
    this.editingTipo = tipo;
    this.editingDiaSemana = diaSemana;
    this.editingAsignacion = asignacion;
    this.assignForm = { 
      user_id: asignacion.user_id || '', 
      grupo_id: asignacion.grupo_id || '',
      observaciones: asignacion.observaciones || '',
      tipo_id: tipo ? tipo.id : '',
      isEditing: true
    };
    this.showAssignModal = true;
  }

  onTipoChange() {
    // Reset user selection when tipo changes
    this.assignForm.user_id = '';
  }

  getCurrentAssignmentsForTipo(): Asignacion[] {
    if (!this.assignForm.tipo_id || !this.semanaActual || !this.semanaActual.asignaciones) {
      return [];
    }
    return this.semanaActual.asignaciones.filter(
      (a: Asignacion) => a.tipo_asignacion_id === this.assignForm.tipo_id && a.dia_semana === this.editingDiaSemana
    );
  }

  getAvailableUsersForTipo(): any[] {
    // Return all users that are not already assigned for this tipo and day
    const assigned = this.getCurrentAssignmentsForTipo();
    const assignedIds = assigned.map(a => a.user_id);
    return this.getUsersList().filter(u => !assignedIds.includes(u.id));
  }

  getAllUsers(): any[] {
    // Return all registered users (no filtering)
    return this.getUsersList();
  }

  removeAssignment(assignmentId: string) {
    this.asignacionService.deleteAsignacion(assignmentId).subscribe({
      next: () => {
        this.loadSemana();
      }
    });
  }
  
  closeAssignModal() {
    this.showAssignModal = false;
    this.editingTipo = null;
    this.editingDiaSemana = -1;
    this.editingAsignacion = null;
    this.assignForm = { user_id: '', grupo_id: '', observaciones: '', tipo_id: '', isEditing: false };
  }
  
  saveAsignacion() {
    if (!this.assignForm.tipo_id) return;
    
    // If editing, update the existing assignment
    if (this.assignForm.isEditing && this.editingAsignacion) {
      const userId = this.assignForm.user_id || undefined;
      const grupoId = this.assignForm.grupo_id || undefined;
      
      this.asignacionService.updateAsignacion(
        this.editingAsignacion.id,
        userId,
        grupoId,
        this.assignForm.observaciones || undefined
      ).subscribe({
        next: () => {
          this.loadSemana();
          this.closeAssignModal();
        }
      });
      return;
    }
    
    // Otherwise, create new assignment
    if (!this.assignForm.user_id && !this.assignForm.grupo_id) return;
    
    const asignacion = {
      semana_id: this.selectedSemanaId,
      tipo_asignacion_id: this.assignForm.tipo_id,
      user_id: this.assignForm.user_id || null,
      grupo_id: this.assignForm.grupo_id || null,
      dia_semana: this.editingDiaSemana,
      observaciones: this.assignForm.observaciones || undefined
    };
    
    this.asignacionService.createAsignacion(asignacion as any).subscribe({
      next: () => {
        this.loadSemana();
        // Reset user selection but keep tipo selected
        this.assignForm.user_id = '';
        this.assignForm.grupo_id = '';
      }
    });
  }
  
  openBulkModal() {
    console.log('openBulkModal called!');
    // Initialize bulk assignments for each type with at least one empty slot
    this.bulkDias = [0, 1, 2, 3, 4, 5, 6].map(dia => ({ dia, nombre: this.getDiaNombre(dia), asignaciones: {} }));
    this.bulkAssignments = {};
    this.newAssignmentUserId = {};
    this.selectedBulkDate = null;
    
    const tiposArray = this.tipos() || [];
    console.log('tiposArray in modal:', tiposArray);
    // Use tipo.id (UUID from database) as the key - this is CRITICAL
    tiposArray.forEach((tipo: TipoAsignacion) => {
      this.bulkAssignments[tipo.id] = [{ userId: '' }];
      this.newAssignmentUserId[tipo.id] = '';
      console.log(`Initialized bulkAssignments[${tipo.id}] for tipo:`, tipo.nombre);
    });
    
    // Always reload users and grupos to ensure we have the latest
    console.log('Loading users and grupos...');
    this.authService.getUsers().subscribe({
      next: (res: any) => {
        console.log('Users loaded in bulk modal:', res);
        this.users.set(res);
        
        // Also load grupos
        this.grupoService.loadGrupos().subscribe({
          next: (gruposRes: any) => {
            console.log('Grupos loaded in bulk modal:', gruposRes);
            const gruposData = gruposRes.data || gruposRes;
            this.grupos.set(gruposData);
            // Select today's date by default
            const today = this.formatDateISO(new Date());
            this.selectBulkDate(today);
            // Now show the modal AFTER users and grupos are loaded
            this.showBulkModal = true;
          },
          error: (err) => {
            console.error('Error loading grupos in bulk modal:', err);
            // Show modal anyway
            const today = this.formatDateISO(new Date());
            this.selectBulkDate(today);
            this.showBulkModal = true;
          }
        });
      },
      error: (err) => {
        console.error('Error loading users in bulk modal:', err);
        // Show modal anyway, even if users fail to load
        const today = this.formatDateISO(new Date());
        this.selectBulkDate(today);
        this.showBulkModal = true;
      }
    });
  }
  
  onBulkSemanaChange() {
    if (this.selectedSemanaId) {
      this.loadSemana();
    }
  }
  
  closeBulkModal() {
    this.showBulkModal = false;
  }
  
  onBulkDayChange() {
    this.loadBulkAssignmentsForDay(this.selectedBulkDay);
  }
  
  loadBulkAssignmentsForDay(diaSemana: number) {
    // Reset assignments
    const tiposArray = this.tipos() || [];
    tiposArray.forEach((tipo: TipoAsignacion) => {
      this.bulkAssignments[tipo.id] = [{ userId: '' }];
    });
    
    // Load existing assignments for this day (both users AND grupos)
    if (this.semanaActual && this.semanaActual.asignaciones) {
      const asignaciones = this.semanaActual.asignaciones as Asignacion[];
      asignaciones
        .filter((a: Asignacion) => a.dia_semana === diaSemana)
        .forEach((a: Asignacion) => {
          // Check for user assignments
          if (a.user_id && a.tipo_asignacion_id) {
            if (!this.bulkAssignments[a.tipo_asignacion_id]) {
              this.bulkAssignments[a.tipo_asignacion_id] = [];
            }
            // Add existing assignments (skip the first empty one)
            if (this.bulkAssignments[a.tipo_asignacion_id].length === 1 && !this.bulkAssignments[a.tipo_asignacion_id][0].userId) {
              this.bulkAssignments[a.tipo_asignacion_id][0].userId = a.user_id;
            } else {
              this.bulkAssignments[a.tipo_asignacion_id].push({ userId: a.user_id });
            }
          }
          // Check for group assignments (grupo_id)
          if (a.grupo_id && a.tipo_asignacion_id) {
            if (!this.bulkAssignments[a.tipo_asignacion_id]) {
              this.bulkAssignments[a.tipo_asignacion_id] = [];
            }
            // Add group with "grupo_" prefix
            if (this.bulkAssignments[a.tipo_asignacion_id].length === 1 && !this.bulkAssignments[a.tipo_asignacion_id][0].userId) {
              this.bulkAssignments[a.tipo_asignacion_id][0].userId = 'grupo_' + a.grupo_id;
            } else {
              this.bulkAssignments[a.tipo_asignacion_id].push({ userId: 'grupo_' + a.grupo_id });
            }
          }
        });
    }
  }
  
  getBulkAssignments(tipoId: string): { userId: string }[] {
    return this.bulkAssignments[tipoId] || [];
  }
  
  addBulkAssignment(tipoId: string) {
    if (!this.bulkAssignments[tipoId]) {
      this.bulkAssignments[tipoId] = [];
    }
    this.bulkAssignments[tipoId].push({ userId: '' });
  }
  
  removeBulkAssignment(tipoId: string, index: number) {
    if (this.bulkAssignments[tipoId] && this.bulkAssignments[tipoId].length > 1) {
      this.bulkAssignments[tipoId].splice(index, 1);
    } else {
      // Don't remove the last one, just clear it
      this.bulkAssignments[tipoId][0].userId = '';
    }
  }
  
  getAvailableUsers(tipoId: string): any[] {
    // Return all users (you could filter by role if needed)
    return this.users();
  }
  
  saveBulkAsignaciones() {
    if (!this.selectedBulkDate) {
      alert('Por favor selecciona una fecha');
      return;
    }
    
    const diaSemana = this.getDayOfWeek(this.selectedBulkDate);
    const asignaciones: any[] = [];
    
    console.log('saveBulkAsignaciones - tipos():', this.tipos());
    console.log('saveBulkAsignaciones - bulkAssignments:', this.bulkAssignments);
    
    // Iterate over bulkAssignments keys instead of tipos
    const tipoIds = Object.keys(this.bulkAssignments);
    console.log('tipoIds (should be UUIDs):', tipoIds);
    console.log('tipos:', this.tipos());
    
    tipoIds.forEach(tipoId => {
      const assignments = this.bulkAssignments[tipoId] || [];
      // tipoId should now be the UUID from the database
      console.log('Processing tipoId:', tipoId, 'assignments:', assignments);
      
      assignments.forEach(assignment => {
        if (assignment.userId) {
          // Check if it's a group (starts with "grupo_")
          if (assignment.userId.startsWith('grupo_')) {
            asignaciones.push({ 
              tipo_asignacion_id: tipoId, 
              grupo_id: assignment.userId.replace('grupo_', ''),
              user_id: null,
              dia_semana: diaSemana,
              fecha: this.selectedBulkDate
            });
          } else {
            // It's a regular user
            asignaciones.push({ 
              tipo_asignacion_id: tipoId, 
              user_id: assignment.userId,
              grupo_id: null,
              dia_semana: diaSemana,
              fecha: this.selectedBulkDate
            });
          }
        }
      });
    });
    
    console.log('Final asignaciones to save:', asignaciones);
    
    if (asignaciones.length === 0) {
      alert('Debes asignar al menos una persona');
      return;
    }
    
    // Save each assignment - for date-based we need to find the right week
    this.saveDateBasedAssignments(asignaciones);
  }
  
  saveDateBasedAssignments(asignaciones: any[]) {
    // Find which week contains this date
    const targetDate = new Date(this.selectedBulkDate!);
    let targetSemana = this.semanas().find(semana => {
      const inicio = new Date(semana.fecha_inicio);
      const fin = new Date(semana.fecha_fin);
      return targetDate >= inicio && targetDate <= fin;
    });
    
    // If no week found, create a simple save using the first available week
    if (!targetSemana && this.semanas().length > 0) {
      targetSemana = this.semanas()[0];
    }
    
    if (!targetSemana) {
      alert('No hay semanas configuradas. Por favor configura las semanas primero.');
      return;
    }
    
    // Save to the found week
    this.asignacionService.bulkCreateAsignaciones(targetSemana.id, asignaciones).subscribe({
      next: () => {
        // Reload and show summary
        this.loadAllAsignaciones();
        setTimeout(() => this.loadAllWeeksForSummary(), 500);
      },
      error: (err) => {
        console.error('Error saving assignments:', err);
        alert('Error al guardar las asignaciones');
      }
    });
  }
  
  // Load all weeks for summary
  loadAllWeeksForSummary() {
    let loadedCount = 0;
    const summaryData: any[] = [];
    
    this.semanas().forEach(semana => {
      this.asignacionService.loadAsignacionesBySemana(semana.id).subscribe({
        next: (data: any) => {
          if (data && data.asignaciones && data.asignaciones.length > 0) {
            summaryData.push({
              semana: semana,
              asignaciones: data.asignaciones
            });
          }
          loadedCount++;
          if (loadedCount === this.semanas().length) {
            this.showSummaryModal(summaryData);
          }
        }
      });
    });
    
    // If no weeks, still close modal
    if (this.semanas().length === 0) {
      this.closeBulkModal();
    }
  }
  
  showSummaryModal(summaryData: any[]) {
    this.summaryData = summaryData;
    this.showBulkModal = false;
    this.showSummaryModalFlag = true;
  }
  
  closeSummaryModal() {
    this.showSummaryModalFlag = false;
    this.summaryData = [];
    this.loadSemana();
  }
  
  // Get sorted summary data for display (ascending by fecha_inicio)
  getSortedSummaryData(): any[] {
    return [...this.summaryData].sort((a: any, b: any) => 
      new Date(a.semana.fecha_inicio).getTime() - new Date(b.semana.fecha_inicio).getTime()
    );
  }
  
  summaryData: any[] = [];
  showSummaryModalFlag = false;

  // Helper methods to safely get lists
  getUsersList(): any[] {
    const u = this.users();
    return Array.isArray(u) ? u : [];
  }

  getGruposList(): Grupo[] {
    const g = this.grupos();
    return Array.isArray(g) ? g : [];
  }

  isAseoSalon(nombre: string): boolean {
    return nombre === 'ASEO_SALON';
  }

  getTiposList(): TipoAsignacion[] {
    const t = this.tipos();
    if (Array.isArray(t) && t.length > 0) {
      return t;
    }
    // Fallback default tipos if not loaded yet (including ASEO_SALON)
    return [
      { id: '9bb8d1a0-f9dd-48fa-932a-229090f4e2aa', nombre: 'ACOMODADOR_SALON', icono: '🪑', descripcion: 'Acomodador' },
      { id: '96014a5f-834e-44fd-92af-73d36850eb88', nombre: 'PARQUEADERO', icono: '🚗', descripcion: 'Parqueadero' },
      { id: 'de3076d0-5896-4ee6-a113-41212893856e', nombre: 'MICROFONO', icono: '🎤', descripcion: 'Micrófono' },
      { id: '74c7a6e6-a3aa-4bd8-a129-7b1c2a2c1b99', nombre: 'PLATAFORMA', icono: '📺', descripcion: 'Plataforma' },
      { id: 'b10c74a7-ba4c-4a71-b639-1248aa404eb4', nombre: 'ASEO_SALON', icono: '🧹', descripcion: 'Aseo del Salón' }
    ] as TipoAsignacion[];
  }
  
  getAssignmentsForTipoAndSemana(semanaData: any, tipoId: string): any[] {
    if (!semanaData.asignaciones) return [];
    return semanaData.asignaciones.filter((a: any) => a.tipo_asignacion_id === tipoId);
  }
  
  exportToPDF() {
    // Generate print-friendly HTML
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Asignaciones Semanales - Congregación Alameda</title>
        <style>
          @page { size: A4; margin: 1.5cm; }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 11pt; 
            color: #333;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 15px;
          }
          .header h1 {
            color: #2563eb;
            margin: 0 0 5px 0;
            font-size: 24pt;
          }
          .header p {
            color: #666;
            margin: 0;
            font-size: 12pt;
          }
          .semana-section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          .semana-title {
            background: #2563eb;
            color: white;
            padding: 10px 15px;
            font-size: 14pt;
            font-weight: bold;
            border-radius: 5px 5px 0 0;
            margin-bottom: 10px;
          }
          .semana-dates {
            color: #666;
            font-size: 10pt;
            margin-bottom: 15px;
            padding-left: 15px;
          }
          .tabla-asignaciones {
            width: 100%;
            border-collapse: collapse;
          }
          .tabla-asignaciones th {
            background: #f3f4f6;
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
            font-weight: bold;
          }
          .tabla-asignaciones td {
            border: 1px solid #ddd;
            padding: 10px;
            vertical-align: top;
          }
          .categoria {
            font-weight: bold;
            color: #2563eb;
            display: flex;
            align-items: center;
            gap: 5px;
          }
          .personas {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
          }
          .persona-tag {
            background: #dbeafe;
            color: #1e40af;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 10pt;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #999;
            font-size: 9pt;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📅 Asignaciones Semanales</h1>
          <p>Congregación Alameda - Programa de Servicio</p>
        </div>
    `;

    // Generate content for each week
    const tipos = this.getTiposList();
    // Sort weeks by start date (ascending - oldest first)
    const sortedSummary = [...this.summaryData].sort((a: any, b: any) => 
      new Date(a.semana.fecha_inicio).getTime() - new Date(b.semana.fecha_inicio).getTime()
    );
    sortedSummary.forEach((semanaData: any) => {
      html += `
        <div class="semana-section">
          <div class="semana-title">${semanaData.semana.nombre}</div>
          <div class="semana-dates">
            📅 ${this.formatDate(semanaData.semana.fecha_inicio)} - ${this.formatDate(semanaData.semana.fecha_fin)}
          </div>
          <table class="tabla-asignaciones">
            <thead>
              <tr>
                <th style="width: 25%;">Categoría</th>
                <th style="width: 75%;">Personas Asignadas</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      tipos.forEach((tipo: any) => {
        const asignaciones = this.getAssignmentsForTipoAndSemana(semanaData, tipo.id);
        if (asignaciones.length > 0) {
          const personas = asignaciones.map((a: any) => 
            `<span class="persona-tag">${a.user?.nombre || 'Usuario'}</span>`
          ).join('');
          
          html += `
            <tr>
              <td>
                <span class="categoria">${tipo.icono} ${this.getTipoNombre(tipo.nombre)}</span>
              </td>
              <td>
                <div class="personas">${personas}</div>
              </td>
            </tr>
          `;
        }
      });
      
      html += `
            </tbody>
          </table>
        </div>
      `;
    });

    html += `
        <div class="footer">
          <p>Generado el ${new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })} - Congregación Alameda</p>
        </div>
      </body>
      </html>
    `;

    // Open print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }
  
  exportAllToPDF() {
    // Load all weeks with their assignments and generate PDF
    const semanasData: any[] = [];
    const semanasList = this.semanas();
    
    if (semanasList.length === 0) {
      alert('No hay semanas configuradas');
      return;
    }
    
    // Collect all assignments from all weeks
    // Since allAsignaciones already has all data from loadAllAsignaciones, we can group by week
    const groupedByWeek = new Map<string, any[]>();
    
    this.allAsignaciones.forEach((a: Asignacion) => {
      // Find which week this assignment belongs to
      const semana = semanasList.find((s: Semana) => {
        const inicio = new Date(s.fecha_inicio);
        const fin = new Date(s.fecha_fin);
        // We don't have the week ID directly in assignment, but we can match by dates
        // Actually, assignments have semana_id
        return s.id === (a as any).semana_id;
      });
      
      if (semana) {
        const key = semana.id;
        if (!groupedByWeek.has(key)) {
          groupedByWeek.set(key, []);
        }
        groupedByWeek.get(key)!.push(a);
      }
    });
    
    // Generate PDF HTML with all data
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Asignaciones Semanales - Congregación Alameda</title>
        <style>
          @page { size: A4; margin: 1.5cm; }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 11pt; 
            color: #333;
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 15px;
          }
          .header h1 {
            color: #2563eb;
            margin: 0 0 5px 0;
            font-size: 24pt;
          }
          .header p {
            color: #666;
            margin: 0;
            font-size: 12pt;
          }
          .semana-section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          .semana-title {
            background: #2563eb;
            color: white;
            padding: 10px 15px;
            font-size: 14pt;
            font-weight: bold;
            border-radius: 5px 5px 0 0;
            margin-bottom: 10px;
          }
          .semana-dates {
            color: #666;
            font-size: 10pt;
            margin-bottom: 15px;
            padding-left: 15px;
          }
          .tabla-asignaciones {
            width: 100%;
            border-collapse: collapse;
          }
          .tabla-asignaciones th {
            background: #f3f4f6;
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
            font-weight: bold;
          }
          .tabla-asignaciones td {
            border: 1px solid #ddd;
            padding: 10px;
            vertical-align: top;
          }
          .categoria {
            font-weight: bold;
            color: #2563eb;
            display: flex;
            align-items: center;
            gap: 5px;
          }
          .personas {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
          }
          .persona-tag {
            background: #dbeafe;
            color: #1e40af;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 10pt;
          }
          .grupo-tag {
            background: #dcfce7;
            color: #166534;
            padding: 3px 10px;
            border-radius: 12px;
            font-size: 10pt;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            color: #999;
            font-size: 9pt;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
          .no-assignments {
            color: #999;
            font-style: italic;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📅 Asignaciones Semanales</h1>
          <p>Congregación Alameda - Programa de Servicio</p>
        </div>
    `;
    
    const tipos = this.getTiposList();
    
    // Sort weeks by start date (ascending - oldest first)
    const sortedSemanas = [...semanasList].sort((a: Semana, b: Semana) => 
      new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()
    );
    
    // Generate content for each week
    sortedSemanas.forEach((semana: Semana) => {
      const asignaciones = groupedByWeek.get(semana.id) || [];
      
      html += `
        <div class="semana-section">
          <div class="semana-title">${semana.nombre}</div>
          <div class="semana-dates">
            📅 ${this.formatDate(semana.fecha_inicio)} - ${this.formatDate(semana.fecha_fin)}
          </div>
          <table class="tabla-asignaciones">
            <thead>
              <tr>
                <th style="width: 25%;">Categoría</th>
                <th style="width: 75%;">Personas Asignadas</th>
              </tr>
            </thead>
            <tbody>
      `;
      
      tipos.forEach((tipo: TipoAsignacion) => {
        const tipoAsignaciones = asignaciones.filter((a: Asignacion) => a.tipo_asignacion_id === tipo.id);
        
        if (tipoAsignaciones.length > 0) {
          const personasHtml = tipoAsignaciones.map((a: Asignacion) => {
            if (a.grupo) {
              return `<span class="grupo-tag">${a.grupo.nombre}</span>`;
            }
            return `<span class="persona-tag">${a.user?.nombre || 'Usuario'}</span>`;
          }).join('');
          
          html += `
            <tr>
              <td>
                <div class="categoria">
                  <span>${tipo.icono || '📋'}</span>
                  <span>${this.getTipoNombre(tipo.nombre)}</span>
                </div>
              </td>
              <td>
                <div class="personas">
                  ${personasHtml}
                </div>
              </td>
            </tr>
          `;
        } else {
          html += `
            <tr>
              <td>
                <div class="categoria">
                  <span>${tipo.icono || '📋'}</span>
                  <span>${this.getTipoNombre(tipo.nombre)}</span>
                </div>
              </td>
              <td>
                <span class="no-assignments">Sin asignar</span>
              </td>
            </tr>
          `;
        }
      });
      
      html += `
            </tbody>
          </table>
        </div>
      `;
    });
    
    html += `
        <div class="footer">
          <p>Generado el ${new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })} - Congregación Alameda</p>
        </div>
      </body>
      </html>
    `;
    
    // Open print dialog
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  }
  
  // All weeks view methods
  toggleAllWeeksView() {
    this.showAllWeeksView = !this.showAllWeeksView;
    if (this.showAllWeeksView && this.allAsignaciones.length === 0) {
      this.loadAllAsignaciones();
    }
  }
  
  // Flat list for table view
  getAllAssignmentsFlat(): any[] {
    const result: any[] = [];
    const tipos = this.getTiposList();
    const semanasList = this.semanas();
    
    // Get unique weeks with assignments
    const semanasConAsignaciones = semanasList.filter(semana => 
      this.allAsignaciones.some(a => (a as any).semana_id === semana.id)
    ).sort((a, b) => new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime());
    
    for (const semana of semanasConAsignaciones) {
      for (const dia of [0, 1, 2, 3, 4, 5, 6]) {
        for (const tipo of tipos) {
          const asignacion = this.getAssignmentForWeekAndDay(semana.id, dia, tipo.id);
          const key = `${semana.id}-${dia}-${tipo.id}`;
          
          result.push({
            key: key,
            semanaId: semana.id,
            semanaNombre: semana.nombre,
            diaSemana: dia,
            tipoId: tipo.id,
            tipoNombre: this.getTipoNombre(tipo.nombre),
            tipoIcono: tipo.icono || '📋',
            asignacionId: asignacion?.id || null,
            asignadoNombre: asignacion?.user?.nombre || asignacion?.grupo?.nombre || 'Sin asignar',
            esGrupo: !!asignacion?.grupo,
            asignacion: asignacion,
            tipo: tipo
          });
        }
      }
    }
    
    return result;
  }
  
  editAssignmentById(semanaData: any) {
    this.editAsignacionFromAllWeeks(semanaData.asignacion, semanaData.tipo, semanaData.diaSemana, semanaData.semanaId);
  }
  
  addAssignmentByTipo(semanaData: any) {
    this.addAssignmentFromAllWeeks(semanaData.tipo, semanaData.diaSemana, semanaData.semanaId);
  }
  
  getSemanasWithAssignments(): Semana[] {
    // Return all weeks that have at least one assignment, sorted by fecha_inicio ascending
    const semanasWithAssignments = this.semanas().filter(semana => 
      this.allAsignaciones.some(a => (a as any).semana_id === semana.id)
    );
    return [...semanasWithAssignments].sort((a, b) => 
      new Date(a.fecha_inicio).getTime() - new Date(b.fecha_inicio).getTime()
    );
  }
  
  getAssignmentForWeekAndDay(semanaId: string, diaSemana: number, tipoId: string): Asignacion | null {
    return this.allAsignaciones.find(a => 
      (a as any).semana_id === semanaId && a.dia_semana === diaSemana && a.tipo_asignacion_id === tipoId
    ) || null;
  }
  
  editAsignacionFromAllWeeks(asignacion: Asignacion, tipo: TipoAsignacion, diaSemana: number, semanaId: string) {
    this.editingSemanaId = semanaId;
    this.selectedSemanaId = semanaId;
    this.editingDiaSemana = diaSemana;
    this.editingAsignacion = asignacion;
    this.assignForm = { 
      user_id: asignacion.user_id || '', 
      grupo_id: asignacion.grupo_id || '',
      observaciones: asignacion.observaciones || '',
      tipo_id: tipo ? tipo.id : '',
      isEditing: true
    };
    this.showAssignModal = true;
  }
  
  addAssignmentFromAllWeeks(tipo: TipoAsignacion, diaSemana: number, semanaId: string) {
    this.editingSemanaId = semanaId;
    this.selectedSemanaId = semanaId;
    this.editingDiaSemana = diaSemana;
    this.editingAsignacion = null;
    this.assignForm = { 
      user_id: '', 
      grupo_id: '',
      observaciones: '',
      tipo_id: tipo ? tipo.id : '',
      isEditing: false
    };
    this.showAssignModal = true;
  }
}
