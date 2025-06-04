package main

import (
	"net/http"

	"github.com/JustinPras/TODO-app/internal/auth"
)

func (cfg *apiConfig) handlerTasksGet(w http.ResponseWriter, r *http.Request) {
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

	dbTasks, err := cfg.db.GetTasksByUserID(r.Context(), userID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Couldn't retrieve Tasks", err)
		return
	}

	tasks := []Task{}

	for _, task := range(dbTasks) {
		tasks = append(tasks, Task{
			ID: 		task.ID,
			CreatedAt: 	task.CreatedAt,
			UpdatedAt:	task.UpdatedAt,
			Body:		task.Body,
			UserID:		task.UserID,
		})
	}

	respondWithJSON(w, http.StatusOK, tasks)
}