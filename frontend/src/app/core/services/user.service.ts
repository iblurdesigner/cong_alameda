import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { map } from 'rxjs/operators';

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  telefono?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  getUsers() {
    return this.http.get<{data: User[]}>(`${environment.apiUrl}/users`).pipe(
      map(res => res.data)
    );
  }
}
