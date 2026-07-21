// Jest setup file - minimal configuration for unit tests

// Import Angular compiler for JIT compilation (required for HttpClient)
import '@angular/compiler';
// Load Zone.js for async operations (required by Angular)
import 'zone.js';
import { COMPILER_OPTIONS, NgModule, provideZoneChangeDetection, VERSION } from '@angular/core';
import { getTestBed } from '@angular/core/testing';

// Initialize Angular test environment (without zone.js/testing which breaks Jest 30)
// Use dynamic require for @angular/platform-browser/testing to avoid TS resolution issues
const { BrowserTestingModule, platformBrowserTesting } = require('@angular/platform-browser/testing');

if (+VERSION.major >= 21) {
  class TestModule {}
  NgModule({
    providers: [provideZoneChangeDetection()],
  })(TestModule);

  getTestBed().initTestEnvironment(
    [BrowserTestingModule, TestModule],
    platformBrowserTesting([
      {
        provide: COMPILER_OPTIONS,
        useValue: {},
        multi: true,
      },
    ]),
  );
} else {
  getTestBed().initTestEnvironment(
    BrowserTestingModule,
    platformBrowserTesting(),
  );
}

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
