import { Component, inject, OnInit, signal, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ProgramaVisitaService, ProgramaVisita } from '../../core/services/programa-visita.service';
import { ProgramaPredicacionService } from '../../core/services/programa-predicacion.service';
import { GrupoService } from '../../core/services/grupo.service';
import { TerritorioService } from '../../core/services/territorio.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-programa-visita-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="header-content">
          <h1><re-icon icon="smart-car2" size="24" weight="outline"></re-icon> Predicación Visita</h1>
          <p class="header-subtitle">Personaliza la programación diaria para cada visita</p>
        </div>
        @if (authService.isSuperintendente() || authService.isSuperAdmin()) {
          <button class="btn btn-primary" (click)="openCreateModal()">
            <re-icon icon="add-square2" size="16" weight="outline"></re-icon> Nueva Visita
          </button>
        }
      </header>

      <!-- Selector de Día para cargar plantilla -->
      <div class="plantilla-section">
        <h3><re-icon icon="import-12" size="18" weight="outline"></re-icon> Cargar desde Día Predicación</h3>
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
            <re-icon icon="import-12" size="16" weight="outline"></re-icon> Cargar Plantilla
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading">Cargando...</div>
      } @else if (visitas().length === 0) {
        <div class="empty-state">
          <re-icon icon="smart-car2" size="48" weight="outline" class="empty-icon"></re-icon>
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
            <div class="visita-card">
              <div class="visita-header">
                <h3>{{ visita.dia_semana_nombre }}</h3>
              </div>
              
              <div class="visita-content">
                @if (visita.fecha) {
                  <div class="info-row">
                    <span class="label"><re-icon icon="calendar-12" size="14" weight="outline"></re-icon> Fecha:</span>
                    <span class="value">{{ visita.fecha }}</span>
                  </div>
                }
                @if (visita.hora) {
                  <div class="info-row">
                    <span class="label"><re-icon icon="clock-circle" size="14" weight="outline"></re-icon> Hora:</span>
                    <span class="value">{{ visita.hora }}</span>
                  </div>
                }
                <div class="info-row">
                  <span class="label"><re-icon icon="user-circle" size="14" weight="outline"></re-icon> Conductor:</span>
                  <span class="value">{{ visita.conductor || 'Sin asignar' }}</span>
                </div>
                <div class="info-row">
                  <span class="label"><re-icon icon="map-point" size="14" weight="outline"></re-icon> Lugar:</span>
                  <span class="value">{{ visita.lugar_nombre || 'Sin asignar' }}</span>
                </div>
                @if (visita.lugar_direccion) {
                  <div class="info-row">
                    <span class="label"><re-icon icon="home" size="14" weight="outline"></re-icon> Dirección:</span>
                    <span class="value">{{ visita.lugar_direccion }}</span>
                  </div>
                }
                @if (visita.observaciones) {
                  <div class="observaciones">
                    <span class="label">≡ƒô¥ Notas:</span>
                    <p>{{ visita.observaciones }}</p>
                  </div>
                }

              </div>

              <div class="visita-actions">
                <span class="btn-view" (click)="viewVisita(visita)">≡ƒæü️ Ver</span>
@if (authService.isSuperintendente() || authService.isSuperAdmin()) {
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
              <label for="lugar_direccion">Dirección *</label>
              <input type="text" id="lugar_direccion" [(ngModel)]="formData.lugar_direccion" placeholder="Calle y número" />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="lugar_ciudad">Ciudad</label>
                <input type="text" id="lugar_ciudad" [(ngModel)]="formData.lugar_ciudad" placeholder="Ej: Buenos Aires" />
              </div>
              <div class="form-group">
                <label for="lugar_provincia">Provincia</label>
                <input type="text" id="lugar_provincia" [(ngModel)]="formData.lugar_provincia" placeholder="Ej: CABA" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="lugar_codigo_postal">Código Postal</label>
                <input type="text" id="lugar_codigo_postal" [(ngModel)]="formData.lugar_codigo_postal" placeholder="Ej: C1428" />
              </div>
              <div class="form-group">
                <label for="lugar_pais">País</label>
                <input type="text" id="lugar_pais" [(ngModel)]="formData.lugar_pais" placeholder="País" />
              </div>
            </div>

            <div class="form-group">
              <label for="lugar_ubicacion">Coordenadas (opcional)</label>
              <input type="text" id="lugar_ubicacion" [(ngModel)]="formData.lugar_ubicacion" placeholder="Ej: -0.218386, -78.506913" />
              <small class="help-text">Latitud,Longitud - ej: -0.218386,-78.506913</small>
            </div>

            <div class="form-group">
              <label for="observaciones">Observaciones</label>
              <textarea id="observaciones" [(ngModel)]="formData.observaciones" rows="3" placeholder="Notas de la visita..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            @if (editing()) {
              <button class="btn btn-danger" (click)="deleteVisita()">≡ƒùæ️ Eliminar</button>
            }
            <div class="spacer"></div>
            <button class="btn btn-outline" (click)="closeModal()">Cancelar</button>
            <button class="btn btn-primary" (click)="save()" [disabled]="!formData.fecha">Guardar</button>
          </div>
        </div>
      </div>
    }

    <!-- Detail View Modal -->
    @if (viewing() && viewingVisita()) {
      <div class="modal-overlay" (click)="$event.stopPropagation()">
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Detalle de Visita</h2>
            <button class="btn-close" (click)="closeViewModal()">×</button>
          </div>
          <div class="modal-body">
            @if (viewingVisita()!.fecha) {
              <div class="info-row">
                <span class="label"><re-icon icon="calendar-12" size="14" weight="outline"></re-icon> Fecha:</span>
                <span class="value">{{ viewingVisita()!.fecha }}</span>
              </div>
            }
            @if (viewingVisita()!.dia_semana_nombre) {
              <div class="info-row">
                <span class="label">≡ƒôå Día:</span>
                <span class="value">{{ viewingVisita()!.dia_semana_nombre }}</span>
              </div>
            }
            @if (viewingVisita()!.hora) {
              <div class="info-row">
                <span class="label"><re-icon icon="clock-circle" size="14" weight="outline"></re-icon> Hora:</span>
                <span class="value">{{ viewingVisita()!.hora }}</span>
              </div>
            }
            <div class="info-row">
              <span class="label"><re-icon icon="user-circle" size="14" weight="outline"></re-icon> Conductor:</span>
              <span class="value">{{ viewingVisita()!.conductor || 'Sin asignar' }}</span>
            </div>
            <div class="info-row">
              <span class="label"><re-icon icon="map-point" size="14" weight="outline"></re-icon> Lugar:</span>
              <span class="value">{{ viewingVisita()!.lugar_nombre || 'Sin asignar' }}</span>
            </div>
            @if (viewingVisita()!.lugar_direccion) {
              <div class="info-row">
                <span class="label"><re-icon icon="home" size="14" weight="outline"></re-icon> Dirección:</span>
                <span class="value">{{ viewingVisita()!.lugar_direccion }}</span>
              </div>
              
              <!-- Map Container -->
              <div class="map-section">
                @if (getGoogleMapsEmbedUrl(viewingVisita()!)) {
                  <iframe
                    [src]="getGoogleMapsEmbedUrl(viewingVisita()!)"
                    width="100%"
                    height="250"
                    style="border:0; border-radius: 8px;"
                    loading="lazy"
                    allowfullscreen
                    referrerpolicy="no-referrer-when-downgrade">
                  </iframe>
                } @else if (hasExactLocation(viewingVisita()!)) {
                  <div class="map-placeholder">
                    <a [href]="getExactLocationUrl(viewingVisita()!)" target="_blank" class="btn-maps">
                      ≡ƒôì Ver Coordenadas
                    </a>
                  </div>
                }
              </div>
            }
            @if (viewingVisita()!.lugar_contacto) {
              <div class="info-row">
                <span class="label">≡ƒæñ Contacto:</span>
                <span class="value">{{ viewingVisita()!.lugar_contacto }}</span>
              </div>
            }
            @if (viewingVisita()!.lugar_telefono) {
              <div class="info-row">
                <span class="label">≡ƒô₧ Teléfono:</span>
                <span class="value">{{ viewingVisita()!.lugar_telefono }}</span>
              </div>
            }
            @if (viewingVisita()!.observaciones) {
              <div class="info-row observaciones">
                <span class="label">≡ƒô¥ Observaciones:</span>
                <p>{{ viewingVisita()!.observaciones }}</p>
              </div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="shareByWhatsApp()">
              ≡ƒôñ Compartir
            </button>
            @if (hasExactLocation(viewingVisita()!)) {
              <a [href]="getExactLocationUrl(viewingVisita()!)"
                 target="_blank"
                 class="btn btn-outline"
                 title="Abrir ubicación exacta">
                ≡ƒôì Ver Coordenadas
              </a>
            } @else if (viewingVisita()!.lugar_direccion) {
              <a [href]="getGoogleMapsUrl(viewingVisita()!.lugar_direccion)"
                 target="_blank"
                 class="btn btn-outline"
                 title="Abrir en Google Maps">
                ≡ƒöù Ver en Maps
              </a>
            } @else {
              <button class="btn btn-outline" disabled title="No hay dirección">
                ≡ƒôì Sin dirección
              </button>
            }
            <div class="spacer"></div>
            <button class="btn btn-outline" (click)="closeViewModal()">Cerrar</button>
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
    }
    
    .visita-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      h3 { margin: 0; font-size: 1.25rem; font-weight: 600; }
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
    .btn-view, .btn-edit { font-size: 0.75rem; color: var(--primary-color); cursor: pointer; }

    .form-row { display: flex; gap: 1rem; }
    .form-group { flex: 1; margin-bottom: 1rem; label { display: block; margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem; } 
      input, select, textarea { width: 100%; padding: 0.625rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.875rem; background: var(--background-color); color: var(--text-primary); }
      .help-text { display: block; margin-top: 0.25rem; font-size: 0.75rem; color: var(--text-secondary); font-style: italic; }
    }
    .section-title { font-size: 1rem; color: var(--text-primary); margin: 1.5rem 0 1rem; padding-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 1rem; }
    .modal { background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--radius-lg); width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto; &.modal-lg { max-width: 600px; } }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid var(--border-color); position: sticky; top: 0; background: var(--surface-color); h2 { margin: 0; font-size: 1.25rem; } }
    .btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; padding: 0; line-height: 1; color: var(--text-secondary); }
    .modal-body { padding: 1.5rem; }
    .modal-footer { display: flex; align-items: center; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid var(--border-color); position: sticky; bottom: 0; background: var(--surface-color); .spacer { flex: 1; } }

    .map-section { margin-top: 1rem; }
    .map-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 250px;
      background: var(--background-color);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
    }
    .btn-maps {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
      background: #4285f4;
      color: white;
      border: none;
      &:hover { background: #3367d6; }
    }
    .map-container { width: 100%; height: 300px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-color); }
    .map-preview-btn { position: relative; text-decoration: none; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color); }
    .map-btn-overlay { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.75); color: white; padding: 8px 16px; border-radius: 20px; font-weight: 500; white-space: nowrap; transition: background 0.2s; }
    .map-preview-btn:hover .map-btn-overlay { background: rgba(0,0,0,0.9); }
    .map-loading, .map-error { width: 100%; height: 300px; display: flex; align-items: center; justify-content: center; background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--radius-md); color: var(--text-secondary); }
    .map-error { color: #ef4444; }
  `]
})
export class ProgramaVisitaListComponent implements OnInit {
  visitaService = inject(ProgramaVisitaService);
  programaService = inject(ProgramaPredicacionService);
  grupoService = inject(GrupoService);
  territorioService = inject(TerritorioService);
authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);
 
  visitas = signal<ProgramaVisita[]>([]);
  loading = signal(true);
  
  showModal = signal(false);
  editing = signal(false);
  editingId = signal<string | null>(null);
  
  // Detail modal signals
  viewing = signal(false);
  viewingVisita = signal<ProgramaVisita | null>(null);
  
  diaPlantilla = 2; // Miércoles por defecto
  fechaBusqueda = '';

  formData: {
    programa_predicacion_id: string;
    fecha: string;
    dia_semana: number;
    conductor: string;
    hora: string;
    lugar_nombre: string;
    lugar_direccion: string;
    lugar_ciudad: string;
    lugar_provincia: string;
    lugar_codigo_postal: string;
    lugar_pais: string;
    lugar_ubicacion: string;
    observaciones: string;
    visited: boolean;
  } = {
    programa_predicacion_id: '',
    fecha: '',
    dia_semana: 0,
    conductor: '',
    hora: '',
    lugar_nombre: '',
    lugar_direccion: '',
    lugar_ciudad: '',
    lugar_provincia: '',
    lugar_codigo_postal: '',
    lugar_pais: '',
    lugar_ubicacion: '',
    observaciones: '',
    visited: false
  };

  ngOnInit() {
    this.loadData();
    // Cargar programas de prédicación para la plantilla
    this.programaService.loadProgramas().subscribe();
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
      lugar_ciudad: progDia.lugar_ciudad || '',
      lugar_provincia: progDia.lugar_provincia || '',
      lugar_codigo_postal: progDia.lugar_codigo_postal || '',
      lugar_pais: progDia.lugar_pais || 'Argentina',
      lugar_ubicacion: progDia.lugar_ubicacion || '',
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
      lugar_ciudad: '',
      lugar_provincia: '',
      lugar_codigo_postal: '',
      lugar_pais: '',
      lugar_ubicacion: '',
      observaciones: '',
      visited: false
    };
    this.editing.set(false);
    this.editingId.set(null);
    this.showModal.set(true);
  }

  editVisita(visita: ProgramaVisita) {
    this.formData = {
      programa_predicacion_id: visita.programa_predicacion_id || '',
      fecha: visita.fecha,
      dia_semana: visita.dia_semana,
      conductor: visita.conductor || '',
      hora: visita.hora || '',
      lugar_nombre: visita.lugar_nombre || '',
      lugar_direccion: visita.lugar_direccion || '',
      lugar_ciudad: visita.lugar_ciudad || '',
      lugar_provincia: visita.lugar_provincia || '',
      lugar_codigo_postal: visita.lugar_codigo_postal || '',
      lugar_pais: visita.lugar_pais || '',
      lugar_ubicacion: visita.lugar_ubicacion || '',
      observaciones: visita.observaciones || '',
      visited: visita.visited
    };
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

  // View detail modal methods
  
  viewVisita(visita: ProgramaVisita) {
    this.viewingVisita.set(visita);
    this.viewing.set(true);
  }

  closeViewModal() {
    this.viewing.set(false);
    this.viewingVisita.set(null);
  }

  getGoogleMapsUrl(direccion: string): string {
    if (!direccion) return '';
    const fullAddress = this.buildFullAddress(direccion);
    const encoded = encodeURIComponent(fullAddress);
    return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
  }
  
  hasExactLocation(visita: ProgramaVisita): boolean {
    return !!visita.lugar_ubicacion;
  }
  
  getExactLocationUrl(visita: ProgramaVisita): string {
    const coords = visita.lugar_ubicacion;
    if (coords) {
      return `https://www.google.com/maps?q=${encodeURIComponent(coords)}&z=17`;
    }
    return '';
  }
  
  getStaticMapUrl(direccion: string): string {
    if (!direccion) return '';
    const fullAddress = this.buildFullAddress(direccion);
    const encoded = encodeURIComponent(fullAddress);
    // Static Maps API (free tier available)
    return `https://maps.googleapis.com/maps/api/staticmap?center=${encoded}&zoom=15&size=600x300&maptype=roadmap&markers=color:red%7C${encoded}&key=AIzaSyAhX2H5b4Cintpgw_UTMXmNUcwNQOESLLg`;
  }
  
  getGoogleMapsEmbedUrl(visita: ProgramaVisita): SafeResourceUrl {
    // Priority: coordenadas > address
    const coords = visita.lugar_ubicacion;
    
    // If coordinates, use them directly
    if (coords && coords.includes(',') && /^-?[\d.-]+,\s*-?[\d.-]+$/.test(coords.trim())) {
      const url = `https://www.google.com/maps?q=${encodeURIComponent(coords)}&output=embed&z=16`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
    
    // Fallback to address fields
    if (!visita?.lugar_direccion) return '';
    
    const parts: string[] = [];
    if (visita.lugar_direccion) parts.push(visita.lugar_direccion);
    if (visita.lugar_ciudad) parts.push(visita.lugar_ciudad);
    if (visita.lugar_provincia) parts.push(visita.lugar_provincia);
    if (visita.lugar_codigo_postal) parts.push(visita.lugar_codigo_postal);
    if (visita.lugar_pais) parts.push(visita.lugar_pais);
    
    const fullAddress = parts.length > 0 ? parts.join(', ') : visita.lugar_direccion;
    const encoded = encodeURIComponent(fullAddress);
    
    const url = `https://www.google.com/maps?q=${encoded}&output=embed&z=16`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
  
  private buildFullAddress(direccion: string): string {
    const visita = this.viewingVisita();
    if (!visita) return direccion;
    
    const parts: string[] = [];
    if (visita.lugar_direccion) parts.push(visita.lugar_direccion);
    if (visita.lugar_ciudad) parts.push(visita.lugar_ciudad);
    if (visita.lugar_provincia) parts.push(visita.lugar_provincia);
    if (visita.lugar_codigo_postal) parts.push(visita.lugar_codigo_postal);
    if (visita.lugar_pais) parts.push(visita.lugar_pais);
    
    return parts.length > 0 ? parts.join(', ') : direccion;
  }

openGoogleMaps() {
    const visita = this.viewingVisita();
    if (!visita?.lugar_direccion) {
      alert('No hay dirección disponible');
      return;
    }
    const url = this.getGoogleMapsUrl(visita.lugar_direccion);
    window.open(url, '_blank');
  }

  // WhatsApp share methods

  getWhatsAppMessage(): string {
    const visita = this.viewingVisita();
    if (!visita) return '';

    let message = '≡ƒôà Información de Visita\n\n';

    if (visita.dia_semana_nombre) {
      message += `≡ƒôå Día: ${visita.dia_semana_nombre}\n`;
    }
    if (visita.fecha) {
      message += `≡ƒôà Fecha: ${visita.fecha}\n`;
    }
    if (visita.hora) {
      message += `ΓÅ░ Hora: ${visita.hora}\n`;
    }
    if (visita.conductor) {
      message += `≡ƒÄñ Conductor: ${visita.conductor}\n`;
    }
    if (visita.lugar_nombre) {
      message += `≡ƒôì Lugar: ${visita.lugar_nombre}\n`;
    }
    if (visita.lugar_direccion) {
      const direccion = this.buildFullAddress(visita.lugar_direccion);
      message += `≡ƒÅá Dirección: ${direccion}\n`;
    }

    return message;
  }

  getWhatsAppUrl(): string {
    const message = this.getWhatsAppMessage();
    if (!message) return '';

    const encoded = encodeURIComponent(message);
    return `https://wa.me/?text=${encoded}`;
  }

  shareByWhatsApp() {
    const url = this.getWhatsAppUrl();
    if (!url) {
      alert('No hay información para compartir');
      return;
    }
    window.open(url, '_blank');
  }
}
