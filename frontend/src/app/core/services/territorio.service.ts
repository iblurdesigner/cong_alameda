import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { tap } from 'rxjs/operators';

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
export class TerritorioService {
  private territoriosSignal = signal<Territorio[]>([]);
  private loadingSignal = signal(false);

  territorios = computed(() => this.territoriosSignal());
  loading = computed(() => this.loadingSignal());

  constructor(private http: HttpClient) {}

  loadTerritorios(grupoId?: string) {
    this.loadingSignal.set(true);
    let params = new HttpParams();
    if (grupoId) params = params.set('grupo_id', grupoId);

    return this.http.get<{ data: Territorio[] }>(`${environment.apiUrl}/territorios`, { params })
      .pipe(
        tap(response => {
          this.territoriosSignal.set(response.data);
          this.loadingSignal.set(false);
        })
      );
  }

  getTerritorio(id: string) {
    return this.http.get<Territorio>(`${environment.apiUrl}/territorios/${id}`);
  }

  uploadTerritorio(grupoId: string, nombre: string, file: File, subidoPor: string = 'Usuario') {
    const formData = new FormData();
    formData.append('grupo_id', grupoId);
    formData.append('nombre', nombre);
    formData.append('file', file);
    formData.append('subido_por', subidoPor);
    return this.http.post<Territorio>(`${environment.apiUrl}/territorios/upload`, formData);
  }

  downloadTerritorio(id: string, filename: string) {
    return this.http.get(`${environment.apiUrl}/territorios/${id}/descargar`, { responseType: 'blob' })
      .pipe(
        tap(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          window.URL.revokeObjectURL(url);
        })
      );
  }

  deleteTerritorio(id: string) {
    return this.http.delete(`${environment.apiUrl}/territorios/${id}`);
  }
}
