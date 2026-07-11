import { Component, inject, signal, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService, User } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="page-container">
      <div class="profile-card">
        <div class="profile-header">
          <div class="avatar">
            {{ getInitials() }}
          </div>
          <div class="profile-info">
            <h1>{{ currentUser()?.nombre }}</h1>
            <span class="role-badge">{{ formatRole(currentUser()?.rol || '') }}</span>
          </div>
        </div>

        @if (successMessage()) {
          <div class="alert alert-success">
            {{ successMessage() }}
          </div>
        }

        @if (errorMessage()) {
          <div class="alert alert-error">
            {{ errorMessage() }}
          </div>
        }

        <form (ngSubmit)="saveProfile()" class="profile-form">
          <h2>Informaci├│n Personal</h2>
          
          <div class="form-group">
            <label for="nombre">Nombre Completo</label>
            <input 
              type="text" 
              id="nombre"
              [(ngModel)]="formData.nombre"
              name="nombre"
              placeholder="Tu nombre completo"
              required
            >
          </div>

          <div class="form-group">
            <label for="email">Correo Electr├│nico</label>
            <input 
              type="email" 
              id="email"
              [value]="currentUser()?.email"
              disabled
              class="input-disabled"
            >
            <small class="help-text">El correo electr├│nico no se puede modificar</small>
          </div>

          <div class="form-group">
            <label for="telefono">Tel├⌐fono Celular</label>
            <input 
              type="tel" 
              id="telefono"
              [(ngModel)]="formData.telefono"
              name="telefono"
              placeholder="+593 99 123 4567"
            >
            <small class="help-text">Este n├║mero se usar├í para enviar notificaciones por WhatsApp</small>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                [(ngModel)]="formData.notificaciones_email"
                name="notificaciones_email"
              >
              <span class="checkbox-text">
                <re-icon icon="call-12" size="18" weight="outline"></re-icon> Recibir notificaciones por correo electr├│nico
              </span>
            </label>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                [(ngModel)]="formData.notificaciones_whatsapp"
                name="notificaciones_whatsapp"
              >
              <span class="checkbox-text">
                <re-icon icon="call-12" size="18" weight="outline"></re-icon> Recibir notificaciones por WhatsApp
              </span>
            </label>
          </div>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary" [disabled]="saving()">
              @if (saving()) {
                Guardando...
              } @else {
                Guardar Cambios
              }
            </button>
          </div>
        </form>
      </div>

      <!-- Info Card -->
      <div class="info-card">
        <h3>Γä╣ Informaci├│n de tu Cuenta</h3>
        <ul>
          <li><strong>Estado:</strong> {{ currentUser()?.activo ? 'Activa' : 'Inactiva' }}</li>
          <li><strong>Tel├⌐fono validado:</strong> {{ currentUser()?.telefono_validado ? 'S├¡' : 'No' }}</li>
          <li><strong>Rol:</strong> {{ formatRole(currentUser()?.rol || '') }}</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 700px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    .profile-card {
      background: var(--surface-color);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      padding: 2rem;
      margin-bottom: 1.5rem;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border-color);
    }

    .avatar {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--primary-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .profile-info {
      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 0.5rem;
      }
    }

    .role-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: var(--primary-light);
      color: var(--primary-color);
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .profile-form {
      h2 {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 1.5rem;
      }
    }

    .form-group {
      margin-bottom: 1.25rem;

      label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: var(--text-primary);
      }

      input[type="text"],
      input[type="email"],
      input[type="tel"] {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        background: var(--background-color);
        color: var(--text-primary);
        font-size: 1rem;

        &:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }
      }

      .input-disabled {
        background: var(--border-color);
        color: var(--text-secondary);
        cursor: not-allowed;
      }

      .help-text {
        display: block;
        margin-top: 0.375rem;
        font-size: 0.75rem;
        color: var(--text-secondary);
      }
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      padding: 0.75rem;
      background: var(--background-color);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      transition: all 0.2s;

      &:hover {
        border-color: var(--primary-color);
      }

      input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
      }

      .checkbox-text {
        font-size: 0.9rem;
        color: var(--text-primary);
      }
    }

    .form-actions {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);

      .btn {
        padding: 0.75rem 2rem;
        font-size: 1rem;
      }
    }

    .btn {
      padding: 0.625rem 1.25rem;
      border-radius: var(--radius-md);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .btn-primary {
      background: var(--primary-color);
      color: white;

      &:hover {
        opacity: 0.9;
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .alert {
      padding: 1rem;
      border-radius: var(--radius-md);
      margin-bottom: 1.5rem;
      font-size: 0.875rem;
    }

    .alert-success {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #34d399;
    }

    .alert-error {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #f87171;
    }

    .info-card {
      background: var(--surface-color);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      padding: 1.5rem;

      h3 {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
        margin-bottom: 1rem;
      }

      ul {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          padding: 0.5rem 0;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.875rem;
          color: var(--text-secondary);

          &:last-child {
            border-bottom: none;
          }

          strong {
            color: var(--text-primary);
          }
        }
      }
    }

    @media (max-width: 640px) {
      .page-container {
        padding: 1rem;
      }

      .profile-card {
        padding: 1.5rem;
      }

      .profile-header {
        flex-direction: column;
        text-align: center;

        .avatar {
          width: 100px;
          height: 100px;
          font-size: 2rem;
        }
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  currentUser = this.authService.currentUser;
  saving = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);

  formData = {
    nombre: '',
    telefono: '',
    notificaciones_email: true,
    notificaciones_whatsapp: false
  };

  ngOnInit() {
    this.loadCurrentUser();
  }

  loadCurrentUser() {
    this.http.get<User>(`${environment.apiUrl}/auth/me`).subscribe({
      next: (user: User) => {
        this.formData = {
          nombre: user.nombre || '',
          telefono: user.telefono || '',
          notificaciones_email: user.notificaciones_email ?? true,
          notificaciones_whatsapp: user.notificaciones_whatsapp ?? false
        };
      },
      error: () => {
        this.errorMessage.set('Error al cargar los datos del usuario');
      }
    });
  }

  getInitials(): string {
    const nombre = this.currentUser()?.nombre || '';
    const parts = nombre.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return nombre.substring(0, 2).toUpperCase();
  }

  formatRole(rol: string): string {
    const roles: { [key: string]: string } = {
      'SUPER_ADMIN': 'Administrador',
      'SUPERINTENDENTE': 'Superintendente',
      'ANCIANO': 'Anciano',
      'VISITANTE': 'Visitante'
    };
    return roles[rol] || rol;
  }

  saveProfile() {
    this.saving.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    this.http.put<User>(`${environment.apiUrl}/auth/profile`, {
      nombre: this.formData.nombre,
      telefono: this.formData.telefono || null,
      notificaciones_email: this.formData.notificaciones_email,
      notificaciones_whatsapp: this.formData.notificaciones_whatsapp
    }).subscribe({
      next: (user: User) => {
        // Update local storage with new user data
        const currentUser = this.authService.currentUser();
        if (currentUser) {
          this.authService.setAuth(
            this.authService.getToken() || '',
            { ...currentUser, ...user }
          );
        }
        this.saving.set(false);
        this.successMessage.set('Perfil actualizado correctamente');
        
        // Clear success message after 3 seconds
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: () => {
        this.saving.set(false);
        this.errorMessage.set('Error al guardar los cambios');
      }
    });
  }
}
