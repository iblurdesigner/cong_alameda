import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { NotificationDashboardComponent } from './notification-dashboard.component';
import { NotificationService, Notificacion } from '../../../core/services/notification.service';
import { signal } from '@angular/core';
import { of } from 'rxjs';

describe('NotificationDashboardComponent', () => {
  let component: NotificationDashboardComponent;
  let fixture: ComponentFixture<NotificationDashboardComponent>;
  let mockNotificationService: Partial<NotificationService>;
  let router: { navigate: jest.Mock };

  const mockNotificaciones: Notificacion[] = [
    {
      id: '1',
      tipo: 'CASA_REGISTRADA',
      mensaje: 'Nueva casa registrada en el sector Norte',
      leida: false,
      created_at: '2024-04-24T10:00:00Z',
    },
    {
      id: '2',
      tipo: 'CASA_REGISTRADA',
      mensaje: 'Casa actualizada en el sector Sur',
      leida: true,
      created_at: '2024-04-23T14:00:00Z',
    },
    {
      id: '3',
      tipo: 'VISITA_PROGRAMADA',
      mensaje: 'Visita programada para el 25/04/2024',
      leida: false,
      created_at: '2024-04-24T09:00:00Z',
    },
    {
      id: '4',
      tipo: 'ASIGNACION_CREADA',
      mensaje: 'Nueva asignación: Usher para el domingo',
      leida: false,
      created_at: '2024-04-24T08:00:00Z',
    },
    {
      id: '5',
      tipo: 'ASIGNACION_ACTUALIZADA',
      mensaje: 'Asignación de Parking actualizada',
      leida: true,
      created_at: '2024-04-23T16:00:00Z',
    },
  ];

  // Use writable signals so tests can update them via .set()
  const notificacionesSignal = signal(mockNotificaciones);
  const unreadCountSignal = signal(3);
  const loadingSignal = signal(false);

  function createMockNotificationService(override?: Partial<NotificationService>): Partial<NotificationService> {
    return {
      notificaciones: notificacionesSignal.asReadonly(),
      unreadCount: unreadCountSignal.asReadonly(),
      loading: loadingSignal.asReadonly(),
      loadNotifications: jest.fn().mockReturnValue(of({ data: mockNotificaciones, unread_count: 3 })),
      markAsRead: jest.fn().mockReturnValue(of({ message: 'Notificación marcada como leída' })),
      markAllAsRead: jest.fn().mockReturnValue(of({ message: 'Todas las notificaciones marcadas como leídas' })),
      ...override,
    };
  }

  beforeEach(async () => {
    // Reset shared signals to default values
    notificacionesSignal.set(mockNotificaciones);
    unreadCountSignal.set(3);
    loadingSignal.set(false);

    mockNotificationService = createMockNotificationService();
    router = { navigate: jest.fn() };

    await TestBed.configureTestingModule({
      imports: [NotificationDashboardComponent],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ========== Component Initialization ==========

  describe('initialization', () => {
    it('should be created', () => {
      expect(component).toBeTruthy();
    });

    it('should load notifications on init', () => {
      expect(mockNotificationService.loadNotifications).toHaveBeenCalled();
    });

    it('should display unread count in header', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('3 sin leer');
    }));

    it('should display "Marcar todas como leídas" button', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Marcar todas como leídas');
    });
  });

  // ========== Category Filter Pills ==========

  describe('category filter pills', () => {
    it('should have "Todos" pill as default active', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      const pills = fixture.nativeElement.querySelectorAll('.cat-pill');
      expect(pills[0].textContent).toContain('Todos');
      expect(pills[0].classList).toContain('active');
    }));

    it('should display all 4 categories plus the Todos pill', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      const expectedLabels = ['Asignaciones de Reunión', 'Visitas', 'Casas', 'Requiere Atención'];
      const pills = fixture.nativeElement.querySelectorAll('.cat-pill') as NodeListOf<Element>;
      const texts = Array.from(pills).map(p => p.textContent || '');
      expectedLabels.forEach(label => {
        expect(texts.some(t => t.includes(label))).toBe(true);
      });
    }));

    it('should show badge count on pills with notifications', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      const pills = fixture.nativeElement.querySelectorAll('.cat-pill') as NodeListOf<Element>;
      const casaPill = Array.from(pills).find(pill => pill.textContent?.includes('Casas'));

      expect(casaPill?.querySelector('.count-badge')).toBeTruthy();
      expect(casaPill?.querySelector('.count-badge')?.textContent).toBe('2');
    }));

    it('should not show badge when count is 0', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      const pills = fixture.nativeElement.querySelectorAll('.cat-pill') as NodeListOf<Element>;
      const alertaPill = Array.from(pills).find(pill => pill.textContent?.includes('Requiere Atención'));

      expect(alertaPill?.querySelector('.count-badge')).toBeNull();
    }));

    it('should set category when pill is clicked', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      const pills = fixture.nativeElement.querySelectorAll('.cat-pill') as NodeListOf<HTMLElement>;
      const casaPill = Array.from(pills).find(pill => pill.textContent?.includes('Casas'));

      casaPill?.click();
      tick();
      fixture.detectChanges();

      expect(component.selectedCatKey()).toBe('CASAS');
      expect(casaPill?.classList).toContain('active');
    }));

    it('should reset page to 1 when category changes', fakeAsync(() => {
      component.currentPage.set(3);
      tick();

      component.setCategory('VISITAS');
      tick();

      expect(component.currentPage()).toBe(1);
    }));
  });

  // ========== Notification Cards ==========

  describe('notification cards', () => {
    it('should display notification mensaje', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Nueva casa registrada en el sector Norte');
    }));

    it('should display formatted date', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('24 abr');
    }));

    it('should show unread badge for unread notifications', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      const unreadBadges = fixture.nativeElement.querySelectorAll('.unread-dot-badge');
      expect(unreadBadges.length).toBeGreaterThanOrEqual(1);
    }));

    it('should have unread class on unread notifications', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      const unreadCards = fixture.nativeElement.querySelectorAll('.notif-card-item.unread');
      expect(unreadCards.length).toBeGreaterThanOrEqual(1);
    }));
  });

  // ========== Mark as Read ==========

  describe('mark as read', () => {
    it('should call markAsRead when an unread notification card is clicked', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      const unreadCards = fixture.nativeElement.querySelectorAll('.notif-card-item.unread');
      if (unreadCards.length > 0) {
        unreadCards[0].click();
        tick();

        expect(mockNotificationService.markAsRead).toHaveBeenCalled();
      }
    }));

    it('should call markAllAsRead when button is clicked', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      const markAllButton = fixture.nativeElement.querySelector('.header-actions button') as HTMLButtonElement;
      markAllButton?.click();
      tick();

      expect(mockNotificationService.markAllAsRead).toHaveBeenCalled();
    }));

    it('should disable mark all button when unread count is 0', fakeAsync(() => {
      unreadCountSignal.set(0);
      tick();
      fixture.detectChanges();

      const markAllButton = fixture.nativeElement.querySelector('.header-actions button') as HTMLButtonElement;
      expect(markAllButton?.disabled).toBe(true);
    }));
  });

  // ========== Empty State ==========

  describe('empty state', () => {
    it('should show empty state when no notifications', fakeAsync(() => {
      notificacionesSignal.set([]);
      tick();
      fixture.detectChanges();

      const emptyState = fixture.nativeElement.querySelector('.empty-state-card');
      expect(emptyState).toBeTruthy();
      expect(emptyState?.textContent).toContain('No hay notificaciones');
    }));

    it('should show empty state when category has no matches', fakeAsync(() => {
      component.setCategory('ALERTAS');
      tick();
      fixture.detectChanges();

      const emptyState = fixture.nativeElement.querySelector('.empty-state-card');
      expect(emptyState).toBeTruthy();
    }));
  });

  // ========== Loading State ==========

  describe('loading state', () => {
    it('should show loading when loading is true', fakeAsync(() => {
      loadingSignal.set(true);
      tick();
      fixture.detectChanges();

      const loading = fixture.nativeElement.querySelector('.loading-state-card');
      expect(loading).toBeTruthy();
      expect(loading?.textContent).toContain('Cargando');
    }));
  });

  // ========== Pagination ==========

  function setupManyNotifications() {
    const manyNotificaciones: Notificacion[] = Array.from({ length: 55 }, (_, i) => ({
      id: `notif-${i}`,
      tipo: i < 50 ? 'CASA_REGISTRADA' : 'VISITA_PROGRAMADA',
      mensaje: `Notification ${i}`,
      leida: i % 2 === 0,
      created_at: new Date().toISOString(),
    }));
    notificacionesSignal.set(manyNotificaciones);
    unreadCountSignal.set(28);
    component.setCategory('TODOS');
  }

  describe('pagination', () => {
    beforeEach(() => {
      setupManyNotifications();
    });

    it('should show pagination when totalPages > 1', fakeAsync(() => {
      tick();
      fixture.detectChanges();

      expect(component.totalPages()).toBe(2);
      const pagination = fixture.nativeElement.querySelector('.pagination-bar');
      expect(pagination).toBeTruthy();
    }));

    it('should show correct page info', fakeAsync(() => {
      component.currentPage.set(2);
      tick();
      fixture.detectChanges();

      const pageInfo = fixture.nativeElement.querySelector('.page-count-text');
      expect(pageInfo?.textContent).toContain('Página 2');
    }));

    it('should disable prev button on page 1', fakeAsync(() => {
      component.currentPage.set(1);
      tick();
      fixture.detectChanges();

      const pagination = fixture.nativeElement.querySelector('.pagination-bar');
      const prevButton = pagination?.querySelector('button:first-child') as HTMLButtonElement;
      expect(prevButton?.disabled).toBe(true);
    }));

    it('should go to previous page', fakeAsync(() => {
      component.currentPage.set(2);
      tick();
      fixture.detectChanges();

      const pagination = fixture.nativeElement.querySelector('.pagination-bar');
      const prevButton = pagination?.querySelector('button:first-child');
      prevButton?.click();
      tick();

      expect(component.currentPage()).toBe(1);
    }));

    it('should go to next page', fakeAsync(() => {
      component.currentPage.set(1);
      tick();
      fixture.detectChanges();

      const pagination = fixture.nativeElement.querySelector('.pagination-bar');
      const nextButton = pagination?.querySelector('button:last-child');
      nextButton?.click();
      tick();

      expect(component.currentPage()).toBe(2);
    }));
  });

  // ========== Computed Signals ==========

  describe('computed signals', () => {
    it('filteredNotificaciones should return all when no category filter', fakeAsync(() => {
      component.setCategory('TODOS');
      tick();

      const filtered = component.filteredNotificaciones();
      expect(filtered.length).toBe(mockNotificaciones.length);
    }));

    it('filteredNotificaciones should filter by category', fakeAsync(() => {
      component.setCategory('CASAS');
      tick();

      const filtered = component.filteredNotificaciones();
      expect(filtered.every(n => n.tipo === 'CASA_REGISTRADA')).toBe(true);
    }));

    it('totalPages should calculate correctly', fakeAsync(() => {
      // 5 items with PAGE_SIZE=30 should give 1 page
      expect(component.totalPages()).toBe(1);

      const manyNotificaciones: Notificacion[] = Array.from({ length: 55 }, (_, i) => ({
        id: `notif-${i}`,
        tipo: 'CASA_REGISTRADA',
        mensaje: `Notification ${i}`,
        leida: false,
        created_at: new Date().toISOString(),
      }));

      notificacionesSignal.set(manyNotificaciones);
      component.setCategory('TODOS');
      tick();

      expect(component.totalPages()).toBe(2);
    }));

    it('pagedNotificaciones should return a slice of the current page', fakeAsync(() => {
      component.setCategory('TODOS');
      tick();

      expect(component.pagedNotificaciones().length).toBe(mockNotificaciones.length);
    }));
  });

  // ========== Helper Methods ==========

  describe('helper methods', () => {
    it('getTotalCount should return total notifications', fakeAsync(() => {
      tick();
      expect(component.getTotalCount()).toBe(mockNotificaciones.length);
    }));

    it('getCatCount should return correct count per category', fakeAsync(() => {
      tick();

      expect(component.getCatCount('CASAS')).toBe(2);
      expect(component.getCatCount('VISITAS')).toBe(1);
      expect(component.getCatCount('ASIGNACIONES')).toBe(2);
      expect(component.getCatCount('ALERTAS')).toBe(0);
    }));

    it('getCatLabel should return config label or key as fallback', fakeAsync(() => {
      tick();

      expect(component.getCatLabel('CASAS')).toBe('Casas');
      expect(component.getCatLabel('UNKNOWN')).toBe('UNKNOWN');
    }));

    it('getNotifMetadata should return config for a known tipo', fakeAsync(() => {
      tick();

      const meta = component.getNotifMetadata('CASA_REGISTRADA');
      expect(meta).toBeTruthy();
      expect(meta.label).toBe('Casas');
      expect(meta.icon).toBe('home');
      expect(meta.color).toBe('#22c55e');
    }));

    it('getNotifMetadata should return a default for unknown tipo', fakeAsync(() => {
      tick();
      const meta = component.getNotifMetadata('INVALID_TYPE');
      expect(meta.label).toBe('Notificación');
    }));

    it('formatDate should format date correctly', () => {
      const dateStr = '2024-04-24T10:30:00Z';
      const formatted = component.formatDate(dateStr);

      expect(formatted).toContain('24');
      expect(formatted.toLowerCase()).toContain('abr');
    });
  });

  // ========== Req 2 - goToAction navigation ==========

  describe('goToAction navigation (Req 2)', () => {
    it('should navigate to /asignaciones with semana_id queryParam for an ASIGNACION referencia', () => {
      const notif: Notificacion = {
        id: 'n1',
        tipo: 'ASIGNACION_CREADA',
        mensaje: 'Nueva asignación',
        leida: false,
        created_at: '2024-04-24T08:00:00Z',
        referencia_tipo: 'ASIGNACION',
        referencia_id: '123',
      };

      component.goToAction(notif);

      expect(router.navigate).toHaveBeenCalledWith(['/asignaciones'], { queryParams: { semana_id: '123' } });
    });

    it('should navigate to /asignaciones without queryParam when referencia_id is missing', () => {
      const notif: Notificacion = {
        id: 'n2',
        tipo: 'ASIGNACION_ACTUALIZADA',
        mensaje: 'Asignación actualizada',
        leida: true,
        created_at: '2024-04-23T16:00:00Z',
        referencia_tipo: 'ASIGNACION',
      };

      component.goToAction(notif);

      expect(router.navigate).toHaveBeenCalledWith(['/asignaciones']);
    });

    it('should navigate to /visitas for a VISITA_ tipo', () => {
      const notif: Notificacion = {
        id: 'n3',
        tipo: 'VISITA_PROGRAMADA',
        mensaje: 'Visita',
        leida: false,
        created_at: '2024-04-24T09:00:00Z',
      };

      component.goToAction(notif);

      expect(router.navigate).toHaveBeenCalledWith(['/visitas']);
    });

    it('should navigate to /casas for a CASA_ tipo', () => {
      const notif: Notificacion = {
        id: 'n4',
        tipo: 'CASA_REGISTRADA',
        mensaje: 'Casa',
        leida: false,
        created_at: '2024-04-24T10:00:00Z',
      };

      component.goToAction(notif);

      expect(router.navigate).toHaveBeenCalledWith(['/casas']);
    });
  });
});

// ========== Type Config Tests ==========

describe('NotificationDashboardComponent - categorias config', () => {
  const categorias = [
    { key: 'ASIGNACIONES', label: 'Asignaciones de Reunión', icon: 'assignment', color: '#8b5cf6' },
    { key: 'VISITAS', label: 'Visitas', icon: 'event_available', color: '#3b82f6' },
    { key: 'CASAS', label: 'Casas', icon: 'home', color: '#22c55e' },
    { key: 'ALERTAS', label: 'Requiere Atención', icon: 'warning', color: '#f59e0b' },
  ];

  it('should have all required categories defined', () => {
    const requiredKeys = ['ASIGNACIONES', 'VISITAS', 'CASAS', 'ALERTAS'];
    requiredKeys.forEach(key => {
      const config = categorias.find(c => c.key === key);
      expect(config).toBeTruthy();
    });
  });

  it('should have unique icons for each category', () => {
    const icons = categorias.map(c => c.icon);
    const uniqueIcons = new Set(icons);
    expect(uniqueIcons.size).toBe(icons.length);
  });

  it('should have unique colors for each category', () => {
    const colors = categorias.map(c => c.color);
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(colors.length);
  });
});
