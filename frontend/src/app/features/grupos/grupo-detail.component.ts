import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { GrupoService, GrupoDetail, Territorio } from '../../core/services/grupo.service';
import { TerritorioService } from '../../core/services/territorio.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-grupo-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="header-content">
          <a routerLink="/grupos" class="back-link">← Volver a Grupos</a>
          @if (grupo()) {
            <h1>{{ grupo()!.nombre }}</h1>
            <p>Grupo #{{ grupo()!.numero }} • {{ grupo()!.territorios?.length || 0 }} territorios</p>
          }
        </div>
        @if ((authService.isSuperintendente() || authService.isSuperAdmin()) && grupo()) {
          <a [routerLink]="['/territorios']" [queryParams]="{grupo_id: grupo()!.id}" class="btn btn-primary">
            ➕ Agregar Territorio
          </a>
        }
      </header>
      
      @if (loading()) {
        <div class="loading">Cargando...</div>
      } @else if (grupo()) {
        @if (grupo()!.descripcion) {
          <div class="info-card">
            <p>{{ grupo()!.descripcion }}</p>
          </div>
        }
        
        <h2>Territorios</h2>
        @if (!grupo()!.territorios || grupo()!.territorios.length === 0) {
          <div class="empty-state">
            <p>No hay territorios en este grupo</p>
            @if (authService.isSuperintendente() || authService.isSuperAdmin()) {
              <a [routerLink]="['/territorios']" [queryParams]="{grupo_id: grupo()!.id}" class="btn btn-primary">
                Subir Primer Territorio
              </a>
            }
          </div>
        } @else {
          <div class="territorios-grid">
            @for (territorio of grupo()!.territorios; track territorio.id) {
              <div class="territorio-card">
                <div class="territorio-icon">📄</div>
                <div class="territorio-info">
                  <h4>{{ territorio.nombre }}</h4>
                  <p class="file-info">
                    {{ territorio.nombre_original }} • {{ formatSize(territorio.tamano) }}
                  </p>
                  <p class="upload-info">
                    Subido por {{ territorio.subido_por }} el {{ formatDate(territorio.created_at) }}
                  </p>
                </div>
                <div class="territorio-actions">
                  <button 
                    class="btn btn-secondary btn-sm"
                    (click)="openPreview(territorio)"
                    title="Visualizar PDF"
                  >
                    👁️ Ver
                  </button>
                  <button 
                    class="btn btn-primary btn-sm"
                    (click)="downloadTerritorio(territorio)"
                    title="Descargar PDF"
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
      }
    </div>

    <!-- Modal de Previsualización -->
    @if (previewTerritorio()) {
      <div class="modal-overlay" (click)="closePreview()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ previewTerritorio()!.nombre }}</h3>
            <div class="modal-header-actions">
              <a 
                href="javascript:void(0)" 
                (click)="openInNewTab(previewTerritorio()!)" 
                class="btn-open-new"
                title="Abrir en nueva pestaña"
              >
                ↗️ Nueva pestaña
              </a>
              <button class="modal-close" (click)="closePreview()">✕</button>
            </div>
          </div>
          <div class="modal-body">
            @if (previewUrl()) {
              <!-- Usando embed para PDFs -->
              <embed 
                [src]="previewUrl()" 
                type="application/pdf"
                class="pdf-embed"
              />
            } @else {
              <div class="pdf-viewer-placeholder">
                <p>El navegador no puede mostrar el PDF directamente.</p>
                <a 
                  href="javascript:void(0)" 
                  (click)="openInNewTab(previewTerritorio()!)" 
                  class="btn-link"
                >
                  Abrir en nueva pestaña
                </a>
              </div>
            }
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
    
    .info-card {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem 1.5rem;
      margin-bottom: 1.5rem;
      
      p {
        margin: 0;
        color: var(--text-secondary);
      }
    }
    
    h2 {
      font-size: 1.25rem;
      margin-bottom: 1rem;
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
    
    .territorios-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .territorio-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: var(--surface-color);
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
        margin: 0 0 0.25rem 0;
        font-size: 1rem;
      }
      
      .file-info {
        color: var(--primary-color);
        font-weight: 500;
        margin: 0;
      }
      
      .upload-info {
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

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 2rem;
    }

    .modal-content {
      background: var(--surface-color);
      border-radius: var(--radius-lg);
      width: 100%;
      max-width: 900px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-color);

      h3 {
        margin: 0;
        font-size: 1.125rem;
        color: var(--text-primary);
      }
    }

    .modal-header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .btn-open-new {
      font-size: 0.75rem;
      color: var(--primary-color);
      text-decoration: none;
      padding: 0.375rem 0.75rem;
      border: 1px solid var(--primary-color);
      border-radius: var(--radius-sm);
      transition: all 0.2s ease;

      &:hover {
        background: var(--primary-color);
        color: white;
      }
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-secondary);
      padding: 0.25rem;
      line-height: 1;

      &:hover {
        color: var(--text-primary);
      }
    }

    .modal-body {
      flex: 1;
      overflow: hidden;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #525659;

      iframe, object, embed, .pdf-viewer-placeholder {
        width: 100%;
        height: 75vh;
        border: none;
      }

      .pdf-embed {
        display: block;
      }

      .pdf-viewer-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #ccc;
        gap: 1rem;
      }

      .btn-link {
        color: #4fc3f7;
        text-decoration: underline;
        font-size: 0.875rem;
      }
    }
  `]
})
export class GrupoDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private sanitizer = inject(DomSanitizer);
  grupoService = inject(GrupoService);
  territorioService = inject(TerritorioService);
  authService = inject(AuthService);
  
  grupo = signal<GrupoDetail | null>(null);
  loading = signal(true);
  previewTerritorio = signal<Territorio | null>(null);
  previewUrl = signal<SafeResourceUrl>('');
  
  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadGrupo(id);
    }
  }
  
  loadGrupo(id: string) {
    this.grupoService.getGrupo(id).subscribe({
      next: (data) => {
        this.grupo.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
  
  downloadTerritorio(territorio: Territorio) {
    this.territorioService.downloadTerritorio(territorio.id, territorio.nombre_original).subscribe();
  }
  
  openPreview(territorio: Territorio) {
    // Guardar el territorio y preparar URL sanitizada para el modal
    this.previewTerritorio.set(territorio);
    const url = this.getPreviewUrl(territorio.id);
    this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
  }

  getPreviewUrl(id: string): string {
    // Devolver URL absoluta para el backend
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}/public/territorios/${id}/previsualizar`;
  }
  
  openInNewTab(territorio: Territorio) {
    const url = this.getPreviewUrl(territorio.id);
    window.open(url, '_blank');
  }
  
  closePreview() {
    this.previewTerritorio.set(null);
    this.previewUrl.set('' as SafeResourceUrl);
  }
  
  deleteTerritorio(territorio: Territorio) {
    if (confirm(`¿Eliminar "${territorio.nombre}"?`)) {
      this.territorioService.deleteTerritorio(territorio.id).subscribe({
        next: () => {
          const current = this.grupo();
          if (current) {
            this.grupo.set({
              ...current,
              territorios: current.territorios?.filter(t => t.id !== territorio.id) || []
            });
          }
        }
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