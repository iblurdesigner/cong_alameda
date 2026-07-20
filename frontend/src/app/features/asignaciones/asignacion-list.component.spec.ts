import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';

TestBed.initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
import { AsignacionListComponent } from './asignacion-list.component';
import { AsignacionService } from '../../core/services/asignacion.service';
import { SemanaService } from '../../core/services/semana.service';
import { AuthService } from '../../core/services/auth.service';
import { TipoAsignacion } from '../../core/services/asignacion.service';

describe('AsignacionListComponent (visual refactor — behavior preserved)', () => {
  let component: AsignacionListComponent;
  let fixture: ComponentFixture<AsignacionListComponent>;
  let createAsignacionSpy: jest.SpyInstance;

  const mockTipos: TipoAsignacion[] = [
    { id: 't1', nombre: 'ACOMODADOR_SALON', icono: '🧹' },
    { id: 't2', nombre: 'PARQUEADERO', icono: '🚗' }
  ];

  const mockUsers = [
    { id: 'u1', nombre: 'Juan', rol: 'ANCIANO' },
    { id: 'u2', nombre: 'Maria', rol: 'VISITANTE' }
  ];

  const asignacionServiceStub = {
    loading: () => false,
    loadTiposAsignacion: () => of({ data: mockTipos }),
    loadAsignacionesBySemana: () => of({ id: 's1', nombre: 'Semana 1', fecha_inicio: '2026-01-05', fecha_fin: '2026-01-11', dias: [], asignaciones: [] }),
    createAsignacion: () => of({ id: 'a1' })
  };

  const semanaServiceStub = {
    loadSemanas: () => of({ data: [] })
  };

  const authServiceStub = {
    isSuperintendente: () => true,
    getUsers: () => of(mockUsers)
  };

  beforeEach(async () => {
    createAsignacionSpy = jest.spyOn(asignacionServiceStub, 'createAsignacion');

    await TestBed.configureTestingModule({
      imports: [FormsModule, AsignacionListComponent],
      providers: [
        { provide: AsignacionService, useValue: asignacionServiceStub },
        { provide: SemanaService, useValue: semanaServiceStub },
        { provide: AuthService, useValue: authServiceStub }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AsignacionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });

  it('should render the assignment modal with person select and observaciones textarea when opened', () => {
    // Act: open the assign modal through the public API
    component.openAssignModal(mockTipos[0], 0);
    fixture.detectChanges();

    const persona = fixture.nativeElement.querySelector('#persona');
    const observaciones = fixture.nativeElement.querySelector('#observaciones');
    const asignarBtn = Array.from(fixture.nativeElement.querySelectorAll('button'))
      .find((b: any) => b.textContent?.includes('Asignar'));

    // Assert: key DOM controls exist
    expect(persona).toBeTruthy();
    expect(observaciones).toBeTruthy();
    expect(asignarBtn).toBeTruthy();

    // Persona select is populated from users()
    expect(persona.querySelectorAll('option').length).toBeGreaterThan(1);
  });

  it('should wire saveAsignacion to AsignacionService.createAsignacion', () => {
    // Arrange
    component.openAssignModal(mockTipos[0], 2);
    component.assignForm = { user_id: 'u1', observaciones: 'Temprano' };
    createAsignacionSpy.mockClear();

    // Act
    component.saveAsignacion();

    // Assert
    expect(createAsignacionSpy).toHaveBeenCalledTimes(1);
    const payload = createAsignacionSpy.mock.calls[0][0];
    expect(payload).toMatchObject({
      semana_id: component.selectedSemanaId,
      tipo_asignacion_id: 't1',
      user_id: 'u1',
      dia_semana: 2,
      observaciones: 'Temprano'
    });
  });

  it('should NOT call createAsignacion when user_id is empty', () => {
    component.openAssignModal(mockTipos[0], 2);
    component.assignForm = { user_id: '', observaciones: '' };
    createAsignacionSpy.mockClear();

    component.saveAsignacion();

    expect(createAsignacionSpy).not.toHaveBeenCalled();
  });
});
