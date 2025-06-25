package main

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/JustinPras/TODO-app/internal/auth"
)

func (cfg *apiConfig) handlerTasksRetrieve(w http.ResponseWriter, r *http.Request) {
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
			Completed:	task.Completed,
		})
	}

	respondWithJSON(w, http.StatusOK, tasks)
}

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
	
	taskIDString := r.PathValue("taskID")
	taskID, err := uuid.Parse(taskIDString)
	if err != nil {
		respondWithError(w, http.StatusBadRequest, "Invalid Task ID", err)
		return
	}

	dbTask, err := cfg.db.GetTaskByID(r.Context(), taskID)
	if err != nil {
		respondWithError(w, http.StatusNotFound, "Task ID does not exist", err)
		return
	}

	if dbTask.UserID != userID {
		respondWithError(w, http.StatusUnauthorized, "You are not authorised to view that task", err)
		return
	}

	respondWithJSON(w, http.StatusOK, Task{
		ID:			dbTask.ID,
		CreatedAt:	dbTask.CreatedAt,
		UpdatedAt:	dbTask.UpdatedAt,
		Body:		dbTask.Body,
		UserID:		dbTask.UserID,
		Completed:	dbTask.Completed,
	})
}