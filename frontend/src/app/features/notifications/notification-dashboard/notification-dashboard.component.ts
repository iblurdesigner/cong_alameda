import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService, Notificacion } from '../../../core/services/notification.service';

interface NotificacionTipo {
  key: string;
  label: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-notification-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard-container">
      <header class="page-header">
        <div class="header-content">
          <h1>Notificaciones</h1>
          <p class="header-subtitle">{{ notificationService.unreadCount() }} sin leer</p>
        </div>
        <button class="btn btn-outline" (click)="markAllRead()" [disabled]="notificationService.unreadCount() === 0">
          Marcar todas como le├¡das
        </button>
      </header>

      <!-- Filtros por tipo -->
      <div class="filters-bar">
        <div class="filter-cards">
          <button 
            class="filter-card" 
            [class.active]="selectedTipo() === null"
            (click)="setFilter(null)">
            <span class="filter-icon">≡ƒôï</span>
            <span class="filter-label">Todos</span>
          </button>
          @for (tipo of tipos; track tipo.key) {
            <button 
              class="filter-card" 
              [class.active]="selectedTipo() === tipo.key"
              [style.--card-color]="tipo.color"
              (click)="setFilter(tipo.key)">
              <span class="filter-icon">{{ tipo.icon }}</span>
              <span class="filter-label">{{ tipo.label }}</span>
              @if (getCountByTipo(tipo.key) > 0) {
                <span class="filter-count">{{ getCountByTipo(tipo.key) }}</span>
              }
            </button>
          }
        </div>
      </div>

      @if (notificationService.loading()) {
        <div class="loader-container">
          <div class="loader"></div>
          <p>Cargando notificaciones...</p>
        </div>
      } @else if (filteredNotificaciones().length === 0) {
        <!-- Empty State -->
        <div class="empty-state">
          <div class="empty-icon">≡ƒöö</div>
          <h3>No hay notificaciones</h3>
          <p>{{ selectedTipo() ? 'No hay notificaciones de tipo ' + getTipoLabel(selectedTipo()!) : 'No tienes notificaciones a├║n' }}</p>
        </div>
      } @else {
        <!-- Agrupado por tipo -->
        @for (group of groupedNotificaciones(); track group.tipo) {
          <div class="notif-group">
            <h3 class="group-title" [style.color]="getTipoConfig(group.tipo)?.color">
              <span class="group-icon">{{ getTipoConfig(group.tipo)?.icon }}</span>
              {{ getTipoLabel(group.tipo) }}
              <span class="group-count">({{ group.notificaciones.length }})</span>
            </h3>
            <div class="notif-list">
              @for (notif of group.notificaciones; track notif.id) {
                <div 
                  class="notif-card" 
                  [class.unread]="!notif.leida"
                  [style.--tipo-color]="getTipoConfig(notif.tipo)?.color"
                  (click)="markRead(notif)">
                  <div class="notif-icon" [style.background]="getTipoConfig(notif.tipo)?.color + '20'">
                    {{ getTipoConfig(notif.tipo)?.icon }}
                  </div>
                  <div class="notif-content">
                    <p class="notif-mensaje">{{ notif.mensaje }}</p>
                    <span class="notif-fecha">{{ formatDate(notif.created_at) }}</span>
                  </div>
                  @if (!notif.leida) {
                    <div class="unread-badge">Nuevo</div>
                  }
                </div>
              }
            </div>
          </div>
        }

        <!-- Paginaci├│n -->
        @if (totalPages() > 1) {
          <div class="pagination">
            <button 
              class="page-btn" 
              (click)="prevPage()" 
              [disabled]="currentPage() === 1">
              ΓåÉ Anterior
            </button>
            <span class="page-info">P├ígina {{ currentPage() }} de {{ totalPages() }}</span>
            <button 
              class="page-btn" 
              (click)="nextPage()" 
              [disabled]="currentPage() === totalPages()">
              Siguiente ΓåÆ
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .dashboard-container { max-width: 800px; margin: 0 auto; }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      
      h1 { font-size: 1.75rem; font-weight: 700; }
      .header-subtitle { color: var(--text-secondary); margin-top: 0.25rem; }
    }
    
    .filters-bar {
      margin-bottom: 1.5rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
    }
    
    .filter-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 0.75rem;
    }
    
    .filter-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.375rem;
      padding: 1rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      background: var(--surface-color);
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      
      &:hover {
        border-color: var(--card-color, var(--primary-color));
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        transform: translateY(-2px);
      }
      
