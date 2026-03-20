import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';

export interface Semana {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  nombre: string;
  created_at: string;
}

export interface Dia {
  id: string;
  semana_id: string;
  dia_semana: number;
  territorio_manana_id?: string;
  territorio_tarde_id?: string;
  grupo_asignado_id?: string;
  territorio_manana?: any;
  territorio_tarde?: any;
  grupo_asignado?: any;
}

export interface SemanaDetail extends Semana {
  dias: Dia[];
}

@Injectable({ providedIn: 'root' })
export class SemanaService {
  private semanasSignal = signal<Semana[]>([]);
  private loadingSignal = signal(false);

  semanas = computed(() => this.semanasSignal());
  loading = computed(() => this.loadingSignal());

  constructor(private http: HttpClient) {}

  loadSemanas() {
    this.loadingSignal.set(true);
    return this.http.get<{ data: Semana[] }>(`${environment.apiUrl}/semanas`)
      .pipe(
        tap(response => {
          this.semanasSignal.set(response.data);
          this.loadingSignal.set(false);
        })
      );
  }

  getSemana(id: string) {
    return this.http.get<SemanaDetail>(`${environment.apiUrl}/semanas/${id}`);
  }

  getDias(semanaId: string) {
    return this.http.get<{ data: Dia[] }>(`${environment.apiUrl}/semanas/${semanaId}/dias`);
  }

  createSemana(data: { fecha_inicio: string; nombre: string }) {
    return this.http.post<Semana>(`${environment.apiUrl}/semanas`, data);
  }

  updateSemana(id: string, data: { nombre: string }) {
    return this.http.put<Semana>(`${environment.apiUrl}/semanas/${id}`, data);
  }

  deleteSemana(id: string) {
    return this.http.delete(`${environment.apiUrl}/semanas/${id}`);
  }

  updateDia(id: string, data: Partial<Dia>) {
    return this.http.put<Dia>(`${environment.apiUrl}/dias/${id}`, data);
  }
}
