import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: 'SUPER_ADMIN' | 'SUPERINTENDENTE' | 'ANCIANO' | 'VISITANTE';
  telefono?: string;
  telefono_validado: boolean;
  activo: boolean;
  notificaciones_email: boolean;
  notificaciones_whatsapp: boolean;
}

export interface UpdateUserRequest {
  nombre?: string;
  email?: string;
  telefono?: string;
  telefono_validado?: boolean;
  notificaciones_email?: boolean;
  notificaciones_whatsapp?: boolean;
  activo?: boolean;
  rol?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  getUsers() {
    return this.http.get<{data: User[]}>(`${environment.apiUrl}/users`).pipe(
      map(res => res.data)
    );
  }

  updateUser(id: string, data: UpdateUserRequest) {
    return this.http.put<User>(`${environment.apiUrl}/users/${id}`, data);
  }

  deleteUser(id: string) {
    return this.http.delete(`${environment.apiUrl}/users/${id}`);
  }

  getVisitantes() {
    return this.http.get<{data: User[]}>(`${environment.apiUrl}/users/visitantes`).pipe(
      map(res => res.data)
    );
  }
}
