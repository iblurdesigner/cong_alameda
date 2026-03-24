import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notificacion } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container">
      <header class="page-header">
        <div class="header-content">
          <h1>Notificaciones</h1>
          <p class="header-subtitle">{{ notificationService.unreadCount() }} sin leer</p>
        </div>
        @if (notificationService.unreadCount() > 0) {
          <button class="btn btn-outline btn-mobile-full" (click)="markAllRead()">
            Marcar todas como leídas
          </button>
        }
      </header>
      
      @if (notificationService.loading()) {
        <div class="loading">Cargando...</div>
      } @else if (notificationService.notificaciones().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">🔔</div>
          <p>No hay notificaciones</p>
        </div>
      } @else {
        <div class="notifications-list">
          @for (notif of notificationService.notificaciones(); track notif.id) {
            <div class="notif-card" [class.unread]="!notif.leida" (click)="markRead(notif)">
              <div class="notif-icon">{{ getIcon(notif.tipo) }}</div>
              <div class="notif-content">
                <span class="notif-tipo">{{ getTipoLabel(notif.tipo) }}</span>
                <p class="notif-mensaje">{{ notif.mensaje }}</p>
                <span class="notif-fecha">{{ formatDate(notif.created_at) }}</span>
              </div>
              @if (!notif.leida) {
                <div class="unread-dot"></div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container { max-width: 700px; margin: 0 auto; }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      
      h1 { font-size: 1.75rem; font-weight: 700; }
      .header-subtitle { color: var(--text-secondary); margin-top: 0.25rem; }

      .btn-mobile-full {
        min-height: 40px;
        padding: 0.5rem 1rem;
        font-size: 0.875rem;
      }
    }
    
    .loading, .empty-state { text-align: center; padding: 3rem; color: var(--text-secondary); }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; .empty-icon { font-size: 3rem; opacity: 0.5; } }
    
    .notifications-list { display: flex; flex-direction: column; gap: 0.75rem; }
    
    .notif-card {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem;
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all 0.15s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      
      &:hover {
        border-color: var(--primary-color);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        transform: translateY(-2px);
      }
      
      &.unread { border-left: 3px solid var(--primary-color); }
    }
    
    .notif-icon { font-size: 1.5rem; flex-shrink: 0; }
    
    .notif-content {
      flex: 1;
      min-width: 0;
      
      .notif-tipo {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--text-secondary);
      }
      
      .notif-mensaje {
        margin: 0.25rem 0;
        font-size: 0.875rem;
        word-break: break-word;
      }
      
      .notif-fecha {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
    }
    
    .unread-dot {
      width: 8px;
      height: 8px;
      background: var(--primary-color);
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 0.5rem;
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        h1 { font-size: 1.5rem; }
        .btn-mobile-full { width: 100%; justify-content: center; }
      }
      
      .notifications-list { gap: 0.5rem; }
      .notif-card { padding: 0.875rem; }
      .notif-icon { font-size: 1.25rem; }
    }
  `]
})
export class NotificationListComponent implements OnInit {
  notificationService = inject(NotificationService);
  
  ngOnInit() {
    this.notificationService.loadNotifications();
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
    return new Date(dateStr).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }
  
  getIcon(tipo: string): string {
    const icons: Record<string, string> = { CASA_REGISTRADA: '🏠', VISITA_PROGRAMADA: '📅', VISITA_COMPLETADA: '✅', PERSONA_REQUIERE_VISITA: '🤝' };
    return icons[tipo] || '🔔';
  }
  
  getTipoLabel(tipo: string): string {
    const labels: Record<string, string> = { CASA_REGISTRADA: 'Casa Registrada', VISITA_PROGRAMADA: 'Visita Programada', VISITA_COMPLETADA: 'Visita Completada', PERSONA_REQUIERE_VISITA: 'Persona Requiere Visita' };
    return labels[tipo] || tipo;
  }
}
