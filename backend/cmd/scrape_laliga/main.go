package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"regexp"
	"sort"
	"strings"
	"time"

	"futbol912.com/laligaes"
	"github.com/PuerkitoBio/goquery"
)

// sanitizeFilename converts a club name or slug into a safe filename like "fc-barcelona"
func sanitizeFilename(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	// replace spaces and slashes
	s = strings.ReplaceAll(s, " ", "-")
	s = strings.ReplaceAll(s, "/", "-")
	// remove any chars except letters, numbers, dash
	re := regexp.MustCompile(`[^a-z0-9\-]`)
	s = re.ReplaceAllString(s, "")
	if s == "" {
		s = "team"
	}
	return s
}

// canonicalFilename attempts to normalize human club names into compact filenames.
// Examples:
//
//	"FC Barcelona" -> "barcelona"
//	"Real Madrid CF" -> "real-madrid"
//	"RC Celta de Vigo" -> "celta-de-vigo"
func canonicalFilename(raw string) string {
	s := strings.ToLower(strings.TrimSpace(raw))
	// remove commas, parentheses
	s = strings.ReplaceAll(s, ",", "")
	s = strings.ReplaceAll(s, "(", "")
	s = strings.ReplaceAll(s, ")", "")
	// tokenize
	parts := strings.Fields(s)
	if len(parts) == 0 {
		return sanitizeFilename(raw)
	}
	// drop common prefix tokens (e.g., "fc", "ud", "rc", "rcd")
	prefixDrop := map[string]bool{"fc": true, "ud": true, "rc": true, "rcd": true, "deportivo": true}
	for len(parts) > 0 {
		p := strings.Trim(parts[0], "- .")
		if prefixDrop[p] {
			parts = parts[1:]
		} else {
			break
		}
	}
	// drop trailing club-type tokens (e.g., "cf", "fc")
	suffixDrop := map[string]bool{"cf": true, "fc": true}
	for len(parts) > 0 {
		p := strings.Trim(parts[len(parts)-1], "- .")
		if suffixDrop[p] {
			parts = parts[:len(parts)-1]
		} else {
			break
		}
	}
	if len(parts) == 0 {
		return sanitizeFilename(raw)
	}
	cand := strings.Join(parts, "-")
	return sanitizeFilename(cand)
}

func main() {
	compURL := "https://www.transfermarkt.es/laliga/startseite/wettbewerb/ES1"
	fmt.Println("Fetching competition page:", compURL)
	resp, err := http.Get(compURL)
	if err != nil {
		log.Fatalf("failed to fetch competition page: %v", err)
	}
	defer resp.Body.Close()
	doc, err := goquery.NewDocumentFromReader(resp.Body)
	if err != nil {
		log.Fatalf("parse error: %v", err)
	}

	// find team links; prefer hrefs that contain '/startseite/verein/{id}' and capture the slug
	links := map[string]string{} // filename -> squadURL
	re := regexp.MustCompile(`(?i)(?:/([a-z0-9\-]+?)/)?startseite/verein/(\d+)`)

	doc.Find("a").Each(func(i int, s *goquery.Selection) {
		href, ok := s.Attr("href")
		if !ok {
			return
		}
		if !strings.Contains(strings.ToLower(href), "startseite/verein/") {
			return
		}
		// normalize to relative path (remove leading /)
		hrefClean := strings.TrimLeft(href, "/")
		if !strings.HasPrefix(hrefClean, "http") {
			hrefClean = "https://www.transfermarkt.es/" + strings.TrimLeft(hrefClean, "/")
		}
		// try regex capture for slug
		if m := re.FindStringSubmatch(href); len(m) > 2 {
			slug := m[1]
			var file string
			if slug == "" {
				// fallback to using the link text and canonicalize
				file = canonicalFilename(s.Text())
			} else {
				file = sanitizeFilename(slug)
			}
			squad := strings.Replace(hrefClean, "/startseite/", "/kader/", 1) + "/saison_id/2025"
			links[file] = squad
			return
		}
		// fallback: if href contains startseite/verein but regex didn't match, use link text
		name := strings.TrimSpace(s.Text())
		if name == "" {
			return
		}
		file := canonicalFilename(name)
		squad := strings.Replace(hrefClean, "/startseite/", "/kader/", 1) + "/saison_id/2025"
		links[file] = squad
	})

	// produce a stable list and show what we found
	files := make([]string, 0, len(links))
	for f := range links {
		files = append(files, f)
	}
	sort.Strings(files)
	fmt.Printf("Found %d team(s): %v\n", len(files), files)

	// control behavior: by default only validate and scrape the first team to confirm filenames.
	// Set env SCRAPE_ALL=1 to run the full crawl (will wait 40s between teams).
	scrapeAll := false
	if v := os.Getenv("SCRAPE_ALL"); v == "1" {
		scrapeAll = true
	}

	toProcess := files
	if !scrapeAll && len(files) > 1 {
		toProcess = files[:1]
		fmt.Println("SCRAPE_ALL not set — will only scrape the first team to validate filenames. Set SCRAPE_ALL=1 to scrape all teams.")
	}

	for _, file := range toProcess {
		url := links[file]
		fmt.Println("Scraping:", file, url)
		players, err := laligaes.ScrapeClubRoster(url)
		if err != nil {
			log.Printf("failed %s: %v", file, err)
			continue
		}
		out := file + ".json"
		if err := laligaes.SaveTeamJSON(file, players, out); err != nil {
			log.Printf("save failed %s: %v", out, err)
		} else {
			fmt.Println("Saved", out, "players:", len(players))
		}
		if scrapeAll {
			fmt.Println("waiting 40s before next team...")
			time.Sleep(40 * time.Second)
		}
	}
}
