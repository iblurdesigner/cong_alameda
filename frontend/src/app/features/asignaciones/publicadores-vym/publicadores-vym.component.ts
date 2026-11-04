import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  PublicadorVymService,
  PublicadorVyM,
  getEstadoDisponibilidad,
  getLabelDisponibilidad,
} from '../../../core/services/publicador-vym.service';
import { PublicadorService, Publicador } from '../../../core/services/publicador.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-publicadores-vym',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './publicadores-vym.component.html',
  styleUrls: ['./publicadores-vym.component.scss'],
})
export class PublicadoresVymComponent implements OnInit {
  private vymService = inject(PublicadorVymService);
  private publicadorService = inject(PublicadorService);
  public authService = inject(AuthService);

  // State
  loading = signal(false);
  saving = signal(false);
  statusMessage = signal<{ text: string; type: 'success' | 'error' } | null>(null);

  // Data
  publicadoresVym = this.vymService.publicadoresVym;
  disponibilidad = this.vymService.disponibilidad;
  todosPublicadores = signal<Publicador[]>([]);

  // Search & filter
  searchQuery = signal('');
  showSoloActivos = signal(true);

  // Modal para agregar
  showAddModal = signal(false);
  selectedPublicadorId = signal('');
  notasNuevo = signal('');

  // Publicadores disponibles para agregar (los que no están ya en VyM)
  publicadoresParaAgregar = computed(() => {
    const idsEnVym = new Set(this.publicadoresVym().map(p => p.publicador_id));
    return this.todosPublicadores()
      .filter(p => p.activo && !idsEnVym.has(p.id))
      .sort((a, b) => `${a.apellidos} ${a.nombres}`.localeCompare(`${b.apellidos} ${b.nombres}`));
  });

  // Lista filtrada
  listaFiltrada = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const soloActivos = this.showSoloActivos();
    const disp = this.disponibilidad();

    return this.publicadoresVym()
      .filter(p => {
        if (soloActivos && !p.activo) return false;
        if (!q) return true;
        return (
          p.nombres.toLowerCase().includes(q) ||
          p.apellidos.toLowerCase().includes(q) ||
          (p.celular || '').includes(q)
        );
      })
      .map(p => {
        const d = disp.find(d => d.publicador_vym_id === p.id);
        return { ...p, disponibilidad: d };
      });
  });

  getEstado = getEstadoDisponibilidad;
  getLabel = getLabelDisponibilidad;

  canEdit = computed(() =>
    this.authService.isSuperAdmin() || this.authService.isSuperintendente()
  );

  ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    this.loading.set(true);
    this.vymService.loadAll().subscribe({
      next: () => {
        this.vymService.loadDisponibilidad().subscribe({
          complete: () => this.loading.set(false),
        });
      },
      error: () => this.loading.set(false),
    });
    this.publicadorService.loadPublicadores(undefined, undefined, true).subscribe({
      next: data => this.todosPublicadores.set(data || []),
    });
  }

  openAddModal(): void {
    this.selectedPublicadorId.set('');
    this.notasNuevo.set('');
    this.showAddModal.set(true);
  }

  closeAddModal(): void {
    this.showAddModal.set(false);
  }

  confirmAdd(): void {
    const id = this.selectedPublicadorId();
    if (!id) return;
    this.saving.set(true);
    this.vymService.add(id, this.notasNuevo()).subscribe({
      next: () => {
        this.saving.set(false);
        this.showAddModal.set(false);
        this.showStatus('Publicador agregado al listado VyM', 'success');
        this.vymService.loadDisponibilidad().subscribe();
      },
      error: () => {
        this.saving.set(false);
        this.showStatus('Error al agregar publicador', 'error');
      },
    });
  }

  toggleActivo(p: PublicadorVyM): void {
    if (!this.canEdit()) return;
    this.vymService.update(p.id, !p.activo, p.notas || '').subscribe({
      next: () => {
        this.showStatus(`${p.nombres} ${p.apellidos} ${!p.activo ? 'activado' : 'desactivado'}`, 'success');
        this.vymService.loadDisponibilidad().subscribe();
      },
      error: () => this.showStatus('Error al actualizar', 'error'),
    });
  }

  removeFromVym(p: PublicadorVyM): void {
    if (!this.canEdit()) return;
    if (!confirm(`¿Quitar a ${p.nombres} ${p.apellidos} del listado VyM?`)) return;
    this.vymService.remove(p.id).subscribe({
      next: () => this.showStatus('Publicador eliminado del listado VyM', 'success'),
      error: () => this.showStatus('Error al eliminar', 'error'),
    });
  }

  private showStatus(text: string, type: 'success' | 'error'): void {
    this.statusMessage.set({ text, type });
    setTimeout(() => this.statusMessage.set(null), 3500);
  }

  getNombreCompleto(p: Publicador): string {
    return `${p.apellidos}, ${p.nombres}`.trim();
  }
}
