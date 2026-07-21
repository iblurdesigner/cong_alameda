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

  getUsers(): Observable<User[]> {
    return this.http.get<{ data: User[] }>(`${environment.apiUrl}/users`)
      .pipe(map(response => response.data));
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
