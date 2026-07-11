import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SemanaService, SemanaDetail, Dia } from '../../core/services/semana.service';
import { TerritorioService, Territorio } from '../../core/services/territorio.service';
import { GrupoService, Grupo } from '../../core/services/grupo.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-semana-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="header-content">
          <a routerLink="/semanas" class="back-link">← Volver a Semanas</a>
          @if (semana()) {
            <h1>{{ semana()!.nombre }}</h1>
            <p>{{ formatDate(semana()!.fecha_inicio) }} - {{ formatDate(semana()!.fecha_fin) }}</p>
          }
        </div>
        @if ((authService.isSuperintendente() || authService.isSuperAdmin()) && semana()) {
          <button 
            class="btn btn-outline btn-sm btn-danger"
            (click)="confirmDelete()"
          >
            ≡ƒùæ️ Eliminar Semana
          </button>
        }
      </header>
      
      @if (loading()) {
        <div class="loading">Cargando...</div>
      } @else if (semana()) {
        <div class="dias-container">
          @for (dia of dias(); track dia.id) {
            <div class="dia-card" [class.empty]="!dia.territorio_manana_id && !dia.territorio_tarde_id">
              <div class="dia-header">
                <h3>{{ getDiaSemanaLabel(dia.dia_semana) }}</h3>
                <span class="fecha">{{ formatDateCompleta(getDiaFecha(dia)) }}</span>
              </div>
              
              <div class="dia-content">
                <div class="turno">
                  <label>≡ƒîà Mañana</label>
                  @if (dia.territorio_manana) {
                    <div class="territorio-assigned">
                      <span>{{ dia.territorio_manana.nombre }}</span>
                    </div>
                  } @else {
                    <div class="empty-turno">Sin asignar</div>
                  }
                </div>
                
                <div class="turno">
                  <label>≡ƒîå Tarde</label>
                  @if (dia.territorio_tarde) {
                    <div class="territorio-assigned">
                      <span>{{ dia.territorio_tarde.nombre }}</span>
                    </div>
                  } @else {
                    <div class="empty-turno">Sin asignar</div>
                  }
                </div>
                
                <div class="turno">
                  <label>≡ƒæÑ Grupo</label>
                  @if (dia.grupo_asignado) {
                    <div class="grupo-assigned">
                      <span>#{{ dia.grupo_asignado.numero }} {{ dia.grupo_asignado.nombre }}</span>
                    </div>
                  } @else {
                    <div class="empty-turno">Sin asignar</div>
                  }
                </div>
              </div>
              
              @if (authService.isSuperintendente() || authService.isSuperAdmin()) {
                <div class="dia-actions">
                  <button class="btn btn-outline btn-sm" (click)="editDia(dia)">
                    ✏️ Asignar Territorios
                  </button>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>

    <!-- Edit Dia Modal -->
    @if (showEditModal) {
      <div class="modal-overlay" (click)="closeEditModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Asignar Territorios - {{ editingDia()?.dia_semana !== undefined ? getDiaSemanaLabel(editingDia()!.dia_semana) : '' }}</h2>
            <button class="btn-close" (click)="closeEditModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="territorio_manana">Territorio Mañana</label>
              <select id="territorio_manana" [(ngModel)]="editForm.territorio_manana_id">
                <option value="">Sin asignar</option>
                @for (t of territorios(); track t.id) {
                  <option [value]="t.id">{{ t.nombre }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label for="territorio_tarde">Territorio Tarde</label>
              <select id="territorio_tarde" [(ngModel)]="editForm.territorio_tarde_id">
                <option value="">Sin asignar</option>
                @for (t of territorios(); track t.id) {
                  <option [value]="t.id">{{ t.nombre }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label for="grupo">Grupo Asignado</label>
              <select id="grupo" [(ngModel)]="editForm.grupo_asignado_id">
                <option value="">Sin asignar</option>
                @for (g of grupos(); track g.id) {
                  <option [value]="g.id">#{{ g.numero }} - {{ g.nombre }}</option>
                }
              </select>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeEditModal()">Cancelar</button>
            <button class="btn btn-primary" (click)="saveDia()">Guardar</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
      
      h1 {
        font-size: 1.75rem;
        font-weight: 700;
        margin: 0.5rem 0;
      }
      
      p {
        color: var(--text-secondary);
      }
    }
    
    .back-link {
      color: var(--primary-color);
      text-decoration: none;
      font-size: 0.875rem;
      
      &:hover {
        text-decoration: underline;
      }
    }
    
    .loading {
      text-align: center;
      padding: 3rem;
      color: var(--text-secondary);
    }
    
    .dias-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1rem;
    }
    
    .dia-card {
      background: white;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      overflow: hidden;
      
      &.empty {
        opacity: 0.7;
      }
    }
    
    .dia-header {
      background: var(--background-color);
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-color);
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      h3 {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
      }
      
      .fecha {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
    }
    
    .dia-content {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .turno {
      label {
        display: block;
        font-size: 0.75rem;
        font-weight: 500;
        color: var(--text-secondary);
        margin-bottom: 0.25rem;
      }
      
      .territorio-assigned {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: var(--radius-sm);
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
      }
      
      .grupo-assigned {
        background: #eff6ff;
        border: 1px solid #bfdbfe;
        border-radius: var(--radius-sm);
        padding: 0.5rem 0.75rem;
        font-size: 0.875rem;
      }
      
      .empty-turno {
        color: var(--text-secondary);
        font-size: 0.875rem;
        font-style: italic;
      }
    }
    
    .dia-actions {
      padding: 0.75rem 1rem;
      border-top: 1px solid var(--border-color);
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
    }
    
    .modal {
      background: white;
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
      
      h2 {
        margin: 0;
        font-size: 1.125rem;
      }
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
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-color);
    }
    
    .form-group {
      margin-bottom: 1rem;
      
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
      }
      
      select {
        width: 100%;
        padding: 0.625rem 0.875rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        background: white;
        
        &:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
      }
    }
  `]
})
export class SemanaDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  semanaService = inject(SemanaService);
  territorioService = inject(TerritorioService);
  grupoService = inject(GrupoService);
  authService = inject(AuthService);
  
  semana = signal<SemanaDetail | null>(null);
  dias = signal<Dia[]>([]);
  territorios = signal<Territorio[]>([]);
  grupos = signal<Grupo[]>([]);
  loading = signal(true);
  
  showEditModal = false;
  editingDia = signal<Dia | null>(null);
  editForm = {
    territorio_manana_id: '',
    territorio_tarde_id: '',
    grupo_asignado_id: ''
  };
  
  ngOnInit() {
    this.loadData();
  }
  
  loadData() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    
    this.loadSemana(id);
    this.loadTerritorios();
    this.loadGrupos();
  }
  
  loadSemana(id: string) {
    this.loading.set(true);
    this.semanaService.getSemana(id).subscribe({
      next: (data) => {
        this.semana.set(data);
        this.dias.set(data.dias || []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
  
  loadTerritorios() {
    this.territorioService.loadTerritorios().subscribe({
      next: (res) => this.territorios.set(res.data)
    });
  }
  
  loadGrupos() {
    this.grupoService.loadGrupos().subscribe({
      next: (res) => this.grupos.set(res.data)
    });
  }
  
  getDiaSemanaLabel(diaSemana: number): string {
    const labels = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return labels[diaSemana] || '';
  }
  
  getDiaFecha(dia: Dia): string {
    if (!this.semana()) return '';
    const startDate = new Date(this.semana()!.fecha_inicio);
    const fecha = new Date(startDate);
    fecha.setDate(startDate.getDate() + dia.dia_semana);
    return fecha.toISOString().split('T')[0];
  }
  
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  }
  
  formatDateCompleta(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long'
    });
  }
  
  editDia(dia: Dia) {
    this.editingDia.set(dia);
    this.editForm = {
      territorio_manana_id: dia.territorio_manana_id || '',
      territorio_tarde_id: dia.territorio_tarde_id || '',
      grupo_asignado_id: dia.grupo_asignado_id || ''
    };
    this.showEditModal = true;
  }
  
  closeEditModal() {
    this.showEditModal = false;
    this.editingDia.set(null);
    this.editForm = { territorio_manana_id: '', territorio_tarde_id: '', grupo_asignado_id: '' };
  }
  
  saveDia() {
    const dia = this.editingDia();
    if (!dia) return;
    
    const data: Partial<Dia> = {};
    if (this.editForm.territorio_manana_id) {
      data.territorio_manana_id = this.editForm.territorio_manana_id;
    }
    if (this.editForm.territorio_tarde_id) {
      data.territorio_tarde_id = this.editForm.territorio_tarde_id;
    }
    if (this.editForm.grupo_asignado_id) {
      data.grupo_asignado_id = this.editForm.grupo_asignado_id;
    }
    
    this.semanaService.updateDia(dia.id, data).subscribe({
      next: (updated) => {
        // Update local state
        const currentDias = this.dias();
        const index = currentDias.findIndex(d => d.id === dia.id);
        if (index !== -1) {
          currentDias[index] = {
            ...currentDias[index],
            ...updated
          };
          this.dias.set([...currentDias]);
        }
        this.closeEditModal();
      }
    });
  }
  
  confirmDelete() {
    if (confirm('¿Eliminar esta semana de visita?')) {
      const id = this.semana()?.id;
      if (id) {
        this.semanaService.deleteSemana(id).subscribe({
          next: () => {
            window.location.href = '/semanas';
          }
        });
      }
    }
  }
}
