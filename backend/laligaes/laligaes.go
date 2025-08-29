package laligaes

import (
	"encoding/json"
	"errors"
	"io"
	"math/rand"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/PuerkitoBio/goquery"
)

// Player represents player info extracted from a Transfermarkt roster.
type Player struct {
	ID            string   `json:"id"`
	Name          string   `json:"name"`
	ShirtNumber   string   `json:"number,omitempty"`
	Age           string   `json:"age,omitempty"`
	Nationalities []string `json:"nationalities"`
	Contract      string   `json:"contract,omitempty"`
	MarketValue   string   `json:"market_value,omitempty"`
	FlagURL       string   `json:"flag_url,omitempty"`
	PhotoURL      string   `json:"photo_url,omitempty"`
}

func fetchWithRetries(url string, maxAttempts int) (string, error) {
	client := &http.Client{Timeout: 30 * time.Second}
	uas := []string{
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
		"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15",
		"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0 Safari/537.36",
	}
	var lastErr error
	for attempt := 0; attempt < maxAttempts; attempt++ {
		req, _ := http.NewRequest("GET", url, nil)
		req.Header.Set("User-Agent", uas[rand.Intn(len(uas))])
		req.Header.Set("Accept-Language", "en-US,en;q=0.9")
		req.Header.Set("Referer", "https://www.google.com/")
		req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")

		resp, err := client.Do(req)
		if err != nil {
			lastErr = err
		} else {
			body, _ := io.ReadAll(resp.Body)
			resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				return string(body), nil
			}
			lastErr = errors.New(resp.Status)
		}
		backoff := time.Duration((1 << attempt)) * time.Second
		jitter := time.Duration(rand.Intn(1500)) * time.Millisecond
		time.Sleep(backoff + jitter)
	}
	return "", lastErr
}

// ScrapeClubRoster fetches a Transfermarkt club squad page and extracts players.
func ScrapeClubRoster(url string) ([]Player, error) {
	body, err := fetchWithRetries(url, 4)
	if err != nil {
		return nil, err
	}
	doc, err := goquery.NewDocumentFromReader(strings.NewReader(body))
	if err != nil {
		return nil, err
	}

	var players []Player
	rows := doc.Find("table.items tbody tr")
	if rows.Length() == 0 {
		rows = doc.Find("tr")
	}

	rePlayer := regexp.MustCompile(`/profil/spieler/(?:.*?-)?(\d+)`)

	rows.Each(func(i int, s *goquery.Selection) {
		name := strings.TrimSpace(s.Find("td.posrela a").Text())
		href, _ := s.Find("td.hauptlink a").Attr("href")
		if name == "" {
			name = strings.TrimSpace(s.Find("a").First().Text())
			if href == "" {
				href, _ = s.Find("a").First().Attr("href")
			}
		}
		if name == "" && href == "" {
			return
		}
		id := ""
		if href != "" {
			if m := rePlayer.FindStringSubmatch(href); len(m) > 1 {
				id = m[1]
			}
		}

		number := strings.TrimSpace(s.Children().Eq(0).Text())
		age := strings.TrimSpace(s.Children().Eq(2).Text())
		contract := strings.TrimSpace(s.Children().Eq(4).Text())
		market := strings.TrimSpace(s.Children().Eq(5).Text())

		var nats []string
		var flagURL string
		var photoURL string

		if pimg := s.Find("img.bilderrahmen-fixed").First(); pimg.Length() > 0 {
			if v, ok := pimg.Attr("data-src"); ok && strings.TrimSpace(v) != "" {
				photoURL = strings.TrimSpace(v)
			} else if v, ok := pimg.Attr("src"); ok {
				photoURL = strings.TrimSpace(v)
			}
		}

		if cell := s.Children().Eq(3); cell.Length() > 0 {
			if img := cell.Find("img").First(); img.Length() > 0 {
				if v, ok := img.Attr("data-src"); ok && strings.TrimSpace(v) != "" {
					flagURL = strings.TrimSpace(v)
				} else if v, ok := img.Attr("src"); ok {
					flagURL = strings.TrimSpace(v)
				}
				if a, ok := img.Attr("alt"); ok {
					a = strings.TrimSpace(a)
					if a != "" {
						nats = append(nats, a)
					}
				}
				if len(nats) == 0 {
					if t, ok := img.Attr("title"); ok {
						t = strings.TrimSpace(t)
						if t != "" {
							nats = append(nats, t)
						}
					}
				}
			}
		}

		if len(nats) == 0 {
			s.Find("img").Each(func(_ int, img *goquery.Selection) {
				consider := false
				if class, ok := img.Attr("class"); ok && strings.Contains(strings.ToLower(class), "flag") {
					consider = true
				}
				if src, ok := img.Attr("src"); ok && (strings.Contains(strings.ToLower(src), "flagge") || strings.Contains(strings.ToLower(src), "tmssl") || strings.Contains(strings.ToLower(src), "flag")) {
					consider = true
				}
				if !consider {
					return
				}
				if flagURL == "" {
					if v, ok := img.Attr("data-src"); ok && strings.TrimSpace(v) != "" {
						flagURL = strings.TrimSpace(v)
					} else if v, ok := img.Attr("src"); ok {
						flagURL = strings.TrimSpace(v)
					}
				}
				if t, ok := img.Attr("title"); ok {
					t = strings.TrimSpace(t)
					if t != "" {
						nats = append(nats, t)
						return
					}
				}
				if a, ok := img.Attr("alt"); ok {
					a = strings.TrimSpace(a)
					if a != "" {
						nats = append(nats, a)
						return
					}
				}
			})
		}

		if nats == nil {
			nats = []string{}
		}

		players = append(players, Player{
			ID:            id,
			Name:          name,
			ShirtNumber:   number,
			Age:           age,
			Nationalities: nats,
			Contract:      contract,
			MarketValue:   market,
			FlagURL:       flagURL,
			PhotoURL:      photoURL,
		})
	})

	return players, nil
}

