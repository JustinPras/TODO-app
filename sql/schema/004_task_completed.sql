-- +goose Up
ALTER TABLE tasks
ADD completed BOOLEAN NOT NULL
DEFAULT false;

-- +goose Down
ALTER TABLE tasks
DROP completed;