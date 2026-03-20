import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TerritorioService, Territorio } from '../../core/services/territorio.service';
import { GrupoService, Grupo } from '../../core/services/grupo.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-territorio-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="header-content">
          <h1>Territorios</h1>
          <p>Archivos PDF de los territorios de predicación</p>
        </div>
        @if (authService.isSuperintendente()) {
          <button class="btn btn-primary" (click)="showUploadModal = true">
            ➕ Subir Territorio
          </button>
        }
      </header>
      
      <div class="filters-bar">
        <div class="filter-group">
          <select [(ngModel)]="selectedGrupoId" (ngModelChange)="loadTerritorios()">
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
          <p>No hay territorios registrados</p>
          @if (authService.isSuperintendente()) {
            <button class="btn btn-primary" (click)="showUploadModal = true">
              Subir Primer Territorio
            </button>
          }
        </div>
      } @else {
        <div class="territorios-list">
          @for (territorio of territorioService.territorios(); track territorio.id) {
            <div class="territorio-item">
              <div class="territorio-icon">📄</div>
              <div class="territorio-info">
                <h4>{{ territorio.nombre }}</h4>
                <p class="meta">
                  {{ territorio.nombre_original }} • {{ formatSize(territorio.tamano) }}
                </p>
                <p class="meta">
                  Subido: {{ formatDate(territorio.created_at) }}
                </p>
              </div>
              <div class="territorio-actions">
                <button 
                  class="btn btn-primary btn-sm"
                  (click)="downloadTerritorio(territorio)"
                >
                  ⬇️ Descargar
                </button>
                @if (authService.isSuperintendente()) {
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
    .page-container {
      max-width: 1000px;
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
    
    .filters-bar {
      margin-bottom: 1.5rem;
      
      select {
        padding: 0.625rem 0.875rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        background: white;
        min-width: 250px;
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
    
    .territorios-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .territorio-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: white;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem 1.5rem;
    }
    
    .territorio-icon {
      font-size: 2rem;
    }
    
    .territorio-info {
      flex: 1;
      
      h4 {
        margin: 0;
        font-size: 1rem;
      }
      
      .meta {
        color: var(--text-secondary);
        font-size: 0.75rem;
        margin: 0.25rem 0 0 0;
      }
    }
    
    .territorio-actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .btn-icon {
      padding: 0.375rem 0.5rem;
      background: transparent;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      cursor: pointer;
      
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
      
      input, select, textarea {
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
      .dropzone-icon {
        font-size: 2rem;
        display: block;
        margin-bottom: 0.5rem;
      }
      
      p {
        margin: 0;
        color: var(--text-primary);
      }
      
      .dropzone-hint {
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin-top: 0.25rem;
        display: block;
      }
    }
    
    .file-selected {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      
      .file-size {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
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
      error: (err) => {
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
