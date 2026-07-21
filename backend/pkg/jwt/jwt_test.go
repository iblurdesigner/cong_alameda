package jwt

import (
	"testing"

	"github.com/google/uuid"
)

func TestGenerateAndValidateResetToken(t *testing.T) {
	mgr := NewJWTManager("test-secret-key-for-testing", 24)
	userID := uuid.New()
	email := "test@example.com"

	token, err := mgr.GenerateResetToken(userID, email)
	if err != nil {
		t.Fatalf("unexpected error generating token: %v", err)
	}

	if token == "" {
		t.Fatal("expected non-empty token")
	}

	claims, err := mgr.ValidateResetToken(token)
	if err != nil {
		t.Fatalf("unexpected error validating token: %v", err)
	}

	if claims.UserID != userID {
		t.Errorf("expected UserID %v, got %v", userID, claims.UserID)
	}

	if claims.Email != email {
		t.Errorf("expected Email %s, got %s", email, claims.Email)
	}

	if claims.Purpose != "password_reset" {
		t.Errorf("expected Purpose 'password_reset', got '%s'", claims.Purpose)
	}
}

func TestValidateResetToken_InvalidToken(t *testing.T) {
	mgr := NewJWTManager("test-secret-key-for-testing", 24)

	_, err := mgr.ValidateResetToken("invalid-token-string")
	if err == nil {
		t.Error("expected error for invalid token")
	}

	if err != ErrInvalidToken {
		t.Errorf("expected ErrInvalidToken, got %v", err)
	}
}

func TestValidateResetToken_WrongSecret(t *testing.T) {
	mgr1 := NewJWTManager("secret-one", 24)
	mgr2 := NewJWTManager("secret-two", 24)

	userID := uuid.New()
	token, err := mgr1.GenerateResetToken(userID, "test@example.com")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	_, err = mgr2.ValidateResetToken(token)
	if err == nil {
		t.Error("expected error for token signed with different secret")
	}

	if err != ErrInvalidToken {
		t.Errorf("expected ErrInvalidToken, got %v", err)
	}
}

func TestValidateResetToken_AuthTokenFailsAsResetToken(t *testing.T) {
	mgr := NewJWTManager("test-secret-key-for-testing", 24)

	// Generate an auth token (with Claims, not ResetClaims)
	userID := uuid.New()
	authToken, err := mgr.GenerateToken(userID, "test@example.com", "VISITANTE")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Try to validate it as a reset token — should fail (no Purpose field)
	_, err = mgr.ValidateResetToken(authToken)
	if err == nil {
		t.Error("expected error when validating auth token as reset token")
	}

	if err != ErrMissingPurpose {
		t.Errorf("expected ErrMissingPurpose, got %v", err)
	}
}
