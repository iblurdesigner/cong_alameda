import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CasaService, Casa } from '../../../core/services/casa.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-casa-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-container">
      @if (successMessage()) {
        <div class="modal-overlay" (click)="goToList()">
          <div class="modal-box" (click)="$event.stopPropagation()">
            <div class="modal-icon modal-icon-success">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h3 class="modal-title">┬í├ëxito!</h3>
            <p class="modal-message">{{ successMessage() }}</p>
            <button class="btn btn-primary" (click)="goToList()">
              Volver a la lista
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      }

      <header class="page-header">
        <a routerLink="/casas" class="back-link">ΓåÉ Volver</a>
        <h1>{{ isEdit() ? 'Editar Casa' : 'Registrar Nueva Casa' }}</h1>
      </header>
      
      <form (ngSubmit)="onSubmit()" class="card form-card">
        @if (error()) {
          <div class="error-message">{{ error() }}</div>
        }
        
        <div class="form-section">
          <h3>Direcci├│n</h3>
          
          <div class="form-row">
            <div class="form-group flex-2">
              <label for="calle_principal">Calle Principal *</label>
              <input type="text" id="calle_principal" [(ngModel)]="formData.calle_principal" 
                     name="calle_principal" required placeholder="Av. Principal" />
            </div>
            
            <div class="form-group flex-1">
              <label for="numeracion">N├║mero *</label>
              <input type="text" id="numeracion" [(ngModel)]="formData.numeracion" 
                     name="numeracion" required placeholder="123" />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="calle_secundaria">Entre Calles</label>
              <input type="text" id="calle_secundaria" [(ngModel)]="formData.calle_secundaria" 
                     name="calle_secundaria" placeholder="Calle secundaria" />
            </div>
            
            <div class="form-group">
              <label for="sector">Sector *</label>
              <input type="text" id="sector" [(ngModel)]="formData.sector" 
                     name="sector" required placeholder="Centro, Norte, Sur..." />
            </div>
          </div>
          
