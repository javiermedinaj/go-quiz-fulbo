package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strings"
)

func main() {
	url := flag.String("url", "https://cdn.playfootball.games/_astro/players.C1MvKJw-.js", "players bundle url")
	flag.Parse()

	if !strings.HasPrefix(*url, "https://cdn.playfootball.games/_astro/players.") {
		fmt.Fprintln(os.Stderr, "only cdn.playfootball.games players bundles are allowed")
		os.Exit(2)
	}

	resp, err := http.Get(*url)
	if err != nil {
		fmt.Fprintln(os.Stderr, "fetch error:", err)
		os.Exit(1)
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		fmt.Fprintln(os.Stderr, "remote status:", resp.Status)
		os.Exit(1)
	}

	b, err := io.ReadAll(resp.Body)
	if err != nil {
		fmt.Fprintln(os.Stderr, "read error:", err)
		os.Exit(1)
	}
	src := string(b)

	arrRe := regexp.MustCompile(`const\s+n\s*=\s*(\[[\s\S]*?\])`)
	m := arrRe.FindStringSubmatch(src)
	if len(m) < 2 {
		arrRe2 := regexp.MustCompile(`(?:var|let)\s+n\s*=\s*(\[[\s\S]*?\])`)
		m = arrRe2.FindStringSubmatch(src)
	}
	if len(m) < 2 {
		fmt.Fprintln(os.Stderr, "could not locate players array in bundle")
		os.Exit(1)
	}
	arrText := m[1]

	keyRe := regexp.MustCompile(`([A-Za-z_][A-Za-z0-9_]*)\s*:`)
	jsonLike := keyRe.ReplaceAllString(arrText, `"$1":`)

	var data []map[string]interface{}
	if err := json.Unmarshal([]byte(jsonLike), &data); err != nil {
		fmt.Fprintln(os.Stderr, "json unmarshal error:", err)
		os.Exit(1)
	}

	enc := json.NewEncoder(os.Stdout)
	enc.SetIndent("", "  ")
	if err := enc.Encode(data); err != nil {
		fmt.Fprintln(os.Stderr, "encode error:", err)
		os.Exit(1)
	}
}
