import { Injectable, signal, effect, OnDestroy } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService implements OnDestroy {
  private readonly STORAGE_KEY = 'app-theme';
  private mediaQuery: MediaQueryList | null = null;
  
  isDark = signal(this.getInitialTheme());

  constructor() {
    // Aplicar tema al iniciar
    effect(() => {
      this.applyTheme(this.isDark());
    });

    // Escuchar cambios de preferencia del sistema en tiempo real
    if (window.matchMedia) {
      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', this.handleSystemThemeChange);
    }
  }

  ngOnDestroy() {
    if (this.mediaQuery) {
      this.mediaQuery.removeEventListener('change', this.handleSystemThemeChange);
    }
  }

  private handleSystemThemeChange = (e: MediaQueryListEvent) => {
    // Solo actualizar si el usuario no tiene preferencia manual guardada
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) {
      this.isDark.set(e.matches);
    }
  };

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

  // M├⌐todo para resetear a preferencia del sistema
  resetToSystemPreference() {
    localStorage.removeItem(this.STORAGE_KEY);
    if (window.matchMedia) {
      this.isDark.set(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }
}
