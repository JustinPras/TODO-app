package auth

import (
	"fmt"
	"time"
	"net/http"
	"strings"
	"crypto/rand"
	"encoding/hex"
	"context"

	"golang.org/x/crypto/bcrypt"

	"github.com/JustinPras/TODO-app/internal/database"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

type TokenType string

const (
	// TokenTypeAccess -
	TokenTypeAccess TokenType = "TODO-access"
)


func HashPassword(password string) (string, error) {
	const cost = 8
	
	hashPassword, err  := bcrypt.GenerateFromPassword([]byte(password), cost)
	if err != nil {
		return "", fmt.Errorf("Couldn't hash password: %w", err)
	}

	return string(hashPassword), nil
}

func CheckPasswordHash(hash, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}

func MakeJWT(userID uuid.UUID, tokenSecret string, expiresIn time.Duration) (string, error) {
	claims := jwt.RegisteredClaims{
		Issuer: 	string(TokenTypeAccess),
		IssuedAt:	jwt.NewNumericDate(time.Now().UTC()),
		ExpiresAt:	jwt.NewNumericDate(time.Now().UTC().Add(expiresIn)),
		Subject:	userID.String(),
	}

	signingKey := []byte(tokenSecret)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(signingKey)
}

func ValidateJWT(tokenString, tokenSecret string) (uuid.UUID, error) {
	parser := jwt.NewParser()
	claims := jwt.RegisteredClaims{}

	token, err := parser.ParseWithClaims(tokenString, &claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(tokenSecret), nil
	})

	if err != nil {
		return uuid.Nil, err
	}

	userIDString, err := token.Claims.GetSubject()
	if err != nil {
		return uuid.Nil, err
	}

	issuer, err := token.Claims.GetIssuer()
	if err != nil {
		return uuid.Nil, err
	}
	if issuer != string(TokenTypeAccess) {
		return uuid.Nil, fmt.Errorf("Invalid issuer")
	}

	userID, err := uuid.Parse(userIDString)
	if err != nil {
		return uuid.Nil, fmt.Errorf("Invalid user ID: %w", err)
	}

	return userID, nil
}

func GetBearerToken(headers http.Header) (string, error) {
	authHeader := headers.Get("Authorization")
	if authHeader == "" {
		return "", fmt.Errorf("Authorization header does not exist")
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")

	
	return tokenString, nil
}

func MakeRefreshToken(db *database.Queries, userID uuid.UUID, expiresIn time.Time) (string, error) {
	key := make([]byte, 32)
	rand.Read(key)

	keyString := hex.EncodeToString(key)

	refreshTokenParams := database.CreateRefreshTokenParams{
		Token: 		keyString,
		UserID:		userID,
		ExpiresAt:	expiresIn,
	}

	refreshToken, err := db.CreateRefreshToken(context.Background(), refreshTokenParams)
	if err != nil {
		return "", fmt.Errorf("Could not create refresh token: %w", err) 
	}

	return refreshToken.Token, nil
}