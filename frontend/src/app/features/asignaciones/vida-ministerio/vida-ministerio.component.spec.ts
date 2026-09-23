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
    { id: 'u1', nombre: 'Juan Pérez', email: 'juan@test.com', rol: 'ANCIANO', activo: true, telefono_validado: true, notificaciones_email: true, notificaciones_whatsapp: true },
    { id: 'u2', nombre: 'Carlos López', email: 'carlos@test.com', rol: 'SUPERINTENDENTE', activo: true, telefono_validado: true, notificaciones_email: true, notificaciones_whatsapp: true }
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
});
