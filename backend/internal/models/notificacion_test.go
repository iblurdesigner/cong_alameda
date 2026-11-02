package models

import "testing"

// --- NotificacionTipo.IsValid ---

func TestNotificacionTipo_IsValid(t *testing.T) {
	valid := []NotificacionTipo{
		NotifTipoCasaRegistrada,
		NotifTipoVisitaProgramada,
		NotifTipoVisitaCompletada,
		NotifTipoPersonaRequiereVisita,
		NotifTipoAsignacionCreada,
		NotifTipoAsignacionActualizada,
		NotifTipoAsignacionCompletada,
	}
	for _, tipo := range valid {
		if !tipo.IsValid() {
			t.Errorf("IsValid() = false for %q, want true", string(tipo))
		}
	}
}

func TestNotificacionTipo_IsValid_Invalid(t *testing.T) {
	invalid := []NotificacionTipo{
		"INVALID_TIPO",
		"asignacion_creada", // case-sensitive
		"",
		NotificacionTipo("ASIGNACION"),
	}
	for _, tipo := range invalid {
		if tipo.IsValid() {
			t.Errorf("IsValid() = true for %q, want false", string(tipo))
		}
	}
}

// --- NotificacionTipo.String ---

func TestNotificacionTipo_String(t *testing.T) {
	cases := map[NotificacionTipo]string{
		NotifTipoCasaRegistrada:        "Casa Registrada",
		NotifTipoVisitaProgramada:      "Visita Programada",
		NotifTipoVisitaCompletada:      "Visita Completada",
		NotifTipoPersonaRequiereVisita: "Persona Requiere Visita",
		NotifTipoAsignacionCreada:      "Asignación Creada",
		NotifTipoAsignacionActualizada: "Asignación Actualizada",
		NotifTipoAsignacionCompletada:  "Asignación Completada",
	}
	for tipo, want := range cases {
		if got := tipo.String(); got != want {
			t.Errorf("String() for %q = %q, want %q", string(tipo), got, want)
		}
	}
}

func TestNotificacionTipo_String_UnknownFallsBackToRawValue(t *testing.T) {
	if got := NotificacionTipo("SOME_UNKNOWN").String(); got != "SOME_UNKNOWN" {
		t.Errorf("String() for unknown tipo = %q, want raw value %q", got, "SOME_UNKNOWN")
	}
}

// --- ReferenciaTipo.IsValid (added by this change alongside the notification types) ---

func TestReferenciaTipo_IsValid(t *testing.T) {
	if !RefTipoAsignacion.IsValid() {
		t.Error("RefTipoAsignacion should be valid")
	}
	if !RefTipoVisita.IsValid() {
		t.Error("RefTipoVisita should be valid")
	}
	if ReferenciaTipo("OTRO").IsValid() {
		t.Error(`ReferenciaTipo("OTRO") should be invalid`)
	}
}
