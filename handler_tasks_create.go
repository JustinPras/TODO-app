package main

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/JustinPras/TODO-app/internal/database"
	"github.com/JustinPras/TODO-app/internal/auth"

	"github.com/google/uuid"
)

type Task struct {
	ID 			uuid.UUID 	`json:"id"`
	CreatedAt 	time.Time 	`json:"created_at"`
	UpdatedAt 	time.Time 	`json:"updated_at"`
	Body 		string 		`json:"body"`
	UserID		uuid.UUID 	`json:"user_id"`
}

func (cfg *apiConfig) handlerTasksCreate(w http.ResponseWriter, r *http.Request) {
	type parameters struct {
		Body 	string 		`json:"body"`
	}

	jwtToken, err := auth.GetBearerToken(r.Header)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Couldn't find JWT", err)
		return
	}

	userID, err := auth.ValidateJWT(jwtToken, cfg.jwtSecret)
	if err != nil {
		respondWithError(w, http.StatusUnauthorized, "Couldn't validate JWT", err)
		return
	}

	decoder := json.NewDecoder(r.Body)
	params := parameters{}
	err = decoder.Decode(&params)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Couldn't decode parameters", err)
		return
	}

	taskParams := database.CreateTaskParams {
		Body: 	params.Body,
		UserID:	userID,
	}

	task, err := cfg.db.CreateTask(r.Context(), taskParams)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Couldn't create new task", err)
		return
	}

	respondWithJSON(w, http.StatusCreated, Task{
		ID:			task.ID,
		CreatedAt: 	task.CreatedAt,
		UpdatedAt: 	task.UpdatedAt,
		Body: 		task.Body,
		UserID:		task.UserID,
	})

}