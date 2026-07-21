# Programa de Predicación — Specification

## Overview

Backend CRUD API for preaching program management. Manages appointments (date, time, location, optional grupo, N:M territorio assignment). All endpoints require auth with no role guard.

## Requirements

### Requirement: List Programs

`GET /api/programas-predicacion` MUST return all programs as `{ "data": [...] }`. Each SHOULD include territorio assignments.

- GIVEN 3 programs exist
- WHEN GET /api/programas-predicacion
- THEN HTTP 200 with `{ "data": [...] }`

### Requirement: Get Program

`GET /api/programas-predicacion/:id` MUST return programs as `{ "data": { ... } }`. MUST return 404 if not found.

- GIVEN program `abc-123` exists
- WHEN GET /api/programas-predicacion/abc-123
- THEN HTTP 200 with program data

- GIVEN no program at `abc-999`
- WHEN GET /api/programas-predicacion/abc-999
- THEN HTTP 404

### Requirement: Create Program

`POST /api/programas-predicacion` MUST return 201 on success, 409 on duplicate (same fecha + hora_inicio), 400 on invalid body. Users MAY include `territorios` UUID array; system MUST atomically replace join-table rows.

- GIVEN valid body with fecha, hora_inicio, empty territorios
- WHEN POST /api/programas-predicacion
- THEN HTTP 201 with created program

- GIVEN valid body with 2 territorio UUIDs
- WHEN POST /api/programas-predicacion
- THEN HTTP 201 and join table has both territories

- GIVEN program with fecha `2026-07-15` and hora_inicio `10:00` exists
- WHEN POST with same fecha and hora_inicio
- THEN HTTP 409

- GIVEN empty body
- WHEN POST /api/programas-predicacion
- THEN HTTP 400

### Requirement: Update Program

`PUT /api/programas-predicacion/:id` MUST return 200 on success, 404 if not found, 409 on duplicate (excluding self), 400 on invalid body. Replaces territorio assignments atomically.

- GIVEN program `abc-123` with 3 territories
- WHEN PUT with 1 different territorio
- THEN HTTP 200 and join table has exactly 1 territory

- GIVEN program A (fecha `2026-07-15`, hora `10:00`) exists; updating program B to same values
- WHEN PUT /api/programas-predicacion/B
- THEN HTTP 409

- GIVEN no program at `abc-999`
- WHEN PUT /api/programas-predicacion/abc-999
- THEN HTTP 404

### Requirement: Delete Program

`DELETE /api/programas-predicacion/:id` MUST return 204 on success, 404 if not found. Join-table rows cascade-deleted.

- GIVEN program `abc-123` with 2 territories
- WHEN DELETE /api/programas-predicacion/abc-123
- THEN HTTP 204 and join-table rows removed

- GIVEN no program at `abc-999`
- WHEN DELETE /api/programas-predicacion/abc-999
- THEN HTTP 404

### Requirement: Authentication

All endpoints MUST require `Authenticate()` middleware. No role guard — any authenticated user MAY access all endpoints.

- GIVEN no auth token
- WHEN any /api/programas-predicacion endpoint
- THEN HTTP 401

### Requirement: Response Format

All responses MUST use `{ "data": ... }`. List returns array, single-resource returns object.

- GIVEN any successful CRUD operation
- WHEN inspecting response body
- THEN JSON has top-level `data` key

## Non-Functional

- **Concurrency**: DB unique constraint `(fecha, hora_inicio)` prevents race conditions.
- **Idempotency**: DELETE returns 204 first call, 404 thereafter.
- **Performance**: N+1 on territorio load tolerable for v1; SHOULD eager-load if degraded.
