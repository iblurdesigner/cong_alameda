import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { VidaMinisterioComponent } from './vida-ministerio.component';
import { SemanaService, Semana } from '../../../core/services/semana.service';
import { UserService, User } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProgramaVyMService, createDefaultProgramaVyM } from '../../../core/services/programa-vym.service';

describe('VidaMinisterioComponent', () => {
  let component: VidaMinisterioComponent;
  let fixture: ComponentFixture<VidaMinisterioComponent>;

  const mockSemanas: Semana[] = [
    {
      id: 'sem-1',
      nombre: 'Semana 1',
      fecha_inicio: '2026-09-01',
      fecha_fin: '2026-09-07',
      created_at: '2026-09-01'
    },
    {
      id: 'sem-2',
      nombre: 'Semana 2',
      fecha_inicio: '2026-09-08',
      fecha_fin: '2026-09-14',
      created_at: '2026-09-08'
    }
  ];

  const mockUsers: User[] = [
    { id: 'u1', nombre: 'Juan Pérez', email: 'juan@test.com', rol: 'ANCIANO', activo: true, telefono: '0991234567', telefono_validado: true, notificaciones_email: true, notificaciones_whatsapp: true },
    { id: 'u2', nombre: 'Carlos López', email: 'carlos@test.com', rol: 'SUPERINTENDENTE', activo: true, telefono: '0987654321', telefono_validado: true, notificaciones_email: true, notificaciones_whatsapp: true }
  ];

  const mockSemanaService = {
    semanas: signal<Semana[]>(mockSemanas),
    loadSemanas: jest.fn().mockReturnValue(of({ data: mockSemanas }))
  };

  const mockUserService = {
    getUsers: jest.fn().mockReturnValue(of(mockUsers))
  };

  const mockVyMService = {
    getProgramaBySemana: jest.fn().mockReturnValue(of(createDefaultProgramaVyM('sem-1'))),
    savePrograma: jest.fn().mockReturnValue(of(createDefaultProgramaVyM('sem-1')))
  };

  const mockAuthService = {
    isSuperintendente: jest.fn().mockReturnValue(true),
    isSuperAdmin: jest.fn().mockReturnValue(false),
    isAnciano: jest.fn().mockReturnValue(false)
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VidaMinisterioComponent],
      providers: [
        { provide: SemanaService, useValue: mockSemanaService },
        { provide: UserService, useValue: mockUserService },
        { provide: ProgramaVyMService, useValue: mockVyMService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VidaMinisterioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse correctamente e inicializar datos', () => {
    expect(component).toBeTruthy();
    expect(mockSemanaService.loadSemanas).toHaveBeenCalled();
    expect(mockUserService.getUsers).toHaveBeenCalled();
    expect(component.selectedSemanaId()).toBe('sem-1');
  });

  it('debe permitir agregar y eliminar asignaciones de Seamos Mejores Maestros', () => {
    const initialCount = component.current.seamos_maestros_auditorio.length;
    component.addMinistryItemAuditorio();
    expect(component.current.seamos_maestros_auditorio.length).toBe(initialCount + 1);

    component.removeMinistryItemAuditorio(0);
    expect(component.current.seamos_maestros_auditorio.length).toBe(initialCount);
  });

  it('debe clonar Programa 1 a Programa 2 con cloneP1toP2', () => {
    component.p1.update(p => ({ ...p, presidente: 'Nuevo Presidente' }));
    component.cloneP1toP2();
    expect(component.p2().presidente).toBe('Nuevo Presidente');
  });

  it('debe calcular la numeración correcta para Vida Cristiana', () => {
    // Si hay 3 partes en Auditorio y 3 en Sala Auxiliar, el inicio de Vida Cristiana es 3 + max(3,3) = 6
    const startIdx = component.getChristianLifeStartIndex(component.p1());
    expect(startIdx).toBe(6);
  });

  it('debe gestionar el cambio de vista móvil y modo dividido (mobileTab y fitPreviewMobile)', () => {
    component.setMobileTab('editor');
    expect(component.mobileTab()).toBe('editor');

    component.setMobileTab('preview');
    expect(component.mobileTab()).toBe('preview');

    component.setMobileTab('split');
    expect(component.mobileTab()).toBe('split');

    expect(component.fitPreviewMobile()).toBe(true);
    component.toggleFitPreview();
    expect(component.fitPreviewMobile()).toBe(false);
  });

  it('debe calcular la escala correcta de la hoja A4 según el ancho del contenedor', () => {
    // Modo fit activo
    component.fitPreviewMobile.set(true);

    // Contenedor angosto (pantalla móvil o split estrecho ~400px):
    // availableWidth = 400 - 32 = 368px => scale = 368 / 794 ≈ 0.463
    component.updatePreviewScale(400);
    expect(component.previewScale()).toBeLessThan(1);
    expect(component.previewScale()).toBeCloseTo(0.463, 2);

    // Contenedor ancho (>= 826px): scale debe ser 1.0 (tamaño máximo original)
    component.updatePreviewScale(1000);
    expect(component.previewScale()).toBe(1);

    // Si fitPreviewMobile está desactivado, siempre debe ser 1
    component.fitPreviewMobile.set(false);
    component.updatePreviewScale(400);
    expect(component.previewScale()).toBe(1);
  });

  it('debe extraer correctamente la lista de estudiantes para boletas S-89 y asociar teléfonos', () => {
    component.p1.update(p => ({
      ...p,
      lectura_estudiante: 'Juan Pérez',
      seamos_maestros_auditorio: [
        { type: 'conversacion', startTime: '19:30', title: 'Primera conversación', time: '3 min.', student: 'Juan Pérez', assistant: 'Carlos López' }
      ],
      seamos_maestros_auxiliar: [
        { type: 'conversacion', startTime: '19:30', title: 'Primera conversación', time: '3 min.', student: 'Carlos López', assistant: 'Juan Pérez' }
      ]
    }));

    const estudiantes = component.estudiantesS89();
    expect(estudiantes.length).toBe(3);

    // Lectura de la biblia
    const lectura = estudiantes.find(e => e.id === 'lectura-auditorio');
    expect(lectura).toBeTruthy();
    expect(lectura?.numero).toBe(3);
    expect(lectura?.telefono).toBe('0991234567');
    expect(lectura?.mensajeRaw).toContain('Lectura de la Biblia');
    expect(lectura?.mensajeRaw).toContain('Juan Pérez');

    // Auditorio Principal
    const audPart = estudiantes.find(e => e.id === 'ministry-aud-0');
    expect(audPart?.sala).toBe('Auditorio Principal');
    expect(audPart?.ayudante).toBe('Carlos López');

    // Sala Auxiliar
    const auxPart = estudiantes.find(e => e.id === 'ministry-aux-0');
    expect(auxPart?.sala).toBe('Sala Auxiliar');
    expect(auxPart?.estudiante).toBe('Carlos López');
    expect(auxPart?.telefono).toBe('0987654321');
  });

  it('debe normalizar números telefónicos ecuatorianos e internacionales', () => {
    expect(component.cleanPhoneNumber('0991234567')).toBe('593991234567');
    expect(component.cleanPhoneNumber('+593991234567')).toBe('593991234567');
    expect(component.cleanPhoneNumber('099-123-4567')).toBe('593991234567');
    expect(component.cleanPhoneNumber('')).toBe('');
  });

  it('debe gestionar apertura, cierre y filtros del modal S-89', () => {
    expect(component.showS89Modal()).toBe(false);
    component.openS89Modal();
    expect(component.showS89Modal()).toBe(true);

    component.setFilterS89Sala('Sala Auxiliar');
    expect(component.filterS89Sala()).toBe('Sala Auxiliar');

    component.closeS89Modal();
    expect(component.showS89Modal()).toBe(false);
  });
});
