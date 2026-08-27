import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TerritorioService, Territorio } from '../../core/services/territorio.service';
import { GrupoService, Grupo } from '../../core/services/grupo.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-territorio-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="header-content">
          <h1>Territorios</h1>
          <p class="header-subtitle">Archivos PDF de los territorios de predicación</p>
        </div>
        @if (authService.isSuperintendente() || authService.isSuperAdmin()) {
          <button class="btn btn-primary btn-mobile-full" (click)="showUploadModal = true">
            <span class="btn-icon-only">➕</span>
            <span class="btn-text">Subir Territorio</span>
          </button>
        }
      </header>
      
      <div class="filters-bar">
        <div class="filter-group">
          <select [(ngModel)]="selectedGrupoId" (ngModelChange)="loadTerritorios()" class="filter-select">
            <option value="">Todos los grupos</option>
            @for (grupo of grupos(); track grupo.id) {
              <option [value]="grupo.id">Grupo #{{ grupo.numero }} - {{ grupo.nombre }}</option>
            }
          </select>
        </div>
      </div>
      
      @if (territorioService.loading()) {
        <div class="loading">Cargando...</div>
      } @else if (territorioService.territorios().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">📁</div>
          <p>No hay territorios registrados</p>
          @if (authService.isSuperintendente() || authService.isSuperAdmin()) {
            <button class="btn btn-primary" (click)="showUploadModal = true">
              Subir Primer Territorio
            </button>
          }
        </div>
      } @else {
        <div class="territorios-grid">
          @for (territorio of territorioService.territorios(); track territorio.id) {
            <div class="territorio-card">
              <div class="territorio-icon">📄</div>
              <div class="territorio-info">
                <h4 class="territorio-nombre">{{ territorio.nombre }}</h4>
                <p class="meta">{{ territorio.nombre_original }} • {{ formatSize(territorio.tamano) }}</p>
                <p class="meta">Subido: {{ formatDate(territorio.created_at) }}</p>
              </div>
              <div class="territorio-actions">
                <button 
                  class="btn btn-primary btn-sm"
                  (click)="downloadTerritorio(territorio)"
                >
                  ⬇️ Descargar
                </button>
                @if (authService.isSuperintendente() || authService.isSuperAdmin()) {
                  <button 
                    class="btn btn-icon btn-sm btn-danger"
                    (click)="deleteTerritorio(territorio)"
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

    <!-- Upload Modal -->
    @if (showUploadModal) {
      <div class="modal-overlay" (click)="closeUploadModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Subir Territorio PDF</h2>
            <button class="btn-close" (click)="closeUploadModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label for="grupo">Grupo *</label>
              <select id="grupo" [(ngModel)]="uploadForm.grupo_id" required>
                <option value="">Seleccionar grupo...</option>
                @for (grupo of grupos(); track grupo.id) {
                  <option [value]="grupo.id">
                    Grupo #{{ grupo.numero }} - {{ grupo.nombre }}
                  </option>
                }
              </select>
            </div>
            <div class="form-group">
              <label for="nombre">Nombre del Territorio *</label>
              <input 
                type="text" 
                id="nombre" 
                [(ngModel)]="uploadForm.nombre" 
                placeholder="Ej: Territorio A1 - Sector Norte"
                required
              />
            </div>
            <div class="form-group">
              <label>Archivo PDF *</label>
              <div 
                class="dropzone"
                [class.active]="isDragging"
                (dragover)="onDragOver($event)"
                (dragleave)="onDragLeave($event)"
                (drop)="onDrop($event)"
                (click)="fileInput.click()"
              >
                <input 
                  #fileInput
                  type="file" 
                  accept=".pdf"
                  (change)="onFileSelected($event)"
                  hidden
                />
                @if (selectedFile) {
                  <div class="file-selected">
                    <span>📄 {{ selectedFile.name }}</span>
                    <span class="file-size">{{ formatSize(selectedFile.size) }}</span>
                  </div>
                } @else {
                  <div class="dropzone-content">
                    <span class="dropzone-icon">📁</span>
                    <p>Arrastra el PDF aquí o haz clic para seleccionar</p>
                    <span class="dropzone-hint">Máximo 10MB, solo PDF</span>
                  </div>
                }
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeUploadModal()">Cancelar</button>
            <button 
              class="btn btn-primary" 
              (click)="uploadTerritorio()"
              [disabled]="!uploadForm.grupo_id || !uploadForm.nombre || !selectedFile || uploading()"
            >
              @if (uploading()) {
                Subiendo...
              } @else {
                Subir
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .page-container { max-width: 1000px; margin: 0 auto; }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.5rem;
      
      h1 { font-size: 1.75rem; font-weight: 700; }
      .header-subtitle { color: var(--text-secondary); margin-top: 0.25rem; }

      .btn-mobile-full {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        white-space: nowrap;
        min-height: 44px;
        .btn-icon-only { display: none; }
      }
    }
    
    .filters-bar { margin-bottom: 1.5rem; }
    
    .filter-group {
      .filter-select {
        padding: 0.625rem 2rem 0.625rem 0.875rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        background: var(--surface-color);
        color: var(--text-primary);
        font-size: 1rem;
        min-height: 44px;
        min-width: 200px;
        width: 100%;
        max-width: 350px;
        cursor: pointer;
        appearance: none;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 0.75rem center;
      }
    }
    
    .loading, .empty-state { text-align: center; padding: 3rem; color: var(--text-secondary); }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; .empty-icon { font-size: 3rem; opacity: 0.5; } }
    
    .territorios-grid { display: grid; gap: 1rem; grid-template-columns: 1fr; }
    
    .territorio-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1rem;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      
      &:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        transform: translateY(-2px);
      }
    }
    
    .territorio-icon { font-size: 2rem; flex-shrink: 0; }
    
    .territorio-info {
      flex: 1;
      min-width: 0;
      
      .territorio-nombre {
        margin: 0;
        font-size: 1rem;
        font-weight: 600;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .meta {
        color: var(--text-secondary);
        font-size: 0.75rem;
        margin: 0.25rem 0 0;
      }
    }
    
    .territorio-actions {
      display: flex;
      gap: 0.5rem;
      flex-shrink: 0;
    }
    
    .btn-icon {
      padding: 0.5rem;
      background: transparent;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      cursor: pointer;
      min-width: 40px;
      min-height: 40px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      
      &.btn-danger:hover { background: #fee2e2; border-color: #dc2626; }
    }

    .btn-sm { min-height: 40px; padding: 0.5rem 1rem; }

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
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }
    
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      
      h2 { margin: 0; font-size: 1.25rem; }
    }
    
    .btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; padding: 0; line-height: 1; }
    .modal-body { padding: 1.5rem; }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid var(--border-color);
      flex-wrap: wrap;
    }
    
    .form-group {
      margin-bottom: 1rem;
      
      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        font-size: 0.875rem;
      }
      
      input, select, textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        font-size: 1rem;
        min-height: 44px;
        
        &:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
      }
    }
    
    .dropzone {
      border: 2px dashed var(--border-color);
      border-radius: var(--radius-md);
      padding: 2rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover, &.active {
        border-color: var(--primary-color);
        background: rgba(37, 99, 235, 0.05);
      }
    }
    
    .dropzone-content {
      .dropzone-icon { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
      p { margin: 0; color: var(--text-primary); }
      .dropzone-hint { font-size: 0.75rem; color: var(--text-secondary); margin-top: 0.25rem; display: block; }
    }
    
    .file-selected {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      .file-size { font-size: 0.75rem; color: var(--text-secondary); }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        h1 { font-size: 1.5rem; }
        .btn-mobile-full {
          width: 100%;
          justify-content: center;
          .btn-icon-only { display: inline; }
          .btn-text { display: none; }
        }
      }
      
      .filters-bar .filter-group .filter-select { max-width: 100%; }
      
      .territorios-grid { gap: 0.75rem; }
      
      .territorio-card {
        flex-direction: column;
        align-items: flex-start;
      }
      
      .territorio-actions { width: 100%; justify-content: flex-start; }
    }

    @media (min-width: 769px) {
      .territorios-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class TerritorioListComponent implements OnInit {
  territorioService = inject(TerritorioService);
  grupoService = inject(GrupoService);
  authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  
  grupos = signal<Grupo[]>([]);
  selectedGrupoId = '';
  showUploadModal = false;
  isDragging = false;
  selectedFile: File | null = null;
  uploading = signal(false);
  
  uploadForm = {
    grupo_id: '',
    nombre: ''
  };
  
  ngOnInit() {
    this.loadGrupos();
    const grupoId = this.route.snapshot.queryParamMap.get('grupo_id');
    if (grupoId) {
      this.selectedGrupoId = grupoId;
    }
    this.loadTerritorios();
  }
  
  loadGrupos() {
    this.grupoService.loadGrupos().subscribe({
      next: (res) => this.grupos.set(res.data)
    });
  }
  
  loadTerritorios() {
    const grupoId = this.selectedGrupoId || undefined;
    this.territorioService.loadTerritorios(grupoId).subscribe();
  }
  
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }
  
  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }
  
  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }
  
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }
  
  handleFile(file: File) {
    if (file.type !== 'application/pdf') {
      alert('Solo se permiten archivos PDF');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo excede el límite de 10MB');
      return;
    }
    this.selectedFile = file;
    if (!this.uploadForm.nombre) {
      this.uploadForm.nombre = file.name.replace('.pdf', '');
    }
  }
  
  closeUploadModal() {
    this.showUploadModal = false;
    this.selectedFile = null;
    this.uploadForm = { grupo_id: '', nombre: '' };
  }
  
  uploadTerritorio() {
    if (!this.selectedFile || !this.uploadForm.grupo_id || !this.uploadForm.nombre) return;
    
    this.uploading.set(true);
    this.territorioService.uploadTerritorio(
      this.uploadForm.grupo_id,
      this.uploadForm.nombre,
      this.selectedFile
    ).subscribe({
      next: () => {
        this.loadTerritorios();
        this.closeUploadModal();
        this.uploading.set(false);
      },
      error: (err: { error?: { error?: string } }) => {
        alert(err.error?.error || 'Error al subir el archivo');
        this.uploading.set(false);
      }
    });
  }
  
  downloadTerritorio(territorio: Territorio) {
    this.territorioService.downloadTerritorio(territorio.id, territorio.nombre_original).subscribe();
  }
  
  deleteTerritorio(territorio: Territorio) {
    if (confirm(`¿Eliminar "${territorio.nombre}"?`)) {
      this.territorioService.deleteTerritorio(territorio.id).subscribe({
        next: () => this.loadTerritorios()
      });
    }
  }
  
  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
  
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES');
  }
}
