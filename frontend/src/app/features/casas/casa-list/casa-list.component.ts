import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CasaService } from '../../../core/services/casa.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-casa-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-container">
      <!-- Modal de Confirmaci├│n -->
      @if (confirmDelete()) {
        <div class="modal-overlay" (click)="cancelDelete()">
          <div class="modal-box" (click)="$event.stopPropagation()">
            <div class="modal-icon modal-icon-danger">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
              </svg>
            </div>
            <h3 class="modal-title">Eliminar Casa</h3>
            <p class="modal-message">┬┐Est├í seguro de eliminar esta casa? Esta acci├│n no se puede deshacer.</p>
            <div class="modal-actions">
              <button class="btn btn-secondary" (click)="cancelDelete()">Cancelar</button>
              <button class="btn btn-danger" (click)="confirmDeleteAction()">Eliminar</button>
            </div>
          </div>
        </div>
      }

      <header class="page-header">
        <div class="header-content">
          <h1>Casas</h1>
          <p class="header-subtitle">Gesti├│n de casas con motivo "no visitar"</p>
        </div>
        @if (authService.isSuperintendente() || authService.isSuperAdmin()) {
          <a routerLink="/casas/new" class="btn btn-primary btn-mobile-full">
            <span class="btn-icon-only">Γ₧ò</span>
            <span class="btn-text">Nueva Casa</span>
          </a>
        }
      </header>
      
      <div class="filters-bar">
        <div class="search-box">
          <span class="search-icon">≡ƒöì</span>
          <input 
            type="text" 
            placeholder="Buscar direcci├│n..." 
            [(ngModel)]="searchTerm"
            (ngModelChange)="onSearch()"
          />
        </div>
        
        <div class="filter-group">
          <select [(ngModel)]="estadoFilter" (ngModelChange)="loadCasas()">
            <option value="">Todos los estados</option>
            <option value="NO_VISITAR">No Visitar</option>
            <option value="EN_ESPERA_VISITA">En Espera</option>
            <option value="RECONTACTADA">Recontactada</option>
            <option value="ACTIVA">Activa</option>
          </select>
          
          <select [(ngModel)]="sectorFilter" (ngModelChange)="loadCasas()">
            <option value="">Todos los sectores</option>
            @for (sector of sectores(); track sector) {
              <option [value]="sector">{{ sector }}</option>
            }
          </select>
        </div>
      </div>
      
      @if (casaService.loading()) {
        <div class="loading">Cargando...</div>
      } @else if (casaService.casas().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">≡ƒÅá</div>
          <p>No hay casas registradas</p>
          @if (authService.isSuperintendente() || authService.isSuperAdmin()) {
            <a routerLink="/casas/new" class="btn btn-primary">Registrar primera casa</a>
          }
        </div>
      } @else {
        <!-- Vista Mobile: Cards -->
        <div class="cards-grid">
          @for (casa of casaService.casas(); track casa.id) {
            <div class="casa-card" [routerLink]="['/casas', casa.id]">
              <div class="card-header">
                <span class="badge" [ngClass]="getEstadoClass(casa.estado)">
                  {{ getEstadoLabel(casa.estado) }}
                </span>
                <span class="card-sector">{{ casa.sector }}</span>
              </div>
              <div class="card-body">
                <h3 class="card-address">
                  <span class="street">{{ casa.calle_principal }} {{ casa.numeracion }}</span>
                </h3>
                @if (casa.calle_secundaria) {
                  <p class="card-secondary">Entre {{ casa.calle_secundaria }}</p>
                }
                @if (casa.referencia) {
                  <p class="card-ref">{{ casa.referencia }}</p>
                }
              </div>
              <div class="card-footer">
                <span class="card-date">≡ƒôà {{ formatDate(casa.fecha_registro) }}</span>
                <span class="card-action">Ver ΓåÆ</span>
              </div>
            </div>
          }
        </div>

        <!-- Vista Desktop: Tabla -->
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Direcci├│n</th>
                <th>Sector</th>
                <th>Estado</th>
                <th>Fecha Registro</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (casa of casaService.casas(); track casa.id) {
                <tr>
                  <td>
                    <div class="address-cell">
                      <span class="address">{{ casa.calle_principal }} {{ casa.numeracion }}</span>
                      @if (casa.calle_secundaria) {
                        <span class="secondary">Entre {{ casa.calle_secundaria }}</span>
                      }
                    </div>
                  </td>
                  <td>{{ casa.sector }}</td>
                  <td>
                    <span class="badge" [ngClass]="getEstadoClass(casa.estado)">
                      {{ getEstadoLabel(casa.estado) }}
                    </span>
                  </td>
                  <td>{{ formatDate(casa.fecha_registro) }}</td>
                  <td style="display: flex; gap: 0.5rem;">
                    <a [routerLink]="['/casas', casa.id]" class="btn-icon">≡ƒæü∩╕Å</a>
                    @if (authService.isSuperintendente() || authService.isSuperAdmin()) {
                      <button (click)="deleteCasa(casa.id)" class="btn-icon btn-danger" title="Eliminar">≡ƒùæ∩╕Å</button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        
        <div class="pagination">
          <span>Total: {{ casaService.total() }} casas</span>
          <div class="page-buttons">
            <button 
              class="btn btn-outline btn-sm"
              [disabled]="casaService.currentPage() === 1"
              (click)="goToPage(casaService.currentPage() - 1)"
            >
              Anterior
            </button>
            <span class="page-info">P├ígina {{ casaService.currentPage() }}</span>
            <button 
              class="btn btn-outline btn-sm"
              [disabled]="casaService.casas().length < 20"
              (click)="goToPage(casaService.currentPage() + 1)"
            >
              Siguiente
            </button>
          </div>
        </div>
      }
    </div>
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
      gap: 1rem;
      margin-bottom: 1.5rem;
      
      h1 {
        font-size: 1.75rem;
        font-weight: 700;
      }
      
      .header-subtitle {
        color: var(--text-secondary);
        margin-top: 0.25rem;
      }

      .btn-mobile-full {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        white-space: nowrap;
        
        .btn-icon-only { display: none; }
      }
    }
    
    .filters-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      
      .search-box {
        flex: 1;
        min-width: 200px;
        position: relative;
        
        .search-icon {
          position: absolute;
          left: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          font-size: 0.875rem;
          opacity: 0.5;
        }
        
        input {
          width: 100%;
          padding: 0.625rem 0.875rem 0.625rem 2.5rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          font-size: 1rem;
          min-height: 44px;
        }
      }
      
      .filter-group {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        
        select {
          padding: 0.625rem 2rem 0.625rem 0.875rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background: var(--surface-color);
          color: var(--text-primary);
          font-size: 0.875rem;
          min-height: 44px;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b7280' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
        }
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
      
      .empty-icon { font-size: 3rem; opacity: 0.5; }
    }
    
    /* Cards Grid - Mobile First */
    .cards-grid { display: none; }

    .casa-card {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      padding: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      
      &:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        transform: translateY(-2px);
      }
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.75rem;
        
        .badge { font-size: 0.75rem; padding: 0.25rem 0.625rem; }
        .card-sector { font-size: 0.75rem; color: var(--text-secondary); font-weight: 500; }
      }
      
      .card-body {
        margin-bottom: 0.75rem;
        
        .card-address { font-size: 1rem; font-weight: 600; margin: 0 0 0.25rem; }
        .card-secondary { font-size: 0.875rem; color: var(--text-secondary); margin: 0; }
        .card-ref { font-size: 0.75rem; color: var(--text-secondary); margin: 0.5rem 0 0; font-style: italic; }
      }
      
      .card-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 0.75rem;
        border-top: 1px solid var(--border-color);
        
        .card-date { font-size: 0.75rem; color: var(--text-secondary); }
        .card-action { font-size: 0.875rem; font-weight: 600; color: var(--primary-color); }
      }
    }

    .data-table-container { display: block; }
    
    .address-cell {
      display: flex;
      flex-direction: column;
      .address { font-weight: 500; }
      .secondary { font-size: 0.75rem; color: var(--text-secondary); }
    }
    
    .btn-icon {
      padding: 0.5rem;
      background: transparent;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      cursor: pointer;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 36px;
      min-height: 36px;
      &:hover { background: var(--background-color); }
    }
    
    .btn-danger {
      background: transparent;
      border: 1px solid var(--danger-color);
      color: var(--danger-color);
      &:hover { background: var(--danger-color); color: white; }
    }
    
    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      animation: fadeIn 0.2s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes scaleIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    
    .modal-box {
      background: white;
      border-radius: 16px;
      padding: 2rem;
      text-align: center;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      animation: scaleIn 0.2s ease;
    }
    
    .modal-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      
      &.modal-icon-danger {
        background: #fee2e2;
        color: #dc2626;
      }
      
      &.modal-icon-success {
        background: #dcfce7;
        color: #16a34a;
      }
    }
    
    .modal-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      color: #1f2937;
    }
    
    .modal-message {
      color: #6b7280;
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }
    
    .modal-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
    }
    
    .btn {
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.9375rem;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }
    
    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      &:hover { background: #e5e7eb; }
    }
    
    .btn-danger-solid {
      background: #dc2626;
      color: white;
      &:hover { background: #b91c1c; }
    }
    
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
      flex-wrap: wrap;
      gap: 1rem;
      
      .page-buttons { display: flex; align-items: center; gap: 0.5rem; }
      .page-info { font-size: 0.875rem; color: var(--text-secondary); }
      .btn-sm { padding: 0.5rem 1rem; font-size: 0.875rem; min-height: 40px; }
    }

    /* Mobile (< 768px) */
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
      
      .filters-bar {
        .search-box { min-width: 100%; }
        .filter-group {
          width: 100%;
          select { flex: 1; min-width: calc(50% - 0.25rem); }
        }
      }
      
      .cards-grid { display: grid; }
      .data-table-container { display: none; }
      
      .pagination {
        flex-direction: column;
        align-items: stretch;
        text-align: center;
        .page-buttons { justify-content: center; flex-wrap: wrap; }
      }
    }

    /* Tablet (768px - 1024px) */
    @media (min-width: 769px) and (max-width: 1024px) {
      .cards-grid { display: grid; grid-template-columns: repeat(2, 1fr); }
      .data-table-container { display: none; }
    }

    /* Desktop (> 1024px) */
    @media (min-width: 1025px) {
      .cards-grid { display: none; }
      .data-table-container { display: block; }
    }
  `]
})
export class CasaListComponent implements OnInit {
  casaService = inject(CasaService);
  authService = inject(AuthService);
  
  searchTerm = '';
  estadoFilter = '';
  sectorFilter = '';
  sectores = signal<string[]>([]);
  confirmDelete = signal<string | null>(null);
  
  private searchTimeout: ReturnType<typeof setTimeout> | undefined;
  
  ngOnInit() {
    this.loadCasas();
    this.loadSectores();
  }
  
  loadCasas(page = 1) {
    this.casaService.loadCasas({
      search: this.searchTerm,
      estado: this.estadoFilter,
      sector: this.sectorFilter,
      page: page
    }).subscribe();
  }
  
  loadSectores() {
    this.casaService.getSectores().subscribe({
      next: (res) => this.sectores.set(res.data || [])
    });
  }
  
  onSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadCasas();
    }, 300);
  }
  
  goToPage(page: number) {
    this.loadCasas(page);
  }
  
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES');
  }
  
  getEstadoClass(estado: string): string {
    const classes: Record<string, string> = {
      'NO_VISITAR': 'badge-danger',
      'EN_ESPERA_VISITA': 'badge-warning',
      'RECONTACTADA': 'badge-primary',
      'ACTIVA': 'badge-success'
    };
    return classes[estado] || 'badge-primary';
  }
  
  getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = {
      'NO_VISITAR': 'No Visitar',
      'EN_ESPERA_VISITA': 'En Espera',
      'RECONTACTADA': 'Recontactada',
      'ACTIVA': 'Activa'
    };
    return labels[estado] || estado;
  }

  deleteCasa(id: string) {
    this.confirmDelete.set(id);
  }
  
  cancelDelete() {
    this.confirmDelete.set(null);
  }
  
  confirmDeleteAction() {
    const id = this.confirmDelete();
    if (!id) return;
    
    // Quitar inmediatamente de la lista (optimistic update)
    const currentCasas = this.casaService.casas();
    this.casaService.casasSignal.set(currentCasas.filter(c => c.id !== id));
    this.casaService.totalSignal.set(this.casaService.total() - 1);
    
    // Cerrar modal
    this.confirmDelete.set(null);
    
    // Enviar delete al backend (silencioso)
    this.casaService.deleteCasa(id).subscribe({
      error: () => {
        // Si falla, recargar todo
        this.loadCasas();
      }
    });
  }
}