// SavePlayersIndex writes a players index (map[id]player) to path.
func SavePlayersIndex(players []Player, path string) error {
	index := map[string]Player{}
	for _, p := range players {
		key := p.ID
		if key == "" {
			key = strings.ToLower(strings.ReplaceAll(p.Name, " ", "_"))
		}
		if existing, ok := index[key]; ok {
			seen := map[string]bool{}
			for _, n := range existing.Nationalities {
				seen[n] = true
			}
			for _, n := range p.Nationalities {
				if n != "" && !seen[n] {
					existing.Nationalities = append(existing.Nationalities, n)
					seen[n] = true
				}
			}
			if existing.Name == "" {
				existing.Name = p.Name
			}
			if existing.FlagURL == "" {
				existing.FlagURL = p.FlagURL
			}
			if existing.PhotoURL == "" {
				existing.PhotoURL = p.PhotoURL
			}
			if existing.ShirtNumber == "" {
				existing.ShirtNumber = p.ShirtNumber
			}
			if existing.Age == "" {
				existing.Age = p.Age
			}
			if existing.Contract == "" {
				existing.Contract = p.Contract
			}
			if existing.MarketValue == "" {
				existing.MarketValue = p.MarketValue
			}
			index[key] = existing
		} else {
			index[key] = p
		}
	}
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	return enc.Encode(map[string]any{"players": index})
}

// SaveTeamJSON writes a team JSON file after merging duplicates.
func SaveTeamJSON(teamName string, players []Player, path string) error {
	merged := map[string]Player{}
	for _, p := range players {
		key := p.ID
		if key == "" {
			key = strings.ToLower(strings.ReplaceAll(p.Name, " ", "_"))
		}
		if ex, ok := merged[key]; ok {
			if ex.Name == "" {
				ex.Name = p.Name
			}
			if ex.ShirtNumber == "" {
				ex.ShirtNumber = p.ShirtNumber
			}
			if ex.Age == "" {
				ex.Age = p.Age
			}
			if ex.Contract == "" {
				ex.Contract = p.Contract
			}
			if ex.MarketValue == "" {
				ex.MarketValue = p.MarketValue
			}
			if ex.FlagURL == "" {
				ex.FlagURL = p.FlagURL
			}
			if ex.PhotoURL == "" {
				ex.PhotoURL = p.PhotoURL
			}
			seen := map[string]bool{}
			for _, n := range ex.Nationalities {
				seen[n] = true
			}
			for _, n := range p.Nationalities {
				if n != "" && !seen[n] {
					ex.Nationalities = append(ex.Nationalities, n)
					seen[n] = true
				}
			}
			merged[key] = ex
		} else {
			merged[key] = p
		}
	}
	outPlayers := make([]Player, 0, len(merged))
	for _, v := range merged {
		outPlayers = append(outPlayers, v)
	}
	out := map[string]any{"team": teamName, "players": outPlayers}
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	return enc.Encode(out)
}
