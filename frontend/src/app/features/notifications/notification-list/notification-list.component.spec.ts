import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationListComponent } from './notification-list.component';
import { NotificationService, Notificacion } from '../../../core/services/notification.service';
import { signal, WritableSignal } from '@angular/core';
import { of } from 'rxjs';

describe('NotificationListComponent', () => {
  let component: NotificationListComponent;
  let fixture: ComponentFixture<NotificationListComponent>;
  let mockNotificationService: Partial<NotificationService> & {
    _notifSignal: WritableSignal<Notificacion[]>;
    _unreadSignal: WritableSignal<number>;
    _loadingSignal: WritableSignal<boolean>;
  };

  const mockNotificaciones: Notificacion[] = [
    {
      id: '1',
      tipo: 'CASA_REGISTRADA',
      mensaje: 'Casa registrada en Av. Siempre Viva 123',
      leida: false,
      created_at: new Date().toISOString(),
    },
    {
      id: '2',
      tipo: 'VISITA_PROGRAMADA',
      mensaje: 'Visita programada para el 15 de julio',
      leida: true,
      created_at: new Date().toISOString(),
    },
  ];

  function createMockNotificationService(): Partial<NotificationService> & {
    _notifSignal: WritableSignal<Notificacion[]>;
    _unreadSignal: WritableSignal<number>;
    _loadingSignal: WritableSignal<boolean>;
  } {
    const _notifSignal = signal(mockNotificaciones);
    const _unreadSignal = signal(1);
    const _loadingSignal = signal(false);
    return {
      notificaciones: _notifSignal.asReadonly(),
      unreadCount: _unreadSignal.asReadonly(),
      loading: _loadingSignal.asReadonly(),
      loadNotifications: jest.fn().mockReturnValue(of({ data: mockNotificaciones, unread_count: 1 })),
      markAsRead: jest.fn().mockReturnValue(of({ message: 'Notificación marcada como leída' })),
      markAllAsRead: jest.fn().mockReturnValue(of({ message: 'Todas las notificaciones marcadas como leídas' })),
      _notifSignal,
      _unreadSignal,
      _loadingSignal,
    };
  }

  beforeEach(async () => {
    TestBed.resetTestingModule();
    mockNotificationService = createMockNotificationService();

    await TestBed.configureTestingModule({
      imports: [NotificationListComponent],
      providers: [{ provide: NotificationService, useValue: mockNotificationService }],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show loading state when loading is true', () => {
    mockNotificationService._loadingSignal.set(true);
    fixture.detectChanges();

    const loading = fixture.nativeElement.querySelector('.loader-container');
    expect(loading).toBeTruthy();
    expect(loading?.textContent).toContain('Cargando');
  });

  it('should show empty state when no notifications', () => {
    mockNotificationService._notifSignal.set([]);
    fixture.detectChanges();

    const emptyState = fixture.nativeElement.querySelector('.empty-state');
    expect(emptyState).toBeTruthy();
    expect(emptyState?.textContent).toContain('No hay notificaciones');
  });

  it('should render notifications list', () => {
    const notifCards = fixture.nativeElement.querySelectorAll('.notif-card');
    expect(notifCards.length).toBe(2);
    expect(notifCards[0].textContent).toContain('Casa registrada');
    expect(notifCards[1].textContent).toContain('Visita programada');
  });
});
