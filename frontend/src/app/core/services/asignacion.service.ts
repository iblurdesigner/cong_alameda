import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';

export interface TipoAsignacion {
  id: string;
  nombre: string;
  descripcion?: string;
  icono?: string;
}

export interface Asignacion {
  id: string;
  semana_id: string;
  tipo_asignacion_id: string;
  user_id?: string;
  grupo_id?: string;
  dia_semana: number;
  observaciones?: string;
  tipo_asignacion?: TipoAsignacion;
  user?: { id: string; nombre: string; email?: string; rol?: string };
  grupo?: { id: string; nombre: string; numero?: number };
  created_at: string;
}

export interface SemanaConAsignaciones {
  id: string;
  fecha_inicio: string;
  fecha_fin: string;
  nombre: string;
  dias: { dia_semana: number; fecha: string }[];
  asignaciones: Asignacion[];
}

@Injectable({ providedIn: 'root' })
export class AsignacionService {
  private tiposSignal = signal<TipoAsignacion[]>([]);
  private asignacionesSignal = signal<Asignacion[]>([]);
  private semanaActualSignal = signal<SemanaConAsignaciones | null>(null);
  private loadingSignal = signal(false);

  tipos = computed(() => this.tiposSignal());
  asignaciones = computed(() => this.asignacionesSignal());
  semanaActual = computed(() => this.semanaActualSignal());
  loading = computed(() => this.loadingSignal());

  constructor(private http: HttpClient) {}

  loadTiposAsignacion() {
    return this.http.get<{ data: TipoAsignacion[] }>(`${environment.apiUrl}/tipos-asignacion`)
      .pipe(
        tap(response => this.tiposSignal.set(response.data))
      );
  }

  loadAsignaciones() {
    this.loadingSignal.set(true);
    return this.http.get<{ data: Asignacion[] }>(`${environment.apiUrl}/asignaciones`)
      .pipe(
        tap(response => {
          this.asignacionesSignal.set(response.data);
          this.loadingSignal.set(false);
        })
      );
  }

  loadAsignacionesBySemana(semanaId: string) {
    this.loadingSignal.set(true);
    return this.http.get<SemanaConAsignaciones>(`${environment.apiUrl}/asignaciones/semana/${semanaId}`)
      .pipe(
        tap(response => {
          this.semanaActualSignal.set(response);
          this.loadingSignal.set(false);
        })
      );
  }

  createAsignacion(data: {
    semana_id: string;
    tipo_asignacion_id: string;
    user_id: string | null;
    grupo_id?: string | null;
    dia_semana: number;
    observaciones?: string;
  }) {
    return this.http.post(`${environment.apiUrl}/asignaciones`, data);
  }

  bulkCreateAsignaciones(semanaId: string, asignaciones: { tipo_asignacion_id: string; user_id: string | null; grupo_id: string | null; dia_semana: number; fecha?: string }[]) {
    return this.http.post(`${environment.apiUrl}/asignaciones/bulk`, {
      semana_id: semanaId,
      asignaciones: asignaciones
    });
  }

  updateAsignacion(id: string, userId?: string, grupoId?: string, observaciones?: string) {
    return this.http.put(`${environment.apiUrl}/asignaciones/${id}`, {
      user_id: userId || null,
      grupo_id: grupoId || null,
      observaciones: observaciones
    });
  }

  deleteAsignacion(id: string) {
    return this.http.delete(`${environment.apiUrl}/asignaciones/${id}`);
  }
}
