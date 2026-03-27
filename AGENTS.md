# AGENTS.md — App Congregación Alameda

## Meta

Este archivo define las instrucciones persistentes para todos los agentes que trabajen en este proyecto.

---

## Regla Fundamental: SDD Obligatorio

** Cualquier pedido de feature, cambio, refactor o bug fix DEBE pasar por el flujo completo de Spec-Driven Development (SDD).**

No hay excepciones. Si un usuario pide:
- "agregar autenticación"
- "crear un componente para..."
- "fixear el login"
- "refactorizar el servicio de usuarios"
- "agregar validación al formulario"

**El flujo obligatorio es:**

```
1. sdd-propose  → Crear propuesta de cambio (scope, intent, approach)
2. sdd-spec    → Escribir especificaciones (requirements, scenarios)
3. sdd-design  → Diseño técnico (architecture decisions)
4. sdd-tasks   → Desglose en tareas (implementation checklist)
5. sdd-apply   → Implementar código (follow specs)
6. sdd-verify  → Validar contra specs
7. sdd-archive → Archivar cambio completado
```

### Cómo ejecutar el flujo

Cuando detectes un pedido de cambio:

1. **Primero**: Cargar las skills necesarias usando `skill(name: "sdd-XXX")` 
2. **Segundo**: Invocar el subagente correspondiente via `task(subagent_type: "sdd-XXX", ...)` o ejecutar directamente
3. **Tercero**: Ejecutar la skill completa y retornar el resultado
4. **Cuarto**: Continuar a la siguiente fase automáticamente

### Importancia del orden

- **NUNCA** empezar a codear antes de tener specs (sdd-spec) y diseño (sdd-design)
- **NUNCA** saltarse sdd-tasks — el desglose es obligatorio para trackear progreso
- **NUNCA** hacer sdd-apply sin haber completado sdd-spec primero
- **NUNCA** omitir sdd-verify — la validación es crítica

---

## Stack Detectado

- **Backend**: Go (Gin), PostgreSQL, JWT auth
- **Frontend**: Angular 17+, SCSS, Jest testing
- **DevOps**: Docker, Nginx

---

## Convenciones de Código

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
- Ramas: `dev` para trabajo, `main` para producción

---

## Reglas Adicionales

1. **Antes de escribir código**: Siempre cargar la skill relevante del proyecto (ej: `go-testing` para tests en Go, o la skill de frontend si corresponde)
2. **Memoria**: Usar `mem_save()` para decisiones arquitectónicas importantes
3. **Documentación**: NO crear archivos .md proactivamente — solo cuando el usuario lo pida explícitamente
4. **Nunca**: hacer build después de cambios (el usuario lo hace manualmente si lo necesita)

---

## Referencias

- Skills SDD: `.atl/skill-registry.md`
- Config SDD: `openspec/config.yaml` (si existe)