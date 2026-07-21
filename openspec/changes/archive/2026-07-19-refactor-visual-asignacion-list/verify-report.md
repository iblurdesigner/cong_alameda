# Verify Report — `refactor-visual-asignacion-list`

## Verdict
**PASS WITH WARNINGS**

- Refactor cosmético: ✅ completo, compila limpio (`npx tsc --noEmit` → 0 errores en `asignacion-list.component.ts`).
- Spec de comportamiento: ✅ redactado y **ejecutado GREEN (4/4) bajo una configuración de Jest corregida para Angular 21**.
- ⚠️ El spec NO corre bajo `jest.config.js` actual del repo porque el harness de pruebas preexistente no resuelve los subpaths `exports`-only de Angular 21. No se modificó `jest.config.js` / `tsconfig.spec.json` por la regla de alcance del cambio.

## Strict TDD Evidence

| Task | RED (test escrito primero) | GREEN (impl. pasa) | REFACTOR |
|------|----------------------------|--------------------|----------|
| 2. Spec render modal + save wiring | Spec creado con aserciones DOM (`#persona`, `#observaciones`, botón Asignar) y espía `createAsignacion` | 4/4 passed tras refactor cosmético | N/A (sin refactor de código de negocio) |
| 1. Refactor cosmético | — | `tsc --noEmit` 0 errores | Comentarios HTML→MAYÚSCULAS, botones bulk compactados |

## Comandos ejecutados
1. `npx tsc --noEmit -p tsconfig.json` → sin errores que mencionen `asignacion-list` (fuente de verdad de compilación).
2. Spec bajo config temporal corregida:
   ```
   npx jest --watchAll=false --testPathPatterns=asignacion-list
   Test Suites: 1 passed, 1 total
   Tests:       4 passed, 4 total
   ```

## Resultados de los tests (4/4)
- `should create the component`
- `should render the assignment modal with person select and observaciones textarea when opened`
- `should wire saveAsignacion to AsignacionService.createAsignacion`
- `should NOT call createAsignacion when user_id is empty`

## Advertencia / Bloqueo de harness (fuera de alcance del refactor)
La versión actual de `jest-preset-angular@16.1.1` + Jest 30 en este repo **no resuelve los subpaths de Angular 21 definidos solo vía `exports`** (`@angular/core/testing`, `@angular/platform-browser/testing`, `@angular/common/http`) porque ts-jest cae a `moduleResolution: node` (node10) y no aplica `bundler`. El propio `setup-jest.ts` del repo documenta: *"zone.js/testing no es compatible con Jest 30 todavía"*. No existe ningún spec de componente Angular en el repo (solo `format.utils.spec.ts`, funciones puras).

### Remediación mínima requerida (test-infra, NO parte del refactor visual)
En `jest.config.js`, forzar en el transform de `jest-preset-angular`:
```js
transform: {
  '^.+\\.(ts|js|mjs|html|svg)$': ['jest-preset-angular', {
    tsconfig: { module: 'esnext', moduleResolution: 'bundler', target: 'ES2022',
                esModuleInterop: true, experimentalDecorators: true }
  }]
}
```
Y en `tsconfig.spec.json` agregar el `paths` para los subpaths `testing` (o bien `moduleResolution: bundler` ya presente en herencia). Con eso, el spec de este cambio corre GREEN bajo el config del repo.

## Riesgo
- Bajo. Frontend, sin lógica de negocio. El refactor preserva 1:1 el comportamiento (modal, save, data flow, ASEO_SALON intacto en main).
- Único riesgo: el spec queda "escrito y verificado por fuera" hasta que el harness del repo se habilite para Angular 21.
