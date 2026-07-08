import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';

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

export interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  private userSignal = signal<User | null>(this.loadUser());

  currentUser = computed(() => this.userSignal());
  
  constructor(private http: HttpClient, private router: Router) {}

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private loadUser(): User | null {
    try {
      const userJson = localStorage.getItem(this.USER_KEY);
      return userJson ? (JSON.parse(userJson) as User) : null;
    } catch {
      // Handle corrupted localStorage data
      localStorage.removeItem(this.USER_KEY);
      return null;
    }
  }

  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password });
  }

  requestRecovery(email: string) {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/recover-request`, { email });
  }

  resetPassword(token: string, password: string) {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/auth/recover-password`, { token, password });
  }

  setAuth(token: string, user: User) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.userSignal.set(user);
  }

  logout() {
    console.log('[AuthService] 🚨 logout() called! Token being cleared!');
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.userSignal.set(null);
    void this.router.navigate(['/']);
  }

  isSuperintendente(): boolean {
    const rol = this.currentUser()?.rol;
    return rol === 'SUPERINTENDENTE' || rol === 'SUPER_ADMIN';
  }

  isAnciano(): boolean {
    const rol = this.currentUser()?.rol;
    return rol === 'ANCIANO' || rol === 'SUPER_ADMIN';
  }

  isVisitante(): boolean {
    return this.currentUser()?.rol === 'VISITANTE';
  }

  isSuperAdmin(): boolean {
    return this.currentUser()?.rol === 'SUPER_ADMIN';
  }

  getUsers() {
    return this.http.get<{ data: User[] }>(`${environment.apiUrl}/users`)
      .pipe(
        map(response => response.data)
      );
  }
}
