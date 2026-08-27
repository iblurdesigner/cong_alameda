# Technical Design: Navegación de Notificación a Semana Específica

## Component Diagram & Flow

```
[Notificaciones Dashboard] --(Click 'Ver' on Asignación)--> [Router navigate /asignaciones?semana_id=UUID]
                                                                     |
                                                                     v
                                                          [AsignacionListComponent]
                                                                     |
                                                       (queryParams.subscribe)
                                                                     |
                                                         (set selectedSemanaId)
                                                                     |
                                                          [loadSemana() called]
```

## Backend Schema Adjustments
- `models.Notificacion`:
  ```go
  type Notificacion struct {
      ...
      ReferenciaID   *uuid.UUID       `json:"referencia_id,omitempty" db:"referencia_id"`
      ReferenciaTipo *ReferenciaTipo  `json:"referencia_tipo,omitempty" db:"referencia_tipo"`
  }
  ```
- Update `GetByUserID` query in `notificacion_repo.go`:
  ```sql
  SELECT n.id, n.tipo, n.casa_id, n.destinatarios, n.mensaje, nu.leida, n.created_at, n.referencia_id, n.referencia_tipo
  FROM notificaciones n
  ...
  ```

## Frontend Angular Updates
- `NotificationService`: Include `referencia_id` and `referencia_tipo` in `Notificacion` interface.
- `NotificationDashboardComponent`: Update `goToAction(notif)`:
  ```ts
  if (notif.tipo.startsWith('ASIGNACION_') || notif.referencia_tipo === 'ASIGNACION') {
    if (notif.referencia_id) {
      this.router.navigate(['/asignaciones'], { queryParams: { semana_id: notif.referencia_id } });
      return;
    }
  }
  ```
- `AsignacionListComponent`: Inject `ActivatedRoute` and listen to `route.queryParams`.

## Out-of-scope additions (documented)

The following changes were observed in the working tree but are **not** part of the
requirements of this change. They are documented here so reviewers know they are
intentional and pre-existing (introduced by a prior edit/update refactor), not added by
this SDD change:

- **(a) Asignacion-list edit/update assignment flow added.** The component now exposes an
  edit/update path beyond the original "create" flow:
  - `saveAsignacion()` — handles both create (no `editingAsignacion`) and update
    (`editingAsignacion` present) branches via `AsignacionService.createAsignacion` /
    `updateAsignacion`.
  - `openEditDiaModal(diaSemana)` — opens the full-week edit modal and pre-fills
    `dayFormMap` from existing assignments.
  - `getAsignacionForDiaAndTipo(diaSemana, tipoId)` — resolves an assignment by day + type
    (falls back to `getAsignacionForTipo`).
  - `parseLocalDate(dateStr)` — parses `YYYY-MM-DD` as a local date (avoids UTC off-by-one
    when selecting the matching week from `loadSemanas`).

- **(b) `SemanaService.loadSemanas` now defaults `includeArchived=true`.** The method
  signature changed to `loadSemanas(includeArchived: boolean = true)`, so archived weeks
  are returned by default. `AsignacionListComponent.loadSemanas()` relies on this default
  when selecting/loading the week targeted by `semana_id`.
