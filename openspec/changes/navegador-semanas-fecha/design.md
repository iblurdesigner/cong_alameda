# Technical Design: Navegador de Semanas por Fecha

## Template Changes
- Replace `<select>` with:
  ```html
  <div class="week-nav-bar">
    <button class="nav-btn" (click)="navigateWeek(-1)" title="Semana anterior">
      <span class="material-symbols-outlined">chevron_left</span>
      <span>Anterior</span>
    </button>
    <div class="date-picker-box">
      <span class="material-symbols-outlined icon">calendar_month</span>
      <input type="date" [ngModel]="selectedDateInput" (change)="onDateInputChange($event)" class="date-input">
    </div>
    <button class="nav-btn" (click)="navigateWeek(1)" title="Semana siguiente">
      <span>Siguiente</span>
      <span class="material-symbols-outlined">chevron_right</span>
    </button>
  </div>
  ```

## TS Logic
- `selectedDateInput`: Date string in `YYYY-MM-DD` format.
- `navigateWeek(weeksOffset: number)`:
  - Adds/subtracts `7 * weeksOffset` days to the current selected date.
  - Recalculates Monday and calls `selectOrCreateWeekForDate(mondayDate)`.
- `selectOrCreateWeekForDate(date: Date)`:
  - Format `fechaInicioStr = YYYY-MM-DD`.
  - Searches `semanas()` for matching `fecha_inicio`.
  - If found: set `selectedSemanaId` and call `loadSemana()`.
  - If not found: call `semanaService.createSemana(...)` to auto-create and load.
