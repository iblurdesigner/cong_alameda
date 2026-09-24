import { Component, inject, OnInit, AfterViewInit, OnDestroy, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SemanaService, Semana } from '../../../core/services/semana.service';
import { UserService, User } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { 
  ProgramaVyMService, 
  ProgramaVyM, 
  createDefaultProgramaVyM 
} from '../../../core/services/programa-vym.service';

export interface EstudianteS89Item {
  id: string;
  numero: number;
  titulo: string;
  tiempo: string;
  sala: 'Auditorio Principal' | 'Sala Auxiliar';
  estudiante: string;
  ayudante?: string;
  telefono: string;
  telefonoManual?: string;
  mensajeRaw: string;
}

@Component({
  selector: 'app-vida-ministerio',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './vida-ministerio.component.html',
  styleUrls: ['./vida-ministerio.component.scss']
})
export class VidaMinisterioComponent implements OnInit, AfterViewInit, OnDestroy {
  private semanaService = inject(SemanaService);
  private userService = inject(UserService);
  private vymService = inject(ProgramaVyMService);
  public authService = inject(AuthService);

  // Semanas
  semanas = computed(() => this.semanaService.semanas());
  selectedSemanaId = signal<string>('');
  selectedSemana = computed(() => {
    const id = this.selectedSemanaId();
    return this.semanas().find(s => s.id === id) || null;
  });

