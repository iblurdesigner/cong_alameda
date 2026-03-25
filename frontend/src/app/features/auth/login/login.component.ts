import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>App Congregación Alameda</h1>
          <p>Sistema de Gestión del Superintendente de Servicio</p>
        </div>
        
        <form (ngSubmit)="onSubmit()" class="login-form">
          @if (error()) {
            <div class="error-message">
              {{ error() }}
            </div>
          }
          
          <div class="form-group">
            <label for="email">Correo Electrónico</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              [(ngModel)]="email"
              placeholder="correo@ejemplo.com"
              required
            />
          </div>
          
          <div class="form-group">
            <label for="password">Contraseña</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              [(ngModel)]="password"
              placeholder="Tu contraseña"
              required
            />
          </div>
          
          <button 
            type="submit" 
            class="btn btn-primary btn-block"
            [disabled]="loading()"
          >
            @if (loading()) {
              <span class="spinner"></span>
              Ingresando...
            } @else {
              Ingresar
            }
          </button>
        </form>
        
        <div class="demo-credentials">
          <p>Credenciales de administrador:</p>
          <code>davidisaac.floresmedrano&#64;gmail.com / admin123</code>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 1rem;
    }
    
    .login-card {
      background: var(--surface-color);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      padding: 2.5rem;
      width: 100%;
      max-width: 400px;
    }
    
    .login-header {
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
    
    .login-form {
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
    
    .demo-credentials {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
      text-align: center;
      
      p {
        font-size: 0.75rem;
        color: var(--text-secondary);
        margin-bottom: 0.5rem;
      }
      
      code {
        display: block;
        font-size: 0.75rem;
        background: var(--background-color);
        padding: 0.5rem;
        border-radius: var(--radius-sm);
      }
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);
  
  onSubmit() {
    if (!this.email || !this.password) {
      this.error.set('Por favor complete todos los campos');
      return;
    }
    
    this.loading.set(true);
    this.error.set(null);
    
    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        this.authService.setAuth(response.token, response.user);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Credenciales inválidas');
      }
    });
  }
}
