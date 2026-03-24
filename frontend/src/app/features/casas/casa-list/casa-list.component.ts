import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CasaService, Casa } from '../../../core/services/casa.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-casa-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="header-content">
          <h1>Casas</h1>
          <p class="header-subtitle">Gestión de casas con motivo "no visitar"</p>
        </div>
        @if (authService.isSuperintendente()) {
          <a routerLink="/casas/new" class="btn btn-primary btn-mobile-full">
            <span class="btn-icon-only">➕</span>
            <span class="btn-text">Nueva Casa</span>
          </a>
        }
      </header>
      
      <div class="filters-bar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            placeholder="Buscar dirección..." 
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
          <div class="empty-icon">🏠</div>
          <p>No hay casas registradas</p>
          @if (authService.isSuperintendente()) {
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
                <span class="card-date">📅 {{ formatDate(casa.fecha_registro) }}</span>
                <span class="card-action">Ver →</span>
              </div>
            </div>
          }
        </div>

        <!-- Vista Desktop: Tabla -->
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>Dirección</th>
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
                  <td>
                    <a [routerLink]="['/casas', casa.id]" class="btn-icon">👁️</a>
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
            <span class="page-info">Página {{ casaService.currentPage() }}</span>
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
          background: white;
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
  
  private searchTimeout: any;
  
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
}
