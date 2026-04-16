import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';

export interface ProgramaVisita {
  id: string;
  programa_predicacion_id?: string;
  fecha: string;
  dia_semana: number;
  dia_semana_nombre: string;
  conductor: string;
  hora: string;
  lugar_nombre: string;
  lugar_direccion: string;
  lugar_ciudad: string;
  lugar_provincia: string;
  lugar_codigo_postal: string;
  lugar_pais: string;
  lugar_ubicacion: string; // URL Google Maps o coordenadas
  lugar_contacto: string;
  lugar_telefono: string;
  grupo?: {
    id: string;
    numero: number;
    nombre: string;
  };
  territorios?: {
    id: string;
    nombre: string;
    grupo_id: string;
  }[];
  observaciones: string;
  visited: boolean;
  created_at: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class ProgramaVisitaService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  loadVisitas() {
    return this.http.get<{ data: ProgramaVisita[] }>(`${this.apiUrl}/programas-visita`)
      .pipe(
        tap(response => {
          // Normalize each visita
        })
      );
  }

  getVisitasByFecha(fecha: string) {
    return this.http.get<{ data: ProgramaVisita[] }>(`${this.apiUrl}/programas-visita/by-fecha?fecha=${fecha}`);
  }

  createVisita(data: Partial<ProgramaVisita>) {
    return this.http.post<ProgramaVisita>(`${this.apiUrl}/programas-visita`, data);
  }

  updateVisita(id: string, data: Partial<ProgramaVisita>) {
    return this.http.put<ProgramaVisita>(`${this.apiUrl}/programas-visita/${id}`, data);
  }

  deleteVisita(id: string) {
    return this.http.delete(`${this.apiUrl}/programas-visita/${id}`);
  }

  setVisited(id: string, visited: boolean) {
    return this.http.put(`${this.apiUrl}/programas-visita/${id}/visited?visited=${visited}`, {});
  }
}