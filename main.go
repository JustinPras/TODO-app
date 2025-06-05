package main

import(
	"log"
	"net/http"
	"os"
	"database/sql"

	"github.com/joho/godotenv"

	"github.com/JustinPras/TODO-app/internal/database"
	_ "github.com/lib/pq"
)

type apiConfig struct {
	db               *database.Queries
	platform         string
	jwtSecret        string
	filepathRoot     string
	port             string
}

func main() {
	godotenv.Load()

	dbURL := os.Getenv("DB_URL")
	if dbURL == "" {
		log.Fatal("DB_URL must be set")
	}
	platform := os.Getenv("PLATFORM")
	if platform == "" {
		log.Fatal("PLATFORM environment variable is not set")
	}
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET environment variable is not set")
	}
	filepathRoot := os.Getenv("FILEPATH_ROOT")
	if filepathRoot == "" {
		log.Fatal("FILEPATH_ROOT environment variable is not set")
	}
	port := os.Getenv("PORT")
	if port == "" {
		log.Fatal("PORT environment variable is not set")
	}

	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("Error connecting to database: %w", err)
	}
	dbQueries := database.New(db)

	apiCfg := apiConfig{
		db: 			dbQueries,
		platform: 		platform,
		jwtSecret:		jwtSecret,
		filepathRoot:	filepathRoot,
		port:			port,
	}

	mux := http.NewServeMux()

	mux.Handle("/", http.FileServer(http.Dir(filepathRoot)))

	mux.HandleFunc("POST /admin/reset", apiCfg.handlerReset)

	mux.HandleFunc("POST /api/users", apiCfg.handlerUsersCreate)
	mux.HandleFunc("POST /api/login", apiCfg.handlerLogin)

	mux.HandleFunc("GET /api/tasks", apiCfg.handlerTasksRetrieve)
	mux.HandleFunc("GET /api/tasks/{taskID}", apiCfg.handlerTasksGet)
	mux.HandleFunc("POST /api/tasks", apiCfg.handlerTasksCreate)
	mux.HandleFunc("DELETE /api/tasks/{taskID}", apiCfg.handlerTasksDelete)
	mux.HandleFunc("PATCH /api/tasks/{taskID}", apiCfg.handlerTasksUpdate)

	srv := &http.Server{
		Addr:    ":" + port,
		Handler: mux,
	}

	log.Printf("Serving on: http://localhost:%s/\n", port)
	log.Fatal(srv.ListenAndServe())
}