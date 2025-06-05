package main

import (
	"encoding/json"
	"net/http"

	"github.com/JustinPras/TODO-app/internal/database"
	"github.com/JustinPras/TODO-app/internal/auth"

	"github.com/google/uuid"
)

func (cfg *apiConfig) handlerTasksUpdate(w http.ResponseWriter, r *http.Request) {
	type parameters struct {
		Body 		*string 		`json:"body"`
		Completed	*bool		`json:"completed"`
	}

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

	task, err := cfg.db.GetTaskByID(r.Context(), taskID)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Couldn't find task with that ID", err)
		return
	}

	if task.UserID != userID {
		respondWithError(w, http.StatusUnauthorized, "You are not authorised to update that task", err)
		return
	}

	decoder := json.NewDecoder(r.Body)
	params := parameters{}
	err = decoder.Decode(&params)
	if err != nil {
		respondWithError(w, http.StatusInternalServerError, "Couldn't decode parameters", err)
		return
	}
	

	if params.Body != nil {
		task, err = cfg.db.UpdateTaskBody(r.Context(), database.UpdateTaskBodyParams{
			ID:		taskID,
			Body:	*params.Body,
		})
		if err != nil {
			respondWithError(w, http.StatusInternalServerError, "Couldn't update task", err)
			return
		}
	} else if params.Completed != nil {
		task, err = cfg.db.UpdateTaskCompletedStatus(r.Context(), database.UpdateTaskCompletedStatusParams{
			ID:			taskID,
			Completed:	*params.Completed,
		})
		if err != nil {
			respondWithError(w, http.StatusInternalServerError, "Couldn't update task status", err)
			return
		}
	}

	respondWithJSON(w, http.StatusOK, Task{
		ID:			task.ID,
		CreatedAt: 	task.CreatedAt,
		UpdatedAt: 	task.UpdatedAt,
		Body: 		task.Body,
		UserID:		task.UserID,
		Completed:	task.Completed,
	})

}