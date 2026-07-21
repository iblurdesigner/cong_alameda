import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';

export interface Grupo {
  id: string;
  nombre: string;
  numero: number;
  descripcion?: string;
  direccion?: string;
  contacto?: string;
  conductor?: string;
  horario?: string;
  activo: boolean;
  territorio_count?: number;
  created_at?: string;
}

export interface GrupoDetail extends Grupo {
  territorios: Territorio[];
}

export interface Territorio {
  id: string;
  grupo_id: string;
  nombre: string;
  nombre_original: string;
  archivo_pdf: string;
  tamano: number;
  subido_por: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class GrupoService {
  private gruposSignal = signal<Grupo[]>([]);
  private loadingSignal = signal(false);

  grupos = computed(() => this.gruposSignal());
  loading = computed(() => this.loadingSignal());

  constructor(private http: HttpClient) {}

  loadGrupos() {
    this.loadingSignal.set(true);
    return this.http.get<{ data: Grupo[] }>(`${environment.apiUrl}/grupos`)
      .pipe(
        tap(response => {
          this.gruposSignal.set(response.data);
          this.loadingSignal.set(false);
        })
      );
  }

  getGrupo(id: string) {
    return this.http.get<GrupoDetail>(`${environment.apiUrl}/grupos/${id}`);
  }

  createGrupo(data: Partial<Grupo>) {
    return this.http.post<Grupo>(`${environment.apiUrl}/grupos`, data);
  }

  updateGrupo(id: string, data: Partial<Grupo>) {
    return this.http.put<Grupo>(`${environment.apiUrl}/grupos/${id}`, data);
  }

  deleteGrupo(id: string) {
    return this.http.delete(`${environment.apiUrl}/grupos/${id}`);
  }
}
