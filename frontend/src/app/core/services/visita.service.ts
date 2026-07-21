import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';

export interface CasaInfo {
  calle_principal: string;
  numeracion: string;
  calle_secundaria?: string;
  sector: string;
  referencia?: string;
  latitud?: number;
  longitud?: number;
  foto_url?: string;
}

export interface Visita {
  id: string;
  casa_id: string;
  casa?: CasaInfo;
  fecha_programada: string;
  fecha_realizada?: string;
  visitante_1_id: string;
  visitante_2_id: string;
  visitante_1_nombre?: string;
  visitante_2_nombre?: string;
  observaciones?: string;
  desea_seguir_recibiendo?: boolean;
  estado: 'PROGRAMADA' | 'REALIZADA' | 'CANCELADA';
}

export interface VisitaListResponse {
  data: Visita[];
  total: number;
}

export interface VisitaStats {
  total_casas: number;
  casas_no_visitar: number;
  casas_en_espera: number;
  casas_recontactadas: number;
  casas_activas: number;
  visitas_mes: number;
}

@Injectable({ providedIn: 'root' })
export class VisitaService {
  private loadingSignal = signal(false);

  loading = this.loadingSignal.asReadonly();

  constructor(private http: HttpClient) {}

  loadVisitas(filters: { casa_id?: string; estado?: string; page?: number } = {}) {
    this.loadingSignal.set(true);
    
    let params = new HttpParams();
    if (filters.casa_id) params = params.set('casa_id', filters.casa_id);
    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.page) params = params.set('page', filters.page.toString());

    return this.http.get<VisitaListResponse>(`${environment.apiUrl}/visitas`, { params })
      .pipe(
        tap(() => this.loadingSignal.set(false))
      );
  }

  getVisita(id: string) {
    return this.http.get<Visita>(`${environment.apiUrl}/visitas/${id}`);
  }

  createVisita(visita: Partial<Visita>) {
    return this.http.post<Visita>(`${environment.apiUrl}/visitas`, visita);
  }

  updateVisita(id: string, visita: Partial<Visita>) {
    return this.http.put<Visita>(`${environment.apiUrl}/visitas/${id}`, visita);
  }

  deleteVisita(id: string) {
    return this.http.delete(`${environment.apiUrl}/visitas/${id}`);
  }

  getStats() {
    return this.http.get<VisitaStats>(`${environment.apiUrl}/visitas/stats`);
  }
}
