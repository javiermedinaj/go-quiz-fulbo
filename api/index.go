package handler

import (
	"encoding/json"
	"net/http"
)

func IndexHandler(w http.ResponseWriter, r *http.Request) {
	// CORS headers (solo para GET)
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	// Solo permitir GET
	if r.Method != "GET" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Respuesta de la API principal
	w.Header().Set("Content-Type", "application/json")
	response := map[string]interface{}{
		"message":     "🏆 API de Fulbo Quiz ⚽",
		"version":     "1.0.0",
		"description": "API para quiz de fútbol con datos de jugadores de las principales ligas europeas",
		"status":      "active",
		"endpoints": map[string]interface{}{
			"teams": map[string]string{
				"url":         "/api/get/{league}/{team}.json",
				"description": "Obtener jugadores de un equipo específico",
			},
		},
		"leagues": map[string]string{
			"premier":    "Premier League (Inglaterra)",
			"laligaes":   "La Liga (España)",
			"bundesliga": "Bundesliga (Alemania)",
			"seriea":     "Serie A (Italia)",
			"ligue1":     "Ligue 1 (Francia)",
		},
		"examples": []string{
			"/api/get/premier/manchester-city.json",
			"/api/get/laligaes/real-madrid.json",
			"/api/get/bundesliga/bayern-munich.json",
		},
		"author": "FulboQuiz Team",
	}

	json.NewEncoder(w).Encode(response)
}
