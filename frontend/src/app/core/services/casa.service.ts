import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Visita } from './visita.service';

export interface Casa {
  id: string;
  calle_principal: string;
  numeracion: string;
  calle_secundaria?: string;
  sector: string;
  referencia?: string;
  motivo_no_volver: string;
  fecha_registro: string;
  persona_registra: string;
  estado: 'NO_VISITAR' | 'EN_ESPERA_VISITA' | 'RECONTACTADA' | 'ACTIVA';
  latitud?: number;
  longitud?: number;
  foto_url?: string;
  visitas?: Visita[];
}

export interface CasaListResponse {
  data: Casa[];
  total: number;
  page: number;
}

@Injectable({ providedIn: 'root' })
export class CasaService {
  casasSignal = signal<Casa[]>([]);
  private loadingSignal = signal(false);
  totalSignal = signal(0);
  private currentPageSignal = signal(1);

  casas = computed(() => this.casasSignal());
  loading = computed(() => this.loadingSignal());
  total = computed(() => this.totalSignal());
  currentPage = computed(() => this.currentPageSignal());

  constructor(private http: HttpClient) {}

  loadCasas(filters: { sector?: string; estado?: string; search?: string; page?: number } = {}) {
    this.loadingSignal.set(true);
    
    let params = new HttpParams();
    if (filters.sector) params = params.set('sector', filters.sector);
    if (filters.estado) params = params.set('estado', filters.estado);
    if (filters.search) params = params.set('search', filters.search);
    if (filters.page) params = params.set('page', filters.page.toString());

    return this.http.get<CasaListResponse>(`${environment.apiUrl}/casas`, { params })
      .pipe(
        tap(response => {
          this.casasSignal.set(response.data);
          this.totalSignal.set(response.total);
          this.currentPageSignal.set(response.page);
          this.loadingSignal.set(false);
        }),
        catchError(error => {
          this.loadingSignal.set(false);
          throw error;
        })
      );
  }

  getCasa(id: string) {
    return this.http.get<Casa>(`${environment.apiUrl}/casas/${id}`);
  }

  createCasa(casa: Partial<Casa>) {
    return this.http.post<Casa>(`${environment.apiUrl}/casas`, casa);
  }

  updateCasa(id: string, casa: Partial<Casa>) {
    return this.http.put<Casa>(`${environment.apiUrl}/casas/${id}`, casa);
  }

  deleteCasa(id: string) {
    return this.http.delete(`${environment.apiUrl}/casas/${id}`);
  }

  uploadFoto(casaId: string, file: File) {
    const formData = new FormData();
    formData.append('foto', file);
    return this.http.post<Casa>(`${environment.apiUrl}/casas/${casaId}/foto`, formData);
  }

  getSectores() {
    return this.http.get<{ data: string[] }>(`${environment.apiUrl}/casas/sectores`);
  }
}