  // Historial rápido del último mes (4-5 semanas recientes + próximas)
  semanasRecientes = computed(() => {
    const list = [...this.semanas()];
    list.sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio));
    return list.slice(0, 8);
  });

  // Usuarios para autocompletado
  users = signal<User[]>([]);

  // Estado de los 2 programas para la hoja A4
  activeCopy = signal<'program1' | 'program2'>('program1');
  p1 = signal<ProgramaVyM>(createDefaultProgramaVyM());
  p2 = signal<ProgramaVyM>(createDefaultProgramaVyM());

  // Mensajes de feedback
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  statusMessage = signal<{ text: string; type: 'success' | 'error' } | null>(null);

  // Control de vista adaptable en dispositivos móviles y tabletas
  mobileTab = signal<'editor' | 'preview' | 'split'>('editor');
  fitPreviewMobile = signal<boolean>(true);
  previewScale = signal<number>(1);
  private resizeObserver?: ResizeObserver;

  // Centro de Notificaciones y Boletas S-89
  showS89Modal = signal<boolean>(false);
  filterS89Sala = signal<'todas' | 'Auditorio Principal' | 'Sala Auxiliar'>('todas');
  selectedS89Preview = signal<EstudianteS89Item | null>(null);
  copiedS89Id = signal<string | null>(null);

  estudiantesS89 = computed<EstudianteS89Item[]>(() => {
    const prog = this.activeCopy() === 'program1' ? this.p1() : this.p2();
    const sem = this.selectedSemana();
    const semTitle = sem ? this.formatDateRange(sem) : 'Esta semana';
    const cong = prog.nombre_congregacion || 'Alameda';
    const usersList = this.users();
    const items: EstudianteS89Item[] = [];

    const findPhone = (name: string): string => {
      if (!name) return '';
      const cleanName = name.trim().toLowerCase();
      const u = usersList.find(usr => usr.nombre.trim().toLowerCase() === cleanName);
      return u?.telefono || '';
    };

    // 1. Lectura de la Biblia (Asignación 3)
    if (prog.lectura_estudiante && prog.lectura_estudiante.trim()) {
      const tel = findPhone(prog.lectura_estudiante);
      const msg = this.buildS89Message({
        estudiante: prog.lectura_estudiante,
        numero: 3,
        titulo: 'Lectura de la Biblia',
        tiempo: '4 min.',
        sala: 'Auditorio Principal',
        congregacion: cong,
        semana: semTitle
      });
      items.push({
        id: 'lectura-auditorio',
        numero: 3,
        titulo: 'Lectura de la Biblia',
        tiempo: '4 min.',
        sala: 'Auditorio Principal',
        estudiante: prog.lectura_estudiante,
        telefono: tel,
        mensajeRaw: msg
      });
    }

    // 2. Seamos Mejores Maestros - Auditorio Principal
    (prog.seamos_maestros_auditorio || []).forEach((m, idx) => {
      if (m.student && m.student.trim()) {
        const num = idx + 4;
        let studentName = m.student.trim();
        let assistantName = m.assistant?.trim() || '';

        if (!assistantName && studentName.includes('/')) {
          const parts = studentName.split('/');
          studentName = parts[0].trim();
          assistantName = parts[1].trim();
        }

        const tel = findPhone(studentName);
        const msg = this.buildS89Message({
          estudiante: studentName,
          ayudante: assistantName,
          numero: num,
          titulo: m.title || 'Asignación estudiantil',
          tiempo: m.time || '3-4 min.',
          sala: 'Auditorio Principal',
          congregacion: cong,
          semana: semTitle
        });
        items.push({
          id: `ministry-aud-${idx}`,
          numero: num,
          titulo: m.title || 'Asignación estudiantil',
          tiempo: m.time || '3-4 min.',
          sala: 'Auditorio Principal',
          estudiante: studentName,
          ayudante: assistantName,
          telefono: tel,
          mensajeRaw: msg
        });
      }
    });

    // 3. Seamos Mejores Maestros - Sala Auxiliar
    (prog.seamos_maestros_auxiliar || []).forEach((m, idx) => {
      if (m.student && m.student.trim()) {
        const num = idx + 4;
        let studentName = m.student.trim();
        let assistantName = m.assistant?.trim() || '';

        if (!assistantName && studentName.includes('/')) {
          const parts = studentName.split('/');
          studentName = parts[0].trim();
          assistantName = parts[1].trim();
        }

        const tel = findPhone(studentName);
        const msg = this.buildS89Message({
          estudiante: studentName,
          ayudante: assistantName,
          numero: num,
          titulo: m.title || 'Asignación estudiantil',
          tiempo: m.time || '3-4 min.',
          sala: 'Sala Auxiliar',
          congregacion: cong,
          semana: semTitle
        });
        items.push({
          id: `ministry-aux-${idx}`,
          numero: num,
          titulo: m.title || 'Asignación estudiantil',
          tiempo: m.time || '3-4 min.',
          sala: 'Sala Auxiliar',
          estudiante: studentName,
          ayudante: assistantName,
          telefono: tel,
          mensajeRaw: msg
        });
      }
    });

    return items;
  });

  filteredEstudiantesS89 = computed(() => {
    const filter = this.filterS89Sala();
    const list = this.estudiantesS89();
    if (filter === 'todas') return list;
    return list.filter(item => item.sala === filter);
  });

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      if (window.innerWidth >= 1280) {
        this.mobileTab.set('split');
      } else {
        this.mobileTab.set('editor');
      }
    }
    this.loadInitialData();
  }

  ngAfterViewInit(): void {
    if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
      const container = document.querySelector('.preview-container') as HTMLElement;
      if (container) {
        this.resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            this.updatePreviewScale(entry.contentRect.width);
          }
        });
        this.resizeObserver.observe(container);
      }
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  setMobileTab(tab: 'editor' | 'preview' | 'split'): void {
    this.mobileTab.set(tab);
    setTimeout(() => this.recalculateScale(), 60);
  }

  toggleFitPreview(): void {
    this.fitPreviewMobile.update(v => !v);
    this.recalculateScale();
  }

  recalculateScale(): void {
    if (typeof document === 'undefined') return;
    const container = document.querySelector('.preview-container') as HTMLElement;
    if (container && container.clientWidth > 0) {
      this.updatePreviewScale(container.clientWidth);
    }
  }

  updatePreviewScale(containerWidth: number): void {
    if (!this.fitPreviewMobile()) {
      this.previewScale.set(1);
      return;
    }
    // Ancho exacto de A4 en px: 210mm a 96dpi ≈ 793.7px
    // Dejamos 32px de margen lateral
    const availableWidth = Math.max(260, containerWidth - 32);
    const scale = Math.min(1, availableWidth / 794);
    this.previewScale.set(Math.round(scale * 1000) / 1000);
  }

  buildS89Message(data: {
    estudiante: string;
    ayudante?: string;
    numero: number;
    titulo: string;
    tiempo: string;
    sala: string;
    congregacion: string;
    semana: string;
  }): string {
    let msg = `📋 *ASIGNACIÓN: VIDA Y MINISTERIO CRISTIANOS*\n`;
    msg += `🏛️ *Congregación:* ${data.congregacion}\n`;
    msg += `🗓️ *Semana:* ${data.semana}\n\n`;
    msg += `👤 *Estudiante:* ${data.estudiante}\n`;
    if (data.ayudante && data.ayudante.trim()) {
      msg += `👥 *Ayudante:* ${data.ayudante.trim()}\n`;
    }
    msg += `📍 *Sala:* ${data.sala}\n`;
    msg += `📖 *Intervención:* Núm. ${data.numero} — ${data.titulo} (${data.tiempo})\n\n`;
    msg += `¡Muchos éxitos en tu preparación y presentación! 🙏`;
    return msg;
  }

  cleanPhoneNumber(phone: string): string {
    if (!phone) return '';
    let cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    } else if (cleaned.startsWith('0')) {
      cleaned = '593' + cleaned.substring(1);
    }
    return cleaned;
  }

  openS89Modal(): void {
    this.showS89Modal.set(true);
  }

  closeS89Modal(): void {
    this.showS89Modal.set(false);
    this.selectedS89Preview.set(null);
  }

  setFilterS89Sala(sala: 'todas' | 'Auditorio Principal' | 'Sala Auxiliar'): void {
    this.filterS89Sala.set(sala);
  }

  sendWhatsAppS89(item: EstudianteS89Item): void {
    const rawPhone = item.telefonoManual || item.telefono;
    if (!rawPhone) return;
    const phone = this.cleanPhoneNumber(rawPhone);
    const encoded = encodeURIComponent(item.mensajeRaw);
    const url = `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`;
    window.open(url, '_blank');
  }

  copyS89Message(item: EstudianteS89Item): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(item.mensajeRaw).then(() => {
        this.copiedS89Id.set(item.id);
        setTimeout(() => this.copiedS89Id.set(null), 2500);
      });
    }
  }

  previewS89Slip(item: EstudianteS89Item): void {
    this.selectedS89Preview.set(item);
  }

  closeS89SlipPreview(): void {
    this.selectedS89Preview.set(null);
  }

  printS89Slip(): void {
    window.print();
  }

  loadInitialData(): void {
    this.loading.set(true);
    // 1. Cargar usuarios para datalist
    this.userService.getUsers().subscribe({
      next: (users) => this.users.set(users || []),
      error: (err) => console.error('Error cargando usuarios:', err)
    });

    // 2. Cargar semanas
    this.semanaService.loadSemanas().subscribe({
      next: (res) => {
        this.loading.set(false);
        const list = res?.data || [];
        if (list.length > 0) {
          // Seleccionar la semana más actual
          const today = new Date().toISOString().split('T')[0];
          const closest = list.find(s => s.fecha_inicio <= today && s.fecha_fin >= today) || list[0];
          this.selectSemana(closest.id);
        }
      },
      error: (err) => {
        this.loading.set(false);
        console.error('Error cargando semanas:', err);
      }
    });
  }

  selectSemana(semanaId: string): void {
    if (!semanaId) return;
    this.selectedSemanaId.set(semanaId);
    this.loadProgramaForSemana(semanaId);
  }

  loadProgramaForSemana(semanaId: string): void {
    const sem = this.semanas().find(s => s.id === semanaId);
    this.loading.set(true);

    this.vymService.getProgramaBySemana(semanaId).subscribe({
      next: (data) => {
        this.loading.set(false);
        if (data) {
          const norm = this.normalizeProgram(data);
          this.p1.set(norm);
          this.p2.set(this.deepClone(norm));
        } else {
          this.initNewPrograma(semanaId, sem);
        }
      },
      error: () => {
        this.loading.set(false);
        this.initNewPrograma(semanaId, sem);
      }
    });
  }

  private normalizeProgram(data: ProgramaVyM): ProgramaVyM {
    return {
      ...data,
      seamos_maestros_auditorio: Array.isArray(data.seamos_maestros_auditorio) ? data.seamos_maestros_auditorio : [],
      seamos_maestros_auxiliar: Array.isArray(data.seamos_maestros_auxiliar) ? data.seamos_maestros_auxiliar : [],
      vida_cristiana_partes: Array.isArray(data.vida_cristiana_partes) ? data.vida_cristiana_partes : []
    };
  }

  private deepClone(prog: ProgramaVyM): ProgramaVyM {
    return JSON.parse(JSON.stringify(prog)) as ProgramaVyM;
  }

  private initNewPrograma(semanaId: string, sem?: Semana): void {
    const def1 = createDefaultProgramaVyM(semanaId);
    if (sem) {
      def1.lectura_semanal = sem.nombre || 'LECTURA SEMANAL DE LA BIBLIA';
    }
    this.p1.set(def1);
    this.p2.set(this.deepClone(def1));
  }

  // Obtener referencia al programa activo en el formulario
  get current(): ProgramaVyM {
    return this.activeCopy() === 'program1' ? this.p1() : this.p2();
  }

  set current(val: ProgramaVyM) {
    if (this.activeCopy() === 'program1') {
      this.p1.set({ ...val });
    } else {
      this.p2.set({ ...val });
    }
  }

  // Acciones de sincronización y edición
  cloneP1toP2(): void {
    const clone = this.deepClone(this.p1());
    this.p2.set(clone);
    this.showStatus('Se copiaron todos los datos del Programa 1 al Programa 2', 'success');
  }

  cloneP2toP1(): void {
    const clone = this.deepClone(this.p2());
    this.p1.set(clone);
    this.showStatus('Se copiaron todos los datos del Programa 2 al Programa 1', 'success');
  }

  // Dinámicas: Seamos Mejores Maestros
  addMinistryItemAuditorio(): void {
    const list = [...this.current.seamos_maestros_auditorio];
    list.push({ type: 'Asignación', title: 'Asignación', time: '3-4 mins.', student: '', startTime: '19:35' });
    this.current = { ...this.current, seamos_maestros_auditorio: list };
  }

  removeMinistryItemAuditorio(index: number): void {
    const list = [...this.current.seamos_maestros_auditorio];
    list.splice(index, 1);
    this.current = { ...this.current, seamos_maestros_auditorio: list };
  }

  addMinistryItemAuxiliar(): void {
    const list = [...this.current.seamos_maestros_auxiliar];
    list.push({ type: 'Asignación', title: 'Asignación', time: '3-4 mins.', student: '', startTime: '19:35' });
    this.current = { ...this.current, seamos_maestros_auxiliar: list };
  }

  removeMinistryItemAuxiliar(index: number): void {
    const list = [...this.current.seamos_maestros_auxiliar];
    list.splice(index, 1);
    this.current = { ...this.current, seamos_maestros_auxiliar: list };
  }

  // Dinámicas: Vida Cristiana
  addChristianLifeItem(): void {
    const list = [...this.current.vida_cristiana_partes];
    list.push({ title: 'Parte', time: '15 mins.', speaker: '', startTime: '19:50' });
    this.current = { ...this.current, vida_cristiana_partes: list };
  }

  removeChristianLifeItem(index: number): void {
    const list = [...this.current.vida_cristiana_partes];
    list.splice(index, 1);
    this.current = { ...this.current, vida_cristiana_partes: list };
  }

  // Guardar en Backend
  savePrograma(): void {
    const semanaId = this.selectedSemanaId();
    if (!semanaId) {
      this.showStatus('Selecciona una semana antes de guardar', 'error');
      return;
    }

    this.saving.set(true);
    // Guardamos el programa principal (P1) en la base de datos
    this.vymService.savePrograma(semanaId, this.p1()).subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.p1.set(saved);
        this.showStatus('¡Programa guardado exitosamente en la base de datos!', 'success');
      },
      error: (err) => {
        this.saving.set(false);
        console.error('Error al guardar programa:', err);
        this.showStatus('Error al guardar el programa en el servidor', 'error');
      }
    });
  }

  private showStatus(text: string, type: 'success' | 'error'): void {
    this.statusMessage.set({ text, type });
    setTimeout(() => this.statusMessage.set(null), 4000);
  }

  // Formateo de fecha de la semana para el encabezado
  formatDateRange(sem: Semana | null): string {
    if (!sem) return 'FECHA DE REUNIÓN';
    const startParts = sem.fecha_inicio.split('-');
    const endParts = sem.fecha_fin.split('-');
    if (startParts.length < 3 || endParts.length < 3) return `${sem.fecha_inicio} a ${sem.fecha_fin}`;

    const startDay = parseInt(startParts[2], 10);
    const endDay = parseInt(endParts[2], 10);
    const monthNames = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    const startMonth = monthNames[parseInt(startParts[1], 10) - 1];
    const endMonth = monthNames[parseInt(endParts[1], 10) - 1];
    const year = endParts[0];

    if (startMonth === endMonth) {
      return `${startDay}-${endDay} de ${endMonth} de ${year}`;
    }
    return `${startDay} de ${startMonth} a ${endDay} de ${endMonth} de ${year}`;
  }

  // Cálculo de numeración para Vida Cristiana
  getChristianLifeStartIndex(prog: ProgramaVyM): number {
    const maxMaestros = Math.max(
      prog.seamos_maestros_auditorio.length,
      prog.seamos_maestros_auxiliar.length
    );
    return 3 + maxMaestros;
  }

  getCongregationStudyNumber(prog: ProgramaVyM): number {
    return this.getChristianLifeStartIndex(prog) + prog.vida_cristiana_partes.length + 1;
  }

  // Impresión y Exportación
  printProgram(): void {
    window.print();
  }

  exportWord(): void {
    const p1Html = this.generateWordTable(this.p1());
    const p2Html = this.generateWordTable(this.p2());

    const content = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page { size: A4; margin: 0.5cm; }
          body { font-family: Helvetica, Arial, sans-serif; margin: 0; padding: 0; }
          .cut-separator { border-top: 1px dashed #777; margin: 15px 0; text-align: center; color: #999; font-size: 8pt; }
        </style>
      </head>
      <body>
        ${p1Html}
        <div class="cut-separator">✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ✂</div>
        ${p2Html}
      </body>
      </html>
    `;

    const blob = new Blob([content], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const semName = this.selectedSemana() ? this.selectedSemana()!.nombre.replace(/\s+/g, '_') : 'semana';
    link.download = `Programa_Vida_Ministerio_${semName}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  }

  private generateWordTable(prog: ProgramaVyM): string {
    const semDate = this.formatDateRange(this.selectedSemana());
    const tdStyle = 'padding: 2px 4px; vertical-align: top; font-size: 9pt;';
    const headerStyle = (bg: string) => `background-color: ${bg}; color: white; font-weight: bold; padding: 2px 4px; font-size: 9pt; text-transform: uppercase;`;

    let html = `
      <table style="width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 9pt;">
        <tr>
          <td colspan="4" style="border-bottom: 2px solid black; padding-bottom: 3px;">
            <table style="width: 100%;">
              <tr>
                <td style="font-size: 11pt; font-weight: bold; text-transform: uppercase;">${prog.nombre_congregacion || 'ALAMEDA'}</td>
                <td style="font-size: 10pt; font-weight: bold; text-align: right; font-family: serif;">Programa para la reunión de entre semana</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td colspan="4" style="text-align: right; font-size: 8pt; color: #555; padding: 2px 0;">
            Presidente: <b>${prog.presidente || '-'}</b> | Consejero Sala Auxiliar: <b>${prog.consejero_auxiliar || '-'}</b>
          </td>
        </tr>
        <tr>
          <td colspan="4" style="border-bottom: 1px solid #ccc; font-weight: bold; padding: 2px 0; font-size: 8.5pt;">
            ${semDate} | ${prog.lectura_semanal || ''}
          </td>
        </tr>
        <tr>
          <td style="${tdStyle} width: 45px; color:#555;">${prog.hora_cancion_inicio}</td>
          <td style="${tdStyle}"><b>Canción ${prog.cancion_inicio}</b></td>
          <td style="${tdStyle}"></td>
          <td style="${tdStyle}"></td>
        </tr>
        <tr>
          <td style="${tdStyle} width: 45px; color:#555;">${prog.hora_oracion_inicio}</td>
          <td style="${tdStyle}">Palabras de introducción (1 min.)</td>
          <td style="${tdStyle} text-align: right; color: #666;">Oración:</td>
          <td style="${tdStyle}"><b>${prog.oracion_inicio || '-'}</b></td>
        </tr>
        <!-- Tesoros -->
        <tr><td colspan="4" style="${headerStyle('#5f6368')}">TESOROS DE LA BIBLIA</td></tr>
        <tr>
          <td style="${tdStyle} width: 45px; color:#555;">${prog.hora_cancion_inicio || '19:05'}</td>
          <td style="${tdStyle}"><b>1. ${prog.tesoros_titulo || 'Discurso'}</b> (${prog.tesoros_tiempo})</td>
          <td style="${tdStyle}"></td>
          <td style="${tdStyle}"><b>${prog.tesoros_discursante || '-'}</b></td>
        </tr>
        <tr>
          <td style="${tdStyle} width: 45px; color:#555;">19:15</td>
          <td style="${tdStyle}"><b>2. Busquemos perlas escondidas</b> (${prog.perlas_tiempo})</td>
          <td style="${tdStyle}"></td>
          <td style="${tdStyle}"><b>${prog.perlas_discursante || '-'}</b></td>
        </tr>
        <tr>
          <td style="${tdStyle} width: 45px; color:#555;">19:25</td>
          <td style="${tdStyle}"><b>3. Lectura de la Biblia</b> (${prog.lectura_tiempo})</td>
          <td style="${tdStyle} text-align: right; color: #666;">Estudiante:</td>
          <td style="${tdStyle}"><b>${prog.lectura_estudiante || '-'}</b></td>
        </tr>
        <!-- Seamos Mejores Maestros -->
        <tr><td colspan="4" style="${headerStyle('#dfae26')}">SEAMOS MEJORES MAESTROS</td></tr>
        <tr><td colspan="4" style="font-weight: bold; padding: 2px 4px; background: #fffbe8;">Auditorio Principal</td></tr>
    `;

    prog.seamos_maestros_auditorio.forEach((item, i) => {
      html += `
        <tr>
          <td style="${tdStyle} width: 45px; color:#555;">${item.startTime || ''}</td>
          <td style="${tdStyle}"><b>${i + 4}. ${item.title}</b> (${item.time})</td>
          <td style="${tdStyle} text-align: right; color: #666;">Estudiante/Ayudante:</td>
          <td style="${tdStyle}"><b>${item.student || '-'}</b></td>
        </tr>
      `;
    });

    if (prog.seamos_maestros_auxiliar.length > 0) {
      html += `<tr><td colspan="4" style="font-weight: bold; padding: 2px 4px; background: #fffbe8;">Sala Auxiliar</td></tr>`;
      prog.seamos_maestros_auxiliar.forEach((item, i) => {
        html += `
          <tr>
            <td style="${tdStyle} width: 45px; color:#555;">${item.startTime || ''}</td>
            <td style="${tdStyle}"><b>${i + 4}. ${item.title}</b> (${item.time})</td>
            <td style="${tdStyle} text-align: right; color: #666;">Estudiante/Ayudante:</td>
            <td style="${tdStyle}"><b>${item.student || '-'}</b></td>
          </tr>
        `;
      });
    }

    // Vida Cristiana
    html += `
      <tr><td colspan="4" style="${headerStyle('#8a1c34')}">NUESTRA VIDA CRISTIANA</td></tr>
      <tr>
        <td style="${tdStyle} width: 45px; color:#555;">${prog.cancion_medio_tiempo}</td>
        <td style="${tdStyle}"><b>Canción ${prog.cancion_medio}</b></td>
        <td style="${tdStyle}"></td>
        <td style="${tdStyle}"></td>
      </tr>
    `;

    const startCL = this.getChristianLifeStartIndex(prog);
    prog.vida_cristiana_partes.forEach((item, i) => {
      html += `
        <tr>
          <td style="${tdStyle} width: 45px; color:#555;">${item.startTime || ''}</td>
          <td style="${tdStyle}"><b>${startCL + i + 1}. ${item.title}</b> (${item.time})</td>
          <td style="${tdStyle}"></td>
          <td style="${tdStyle}"><b>${item.speaker || '-'}</b></td>
        </tr>
      `;
    });

    const studyNum = this.getCongregationStudyNumber(prog);
    html += `
      <tr>
        <td style="${tdStyle} width: 45px; color:#555;">${prog.cancion_medio_tiempo || '20:03'}</td>
        <td style="${tdStyle}"><b>${studyNum}. Estudio bíblico de la congregación</b> (${prog.estudio_tiempo})</td>
        <td style="${tdStyle} text-align: right; color: #666;">Conductor / Lector:</td>
        <td style="${tdStyle}"><b>${prog.estudio_conductor || '-'}<br>${prog.estudio_lector || '-'}</b></td>
      </tr>
      <tr>
        <td style="${tdStyle} width: 45px; color:#555;">${prog.conclusion_tiempo}</td>
        <td style="${tdStyle}">Palabras de conclusión (3 min.)</td>
        <td style="${tdStyle}"></td>
        <td style="${tdStyle}"></td>
      </tr>
      <tr>
        <td style="${tdStyle} width: 45px; color:#555;">${prog.cancion_fin_tiempo}</td>
        <td style="${tdStyle}"><b>Canción ${prog.cancion_fin}</b></td>
        <td style="${tdStyle} text-align: right; color: #666;">Oración:</td>
        <td style="${tdStyle}"><b>${prog.oracion_fin || '-'}</b></td>
      </tr>
      </table>
    `;

    return html;
  }
}
