import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';

export interface Notificacion {
  id: string;
  tipo: string;
  casa_id?: string;
  mensaje: string;
  leida: boolean;
  created_at: string;
}

export interface NotificacionListResponse {
  data: Notificacion[];
  unread_count: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificacionesSignal = signal<Notificacion[]>([]);
  private unreadCountSignal = signal(0);
  private loadingSignal = signal(false);

  notificaciones = this.notificacionesSignal.asReadonly();
  unreadCount = this.unreadCountSignal.asReadonly();
  loading = this.loadingSignal.asReadonly();

  constructor(private http: HttpClient) {}

  loadNotifications(filters: { leida?: boolean; tipo?: string } = {}) {
    this.loadingSignal.set(true);
    
    let params = new HttpParams();
    if (filters.leida !== undefined) params = params.set('leida', filters.leida.toString());
    if (filters.tipo) params = params.set('tipo', filters.tipo);

    return this.http.get<NotificacionListResponse>(`${environment.apiUrl}/notificaciones`, { params })
      .pipe(
        tap(response => {
          this.notificacionesSignal.set(response.data);
          this.unreadCountSignal.set(response.unread_count);
          this.loadingSignal.set(false);
        })
      );
  }

  markAsRead(id: string) {
    return this.http.put(`${environment.apiUrl}/notificaciones/${id}/read`, { leida: true })
      .pipe(
        tap(() => {
          const notificaciones = this.notificacionesSignal();
          const index = notificaciones.findIndex(n => n.id === id);
          if (index !== -1) {
            notificaciones[index].leida = true;
            this.notificacionesSignal.set([...notificaciones]);
            this.unreadCountSignal.set(Math.max(0, this.unreadCountSignal() - 1));
          }
        })
      );
  }

  markAllAsRead() {
    return this.http.put(`${environment.apiUrl}/notificaciones/read-all`, {})
      .pipe(
        tap(() => {
          const notificaciones = this.notificacionesSignal().map(n => ({ ...n, leida: true }));
          this.notificacionesSignal.set(notificaciones);
          this.unreadCountSignal.set(0);
        })
      );
  }
}
