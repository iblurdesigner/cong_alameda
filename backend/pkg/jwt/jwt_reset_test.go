package jwt

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func TestValidateResetToken_ExpiredToken(t *testing.T) {
	mgr := NewJWTManager("test-secret-key-for-testing", 24)

	// Create a reset token with expiry in the past
	userID := uuid.New()
	claims := &ResetClaims{
		UserID:  userID,
		Email:   "expired@test.com",
		Purpose: "password_reset",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
			NotBefore: jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
			Issuer:    "cong-alameda-backend",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString([]byte("test-secret-key-for-testing"))

	_, err := mgr.ValidateResetToken(tokenStr)
	if err == nil {
		t.Error("ValidateResetToken expected error for expired token, got nil")
	}
	if err != ErrExpiredToken {
		t.Errorf("ValidateResetToken expected ErrExpiredToken, got %v", err)
	}
}

func TestValidateResetToken_NotResetToken(t *testing.T) {
	mgr := NewJWTManager("test-secret", 24)

	// Generate regular auth token (not reset token) via raw Claims
	claims := &Claims{
		UserID: uuid.MustParse("123e4567-e89b-12d3-a456-426614174000"),
		Email:  "test@example.com",
		Rol:    "VISITANTE",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(1 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "cong-alameda-backend",
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, _ := token.SignedString([]byte("test-secret"))

	_, err := mgr.ValidateResetToken(tokenString)
	if err == nil {
		t.Error("ValidateResetToken should fail for non-reset token")
	}
	if err != ErrMissingPurpose {
		t.Errorf("ValidateResetToken expected ErrMissingPurpose, got %v", err)
	}
}