import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GrupoService, GrupoDetail, Territorio } from '../../core/services/grupo.service';
import { TerritorioService } from '../../core/services/territorio.service';
import { AuthService } from '../../core/services/auth.service';

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
  `]
})
export class GrupoDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  grupoService = inject(GrupoService);
  territorioService = inject(TerritorioService);
  authService = inject(AuthService);
  
  grupo = signal<GrupoDetail | null>(null);
  loading = signal(true);
  
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
