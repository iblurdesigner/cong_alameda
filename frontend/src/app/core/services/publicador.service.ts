import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap, map } from 'rxjs/operators';
import { Observable } from 'rxjs';

export interface Publicador {
  id: string;
  nombres: string;
  apellidos: string;
  nombre?: string;
  celular?: string;
  telefono?: string;
  email?: string;
  domicilio?: string;
  grupo_id?: string;
  grupo_numero?: number;
  grupo_nombre?: string;
  contacto_emergencia_nombre?: string;
  contacto_emergencia_telefono?: string;
  contacto_emergencia_parentesco?: string;
  observaciones?: string;
  activo: boolean;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePublicadorRequest {
  nombres: string;
  apellidos: string;
  nombre?: string;
  celular?: string;
  telefono?: string;
  email?: string;
  domicilio?: string;
  grupo_id?: string;
  contacto_emergencia_nombre?: string;
  contacto_emergencia_telefono?: string;
  contacto_emergencia_parentesco?: string;
  observaciones?: string;
  activo?: boolean;
  user_id?: string;
}

export interface UpdatePublicadorRequest {
  nombres?: string;
  apellidos?: string;
  nombre?: string;
  celular?: string;
  telefono?: string;
  email?: string;
  domicilio?: string;
  grupo_id?: string;
  contacto_emergencia_nombre?: string;
  contacto_emergencia_telefono?: string;
  contacto_emergencia_parentesco?: string;
  observaciones?: string;
  activo?: boolean;
  user_id?: string;
}

@Injectable({ providedIn: 'root' })
export class PublicadorService {
  private publicadoresSignal = signal<Publicador[]>([]);
  private loadingSignal = signal<boolean>(false);

  publicadores = computed(() => this.publicadoresSignal());
  loading = computed(() => this.loadingSignal());

  constructor(private http: HttpClient) {}

  loadPublicadores(search?: string, grupoId?: string, activoOnly?: boolean): Observable<Publicador[]> {
    this.loadingSignal.set(true);
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (grupoId) params = params.set('grupo_id', grupoId);
    if (activoOnly !== undefined) params = params.set('activo', String(activoOnly));

    return this.http.get<{ data: Publicador[] }>(`${environment.apiUrl}/publicadores`, { params })
      .pipe(
        map(res => res.data),
        tap(data => {
          this.publicadoresSignal.set(data);
          this.loadingSignal.set(false);
        })
      );
  }

  getPublicador(id: string): Observable<Publicador> {
    return this.http.get<{ data: Publicador }>(`${environment.apiUrl}/publicadores/${id}`)
      .pipe(map(res => res.data));
  }

  createPublicador(data: CreatePublicadorRequest): Observable<Publicador> {
    return this.http.post<{ data: Publicador }>(`${environment.apiUrl}/publicadores`, data)
      .pipe(
        map(res => res.data),
        tap(nuevo => {
          this.publicadoresSignal.update(list => [...list, nuevo]);
        })
      );
  }

  updatePublicador(id: string, data: UpdatePublicadorRequest): Observable<Publicador> {
    return this.http.put<{ data: Publicador }>(`${environment.apiUrl}/publicadores/${id}`, data)
      .pipe(
        map(res => res.data),
        tap(actualizado => {
          this.publicadoresSignal.update(list =>
            list.map(p => p.id === id ? actualizado : p)
          );
        })
      );
  }

  deletePublicador(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/publicadores/${id}`)
      .pipe(
        tap(() => {
          this.publicadoresSignal.update(list => list.filter(p => p.id !== id));
        })
      );
  }
}
