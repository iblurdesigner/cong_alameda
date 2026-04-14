import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProgramaVisitaService, ProgramaVisita } from '../../core/services/programa-visita.service';
import { ProgramaPredicacionService } from '../../core/services/programa-predicacion.service';
import { GrupoService, Grupo } from '../../core/services/grupo.service';
import { TerritorioService, Territorio } from '../../core/services/territorio.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-programa-visita-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="header-content">
          <h1>🚗 Predicación Visita</h1>
          <p class="header-subtitle">Personaliza la programación diaria para cada visita</p>
        </div>
        @if (authService.isSuperintendente() || authService.isSuperAdmin()) {
          <button class="btn btn-primary" (click)="openCreateModal()">
            ➕ Nueva Visita
          </button>
        }
      </header>

      <!-- Selector de Día para cargar plantilla -->
      <div class="plantilla-section">
        <h3>📋 Cargar desde Día Predicación</h3>
        <div class="form-row">
          <div class="form-group">
            <label for="dia_plantilla">Seleccionar Día:</label>
            <select id="dia_plantilla" [(ngModel)]="diaPlantilla" (change)="onDiaChange()">
              <option [value]="0">Lunes</option>
              <option [value]="1">Martes</option>
              <option [value]="2">Miércoles</option>
              <option [value]="3">Jueves</option>
              <option [value]="4">Viernes</option>
              <option [value]="5">Sábado</option>
              <option [value]="6">Domingo</option>
            </select>
          </div>
          <div class="form-group">
            <label for="fecha_visita">Fecha de Visita:</label>
            <input type="date" id="fecha_visita" [(ngModel)]="fechaBusqueda" />
          </div>
          <button class="btn btn-outline" (click)="cargarPlantilla()">
            📥 Cargar Plantilla
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading">Cargando...</div>
      } @else if (visitas().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">🚗</div>
          <p>No hay programas de visita registrados</p>
          @if (authService.isSuperintendente() || authService.isSuperAdmin()) {
            <button class="btn btn-primary" (click)="openCreateModal()">
              Crear Primera Visita
            </button>
          }
        </div>
      } @else {
        <div class="visitas-grid">
          @for (visita of visitas(); track visita.id) {
            <div class="visita-card" [class.visited]="visita.visited">
              <div class="visita-header">
                <h3>{{ visita.dia_semana_nombre }}</h3>
                @if (visita.visited) {
                  <span class="badge-visited">✅ Visitado</span>
                }
              </div>
              
              <div class="visita-content">
                @if (visita.fecha) {
                  <div class="info-row">
                    <span class="label">📅 Fecha:</span>
                    <span class="value">{{ visita.fecha }}</span>
                  </div>
                }
                @if (visita.hora) {
                  <div class="info-row">
                    <span class="label">⏰ Hora:</span>
                    <span class="value">{{ visita.hora }}</span>
                  </div>
                }
                <div class="info-row">
                  <span class="label">🎤 Conductor:</span>
                  <span class="value">{{ visita.conductor || 'Sin asignar' }}</span>
                </div>
                <div class="info-row">
                  <span class="label">📍 Lugar:</span>
                  <span class="value">{{ visita.lugar_nombre || 'Sin asignar' }}</span>
                </div>
                @if (visita.lugar_direccion) {
                  <div class="info-row">
                    <span class="label">🏠 Dirección:</span>
                    <span class="value">{{ visita.lugar_direccion }}</span>
                  </div>
                }
                @if (visita.observaciones) {
                  <div class="observaciones">
                    <span class="label">📝 Notas:</span>
                    <p>{{ visita.observaciones }}</p>
                  </div>
                }
              </div>

              <div class="visita-actions">
@if (authService.isSuperintendente() || authService.isSuperAdmin()) {
                  <button 
                    class="btn-check" 
                    (click)="toggleVisited(visita)"
                    [class.active]="visita.visited"
                  >
                    {{ visita.visited ? '✅ Marcado' : '⬜ Marcar' }}
                  </button>
                  <span class="btn-edit" (click)="editVisita(visita)">✏️ Editar</span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Create/Edit Modal -->
    @if (showModal()) {
      <div class="modal-overlay" (click)="$event.stopPropagation()">
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editing() ? 'Editar' : 'Nueva' }} Visita</h2>
            <button class="btn-close" (click)="closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label for="fecha">Fecha *</label>
                <input type="date" id="fecha" [(ngModel)]="formData.fecha" required />
              </div>
              <div class="form-group">
                <label for="dia_semana">Día *</label>
                <select id="dia_semana" [(ngModel)]="formData.dia_semana" required>
                  <option [value]="0">Lunes</option>
                  <option [value]="1">Martes</option>
                  <option [value]="2">Miércoles</option>
                  <option [value]="3">Jueves</option>
                  <option [value]="4">Viernes</option>
                  <option [value]="5">Sábado</option>
                  <option [value]="6">Domingo</option>
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="conductor">Conductor</label>
                <input type="text" id="conductor" [(ngModel)]="formData.conductor" placeholder="Nombre del conductor" />
              </div>
              <div class="form-group">
                <label for="hora">Hora</label>
                <input type="time" id="hora" [(ngModel)]="formData.hora" />
              </div>
            </div>

            <h3 class="section-title">Lugar de Predicación</h3>
            <div class="form-group">
              <label for="lugar_nombre">Nombre del Lugar</label>
              <input type="text" id="lugar_nombre" [(ngModel)]="formData.lugar_nombre" placeholder="Ej: Salón del Reino" />
            </div>
            <div class="form-group">
              <label for="lugar_direccion">Dirección</label>
              <input type="text" id="lugar_direccion" [(ngModel)]="formData.lugar_direccion" placeholder="Dirección del lugar" />
            </div>

            <div class="form-group">
              <label for="observaciones">Observaciones</label>
              <textarea id="observaciones" [(ngModel)]="formData.observaciones" rows="3" placeholder="Notas de la visita..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            @if (editing()) {
              <button class="btn btn-danger" (click)="deleteVisita()">🗑️ Eliminar</button>
            }
            <div class="spacer"></div>
            <button class="btn btn-outline" (click)="closeModal()">Cancelar</button>
            <button class="btn btn-primary" (click)="save()" [disabled]="!formData.fecha">Guardar</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-container { max-width: 1200px; margin: 0 auto; }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.5rem;
      h1 { font-size: 1.75rem; font-weight: 700; }
      .header-subtitle { color: var(--text-secondary); margin-top: 0.25rem; }
    }

    .plantilla-section {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      
      h3 { margin: 0 0 1rem; font-size: 1rem; }
    }

    .loading, .empty-state { text-align: center; padding: 3rem; color: var(--text-secondary); }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; .empty-icon { font-size: 3rem; opacity: 0.5; } }

    .visitas-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
    
    .visita-card {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1rem;
      transition: all 0.2s ease;
      
      &.visited { border-color: #22c55e; background: rgba(34, 197, 94, 0.05); }
    }
    
    .visita-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      h3 { margin: 0; font-size: 1.25rem; font-weight: 600; }
      .badge-visited { background: #22c55e; color: white; padding: 0.25rem 0.5rem; border-radius: var(--radius-sm); font-size: 0.75rem; }
    }
    
    .visita-content {
      display: flex; flex-direction: column; gap: 0.5rem;
      .info-row { display: flex; gap: 0.5rem; font-size: 0.875rem; }
      .label { color: var(--text-secondary); min-width: 80px; }
      .value { font-weight: 500; }
      .observaciones { 
        margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--border-color);
        .label { display: block; margin-bottom: 0.25rem; }
        p { margin: 0; font-size: 0.875rem; }
      }
    }
    
    .visita-actions {
      display: flex; gap: 0.5rem; margin-top: 1rem; padding-top: 0.5rem; border-top: 1px solid var(--border-color);
    }
    
    .btn-check {
      background: var(--surface-color); border: 1px solid var(--border-color); color: var(--text-primary);
      padding: 0.375rem 0.75rem; border-radius: var(--radius-md); font-size: 0.75rem; cursor: pointer;
      &.active { background: #22c55e; border-color: #22c55e; color: white; }
    }
    .btn-edit { font-size: 0.75rem; color: var(--primary-color); cursor: pointer; }

    .form-row { display: flex; gap: 1rem; }
    .form-group { flex: 1; margin-bottom: 1rem; label { display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem; } 
      input, select, textarea { width: 100%; padding: 0.625rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.875rem; background: var(--background-color); color: var(--text-primary); }
    }
    .section-title { font-size: 1rem; color: var(--text-primary); margin: 1.5rem 0 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--radius-lg); width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; &.modal-lg { max-width: 600px; } }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); position: sticky; top: 0; background: var(--surface-color); h2 { margin: 0; font-size: 1.25rem; } }
    .btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; padding: 0; line-height: 1; color: var(--text-secondary); }
    .modal-body { padding: 1.5rem; }
    .modal-footer { display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); position: sticky; bottom: 0; background: var(--surface-color); .spacer { flex: 1; } }
  `]
})
export class ProgramaVisitaListComponent implements OnInit {
  visitaService = inject(ProgramaVisitaService);
  programaService = inject(ProgramaPredicacionService);
  grupoService = inject(GrupoService);
  territorioService = inject(TerritorioService);
  authService = inject(AuthService);

  visitas = signal<ProgramaVisita[]>([]);
  loading = signal(true);
  
  showModal = signal(false);
  editing = signal(false);
  editingId = signal<string | null>(null);
  
  diaPlantilla = 2; // Miércoles por defecto
  fechaBusqueda = '';

  formData: any = {
    programa_predicacion_id: '',
    fecha: '',
    dia_semana: 0,
    conductor: '',
    hora: '',
    lugar_nombre: '',
    lugar_direccion: '',
    observaciones: '',
    visited: false
  };

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.visitaService.loadVisitas().subscribe({
      next: (res) => { this.visitas.set(res?.data || []); this.loading.set(false); },
      error: () => { this.visitas.set([]); this.loading.set(false); }
    });
  }

  onDiaChange() {
    // Actualizar dia_semana cuando cambia el selector
  }

  cargarPlantilla() {
    if (!this.fechaBusqueda) {
      alert('Por favor selecciona una fecha de visita');
      return;
    }
    
    // Buscar programa de día predicacion para el día seleccionado
    const programas = this.programaService.programas();
    const progDia = programas.find(p => p.dia_semana === this.diaPlantilla);
    
    if (!progDia) {
      alert('No hay programa configurado para ese día en Día Predicación');
      return;
    }

    // Prellenar el formulario
    this.formData = {
      programa_predicacion_id: progDia.id,
      fecha: this.fechaBusqueda,
      dia_semana: this.diaPlantilla,
      conductor: progDia.conductor || '',
      hora: progDia.hora_inicio || '',
      lugar_nombre: progDia.lugar_nombre || '',
      lugar_direccion: progDia.lugar_direccion || '',
      observaciones: '',
      visited: false
    };
    
    this.editing.set(false);
    this.editingId.set(null);
    this.showModal.set(true);
  }

  openCreateModal() {
    this.formData = {
      programa_predicacion_id: '',
      fecha: '',
      dia_semana: this.diaPlantilla,
      conductor: '',
      hora: '',
      lugar_nombre: 'Salón del Reino',
      lugar_direccion: '',
      observaciones: '',
      visited: false
    };
    this.editing.set(false);
    this.editingId.set(null);
    this.showModal.set(true);
  }

  editVisita(visita: ProgramaVisita) {
    this.formData = { ...visita };
    this.editing.set(true);
    this.editingId.set(visita.id);
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editing.set(false);
    this.editingId.set(null);
  }

  save() {
    const editing = this.editing();
    
    if (editing) {
      this.visitaService.updateVisita(this.editingId()!, this.formData).subscribe({
        next: () => { this.loadData(); this.closeModal(); }
      });
    } else {
      this.visitaService.createVisita(this.formData).subscribe({
        next: () => { this.loadData(); this.closeModal(); }
      });
    }
  }

  deleteVisita() {
    if (confirm('¿Eliminar esta visita?')) {
      this.visitaService.deleteVisita(this.editingId()!).subscribe({
        next: () => { this.loadData(); this.closeModal(); }
      });
    }
  }

  toggleVisited(visita: ProgramaVisita) {
    this.visitaService.setVisited(visita.id, !visita.visited).subscribe({
      next: () => this.loadData()
    });
  }
}