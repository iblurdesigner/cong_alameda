import { of } from 'rxjs';
import { AuthService, User, LoginResponse } from './auth.service';

// Helper to clear localStorage mock storage
const clearStorage = () => {
  (globalThis as any).__clearLocalStorage?.();
};

// Mock HttpClient - we don't need the real HttpClient for unit tests
// We can test the service logic without making HTTP calls
const createMockHttpClient = () => ({
  post: jest.fn().mockReturnValue(of({})),
  get: jest.fn().mockReturnValue(of({}))
});

// Mock Router
const createMockRouter = () => ({
  navigate: jest.fn()
});

describe('AuthService', () => {
  let service: AuthService;
  let mockHttpClient: ReturnType<typeof createMockHttpClient>;
  let mockRouter: ReturnType<typeof createMockRouter>;

  const mockUser: User = {
    id: '1',
    nombre: 'Juan Pérez',
    email: 'juan@iglesia.org',
    telefono: '1234567890',
    telefono_validado: true,
    rol: 'SUPERINTENDENTE',
    activo: true,
    notificaciones_email: true,
    notificaciones_whatsapp: false,
  };

  beforeEach(() => {
    clearStorage();
    mockHttpClient = createMockHttpClient();
    mockRouter = createMockRouter();
    
    // Create service with mocked dependencies
    service = new AuthService(
      mockHttpClient as any,
      mockRouter as any
    );
  });

  afterEach(() => {
    clearStorage();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have no authenticated user initially', () => {
      expect(service.currentUser()).toBeNull();
    });

    it('should not be authenticated initially', () => {
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should load user from localStorage if present', () => {
      localStorage.setItem('auth_token', 'stored-token');
      localStorage.setItem('auth_user', JSON.stringify(mockUser));

      const newService = new AuthService(mockHttpClient as any, mockRouter as any);
      expect(newService.isAuthenticated()).toBe(true);
      expect(newService.currentUser()).toEqual(mockUser);
    });
  });

  describe('login', () => {
    it('should call POST with email and password', () => {
      const email = 'test@iglesia.org';
      const password = 'password123';
      const mockResponse: LoginResponse = { token: 'jwt-token', user: mockUser };

      (mockHttpClient.post as jest.Mock).mockReturnValue(of(mockResponse));

      const result = service.login(email, password);
      
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        { email, password }
      );
    });

    it('should return observable with token and user', () => {
      const mockResponse: LoginResponse = { token: 'jwt-token', user: mockUser };

      (mockHttpClient.post as jest.Mock).mockReturnValue(of(mockResponse));

      let receivedResponse: LoginResponse | null = null;
      service.login('test@test.com', 'pass').subscribe((r: LoginResponse) => {
        receivedResponse = r;
      });

      expect(receivedResponse).toEqual(mockResponse);
    });
  });

  describe('setAuth', () => {
    it('should store token in localStorage', () => {
      service.setAuth('token-123', mockUser);
      expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'token-123');
    });

    it('should store user in localStorage as JSON', () => {
      service.setAuth('token-123', mockUser);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'auth_user',
        JSON.stringify(mockUser)
      );
    });

    it('should update currentUser signal', () => {
      service.setAuth('token-123', mockUser);
      expect(service.currentUser()).toEqual(mockUser);
    });

    it('should set isAuthenticated to true', () => {
      service.setAuth('token-123', mockUser);
      expect(service.isAuthenticated()).toBe(true);
    });
  });

  describe('getToken', () => {
    it('should return null when no token stored', () => {
      expect(service.getToken()).toBeNull();
    });

    it('should return token when stored', () => {
      localStorage.setItem('auth_token', 'stored-token');
      const newService = new AuthService(mockHttpClient as any, mockRouter as any);
      expect(newService.getToken()).toBe('stored-token');
    });
  });

  describe('logout', () => {
    it('should remove token from localStorage', () => {
      localStorage.setItem('auth_token', 'some-token');
      service.logout();
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
    });

    it('should remove user from localStorage', () => {
      localStorage.setItem('auth_user', JSON.stringify(mockUser));
      service.logout();
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_user');
    });

    it('should clear currentUser signal', () => {
      service.setAuth('token-123', mockUser);
      expect(service.currentUser()).toEqual(mockUser);
      service.logout();
      expect(service.currentUser()).toBeNull();
    });

    it('should not be authenticated after logout', () => {
      service.setAuth('token-123', mockUser);
      expect(service.isAuthenticated()).toBe(true);
      service.logout();
      expect(service.isAuthenticated()).toBe(false);
    });

    it('should navigate to home after logout', () => {
      service.logout();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('role checks', () => {
    it('isSuperintendente should return true for SUPERINTENDENTE role', () => {
      service.setAuth('token', { ...mockUser, rol: 'SUPERINTENDENTE' });
      expect(service.isSuperintendente()).toBe(true);
      expect(service.isAnciano()).toBe(false);
      expect(service.isVisitante()).toBe(false);
    });

    it('isAnciano should return true for ANCIANO role', () => {
      service.setAuth('token', { ...mockUser, rol: 'ANCIANO' });
      expect(service.isAnciano()).toBe(true);
      expect(service.isSuperintendente()).toBe(false);
    });

    it('isVisitante should return true for VISITANTE role', () => {
      service.setAuth('token', { ...mockUser, rol: 'VISITANTE' });
      expect(service.isVisitante()).toBe(true);
      expect(service.isSuperintendente()).toBe(false);
    });

    it('should return false for all roles when user is null', () => {
      expect(service.isSuperintendente()).toBe(false);
      expect(service.isAnciano()).toBe(false);
      expect(service.isVisitante()).toBe(false);
    });
  });

  describe('getUsers', () => {
    it('should call GET /users', () => {
      const mockUsers: User[] = [mockUser];

      (mockHttpClient.get as jest.Mock).mockReturnValue(of(mockUsers));

      let receivedUsers: User[] | null = null;
      service.getUsers().subscribe((users: User[]) => {
        receivedUsers = users;
      });

      expect(mockHttpClient.get).toHaveBeenCalledWith(expect.stringContaining('/users'));
      expect(receivedUsers).toEqual(mockUsers);
    });
  });

  describe('persistence', () => {
    it('should persist auth across service instances', () => {
      service.setAuth('token-123', mockUser);
      
      // Create new service instance (simulates app restart)
      const newService = new AuthService(mockHttpClient as any, mockRouter as any);
      
      expect(newService.isAuthenticated()).toBe(true);
      expect(newService.currentUser()).toEqual(mockUser);
      expect(newService.getToken()).toBe('token-123');
    });

    it('should handle corrupted localStorage user data gracefully', () => {
      localStorage.setItem('auth_token', 'some-token');
      localStorage.setItem('auth_user', 'invalid-json{');
      
      const newService = new AuthService(mockHttpClient as any, mockRouter as any);
      
      // Should not crash and should handle gracefully
      expect(newService.currentUser()).toBeNull();
    });
  });
});
