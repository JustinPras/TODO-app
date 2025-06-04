package main

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/JustinPras/TODO-app/internal/auth"
)

func (cfg *apiConfig) handlerLogin(w http.ResponseWriter, r *http.Request) {
	type parameters struct {
		Email 				string 			`json:"email"`
		Password 			string 			`json:"password`
	}

	type response struct {
		User
		Token 			string 	`json:"token"`
		RefreshToken 	string	`json:"refresh_token"`
	}

	decoder := json.NewDecoder(r.Body)
	params := parameters{}
	err := decoder.Decode(&params)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Couldn't decode parameters", err)
		return
	}

	user, err := cfg.db.GetUserByEmail(r.Context(), params.Email)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Incorrect email or password", err)
		return
	}

	err = auth.CheckPasswordHash(user.HashedPassword, params.Password)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Incorrect email or password", err)
		return
	}

	expirationTime := time.Hour 

	accessToken, err := auth.MakeJWT(user.ID, cfg.jwtSecret, expirationTime)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Couldn't create access JWT", err)
	}
	w.Header().Set("Authorization", accessToken)

	refreshTokenExpirationDate := time.Now().Add(30*24*time.Hour) // month duration

	refreshToken, err := auth.MakeRefreshToken(cfg.db, user.ID, refreshTokenExpirationDate)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Couldn't create refresh Token", err)
	}

	respondWithJSON(w, http.StatusOK, response{
		User: User{
			ID:			user.ID,
			CreatedAt: 	user.CreatedAt,
			UpdatedAt: 	user.UpdatedAt,
			Email: 		user.Email,
		},
		Token: 			accessToken,
		RefreshToken:	refreshToken,	
	})
}