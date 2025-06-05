-- name: CreateTask :one
INSERT INTO tasks(id, created_at, updated_at, body, user_id)
VALUES (
    gen_random_uuid(),
    NOW(),
    NOW(),
    $1,
    $2
)
RETURNING *;

-- name: GetTasksByUserID :many
SELECT * FROM tasks
WHERE user_id = $1
ORDER BY created_at ASC;

-- name: GetTaskByID :one
SELECT * FROM tasks
WHERE id = $1;

-- name: UpdateTaskBody :one
UPDATE tasks
SET body = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: UpdateTaskCompletedStatus :one
UPDATE tasks
SET completed = $2,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteTask :exec
DELETE FROM tasks
WHERE id = $1;
