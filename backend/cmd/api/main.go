package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Cargar variables de entorno
	err := godotenv.Load("../../.env")
	if err != nil {
		log.Println("Warning: No .env file found, using default values")
	}

	// Configurar Gin mode
	if mode := os.Getenv("GIN_MODE"); mode != "" {
		gin.SetMode(mode)
	}

	r := gin.Default()

	// CORS middleware con variable de entorno
	corsOrigin := os.Getenv("CORS_ORIGIN")
	if corsOrigin == "" {
		corsOrigin = "*"
	}

	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", corsOrigin)
		c.Header("Access-Control-Allow-Methods", "GET")
		c.Header("Access-Control-Allow-Headers", "Content-Type")

		c.Next()
	})

	// helper to find the correct data directory among common locations (local dev vs container)
	findDataDir := func(subdir string) string {
		candidates := []string{
			filepath.Join("cmd", subdir),
			filepath.Join("..", "cmd", subdir),
			filepath.Join("..", "..", "cmd", subdir),
		}
		for _, p := range candidates {
			if info, err := os.Stat(p); err == nil && info.IsDir() {
				fmt.Printf("Using data dir: %s\n", p)
				return p
			}
		}
		// fallback to the first candidate
		fallback := filepath.Join("cmd", subdir)
		fmt.Printf("Warning: data dir not found, using fallback: %s\n", fallback)
		return fallback
	}

	// map allowed league names to directories where JSON files are stored
	leagues := map[string]string{
		"laligaes":   findDataDir("scrape_laliga"),
		"premier":    findDataDir("scrape_premier"),
		"seriea":     findDataDir("scrape_seriea"),
		"ligue1":     findDataDir("scrape_ligue1"),
		"bundesliga": findDataDir("scrape_bundesliga"),
	}

	// validate team file segment (allow letters, numbers, dash, underscore, dot and .json suffix)
	validTeam := regexp.MustCompile(`^[A-Za-z0-9._\-]+\.json$`)

	// Endpoint raíz de la API
	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message":     "🏆 API de Fulbo Quiz ⚽",
			"version":     "1.0.0",
			"description": "API para quiz de fútbol con datos de jugadores de las principales ligas europeas",
			"status":      "active",
			"endpoints": gin.H{
				"teams": gin.H{
					"url":         "/api/get/{league}/{team}.json",
					"description": "Obtener jugadores de un equipo específico",
				},
			},
			"leagues": gin.H{
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
		})
	})

	r.GET("/api/get/:league/:team", func(c *gin.Context) {
		league := c.Param("league")
		team := c.Param("team") // includes the .json suffix

		dir, ok := leagues[league]
		if !ok {
			c.JSON(http.StatusNotFound, gin.H{"error": "league not found"})
			return
		}
		if !validTeam.MatchString(team) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid team name"})
			return
		}

		// build safe path and ensure it is inside the intended directory
		filePath := filepath.Join(dir, team)

		// debug logging
		fmt.Printf("League: %s, Team: %s\n", league, team)
		fmt.Printf("Dir: %s, FilePath: %s\n", dir, filePath)

		// check if file exists
		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			fmt.Printf("File not found: %s\n", filePath)
			c.JSON(http.StatusNotFound, gin.H{"error": "team json not found", "path": filePath})
			return
		}

		// prevent path traversal by checking the file doesn't contain ..
		if strings.Contains(team, "..") {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid team name"})
			return
		}

		c.File(filePath)
	})

	// Puerto desde variable de entorno
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	addr := ":" + port
	fmt.Println("API server listening on", addr)
	_ = r.Run(addr)
}
