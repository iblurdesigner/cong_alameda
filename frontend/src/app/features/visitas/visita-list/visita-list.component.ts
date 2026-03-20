import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VisitaService, Visita } from '../../../core/services/visita.service';

@Component({
  selector: 'app-visita-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <h1>Visitas</h1>
        <p>Programación y seguimiento de visitas</p>
      </header>
      
      <div class="filters-bar">
        <select [(ngModel)]="estadoFilter" (ngModelChange)="loadVisitas()">
          <option value="">Todos los estados</option>
          <option value="PROGRAMADA">Programada</option>
          <option value="REALIZADA">Realizada</option>
          <option value="CANCELADA">Cancelada</option>
        </select>
      </div>
      
      @if (visitaService.loading()) {
        <div class="loading">Cargando...</div>
      } @else if (visitas().length === 0) {
        <div class="empty-state">
          <p>No hay visitas registradas</p>
        </div>
      } @else {
        <div class="visitas-grid">
          @for (visita of visitas(); track visita.id) {
            <div class="visita-card">
              <div class="visita-header">
                <span class="visita-date">{{ formatDate(visita.fecha_programada) }}</span>
                <span class="badge" [ngClass]="getEstadoClass(visita.estado)">
                  {{ getEstadoLabel(visita.estado) }}
                </span>
              </div>
              
              @if (visita.fecha_realizada) {
                <p class="visita-realizada">Realizada: {{ formatDate(visita.fecha_realizada) }}</p>
              }
              
              @if (visita.observaciones) {
                <p class="visita-obs">{{ visita.observaciones }}</p>
              }
              
              @if (visita.desea_seguir_recibiendo !== undefined) {
                <p class="visita-resp">
                  {{ visita.desea_seguir_recibiendo ? '✅ Desea visitas' : '❌ No desea visitas' }}
                </p>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { max-width: 1000px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; h1 { font-size: 1.75rem; font-weight: 700; } p { color: var(--text-secondary); } }
    .filters-bar { margin-bottom: 1.5rem; select { padding: 0.625rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); } }
    .loading, .empty-state { text-align: center; padding: 3rem; color: var(--text-secondary); }
    .visitas-grid { display: grid; gap: 1rem; }
    .visita-card { background: var(--surface-color); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 1rem; }
    .visita-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .visita-date { font-weight: 600; }
    .visita-realizada, .visita-obs, .visita-resp { font-size: 0.875rem; color: var(--text-secondary); margin: 0.25rem 0; }
    .badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
    .badge-warning { background: rgba(245, 158, 11, 0.1); color: var(--warning-color); }
    .badge-success { background: rgba(16, 185, 129, 0.1); color: var(--success-color); }
    .badge-danger { background: rgba(239, 68, 68, 0.1); color: var(--danger-color); }
  `]
})
export class VisitaListComponent implements OnInit {
  visitaService = inject(VisitaService);
  
  visitas = signal<Visita[]>([]);
  estadoFilter = '';
  
  ngOnInit() {
    this.loadVisitas();
  }
  
  loadVisitas() {
    this.visitaService.loadVisitas({ estado: this.estadoFilter || undefined }).subscribe({
      next: (res) => this.visitas.set(res.data)
    });
  }
  
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-ES');
  }
  
  getEstadoClass(estado: string): string {
    const classes: Record<string, string> = { PROGRAMADA: 'badge-warning', REALIZADA: 'badge-success', CANCELADA: 'badge-danger' };
    return classes[estado] || '';
  }
  
  getEstadoLabel(estado: string): string {
    const labels: Record<string, string> = { PROGRAMADA: 'Programada', REALIZADA: 'Realizada', CANCELADA: 'Cancelada' };
    return labels[estado] || estado;
  }
}
