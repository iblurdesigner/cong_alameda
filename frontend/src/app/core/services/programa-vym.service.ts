import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface MinistryItem {
  type: string;
  title: string;
  time: string;
  student: string;
  assistant?: string;
  startTime: string;
}

export interface ChristianLifeItem {
  title: string;
  time: string;
  speaker: string;
  startTime: string;
}

export interface ProgramaVyM {
  id?: string;
  semana_id: string;
  nombre_congregacion: string;
  lectura_semanal: string;
  presidente: string;
  consejero_auxiliar: string;
  cancion_inicio: string;
  hora_cancion_inicio: string;
  oracion_inicio: string;
  hora_oracion_inicio: string;
  tesoros_titulo: string;
  tesoros_tiempo: string;
  tesoros_discursante: string;
  perlas_tiempo: string;
  perlas_discursante: string;
  lectura_tiempo: string;
  lectura_estudiante: string;
  cancion_medio: string;
  cancion_medio_tiempo: string;
  estudio_conductor: string;
  estudio_lector: string;
  estudio_tiempo: string;
  conclusion_tiempo: string;
  cancion_fin: string;
  cancion_fin_tiempo: string;
  oracion_fin: string;
  seamos_maestros_auditorio: MinistryItem[];
  seamos_maestros_auxiliar: MinistryItem[];
  vida_cristiana_partes: ChristianLifeItem[];
  created_at?: string;
  updated_at?: string;
}

export function createDefaultProgramaVyM(semanaId: string = ''): ProgramaVyM {
  return {
    semana_id: semanaId,
    nombre_congregacion: 'ALAMEDA',
    lectura_semanal: 'LECTURA SEMANAL DE LA BIBLIA',
    presidente: '',
    consejero_auxiliar: 'Asdrúbal Ayala',
    cancion_inicio: '',
    hora_cancion_inicio: '19:00',
    oracion_inicio: '',
    hora_oracion_inicio: '19:04',
    tesoros_titulo: '',
    tesoros_tiempo: '10 mins.',
    tesoros_discursante: '',
    perlas_tiempo: '10 mins.',
    perlas_discursante: '',
    lectura_tiempo: '4 mins.',
    lectura_estudiante: '',
    cancion_medio: '',
    cancion_medio_tiempo: '19:45',
    estudio_conductor: '',
    estudio_lector: '',
    estudio_tiempo: '30 mins.',
    conclusion_tiempo: '20:33',
    cancion_fin: '',
    cancion_fin_tiempo: '20:36',
    oracion_fin: '',
    seamos_maestros_auditorio: [
      { type: 'Asignación', title: 'Lectura de la Biblia', time: '4 mins.', student: '', startTime: '19:30' },
      { type: 'Asignación', title: 'Primera conversación', time: '3 mins.', student: '', startTime: '19:35' },
      { type: 'Asignación', title: 'Revisita', time: '4 mins.', student: '', startTime: '19:39' }
    ],
    seamos_maestros_auxiliar: [
      { type: 'Asignación', title: 'Lectura de la Biblia', time: '4 mins.', student: '', startTime: '19:30' },
      { type: 'Asignación', title: 'Primera conversación', time: '3 mins.', student: '', startTime: '19:35' },
      { type: 'Asignación', title: 'Revisita', time: '4 mins.', student: '', startTime: '19:39' }
    ],
    vida_cristiana_partes: [
      { title: 'Necesidades de la congregación', time: '15 mins.', speaker: '', startTime: '19:50' }
    ]
  };
}

@Injectable({
  providedIn: 'root'
})
export class ProgramaVyMService {
  private http = inject(HttpClient);
  
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);

  getProgramaBySemana(semanaId: string): Observable<ProgramaVyM | null> {
    this.loading.set(true);
    return this.http.get<{ data: ProgramaVyM }>(`${environment.apiUrl}/programa-vym/semana/${semanaId}`).pipe(
      map(res => res.data),
      tap({
        next: () => this.loading.set(false),
        error: () => this.loading.set(false)
      })
    );
  }

  savePrograma(semanaId: string, programa: Partial<ProgramaVyM>): Observable<ProgramaVyM> {
    this.saving.set(true);
    return this.http.post<{ data: ProgramaVyM }>(`${environment.apiUrl}/programa-vym/semana/${semanaId}`, programa).pipe(
      map(res => res.data),
      tap({
        next: () => this.saving.set(false),
        error: () => this.saving.set(false)
      })
    );
  }

  deletePrograma(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/programa-vym/${id}`);
  }
}
