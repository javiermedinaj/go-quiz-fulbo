package main

import (
	"fmt"
	"math/rand"
	"os"
	"regexp"
	"strings"
	"time"

	"futbol912.com/bundesliga"
	"github.com/PuerkitoBio/goquery"
)

func sanitizeFilename(s string) string {
	s = strings.ToLower(s)
	s = strings.ReplaceAll(s, "\u00e1", "a")
	s = strings.ReplaceAll(s, "\u00e9", "e")
	s = strings.ReplaceAll(s, "\u00f6", "o")
	s = strings.ReplaceAll(s, " ", "-")
	s = regexp.MustCompile(`[^a-z0-9\-]`).ReplaceAllString(s, "")
	s = strings.ReplaceAll(s, "--", "-")
	return strings.Trim(s, "-")
}

func canonicalFilename(raw string) string {
	s := strings.ToLower(raw)
	s = strings.ReplaceAll(s, "fc-", "")
	s = strings.ReplaceAll(s, "f.c.-", "")
	s = strings.ReplaceAll(s, "sv-", "")
	s = strings.ReplaceAll(s, "bvb-", "borussia-")
	return sanitizeFilename(s)
}

func fetchDoc(url string) (*goquery.Document, error) {
	// simple fetch using goquery's NewDocument
	d, err := goquery.NewDocument(url)
	if err != nil {
		return nil, err
	}
	return d, nil
}

func main() {
	rand.Seed(time.Now().UnixNano())
	compURL := "https://www.transfermarkt.es/bundesliga/startseite/wettbewerb/L1"
	fmt.Println("Discovering Bundesliga teams from:", compURL)
	doc, err := fetchDoc(compURL)
	if err != nil {
		fmt.Println("failed to fetch competition page:", err)
		return
	}

	linkRe := regexp.MustCompile(`/startseite/verein/(\d+)(?:/[\w\-]+)?`)
	teams := map[string]string{}

	doc.Find("a").Each(func(i int, s *goquery.Selection) {
		if href, ok := s.Attr("href"); ok {
			if linkRe.MatchString(href) {
				name := strings.TrimSpace(s.Text())
				if name == "" {
					// try title
					if t, ok := s.Attr("title"); ok {
						name = strings.TrimSpace(t)
					}
				}
				if name == "" {
					name = href
				}
				filename := canonicalFilename(name)
				if filename == "" {
					filename = sanitizeFilename(href)
				}
				teams[filename] = "https://www.transfermarkt.es" + href
			}
		}
	})

	if len(teams) == 0 {
		fmt.Println("no teams discovered")
		return
	}

	fmt.Printf("Found %d team(s)\n", len(teams))

	scrapeAll := os.Getenv("SCRAPE_ALL") == "1"
	first := true
	for file, url := range teams {
		if !scrapeAll && !first {
			fmt.Println("SCRAPE_ALL not set — stopping after first team for safety")
			break
		}
		first = false
		fmt.Printf("Scraping %s -> %s\n", file, url)
		players, err := bundesliga.ScrapeClubRoster(url)
		if err != nil {
			fmt.Println("error scraping team:", err)
			continue
		}
		outPath := file + ".json"
		if err := bundesliga.SaveTeamJSON(file, players, outPath); err != nil {
			fmt.Println("failed to save:", err)
			continue
		}
		fmt.Printf("Saved %s players: %d\n", outPath, len(players))
		// politeness delay between teams
		time.Sleep(40 * time.Second)
	}
}