      &.active {
        background: var(--card-color, var(--primary-color));
        border-color: var(--card-color, var(--primary-color));
        color: white;
        
        .filter-count { background: rgba(255,255,255,0.25); color: white; }
      }
    }
    
    .filter-icon { font-size: 1.5rem; }
    .filter-label { font-weight: 500; text-align: center; }
    .filter-count {
      background: var(--card-color, var(--primary-color));
      color: white;
      padding: 0.125rem 0.5rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    
    .loading, .empty-state { text-align: center; padding: 3rem; color: var(--text-secondary); }
    .loader-container { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 3rem; }
    .loader { width: 40px; height: 40px; border: 3px solid var(--border-color); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; 
      .empty-icon { font-size: 3rem; opacity: 0.5; }
      h3 { margin: 0; color: var(--text-primary); }
      p { margin: 0; }
    }
    
    .notif-group { margin-bottom: 2rem; }
    
    .group-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid var(--border-color);
      
      .group-icon { font-size: 1.25rem; }
      .group-count { font-weight: 400; color: var(--text-secondary); font-size: 0.875rem; }
    }
    
    .notif-list { display: flex; flex-direction: column; gap: 0.5rem; }
    
    .notif-card {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.875rem 1rem;
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all 0.15s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      
      &:hover {
        border-color: var(--tipo-color, var(--primary-color));
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        transform: translateY(-1px);
      }
      
      &.unread { 
        border-left: 3px solid var(--tipo-color, var(--primary-color));
        background: linear-gradient(90deg, #f8f3ff 0%, var(--surface-color) 30%);
      }
    }
    
    .notif-icon {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md);
      font-size: 1.25rem;
      flex-shrink: 0;
    }
    
    .notif-content {
      flex: 1;
      min-width: 0;
      
      .notif-mensaje {
        margin: 0;
        font-size: 0.9rem;
        line-height: 1.4;
      }
      
      .notif-fecha {
        display: block;
        margin-top: 0.25rem;
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
    }
    
    .unread-badge {
      background: var(--tipo-color, var(--primary-color));
      color: white;
      padding: 0.25rem 0.625rem;
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      flex-shrink: 0;
    }
    
    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
    }
    
    .page-btn {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--surface-color);
      cursor: pointer;
      transition: all 0.15s;
      
      &:hover:not(:disabled) { border-color: var(--primary-color); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    
    .page-info { font-size: 0.875rem; color: var(--text-secondary); }
    
    @media (max-width: 768px) {
      .page-header { flex-direction: column; 
        h1 { font-size: 1.5rem; }
        .btn { width: 100%; justify-content: center; }
      }
      .chip { padding: 0.375rem 0.75rem; font-size: 0.8rem; }
      .notif-card { padding: 0.75rem; }
    }
  `]
})
export class NotificationDashboardComponent implements OnInit {
  notificationService = inject(NotificationService);
  
  // Config de tipos con iconos y colores
  tipos: NotificacionTipo[] = [
    { key: 'CASA_REGISTRADA', label: 'Casas', icon: '≡ƒÅá', color: '#22c55e' },
    { key: 'VISITA_PROGRAMADA', label: 'Visitas', icon: '≡ƒôà', color: '#3b82f6' },
    { key: 'VISITA_COMPLETADA', label: 'Completadas', icon: 'Γ£à', color: '#10b981' },
    { key: 'PERSONA_REQUIERE_VISITA', label: 'Requiere Visita', icon: '≡ƒñ¥', color: '#f59e0b' },
    { key: 'ASIGNACION_CREADA', label: 'Asignaci├│n Nueva', icon: '≡ƒÄñ', color: '#8b5cf6' },
    { key: 'ASIGNACION_ACTUALIZADA', label: 'Asignaci├│n Actualizada', icon: '≡ƒöä', color: '#ec4899' },
    { key: 'ASIGNACION_COMPLETADA', label: 'Asignaci├│n Completada', icon: '≡ƒÄ»', color: '#14b8a6' },
  ];
  
  PAGE_SIZE = 50;
  
  selectedTipo = signal<string | null>(null);
  currentPage = signal(1);
  
  // Notificaciones filtradas por tipo
  filteredNotificaciones = computed(() => {
    const tipo = this.selectedTipo();
    let notifs = this.notificationService.notificaciones();
    if (tipo) {
      notifs = notifs.filter(n => n.tipo === tipo);
    }
    return notifs;
  });
  
  // Total de p├íginas
  totalPages = computed(() => {
    return Math.ceil(this.filteredNotificaciones().length / this.PAGE_SIZE);
  });
  
  // Notificaciones paginadas y agrupadas
  groupedNotificaciones = computed(() => {
    const notifs = this.filteredNotificaciones();
    const page = this.currentPage();
    const start = (page - 1) * this.PAGE_SIZE;
    const paged = notifs.slice(start, start + this.PAGE_SIZE);
    
    // Agrupar por tipo
    const groups: { tipo: string; notificaciones: Notificacion[] }[] = [];
    const grouped = new Map<string, Notificacion[]>();
    
    for (const notif of paged) {
      const existing = grouped.get(notif.tipo) || [];
      existing.push(notif);
      grouped.set(notif.tipo, existing);
    }
    
    grouped.forEach((notificaciones, tipo) => {
      groups.push({ tipo, notificaciones });
    });
    
    // Ordenar por tipo
    return groups.sort((a, b) => a.tipo.localeCompare(b.tipo));
  });
  
  ngOnInit() {
    this.notificationService.loadNotifications().subscribe();
  }
  
  setFilter(tipo: string | null) {
    this.selectedTipo.set(tipo);
    this.currentPage.set(1);
  }
  
  getCountByTipo(tipo: string): number {
    return this.notificationService.notificaciones().filter(n => n.tipo === tipo).length;
  }
  
  getTipoConfig(tipo: string): NotificacionTipo | undefined {
    return this.tipos.find(t => t.key === tipo);
  }
  
  getTipoLabel(tipo: string): string {
    const config = this.getTipoConfig(tipo);
    return config?.label || tipo;
  }
  
  markRead(notif: Notificacion) {
    if (!notif.leida) {
      this.notificationService.markAsRead(notif.id).subscribe();
    }
  }
  
  markAllRead() {
    this.notificationService.markAllAsRead().subscribe();
  }
  
  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleString('es-ES', { 
      day: 'numeric', 
      month: 'short', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
  
  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }
  
  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }
}
