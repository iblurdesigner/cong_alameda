import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface User {
  id: string;
  nombre: string;
  telefono?: string;
  telefono_validado: boolean;
  email: string;
  rol: 'SUPER_ADMIN' | 'SUPERINTENDENTE' | 'ANCIANO' | 'VISITANTE';
  activo: boolean;
  notificaciones_email: boolean;
  notificaciones_whatsapp: boolean;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  getUsers(): Observable<User[]> {
    return this.http.get<{ data: User[] }>(`${environment.apiUrl}/users`)
      .pipe(
        map(response => response.data)
      );
  }
}