<div class="form-group">
              <label for="referencia">Referencia</label>
              <input type="text" id="referencia" [(ngModel)]="formData.referencia" 
                     name="referencia" placeholder="Casa azul, port├│n verde..." />
            </div>
            
            <!-- Foto de la casa -->
            <div class="form-group">
              <label for="foto">Foto de la Casa</label>
              <input type="file" id="foto" (change)="onFileSelected($event)" 
                     accept="image/*" capture="environment" class="file-input" />
              @if (previewUrl()) {
                <div class="preview-container">
                  <img [src]="previewUrl()" alt="Preview" class="preview-image" />
                  <button type="button" class="btn-remove-photo" (click)="removePhoto()">Γ£ò Quitar</button>
                </div>
              }
            </div>
            
            <div class="form-row">
              <div class="form-group flex-1">
                <label for="latitud">Latitud</label>
                <input type="number" id="latitud" [(ngModel)]="formData.latitud" 
                       name="latitud" step="0.000001" placeholder="-33.4..." />
              </div>
              
              <div class="form-group flex-1">
                <label for="longitud">Longitud</label>
                <input type="number" id="longitud" [(ngModel)]="formData.longitud" 
                       name="longitud" step="0.000001" placeholder="-70.6..." />
              </div>
            </div>
          </div>
        
        <div class="form-section">
          <h3>Informaci├│n del Registro</h3>
          
          <div class="form-group">
            <label for="motivo_no_volver">Motivo "No Visitar" *</label>
            <textarea id="motivo_no_volver" [(ngModel)]="formData.motivo_no_volver" 
                      name="motivo_no_volver" required rows="3"
                      placeholder="Explica por qu├⌐ la persona pidi├│ no ser visitada..."></textarea>
          </div>
          
          <div class="form-group">
            <label for="persona_registra">Registrador por *</label>
            <input type="text" id="persona_registra" [(ngModel)]="formData.persona_registra" 
                   name="persona_registra" required [placeholder]="authService.currentUser()?.nombre || 'Tu nombre'" />
          </div>
        </div>
        
        <div class="form-actions">
          <a routerLink="/casas" class="btn btn-outline">Cancelar</a>
          <button type="submit" class="btn btn-primary" [disabled]="loading()">
            @if (loading()) {
              <span class="spinner"></span>
            }
            {{ isEdit() ? 'Actualizar' : 'Registrar' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .page-container { max-width: 700px; margin: 0 auto; }
    .page-header { margin-bottom: 1.5rem; }
    .back-link { color: var(--primary-color); text-decoration: none; font-weight: 500; display: block; margin-bottom: 0.5rem; }
    h1 { font-size: 1.5rem; font-weight: 700; }
    .form-card { padding: 2rem; }
    .form-section { margin-bottom: 2rem; h3 { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; color: var(--text-secondary); } }
    .form-row { display: flex; gap: 1rem; flex-wrap: wrap; .flex-1 { flex: 1; min-width: 150px; } .flex-2 { flex: 2; } }
    .form-group { margin-bottom: 1rem; width: 100%; }
    label { display: block; font-weight: 500; margin-bottom: 0.5rem; font-size: 0.875rem; }
    input, textarea, select { width: 100%; padding: 0.625rem 0.875rem; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 0.875rem; }
    textarea { resize: vertical; }
    .form-actions { display: flex; justify-content: flex-end; gap: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color); }
    .error-message { background: rgba(239, 68, 68, 0.1); color: var(--danger-color); padding: 0.75rem; border-radius: var(--radius-md); margin-bottom: 1rem; }
    .file-input { padding: 0.5rem; background: var(--surface-color); }
    .preview-container { margin-top: 0.5rem; position: relative; display: inline-block; }
    .preview-image { max-width: 200px; max-height: 200px; border-radius: var(--radius-md); object-fit: cover; }
    .btn-remove-photo { position: absolute; top: -8px; right: -8px; background: var(--danger-color); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 12px; &:hover { background: #dc2626; } }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 9999; animation: fadeIn 0.2s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .modal-box { background: white; border-radius: 16px; padding: 2.5rem; text-align: center; max-width: 420px; width: 90%; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); animation: scaleIn 0.2s ease; }
    .modal-icon { width: 72px; height: 72px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem; }
    .modal-icon-success { background: linear-gradient(135deg, #dcfce7 0%, #86efac 100%); color: #16a34a; }
    .modal-title { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem; color: #1f2937; }
    .modal-message { color: #6b7280; margin-bottom: 1.75rem; line-height: 1.6; font-size: 1.0625rem; }
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.875rem 1.75rem; border-radius: 12px; font-weight: 600; font-size: 1rem; cursor: pointer; transition: all 0.2s ease; border: none; }
    .btn-primary { background: linear-gradient(135deg, var(--primary-color) 0%, #2563eb 100%); color: white; box-shadow: 0 4px 14px 0 rgba(37, 99, 235, 0.39); &:hover { transform: translateY(-2px); box-shadow: 0 6px 20px 0 rgba(37, 99, 235, 0.23); } }
  `]
})
export class CasaFormComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private casaService = inject(CasaService);
  authService = inject(AuthService);
  
  isEdit = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);
  previewUrl = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  
  formData: Partial<Casa> = {};
  private casaId: string | null = null;
  private selectedFile: File | null = null;
  
  ngOnInit() {
    this.formData.persona_registra = this.authService.currentUser()?.nombre || '';
    this.casaId = this.route.snapshot.paramMap.get('id');
    
    if (this.casaId) {
      this.isEdit.set(true);
      this.casaService.getCasa(this.casaId).subscribe({
        next: (casa: Casa) => {
          this.formData = { ...casa };
          // Si tiene foto, mostrarla
          if (casa.foto_url) {
            this.previewUrl.set(casa.foto_url);
          }
        },
        error: () => {
          void this.router.navigate(['/casas']);
        }
      });
    }
  }
  
  onSubmit() {
    if (!this.formData.calle_principal || !this.formData.numeracion || 
        !this.formData.sector || !this.formData.motivo_no_volver) {
      this.error.set('Por favor complete los campos requeridos');
      return;
    }
    
    this.loading.set(true);
    this.error.set(null);
    
    const operation = this.isEdit() && this.casaId
      ? this.casaService.updateCasa(this.casaId, this.formData)
      : this.casaService.createCasa(this.formData);
    
    operation.subscribe({
      next: (casa: Casa) => {
        // Si hay foto seleccionada, subirla
        if (this.selectedFile && casa.id) {
          this.casaService.uploadFoto(casa.id, this.selectedFile).subscribe({
            next: () => {
              this.loading.set(false);
              this.successMessage.set('Casa guardada con foto exitosamente!');
            },
            error: () => {
              this.loading.set(false);
              // La casa ya se guard├│, pero la foto fall├│
              this.successMessage.set('Casa guardada (foto no subida)');
            }
          });
        } else {
          this.loading.set(false);
          this.successMessage.set('Casa guardada exitosamente!');
        }
      },
      error: (err: { error?: { message?: string } }) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Error al guardar');
      }
    });
  }
  
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl.set(reader.result as string);
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }
  
  removePhoto() {
    this.selectedFile = null;
    this.previewUrl.set(null);
  }

  goToList() {
    void this.router.navigate(['/casas']);
  }
}
