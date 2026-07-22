package services

import (
	"bytes"
	"log"
	"strings"
	"testing"
)

func TestConsoleEmailService_SendPasswordReset(t *testing.T) {
	// Capture log output
	var buf bytes.Buffer
	originalOutput := log.Writer()
	log.SetOutput(&buf)
	defer log.SetOutput(originalOutput) // Restore after test

	svc := NewConsoleEmailService("http://localhost:4200")
	err := svc.SendPasswordReset("user@example.com", "test-token-123")

	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	output := buf.String()
	if !strings.Contains(output, "user@example.com") {
		t.Error("expected log to contain email")
	}
	if !strings.Contains(output, "http://localhost:4200/recovery?token=test-token-123") {
		t.Error("expected log to contain full recovery URL")
	}
	if !strings.Contains(output, "[Password Recovery]") {
		t.Error("expected log to contain prefix")
	}
}
