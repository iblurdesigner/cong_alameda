import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, User, UpdateUserRequest } from '../../../core/services/user.service';

@Component({
  selector: 'app-usuarios-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Gestión de Usuarios</h1>
        <p class="subtitle">Administra los usuarios del sistema</p>
      </div>

      @if (loading()) {
        <div class="loading">Cargando usuarios...</div>
      }

      @if (error()) {
        <div class="error-message">{{ error() }}</div>
      }

      <div class="users-table">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Notificaciones</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (user of users(); track user.id) {
              <tr [class.inactive]="!user.activo">
                <td>{{ user.nombre }}</td>
                <td>{{ user.email }}</td>
                <td>
                  @if (user.telefono) {
                    {{ user.telefono }}
                    @if (user.telefono_validado) {
                      <span class="badge-valid">✓</span>
                    }
                  } @else {
                    <span class="text-muted">Sin teléfono</span>
                  }
                </td>
                <td>
                  <select 
                    [value]="user.rol" 
                    (change)="updateRole(user, $event)"
                    class="role-select"
                    [class.super-admin]="user.rol === 'SUPER_ADMIN'"
                  >
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                    <option value="SUPERINTENDENTE">SUPERINTENDENTE</option>
                    <option value="ANCIANO">ANCIANO</option>
                    <option value="VISITANTE">VISITANTE</option>
                  </select>
                </td>
                <td>
                  <button 
                    class="btn-toggle"
                    [class.active]="user.activo"
                    [class.inactive]="!user.activo"
                    (click)="toggleActive(user)"
                  >
                    {{ user.activo ? 'Activo' : 'Inactivo' }}
                  </button>
                </td>
                <td>
                  <div class="notifications-config">
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        [checked]="user.notificaciones_email"
                        (change)="toggleNotificacion(user, 'email', $event)"
                      >
                      📧 Email
                    </label>
                    <label class="checkbox-label">
                      <input 
                        type="checkbox" 
                        [checked]="user.notificaciones_whatsapp"
                        (change)="toggleNotificacion(user, 'whatsapp', $event)"
                      >
                      📱 WhatsApp
                    </label>
                  </div>
                </td>
                <td>
                  <button 
                    class="btn-delete"
                    (click)="deleteUser(user)"
                    title="Eliminar usuario"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      @if (users().length === 0 && !loading()) {
        <div class="empty-state">
          <p>No hay usuarios registrados</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container {
      padding: 1.5rem;
    }

    .page-header {
      margin-bottom: 2rem;

      h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 0.5rem;
      }

      .subtitle {
        color: var(--text-secondary);
      }
    }

    .users-table {
      overflow-x: auto;
      background: var(--surface-color);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);

      table {
        width: 100%;
        border-collapse: collapse;

        th, td {
          padding: 1rem;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }

        th {
          background: var(--background-color);
          font-weight: 600;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        tr:hover {
          background: var(--background-color);
        }

        tr.inactive {
          opacity: 0.6;
        }
      }
    }

    .badge-valid {
      color: var(--success-color);
      margin-left: 0.25rem;
    }

    .text-muted {
      color: var(--text-secondary);
      font-style: italic;
    }

    .role-select {
      padding: 0.375rem 0.5rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-sm);
      background: var(--surface-color);
      color: var(--text-primary);
      font-size: 0.875rem;

      &.super-admin {
        background: #fef3c7;
        border-color: #f59e0b;
        color: #92400e;
      }
    }

    .btn-toggle {
      padding: 0.375rem 0.75rem;
      border: none;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &.active {
        background: #d1fae5;
        color: #065f46;
      }

      &.inactive {
        background: #fee2e2;
        color: #991b1b;
      }
    }

    .notifications-config {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      cursor: pointer;

      input {
        cursor: pointer;
      }
    }

    .btn-delete {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      padding: 0.375rem;
      border-radius: var(--radius-sm);
      transition: background 0.2s;

      &:hover {
        background: var(--danger-color);
      }
    }

    .loading, .error-message {
      padding: 2rem;
      text-align: center;
    }

    .error-message {
      color: var(--danger-color);
      background: rgba(239, 68, 68, 0.1);
      border-radius: var(--radius-md);
      margin-bottom: 1rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--text-secondary);
    }
  `]
})
export class UsuariosListComponent implements OnInit {
  private userService = inject(UserService);

  users = signal<User[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.error.set(null);

    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar usuarios');
        this.loading.set(false);
      }
    });
  }

  updateRole(user: User, event: Event) {
    const newRole = (event.target as HTMLSelectElement).value as User['rol'];
    
    this.userService.updateUser(user.id, { rol: newRole }).subscribe({
      next: (updatedUser) => {
        this.users.update(users => 
          users.map(u => u.id === user.id ? updatedUser : u)
        );
      },
      error: () => {
        this.error.set('Error al actualizar rol');
      }
    });
  }

  toggleActive(user: User) {
    const newActive = !user.activo;
    
    this.userService.updateUser(user.id, { activo: newActive }).subscribe({
      next: (updatedUser) => {
        this.users.update(users => 
          users.map(u => u.id === user.id ? updatedUser : u)
        );
      },
      error: () => {
        this.error.set('Error al actualizar estado');
      }
    });
  }

  toggleNotificacion(user: User, tipo: 'email' | 'whatsapp', event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const update: UpdateUserRequest = tipo === 'email' 
      ? { notificaciones_email: checked }
      : { notificaciones_whatsapp: checked };

    this.userService.updateUser(user.id, update).subscribe({
      next: (updatedUser) => {
        this.users.update(users => 
          users.map(u => u.id === user.id ? updatedUser : u)
        );
      },
      error: () => {
        this.error.set('Error al actualizar preferencias de notificaciones');
      }
    });
  }

  deleteUser(user: User) {
    if (!confirm(`¿Estás seguro de eliminar al usuario "${user.nombre}"?`)) {
      return;
    }

    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.users.update(users => users.filter(u => u.id !== user.id));
      },
      error: () => {
        this.error.set('Error al eliminar usuario');
      }
    });
  }
}
