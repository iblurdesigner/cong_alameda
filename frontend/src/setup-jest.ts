// Jest setup file - minimal configuration for unit tests
// zone.js/testing no es compatible con Jest 30 todavía

// Mock localStorage globalmente
const localStorageMock = {
  getItem: jest.fn(() => null),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true
});
