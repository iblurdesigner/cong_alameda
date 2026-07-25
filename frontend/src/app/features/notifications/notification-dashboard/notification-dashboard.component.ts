import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NotificationService, Notificacion } from '../../../core/services/notification.service';

export interface CategoriaNotificacion {
  key: string;
  label: string;
  icon: string;
  color: string;
  tiposBackend: string[];
}

@Component({
  selector: 'app-notification-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="notifications-container">
      <!-- Calescence Header -->
      <header class="top-header">
        <div class="title-section">
          <div class="icon-badge">
            <span class="material-symbols-outlined">notifications</span>
          </div>
          <div>
            <h1>Notificaciones y Tareas</h1>
            <p class="subtitle">
              Centro unificado de avisos y asignaciones
              @if (notificationService.unreadCount() > 0) {
                <span class="unread-pill">{{ notificationService.unreadCount() }} sin leer</span>
              }
            </p>
          </div>
        </div>

        <div class="header-actions">
          <button 
            class="pill-btn btn-secondary" 
            (click)="markAllRead()" 
            [disabled]="notificationService.unreadCount() === 0"
            title="Marcar todas las notificaciones como leídas"
          >
            <span class="material-symbols-outlined icon">done_all</span>
            <span>Marcar todas como leídas</span>
          </button>
        </div>
      </header>

      <!-- Category Filter Pills Bar -->
      <div class="category-pills-bar">
        <button 
          class="cat-pill" 
          [class.active]="selectedCatKey() === 'TODOS'"
          (click)="setCategory('TODOS')"
        >
          <span class="material-symbols-outlined icon">dashboard</span>
          <span class="label">Todos</span>
          <span class="count-badge">{{ getTotalCount() }}</span>
        </button>

        @for (cat of categorias; track cat.key) {
          <button 
            class="cat-pill" 
            [class.active]="selectedCatKey() === cat.key"
            [style.--cat-color]="cat.color"
            (click)="setCategory(cat.key)"
          >
            <span class="material-symbols-outlined icon">{{ cat.icon }}</span>
            <span class="label">{{ cat.label }}</span>
            @if (getCatCount(cat.key) > 0) {
              <span class="count-badge">{{ getCatCount(cat.key) }}</span>
            }
          </button>
        }
      </div>

      <!-- Main Content Area -->
      @if (notificationService.loading()) {
        <div class="loading-state-card">
          <span class="material-symbols-outlined spin">sync</span>
          <p>Cargando notificaciones y tareas...</p>
        </div>
      } @else if (filteredNotificaciones().length === 0) {
        <div class="empty-state-card">
          <div class="empty-icon-circle">
            <span class="material-symbols-outlined">notifications_off</span>
          </div>
          <h3>No hay notificaciones</h3>
          <p>{{ selectedCatKey() !== 'TODOS' ? 'No tienes notificaciones en la categoría ' + getCatLabel(selectedCatKey()) : 'Estás al día. No tienes notificaciones pendientes.' }}</p>
        </div>
      } @else {
        <div class="notif-feed-list">
          @for (notif of pagedNotificaciones(); track notif.id) {
            @let meta = getNotifMetadata(notif.tipo);
            <div 
              class="notif-card-item" 
              [class.unread]="!notif.leida"
              [style.--item-accent]="meta.color"
              (click)="goToAction(notif)"
            >
              <div class="notif-icon-box" [style.background]="meta.color + '18'" [style.color]="meta.color">
                <span class="material-symbols-outlined">{{ meta.icon }}</span>
              </div>

              <div class="notif-info-content">
                <div class="notif-top-row">
                  <span class="notif-cat-tag" [style.color]="meta.color">{{ meta.label }}</span>
                  <span class="notif-date-stamp">{{ formatDate(notif.created_at) }}</span>
                </div>
                <p class="notif-message-text">{{ notif.mensaje }}</p>
              </div>

              <div class="notif-action-side">
                @if (!notif.leida) {
                  <span class="unread-dot-badge">Nuevo</span>
                }
                <button class="action-arrow-btn" (click)="$event.stopPropagation(); goToAction(notif)" title="Ver detalle o sección">
                  <span>Ver</span>
                  <span class="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          }
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="pagination-bar">
            <button 
              class="page-nav-btn" 
              (click)="prevPage()" 
              [disabled]="currentPage() === 1"
            >
              <span class="material-symbols-outlined">chevron_left</span>
              <span>Anterior</span>
            </button>
            <span class="page-count-text">Página {{ currentPage() }} de {{ totalPages() }}</span>
            <button 
              class="page-nav-btn" 
              (click)="nextPage()" 
              [disabled]="currentPage() === totalPages()"
            >
              <span>Siguiente</span>
              <span class="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .notifications-container {
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .top-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .title-section {
      display: flex;
      align-items: center;
      gap: 1rem;

      .icon-badge {
        width: 48px;
        height: 48px;
        background: #121316;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--accent-lime);
        box-shadow: var(--shadow-sm);

        span { font-size: 1.6rem; }
      }

      h1 {
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 1.85rem;
        font-weight: 800;
        margin: 0;
        color: var(--text-primary);
        letter-spacing: -0.02em;
      }

      .subtitle {
        color: var(--text-secondary);
        font-size: 0.9rem;
        margin-top: 0.2rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .unread-pill {
        background: #ef4444;
        color: #ffffff;
        font-size: 0.72rem;
        font-weight: 700;
        padding: 0.15rem 0.55rem;
        border-radius: var(--radius-pill);
      }
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .pill-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem 1.35rem;
      border-radius: var(--radius-pill);
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;

      .icon { font-size: 1.15rem; }

      &.btn-secondary {
        background: var(--surface-color);
        border: 1px solid var(--border-color);
        color: var(--text-primary);

        &:hover:not(:disabled) {
          border-color: var(--primary-color);
          color: var(--primary-color);
          background: var(--background-color);
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }

    /* Category Pills Bar */
    .category-pills-bar {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
      scrollbar-width: thin;
    }

    .cat-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.55rem 1.1rem;
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-pill);
      color: var(--text-secondary);
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s ease;

      .icon { font-size: 1.1rem; color: var(--cat-color, var(--primary-color)); }

      .count-badge {
        background: var(--background-color);
        color: var(--text-primary);
        font-size: 0.72rem;
        font-weight: 700;
        padding: 0.15rem 0.5rem;
        border-radius: var(--radius-pill);
      }

      &:hover {
        border-color: var(--cat-color, var(--primary-color));
        color: var(--text-primary);
        transform: translateY(-1px);
      }

      &.active {
        background: var(--cat-color, #2563eb);
        border-color: var(--cat-color, #2563eb);
        color: #ffffff;

        .icon { color: #ffffff; }
        .count-badge { background: rgba(255, 255, 255, 0.25); color: #ffffff; }
      }
    }

    /* Feed & Cards */
    .notif-feed-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .notif-card-item {
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: 20px;
      padding: 1.1rem 1.35rem;
      display: flex;
      align-items: center;
      gap: 1.1rem;
      cursor: pointer;
      box-shadow: var(--shadow-sm);
      transition: all 0.2s ease;
      position: relative;
      overflow: hidden;

      &:hover {
        border-color: var(--item-accent, var(--primary-color));
        box-shadow: var(--shadow-md);
        transform: translateY(-2px);

        .action-arrow-btn {
          background: var(--item-accent, var(--primary-color));
          color: #ffffff;
          border-color: var(--item-accent, var(--primary-color));
        }
      }

      &.unread {
        border-left: 4px solid var(--item-accent, var(--primary-color));
        background: linear-gradient(90deg, rgba(37, 99, 235, 0.03) 0%, var(--surface-color) 40%);
      }
    }

    .notif-icon-box {
      width: 46px;
      height: 46px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      .material-symbols-outlined { font-size: 1.4rem; }
    }

    .notif-info-content {
      flex: 1;
      min-width: 0;

      .notif-top-row {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0.25rem;
      }

      .notif-cat-tag {
        font-size: 0.75rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .notif-date-stamp {
        font-size: 0.75rem;
        color: var(--text-secondary);
        font-weight: 500;
      }

      .notif-message-text {
        margin: 0;
        font-size: 0.93rem;
        color: var(--text-primary);
        font-weight: 500;
        line-height: 1.4;
      }
    }

    .notif-action-side {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-shrink: 0;
    }

    .unread-dot-badge {
      background: #ef4444;
      color: #ffffff;
      font-size: 0.68rem;
      font-weight: 800;
      text-transform: uppercase;
      padding: 0.2rem 0.55rem;
      border-radius: var(--radius-pill);
      letter-spacing: 0.05em;
    }

    .action-arrow-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.4rem 0.85rem;
      border-radius: var(--radius-pill);
      background: var(--background-color);
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;

      .material-symbols-outlined { font-size: 1rem; }
    }

    /* States */
    .loading-state-card, .empty-state-card {
      background: var(--surface-color);
      border: 1px dashed var(--border-color);
      border-radius: 24px;
      padding: 4rem 2rem;
      text-align: center;
      color: var(--text-secondary);

      .spin {
        font-size: 3rem;
        color: var(--primary-color);
        margin-bottom: 0.75rem;
        animation: spin 1s linear infinite;
      }

      .empty-icon-circle {
        width: 64px;
        height: 64px;
        background: var(--background-color);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1rem auto;
        color: var(--text-secondary);

        .material-symbols-outlined { font-size: 2.2rem; }
      }

      h3 {
        font-family: 'Plus Jakarta Sans', sans-serif;
        color: var(--text-primary);
        font-size: 1.25rem;
        margin-bottom: 0.4rem;
      }

      p { margin: 0; font-size: 0.92rem; }
    }

    /* Pagination */
    .pagination-bar {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      padding-top: 1rem;
    }

    .page-nav-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.45rem 1rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-pill);
      background: var(--surface-color);
      color: var(--text-primary);
      font-size: 0.84rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        border-color: var(--primary-color);
        color: var(--primary-color);
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }

    .page-count-text {
      font-size: 0.85rem;
      color: var(--text-secondary);
      font-weight: 500;
    }

    @keyframes spin { 100% { transform: rotate(360deg); } }
  `]
})
export class NotificationDashboardComponent implements OnInit {
  notificationService = inject(NotificationService);
  private router = inject(Router);

  categorias: CategoriaNotificacion[] = [
    {
      key: 'ASIGNACIONES',
      label: 'Asignaciones de Reunión',
      icon: 'assignment',
      color: '#8b5cf6',
      tiposBackend: ['ASIGNACION_CREADA', 'ASIGNACION_ACTUALIZADA', 'ASIGNACION_COMPLETADA']
    },
    {
      key: 'VISITAS',
      label: 'Visitas',
      icon: 'event_available',
      color: '#3b82f6',
      tiposBackend: ['VISITA_PROGRAMADA', 'VISITA_COMPLETADA']
    },
    {
      key: 'CASAS',
      label: 'Casas',
      icon: 'home',
      color: '#22c55e',
      tiposBackend: ['CASA_REGISTRADA']
    },
    {
      key: 'ALERTAS',
      label: 'Requiere Atención',
      icon: 'warning',
      color: '#f59e0b',
      tiposBackend: ['PERSONA_REQUIERE_VISITA']
    }
  ];

  PAGE_SIZE = 30;

  selectedCatKey = signal<string>('TODOS');
  currentPage = signal(1);

  filteredNotificaciones = computed(() => {
    const key = this.selectedCatKey();
    const all = this.notificationService.notificaciones();
    if (key === 'TODOS') return all;

    const catConfig = this.categorias.find(c => c.key === key);
    if (!catConfig) return all;

    return all.filter(n => catConfig.tiposBackend.includes(n.tipo));
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredNotificaciones().length / this.PAGE_SIZE) || 1;
  });

  pagedNotificaciones = computed(() => {
    const notifs = this.filteredNotificaciones();
    const page = this.currentPage();
    const start = (page - 1) * this.PAGE_SIZE;
    return notifs.slice(start, start + this.PAGE_SIZE);
  });

  ngOnInit() {
    this.notificationService.loadNotifications().subscribe();
  }

  setCategory(key: string) {
    this.selectedCatKey.set(key);
    this.currentPage.set(1);
  }

  getTotalCount(): number {
    return this.notificationService.notificaciones().length;
  }

  getCatCount(key: string): number {
    const catConfig = this.categorias.find(c => c.key === key);
    if (!catConfig) return 0;
    return this.notificationService.notificaciones().filter(n => catConfig.tiposBackend.includes(n.tipo)).length;
  }

  getCatLabel(key: string): string {
    const cat = this.categorias.find(c => c.key === key);
    return cat?.label || key;
  }

  getNotifMetadata(tipo: string): { icon: string; color: string; label: string } {
    for (const cat of this.categorias) {
      if (cat.tiposBackend.includes(tipo)) {
        return { icon: cat.icon, color: cat.color, label: cat.label };
      }
    }
    return { icon: 'notifications', color: '#64748b', label: 'Notificación' };
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

  goToAction(notif: Notificacion) {
    this.markRead(notif);
    if (notif.tipo.startsWith('ASIGNACION_')) {
      this.router.navigate(['/asignaciones']);
    } else if (notif.tipo.startsWith('VISITA_') || notif.tipo === 'PERSONA_REQUIERE_VISITA') {
      this.router.navigate(['/visitas']);
    } else if (notif.tipo.startsWith('CASA_') || notif.casa_id) {
      this.router.navigate(['/casas']);
    }
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