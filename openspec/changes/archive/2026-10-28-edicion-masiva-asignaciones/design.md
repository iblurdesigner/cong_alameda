# Technical Design: Edición Masiva y Nuevos Roles

## Database Changes
New rows in `tipo_asignacion`:
- `MICROFONO_IZQ` (Micrófono Izquierda, icon: 🎤)
- `MICROFONO_DER` (Micrófono Derecha, icon: 🎤)
- `ACOMODADOR_1` (Acomodador 1, icon: 🪑)
- `ACOMODADOR_2` (Acomodador 2, icon: 🪑)

## Frontend Component Changes
- `asignacion-list.component.ts`:
  - Add `showEditDiaModal`, `editingDiaNumero`, and `dayFormState` for managing forms of all roles in a given day.
  - Implement `openEditDiaModal(diaNumero)` and `saveDiaAsignaciones()`.
  - Update `getTiposList()` order and fallback list to reflect new role types.
