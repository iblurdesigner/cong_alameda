import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PublicadorService, Publicador, CreatePublicadorRequest, UpdatePublicadorRequest } from '../../../core/services/publicador.service';
import { GrupoService, Grupo } from '../../../core/services/grupo.service';
import { UserService, User } from '../../../core/services/user.service';

@Component({
  selector: 'app-publicadores-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="title-group">
          <div class="icon-badge">
            <span class="material-symbols-outlined">groups</span>
          </div>
          <div>
            <h1>Directorio de Publicadores</h1>
            <p class="subtitle">Padrón de hermanos de la Congregación Alameda, contactos y emergencias</p>
          </div>
        </div>
        <button class="btn btn-primary btn-add" (click)="openCreateModal()">
          <span class="material-symbols-outlined icon">person_add</span>
          <span>Nuevo Publicador</span>
        </button>
      </div>

      <!-- Barra de Filtros y Búsqueda -->
      <div class="filter-card">
        <div class="search-wrap">
          <span class="material-symbols-outlined search-icon">search</span>
          <input 
            type="text" 
            [(ngModel)]="searchTerm" 
            placeholder="Buscar por nombre, celular o contacto de emergencia..." 
            class="search-input"
          />
          @if (searchTerm()) {
            <button class="btn-clear" (click)="searchTerm.set('')" title="Limpiar búsqueda">✕</button>
          }
        </div>

        <div class="filter-controls">
          <div class="filter-item">
            <label>Grupo:</label>
            <select [(ngModel)]="selectedGrupoId" class="filter-select">
              <option value="">Todos los grupos</option>
              @for (g of grupos(); track g.id) {
                <option [value]="g.id">Grupo {{ g.numero }} - {{ g.nombre }}</option>
              }
            </select>
          </div>

          <div class="filter-item">
            <label>Estado:</label>
            <select [(ngModel)]="selectedEstado" class="filter-select">
              <option value="todos">Todos</option>
              <option value="activos">Solo activos</option>
              <option value="inactivos">Solo inactivos</option>
            </select>
          </div>

          <div class="counter-badge">
            {{ filteredPublicadores().length }} de {{ publicadores().length }} hermanos
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <span>Cargando directorio de publicadores...</span>
        </div>
      }

      @if (feedback()) {
        <div class="alert" [class.alert-success]="feedback()!.type === 'success'" [class.alert-error]="feedback()!.type === 'error'">
          <span>{{ feedback()!.message }}</span>
          <button class="btn-alert-close" (click)="feedback.set(null)">✕</button>
        </div>
      }

      <!-- Vista de Tabla para Escritorio -->
      <div class="table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Publicador</th>
              <th>Grupo</th>
              <th>Contacto</th>
              <th>Contacto de Emergencia</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (pub of filteredPublicadores(); track pub.id) {
              <tr [class.row-inactive]="!pub.activo">
                <td>
                  <div class="pub-identity">
                    <span class="pub-name">
                      @if (pub.apellidos && pub.nombres) {
                        <span class="pub-last">{{ pub.apellidos }}</span>, {{ pub.nombres }}
                      } @else {
                        {{ pub.nombre }}
                      }
                    </span>
                    @if (pub.domicilio) {
                      <span class="pub-sub"><span class="material-symbols-outlined tiny-icon">home</span> {{ pub.domicilio }}</span>
                    }
                    @if (pub.observaciones) {
                      <span class="pub-note" title="{{ pub.observaciones }}">📝 {{ pub.observaciones }}</span>
                    }
                  </div>
                </td>
                <td>
                  @if (pub.grupo_numero) {
                    <span class="badge badge-group">Grupo {{ pub.grupo_numero }}</span>
                  } @else {
                    <span class="text-muted">Sin grupo</span>
                  }
                </td>
                <td>
                  <div class="pub-contact-list">
                    @if (pub.celular) {
                      <div class="contact-pill">
                        <span class="material-symbols-outlined tiny-icon">phone_iphone</span>
                        <span>{{ pub.celular }}</span>
                        <a [href]="getWhatsAppUrl(pub.celular)" target="_blank" class="action-icon-link wa" title="Enviar WhatsApp">
                          <span class="material-symbols-outlined tiny-icon">chat</span>
                        </a>
                        <a [href]="'tel:' + pub.celular" class="action-icon-link tel" title="Llamar">
                          <span class="material-symbols-outlined tiny-icon">call</span>
                        </a>
                      </div>
                    }
                    @if (pub.telefono) {
                      <div class="contact-sub">
                        <span class="material-symbols-outlined tiny-icon">call</span>
                        <span>{{ pub.telefono }}</span>
                      </div>
                    }
                    @if (pub.email) {
                      <div class="contact-sub">
                        <span class="material-symbols-outlined tiny-icon">mail</span>
                        <span>{{ pub.email }}</span>
                      </div>
                    }
                    @if (!pub.celular && !pub.telefono && !pub.email) {
                      <span class="text-muted">Sin datos</span>
                    }
                  </div>
                </td>
                <td>
                  @if (pub.contacto_emergencia_nombre) {
                    <div class="emergency-badge">
                      <div class="em-name">
                        <span class="material-symbols-outlined em-icon">emergency</span>
                        <strong>{{ pub.contacto_emergencia_nombre }}</strong>
                        @if (pub.contacto_emergencia_parentesco) {
                          <span class="em-relation">({{ pub.contacto_emergencia_parentesco }})</span>
                        }
                      </div>
                      @if (pub.contacto_emergencia_telefono) {
                        <div class="em-phone">
                          <a [href]="'tel:' + pub.contacto_emergencia_telefono" class="em-phone-link">
                            <span class="material-symbols-outlined tiny-icon">call</span>
                            {{ pub.contacto_emergencia_telefono }}
                          </a>
                        </div>
                      }
                    </div>
                  } @else {
                    <span class="text-muted">No registrado</span>
                  }
                </td>
                <td>
                  <button 
                    class="badge-toggle" 
                    [class.badge-active]="pub.activo" 
                    [class.badge-inactive]="!pub.activo"
                    (click)="toggleActivo(pub)"
                    title="Clic para cambiar estado"
                  >
                    {{ pub.activo ? 'Activo' : 'Inactivo' }}
                  </button>
                </td>
                <td>
                  <div class="action-buttons">
                    <button class="btn-icon btn-edit" (click)="openEditModal(pub)" title="Editar publicador">
                      <span class="material-symbols-outlined">edit</span>
                    </button>
                    <button class="btn-icon btn-delete" (click)="deletePublicador(pub)" title="Eliminar publicador">
                      <span class="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Vista de Tarjetas para Móviles -->
      <div class="mobile-cards">
        @for (pub of filteredPublicadores(); track pub.id) {
          <div class="pub-card" [class.card-inactive]="!pub.activo">
            <div class="pub-card-header">
              <div>
                <h3 class="card-name">
                  @if (pub.apellidos && pub.nombres) {
                    <span class="pub-last">{{ pub.apellidos }}</span>, {{ pub.nombres }}
                  } @else {
                    {{ pub.nombre }}
                  }
                </h3>
                @if (pub.grupo_numero) {
                  <span class="badge badge-group">Grupo {{ pub.grupo_numero }}</span>
                }
              </div>
              <div class="card-actions">
                <button class="btn-icon btn-edit" (click)="openEditModal(pub)">
                  <span class="material-symbols-outlined">edit</span>
                </button>
                <button class="btn-icon btn-delete" (click)="deletePublicador(pub)">
                  <span class="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>

            <div class="pub-card-body">
              @if (pub.celular) {
                <div class="card-row">
                  <span class="label">Móvil:</span>
                  <div class="val-with-actions">
                    <span class="val">{{ pub.celular }}</span>
                    <a [href]="getWhatsAppUrl(pub.celular)" target="_blank" class="btn-mini-action wa">WhatsApp</a>
                    <a [href]="'tel:' + pub.celular" class="btn-mini-action tel">Llamar</a>
                  </div>
                </div>
              }
              @if (pub.domicilio) {
                <div class="card-row">
                  <span class="label">Domicilio:</span>
                  <span class="val">{{ pub.domicilio }}</span>
                </div>
              }
              @if (pub.contacto_emergencia_nombre) {
                <div class="card-row emergency-row">
                  <span class="label">Emergencia:</span>
                  <span class="val">
                    {{ pub.contacto_emergencia_nombre }}
                    @if (pub.contacto_emergencia_parentesco) { ({{ pub.contacto_emergencia_parentesco }}) }
                    @if (pub.contacto_emergencia_telefono) { - {{ pub.contacto_emergencia_telefono }} }
                  </span>
                </div>
              }
            </div>
          </div>
        }
      </div>

      @if (filteredPublicadores().length === 0 && !loading()) {
        <div class="empty-state">
          <span class="material-symbols-outlined empty-icon">person_search</span>
          <p>No se encontraron publicadores con los filtros seleccionados.</p>
        </div>
      }

      <!-- Modal de Creación / Edición -->
      @if (showModal()) {
        <div class="modal-backdrop" (click)="closeModal()">
          <div class="modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <div class="modal-title-group">
                <span class="material-symbols-outlined modal-icon">{{ isEditing() ? 'edit' : 'person_add' }}</span>
                <h3>{{ isEditing() ? 'Editar Publicador' : 'Nuevo Publicador' }}</h3>
              </div>
              <button class="btn-close" (click)="closeModal()">✕</button>
            </div>

            <form (ngSubmit)="savePublicador()" class="modal-body">
              <!-- Sección: Datos Personales -->
              <div class="fieldset-group">
                <span class="fieldset-title">Datos Personales</span>
                <div class="form-row">
                  <div class="form-group flex-1">
                    <label>Apellidos *</label>
                    <input 
                      type="text" 
                      [(ngModel)]="formData.apellidos" 
                      name="apellidos" 
                      required 
                      placeholder="Ej: Alameda"
                      class="form-input"
                    />
                  </div>
                  <div class="form-group flex-1">
                    <label>Nombres *</label>
                    <input 
                      type="text" 
                      [(ngModel)]="formData.nombres" 
                      name="nombres" 
                      required 
                      placeholder="Ej: David"
                      class="form-input"
                    />
                  </div>
                  <div class="form-group flex-1">
                    <label>Grupo de Predicación</label>
                    <select [(ngModel)]="formData.grupo_id" name="grupo_id" class="form-input">
                      <option [ngValue]="undefined">Sin grupo</option>
                      @for (g of grupos(); track g.id) {
                        <option [value]="g.id">Grupo {{ g.numero }} - {{ g.nombre }}</option>
                      }
                    </select>
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group flex-1">
                    <label>Celular (WhatsApp)</label>
                    <input 
                      type="text" 
                      [(ngModel)]="formData.celular" 
                      name="celular" 
                      placeholder="Ej: 0991234567"
                      class="form-input"
                    />
                  </div>
                  <div class="form-group flex-1">
                    <label>Teléfono Fijo / Secundario</label>
                    <input 
                      type="text" 
                      [(ngModel)]="formData.telefono" 
                      name="telefono" 
                      placeholder="Ej: 022345678"
                      class="form-input"
                    />
                  </div>
                  <div class="form-group flex-1">
                    <label>Email</label>
                    <input 
                      type="email" 
                      [(ngModel)]="formData.email" 
                      name="email" 
                      placeholder="hermano@correo.com"
                      class="form-input"
                    />
                  </div>
                </div>

                <div class="form-group">
                  <label>Domicilio / Dirección</label>
                  <input 
                    type="text" 
                    [(ngModel)]="formData.domicilio" 
                    name="domicilio" 
                    placeholder="Barrio, calle principal, número, referencia"
                    class="form-input"
                  />
                </div>
              </div>

              <!-- Sección: Contacto de Emergencia -->
              <div class="fieldset-group emergency-fieldset">
                <span class="fieldset-title">Contacto en Caso de Emergencia</span>
                <div class="form-row">
                  <div class="form-group flex-2">
                    <label>Nombre del Contacto</label>
                    <input 
                      type="text" 
                      [(ngModel)]="formData.contacto_emergencia_nombre" 
                      name="contacto_emergencia_nombre" 
                      placeholder="Nombre de familiar o allegado"
                      class="form-input"
                    />
                  </div>
                  <div class="form-group flex-1">
                    <label>Parentesco</label>
                    <input 
                      type="text" 
                      [(ngModel)]="formData.contacto_emergencia_parentesco" 
                      name="contacto_emergencia_parentesco" 
                      placeholder="Cónyuge, Padre, Hijo..."
                      class="form-input"
                    />
                  </div>
                  <div class="form-group flex-1">
                    <label>Teléfono de Emergencia</label>
                    <input 
                      type="text" 
                      [(ngModel)]="formData.contacto_emergencia_telefono" 
                      name="contacto_emergencia_telefono" 
                      placeholder="099..."
                      class="form-input"
                    />
                  </div>
                </div>
              </div>

              <!-- Sección: Observaciones y Usuario -->
              <div class="fieldset-group">
                <span class="fieldset-title">Detalles Adicionales</span>
                <div class="form-group">
                  <label>Observaciones / Notas</label>
                  <textarea 
                    [(ngModel)]="formData.observaciones" 
                    name="observaciones" 
                    rows="2" 
                    placeholder="Notas pastorales, médicas o de disponibilidad..."
                    class="form-input textarea"
                  ></textarea>
                </div>

                <div class="form-row">
                  <div class="form-group flex-2">
                    <label>Vincular con Usuario del Sistema (Opcional)</label>
                    <select [(ngModel)]="formData.user_id" name="user_id" class="form-input">
                      <option [ngValue]="undefined">Ninguno (solo en directorio)</option>
                      @for (u of users(); track u.id) {
                        <option [value]="u.id">{{ u.nombre }} ({{ u.email }})</option>
                      }
                    </select>
                  </div>
                  <div class="form-group flex-1 center-toggle">
                    <label class="toggle-label">
                      <input type="checkbox" [(ngModel)]="formData.activo" name="activo" />
                      <span>Publicador Activo</span>
                    </label>
                  </div>
                </div>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving()">
                  {{ saving() ? 'Guardando...' : (isEditing() ? 'Actualizar' : 'Guardar') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      padding: 1.5rem;
      background: var(--background-color, #f8fafc);
      min-height: 100vh;
      color: var(--text-primary, #0f172a);
    }

    .page-container {
      max-width: 1300px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .title-group {
      display: flex;
      align-items: center;
      gap: 0.85rem;

      .icon-badge {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: rgba(37, 99, 235, 0.12);
        color: var(--primary-color, #2563eb);
        display: flex;
        align-items: center;
        justify-content: center;

        span {
          font-size: 26px;
        }
      }

      h1 {
        font-size: 1.45rem;
        font-weight: 800;
        margin: 0;
        color: var(--text-primary, #0f172a);
      }

      .subtitle {
        font-size: 0.85rem;
        color: var(--text-secondary, #64748b);
        margin: 0;
      }
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.55rem 1.1rem;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.15s;

      &.btn-primary {
        background: var(--primary-color, #2563eb);
        color: #ffffff;

        &:hover:not(:disabled) {
          background: #1d4ed8;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }

      &.btn-secondary {
        background: var(--surface-color, #ffffff);
        border-color: var(--border-color, #cbd5e1);
        color: var(--text-primary, #334155);

        &:hover {
          background: var(--background-color, #f1f5f9);
        }
      }
    }

    /* FILTROS */
    .filter-card {
      background: var(--surface-color, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 12px;
      padding: 0.85rem 1.25rem;
      margin-bottom: 1.25rem;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    }

    .search-wrap {
      position: relative;
      flex: 1;
      min-width: 280px;

      .search-icon {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 20px;
        color: var(--text-secondary, #94a3b8);
      }

      .search-input {
        width: 100%;
        padding: 0.5rem 2rem 0.5rem 2.25rem;
        font-size: 0.875rem;
        border: 1px solid var(--border-color, #cbd5e1);
        border-radius: 8px;
        background: var(--background-color, #f8fafc);
        color: var(--text-primary, #0f172a);

        &:focus {
          outline: none;
          border-color: var(--primary-color, #2563eb);
          background: var(--surface-color, #ffffff);
        }
      }

      .btn-clear {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 2px;
        font-size: 14px;
      }
    }

    .filter-controls {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      flex-wrap: wrap;

      .filter-item {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.825rem;
        color: var(--text-secondary, #64748b);
        font-weight: 600;

        .filter-select {
          padding: 0.4rem 0.6rem;
          font-size: 0.825rem;
          border: 1px solid var(--border-color, #cbd5e1);
          border-radius: 6px;
          background: var(--surface-color, #ffffff);
          color: var(--text-primary, #0f172a);
        }
      }

      .counter-badge {
        font-size: 0.8rem;
        font-weight: 700;
        background: rgba(37, 99, 235, 0.08);
        color: var(--primary-color, #2563eb);
        padding: 0.35rem 0.75rem;
        border-radius: 20px;
      }
    }

    /* TABLA */
    .table-container {
      background: var(--surface-color, #ffffff);
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

      @media (max-width: 900px) {
        display: none;
      }
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;

      th {
        background: var(--background-color, #f8fafc);
        padding: 0.85rem 1rem;
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--text-secondary, #64748b);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        border-bottom: 1px solid var(--border-color, #e2e8f0);
      }

      td {
        padding: 0.85rem 1rem;
        font-size: 0.85rem;
        border-bottom: 1px solid var(--border-color, #f1f5f9);
        vertical-align: middle;
      }

      tr.row-inactive {
        opacity: 0.65;
        background: rgba(0, 0, 0, 0.02);
      }
    }

    .pub-identity {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;

      .pub-name {
        font-weight: 700;
        color: var(--text-primary, #0f172a);
        font-size: 0.925rem;
      }

      .pub-sub {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        font-size: 0.775rem;
        color: var(--text-secondary, #64748b);
      }

      .pub-note {
        font-size: 0.75rem;
        color: #b45309;
        font-style: italic;
      }
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;

      &.badge-group {
        background: #e0f2fe;
        color: #0369a1;
      }
    }

    .badge-toggle {
      padding: 0.25rem 0.65rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      border: none;
      cursor: pointer;
      transition: all 0.15s;

      &.badge-active {
        background: #ecfdf5;
        color: #059669;

        &:hover {
          background: #d1fae5;
        }
      }

      &.badge-inactive {
        background: #fef2f2;
        color: #dc2626;

        &:hover {
          background: #fee2e2;
        }
      }
    }

    .pub-contact-list {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      .contact-pill {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        font-weight: 600;
        color: var(--text-primary, #1e293b);

        .action-icon-link {
          display: inline-flex;
          padding: 2px 4px;
          border-radius: 4px;
          text-decoration: none;

          &.wa {
            background: #ecfdf5;
            color: #059669;
            &:hover { background: #d1fae5; }
          }
          &.tel {
            background: #eff6ff;
            color: #2563eb;
            &:hover { background: #dbeafe; }
          }
        }
      }

      .contact-sub {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.75rem;
        color: var(--text-secondary, #64748b);
      }
    }

    .emergency-badge {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;

      .em-name {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        font-size: 0.8rem;
        color: #991b1b;

        .em-icon {
          font-size: 16px;
          color: #dc2626;
        }

        .em-relation {
          font-size: 0.725rem;
          color: #b91c1c;
          font-weight: normal;
        }
      }

      .em-phone-link {
        display: inline-flex;
        align-items: center;
        gap: 0.2rem;
        font-size: 0.75rem;
        color: #b91c1c;
        text-decoration: none;
        font-weight: 600;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .tiny-icon {
      font-size: 15px;
    }

    .text-muted {
      color: var(--text-secondary, #94a3b8);
      font-size: 0.775rem;
      font-style: italic;
    }

    .action-buttons {
      display: flex;
      align-items: center;
      gap: 0.35rem;

      .btn-icon {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        border: 1px solid var(--border-color, #cbd5e1);
        background: var(--surface-color, #ffffff);
        color: var(--text-secondary, #64748b);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.15s;

        span {
          font-size: 17px;
        }

        &.btn-edit:hover {
          color: #2563eb;
          border-color: #2563eb;
          background: #eff6ff;
        }

        &.btn-delete:hover {
          color: #dc2626;
          border-color: #dc2626;
          background: #fef2f2;
        }
      }
    }

    /* TARJETAS MÓVILES */
    .mobile-cards {
      display: none;
      flex-direction: column;
      gap: 0.85rem;

      @media (max-width: 900px) {
        display: flex;
      }

      .pub-card {
        background: var(--surface-color, #ffffff);
        border: 1px solid var(--border-color, #e2e8f0);
        border-radius: 12px;
        padding: 1rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);

        &.card-inactive {
          opacity: 0.65;
        }

        .pub-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;

          .card-name {
            font-size: 1.05rem;
            font-weight: 700;
            margin: 0 0 0.25rem;
            color: var(--text-primary, #0f172a);
          }

          .card-actions {
            display: flex;
            gap: 0.4rem;
          }
        }

        .pub-card-body {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          font-size: 0.825rem;

          .card-row {
            display: flex;
            justify-content: space-between;
            align-items: center;

            .label {
              color: var(--text-secondary, #64748b);
              font-weight: 600;
            }

            .val {
              color: var(--text-primary, #0f172a);
              font-weight: 600;
            }

            .val-with-actions {
              display: flex;
              align-items: center;
              gap: 0.4rem;

              .btn-mini-action {
                padding: 0.2rem 0.45rem;
                border-radius: 4px;
                font-size: 0.725rem;
                font-weight: 700;
                text-decoration: none;

                &.wa { background: #ecfdf5; color: #059669; }
                &.tel { background: #eff6ff; color: #2563eb; }
              }
            }

            &.emergency-row {
              background: #fef2f2;
              padding: 0.4rem 0.6rem;
              border-radius: 6px;
              color: #991b1b;
              margin-top: 0.35rem;

              .label { color: #dc2626; }
              .val { color: #991b1b; }
            }
          }
        }
      }
    }

    /* MODAL */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .modal-card {
      background: var(--surface-color, #ffffff);
      border-radius: 16px;
      width: 100%;
      max-width: 680px;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
      overflow: hidden;
      border: 1px solid var(--border-color, transparent);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border-color, #e2e8f0);

      .modal-title-group {
        display: flex;
        align-items: center;
        gap: 0.6rem;

        .modal-icon {
          color: var(--primary-color, #2563eb);
          font-size: 24px;
        }

        h3 {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary, #0f172a);
        }
      }

      .btn-close {
        background: transparent;
        border: none;
        font-size: 18px;
        color: var(--text-secondary, #94a3b8);
        cursor: pointer;
        padding: 4px;
      }
    }

    .modal-body {
      padding: 1.25rem 1.5rem;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1.1rem;
    }

    .fieldset-group {
      border: 1px solid var(--border-color, #e2e8f0);
      border-radius: 10px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      position: relative;
      background: var(--surface-color, #ffffff);

      .fieldset-title {
        position: absolute;
        top: -10px;
        left: 12px;
        background: var(--surface-color, #ffffff);
        padding: 0 6px;
        font-size: 0.725rem;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--text-secondary, #64748b);
        letter-spacing: 0.04em;
      }

      &.emergency-fieldset {
        border-color: #fecaca;
        background: #fffcfc;

        .fieldset-title {
          color: #dc2626;
        }
      }
    }

    .form-row {
      display: flex;
      gap: 0.75rem;

      @media (max-width: 600px) {
        flex-direction: column;
      }
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      &.flex-1 { flex: 1; }
      &.flex-2 { flex: 2; }

      label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--text-secondary, #64748b);
      }

      .form-input {
        padding: 0.45rem 0.65rem;
        font-size: 0.85rem;
        border: 1px solid var(--border-color, #cbd5e1);
        border-radius: 6px;
        background: var(--surface-color, #ffffff);
        color: var(--text-primary, #0f172a);
        transition: all 0.15s;

        &:focus {
          outline: none;
          border-color: var(--primary-color, #2563eb);
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
        }

        &.textarea {
          resize: vertical;
        }
      }

      &.center-toggle {
        justify-content: center;
        align-items: flex-start;

        .toggle-label {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.825rem;
          font-weight: 600;
          color: var(--text-primary, #0f172a);
          cursor: pointer;
          margin-top: 1.25rem;
        }
      }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-color, #f1f5f9);
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--text-secondary, #64748b);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;

      .empty-icon {
        font-size: 48px;
        opacity: 0.6;
      }
    }

    .alert {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 1rem;

      &.alert-success {
        background: #ecfdf5;
        color: #065f46;
        border: 1px solid #a7f3d0;
      }

      &.alert-error {
        background: #fef2f2;
        color: #991b1b;
        border: 1px solid #fecaca;
      }

      .btn-alert-close {
        background: transparent;
        border: none;
        cursor: pointer;
        font-weight: bold;
        color: inherit;
      }
    }

    /* MODO OSCURO */
    :host-context([data-theme="dark"]) {
      background: var(--background-color, #0c0e12);
      color: var(--text-primary, #f8fafc);

      .filter-card, .table-container, .pub-card, .modal-card, .fieldset-group {
        background: var(--surface-color, #161922);
        border-color: var(--border-color, #242936);
      }

      .data-table th {
        background: #11141c;
        border-bottom-color: var(--border-color, #242936);
        color: var(--text-secondary, #94a3b8);
      }

      .data-table td {
        border-bottom-color: #1a1e28;
      }

      .search-input, .filter-select, .form-input {
        background: #11141c !important;
        border-color: var(--border-color, #242936) !important;
        color: var(--text-primary, #f8fafc) !important;

        &:focus {
          border-color: var(--primary-color, #3b82f6) !important;
        }
      }

      .fieldset-group .fieldset-title {
        background: var(--surface-color, #161922);
        color: var(--text-secondary, #94a3b8);
      }

      .fieldset-group.emergency-fieldset {
        border-color: #7f1d1d;
        background: #1a1214;

        .fieldset-title {
          color: #f87171;
        }
      }

      .modal-header {
        border-bottom-color: var(--border-color, #242936);
      }

      .modal-footer {
        border-top-color: var(--border-color, #242936);
      }

      .action-buttons .btn-icon {
        background: #11141c;
        border-color: #242936;
        color: #94a3b8;

        &.btn-edit:hover {
          color: #60a5fa;
          background: #1e2430;
        }

        &.btn-delete:hover {
          color: #f87171;
          background: #2a1518;
        }
      }
    }
  `]
})
export class PublicadoresListComponent implements OnInit {
  private publicadorService = inject(PublicadorService);
  private grupoService = inject(GrupoService);
  private userService = inject(UserService);

  publicadores = computed(() => this.publicadorService.publicadores());
  loading = computed(() => this.publicadorService.loading());
  grupos = computed(() => this.grupoService.grupos());
  users = signal<User[]>([]);

  searchTerm = signal<string>('');
  selectedGrupoId = signal<string>('');
  selectedEstado = signal<'todos' | 'activos' | 'inactivos'>('todos');
  feedback = signal<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal
  showModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  currentId = signal<string | null>(null);
  saving = signal<boolean>(false);

  formData: {
    nombres: string;
    apellidos: string;
    celular?: string;
    telefono?: string;
    email?: string;
    domicilio?: string;
    grupo_id?: string;
    contacto_emergencia_nombre?: string;
    contacto_emergencia_telefono?: string;
    contacto_emergencia_parentesco?: string;
    observaciones?: string;
    activo: boolean;
    user_id?: string;
  } = {
    nombres: '',
    apellidos: '',
    activo: true
  };

  filteredPublicadores = computed(() => {
    const list = this.publicadores();
    const term = this.searchTerm().trim().toLowerCase();
    const grupoId = this.selectedGrupoId();
    const estado = this.selectedEstado();

    return list.filter(p => {
      // Filtro por término
      if (term) {
        const matchesNombre = (p.nombre?.toLowerCase().includes(term) || false) ||
                              (p.nombres?.toLowerCase().includes(term) || false) ||
                              (p.apellidos?.toLowerCase().includes(term) || false);
        const matchesCel = p.celular?.toLowerCase().includes(term) || false;
        const matchesTel = p.telefono?.toLowerCase().includes(term) || false;
        const matchesEm = p.contacto_emergencia_nombre?.toLowerCase().includes(term) || false;
        if (!matchesNombre && !matchesCel && !matchesTel && !matchesEm) {
          return false;
        }
      }

      // Filtro por grupo
      if (grupoId && p.grupo_id !== grupoId) {
        return false;
      }

      // Filtro por estado
      if (estado === 'activos' && !p.activo) return false;
      if (estado === 'inactivos' && p.activo) return false;

      return true;
    });
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.publicadorService.loadPublicadores().subscribe({
      error: () => this.showFeedback('error', 'Error al cargar publicadores')
    });

    this.grupoService.loadGrupos().subscribe();

    this.userService.getUsers().subscribe({
      next: (users) => this.users.set(users),
      error: () => {}
    });
  }

  openCreateModal() {
    this.isEditing.set(false);
    this.currentId.set(null);
    this.formData = {
      nombres: '',
      apellidos: '',
      activo: true
    };
    this.showModal.set(true);
  }

  openEditModal(pub: Publicador) {
    this.isEditing.set(true);
    this.currentId.set(pub.id);
    this.formData = {
      nombres: pub.nombres || '',
      apellidos: pub.apellidos || '',
      celular: pub.celular,
      telefono: pub.telefono,
      email: pub.email,
      domicilio: pub.domicilio,
      grupo_id: pub.grupo_id,
      contacto_emergencia_nombre: pub.contacto_emergencia_nombre,
      contacto_emergencia_telefono: pub.contacto_emergencia_telefono,
      contacto_emergencia_parentesco: pub.contacto_emergencia_parentesco,
      observaciones: pub.observaciones,
      activo: pub.activo,
      user_id: pub.user_id
    };
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  savePublicador() {
    if (!this.formData.apellidos.trim() || !this.formData.nombres.trim()) {
      this.showFeedback('error', 'Apellidos y nombres son obligatorios');
      return;
    }

    this.saving.set(true);

    if (this.isEditing() && this.currentId()) {
      const updateData: UpdatePublicadorRequest = { ...this.formData };
      this.publicadorService.updatePublicador(this.currentId()!, updateData).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.showFeedback('success', 'Publicador actualizado exitosamente');
        },
        error: (err) => {
          this.saving.set(false);
          this.showFeedback('error', err?.error?.message || 'Error al actualizar publicador');
        }
      });
    } else {
      const createData: CreatePublicadorRequest = { ...this.formData };
      this.publicadorService.createPublicador(createData).subscribe({
        next: () => {
          this.saving.set(false);
          this.closeModal();
          this.showFeedback('success', 'Publicador creado exitosamente');
        },
        error: (err) => {
          this.saving.set(false);
          this.showFeedback('error', err?.error?.message || 'Error al crear publicador');
        }
      });
    }
  }

  toggleActivo(pub: Publicador) {
    const nuevoEstado = !pub.activo;
    this.publicadorService.updatePublicador(pub.id, { activo: nuevoEstado }).subscribe({
      next: () => {
        this.showFeedback('success', `Publicador ${nuevoEstado ? 'activado' : 'desactivado'}`);
      },
      error: () => this.showFeedback('error', 'Error al cambiar estado')
    });
  }

  deletePublicador(pub: Publicador) {
    const displayName = pub.apellidos && pub.nombres ? `${pub.apellidos}, ${pub.nombres}` : (pub.nombre || 'este publicador');
    if (!confirm(`¿Estás seguro de eliminar a ${displayName} del directorio?`)) {
      return;
    }

    this.publicadorService.deletePublicador(pub.id).subscribe({
      next: () => this.showFeedback('success', 'Publicador eliminado'),
      error: () => this.showFeedback('error', 'Error al eliminar publicador')
    });
  }

  getWhatsAppUrl(celular?: string): string {
    if (!celular) return '#';
    let clean = celular.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '593' + clean.slice(1);
    }
    return `https://wa.me/${clean}`;
  }

  private showFeedback(type: 'success' | 'error', message: string) {
    this.feedback.set({ type, message });
    setTimeout(() => {
      if (this.feedback()?.message === message) {
        this.feedback.set(null);
      }
    }, 4000);
  }
}
