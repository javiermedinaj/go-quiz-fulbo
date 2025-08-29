package main

import (
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"futbol912.com/premier"
)

func main() {
	args := os.Args[1:]
	if len(args) > 0 && strings.ToLower(args[0]) == "competition" {
		// Minimal hardcoded list of 20 Premier clubs (season 2025) — slugs and ids
		teams := []struct{ Slug, URL string }{
			{"fc-arsenal", "https://www.transfermarkt.com/fc-arsenal/kader/verein/11/saison_id/2025"},
			{"manchester-city", "https://www.transfermarkt.com/manchester-city/kader/verein/281/saison_id/2025"},
			{"manchester-united", "https://www.transfermarkt.com/manchester-united/kader/verein/985/saison_id/2025"},
			{"fc-chelsea", "https://www.transfermarkt.com/fc-chelsea/kader/verein/631/saison_id/2025"},
			{"fc-liverpool", "https://www.transfermarkt.com/fc-liverpool/kader/verein/31/saison_id/2025"},
			{"tottenham-hotspur", "https://www.transfermarkt.com/tottenham-hotspur/kader/verein/148/saison_id/2025"},
			{"aston-villa", "https://www.transfermarkt.com/aston-villa/kader/verein/405/saison_id/2025"},
			{"newcastle-united", "https://www.transfermarkt.com/newcastle-united/kader/verein/762/saison_id/2025"},
			{"brighton-amp-hove-albion", "https://www.transfermarkt.com/brighton-amp-hove-albion/kader/verein/1237/saison_id/2025"},
			{"nottingham-forest", "https://www.transfermarkt.com/nottingham-forest/kader/verein/703/saison_id/2025"},
			{"wolverhampton-wanderers", "https://www.transfermarkt.com/wolverhampton-wanderers/kader/verein/543/saison_id/2025"},
			{"fc-fulham", "https://www.transfermarkt.com/fc-fulham/kader/verein/931/saison_id/2025"},
			{"leeds-united", "https://www.transfermarkt.com/leeds-united/kader/verein/399/saison_id/2025"},
			{"afc-bournemouth", "https://www.transfermarkt.com/afc-bournemouth/kader/verein/989/saison_id/2025"},
			{"fc-brentford", "https://www.transfermarkt.com/fc-brentford/kader/verein/1148/saison_id/2025"},
			{"crystal-palace", "https://www.transfermarkt.com/crystal-palace/kader/verein/873/saison_id/2025"},
			{"fc-burnley", "https://www.transfermarkt.com/fc-burnley/kader/verein/1132/saison_id/2025"},
			{"afc-sunderland", "https://www.transfermarkt.com/afc-sunderland/kader/verein/289/saison_id/2025"},
			{"west-ham-united", "https://www.transfermarkt.com/west-ham-united/kader/verein/379/saison_id/2025"},
			{"leicester-city", "https://www.transfermarkt.com/leicester-city/kader/verein/452/saison_id/2025"},
		}

		for _, t := range teams {
			fmt.Println("Scraping team:", t.Slug, t.URL)
			var players []premier.Player
			var err error
			// retry loop for each team
			maxAttempts := 3
			for attempt := 1; attempt <= maxAttempts; attempt++ {
				players, err = premier.ScrapeClubRoster(t.URL)
				if err == nil {
					break
				}
				log.Printf("attempt %d/%d failed for %s: %v", attempt, maxAttempts, t.Slug, err)
				// exponential backoff with jitter
				backoff := time.Duration(1<<attempt) * time.Second
				jitter := time.Duration((attempt * 500)) * time.Millisecond
				time.Sleep(backoff + jitter)
			}
			if err != nil {
				log.Printf("giving up on %s after %d attempts: %v", t.Slug, maxAttempts, err)
			} else {
				out := t.Slug + ".json"
				if err := premier.SaveTeamJSON(t.Slug, players, out); err != nil {
					log.Printf("save failed %s: %v", out, err)
				} else {
					fmt.Println("Saved", out, "players:", len(players))
				}
			}
			// long polite delay between teams to avoid blocks
			fmt.Println("waiting 40s before next team...")
			time.Sleep(40 * time.Second)
		}
		os.Exit(0)
	}

	// Arsenal Transfermarkt club squad (example) - season 2025 (URL provided)
	url := "https://www.transfermarkt.com/fc-arsenal/kader/verein/11/saison_id/2025"
	fmt.Println("Scraping:", url)
	players, err := premier.ScrapeClubRoster(url)
	if err != nil {
		log.Fatalf("scrape failed: %v", err)
	}

	out := "players_index.json"
	if err := premier.SavePlayersIndex(players, out); err != nil {
		log.Fatalf("save failed: %v", err)
	}
	fmt.Println("Saved", out, "entries:", len(players))
	// print sample
	if len(players) > 0 {
		fmt.Println("first:", players[0].Name, players[0].ID)
	}
	os.Exit(0)
}
