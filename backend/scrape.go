package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strings"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Fprintln(os.Stderr, "Uso: go run scrape.go <url_del_equipo>")
		os.Exit(2)
	}
	url := os.Args[1]

	html, err := fetchURL(url)
	if err != nil {
		fmt.Fprintln(os.Stderr, "error al descargar la página:", err)
		os.Exit(1)
	}

	raw, err := extractNextData(html)
	if err != nil {
		fmt.Fprintln(os.Stderr, "no se encontró window.__NEXT_DATA__:", err)
		os.Exit(1)
	}

	var next map[string]interface{}
	if err := json.Unmarshal([]byte(raw), &next); err != nil {
		fmt.Fprintln(os.Stderr, "error parseando JSON de NextData:", err)
		os.Exit(1)
	}

	// Intentar obtener el nombre del equipo desde data.team.name
	teamName := extractTeamName(next)
	if teamName == "" {
		// fallback: tomar dominio/slug de la URL
		teamName = fallbackNameFromURL(url)
	}

	players := extractPlayers(next)
	if len(players) == 0 {
		fmt.Fprintln(os.Stderr, "no se encontraron jugadores en los datos extraídos")
		os.Exit(1)
	}

	safe := sanitizeFileName(teamName)
	fileName := fmt.Sprintf("%s.json", safe)

	b, err := json.MarshalIndent(players, "", "  ")
	if err != nil {
		fmt.Fprintln(os.Stderr, "error serializando JSON:", err)
		os.Exit(1)
	}

	if err := os.WriteFile(fileName, b, 0o644); err != nil {
		fmt.Fprintln(os.Stderr, "error escribiendo archivo:", err)
		os.Exit(1)
	}

	fmt.Println("Guardado:", fileName)
}

func fetchURL(url string) (string, error) {
	client := &http.Client{}
	req, _ := http.NewRequest("GET", url, nil)
	// set a common user agent to avoid blocks
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; scraper/1.0)")
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("http status %d", resp.StatusCode)
	}
	b, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	return string(b), nil
}

func extractNextData(html string) (string, error) {
	// Primero intentar el script con id="__NEXT_DATA__" que contiene JSON puro
	reId := regexp.MustCompile(`(?s)<script[^>]*id=["']__NEXT_DATA__["'][^>]*>(.*?)</script>`)
	m := reId.FindStringSubmatch(html)
	if len(m) >= 2 {
		raw := strings.TrimSpace(m[1])
		if raw != "" {
			return raw, nil
		}
	}

	// Fallback: pattern window.__NEXT_DATA__ = { ... }</script>
	re := regexp.MustCompile(`(?s)window\.__NEXT_DATA__\s*=\s*(\{.*?\})\s*</script>`)
	m = re.FindStringSubmatch(html)
	if len(m) < 2 {
		return "", errors.New("no match")
	}
	return m[1], nil
}

func extractTeamName(next map[string]interface{}) string {
	// path: props.pageProps.data.team.name
	if props, ok := next["props"].(map[string]interface{}); ok {
		if pageProps, ok := props["pageProps"].(map[string]interface{}); ok {
			if data, ok := pageProps["data"].(map[string]interface{}); ok {
				if team, ok := data["team"].(map[string]interface{}); ok {
					if name, ok := team["name"].(string); ok {
						return name
					}
				}
				// sometimes the site stores team under 'team_name' or similar
				if tn, ok := data["team_name"].(string); ok {
					return tn
				}
			}
		}
	}
	return ""
}

func extractPlayers(next map[string]interface{}) []map[string]interface{} {
	out := []map[string]interface{}{}
	// path: props.pageProps.data.squad.groups[].rows[].entity.object
	props, ok := next["props"].(map[string]interface{})
	if !ok {
		return out
	}
	pageProps, ok := props["pageProps"].(map[string]interface{})
	if !ok {
		return out
	}
	data, ok := pageProps["data"].(map[string]interface{})
	if !ok {
		return out
	}
	squad, ok := data["squad"].(map[string]interface{})
	if !ok {
		return out
	}
	groups, ok := squad["groups"].([]interface{})
	if !ok {
		return out
	}
	for _, gg := range groups {
		g, ok := gg.(map[string]interface{})
		if !ok {
			continue
		}
		groupName, _ := g["name"].(string)
		rows, _ := g["rows"].([]interface{})
		for _, rr := range rows {
			row, ok := rr.(map[string]interface{})
			if !ok {
				continue
			}
			ent, _ := row["entity"].(map[string]interface{})
			if ent == nil {
				continue
			}
			obj, _ := ent["object"].(map[string]interface{})
			if obj == nil {
				continue
			}
			// attach group name for context
			objCopy := map[string]interface{}{}
			for k, v := range obj {
				objCopy[k] = v
			}
			objCopy["group"] = groupName
			out = append(out, objCopy)
		}
	}
	return out
}

func fallbackNameFromURL(url string) string {
	// tomar la parte final del path, pero evitar slugs comunes como "igi" que no son nombres de equipo
	parts := strings.Split(url, "/")
	// set de segmentos a ignorar
	skip := map[string]bool{"": true, "igi": true, "team": true, "teams": true, "plantel": true}

	// buscar desde el final el primer segmento que no esté en skip
	for i := len(parts) - 1; i >= 0; i-- {
		p := strings.ToLower(parts[i])
		if p == "" {
			continue
		}
		if !skip[p] {
			return p
		}
	}

	// fallback: devolver la última parte no vacía
	for i := len(parts) - 1; i >= 0; i-- {
		if parts[i] != "" {
			return parts[i]
		}
	}
	return "plantilla"
}

func sanitizeFileName(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = strings.ReplaceAll(s, " ", "_")
	// keep alnum, underscore, dash
	re := regexp.MustCompile(`[^a-z0-9_\-]+`)
	s = re.ReplaceAllString(s, "")
	if s == "" {
		return "plantilla"
	}
	return s
}
