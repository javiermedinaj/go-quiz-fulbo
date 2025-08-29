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

	"futbol912.com/seriea"
	"github.com/PuerkitoBio/goquery"
)

func sanitizeFilename(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	s = strings.ReplaceAll(s, " ", "-")
	s = strings.ReplaceAll(s, "/", "-")
	re := regexp.MustCompile(`[^a-z0-9\-]`)
	s = re.ReplaceAllString(s, "")
	if s == "" {
		s = "team"
	}
	return s
}

func canonicalFilename(raw string) string {
	s := strings.ToLower(strings.TrimSpace(raw))
	s = strings.ReplaceAll(s, ",", "")
	s = strings.ReplaceAll(s, "(", "")
	s = strings.ReplaceAll(s, ")", "")
	parts := strings.Fields(s)
	if len(parts) == 0 {
		return sanitizeFilename(raw)
	}
	prefixDrop := map[string]bool{"fc": true, "ud": true, "rc": true, "rcd": true, "deportivo": true}
	for len(parts) > 0 {
		p := strings.Trim(parts[0], "- .")
		if prefixDrop[p] {
			parts = parts[1:]
		} else {
			break
		}
	}
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
	compURL := "https://www.transfermarkt.es/serie-a/startseite/wettbewerb/IT1"
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

	links := map[string]string{}
	re := regexp.MustCompile(`(?i)(?:/([a-z0-9\-]+?)/)?startseite/verein/(\d+)`)
	doc.Find("a").Each(func(i int, s *goquery.Selection) {
		href, ok := s.Attr("href")
		if !ok {
			return
		}
		if !strings.Contains(strings.ToLower(href), "startseite/verein/") {
			return
		}
		hrefClean := strings.TrimLeft(href, "/")
		if !strings.HasPrefix(hrefClean, "http") {
			hrefClean = "https://www.transfermarkt.es/" + strings.TrimLeft(hrefClean, "/")
		}
		if m := re.FindStringSubmatch(href); len(m) > 2 {
			slug := m[1]
			var file string
			if slug == "" {
				file = canonicalFilename(s.Text())
			} else {
				file = sanitizeFilename(slug)
			}
			squad := strings.Replace(hrefClean, "/startseite/", "/kader/", 1) + "/saison_id/2025"
			links[file] = squad
			return
		}
		name := strings.TrimSpace(s.Text())
		if name == "" {
			return
		}
		file := canonicalFilename(name)
		squad := strings.Replace(hrefClean, "/startseite/", "/kader/", 1) + "/saison_id/2025"
		links[file] = squad
	})

	files := make([]string, 0, len(links))
	for f := range links {
		files = append(files, f)
	}
	sort.Strings(files)
	fmt.Printf("Found %d team(s): %v\n", len(files), files)

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
		players, err := seriea.ScrapeClubRoster(url)
		if err != nil {
			log.Printf("failed %s: %v", file, err)
			continue
		}
		out := file + ".json"
		if err := seriea.SaveTeamJSON(file, players, out); err != nil {
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
