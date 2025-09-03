// Este es el contenido correcto para main.go
package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
)

type Question struct {
	GameData struct {
		Question string   `json:"question"`
		Answers  []string `json:"answers"`
	} `json:"gameData"`
}

type QuestionsCollection struct {
	Questions []Question `json:"questions"`
}

func combineQuestions(dir string) error {
	var allQuestions QuestionsCollection

	files, err := os.ReadDir(dir)
	if err != nil {
		return fmt.Errorf("error al leer el directorio: %v", err)
	}

	for _, file := range files {
		if filepath.Ext(file.Name()) == ".json" {
			content, err := os.ReadFile(filepath.Join(dir, file.Name()))
			if err != nil {
				fmt.Printf("Error al leer el archivo %s: %v\n", file.Name(), err)
				continue
			}

			var question Question
			if err := json.Unmarshal(content, &question); err != nil {
				fmt.Printf("Error al decodificar el JSON de %s: %v\n", file.Name(), err)
				continue
			}

			allQuestions.Questions = append(allQuestions.Questions, question)
		}
	}

	jsonData, err := json.MarshalIndent(allQuestions, "", "  ")
	if err != nil {
		return fmt.Errorf("error al convertir a JSON: %v", err)
	}

	outputFile := filepath.Join(dir, "..", "all_questions.json")
	if err := os.WriteFile(outputFile, jsonData, 0644); err != nil {
		return fmt.Errorf("error al guardar el archivo: %v", err)
	}

	fmt.Printf("Se han combinado todas las preguntas en %s\n", outputFile)
	fmt.Printf("Total de preguntas procesadas: %d\n", len(allQuestions.Questions))
	return nil
}

func downloadQuestions(start, end int, outDir string) error {
	for id := start; id <= end; id++ {
		url := fmt.Sprintf("https://playfootball.games/api/futbol-list-a/%d.json", id)
		fmt.Printf("Fetching %s\n", url)
		resp, err := http.Get(url)
		if err != nil {
			fmt.Fprintf(os.Stderr, "error fetching %d: %v\n", id, err)
			continue
		}
		if resp.StatusCode != 200 {
			fmt.Fprintf(os.Stderr, "skip %d: status %d\n", id, resp.StatusCode)
			resp.Body.Close()
			continue
		}

		body, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			fmt.Fprintf(os.Stderr, "error reading %d: %v\n", id, err)
			continue
		}

		var tmp map[string]interface{}
		if err := json.Unmarshal(body, &tmp); err != nil {
			fmt.Fprintf(os.Stderr, "invalid json %d: %v\n", id, err)
			continue
		}

		outPath := filepath.Join(outDir, fmt.Sprintf("%d.json", id))
		if err := os.WriteFile(outPath, body, 0644); err != nil {
			fmt.Fprintf(os.Stderr, "failed write %s: %v\n", outPath, err)
			continue
		}

		fmt.Printf("Saved %s\n", outPath)
	}
	return nil
}

func main() {
	start := flag.Int("start", 140, "start id")
	end := flag.Int("end", 144, "end id (inclusive)")
	outDir := flag.String("out", "data/remote_q", "output directory (relative to current working dir or absolute)")
	shouldCombine := flag.Bool("combine", false, "combinar todos los archivos JSON en uno solo")
	flag.Parse()

	cwd, err := os.Getwd()
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed get cwd: %v\n", err)
		os.Exit(1)
	}

	var fullOut string
	if filepath.IsAbs(*outDir) {
		fullOut = *outDir
	} else {
		fullOut = filepath.Join(cwd, *outDir)
	}

	if err := os.MkdirAll(fullOut, 0o755); err != nil {
		fmt.Fprintf(os.Stderr, "failed to create out dir: %v\n", err)
		os.Exit(1)
	}

	// Primero descargamos los archivos
	if *start <= *end {
		if err := downloadQuestions(*start, *end, fullOut); err != nil {
			fmt.Fprintf(os.Stderr, "Error descargando preguntas: %v\n", err)
			os.Exit(1)
		}
	}

	// Si se solicitó combinar los archivos
	if *shouldCombine {
		if err := combineQuestions(fullOut); err != nil {
			fmt.Fprintf(os.Stderr, "Error al combinar archivos: %v\n", err)
			os.Exit(1)
		}
	}
}
