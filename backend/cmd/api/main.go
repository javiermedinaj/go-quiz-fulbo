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
		c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	// map allowed league names to directories where JSON files are stored
	leagues := map[string]string{
		"laligaes":   filepath.Join("..", "..", "cmd", "scrape_laliga"),
		"premier":    filepath.Join("..", "..", "cmd", "scrape_premier"),
		"seriea":     filepath.Join("..", "..", "cmd", "scrape_seriea"),
		"ligue1":     filepath.Join("..", "..", "cmd", "scrape_ligue1"),
		"bundesliga": filepath.Join("..", "..", "cmd", "scrape_bundesliga"),
	}

	// validate team file segment (allow letters, numbers, dash, underscore, dot and .json suffix)
	validTeam := regexp.MustCompile(`^[A-Za-z0-9._\-]+\.json$`)

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
