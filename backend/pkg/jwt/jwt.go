package jwt

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

var (
	ErrInvalidToken = errors.New("token inválido")
	ErrExpiredToken  = errors.New("token expirado")
)

// ResetClaims contiene claims específicos para reset de password
type ResetClaims struct {
	Email string `json:"email"`
	Type  string `json:"type"` // "password_reset"
	jwt.RegisteredClaims
}

type Claims struct {
	UserID uuid.UUID `json:"user_id"`
	Email  string    `json:"email"`
	Rol    string    `json:"rol"`
	jwt.RegisteredClaims
}

type JWTManager struct {
	secret     []byte
	expiryTime time.Duration
}

func NewJWTManager(secret string, expiryHours int) *JWTManager {
	return &JWTManager{
		secret:     []byte(secret),
		expiryTime: time.Duration(expiryHours) * time.Hour,
	}
}

func (m *JWTManager) GenerateToken(userID uuid.UUID, email, rol string) (string, error) {
	claims := &Claims{
		UserID: userID,
		Email:  email,
		Rol:    rol,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(m.expiryTime)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "cong-alameda-backend",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(m.secret)
}

func (m *JWTManager) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return m.secret, nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

// GenerateResetToken genera un JWT para recovery de password con expiry 15min
func (m *JWTManager) GenerateResetToken(email string) (string, error) {
	claims := &ResetClaims{
		Email: email,
		Type:  "password_reset",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "cong-alameda-backend",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(m.secret)
}

// ValidateResetToken valida un JWT de recovery de password
func (m *JWTManager) ValidateResetToken(tokenString string) (*ResetClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &ResetClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return m.secret, nil
	})

	if err != nil {
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*ResetClaims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	// Verificar que es un token de password_reset
	if claims.Type != "password_reset" {
		return nil, ErrInvalidToken
	}

	return claims, nil
}
