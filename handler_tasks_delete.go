package main

import (
	"net/http"

	"github.com/JustinPras/TODO-app/internal/auth"
	"github.com/google/uuid"
)

func (cfg *apiConfig) handlerTasksDelete(w http.ResponseWriter, r *http.Request) {

	taskIDString := r.PathValue("taskID")
	taskID, err := uuid.Parse(taskIDString)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid Task ID", err)
		return
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

	dbTask, err := cfg.db.GetTaskByID(r.Context(), taskID)
	if err != nil {
		respondWithError(w, http.StatusNotFound, "Task was not found", err)
		return
	}

	if dbTask.UserID != userID {
		respondWithError(w, http.StatusForbidden, "You are not the creator of this task", err)
		return
	}

	err = cfg.db.DeleteTask(r.Context(), taskID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Couldn't delete task", err)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}