import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  nombre: string;
  telefono?: string;
  email: string;
  rol: 'SUPERINTENDENTE' | 'ANCIANO' | 'VISITANTE';
  activo: boolean;
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
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password });
  }

  setAuth(token: string, user: User) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.userSignal.set(user);
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.userSignal.set(null);
  }

  isSuperintendente(): boolean {
    return this.currentUser()?.rol === 'SUPERINTENDENTE';
  }

  isAnciano(): boolean {
    return this.currentUser()?.rol === 'ANCIANO';
  }

  isVisitante(): boolean {
    return this.currentUser()?.rol === 'VISITANTE';
  }

  getUsers() {
    return this.http.get<User[]>(`${environment.apiUrl}/users`);
  }
}
