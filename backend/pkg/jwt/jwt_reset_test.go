package jwt

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func TestGenerateResetToken(t *testing.T) {
	mgr := NewJWTManager("test-secret-key-for-testing", 24)

	token, err := mgr.GenerateResetToken("test@example.com")
	if err != nil {
		t.Fatalf("GenerateResetToken failed: %v", err)
	}
	if token == "" {
		t.Error("GenerateResetToken returned empty token")
	}
}

func TestValidateResetToken(t *testing.T) {
	mgr := NewJWTManager("test-secret-key-for-testing", 24)

	tests := []struct {
		name      string
		setup     func() string
		wantEmail string
		wantErr   bool
		errType   error
	}{
		{
			name: "valid token",
			setup: func() string {
				token, _ := mgr.GenerateResetToken("user@test.com")
				return token
			},
			wantEmail: "user@test.com",
			wantErr:   false,
		},
		{
			name: "invalid token format",
			setup: func() string {
				return "invalid.token.here"
			},
			wantErr: true,
			errType: ErrInvalidToken,
		},
		{
			name: "expired token",
			setup: func() string {
				// Create a token with expiry in the past
				claims := &ResetClaims{
					Email: "expired@test.com",
					Type:  "password_reset",
					RegisteredClaims: jwt.RegisteredClaims{
						ExpiresAt: jwt.NewNumericDate(time.Now().Add(-1 * time.Hour)), // Already expired
						IssuedAt:  jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
						NotBefore: jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
						Issuer:    "cong-alameda-backend",
					},
				}
				token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
				tokenStr, _ := token.SignedString([]byte("test-secret-key-for-testing"))
				return tokenStr
			},
			wantErr: true,
			errType: ErrExpiredToken,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			token := tt.setup()
			claims, err := mgr.ValidateResetToken(token)

			if tt.wantErr {
				if err == nil {
					t.Errorf("ValidateResetToken() expected error, got nil")
				}
				if tt.errType != nil && err != tt.errType {
					t.Errorf("ValidateResetToken() error = %v, want %v", err, tt.errType)
				}
				return
			}

			if err != nil {
				t.Errorf("ValidateResetToken() unexpected error: %v", err)
				return
			}
			if claims.Email != tt.wantEmail {
				t.Errorf("ValidateResetToken() email = %v, want %v", claims.Email, tt.wantEmail)
			}
			if claims.Type != "password_reset" {
				t.Errorf("ValidateResetToken() type = %v, want password_reset", claims.Type)
			}
		})
	}
}

func TestValidateResetToken_WrongSecret(t *testing.T) {
	mgr1 := NewJWTManager("secret-one", 24)
	mgr2 := NewJWTManager("secret-two", 24)

	token, _ := mgr1.GenerateResetToken("test@example.com")
	_, err := mgr2.ValidateResetToken(token)

	if err == nil {
		t.Error("ValidateResetToken should fail with different secret")
	}
}

func TestValidateResetToken_NotResetToken(t *testing.T) {
	mgr := NewJWTManager("test-secret", 24)

	// Generate regular auth token (not reset token)
	claims := &Claims{
		UserID: uuidMustParse("123e4567-e89b-12d3-a456-426614174000"),
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
}

func uuidMustParse(s string) uuid.UUID {
	u, _ := uuid.Parse(s)
	return u
}