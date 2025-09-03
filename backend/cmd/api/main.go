package main

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

type QuizQuestion struct {
	GameData struct {
		Question string   `json:"question"`
		Answers  []string `json:"answers"`
	} `json:"gameData"`
}

type QuizQuestionsResponse struct {
	Questions []QuizQuestion `json:"questions"`
}

type QuizGameRequest struct {
	Count int `json:"count"` // Número de preguntas que quiere el cliente
}

func main() {
	err := godotenv.Load("../../.env")
	if err != nil {
		log.Println("Warning: No .env file found, using default values")
	}

	if mode := os.Getenv("GIN_MODE"); mode != "" {
		gin.SetMode(mode)
	}

	r := gin.Default()

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
		fallback := filepath.Join("cmd", subdir)
		fmt.Printf("Warning: data dir not found, using fallback: %s\n", fallback)
		return fallback
	}
	leagues := map[string]string{
		"laligaes":   findDataDir("scrape_laliga"),
		"premier":    findDataDir("scrape_premier"),
		"seriea":     findDataDir("scrape_seriea"),
		"ligue1":     findDataDir("scrape_ligue1"),
		"bundesliga": findDataDir("scrape_bundesliga"),
	}

	validTeam := regexp.MustCompile(`^[A-Za-z0-9._\-]+\.json$`)

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
				"quiz": gin.H{
					"url":         "/api/quiz/questions",
					"description": "Obtener preguntas para el quiz",
					"params":      "?count=10 (opcional, por defecto todas)",
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

	r.GET("/api/list/:league", func(c *gin.Context) {
		league := c.Param("league")
		dir, ok := leagues[league]
		if !ok {
			c.JSON(http.StatusNotFound, gin.H{"error": "league not found"})
			return
		}

		entries, err := os.ReadDir(dir)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to read data directory", "detail": err.Error()})
			return
		}

		type TeamInfo struct {
			File string `json:"file"`
			Team string `json:"team"`
		}

		var teams []TeamInfo
		for _, e := range entries {
			if e.IsDir() {
				continue
			}
			name := e.Name()
			if !strings.HasSuffix(strings.ToLower(name), ".json") {
				continue
			}

			teamName := strings.TrimSuffix(name, ".json")
			path := filepath.Join(dir, name)
			if b, err := os.ReadFile(path); err == nil {
				var tmp map[string]interface{}
				if err := json.Unmarshal(b, &tmp); err == nil {
					if t, ok := tmp["team"].(string); ok && strings.TrimSpace(t) != "" {
						teamName = t
					}
				}
			}

			teams = append(teams, TeamInfo{File: name, Team: teamName})
		}

		sort.Slice(teams, func(i, j int) bool { return teams[i].Team < teams[j].Team })

		c.JSON(http.StatusOK, gin.H{"league": league, "teams": teams})
	})

	r.GET("/api/get/:league/:team", func(c *gin.Context) {
		league := c.Param("league")
		team := c.Param("team")

		dir, ok := leagues[league]
		if !ok {
			c.JSON(http.StatusNotFound, gin.H{"error": "league not found"})
			return
		}
		if !validTeam.MatchString(team) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid team name"})
			return
		}

		filePath := filepath.Join(dir, team)

		fmt.Printf("League: %s, Team: %s\n", league, team)
		fmt.Printf("Dir: %s, FilePath: %s\n", dir, filePath)

		if _, err := os.Stat(filePath); os.IsNotExist(err) {
			fmt.Printf("File not found: %s\n", filePath)
			c.JSON(http.StatusNotFound, gin.H{"error": "team json not found", "path": filePath})
			return
		}

		if strings.Contains(team, "..") {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid team name"})
			return
		}

		c.File(filePath)
	})

	// Endpoint para obtener preguntas del quiz
	r.GET("/api/quiz/questions", func(c *gin.Context) {
		// Buscar el archivo all_questions.json
		questionsFile := ""
		candidates := []string{
			filepath.Join("cmd", "scrape_questions", "data", "all_questions.json"),
			filepath.Join("..", "cmd", "scrape_questions", "data", "all_questions.json"),
			filepath.Join("..", "..", "cmd", "scrape_questions", "data", "all_questions.json"),
		}

		for _, candidate := range candidates {
			if _, err := os.Stat(candidate); err == nil {
				questionsFile = candidate
				break
			}
		}

		if questionsFile == "" {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "questions file not found",
				"message": "El archivo all_questions.json no se encontró",
			})
			return
		}

		// Leer el archivo
		data, err := os.ReadFile(questionsFile)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "could not read questions file",
				"message": err.Error(),
			})
			return
		}

		var questionsData QuizQuestionsResponse
		if err := json.Unmarshal(data, &questionsData); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":   "could not parse questions file",
				"message": err.Error(),
			})
			return
		}

		// Obtener el parámetro count si existe
		countParam := c.Query("count")

		questions := questionsData.Questions

		// Si se especifica un count, mezclar y tomar solo esa cantidad
		if countParam != "" {
			if count, err := strconv.Atoi(countParam); err == nil && count > 0 {
				// Mezclar las preguntas
				rand.Seed(time.Now().UnixNano())
				rand.Shuffle(len(questions), func(i, j int) {
					questions[i], questions[j] = questions[j], questions[i]
				})

				// Tomar solo la cantidad solicitada
				if count < len(questions) {
					questions = questions[:count]
				}
			}
		}

		c.JSON(http.StatusOK, gin.H{
			"total":     len(questionsData.Questions),
			"returned":  len(questions),
			"questions": questions,
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	addr := ":" + port
	fmt.Println("API server listening on", addr)
	_ = r.Run(addr)
}
