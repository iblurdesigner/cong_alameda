import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';

export interface GrupoSimple {
  id: string;
  numero: number;
  nombre: string;
}

export interface TerritorioSimple {
  id: string;
  nombre: string;
  grupo_id: string;
}

export interface ProgramaPredicacion {
  id: string;
  nombre: string;
  fecha: string;
  dia_semana: number;
  dia_semana_nombre: string;
  conductor: string;
  hora_inicio: string;
  hora_fin: string;
  lugar_nombre: string;
  lugar_direccion: string;
  lugar_contacto: string;
  lugar_telefono: string;
  grupo?: GrupoSimple;
  territorios?: TerritorioSimple[];
  created_at: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class ProgramaPredicacionService {
  private programasSignal = signal<ProgramaPredicacion[]>([]);

  programas = computed(() => this.programasSignal());

  constructor(private http: HttpClient) {}

  loadProgramas() {
    return this.http.get<{ data: ProgramaPredicacion[] }>(`${environment.apiUrl}/programas-predicacion`)
      .pipe(
        tap(response => {
          // Normalize territorios to always be an array (backend might send null)
          const normalized = response.data.map(p => ({
            ...p,
            territorios: p.territorios || []
          }));
          this.programasSignal.set(normalized);
        })
      );
  }

  getPrograma(id: string) {
    return this.http.get<ProgramaPredicacion>(`${environment.apiUrl}/programas-predicacion/${id}`);
  }

  createPrograma(data: Partial<ProgramaPredicacion>) {
    return this.http.post<ProgramaPredicacion>(`${environment.apiUrl}/programas-predicacion`, data);
  }

  updatePrograma(id: string, data: Partial<ProgramaPredicacion>) {
    return this.http.put<ProgramaPredicacion>(`${environment.apiUrl}/programas-predicacion/${id}`, data);
  }

  deletePrograma(id: string) {
    return this.http.delete(`${environment.apiUrl}/programas-predicacion/${id}`);
  }
}