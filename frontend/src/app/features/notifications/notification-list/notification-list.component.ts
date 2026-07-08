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
            Marcar todas como le├¡das
          </button>
        }
      </header>
      
      @if (notificationService.loading()) {
        <div class="loader-container">
          <div class="loader"></div>
          <p>Cargando notificaciones...</p>
        </div>
      } @else if (notificationService.notificaciones().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">≡ƒöö</div>
          <p>No hay notificaciones</p>
        </div>
      } @else {
        <div class="notifications-list">
          @for (notif of notificationService.notificaciones(); track notif.id) {
            <div class="notif-card" [class.unread]="!notif.leida" (click)="markRead(notif)">
              <div class="notif-icon-wrapper" [attr.data-tipo]="notif.tipo">
                <span class="notif-icon">{{ getIcon(notif.tipo) }}</span>
              </div>
              <div class="notif-content">
                <div class="notif-header">
                  <span class="notif-tipo">{{ getTipoLabel(notif.tipo) }}</span>
                  <span class="notif-fecha">{{ formatDate(notif.created_at) }}</span>
                </div>
                <p class="notif-mensaje">{{ notif.mensaje }}</p>
              </div>
              @if (!notif.leida) {
                <div class="unread-indicator">
                  <span class="unread-label">Nueva</span>
                </div>
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
    .loader-container { display: flex; flex-direction: column; align-items: center; gap: 1rem; padding: 3rem; }
    .loader { width: 40px; height: 40px; border: 3px solid var(--border-color); border-top-color: var(--primary-color); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { display: flex; flex-direction: column; align-items: center; gap: 1rem; .empty-icon { font-size: 3rem; opacity: 0.5; } }
    
    .notifications-list { display: flex; flex-direction: column; gap: 1rem; }
    
    .notif-card {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.25rem;
      background: var(--surface-color);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-lg);
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      position: relative;
      overflow: hidden;
      
      &:hover {
        border-color: var(--primary-color);
        box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        transform: translateY(-2px);
      }
      
      &.unread { 
        border-left: 4px solid var(--primary-color);
        background: linear-gradient(90deg, #f8f3ff 0%, var(--surface-color) 30%);
      }
    }
    
    .notif-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 1.5rem;
      
      &[data-tipo="CASA_REGISTRADA"] { background: #e8f5e9; }
      &[data-tipo="VISITA_PROGRAMADA"] { background: #e3f2fd; }
      &[data-tipo="VISITA_COMPLETADA"] { background: #f1f8e9; }
      &[data-tipo="PERSONA_REQUIERE_VISITA"] { background: #fff3e0; }
    }
    
    .notif-icon { font-size: 1.5rem; }
    
    .notif-content {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      
      .notif-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.5rem;
      }
      
      .notif-tipo {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--primary-color);
        letter-spacing: 0.5px;
      }
      
      .notif-mensaje {
        margin: 0;
        font-size: 0.9375rem;
        line-height: 1.5;
        color: var(--text-primary);
      }
      
      .notif-fecha {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
    }
    
    .unread-indicator {
      position: absolute;
      top: 0.75rem;
      right: 0.75rem;
      
      .unread-label {
        display: inline-block;
        padding: 0.25rem 0.625rem;
        font-size: 0.6875rem;
        font-weight: 600;
        text-transform: uppercase;
        color: white;
        background: var(--primary-color);
        border-radius: var(--radius-sm);
        letter-spacing: 0.5px;
      }
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
    this.notificationService.loadNotifications().subscribe();
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
    const icons: Record<string, string> = { CASA_REGISTRADA: '≡ƒÅá', VISITA_PROGRAMADA: '≡ƒôà', VISITA_COMPLETADA: 'Γ£à', PERSONA_REQUIERE_VISITA: '≡ƒñ¥' };
    return icons[tipo] || '≡ƒöö';
  }
  
  getTipoLabel(tipo: string): string {
    const labels: Record<string, string> = { CASA_REGISTRADA: 'Casa Registrada', VISITA_PROGRAMADA: 'Visita Programada', VISITA_COMPLETADA: 'Visita Completada', PERSONA_REQUIERE_VISITA: 'Persona Requiere Visita' };
    return labels[tipo] || tipo;
  }
}
