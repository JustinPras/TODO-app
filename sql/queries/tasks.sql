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

-- name: DeleteTask :exec
DELETE FROM tasks
WHERE id = $1;
