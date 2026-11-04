import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable, tap } from 'rxjs';

export interface PublicadorVyM {
  id: string;
  publicador_id: string;
  nombres: string;
  apellidos: string;
  celular?: string;
  activo: boolean;
  notas?: string;
  created_at?: string;
  updated_at?: string;
  // computed
  nombre_completo?: string;
}

export interface DisponibilidadVyM {
  publicador_vym_id: string;
  publicador_id: string;
  nombres: string;
  apellidos: string;
  celular?: string;
  activo: boolean;
  ultima_asignacion?: string; // ISO date
  semanas_cooldown: number;
  disponible: boolean;
  fecha_disponible?: string; // ISO date — cuándo estará disponible
  // computed
  nombre_completo?: string;
}

export type EstadoDisponibilidad = 'disponible' | 'pronto' | 'no-disponible';

export function getEstadoDisponibilidad(d: DisponibilidadVyM): EstadoDisponibilidad {
  if (d.disponible) return 'disponible';
  if (d.semanas_cooldown >= 4) return 'pronto'; // 4-5 semanas: pronto disponible
  return 'no-disponible';
}

export function getLabelDisponibilidad(d: DisponibilidadVyM): string {
  if (d.disponible) return 'Disponible';
  if (d.fecha_disponible) {
    const fecha = new Date(d.fecha_disponible + 'T00:00:00');
    const opciones: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
    return `Disponible desde ${fecha.toLocaleDateString('es-EC', opciones)}`;
  }
  return `${d.semanas_cooldown} sem. transcurridas`;
}

@Injectable({ providedIn: 'root' })
export class PublicadorVymService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/publicadores-vym`;

  publicadoresVym = signal<PublicadorVyM[]>([]);
  disponibilidad = signal<DisponibilidadVyM[]>([]);

  loadAll(): Observable<PublicadorVyM[]> {
    return this.http.get<PublicadorVyM[]>(this.apiUrl).pipe(
      tap(list => {
        const enriched = list.map(p => ({
          ...p,
          nombre_completo: `${p.nombres} ${p.apellidos}`.trim(),
        }));
        this.publicadoresVym.set(enriched);
      })
    );
  }

  loadDisponibilidad(semanaId?: string): Observable<DisponibilidadVyM[]> {
    let params = new HttpParams();
    if (semanaId) params = params.set('semana_id', semanaId);

    return this.http.get<DisponibilidadVyM[]>(`${this.apiUrl}/disponibilidad`, { params }).pipe(
      tap(list => {
        const enriched = list.map(d => ({
          ...d,
          nombre_completo: `${d.nombres} ${d.apellidos}`.trim(),
        }));
        this.disponibilidad.set(enriched);
      })
    );
  }

  add(publicadorId: string, notas: string = ''): Observable<PublicadorVyM> {
    return this.http.post<PublicadorVyM>(this.apiUrl, { publicador_id: publicadorId, notas }).pipe(
      tap(() => this.loadAll().subscribe())
    );
  }

  update(id: string, activo: boolean, notas: string = ''): Observable<PublicadorVyM> {
    return this.http.put<PublicadorVyM>(`${this.apiUrl}/${id}`, { activo, notas }).pipe(
      tap(() => this.loadAll().subscribe())
    );
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loadAll().subscribe())
    );
  }

  syncHistorial(payload: SyncHistorialPayload): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/historial`, payload);
  }
}

export interface SyncHistorialItem {
  publicador_vym_id: string;
  rol: 'estudiante' | 'ayudante';
}

export interface SyncHistorialPayload {
  semana_id: string;
  fecha_semana: string; // YYYY-MM-DD
  auditorio: SyncHistorialItem[];
  auxiliar: SyncHistorialItem[];
}

