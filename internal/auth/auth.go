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