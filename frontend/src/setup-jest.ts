// Jest setup file - minimal configuration for unit tests
// zone.js/testing no es compatible con Jest 30 todavía

// Import Angular compiler for JIT compilation (required for HttpClient)
import '@angular/compiler';

// Mock localStorage que persiste datos entre llamadas
let storage: Record<string, string> = {};

const localStorageMock = {
  getItem: jest.fn((key: string) => storage[key] ?? null),
  setItem: jest.fn((key: string, value: string) => {
    storage[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete storage[key];
  }),
  clear: jest.fn(() => {
    storage = {};
  })
};

// Helper para limpiar storage en tests
(globalThis as any).__clearLocalStorage = () => {
  storage = {};
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
});
