package questions

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"path/filepath"
)

type GameData struct {
	Question string   `json:"question"`
	Answers  []string `json:"answers"`
}

type QuestionData struct {
	GameData GameData `json:"gameData"`
}

type AllQuestions struct {
	Questions []QuestionData `json:"questions"`
}

func CombineQuestions(dir string) error {
	var allQuestions AllQuestions

	files, err := ioutil.ReadDir(dir)
	if err != nil {
		return fmt.Errorf("error al leer el directorio: %v", err)
	}

	for _, file := range files {
		if filepath.Ext(file.Name()) == ".json" {
			content, err := ioutil.ReadFile(filepath.Join(dir, file.Name()))
			if err != nil {
				fmt.Printf("Error al leer el archivo %s: %v\n", file.Name(), err)
				continue
			}

			var questionData QuestionData
			if err := json.Unmarshal(content, &questionData); err != nil {
				fmt.Printf("Error al decodificar el JSON de %s: %v\n", file.Name(), err)
				continue
			}

			allQuestions.Questions = append(allQuestions.Questions, questionData)
		}
	}

	jsonData, err := json.MarshalIndent(allQuestions, "", "  ")
	if err != nil {
		return fmt.Errorf("error al convertir a JSON: %v", err)
	}

	outputFile := filepath.Join(dir, "..", "all_questions.json")
	if err := ioutil.WriteFile(outputFile, jsonData, 0644); err != nil {
		return fmt.Errorf("error al guardar el archivo: %v", err)
	}

	fmt.Printf("Se han combinado todas las preguntas en %s\n", outputFile)
	fmt.Printf("Total de preguntas procesadas: %d\n", len(allQuestions.Questions))

	return nil
}
