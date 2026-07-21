import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AsignacionListComponent } from './asignacion-list.component';
import { AsignacionService, TipoAsignacion, Asignacion } from '../../core/services/asignacion.service';
import { SemanaService } from '../../core/services/semana.service';
import { AuthService } from '../../core/services/auth.service';
import { GrupoService } from '../../core/services/grupo.service';
import { of } from 'rxjs';

const ASEO_SALON_UUID = 'b10c74a7-ba4c-4a71-b639-1248aa404eb4';

describe('AsignacionListComponent - ASEO_SALON branch', () => {
  let component: AsignacionListComponent;
  let fixture: ComponentFixture<AsignacionListComponent>;

  const mockAsignacionService = {
    loading: jest.fn().mockReturnValue(false),
    tipos: jest.fn().mockReturnValue([]),
    asignaciones: jest.fn().mockReturnValue([]),
    loadTiposAsignacion: jest.fn().mockReturnValue(of(null)),
    loadAsignacionesBySemana: jest.fn().mockReturnValue(of({ asignaciones: [] })),
    createAsignacion: jest.fn().mockReturnValue(of(null)),
    bulkCreateAsignaciones: jest.fn().mockReturnValue(of(null)),
  };
  const mockSemanaService = {
    loadSemanas: jest.fn().mockReturnValue(of({ data: [] })),
  };
  const mockAuthService = {
    isSuperintendente: jest.fn().mockReturnValue(true),
    getUsers: jest.fn().mockReturnValue(of([])),
  };
  const mockGrupoService = {
    loadGrupos: jest.fn().mockReturnValue(of({ data: [] })),
    grupos: jest.fn().mockReturnValue([]),
  };

  const aseoSalonTipo: TipoAsignacion = {
    id: ASEO_SALON_UUID,
    nombre: 'ASEO_SALON',
    descripcion: null,
    icono: null,
    created_at: new Date(),
  } as unknown as TipoAsignacion;

  beforeEach(async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AsignacionListComponent],
      providers: [
        { provide: AsignacionService, useValue: mockAsignacionService },
        { provide: SemanaService, useValue: mockSemanaService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: GrupoService, useValue: mockGrupoService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AsignacionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function openAseoSalonModal() {
    component.selectedSemanaId = 'some-semana';
    component.openAssignModal(aseoSalonTipo, 0);
    fixture.detectChanges();
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render ONLY the group selector for ASEO_SALON (person selector absent)', () => {
    openAseoSalonModal();

    const grupoSelect = fixture.nativeElement.querySelector('#grupoSelect');
    const personaSelect = fixture.nativeElement.querySelector('#persona');

    expect(grupoSelect).toBeTruthy();
    expect(personaSelect).toBeNull();
  });

  it('should keep observaciones visible for ASEO_SALON', () => {
    openAseoSalonModal();
    const observaciones = fixture.nativeElement.querySelector('#observaciones');
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
    const personaSelect = fixture.nativeElement.querySelector('#persona');

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

  it('onTipoChange should reset both user_id and grupo_id', () => {
    component.assignForm.user_id = 'u1';
    component.assignForm.grupo_id = 'g1';
    component.onTipoChange();
    expect(component.assignForm.user_id).toBe('');
    expect(component.assignForm.grupo_id).toBe('');
  });
});
