package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"
)

var candidates = []string{
	"https://cdn.playfootball.games/_astro/App.7R6dq-1A.js",
	"https://cdn.playfootball.games/_astro/index.DPqBrKe0.js",
	"https://cdn.playfootball.games/_astro/index.BVKZFYvx.js",
	"https://cdn.playfootball.games/_astro/players.C1MvKJw-.js",
	"https://cdn.playfootball.games/_astro/players.rZMPRLcq.js",
	"https://cdn.playfootball.games/_astro/players.CuVUufx1.js",
	"https://cdn.playfootball.games/_astro/players.B8fSG47f.js",
}

func fetchURL(url string) (string, error) {
	client := &http.Client{Timeout: 20 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return "", fmt.Errorf("status %d", resp.StatusCode)
	}
	var b strings.Builder
	r := bufio.NewReader(resp.Body)
	buf := make([]byte, 4096)
	for {
		n, err := r.Read(buf)
		if n > 0 {
			b.Write(buf[:n])
		}
		if err != nil {
			if err == io.EOF {
				break
			}
			return "", err
		}
	}
	return b.String(), nil
}

// find first JS assignment to an array or object like: const name = [ ... ] or const name = { ... }
func extractFirstLiteral(src string) (string, string) {
	// try patterns for const/var/let NAME = [ or {
	reAssign := regexp.MustCompile(`(?s)(?:const|var|let)\s+([A-Za-z0-9_]+)\s*=\s*([\[{])`)
	m := reAssign.FindStringSubmatchIndex(src)
	if m == nil {
		// fallback: look for export default [ or export default {
		reExp := regexp.MustCompile(`(?s)export\s+default\s*([\[{])`)
		me := reExp.FindStringSubmatchIndex(src)
		if me == nil {
			// fallback: search for first large array literal "[{" as heuristic
			idx := strings.Index(src, "[{")
			if idx == -1 {
				return "", ""
			}
			// try to capture surrounding name by scanning back (heuristic)
			// return the slice starting at idx
			lit := matchBrackets(src, idx, '[', ']')
			if lit == "" {
				return "", ""
			}
			return "anonymous", lit
		}
		startChar := src[me[2]:me[3]]
		pos := me[1]
		lit := matchBrackets(src, pos, startChar[0], mapEnd(startChar[0]))
		if lit == "" {
			return "", ""
		}
		return "export_default", lit
	}
	name := src[m[2]:m[3]]
	startChar := src[m[4]:m[5]]
	pos := m[1]
	lit := matchBrackets(src, pos, startChar[0], mapEnd(startChar[0]))
	if lit == "" {
		return name, ""
	}
	return name, lit
}

func mapEnd(b byte) byte {
	if b == '[' {
		return ']'
	}
	return '}'
}

// matchBrackets assumes pos is index of the opening bracket
func matchBrackets(s string, pos int, open, close byte) string {
	// ensure pos points to open
	if pos < 0 || pos >= len(s) || s[pos] != open {
		// try to find the opening from pos
		op := strings.IndexByte(s[pos:], open)
		if op == -1 {
			return ""
		}
		pos = pos + op
	}
	depth := 0
	for i := pos; i < len(s); i++ {
		c := s[i]
		if c == open {
			depth++
		} else if c == close {
			depth--
			if depth == 0 {
				return s[pos : i+1]
			}
		}
	}
	return ""
}

// quick sanitize: quote object keys and convert single quotes to double
func sanitizeJSLike(js string) string {
	// remove newlines to simplify
	out := js
	// replace single quotes with double quotes
	out = strings.ReplaceAll(out, "'", "\"")
	// quote unquoted keys: look for { key: or , key:
	reKey := regexp.MustCompile(`([\{,\s])(\w+)\s*:`)
	out = reKey.ReplaceAllString(out, `${1}"${2}":`)
	// remove trailing commas before closing brackets/braces
	reTrail := regexp.MustCompile(`,\s*([}\]])`)
	out = reTrail.ReplaceAllString(out, `${1}`)
	return out
}

func tryParse(js string) (interface{}, error) {
	var v interface{}
	dec := json.NewDecoder(strings.NewReader(js))
	dec.UseNumber()
	if err := dec.Decode(&v); err != nil {
		return nil, err
	}
	return v, nil
}

func saveOutput(name, url string, v interface{}) error {
	dir := "backend/tools/parse_games/output"
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}
	file := fmt.Sprintf("%s/%s.json", dir, sanitizeFilename(name))
	f, err := os.Create(file)
	if err != nil {
		return err
	}
	defer f.Close()
	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	if err := enc.Encode(v); err != nil {
		return err
	}
	fmt.Printf("Wrote %s (from %s)\n", file, url)
	return nil
}

func sanitizeFilename(n string) string {
	s := n
	s = strings.ReplaceAll(s, "https://", "")
	s = strings.ReplaceAll(s, "http://", "")
	s = strings.ReplaceAll(s, ":", "_")
	s = strings.ReplaceAll(s, "/", "_")
	s = strings.ReplaceAll(s, "?", "_")
	s = strings.ReplaceAll(s, "&", "_")
	if len(s) > 200 {
		s = s[:200]
	}
	return s
}

func main() {
	fmt.Println("parse_games: scanning candidate bundles for JSON-like game data")
	for _, url := range candidates {
		fmt.Printf("\nFetching: %s\n", url)
		src, err := fetchURL(url)
		if err != nil {
			fmt.Printf("  error fetching: %v\n", err)
			continue
		}
		name, lit := extractFirstLiteral(src)
		if lit == "" {
			fmt.Println("  no obvious literal found")
			// search for keywords
			if strings.Contains(strings.ToLower(src), "game") || strings.Contains(strings.ToLower(src), "quiz") || strings.Contains(strings.ToLower(src), "question") {
				fmt.Println("  file contains game/quiz keywords but no extractable literal; saving snippet")
				snippet := src
				if len(snippet) > 2000 {
					snippet = snippet[:2000]
				}
				fname := sanitizeFilename(url) + "__snippet"
				_ = os.MkdirAll("backend/tools/parse_games/output", 0o755)
				_ = os.WriteFile("backend/tools/parse_games/output/"+fname+".txt", []byte(snippet), 0o644)
				fmt.Printf("  wrote snippet to output/%s.txt\n", fname)
			}
			continue
		}
		fmt.Printf("  found literal assigned to '%s' (len=%d)\n", name, len(lit))
		sanitized := sanitizeJSLike(lit)
		v, err := tryParse(sanitized)
		if err != nil {
			fmt.Printf("  failed to parse as JSON: %v\n", err)
			// try a looser attempt: find array of objects inside
			reArrObj := regexp.MustCompile(`(?s)\[\s*\{.*?\}\s*\]`)
			mo := reArrObj.FindString(sanitized)
			if mo != "" {
				v2, err2 := tryParse(mo)
				if err2 == nil {
					_ = saveOutput(name, url, v2)
					continue
				}
			}
			fmt.Println("  cannot extract valid JSON from literal")
			continue
		}
		if err := saveOutput(name, url, v); err != nil {
			fmt.Printf("  error saving output: %v\n", err)
		}
	}
	fmt.Println("done")
}
