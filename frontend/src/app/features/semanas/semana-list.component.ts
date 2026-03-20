import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SemanaService, Semana } from '../../core/services/semana.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-semana-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="header-content">
          <h1>Semanas de Visita</h1>
          <p>Programación semanal de territorios por día</p>
        </div>
        @if (authService.isSuperintendente()) {
          <button class="btn btn-primary" (click)="showModal = true">
            ➕ Nueva Semana
          </button>
        }
      </header>
      
      @if (semanaService.loading()) {
        <div class="loading">Cargando...</div>
      } @else if (semanaService.semanas().length === 0) {
        <div class="empty-state">
          <p>No hay semanas de visita registradas</p>
          @if (authService.isSuperintendente()) {
            <button class="btn btn-primary" (click)="showModal = true">
              Crear Primera Semana
            </button>
          }
        </div>
      } @else {
        <div class="semanas-grid">
          @for (semana of semanaService.semanas(); track semana.id) {
            <div class="semana-card">
              <div class="semana-header">
                <h3>{{ semana.nombre }}</h3>
                <span class="fecha-range">
                  {{ formatDate(semana.fecha_inicio) }} - {{ formatDate(semana.fecha_fin) }}
                </span>
              </div>
              <a [routerLink]="['/semanas', semana.id]" class="btn btn-outline btn-sm">
                Ver Detalle →
              </a>
            </div>
          }
        </div>
      }
    </div>

    <!-- Create Modal -->
    @if (showModal) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Nueva Semana de Visita</h2>
            <button class="btn-close" (click)="closeModal()">×</button>
          </div>
          <div class="modal-body">
            <p class="modal-info">
              La semana debe comenzar en Lunes y durar 7 días.
              Al crear la semana se generarán automáticamente los 7 días.
            </p>
            <div class="form-group">
              <label for="nombre">Nombre de la Semana *</label>
              <input 
                type="text" 
                id="nombre" 
                [(ngModel)]="formData.nombre" 
                placeholder="Ej: Semana 1 - Marzo 2026"
                required
              />
            </div>
            <div class="form-group">
              <label for="fecha_inicio">Fecha de Inicio (Lunes) *</label>
              <input 
                type="date" 
                id="fecha_inicio" 
                [(ngModel)]="formData.fecha_inicio" 
                required
              />
              @if (formData.fecha_inicio) {
                <small class="date-hint" [class.invalid]="!isValidMonday()">
                  @if (isValidMonday()) {
                    ✓ Válido: {{ getDayName(formData.fecha_inicio) }}
                  } @else {
                    ✗ La fecha debe ser un Lunes
                  }
                </small>
              }
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" (click)="closeModal()">Cancelar</button>
            <button 
              class="btn btn-primary" 
              (click)="createSemana()"
              [disabled]="!formData.nombre || !formData.fecha_inicio || !isValidMonday()"
            >
              Crear Semana
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
    
    .semanas-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }
    
    .semana-card {
      background: white;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .semana-header {
      h3 {
        margin: 0;
        font-size: 1.125rem;
      }
      
      .fecha-range {
        color: var(--text-secondary);
        font-size: 0.875rem;
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
    
    .modal-info {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: var(--radius-sm);
      padding: 0.75rem;
      font-size: 0.875rem;
      color: #0369a1;
      margin-bottom: 1rem;
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
      
      input {
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
    
    .date-hint {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.75rem;
      
      &.invalid {
        color: #dc2626;
      }
    }
  `]
})
export class SemanaListComponent implements OnInit {
  semanaService = inject(SemanaService);
  authService = inject(AuthService);
  
  showModal = false;
  formData = {
    nombre: '',
    fecha_inicio: ''
  };
  
  ngOnInit() {
    this.loadSemanas();
  }
  
  loadSemanas() {
    this.semanaService.loadSemanas().subscribe();
  }
  
  closeModal() {
    this.showModal = false;
    this.formData = { nombre: '', fecha_inicio: '' };
  }
  
  isValidMonday(): boolean {
    if (!this.formData.fecha_inicio) return true;
    const date = new Date(this.formData.fecha_inicio);
    return date.getDay() === 1; // 1 = Monday
  }
  
  getDayName(dateStr: string): string {
    const date = new Date(dateStr);
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[date.getDay()];
  }
  
  createSemana() {
    this.semanaService.createSemana(this.formData).subscribe({
      next: () => {
        this.loadSemanas();
        this.closeModal();
      },
      error: (err) => {
        alert(err.error?.error || 'Error al crear la semana');
      }
    });
  }
  
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });
  }
}
