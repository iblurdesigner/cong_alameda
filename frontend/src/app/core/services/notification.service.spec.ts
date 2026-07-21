import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { NotificationService, Notificacion, NotificacionListResponse } from './notification.service';
import { environment } from '../../../environments/environment';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpMock: HttpTestingController;

  const mockApiUrl = environment.apiUrl;

  const mockNotificaciones: Notificacion[] = [
    {
      id: '1',
      tipo: 'CASA_REGISTRADA',
      mensaje: 'Nueva casa registrada',
      leida: false,
      created_at: '2024-04-24T10:00:00Z',
    },
    {
      id: '2',
      tipo: 'VISITA_PROGRAMADA',
      mensaje: 'Visita programada',
      leida: true,
      created_at: '2024-04-23T14:00:00Z',
    },
  ];

  const mockResponse: NotificacionListResponse = {
    data: mockNotificaciones,
    unread_count: 1,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [NotificationService],
    });

    service = TestBed.inject(NotificationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    jest.clearAllMocks();
  });

  // ========== loadNotifications ==========

  describe('loadNotifications', () => {
    it('should call GET /notificaciones without filters', (done) => {
      service.loadNotifications().subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${mockApiUrl}/notificaciones`);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys().length).toBe(0);
      req.flush(mockResponse);
    });

    it('should call GET /notificaciones with leida filter', (done) => {
      service.loadNotifications({ leida: false }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${mockApiUrl}/notificaciones?leida=false`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should call GET /notificaciones with tipo filter', (done) => {
      service.loadNotifications({ tipo: 'CASA_REGISTRADA' }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${mockApiUrl}/notificaciones?tipo=CASA_REGISTRADA`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should call GET /notificaciones with both filters', (done) => {
      service.loadNotifications({ leida: true, tipo: 'VISITA_PROGRAMADA' }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${mockApiUrl}/notificaciones?leida=true&tipo=VISITA_PROGRAMADA`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should update notificaciones signal on success', (done) => {
      service.loadNotifications().subscribe(() => {
        expect(service.notificaciones()).toEqual(mockNotificaciones);
        done();
      });

      const req = httpMock.expectOne(`${mockApiUrl}/notificaciones`);
      req.flush(mockResponse);
    });

    it('should update unreadCount signal on success', (done) => {
      service.loadNotifications().subscribe(() => {
        expect(service.unreadCount()).toBe(1);
        done();
      });

      const req = httpMock.expectOne(`${mockApiUrl}/notificaciones`);
      req.flush(mockResponse);
    });

    it('should set loading to false after response', (done) => {
      service.loadNotifications().subscribe(() => {
        expect(service.loading()).toBe(false);
        done();
      });

      const req = httpMock.expectOne(`${mockApiUrl}/notificaciones`);
      req.flush(mockResponse);
    });

    it('should handle empty response', (done) => {
      const emptyResponse: NotificacionListResponse = {
        data: [],
        unread_count: 0,
      };

      service.loadNotifications().subscribe(() => {
        expect(service.notificaciones()).toEqual([]);
        expect(service.unreadCount()).toBe(0);
        done();
      });

      const req = httpMock.expectOne(`${mockApiUrl}/notificaciones`);
      req.flush(emptyResponse);
    });
  });

  // ========== markAsRead ==========

  describe('markAsRead', () => {
    it('should call PUT /notificaciones/:id/read', (done) => {
      const notifId = '1';

      service.markAsRead(notifId).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${mockApiUrl}/notificaciones/${notifId}/read`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ leida: true });
      req.flush({ message: 'OK' });
    });

    it('should update local notification state', (done) => {
      // First load notifications
      service.loadNotifications().subscribe();

      let req = httpMock.expectOne(`${mockApiUrl}/notificaciones`);
      req.flush(mockResponse);

      // Then mark as read
      service.markAsRead('1').subscribe(() => {
        const notificaciones = service.notificaciones();
        const notif = notificaciones.find(n => n.id === '1');
        expect(notif?.leida).toBe(true);
        done();
      });

      const req2 = httpMock.expectOne(`${mockApiUrl}/notificaciones/1/read`);
      req2.flush({ message: 'OK' });
    });

    it('should decrement unread count when marking unread notification as read', (done) => {
      // First load notifications
      service.loadNotifications().subscribe();

      let req = httpMock.expectOne(`${mockApiUrl}/notificaciones`);
      req.flush(mockResponse);

      // Mark the unread notification (id: '1') as read
      service.markAsRead('1').subscribe(() => {
        // Original unread count was 1, now should be 0
        expect(service.unreadCount()).toBe(0);
        done();
      });

      const req2 = httpMock.expectOne(`${mockApiUrl}/notificaciones/1/read`);
      req2.flush({ message: 'OK' });
    });

    it('should not decrement unread count below 0', (done) => {
      // First load notifications with 0 unread
      const response: NotificacionListResponse = {
        data: [{ id: '2', tipo: 'X', mensaje: 'Y', leida: true, created_at: '2024-01-01' }],
        unread_count: 0,
      };

      service.loadNotifications().subscribe();

      let req = httpMock.expectOne(`${mockApiUrl}/notificaciones`);
      req.flush(response);

      // Mark notification as read
      service.markAsRead('2').subscribe(() => {
        expect(service.unreadCount()).toBe(0);
        done();
      });

      const req2 = httpMock.expectOne(`${mockApiUrl}/notificaciones/2/read`);
      req2.flush({ message: 'OK' });
    });

    it('should handle markAsRead for non-existent notification', (done) => {
      service.markAsRead('non-existent-id').subscribe({
        error: (err) => {
          done();
        },
      });

      const req = httpMock.expectOne(`${mockApiUrl}/notificaciones/non-existent-id/read`);
      req.flush({ error: 'Not found' }, { status: 404, statusText: 'Not Found' });
    });
  });

  // ========== markAllAsRead ==========

  describe('markAllAsRead', () => {
    it('should call PUT /notificaciones/read-all', (done) => {
      service.markAllAsRead().subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${mockApiUrl}/notificaciones/read-all`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({});
      req.flush({ message: 'OK' });
    });

    it('should set all notifications as read', (done) => {
      // First load notifications
      service.loadNotifications().subscribe();

      let req = httpMock.expectOne(`${mockApiUrl}/notificaciones`);
      req.flush(mockResponse);

      // Mark all as read
      service.markAllAsRead().subscribe(() => {
        const notificaciones = service.notificaciones();
        expect(notificaciones.every(n => n.leida === true)).toBe(true);
        done();
      });

      const req2 = httpMock.expectOne(`${mockApiUrl}/notificaciones/read-all`);
      req2.flush({ message: 'OK' });
    });

    it('should set unread count to 0', (done) => {
      // First load notifications
      service.loadNotifications().subscribe();

      let req = httpMock.expectOne(`${mockApiUrl}/notificaciones`);
      req.flush(mockResponse);

      expect(service.unreadCount()).toBe(1);

      // Mark all as read
      service.markAllAsRead().subscribe(() => {
        expect(service.unreadCount()).toBe(0);
        done();
      });

      const req2 = httpMock.expectOne(`${mockApiUrl}/notificaciones/read-all`);
      req2.flush({ message: 'OK' });
    });
  });

  // ========== Signal State ==========

  describe('signal state', () => {
    it('should initialize with empty notifications', () => {
      expect(service.notificaciones()).toEqual([]);
    });

    it('should initialize with unread count 0', () => {
      expect(service.unreadCount()).toBe(0);
    });

    it('should initialize with loading false', () => {
      expect(service.loading()).toBe(false);
    });

    it('should set loading to true during loadNotifications', (done) => {
      service.loadNotifications().subscribe({
        complete: () => done(),
      });

      expect(service.loading()).toBe(true);

      const req = httpMock.expectOne(`${mockApiUrl}/notificaciones`);
      req.flush(mockResponse);
    });
  });

  // ========== Error Handling ==========

  describe('error handling', () => {
    it('should handle HTTP error on loadNotifications', (done) => {
      service.loadNotifications().subscribe({
        error: (err) => {
          done();
        },
      });

      const req = httpMock.expectOne(`${mockApiUrl}/notificaciones`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should handle network error on loadNotifications', (done) => {
      service.loadNotifications().subscribe({
        error: (err) => {
          done();
        },
      });

      const req = httpMock.expectOne(`${mockApiUrl}/notificaciones`);
      req.error(new ProgressEvent('error'));
    });

    it('should reset loading state on error', (done) => {
      service.loadNotifications().subscribe({
        error: () => {
          expect(service.loading()).toBe(false);
          done();
        },
      });

      const req = httpMock.expectOne(`${mockApiUrl}/notificaciones`);
      req.error(new ProgressEvent('error'));
    });
  });

  // ========== Filter Combinations ==========

  describe('filter combinations', () => {
    it('should handle leida=true filter', (done) => {
      service.loadNotifications({ leida: true }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${mockApiUrl}/notificaciones?leida=true`);
      req.flush(mockResponse);
    });

    it('should handle all supported notification types', (done) => {
      const tipos = [
        'CASA_REGISTRADA',
        'VISITA_PROGRAMADA',
        'VISITA_COMPLETADA',
        'PERSONA_REQUIERE_VISITA',
        'ASIGNACION_CREADA',
        'ASIGNACION_ACTUALIZADA',
        'ASIGNACION_COMPLETADA',
      ];

      service.loadNotifications({ tipo: tipos[0] }).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${mockApiUrl}/notificaciones?tipo=${tipos[0]}`);
      req.flush(mockResponse);
    });
  });
});

// ========== Type Tests ==========

describe('NotificationService - types', () => {
  it('should have correct Notificacion interface', () => {
    const notif: Notificacion = {
      id: '123',
      tipo: 'CASA_REGISTRADA',
      mensaje: 'Test message',
      leida: false,
      created_at: '2024-04-24T10:00:00Z',
    };

    expect(notif.id).toBe('123');
    expect(notif.tipo).toBe('CASA_REGISTRADA');
    expect(notif.leida).toBe(false);
  });

  it('should allow optional casa_id', () => {
    const notif: Notificacion = {
      id: '123',
      tipo: 'CASA_REGISTRADA',
      mensaje: 'Test',
      leida: false,
      created_at: '2024-04-24T10:00:00Z',
    };

    expect(notif.casa_id).toBeUndefined();
  });

  it('should have correct NotificacionListResponse interface', () => {
    const response: NotificacionListResponse = {
      data: [],
      unread_count: 5,
    };

    expect(response.data).toEqual([]);
    expect(response.unread_count).toBe(5);
  });
});