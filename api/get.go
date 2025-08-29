package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// leagues map para Vercel (rutas absolutas desde la raíz del proyecto)
var leagues = map[string]string{
	"laligaes":   "backend/cmd/scrape_laliga",
	"premier":    "backend/cmd/scrape_premier",
	"seriea":     "backend/cmd/scrape_seriea",
	"ligue1":     "backend/cmd/scrape_ligue1",
	"bundesliga": "backend/cmd/scrape_bundesliga",
}

func Handler(w http.ResponseWriter, r *http.Request) {
	// CORS headers (solo para GET)
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// Solo permitir GET
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse URL path
	pathParts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")

	// Si es la raíz de la API, mostrar info
	if len(pathParts) == 1 && pathParts[0] == "api" {
		w.Header().Set("Content-Type", "application/json")
		response := map[string]interface{}{
			"message":     "API de Fulbo Quiz ⚽",
			"version":     "1.0.0",
			"description": "API para quiz de fútbol con datos de jugadores de las principales ligas europeas",
			"endpoints": map[string]string{
				"teams": "/api/get/{league}/{team}.json",
			},
			"leagues": []string{"premier", "laligaes", "bundesliga", "seriea", "ligue1"},
			"example": "/api/get/premier/manchester-city.json",
		}
		json.NewEncoder(w).Encode(response)
		return
	}

	// Esperamos: ["api", "get", "league", "team.json"]
	if len(pathParts) < 4 || pathParts[0] != "api" || pathParts[1] != "get" {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{
			"error":   "Invalid path format. Expected: /api/get/league/team.json",
			"example": "/api/get/premier/manchester-city.json",
		})
		return
	}

	league := pathParts[2]
	team := pathParts[3]

	// Validate league
	dir, ok := leagues[league]
	if !ok {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{"error": "league not found"})
		return
	}

	// Validate team file format
	validTeam := regexp.MustCompile(`^[A-Za-z0-9._\-]+\.json$`)
	if !validTeam.MatchString(team) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid team name"})
		return
	}

	// Prevent path traversal
	if strings.Contains(team, "..") {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(map[string]string{"error": "invalid team name"})
		return
	}

	// Build file path
	filePath := filepath.Join(dir, team)

	// Debug logging
	fmt.Printf("League: %s, Team: %s\n", league, team)
	fmt.Printf("Dir: %s, FilePath: %s\n", dir, filePath)

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		fmt.Printf("File not found: %s\n", filePath)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"error": "team json not found",
			"path":  filePath,
		})
		return
	}

	// Read and serve file
	data, err := os.ReadFile(filePath)
	if err != nil {
		fmt.Printf("Error reading file: %v\n", err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusInternalServerError)
		json.NewEncoder(w).Encode(map[string]string{"error": "failed to read file"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}
