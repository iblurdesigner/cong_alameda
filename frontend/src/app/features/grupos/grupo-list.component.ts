import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GrupoService, Grupo } from '../../core/services/grupo.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-grupo-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="header-content">
          <h1>Grupos de Predicación</h1>
          <p>5 grupos de predicación con territorios PDF</p>
        </div>
        @if (authService.isSuperintendente()) {
          <button class="btn btn-primary" (click)="showModal = true">
            ➕ Nuevo Grupo
          </button>
        }
      </header>
      
      @if (grupoService.loading()) {
        <div class="loading">Cargando...</div>
      } @else if (grupoService.grupos().length === 0) {
        <div class="empty-state">
          <p>No hay grupos registrados</p>
          @if (authService.isSuperintendente()) {
            <button class="btn btn-primary" (click)="showModal = true">Crear primer grupo</button>
          }
        </div>
      } @else {
        <div class="grupos-grid">
          @for (grupo of grupoService.grupos(); track grupo.id) {
            <div class="grupo-card" [class.inactive]="!grupo.activo">
              <div class="grupo-header">
                <span class="grupo-numero">#{{ grupo.numero }}</span>
                @if (!grupo.activo) {
                  <span class="badge badge-secondary">Inactivo</span>
                }
              </div>
              <h3>{{ grupo.nombre }}</h3>
              @if (grupo.descripcion) {
                <p class="descripcion">{{ grupo.descripcion }}</p>
              }
              <div class="grupo-stats">
                <span class="stat">
                  📁 {{ grupo.territorio_count || 0 }} territorios
                </span>
              </div>
              <div class="grupo-actions">
                <a [routerLink]="['/grupos', grupo.id]" class="btn btn-outline btn-sm">
                  Ver Detalle
                </a>
                @if (authService.isSuperintendente()) {
                  <button 
                    class="btn btn-icon btn-sm" 
                    (click)="editGrupo(grupo)"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button 
                    class="btn btn-icon btn-sm btn-danger" 
                    (click)="confirmDelete(grupo)"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Create/Edit Modal -->
    @if (showModal) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingGrupo ? 'Editar Grupo' : 'Nuevo Grupo' }}</h2>
            <button class="btn-close" (click)="closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="nombre">Nombre *</label>
              <input 
                type="text" 
                id="nombre" 
                [(ngModel)]="formData.nombre" 
                placeholder="Ej: Grupo Centro"
                required
              />
            </div>
            <div class="form-group">
              <label for="numero">Número *</label>
              <input 
                type="number" 
                id="numero" 
                [(ngModel)]="formData.numero" 
                min="1"
                max="99"
                required
              />
            </div>
            <div class="form-group">
              <label for="descripcion">Descripción</label>
              <textarea 
                id="descripcion" 
                [(ngModel)]="formData.descripcion" 
                rows="3"
                placeholder="Descripción opcional del grupo"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeModal()">Cancelar</button>
            <button 
              class="btn btn-primary" 
              (click)="saveGrupo()"
              [disabled]="!formData.nombre || !formData.numero"
            >
              {{ editingGrupo ? 'Actualizar' : 'Crear' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Delete Confirmation Modal -->
    @if (showDeleteModal) {
      <div class="modal-overlay" (click)="showDeleteModal = false">
        <div class="modal modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Confirmar Eliminación</h2>
          </div>
          <div class="modal-body">
            <p>¿Estás seguro de eliminar el grupo "{{ deletingGrupo?.nombre }}"?</p>
            <p class="text-muted">Esta acción realiza un borrado suave (inactiva el grupo).</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="showDeleteModal = false">Cancelar</button>
            <button class="btn btn-danger" (click)="deleteGrupo()">Eliminar</button>
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
      }
      
      p {
        color: var(--text-secondary);
        margin-top: 0.25rem;
      }
    }
    
    .loading, .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--text-secondary);
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    
    .grupos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    
    .grupo-card {
      background: white;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
      
      &.inactive {
        opacity: 0.6;
        background: var(--background-color);
      }
      
      h3 {
        margin: 0.5rem 0;
        font-size: 1.25rem;
      }
      
      .descripcion {
        color: var(--text-secondary);
        font-size: 0.875rem;
        margin-bottom: 1rem;
      }
    }
    
    .grupo-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .grupo-numero {
      background: var(--primary-color);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-full);
      font-weight: 600;
      font-size: 0.875rem;
    }
    
    .grupo-stats {
      margin: 1rem 0;
      
      .stat {
        color: var(--text-secondary);
        font-size: 0.875rem;
      }
    }
    
    .grupo-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
    }
    
    .btn-icon {
      padding: 0.375rem 0.5rem;
      background: transparent;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      cursor: pointer;
      
      &:hover {
        background: var(--background-color);
      }
      
      &.btn-danger:hover {
        background: #fee2e2;
        border-color: #dc2626;
      }
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
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
      
      &.modal-sm {
        max-width: 400px;
      }
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      
      h2 {
        margin: 0;
        font-size: 1.25rem;
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
      
      input, textarea, select {
        width: 100%;
        padding: 0.625rem 0.875rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        
        &:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
      }
    }
    
    .text-muted {
      color: var(--text-secondary);
      font-size: 0.875rem;
    }
  `]
})
export class GrupoListComponent implements OnInit {
  grupoService = inject(GrupoService);
  authService = inject(AuthService);
  
  showModal = false;
  showDeleteModal = false;
  editingGrupo: Grupo | null = null;
  deletingGrupo: Grupo | null = null;
  
  formData = {
    nombre: '',
    numero: 1,
    descripcion: ''
  };
  
  ngOnInit() {
    this.loadGrupos();
  }
  
  loadGrupos() {
    this.grupoService.loadGrupos().subscribe();
  }
  
  editGrupo(grupo: Grupo) {
    this.editingGrupo = grupo;
    this.formData = {
      nombre: grupo.nombre,
      numero: grupo.numero,
      descripcion: grupo.descripcion || ''
    };
    this.showModal = true;
  }
  
  confirmDelete(grupo: Grupo) {
    this.deletingGrupo = grupo;
    this.showDeleteModal = true;
  }
  
  closeModal() {
    this.showModal = false;
    this.editingGrupo = null;
    this.formData = { nombre: '', numero: 1, descripcion: '' };
  }
  
  saveGrupo() {
    if (this.editingGrupo) {
      this.grupoService.updateGrupo(this.editingGrupo.id, this.formData).subscribe({
        next: () => {
          this.loadGrupos();
          this.closeModal();
        }
      });
    } else {
      this.grupoService.createGrupo(this.formData).subscribe({
        next: () => {
          this.loadGrupos();
          this.closeModal();
        }
      });
    }
  }
  
  deleteGrupo() {
    if (this.deletingGrupo) {
      this.grupoService.deleteGrupo(this.deletingGrupo.id).subscribe({
        next: () => {
          this.loadGrupos();
          this.showDeleteModal = false;
          this.deletingGrupo = null;
        }
      });
    }
  }
}
