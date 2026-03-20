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
          <p>Gestión de casas con motivo "no visitar"</p>
        </div>
        @if (authService.isSuperintendente()) {
          <a routerLink="/casas/new" class="btn btn-primary">
            ➕ Nueva Casa
          </a>
        }
      </header>
      
      <div class="filters-bar">
        <div class="search-box">
          <input 
            type="text" 
            placeholder="Buscar por dirección..." 
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
          <p>No hay casas registradas</p>
          @if (authService.isSuperintendente()) {
            <a routerLink="/casas/new" class="btn btn-primary">Registrar primera casa</a>
          }
        </div>
      } @else {
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
            <span>Página {{ casaService.currentPage() }}</span>
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
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      
      .search-box {
        flex: 1;
        min-width: 250px;
        
        input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
        }
      }
      
      .filter-group {
        display: flex;
        gap: 0.5rem;
        
        select {
          padding: 0.625rem 0.875rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background: white;
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
    }
    
    .address-cell {
      display: flex;
      flex-direction: column;
      
      .address {
        font-weight: 500;
      }
      
      .secondary {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
    }
    
    .btn-icon {
      padding: 0.5rem;
      background: transparent;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      cursor: pointer;
      text-decoration: none;
      
      &:hover {
        background: var(--background-color);
      }
    }
    
    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-color);
      
      .page-buttons {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .btn-sm {
        padding: 0.375rem 0.75rem;
        font-size: 0.75rem;
      }
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
