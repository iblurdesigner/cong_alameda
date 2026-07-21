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
                  <div class="action-buttons">
                    <button 
                      class="btn-edit"
                      (click)="openEditModal(user)"
                      title="Editar usuario"
                    >
                      ✏️
                    </button>
                    <button 
                      class="btn-delete"
                      (click)="deleteUser(user)"
                      title="Eliminar usuario"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Mobile Card View -->
      <div class="user-cards">
        @for (user of users(); track user.id) {
          <div class="user-card" [class.inactive]="!user.activo">
            <div class="user-card-header">
              <div>
                <div class="user-card-name">{{ user.nombre }}</div>
                <div class="user-card-email">{{ user.email }}</div>
              </div>
              <div class="user-card-actions">
                <button class="btn-edit" (click)="openEditModal(user)" title="Editar">✏️</button>
                <button class="btn-delete" (click)="deleteUser(user)" title="Eliminar">🗑️</button>
              </div>
            </div>
            <div class="user-card-body">
              <div class="user-card-field">
                <span class="user-card-label">Teléfono</span>
                <span class="user-card-value">
                  @if (user.telefono) {
                    {{ user.telefono }}
                    @if (user.telefono_validado) {
                      <span class="badge-valid">✓</span>
                    }
                  } @else {
                    <span class="text-muted">Sin teléfono</span>
                  }
                </span>
              </div>
              <div class="user-card-field">
                <span class="user-card-label">Rol</span>
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
              </div>
              <div class="user-card-field">
                <span class="user-card-label">Estado</span>
                <button 
                  class="btn-toggle"
                  [class.active]="user.activo"
                  [class.inactive]="!user.activo"
                  (click)="toggleActive(user)"
                >
                  {{ user.activo ? 'Activo' : 'Inactivo' }}
                </button>
              </div>
              <div class="user-card-field full-width">
                <span class="user-card-label">Notificaciones</span>
                <div class="user-card-notifications">
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
              </div>
            </div>
          </div>
        }
      </div>

      @if (users().length === 0 && !loading()) {
        <div class="empty-state">
          <p>No hay usuarios registrados</p>
        </div>
      }

      <!-- Modal de Edición -->
      @if (editingUser()) {
        <div class="modal-overlay" (click)="closeEditModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Editar Usuario</h2>
              <button class="btn-close" (click)="closeEditModal()">✕</button>
            </div>
            
            <form (ngSubmit)="saveUser()" class="edit-form">
              <div class="form-group">
                <label for="edit-nombre">Nombre</label>
                <input 
                  type="text" 
                  id="edit-nombre"
                  [(ngModel)]="editForm().nombre"
                  name="nombre"
                  required
                >
              </div>

              <div class="form-group">
                <label for="edit-email">Email</label>
                <input 
                  type="email" 
                  id="edit-email"
                  [(ngModel)]="editForm().email"
                  name="email"
                  required
                >
              </div>

              <div class="form-group">
                <label for="edit-telefono">Teléfono</label>
                <input 
                  type="tel" 
                  id="edit-telefono"
                  [(ngModel)]="editForm().telefono"
                  name="telefono"
                  placeholder="+593 99 123 4567"
                >
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    [(ngModel)]="editForm().telefono_validado"
                    name="telefono_validado"
                  >
                  Teléfono validado
                </label>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeEditModal()">
                  Cancelar
                </button>
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
        </div>
      }
    </div>
  `,
  styles: [`
    .page-container {
      padding: 1rem;
    }

    .page-header {
      margin-bottom: 1.5rem;

      h1 {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 0.5rem;
      }

      .subtitle {
        color: var(--text-secondary);
        font-size: 0.875rem;
      }
    }

    .users-table {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      background: var(--surface-color);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);

      table {
        width: 100%;
        border-collapse: collapse;
        min-width: 800px; /* Force horizontal scroll on mobile */
      }

      th, td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid var(--border-color);
        white-space: nowrap;
      }

      th {
        background: var(--background-color);
        font-weight: 600;
        color: var(--text-secondary);
        font-size: 0.75rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      td {
        font-size: 0.875rem;
        color: var(--text-primary);
      }

      tr:hover {
        background: var(--background-color);
      }

      tr.inactive {
        opacity: 0.6;
      }
    }

    /* Card view for mobile */
    .user-cards {
      display: none;
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
      font-size: 0.75rem;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;

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
      font-size: 0.7rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      white-space: nowrap;

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
      font-size: 0.7rem;
      cursor: pointer;
      white-space: nowrap;

      input {
        cursor: pointer;
        width: 14px;
        height: 14px;
      }
    }

    .action-buttons {
      display: flex;
      gap: 0.25rem;
    }

    .btn-edit, .btn-delete {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      padding: 0.375rem;
      border-radius: var(--radius-sm);
      transition: background 0.2s;

      &:hover {
        background: var(--border-color);
      }
    }

    .btn-delete:hover {
      background: var(--danger-color);
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

    /* Modal Styles - Responsive */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 0.5rem;
    }

    .modal-content {
      background: var(--surface-color);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      width: 100%;
      max-width: 450px;
      max-height: 90vh;
      overflow-y: auto;
      margin: 0.5rem;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid var(--border-color);

      h2 {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--text-primary);
        margin: 0;
      }

      .btn-close {
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        color: var(--text-secondary);
        padding: 0.25rem;
        border-radius: var(--radius-sm);

        &:hover {
          background: var(--border-color);
        }
      }
    }

    .edit-form {
      padding: 1.25rem;

      .form-group {
        margin-bottom: 1rem;

        label {
          display: block;
          margin-bottom: 0.375rem;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        input[type="text"],
        input[type="email"],
        input[type="tel"] {
          width: 100%;
          padding: 0.625rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background: var(--background-color);
          color: var(--text-primary);
          font-size: 0.875rem;

          &:focus {
            outline: none;
            border-color: var(--primary-color);
          }
        }
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid var(--border-color);
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

    .btn-secondary {
      background: var(--border-color);
      color: var(--text-primary);

      &:hover {
        background: var(--text-secondary);
        color: white;
      }
    }

    /* ========== RESPONSIVE DESIGN ========== */
    
    /* Tablet */
    @media (max-width: 768px) {
      .page-container {
        padding: 1rem;
      }

      .page-header h1 {
        font-size: 1.25rem;
      }

      .users-table {
        border-radius: var(--radius-md);
        
        th, td {
          padding: 0.5rem;
        }

        th {
          font-size: 0.7rem;
        }

        td {
          font-size: 0.8rem;
        }
      }

      .notifications-config {
        flex-direction: row;
        flex-wrap: wrap;
      }

      .checkbox-label {
        font-size: 0.65rem;
      }
    }

    /* Mobile - Card Layout */
    @media (max-width: 640px) {
      .page-container {
        padding: 0.75rem;
      }

      .page-header {
        margin-bottom: 1rem;
        
        h1 {
          font-size: 1.25rem;
        }
        
        .subtitle {
          font-size: 0.8rem;
        }
      }

      /* Hide table on mobile, show cards */
      .users-table table {
        display: none;
      }

      .user-cards {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .user-card {
        background: var(--surface-color);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-md);
        padding: 1rem;
        border: 1px solid var(--border-color);
      }

      .user-card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 0.75rem;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid var(--border-color);
      }

      .user-card-name {
        font-weight: 600;
        font-size: 1rem;
        color: var(--text-primary);
      }

      .user-card-email {
        font-size: 0.8rem;
        color: var(--text-secondary);
        margin-top: 0.25rem;
      }

      .user-card-actions {
        display: flex;
        gap: 0.5rem;
      }

      .user-card-body {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
      }

      .user-card-field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .user-card-label {
        font-size: 0.7rem;
        text-transform: uppercase;
        color: var(--text-secondary);
        letter-spacing: 0.05em;
      }

      .user-card-value {
        font-size: 0.875rem;
        color: var(--text-primary);
      }

      .user-card-field.full-width {
        grid-column: 1 / -1;
      }

      .user-card-notifications {
        display: flex;
        gap: 1rem;
        margin-top: 0.5rem;
      }

      .modal-content {
        margin: 0.5rem;
        max-height: 85vh;
      }

      .modal-header {
        padding: 0.875rem;
        
        h2 {
          font-size: 1rem;
        }
      }

      .edit-form {
        padding: 1rem;

        .form-group {
          margin-bottom: 0.75rem;
        }

        .modal-footer {
          flex-direction: column;
          gap: 0.5rem;

          .btn {
            width: 100%;
            text-align: center;
          }
        }
      }
    }

    /* Extra small mobile */
    @media (max-width: 380px) {
      .user-card-body {
        grid-template-columns: 1fr;
      }

      .action-buttons {
        flex-direction: column;
        gap: 0.25rem;
      }
    }
  `]
})
export class UsuariosListComponent implements OnInit {
  private userService = inject(UserService);

  users = signal<User[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  editingUser = signal<User | null>(null);
  saving = signal(false);

  editForm = signal<{
    nombre: string;
    email: string;
    telefono: string;
    telefono_validado: boolean;
  }>({
    nombre: '',
    email: '',
    telefono: '',
    telefono_validado: false
  });

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

  openEditModal(user: User) {
    this.editingUser.set(user);
    this.editForm.set({
      nombre: user.nombre,
      email: user.email,
      telefono: user.telefono || '',
      telefono_validado: user.telefono_validado
    });
  }

  closeEditModal() {
    this.editingUser.set(null);
  }

  saveUser() {
    const user = this.editingUser();
    if (!user) return;

    const form = this.editForm();
    this.saving.set(true);

    const update: UpdateUserRequest = {
      nombre: form.nombre,
      telefono: form.telefono || undefined,
      telefono_validado: form.telefono_validado
    };

    this.userService.updateUser(user.id, update).subscribe({
      next: (updatedUser) => {
        this.users.update(users => 
          users.map(u => u.id === user.id ? updatedUser : u)
        );
        this.saving.set(false);
        this.closeEditModal();
      },
      error: () => {
        this.error.set('Error al guardar cambios');
        this.saving.set(false);
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
