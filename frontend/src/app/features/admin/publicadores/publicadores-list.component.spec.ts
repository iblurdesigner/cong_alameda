import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { signal } from '@angular/core';

import { PublicadoresListComponent } from './publicadores-list.component';
import { PublicadorService, Publicador } from '../../../core/services/publicador.service';
import { GrupoService, Grupo } from '../../../core/services/grupo.service';
import { UserService, User } from '../../../core/services/user.service';

describe('PublicadoresListComponent', () => {
  let component: PublicadoresListComponent;
  let fixture: ComponentFixture<PublicadoresListComponent>;

  const mockPublicadores: Publicador[] = [
    {
      id: 'p-1',
      nombres: 'David',
      apellidos: 'Alameda',
      nombre: 'David Alameda',
      celular: '0991234567',
      telefono: '022345678',
      email: 'david@test.com',
      domicilio: 'Calle A y B',
      grupo_id: 'g-1',
      grupo_numero: 1,
      grupo_nombre: 'Grupo Central',
      contacto_emergencia_nombre: 'María Alameda',
      contacto_emergencia_telefono: '0997654321',
      contacto_emergencia_parentesco: 'Esposa',
      activo: true
    },
    {
      id: 'p-2',
      nombres: 'Carlos',
      apellidos: 'Gómez',
      nombre: 'Carlos Gómez',
      celular: '0987654321',
      grupo_id: 'g-2',
      grupo_numero: 2,
      grupo_nombre: 'Grupo Norte',
      activo: false
    }
  ];

  const mockGrupos: Grupo[] = [
    { id: 'g-1', nombre: 'Grupo Central', numero: 1, activo: true },
    { id: 'g-2', nombre: 'Grupo Norte', numero: 2, activo: true }
  ];

  const mockUsers: User[] = [
    { id: 'u-1', nombre: 'David Alameda', email: 'david@test.com', rol: 'ANCIANO', activo: true, telefono_validado: true, notificaciones_email: true, notificaciones_whatsapp: true }
  ];

  const mockPublicadorService = {
    publicadores: signal<Publicador[]>(mockPublicadores),
    loading: signal<boolean>(false),
    loadPublicadores: jest.fn().mockReturnValue(of(mockPublicadores)),
    createPublicador: jest.fn().mockReturnValue(of(mockPublicadores[0])),
    updatePublicador: jest.fn().mockReturnValue(of(mockPublicadores[0])),
    deletePublicador: jest.fn().mockReturnValue(of(undefined))
  };

  const mockGrupoService = {
    grupos: signal<Grupo[]>(mockGrupos),
    loadGrupos: jest.fn().mockReturnValue(of({ data: mockGrupos }))
  };

  const mockUserService = {
    getUsers: jest.fn().mockReturnValue(of(mockUsers))
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicadoresListComponent],
      providers: [
        { provide: PublicadorService, useValue: mockPublicadorService },
        { provide: GrupoService, useValue: mockGrupoService },
        { provide: UserService, useValue: mockUserService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PublicadoresListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debe crearse e inicializar datos de publicadores y grupos', () => {
    expect(component).toBeTruthy();
    expect(mockPublicadorService.loadPublicadores).toHaveBeenCalled();
    expect(mockGrupoService.loadGrupos).toHaveBeenCalled();
    expect(mockUserService.getUsers).toHaveBeenCalled();
  });

  it('debe filtrar publicadores por término de búsqueda en tiempo real', () => {
    component.searchTerm.set('Alameda');
    expect(component.filteredPublicadores().length).toBe(1);
    expect(component.filteredPublicadores()[0].apellidos).toBe('Alameda');

    component.searchTerm.set('María'); // busca por contacto de emergencia
    expect(component.filteredPublicadores().length).toBe(1);
    expect(component.filteredPublicadores()[0].nombre).toBe('David Alameda');

    component.searchTerm.set('inexistente');
    expect(component.filteredPublicadores().length).toBe(0);
  });

  it('debe filtrar publicadores por grupo', () => {
    component.selectedGrupoId.set('g-2');
    expect(component.filteredPublicadores().length).toBe(1);
    expect(component.filteredPublicadores()[0].nombre).toBe('Carlos Gómez');
  });

  it('debe filtrar publicadores por estado (activos / inactivos)', () => {
    component.selectedEstado.set('activos');
    expect(component.filteredPublicadores().length).toBe(1);
    expect(component.filteredPublicadores()[0].activo).toBe(true);

    component.selectedEstado.set('inactivos');
    expect(component.filteredPublicadores().length).toBe(1);
    expect(component.filteredPublicadores()[0].activo).toBe(false);
  });

  it('debe abrir modal para crear publicador y resetear el formulario', () => {
    component.openCreateModal();
    expect(component.showModal()).toBe(true);
    expect(component.isEditing()).toBe(false);
    expect(component.formData.nombres).toBe('');
    expect(component.formData.apellidos).toBe('');
    expect(component.formData.activo).toBe(true);
  });

  it('debe abrir modal para editar publicador cargando sus datos', () => {
    component.openEditModal(mockPublicadores[0]);
    expect(component.showModal()).toBe(true);
    expect(component.isEditing()).toBe(true);
    expect(component.currentId()).toBe('p-1');
    expect(component.formData.nombres).toBe('David');
    expect(component.formData.apellidos).toBe('Alameda');
    expect(component.formData.contacto_emergencia_nombre).toBe('María Alameda');
  });

  it('debe guardar un nuevo publicador llamando a createPublicador', () => {
    component.openCreateModal();
    component.formData.nombres = 'Nuevo';
    component.formData.apellidos = 'Hermano';
    component.savePublicador();

    expect(mockPublicadorService.createPublicador).toHaveBeenCalledWith(
      expect.objectContaining({ nombres: 'Nuevo', apellidos: 'Hermano' })
    );
    expect(component.showModal()).toBe(false);
  });

  it('debe actualizar un publicador llamando a updatePublicador', () => {
    component.openEditModal(mockPublicadores[0]);
    component.formData.nombres = 'David';
    component.formData.apellidos = 'Alameda Editado';
    component.savePublicador();

    expect(mockPublicadorService.updatePublicador).toHaveBeenCalledWith(
      'p-1',
      expect.objectContaining({ nombres: 'David', apellidos: 'Alameda Editado' })
    );
    expect(component.showModal()).toBe(false);
  });

  it('debe formatear url de WhatsApp adecuadamente', () => {
    const url = component.getWhatsAppUrl('0991234567');
    expect(url).toBe('https://wa.me/593991234567');
  });
});
