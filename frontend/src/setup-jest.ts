// Jest setup file - configure Angular zone test environment
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

setupZoneTestEnv();

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
