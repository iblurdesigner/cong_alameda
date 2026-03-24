import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'app-theme';
  
  isDark = signal(this.getInitialTheme());

  constructor() {
    // Aplicar tema al iniciar
    effect(() => {
      this.applyTheme(this.isDark());
    });
  }

  private getInitialTheme(): boolean {
    // Verificar localStorage
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      return stored === 'dark';
    }
    // Verificar preferencia del sistema
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }
    return false;
  }

  private applyTheme(dark: boolean) {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem(this.STORAGE_KEY, dark ? 'dark' : 'light');
  }

  toggle() {
    this.isDark.update(v => !v);
  }

  setDark(value: boolean) {
    this.isDark.set(value);
  }
}