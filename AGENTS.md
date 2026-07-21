# AGENTS.md ΓÇö App Congregaci├│n Alameda

## Meta

Este archivo define las instrucciones persistentes para todos los agentes que trabajen en este proyecto.

---

## Regla Fundamental: SDD Obligatorio

** Cualquier pedido de feature, cambio, refactor o bug fix DEBE pasar por el flujo completo de Spec-Driven Development (SDD).**

No hay excepciones. Si un usuario pide:
- "agregar autenticaci├│n"
- "crear un componente para..."
- "fixear el login"
- "refactorizar el servicio de usuarios"
- "agregar validaci├│n al formulario"

**El flujo obligatorio es:**

```
1. sdd-propose  ΓåÆ Crear propuesta de cambio (scope, intent, approach)
2. sdd-spec    ΓåÆ Escribir especificaciones (requirements, scenarios)
3. sdd-design  ΓåÆ Dise├▒o t├⌐cnico (architecture decisions)
4. sdd-tasks   ΓåÆ Desglose en tareas (implementation checklist)
5. sdd-apply   ΓåÆ Implementar c├│digo (follow specs)
6. sdd-verify  ΓåÆ Validar contra specs
7. sdd-archive ΓåÆ Archivar cambio completado
```

### C├│mo ejecutar el flujo

Cuando detectes un pedido de cambio:

1. **Primero**: Cargar las skills necesarias usando `skill(name: "sdd-XXX")` 
2. **Segundo**: Invocar el subagente correspondiente via `task(subagent_type: "sdd-XXX", ...)` o ejecutar directamente
3. **Tercero**: Ejecutar la skill completa y retornar el resultado
4. **Cuarto**: Continuar a la siguiente fase autom├íticamente

### Importancia del orden

- **NUNCA** empezar a codear antes de tener specs (sdd-spec) y dise├▒o (sdd-design)
- **NUNCA** saltarse sdd-tasks ΓÇö el desglose es obligatorio para trackear progreso
- **NUNCA** hacer sdd-apply sin haber completado sdd-spec primero
- **NUNCA** omitir sdd-verify ΓÇö la validaci├│n es cr├¡tica

---

## Stack Detectado

- **Backend**: Go (Fiber), PostgreSQL, JWT auth
- **Frontend**: Angular 21, SCSS, Jest testing
- **DevOps**: Docker, Nginx

---

## Convenciones de C├│digo

### Go (Backend)
- Estructura: `internal/`, `pkg/`, `cmd/`
- Testing: archivos `*_test.go` en el mismo paquete
- Errors: wrapping con `fmt.Errorf("context: %w", err)`

### Angular (Frontend)
- Arquitectura: Container/Presentational pattern
- Estado: Signals donde corresponda
- Testing: Jest + componentes con `TestBed`

### Git
- Commits: Conventional commits (`feat:`, `fix:`, `refactor:`, etc.)
- Ramas: `dev` para trabajo, `main` para producci├│n

---

## Reglas Adicionales

1. **Antes de escribir c├│digo**: Siempre cargar la skill relevante del proyecto (ej: `go-testing` para tests en Go, o la skill de frontend si corresponde)
2. **Memoria**: Usar `mem_save()` para decisiones arquitect├│nicas importantes
3. **Documentaci├│n**: NO crear archivos .md proactivamente ΓÇö solo cuando el usuario lo pida expl├¡citamente
4. **Nunca**: hacer build despu├⌐s de cambios (el usuario lo hace manualmente si lo necesita)

---

## Referencias

- Skills SDD: `.atl/skill-registry.md`
- Config SDD: `openspec/config.yaml` (si existe)
