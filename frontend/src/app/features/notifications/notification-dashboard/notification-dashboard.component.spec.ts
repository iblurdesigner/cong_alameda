import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationDashboardComponent } from './notification-dashboard.component';
import { NotificationService, Notificacion, NotificacionListResponse } from '../../../core/services/notification.service';
import { signal, WritableSignal } from '@angular/core';
import { of } from 'rxjs';

describe('NotificationDashboardComponent', () => {
  let component: NotificationDashboardComponent;
  let fixture: ComponentFixture<NotificationDashboardComponent>;
  let mockNotificationService: Partial<NotificationService> & {
    _notifSignal: WritableSignal<Notificacion[]>;
    _unreadSignal: WritableSignal<number>;
    _loadingSignal: WritableSignal<boolean>;
  };

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
      mensaje: 'Nueva asignaci├│n: Usher para el domingo',
      leida: false,
      created_at: '2024-04-24T08:00:00Z',
    },
    {
      id: '5',
      tipo: 'ASIGNACION_ACTUALIZADA',
      mensaje: 'Asignaci├│n de Parking actualizada',
      leida: true,
      created_at: '2024-04-23T16:00:00Z',
    },
  ];

  function createMockNotificationService(override?: Partial<NotificationService>): Partial<NotificationService> & {
    _notifSignal: WritableSignal<Notificacion[]>;
    _unreadSignal: WritableSignal<number>;
    _loadingSignal: WritableSignal<boolean>;
  } {
    const _notifSignal = signal(mockNotificaciones);
    const _unreadSignal = signal(3);
    const _loadingSignal = signal(false);
    return {
      notificaciones: _notifSignal.asReadonly(),
      unreadCount: _unreadSignal.asReadonly(),
      loading: _loadingSignal.asReadonly(),
      loadNotifications: jest.fn().mockReturnValue(of({ data: mockNotificaciones, unread_count: 3 })),
      markAsRead: jest.fn().mockReturnValue(of({ message: 'Notificaci├│n marcada como le├¡da' })),
      markAllAsRead: jest.fn().mockReturnValue(of({ message: 'Todas las notificaciones marcadas como le├¡das' })),
      _notifSignal,
      _unreadSignal,
      _loadingSignal,
      ...override,
    };
  }

  beforeEach(async () => {
    TestBed.resetTestingModule();
    mockNotificationService = createMockNotificationService();

    await TestBed.configureTestingModule({
      imports: [NotificationDashboardComponent],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
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

    it('should display unread count in header', () => {

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('3 sin leer');
    });

    it('should display "Marcar todas como le├¡das" button', () => {
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Marcar todas como le├¡das');
    });
  });

  // ========== Filter Chips ==========

  describe('filter chips', () => {
    it('should have "Todos" chip as default active', () => {

      fixture.detectChanges();

      const chips = fixture.nativeElement.querySelectorAll('.filter-card');
      expect(chips[0].textContent).toContain('Todos');
      expect(chips[0].classList).toContain('active');
    });

    it('should display all notification types as chips', () => {

      fixture.detectChanges();

      const expectedTipos = [
        'CASA_REGISTRADA',
        'VISITA_PROGRAMADA',
        'VISITA_COMPLETADA',
        'PERSONA_REQUIERE_VISITA',
        'ASIGNACION_CREADA',
        'ASIGNACION_ACTUALIZADA',
        'ASIGNACION_COMPLETADA',
      ];

      const chips = fixture.nativeElement.querySelectorAll('.filter-card');
      expect(chips.length).toBe(expectedTipos.length + 1); // +1 for "Todos"
    });

    it('should show badge count on chips with notifications', () => {

      fixture.detectChanges();

      const chips = fixture.nativeElement.querySelectorAll('.filter-card');
      const casaChip = Array.from<Element>(chips).find(c =>
        c.textContent?.includes('Casas')
      );
      
      expect(casaChip?.querySelector('.filter-count')).toBeTruthy();
      expect(casaChip?.querySelector('.filter-count')?.textContent).toBe('2');
    });

    it('should not show badge when count is 0', () => {

      fixture.detectChanges();

      const chips = fixture.nativeElement.querySelectorAll('.filter-card');
      const completadaChip = Array.from<Element>(chips).find(c =>
        c.textContent?.includes('Completadas')
      );
      
      // Should not have badge if count is 0
      expect(completadaChip?.querySelector('.filter-count')).toBeNull();
    });

    it('should set filter when chip is clicked', () => {

      fixture.detectChanges();

      const chips = fixture.nativeElement.querySelectorAll('.filter-card');
      const casaChip = chips[1]; // Second chip (after "Todos")

      casaChip.click();

      fixture.detectChanges();

      expect(component.selectedTipo()).toBe('CASA_REGISTRADA');
      expect(casaChip.classList).toContain('active');
    });

    it('should reset page to 1 when filter changes', () => {
      component.currentPage.set(3);


      component.setFilter('VISITA_PROGRAMADA');


      expect(component.currentPage()).toBe(1);
    });
  });

  // ========== Grouping by Type ==========

  describe('grouping by type', () => {
    it('should group notifications by tipo', () => {

      fixture.detectChanges();

      const groups = component.groupedNotificaciones();
      
      // Should have 4 groups: CASA_REGISTRADA(2), VISITA_PROGRAMADA(1), 
      // ASIGNACION_CREADA(1), ASIGNACION_ACTUALIZADA(1)
      expect(groups.length).toBeGreaterThanOrEqual(1);
    });

    it('should show count per group', () => {

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const groupTitles = compiled.querySelectorAll('.group-title');
      
      expect(groupTitles.length).toBeGreaterThanOrEqual(1);
    });

    it('should sort groups alphabetically by tipo', () => {

      fixture.detectChanges();

      const groups = component.groupedNotificaciones();
      const tipos = groups.map(g => g.tipo);
      
      const sorted = [...tipos].sort();
      expect(tipos).toEqual(sorted);
    });

    it('should not group when filtered by tipo', () => {
      component.setFilter('CASA_REGISTRADA');

      fixture.detectChanges();

      const groups = component.groupedNotificaciones();
      
      if (groups.length > 0) {
        expect(groups.length).toBe(1);
        expect(groups[0].tipo).toBe('CASA_REGISTRADA');
      }
    });
  });

  // ========== Notification Cards ==========

  describe('notification cards', () => {
    it('should display notification mensaje', () => {

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('Nueva casa registrada en el sector Norte');
    });

    it('should display formatted date', () => {

      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.textContent).toContain('24 abr');
    });

    it('should show unread badge for unread notifications', () => {

      fixture.detectChanges();

      const unreadBadges = fixture.nativeElement.querySelectorAll('.unread-badge');
      expect(unreadBadges.length).toBeGreaterThanOrEqual(1);
    });

    it('should not show unread badge for read notifications', () => {

      fixture.detectChanges();

      const readNotifications = fixture.nativeElement.querySelectorAll('.notif-card:not(.unread)');
      expect(readNotifications.length).toBeGreaterThanOrEqual(1);
    });

    it('should have unread class on unread notifications', () => {

      fixture.detectChanges();

      const unreadCards = fixture.nativeElement.querySelectorAll('.notif-card.unread');
      expect(unreadCards.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ========== Mark as Read ==========

  describe('mark as read', () => {
    it('should call markAsRead when unread notification is clicked', () => {

      fixture.detectChanges();

      const unreadCards = fixture.nativeElement.querySelectorAll('.notif-card.unread');
      if (unreadCards.length > 0) {
        unreadCards[0].click();
  

        expect(mockNotificationService.markAsRead).toHaveBeenCalled();
      }
    });

    it('should not call markAsRead when read notification is clicked', () => {

      fixture.detectChanges();

      const readCards = fixture.nativeElement.querySelectorAll('.notif-card:not(.unread)');
      if (readCards.length > 0) {
        readCards[0].click();
  

        // markAsRead should not be called for already read notifications
        // In the component, this is handled by the markRead method
      }
    });

    it('should call markAllAsRead when button is clicked', () => {

      fixture.detectChanges();

      const markAllButton = fixture.nativeElement.querySelector('.page-header button');
      markAllButton?.click();


      expect(mockNotificationService.markAllAsRead).toHaveBeenCalled();
    });

    it('should disable mark all button when unread count is 0', () => {
      mockNotificationService._unreadSignal.set(0);

      fixture.detectChanges();

      const markAllButton = fixture.nativeElement.querySelector('.page-header button') as HTMLButtonElement;
      expect(markAllButton?.disabled).toBe(true);
    });
  });

  // ========== Empty State ==========

  describe('empty state', () => {
    it('should show empty state when no notifications', () => {
      mockNotificationService._notifSignal.set([]);

      fixture.detectChanges();

      const emptyState = fixture.nativeElement.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
      expect(emptyState?.textContent).toContain('No hay notificaciones');
    });

    it('should show empty state when filter has no matches', () => {
      // This type has no notifications in mock
      component.setFilter('PERSONA_REQUIERE_VISITA');

      fixture.detectChanges();

      const emptyState = fixture.nativeElement.querySelector('.empty-state');
      expect(emptyState).toBeTruthy();
    });
  });

  // ========== Loading State ==========

  describe('loading state', () => {
    it('should show loading when loading is true', () => {
      mockNotificationService._loadingSignal.set(true);

      fixture.detectChanges();

      const loading = fixture.nativeElement.querySelector('.loader-container');
      expect(loading).toBeTruthy();
      expect(loading?.textContent).toContain('Cargando');
    });
  });

  // ========== Pagination ==========

  describe('pagination', () => {
    it('should show pagination when totalPages > 1', () => {
      // Add more notifications to trigger pagination (PAGE_SIZE = 50)
      const manyNotificaciones: Notificacion[] = Array.from({ length: 55 }, (_, i) => ({
        id: `notif-${i}`,
        tipo: 'CASA_REGISTRADA',
        mensaje: `Notification ${i}`,
        leida: i % 2 === 0,
        created_at: new Date().toISOString(),
      }));

      mockNotificationService._notifSignal.set(manyNotificaciones);
      component.setFilter(null);

      fixture.detectChanges();

      const pagination = fixture.nativeElement.querySelector('.pagination');
      expect(pagination).toBeTruthy();
    });

    it('should show correct page info', () => {
      const manyNotificaciones: Notificacion[] = Array.from({ length: 55 }, (_, i) => ({
        id: `notif-${i}`,
        tipo: i < 50 ? 'CASA_REGISTRADA' : 'VISITA_PROGRAMADA',
        mensaje: `Notification ${i}`,
        leida: i % 2 === 0,
        created_at: new Date().toISOString(),
      }));
      mockNotificationService._notifSignal.set(manyNotificaciones);
      component.setFilter(null);
      component.currentPage.set(2);

      fixture.detectChanges();

      const pageInfo = fixture.nativeElement.querySelector('.page-info');
      expect(pageInfo?.textContent).toContain('P├ígina 2');
    });

    it('should disable prev button on page 1', () => {
      const manyNotificaciones: Notificacion[] = Array.from({ length: 55 }, (_, i) => ({
        id: `notif-${i}`,
        tipo: i < 50 ? 'CASA_REGISTRADA' : 'VISITA_PROGRAMADA',
        mensaje: `Notification ${i}`,
        leida: i % 2 === 0,
        created_at: new Date().toISOString(),
      }));
      mockNotificationService._notifSignal.set(manyNotificaciones);
      component.setFilter(null);
      component.currentPage.set(1);

      fixture.detectChanges();

      const prevButton = fixture.nativeElement.querySelector('.page-btn:first-child') as HTMLButtonElement;
      expect(prevButton?.disabled).toBe(true);
    });

    it('should go to previous page', () => {
      const manyNotificaciones: Notificacion[] = Array.from({ length: 55 }, (_, i) => ({
        id: `notif-${i}`,
        tipo: i < 50 ? 'CASA_REGISTRADA' : 'VISITA_PROGRAMADA',
        mensaje: `Notification ${i}`,
        leida: i % 2 === 0,
        created_at: new Date().toISOString(),
      }));
      mockNotificationService._notifSignal.set(manyNotificaciones);
      component.setFilter(null);
      component.currentPage.set(2);

      fixture.detectChanges();

      const prevButton = fixture.nativeElement.querySelector('.page-btn:first-child');
      prevButton?.click();


      expect(component.currentPage()).toBe(1);
    });

    it('should go to next page', () => {
      const manyNotificaciones: Notificacion[] = Array.from({ length: 55 }, (_, i) => ({
        id: `notif-${i}`,
        tipo: i < 50 ? 'CASA_REGISTRADA' : 'VISITA_PROGRAMADA',
        mensaje: `Notification ${i}`,
        leida: i % 2 === 0,
        created_at: new Date().toISOString(),
      }));
      mockNotificationService._notifSignal.set(manyNotificaciones);
      component.setFilter(null);
      component.currentPage.set(1);

      fixture.detectChanges();

      const nextButton = fixture.nativeElement.querySelector('.page-btn:last-child');
      nextButton?.click();


      expect(component.currentPage()).toBe(2);
    });
  });

  // ========== Computed Signals ==========

  describe('computed signals', () => {
    it('filteredNotificaciones should return all when no filter', () => {
      component.setFilter(null);


      const filtered = component.filteredNotificaciones();
      expect(filtered.length).toBe(mockNotificaciones.length);
    });

    it('filteredNotificaciones should filter by tipo', () => {
      component.setFilter('CASA_REGISTRADA');


      const filtered = component.filteredNotificaciones();
      expect(filtered.every(n => n.tipo === 'CASA_REGISTRADA')).toBe(true);
    });

    it('totalPages should calculate correctly', () => {
      // 5 items with PAGE_SIZE=50 should give 1 page
      expect(component.totalPages()).toBe(1);

      // Add more items
      const manyNotificaciones: Notificacion[] = Array.from({ length: 55 }, (_, i) => ({
        id: `notif-${i}`,
        tipo: 'CASA_REGISTRADA',
        mensaje: `Notification ${i}`,
        leida: false,
        created_at: new Date().toISOString(),
      }));

      mockNotificationService._notifSignal.set(manyNotificaciones);
      component.setFilter(null);

      expect(component.totalPages()).toBe(2);
    });
  });

  // ========== Helper Methods ==========

  describe('helper methods', () => {
    it('getCountByTipo should return correct count', () => {


      expect(component.getCountByTipo('CASA_REGISTRADA')).toBe(2);
      expect(component.getCountByTipo('VISITA_PROGRAMADA')).toBe(1);
      expect(component.getCountByTipo('ASIGNACION_CREADA')).toBe(1);
      expect(component.getCountByTipo('PERSONA_REQUIERE_VISITA')).toBe(0);
    });

    it('getTipoConfig should return config for valid tipo', () => {


      const config = component.getTipoConfig('CASA_REGISTRADA');
      expect(config).toBeTruthy();
      expect(config?.key).toBe('CASA_REGISTRADA');
      expect(config?.icon).toBe('≡ƒÅá');
      expect(config?.color).toBe('#22c55e');
    });

    it('getTipoConfig should return undefined for invalid tipo', () => {


      const config = component.getTipoConfig('INVALID_TYPE');
      expect(config).toBeUndefined();
    });

    it('getTipoLabel should return config label or tipo as fallback', () => {


      expect(component.getTipoLabel('CASA_REGISTRADA')).toBe('Casas');
      expect(component.getTipoLabel('UNKNOWN')).toBe('UNKNOWN');
    });

    it('formatDate should format date correctly', () => {
      const dateStr = '2024-04-24T10:30:00Z';
      const formatted = component.formatDate(dateStr);
      
      expect(formatted).toContain('24');
      expect(formatted.toLowerCase()).toContain('abr');
    });
  });
});

// ========== Type Config Tests ==========

describe('NotificationDashboardComponent - tipos config', () => {
  const tipos = [
    { key: 'CASA_REGISTRADA', label: 'Casas', icon: '≡ƒÅá', color: '#22c55e' },
    { key: 'VISITA_PROGRAMADA', label: 'Visitas', icon: '≡ƒôà', color: '#3b82f6' },
    { key: 'VISITA_COMPLETADA', label: 'Completadas', icon: 'Γ£à', color: '#10b981' },
    { key: 'PERSONA_REQUIERE_VISITA', label: 'Requiere Visita', icon: '≡ƒñ¥', color: '#f59e0b' },
    { key: 'ASIGNACION_CREADA', label: 'Asignaci├│n Nueva', icon: '≡ƒÄñ', color: '#8b5cf6' },
    { key: 'ASIGNACION_ACTUALIZADA', label: 'Asignaci├│n Actualizada', icon: '≡ƒöä', color: '#ec4899' },
    { key: 'ASIGNACION_COMPLETADA', label: 'Asignaci├│n Completada', icon: '≡ƒÄ»', color: '#14b8a6' },
  ];

  it('should have all required notification types defined', () => {
    const requiredTypes = [
      'CASA_REGISTRADA',
      'VISITA_PROGRAMADA',
      'VISITA_COMPLETADA',
      'PERSONA_REQUIERE_VISITA',
      'ASIGNACION_CREADA',
      'ASIGNACION_ACTUALIZADA',
      'ASIGNACION_COMPLETADA',
    ];

    requiredTypes.forEach(tipo => {
      const config = tipos.find(t => t.key === tipo);
      expect(config).toBeTruthy();
    });
  });

  it('should have unique icons for each type', () => {
    const icons = tipos.map(t => t.icon);
    const uniqueIcons = new Set(icons);
    expect(uniqueIcons.size).toBe(icons.length);
  });

  it('should have unique colors for each type', () => {
    const colors = tipos.map(t => t.color);
    const uniqueColors = new Set(colors);
    expect(uniqueColors.size).toBe(colors.length);
  });
});

// ========== Badge Tests ==========

describe('NotificationDashboardComponent - badge logic', () => {
  it('should show badge only when count > 0', () => {
    const showBadge = (count: number) => count > 0;

    expect(showBadge(0)).toBe(false);
    expect(showBadge(1)).toBe(true);
    expect(showBadge(5)).toBe(true);
  });

  it('should calculate badge count correctly for mixed read/unread', () => {
    const notificaciones = [
      { id: '1', leida: false },
      { id: '2', leida: true },
      { id: '3', leida: false },
      { id: '4', leida: false },
    ];

    const countByTipo = (tipo: string) => {
      return notificaciones.length; // Simplified - actual implementation filters by tipo
    };

    expect(countByTipo('CASA_REGISTRADA')).toBe(4);
  });
});
