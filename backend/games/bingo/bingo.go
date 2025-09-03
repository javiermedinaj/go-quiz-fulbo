package bingo

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type RemoteCategory struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Type        int    `json:"type"`
	DisplayName string `json:"displayName"`
	Prefix      string `json:"prefix,omitempty"`
	HelperText  string `json:"helperText,omitempty"`
}

type RemotePlayer struct {
	ID int    `json:"id"`
	F  string `json:"f"`
	G  string `json:"g"`
	V  []int  `json:"v"`
}

type remoteGameData struct {
	Remit   [][]RemoteCategory `json:"remit"`
	Players []RemotePlayer     `json:"players"`
}

type remoteRoot struct {
	GameData remoteGameData `json:"gameData"`
}

type Category struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	DisplayName string `json:"displayName"`
	Type        int    `json:"type"`
	Image       string `json:"image,omitempty"`
	HelperText  string `json:"helperText,omitempty"`
}

type Player struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	CategoryIDs []int  `json:"categoryIds"`
}

var (
	cacheMu sync.Mutex
	cache   = map[int]struct {
		fetchedAt  time.Time
		categories []Category
		players    []Player
	}{}
	cacheTTL = 30 * time.Minute
)

func FetchAndNormalize(id int) ([]Category, []Player, error) {
	cacheMu.Lock()
	entry, ok := cache[id]
	if ok && time.Since(entry.fetchedAt) < cacheTTL {
		cats := entry.categories
		pls := entry.players
		cacheMu.Unlock()
		return cats, pls, nil
	}
	cacheMu.Unlock()

	candidates := []string{
		filepath.Join("data", "remote_bingo"),
		filepath.Join("cmd", "scrape_bingo", "data", "remote_bingo"),
		filepath.Join("..", "cmd", "scrape_bingo", "data", "remote_bingo"),
		filepath.Join("..", "..", "cmd", "scrape_bingo", "data", "remote_bingo"),
	}

	var root remoteRoot
	foundLocal := false
	for _, d := range candidates {
		p := filepath.Join(d, fmt.Sprintf("%d.json", id))
		if b, err := os.ReadFile(p); err == nil {
			if err := json.Unmarshal(b, &root); err != nil {
				return nil, nil, fmt.Errorf("failed to parse local file %s: %w", p, err)
			}
			foundLocal = true
			break
		}
	}

	if !foundLocal {
		// fallback to remote fetch
		url := fmt.Sprintf("https://playfootball.games/api/football-bingo/%d.json", id)
		resp, err := http.Get(url)
		if err != nil {
			return nil, nil, err
		}
		defer resp.Body.Close()

		if resp.StatusCode != 200 {
			return nil, nil, fmt.Errorf("unexpected status: %d", resp.StatusCode)
		}

		if err := json.NewDecoder(resp.Body).Decode(&root); err != nil {
			return nil, nil, err
		}
	}

	// flatten remit to categories
	var cats []Category
	for _, row := range root.GameData.Remit {
		for _, rc := range row {
			img := fmt.Sprintf("https://playfootball.games/media/categories/%d.webp", rc.ID)
			cats = append(cats, Category{
				ID:          rc.ID,
				Name:        rc.Name,
				DisplayName: rc.DisplayName,
				Type:        rc.Type,
				Image:       img,
				HelperText:  rc.HelperText,
			})
		}
	}

	var players []Player
	for _, rp := range root.GameData.Players {
		full := rp.G
		if full != "" && rp.F != "" {
			full = full + " " + rp.F
		} else if full == "" {
			full = rp.F
		}
		players = append(players, Player{ID: rp.ID, Name: full, CategoryIDs: rp.V})
	}

	cacheMu.Lock()
	cache[id] = struct {
		fetchedAt  time.Time
		categories []Category
		players    []Player
	}{time.Now(), cats, players}
	cacheMu.Unlock()

	return cats, players, nil
}
