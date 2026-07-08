import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-recovery',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="recovery-container">
      <div class="recovery-card">
        <div class="recovery-header">
          <h1>Recuperar Contrase├▒a</h1>
          <p>Ingresa tu nueva contrase├▒a</p>
        </div>

        @if (error()) {
          <div class="error-message">
            {{ error() }}
          </div>
        }

        @if (success()) {
          <div class="success-message">
            <p>┬íContrase├▒a actualizada exitosamente!</p>
            <p>Ya puedes iniciar sesi├│n con tu nueva contrase├▒a.</p>
            <button class="btn btn-primary btn-block" (click)="goToLogin()">
              Ir a Iniciar Sesi├│n
            </button>
          </div>
        } @else if (loading()) {
          <div class="loading">
            <div class="spinner"></div>
            <p>Procesando...</p>
          </div>
        } @else {
          <form (ngSubmit)="onSubmit()" class="recovery-form">
            <div class="form-group">
              <label for="password">Nueva Contrase├▒a</label>
              <input
                type="password"
                id="password"
                name="password"
                [(ngModel)]="password"
                placeholder="M├¡nimo 6 caracteres"
                required
                minlength="6"
              />
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirmar Contrase├▒a</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                [(ngModel)]="confirmPassword"
                placeholder="Repite la contrase├▒a"
                required
              />
              @if (password() && confirmPassword() && password() !== confirmPassword()) {
                <div class="validation-error">
                  Las contrase├▒as no coinciden
                </div>
              }
            </div>

            <button
              type="submit"
              class="btn btn-primary btn-block"
              [disabled]="loading() || !isValid()"
            >
              Cambiar Contrase├▒a
            </button>
          </form>
        }

        <div class="back-link">
          <button class="btn-link" (click)="goToLogin()">
            ΓåÉ Volver al inicio de sesi├│n
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .recovery-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    }

    .recovery-card {
      background: var(--surface-color);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      padding: 2.5rem;
      width: 100%;
      max-width: 400px;
    }

    .recovery-header {
      text-align: center;
      margin-bottom: 2rem;

      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 0.5rem;
      }

      p {
        color: var(--text-secondary);
        font-size: 0.875rem;
      }
    }

    .recovery-form {
      .form-group {
        margin-bottom: 1.25rem;
      }

      .btn-block {
        width: 100%;
        padding: 0.875rem;
        font-size: 1rem;
      }
    }

    .error-message {
      background: rgba(239, 68, 68, 0.1);
      color: var(--danger-color);
      padding: 0.75rem;
      border-radius: var(--radius-md);
      margin-bottom: 1rem;
      font-size: 0.875rem;
      text-align: center;
    }

    .success-message {
      text-align: center;
      margin-bottom: 1.5rem;

      p {
        color: var(--text-primary);
        margin-bottom: 0.5rem;
      }

      .btn-block {
        width: 100%;
        padding: 0.875rem;
        font-size: 1rem;
        margin-top: 1rem;
      }
    }

    .validation-error {
      color: var(--danger-color);
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .loading {
      text-align: center;
      padding: 2rem;

      .spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--border-color);
        border-top-color: var(--primary-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }

      p {
        color: var(--text-secondary);
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .back-link {
      text-align: center;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);

      .btn-link {
        background: none;
        border: none;
        color: var(--primary-color);
        font-size: 0.875rem;
        cursor: pointer;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  `]
})
export class RecoveryComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  token = '';
  password = signal('');
  confirmPassword = signal('');
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  ngOnInit() {
    // Get token from query params
    this.route.queryParams.subscribe((params: Record<string, string>) => {
      this.token = params['token'] || '';
      if (!this.token) {
        this.error.set('Token inv├ílido o expirado');
      }
    });
  }

  isValid(): boolean {
    return (
      !!this.token &&
      this.password().length >= 6 &&
      this.password() === this.confirmPassword()
    );
  }

  onSubmit() {
    if (!this.isValid()) {
      this.error.set('Por favor completa todos los campos correctamente');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.authService.resetPassword(this.token, this.password()).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
      },
      error: (err: { error?: { error?: string; message?: string } }) => {
        this.loading.set(false);
        if (err.error?.error === 'token_expired') {
          this.error.set('El enlace ha expirado. Solicita uno nuevo.');
        } else if (err.error?.error === 'invalid_token') {
          this.error.set('Token inv├ílido. Solicita un nuevo enlace de recuperaci├│n.');
        } else {
          this.error.set(err.error?.message || 'Error al cambiar la contrase├▒a');
        }
      }
    });
  }

  goToLogin() {
    void this.router.navigate(['/login']);
  }
}
