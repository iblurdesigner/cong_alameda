import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { of } from 'rxjs';

import { AsignacionListComponent } from './asignacion-list.component';
import { AsignacionService, TipoAsignacion } from '../../core/services/asignacion.service';
import { SemanaService } from '../../core/services/semana.service';
import { AuthService } from '../../core/services/auth.service';
import { GrupoService } from '../../core/services/grupo.service';
import { NotificationService } from '../../core/services/notification.service';

const ASEO_SALON_UUID = 'b10c74a7-ba4c-4a71-b639-1248aa404eb4';

describe('AsignacionListComponent', () => {
  let component: AsignacionListComponent;
  let fixture: ComponentFixture<AsignacionListComponent>;

  const queryParamsSubject = new BehaviorSubject<{ [key: string]: any }>({});

  const mockTipos: TipoAsignacion[] = [
    { id: 't1', nombre: 'ACOMODADOR_SALON', icono: '🧹' },
    { id: ASEO_SALON_UUID, nombre: 'ASEO_SALON', descripcion: null, icono: null, created_at: new Date() },
    { id: 't3', nombre: 'PARQUEADERO', icono: '🚗' },
  ] as unknown as TipoAsignacion[];

  const mockUsers = [
    { id: 'u1', nombre: 'Juan', rol: 'ANCIANO' },
    { id: 'u2', nombre: 'Maria', rol: 'VISITANTE' },
  ];

  const mockAsignacionService = {
    loading: jest.fn().mockReturnValue(false),
    tipos: jest.fn().mockReturnValue(mockTipos),
    asignaciones: jest.fn().mockReturnValue([]),
    loadTiposAsignacion: jest.fn().mockReturnValue(of({ data: mockTipos })),
    loadAsignacionesBySemana: jest.fn().mockReturnValue(
      of({ id: 's1', nombre: 'Semana 1', fecha_inicio: '2026-01-05', fecha_fin: '2026-01-11', dias: [], asignaciones: [] })
    ),
    createAsignacion: jest.fn().mockReturnValue(of({ id: 'a1' })),
    updateAsignacion: jest.fn().mockReturnValue(of({ id: 'a1' })),
    bulkCreateAsignaciones: jest.fn().mockReturnValue(of(null)),
  };
  const mockSemanaService = {
    loadSemanas: jest.fn().mockReturnValue(of({ data: [] })),
  };
  const mockAuthService = {
    isSuperintendente: jest.fn().mockReturnValue(true),
    getUsers: jest.fn().mockReturnValue(of(mockUsers)),
  } as unknown as AuthService;
  const mockGrupoService = {
    loadGrupos: jest.fn().mockReturnValue(of({ data: [] })),
    grupos: jest.fn().mockReturnValue([]),
  };
  const mockNotificationService = {
    loadNotifications: jest.fn().mockReturnValue(of(null)),
  } as unknown as NotificationService;

  beforeEach(async () => {
    jest.clearAllMocks();
    queryParamsSubject.next({});

    await TestBed.configureTestingModule({
      imports: [FormsModule, AsignacionListComponent],
      providers: [
        { provide: AsignacionService, useValue: mockAsignacionService },
        { provide: SemanaService, useValue: mockSemanaService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: GrupoService, useValue: mockGrupoService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: ActivatedRoute, useValue: { queryParams: queryParamsSubject } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AsignacionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('behavior preservation (visual refactor)', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should render the assignment modal with person select and observaciones input when opened', () => {
      component.selectedSemanaId = 'some-semana';
      component.openAssignModal(mockTipos[0], 0);
      fixture.detectChanges();

      const userSelect = fixture.nativeElement.querySelector('#userSelect');
      const observaciones = fixture.nativeElement.querySelector('#obsInput');
      const guardarBtn = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
        .find(b => b.textContent?.includes('Guardar'));

      expect(userSelect).toBeTruthy();
      expect(observaciones).toBeTruthy();
      expect(guardarBtn).toBeTruthy();
      expect(userSelect.querySelectorAll('option').length).toBeGreaterThan(1);
    });

    it('should wire saveAsignacion to AsignacionService.createAsignacion', () => {
      component.selectedSemanaId = 'some-semana';
      component.openAssignModal(mockTipos[0], 2);
      component.assignForm = { user_id: 'u1', grupo_id: '', observaciones: 'Temprano', tipo_id: 't1' };

      component.saveAsignacion();

      expect(mockAsignacionService.createAsignacion).toHaveBeenCalledTimes(1);
      const payload = mockAsignacionService.createAsignacion.mock.calls[0][0];
      expect(payload).toMatchObject({
        semana_id: component.selectedSemanaId,
        tipo_asignacion_id: 't1',
        user_id: 'u1',
        dia_semana: 2,
        observaciones: 'Temprano',
      });
    });

    it('should NOT call createAsignacion when user_id and grupo_id are empty', () => {
      component.openAssignModal(mockTipos[0], 2);
      component.assignForm = { user_id: '', grupo_id: '', observaciones: '', tipo_id: '' };

      component.saveAsignacion();

      expect(mockAsignacionService.createAsignacion).not.toHaveBeenCalled();
    });
  });

  describe('ASEO_SALON group-only behavior', () => {
    function openAseoSalonModal() {
      component.selectedSemanaId = 'some-semana';
      component.openAssignModal(mockTipos[1], 0);
      fixture.detectChanges();
    }

    it('should render ONLY the group selector for ASEO_SALON type', () => {
      openAseoSalonModal();

      const grupoSelect = fixture.nativeElement.querySelector('#grupoSelect');
      const personaSelect = fixture.nativeElement.querySelector('#userSelect');

      expect(grupoSelect).toBeTruthy();
      expect(personaSelect).toBeNull();
    });

    it('should keep observaciones visible for ASEO_SALON', () => {
      openAseoSalonModal();
      const observaciones = fixture.nativeElement.querySelector('#obsInput');
      expect(observaciones).toBeTruthy();
    });

    it('should render ONLY the person selector for a non-ASEO_SALON type', () => {
      const otherTipo: TipoAsignacion = {
        id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        nombre: 'ACOMODADOR_SALON',
        descripcion: null,
        icono: null,
        created_at: new Date(),
      } as unknown as TipoAsignacion;

      component.selectedSemanaId = 'some-semana';
      component.openAssignModal(otherTipo, 0);
      fixture.detectChanges();

      const grupoSelect = fixture.nativeElement.querySelector('#grupoSelect');
      const personaSelect = fixture.nativeElement.querySelector('#userSelect');

      expect(personaSelect).toBeTruthy();
      expect(grupoSelect).toBeNull();
    });

    it('should send grupo_id (not user_id) when saving an ASEO_SALON assignment', () => {
      openAseoSalonModal();
      component.assignForm.grupo_id = 'grupo-123';
      component.saveAsignacion();

      expect(mockAsignacionService.createAsignacion).toHaveBeenCalledTimes(1);
      const payload = mockAsignacionService.createAsignacion.mock.calls[0][0];
      expect(payload.grupo_id).toBe('grupo-123');
      expect(payload.user_id).toBeUndefined();
    });
  });

  describe('Req 3 - select week from route queryParam (semana_id)', () => {
    it('should set selectedSemanaId from queryParams and load that week', () => {
      queryParamsSubject.next({ semana_id: 'XYZ' });
      mockSemanaService.loadSemanas.mockReturnValue(
        of({
          data: [
            {
              id: 'XYZ',
              nombre: 'Semana XYZ',
              fecha_inicio: '2026-02-02',
              fecha_fin: '2026-02-08',
              archivado: false,
              created_at: new Date().toISOString(),
            },
          ],
        })
      );

      const f = TestBed.createComponent(AsignacionListComponent);
      f.detectChanges();

      expect(f.componentInstance.selectedSemanaId).toBe('XYZ');
      expect(mockAsignacionService.loadAsignacionesBySemana).toHaveBeenCalledWith('XYZ');
    });
  });
});
