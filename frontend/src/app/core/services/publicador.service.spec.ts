import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PublicadorService, Publicador } from './publicador.service';
import { environment } from '../../../environments/environment';

describe('PublicadorService', () => {
  let service: PublicadorService;
  let httpMock: HttpTestingController;

  const mockPublicadores: Publicador[] = [
    {
      id: 'pub-1',
      nombres: 'Abel',
      apellidos: 'Alameda',
      nombre: 'Abel Alameda',
      celular: '0991234567',
      activo: true
    },
    {
      id: 'pub-2',
      nombres: 'Bernardo',
      apellidos: 'Bravo',
      nombre: 'Bernardo Bravo',
      celular: '0987654321',
      activo: false
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PublicadorService]
    });

    service = TestBed.inject(PublicadorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  it('debe cargar publicadores y actualizar el signal', (done) => {
    service.loadPublicadores('Abel', 'grupo-1', true).subscribe((data) => {
      expect(data.length).toBe(1);
      expect(service.publicadores().length).toBe(1);
      expect(service.loading()).toBe(false);
      done();
    });

    expect(service.loading()).toBe(true);

    const req = httpMock.expectOne((r) => r.url === `${environment.apiUrl}/publicadores`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('search')).toBe('Abel');
    expect(req.request.params.get('grupo_id')).toBe('grupo-1');
    expect(req.request.params.get('activo')).toBe('true');

    req.flush({ data: [mockPublicadores[0]] });
  });

  it('debe crear un publicador y agregarlo al signal', (done) => {
    const nuevo: Publicador = {
      id: 'pub-3',
      nombres: 'Carlos',
      apellidos: 'Castro',
      nombre: 'Carlos Castro',
      activo: true
    };

    service.createPublicador({ nombres: 'Carlos', apellidos: 'Castro' }).subscribe((res) => {
      expect(res.id).toBe('pub-3');
      expect(service.publicadores().some(p => p.id === 'pub-3')).toBe(true);
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/publicadores`);
    expect(req.request.method).toBe('POST');
    req.flush({ data: nuevo });
  });

  it('debe actualizar un publicador existente en el signal', (done) => {
    // Inicializar signal con mock
    service['publicadoresSignal'].set([...mockPublicadores]);

    const modificado: Publicador = {
      ...mockPublicadores[0],
      nombre: 'Abel Modificado'
    };

    service.updatePublicador('pub-1', { nombre: 'Abel Modificado' }).subscribe((res) => {
      expect(res.nombre).toBe('Abel Modificado');
      const found = service.publicadores().find(p => p.id === 'pub-1');
      expect(found?.nombre).toBe('Abel Modificado');
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/publicadores/pub-1`);
    expect(req.request.method).toBe('PUT');
    req.flush({ data: modificado });
  });

  it('debe eliminar un publicador del signal', (done) => {
    service['publicadoresSignal'].set([...mockPublicadores]);

    service.deletePublicador('pub-1').subscribe(() => {
      expect(service.publicadores().some(p => p.id === 'pub-1')).toBe(false);
      done();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/publicadores/pub-1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
