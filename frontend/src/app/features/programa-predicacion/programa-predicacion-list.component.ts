import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ProgramaPredicacionService, ProgramaPredicacion } from '../../core/services/programa-predicacion.service';
import { GrupoService, Grupo } from '../../core/services/grupo.service';
import { TerritorioService, Territorio } from '../../core/services/territorio.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-programa-predicacion-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="header-content">
          <h1>📅 Día Predicación</h1>
          <p class="header-subtitle">Horario y territorios por día de la semana</p>
        </div>
        @if (authService.isSuperintendente() || authService.isSuperAdmin()) {
          <button class="btn btn-primary" (click)="openCreateModal()">
            ➕ Nueva Fecha
          </button>
        }
      </header>
      
      @if (loading()) {
        <div class="loading">Cargando...</div>
      } @else if (programas().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <p>No hay programas de prédicación registrados</p>
          @if (authService.isSuperintendente() || authService.isSuperAdmin()) {
            <button class="btn btn-primary" (click)="openCreateModal()">
              Crear Primer Programa
            </button>
          }
        </div>
      } @else {
        <!-- Agrupar por fecha -->
        @for (fecha of getFechasUnicas(); track fecha) {
          <div class="fecha-section">
            <h2 class="fecha-title">{{ formatDate(fecha) }}</h2>
            <div class="dias-grid">
              @for (prog of getProgramasByFecha(fecha); track prog.id) {
                <div class="dia-card">
                  <div class="dia-header">
                    <h3>{{ prog.dia_semana_nombre }}</h3>
                    @if (prog.hora_inicio) {
                      <span class="horario">{{ prog.hora_inicio }}</span>
                    }
                  </div>
                  
                  <div class="dia-content">
                    <div class="info-row">
                      <span class="label">🎤 Conductor:</span>
                      <span class="value">{{ prog.conductor || 'Sin asignar' }}</span>
                    </div>
                    
                    <div class="info-row">
                      <span class="label">📍 Lugar:</span>
                      <span class="value">{{ prog.lugar_nombre || 'Sin asignar' }}</span>
                    </div>
                    
                    @if (prog.territorios && prog.territorios.length > 0) {
                      <div class="info-row territorio">
                        <span class="label">🗺️ Territorios:</span>
                        <span class="value">{{ prog.territorios.map(t => t.nombre).join(', ') }}</span>
                      </div>
                    }
                    
                    @if (prog.grupo) {
                      <div class="info-row grupo">
                        <span class="label">👥 Grupo:</span>
                        <span class="value">#{{ prog.grupo.numero }} {{ prog.grupo.nombre }}</span>
                      </div>
                    }
                  </div>
                  
                  <div class="dia-actions">
                    <button class="btn-icon" (click)="viewPrograma(prog)" title="Ver Detalles">
                      👁️ Ver
                    </button>
                    @if (authService.isSuperintendente() || authService.isSuperAdmin()) {
                      <span class="btn-edit" (click)="editPrograma(prog)">✏️ Editar</span>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }
      }
    </div>

    <!-- Create/Edit Modal -->
    @if (showModal()) {
      <div class="modal-overlay" (click)="$event.stopPropagation()">
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingPrograma() ? 'Editar' : 'Nuevo' }} Día de Predicación</h2>
            <button class="btn-close" (click)="closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-row">
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
              <div class="form-group">
                <label for="fecha">Fecha</label>
                <input 
                  type="date" 
                  id="fecha" 
                  [(ngModel)]="formData.fecha" 
                  (change)="onFechaChange()"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="conductor">Conductor</label>
                <input 
                  type="text" 
                  id="conductor" 
                  [(ngModel)]="formData.conductor" 
                  placeholder="Nombre del conductor"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="hora_inicio">Hora</label>
                <input 
                  type="time" 
                  id="hora_inicio" 
                  [(ngModel)]="formData.hora_inicio" 
                  placeholder="Ej: 09:00"
                />
              </div>
            </div>

            <h3 class="section-title">Lugar de Predicación</h3>
            
            <div class="form-group">
              <label for="lugar_nombre">Nombre del Lugar</label>
              <input 
                type="text" 
                id="lugar_nombre" 
                [(ngModel)]="formData.lugar_nombre" 
                placeholder="Ej: Salón del Reino"
              />
            </div>

            <div class="form-group">
              <label for="lugar_direccion">Dirección</label>
              <input 
                type="text" 
                id="lugar_direccion" 
                [(ngModel)]="formData.lugar_direccion" 
                placeholder="Dirección del lugar"
              />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="lugar_contacto">Contacto</label>
                <input 
                  type="text" 
                  id="lugar_contacto" 
                  [(ngModel)]="formData.lugar_contacto" 
                  placeholder="Nombre del contacto"
                />
              </div>
              <div class="form-group">
                <label for="lugar_telefono">Teléfono</label>
                <input 
                  type="tel" 
                  id="lugar_telefono" 
                  [(ngModel)]="formData.lugar_telefono" 
                  placeholder="Teléfono de contacto"
                />
              </div>
            </div>

            <h3 class="section-title">Territorios Asignados</h3>

            <div class="form-row">
              <div class="form-group">
                <label for="grupo_id">Grupo (opcional)</label>
                <select id="grupo_id" [(ngModel)]="formData.grupo_id" (change)="onGrupoChange()">
                  <option value="">Sin asignar</option>
                  @for (g of grupos(); track g.id) {
                    <option [value]="g.id">#{{ g.numero }} - {{ g.nombre }}</option>
                  }
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Seleccionar Territorios</label>
              <div class="territorios-list">
                @for (t of getAllTerritorios(); track t.id) {
                  <label class="territorio-checkbox">
                    <input 
                      type="checkbox" 
                      [checked]="isTerritorioSelected(t.id)"
                      (change)="toggleTerritorio(t.id)"
                    />
                    <span>{{ t.nombre }}</span>
                  </label>
                }
              </div>
              @if (getAllTerritorios().length === 0) {
                <p class="no-territorios">No hay territorios disponibles</p>
              }
            </div>
          </div>
          <div class="modal-footer">
            @if (editingPrograma()) {
              <button class="btn btn-danger" (click)="deletePrograma()">🗑️ Eliminar</button>
            }
            <div class="spacer"></div>
            <button class="btn btn-outline" (click)="closeModal()">Cancelar</button>
            <button 
              class="btn btn-primary" 
              (click)="savePrograma()"
              [disabled]="formData.dia_semana === null || formData.dia_semana === undefined"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Detail Modal -->
    @if (showDetailModal()) {
      <div class="modal-overlay" (click)="$event.stopPropagation()">
        <div class="modal modal-lg" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>📅 {{ viewingPrograma()?.dia_semana_nombre }}</h2>
            <button class="btn-close" (click)="closeDetailModal()">×</button>
          </div>
          <div class="modal-body">
            @if (viewingPrograma()) {
              <div class="detail-grid">
                <!-- Fecha y Día -->
                <div class="detail-section">
                  <h3 class="section-title">📅 Programación</h3>
                  <div class="detail-row">
                    <span class="detail-label">Día:</span>
                    <span class="detail-value">{{ viewingPrograma()?.dia_semana_nombre }}</span>
                  </div>
                  @if (viewingPrograma()?.fecha) {
                    <div class="detail-row">
                      <span class="detail-label">Fecha:</span>
                      <span class="detail-value">{{ formatDate(viewingPrograma()?.fecha || '') }}</span>
                    </div>
                  }
                  @if (viewingPrograma()?.hora_inicio) {
                    <div class="detail-row">
                      <span class="detail-label">Hora:</span>
                      <span class="detail-value">{{ viewingPrograma()?.hora_inicio }}</span>
                    </div>
                  }
                </div>

                <!-- Conductor -->
                <div class="detail-section">
                  <h3 class="section-title">🎤 Conductor</h3>
                  <div class="detail-row">
                    <span class="detail-value large">{{ viewingPrograma()?.conductor || 'Sin asignar' }}</span>
                  </div>
                </div>

                <!-- Lugar -->
                <div class="detail-section">
                  <h3 class="section-title">📍 Lugar de Predicación</h3>
                  <div class="detail-row">
                    <span class="detail-label">Nombre:</span>
                    <span class="detail-value">{{ viewingPrograma()?.lugar_nombre || 'Sin asignar' }}</span>
                  </div>
                  @if (viewingPrograma()?.lugar_direccion) {
                    <div class="detail-row">
                      <span class="detail-label">Dirección:</span>
                      <span class="detail-value">{{ viewingPrograma()?.lugar_direccion }}</span>
                    </div>
                  }
                  @if (viewingPrograma()?.lugar_contacto) {
                    <div class="detail-row">
                      <span class="detail-label">Contacto:</span>
                      <span class="detail-value">{{ viewingPrograma()?.lugar_contacto }}</span>
                    </div>
                  }
                  @if (viewingPrograma()?.lugar_telefono) {
                    <div class="detail-row">
                      <span class="detail-label">Teléfono:</span>
                      <span class="detail-value">{{ viewingPrograma()?.lugar_telefono }}</span>
                    </div>
                  }
                  <!-- Mapa embebido -->
                  @if (viewingPrograma()?.lugar_direccion) {
                    <div class="map-section">
                      <iframe
                        [src]="getGoogleMapsEmbedUrl(viewingPrograma()!)"
                        width="100%"
                        height="250"
                        style="border:0; border-radius: 8px;"
                        loading="lazy"
                        allowfullscreen>
                      </iframe>
                    </div>
                  }
                  <!-- Botón Google Maps -->
                  @if (viewingPrograma()?.lugar_direccion) {
                    <div class="detail-row action-row">
                      <a 
                        [href]="getGoogleMapsUrl(viewingPrograma()?.lugar_direccion || '')" 
                        target="_blank"
                        rel="noopener noreferrer"
                        class="btn-maps"
                        (click)="closeDetailModal()"
                      >
                        📍 Ver en Google Maps
                      </a>
                      <button 
                        class="btn-whatsapp" 
                        (click)="shareByWhatsApp(viewingPrograma()!); closeDetailModal()"
                      >
                        📱 Compartir por WhatsApp
                      </button>
                    </div>
                  }
                </div>

                <!-- Territorios -->
                @if (viewingPrograma()?.territorios && viewingPrograma()!.territorios!.length > 0) {
                  <div class="detail-section">
                    <h3 class="section-title">🗺️ Territorios Asignados</h3>
                    <div class="territorios-tags">
                      @for (t of viewingPrograma()?.territorios; track t.id) {
                        <span class="tag territorio-tag">{{ t.nombre }}</span>
                      }
                    </div>
                  </div>
                }

                <!-- Grupo -->
                @if (viewingPrograma()?.grupo) {
                  <div class="detail-section">
                    <h3 class="section-title">👥 Grupo</h3>
                    <div class="detail-row">
                      <span class="detail-value large">#{{ viewingPrograma()?.grupo?.numero }} - {{ viewingPrograma()?.grupo?.nombre }}</span>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeDetailModal()">Cerrar</button>
            @if (authService.isSuperintendente() || authService.isSuperAdmin()) {
              <button class="btn btn-primary" (click)="closeDetailModal(); editPrograma(viewingPrograma()!)">✏️ Editar</button>
            }
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
    
    .loading, .empty-state { text-align: center; padding: 3rem; color: var(--text-secondary); }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; .empty-icon { font-size: 3rem; opacity: 0.5; } }
    
    .fecha-section { margin-bottom: 2rem; }
    
    .fecha-title {
      font-size: 1.125rem;
      color: var(--primary-color);
      margin: 0 0 1rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid var(--primary-color);
    }
    
    .dias-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }
    
    .dia-card {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        transform: translateY(-2px);
      }
    }
    
    .dia-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-color);
      
      h3 { margin: 0; font-size: 1.125rem; font-weight: 600; }
      .horario { font-size: 0.75rem; color: var(--text-secondary); }
    }
    
    .dia-content {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .info-row {
      display: flex;
      gap: 0.5rem;
      font-size: 0.875rem;
      
      .label { color: var(--text-secondary); min-width: 90px; }
      .value { font-weight: 500; }
      
      &.territorio .value { color: var(--primary-color); }
      &.grupo .value { color: #059669; }
    }
    
    .dia-actions {
      margin-top: 0.75rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--border-color);
      text-align: right;
    }
    
    .btn-edit { font-size: 0.75rem; color: var(--primary-color); }
    .btn-icon { 
      background: var(--surface-color); 
      border: 1px solid var(--primary-color); 
      color: var(--primary-color);
      padding: 0.375rem 0.75rem;
      border-radius: var(--radius-md);
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
      
      &:hover { background: var(--primary-color); color: white; }
    }
    
    /* Detail Modal styles */
    .detail-grid {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .detail-section {
      background: var(--background-color);
      border-radius: var(--radius-md);
      padding: 1rem;
    }
    
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      border-bottom: 1px solid var(--border-color);
      
      &:last-child { border-bottom: none; }
    }
    
    .detail-label {
      font-weight: 600;
      color: var(--text-secondary);
      font-size: 0.875rem;
    }
    
    .action-row {
      display: flex;
      gap: 0.75rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }
    
    .btn-maps, .btn-whatsapp {
      flex: 1;
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
    }
    
    .btn-maps {
      background: #4285f4;
      color: white;
      border: none;
      
      &:hover { background: #3367d6; }
    }
    
    .btn-whatsapp {
      background: #25d366;
      color: white;
      border: none;
      
      &:hover { background: #128c7e; }
    }
    
    .detail-value {
      font-weight: 500;
      color: var(--text-primary);
      font-size: 0.875rem;
      
      &.large { font-size: 1.125rem; font-weight: 700; }
    }
    
    .territorios-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }
    
    .territorio-tag {
      background: var(--primary-color);
      color: white;
      padding: 0.375rem 0.75rem;
      border-radius: var(--radius-md);
      font-size: 0.75rem;
      font-weight: 500;
    }
    
    /* Modal styles */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }
    
    .modal {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      
      &.modal-lg { max-width: 600px; }
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      position: sticky;
      top: 0;
      background: var(--surface-color);
      
      h2 { margin: 0; font-size: 1.25rem; }
    }
    
    .btn-close { 
      background: none; 
      border: none; 
      font-size: 1.5rem; 
      cursor: pointer; 
      padding: 0; 
      line-height: 1;
      color: var(--text-secondary);
      
      &:hover { color: var(--text-primary); }
    }
    
    .modal-body { padding: 1.5rem; }
    .modal-footer {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-color);
      position: sticky;
      bottom: 0;
      background: var(--surface-color);
      
      .spacer { flex: 1; }
    }
    
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    
    .form-group {
      margin-bottom: 1rem;
      
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        font-size: 0.875rem;
        color: var(--text-primary);
      }
      
      input, select {
        width: 100%;
        padding: 0.625rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        font-size: 0.875rem;
        background: var(--background-color);
        color: var(--text-primary);
        
        &::placeholder {
          color: var(--text-secondary);
        }
        
        &:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
      }
      
      select {
        cursor: pointer;
      }
    }
    
    .section-title {
      font-size: 1rem;
      color: var(--text-primary);
      margin: 1.5rem 0 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .territorios-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      max-height: 200px;
      overflow-y: auto;
      padding: 0.5rem;
      background: var(--background-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
    }

    .territorio-checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      padding: 0.375rem;
      border-radius: var(--radius-sm);
      
      &:hover {
        background: rgba(37, 99, 235, 0.1);
      }
      
      input[type="checkbox"] {
        width: 16px;
        height: 16px;
        cursor: pointer;
      }
      
      span {
        font-size: 0.875rem;
        color: var(--text-primary);
      }
    }

    .no-territorios {
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-style: italic;
      text-align: center;
      padding: 1rem;
    }

    @media (max-width: 768px) {
      .form-row { grid-template-columns: 1fr; }
    }
  `]
})
export class ProgramaPredicacionListComponent implements OnInit {
  programaService = inject(ProgramaPredicacionService);
  grupoService = inject(GrupoService);
  territorioService = inject(TerritorioService);
  authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);
  
  programas = this.programaService.programas;
  grupos = signal<Grupo[]>([]);
  territorios = signal<Territorio[]>([]);
  loading = signal(true);
  
  showModal = signal(false);
  showDetailModal = signal(false);
  viewingPrograma = signal<ProgramaPredicacion | null>(null);
  editingPrograma = signal<ProgramaPredicacion | null>(null);
  
  formData: any = {
    nombre: '',
    fecha: '',
    dia_semana: 0,
    conductor: '',
    hora_inicio: '09:00',
    hora_fin: '11:00',
    lugar_nombre: '',
    lugar_direccion: '',
    lugar_ciudad: '',
    lugar_provincia: '',
    lugar_codigo_postal: '',
    lugar_pais: '',
    lugar_ubicacion: '',
    lugar_contacto: '',
    lugar_telefono: '',
    grupo_id: '',
    territorio_ids: [] as string[]
  };
  
  ngOnInit() {
    this.loadData();
  }
  
  loadData() {
    this.programaService.loadProgramas().subscribe({
      next: () => this.loading.set(false),
      error: () => this.loading.set(false)
    });
    
    this.grupoService.loadGrupos().subscribe({
      next: (res) => this.grupos.set(res.data)
    });
    
    this.territorioService.loadTerritorios().subscribe({
      next: (res) => this.territorios.set(res.data)
    });
  }
  
  getFechasUnicas(): string[] {
    const fechas = new Set(this.programas().map(p => p.fecha));
    return Array.from(fechas).sort().reverse();
  }
  
  getProgramasByFecha(fecha: string): ProgramaPredicacion[] {
    return this.programas()
      .filter(p => p.fecha === fecha)
      .sort((a, b) => a.dia_semana - b.dia_semana);
  }
  
  getAllTerritorios(): Territorio[] {
    return this.territorios();
  }
  
  isTerritorioSelected(id: string): boolean {
    return this.formData.territorio_ids.includes(id);
  }
  
  toggleTerritorio(id: string) {
    const current = this.formData.territorio_ids;
    if (current.includes(id)) {
      this.formData.territorio_ids = current.filter((tid: string) => tid !== id);
    } else {
      this.formData.territorio_ids = [...current, id];
    }
  }
  
  onGrupoChange() {
    // Keep selected territories, just filter display
  }
  
  onFechaChange() {
    const fecha = new Date(this.formData.fecha);
    const diaSemana = fecha.getDay();
    // Convert from JS day (0=Sun, 1=Mon...) to our format (0=Mon, 6=Sun)
    // JS: Mon=1, Tue=2, Wed=3, Thu=4, Fri=5, Sat=6, Sun=0
    const mapping: {[key: number]: number} = {
      1: 0, // Lunes
      2: 1, // Martes
      3: 2, // Miércoles
      4: 3, // Jueves
      5: 4, // Viernes
      6: 5, // Sábado
      0: 6  // Domingo
    };
    if (mapping[diaSemana] !== undefined) {
      this.formData.dia_semana = mapping[diaSemana];
    }
  }
  
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }
  
  getGoogleMapsUrl(direccion: string): string {
    if (!direccion) return '';
    const encoded = encodeURIComponent(direccion);
    return `https://www.google.com/maps/search/?api=1&query=${encoded}`;
  }
  
  getGoogleMapsEmbedUrl(prog: ProgramaPredicacion): SafeResourceUrl {
    // Priority: lugar_ubicacion (exact URL or coords) > full address
    const ubicacion = (prog as any).lugar_ubicacion;
    
    if (ubicacion) {
      // Check if it's coordinates like "-0.218386, -78.506913"
      if (ubicacion.includes(',') && /^-?[\d.-]+,\s*-?[\d.-]+$/.test(ubicacion.trim())) {
        const url = `https://www.google.com/maps?q=${encodeURIComponent(ubicacion)}&output=embed&z=15`;
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
      }
      // Check if it's a Google Maps short URL
      if (ubicacion.includes('goo.gl') || ubicacion.includes('maps.google') || ubicacion.includes('goo.')) {
        const url = `https://www.google.com/maps?q=${encodeURIComponent(ubicacion)}&output=embed&z=15`;
        return this.sanitizer.bypassSecurityTrustResourceUrl(url);
      }
      // Otherwise treat as full address
      const encoded = encodeURIComponent(ubicacion);
      const url = `https://www.google.com/maps?q=${encoded}&output=embed&z=15`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
    
    // Fallback to address fields
    if (!prog?.lugar_direccion) return '' as SafeResourceUrl;
    
    const parts: string[] = [];
    if (prog.lugar_direccion) parts.push(prog.lugar_direccion);
    if ((prog as any).lugar_ciudad) parts.push((prog as any).lugar_ciudad);
    if ((prog as any).lugar_provincia) parts.push((prog as any).lugar_provincia);
    if ((prog as any).lugar_codigo_postal) parts.push((prog as any).lugar_codigo_postal);
    if ((prog as any).lugar_pais) parts.push((prog as any).lugar_pais);
    
    const fullAddress = parts.length > 0 ? parts.join(', ') : prog.lugar_direccion;
    const encoded = encodeURIComponent(fullAddress);
    
    const url = `https://www.google.com/maps?q=${encoded}&output=embed&z=15`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
  
  shareByWhatsApp(prog: ProgramaPredicacion) {
    const dia = prog.dia_semana_nombre || '';
    const hora = prog.hora_inicio || 'Por confirmar';
    const lugar = prog.lugar_nombre || '';
    const direccion = prog.lugar_direccion || '';
    const contacto = prog.lugar_contacto || '';
    const telefono = prog.lugar_telefono || '';
    
    let mensaje = `📅 *${dia}* - Programa de Predicación\n\n`;
    mensaje += `⏰ Hora: ${hora}\n`;
    mensaje += `📍 Lugar: ${lugar}\n`;
    if (direccion) mensaje += `🏠 Dirección: ${direccion}\n`;
    if (contacto) mensaje += `👤 Contacto: ${contacto}\n`;
    if (telefono) mensaje += `📞 Teléfono: ${telefono}\n`;
    
    const mapsUrl = this.getGoogleMapsUrl(direccion);
    if (mapsUrl) mensaje += `\n📍 Ubicación: ${mapsUrl}`;
    
    const encoded = encodeURIComponent(mensaje);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  }
  
  openCreateModal() {
    this.editingPrograma.set(null);
    this.formData = {
      nombre: '',
      fecha: '',
      dia_semana: 0,
      conductor: '',
      hora_inicio: '',
      lugar_nombre: 'Salón del Reino',
      lugar_direccion: '',
      lugar_contacto: '',
      lugar_telefono: '',
      grupo_id: '',
      territorio_ids: []
    };
    this.showModal.set(true);
  }
  
  viewPrograma(prog: ProgramaPredicacion) {
    const territorios = prog.territorios || [];
    this.viewingPrograma.set({
      ...prog,
      territorios: territorios
    });
    this.showDetailModal.set(true);
  }
  
  closeDetailModal() {
    this.showDetailModal.set(false);
    this.viewingPrograma.set(null);
  }
  
  editPrograma(prog: ProgramaPredicacion) {
    if (!this.authService.isSuperintendente() && !this.authService.isSuperAdmin()) return;
    
    this.editingPrograma.set(prog);
    // Normalize territorios to always be an array (backend might send null)
    const territorios = prog.territorios || [];
    this.formData = {
      nombre: prog.nombre,
      fecha: prog.fecha,
      dia_semana: prog.dia_semana,
      conductor: prog.conductor,
      hora_inicio: prog.hora_inicio,
      lugar_nombre: prog.lugar_nombre,
      lugar_direccion: prog.lugar_direccion,
      lugar_contacto: prog.lugar_contacto,
      lugar_telefono: prog.lugar_telefono,
      grupo_id: prog.grupo?.id || '',
      territorio_ids: territorios.map(t => t.id)
    };
    this.showModal.set(true);
  }
  
  closeModal() {
    this.showModal.set(false);
    this.editingPrograma.set(null);
  }
  
  savePrograma() {
    const data: any = {
      nombre: this.formData.nombre || `Programa ${this.formData.fecha}`,
      fecha: this.formData.fecha,
      dia_semana: this.formData.dia_semana,
      conductor: this.formData.conductor,
      hora_inicio: this.formData.hora_inicio,
      lugar_nombre: this.formData.lugar_nombre,
      lugar_direccion: this.formData.lugar_direccion,
      lugar_ciudad: this.formData.lugar_ciudad,
      lugar_provincia: this.formData.lugar_provincia,
      lugar_codigo_postal: this.formData.lugar_codigo_postal,
      lugar_pais: this.formData.lugar_pais,
      lugar_ubicacion: this.formData.lugar_ubicacion,
      lugar_contacto: this.formData.lugar_contacto,
      lugar_telefono: this.formData.lugar_telefono,
    };
    
    if (this.formData.grupo_id) {
      data.grupo_id = this.formData.grupo_id;
    }
    if (this.formData.territorio_ids && this.formData.territorio_ids.length > 0) {
      data.territorio_ids = this.formData.territorio_ids;
    }
    
    const editing = this.editingPrograma();
    
    if (editing) {
      this.programaService.updatePrograma(editing.id, data).subscribe({
        next: () => {
          this.loadData();
          this.closeModal();
        }
      });
    } else {
      this.programaService.createPrograma(data).subscribe({
        next: () => {
          this.loadData();
          this.closeModal();
        }
      });
    }
  }
  
  deletePrograma() {
    const prog = this.editingPrograma();
    if (!prog) return;
    
    if (confirm('¿Eliminar este programa de prédicación?')) {
      this.programaService.deletePrograma(prog.id).subscribe({
        next: () => {
          this.loadData();
          this.closeModal();
        }
      });
    }
  }
}