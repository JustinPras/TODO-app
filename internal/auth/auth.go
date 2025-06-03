package auth

import (
	"fmt"
	// "time"
	// "strings"

	"golang.org/x/crypto/bcrypt"
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