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

func main() {
	start := flag.Int("start", 720, "start id")
	end := flag.Int("end", 730, "end id (inclusive)")
	outDir := flag.String("out", "data/remote_bingo", "output directory (relative to current working dir or absolute)")
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

	for id := *start; id <= *end; id++ {
		url := fmt.Sprintf("https://playfootball.games/api/football-bingo/%d.json", id)
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

		outPath := filepath.Join(fullOut, fmt.Sprintf("%d.json", id))
		if err := os.WriteFile(outPath, body, 0o644); err != nil {
			fmt.Fprintf(os.Stderr, "failed write %s: %v\n", outPath, err)
			continue
		}

		fmt.Printf("Saved %s\n", outPath)
	}
}
