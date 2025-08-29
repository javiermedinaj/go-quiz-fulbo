interface Player {
  name: string;
  team: string;
  position: string;
  nationality: string;
  age: string;
  market_value: string;
  photo_url?: string;
  number?: string;
}

interface BackendPlayer {
  id: string;
  name: string;
  number?: string;
  age: string;
  nationalities: string[];
  contract: string;
  market_value: string;
  flag_url?: string;
  photo_url?: string;
}

interface BackendResponse {
  players: BackendPlayer[];
  team: string;
}

class ApiService {
  private static readonly BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  
  // Helper function to extract age from format "06/02/1995 (30)"
  private static extractAge(ageString: string): number | null {
    if (!ageString) return null;
    
    // Try to extract from parentheses first (e.g., "06/02/1995 (30)")
    const matches = ageString.match(/\((\d+)\)/);
    if (matches && matches[1]) {
      return parseInt(matches[1]);
    }
    
    // Fallback to direct number if it's just a number
    const numMatch = ageString.match(/^\d+$/);
    if (numMatch) {
      return parseInt(ageString);
    }
    
    return null;
  }
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private cache = new Map<string, { data: any; timestamp: number }>();

  // Team files mapping for each league
  private readonly teamFiles = {
    premier: [
      'afc-bournemouth.json', 'afc-sunderland.json', 'aston-villa.json',
      'brighton-amp-hove-albion.json', 'crystal-palace.json', 'fc-arsenal.json',
      'fc-brentford.json', 'fc-burnley.json', 'fc-chelsea.json', 'fc-fulham.json',
      'fc-liverpool.json', 'leeds-united.json', 'leicester-city.json',
      'manchester-city.json', 'manchester-united.json', 'newcastle-united.json',
      'nottingham-forest.json', 'tottenham-hotspur.json', 'west-ham-united.json',
      'wolverhampton-wanderers.json'
    ],
    laligaes: [
      'athletic-bilbao.json', 'atletico-madrid.json', 'celta-vigo.json',
      'deportivo-alaves.json', 'espanyol-barcelona.json', 'fc-barcelona.json',
      'fc-elche.json', 'fc-getafe.json', 'fc-girona.json', 'fc-sevilla.json',
      'levante.json', 'osasuna.json', 'rayo-vallecano.json', 'rcd-mallorca.json',
      'real-betis.json', 'real-madrid.json', 'real-oviedo.json', 'real-sociedad.json',
      'valencia.json', 'villarreal.json'
    ],
    bundesliga: [
      'augsburgo.json', 'bayer-leverkusen.json', 'bayern-munich.json',
      'borussia-dortmund.json', 'borussia-monchengladbach.json', 'colonia.json',
      'eintracht-francfort.json', 'friburgo.json', 'hamburgo.json', 'heidenheim.json',
      'hoffenheim.json', 'leipzig.json', 'mainz-05.json', 'st-pauli.json',
      'stuttgart.json', 'union-berlin.json', 'werder-bremen.json', 'wolfsburgo.json'
    ],
    seriea: [
      'ac-florenz.json', 'ac-mailand.json', 'ac-pisa-1909.json', 'as-rom.json',
      'atalanta-bergamo.json', 'cagliari-calcio.json', 'como-1907.json', 'fc-bologna.json',
      'fc-turin.json', 'genua-cfc.json', 'hellas-verona.json', 'inter-mailand.json',
      'juventus-turin.json', 'lazio-rom.json', 'parma-calcio-1913.json', 'ssc-napoles.json',
      'udinese-calcio.json', 'us-cremonese.json', 'us-lecce.json', 'us-sassuolo.json'
    ],
    ligue1: [
      'aj-auxerre.json', 'angers-sco.json', 'as-mnaco.json', 'fc-lorient.json',
      'fc-metz.json', 'fc-nantes.json', 'le-havre-ac.json', 'losc-lille.json',
      'ogc-niza.json', 'olympique-de-lyon.json', 'olympique-de-marsella.json',
      'paris-fc.json', 'pars-saint-germain-fc.json', 'racing-club-de-estrasburgo.json',
      'rc-lens.json', 'stade-brestois-29.json', 'stade-rennais-fc.json', 'toulouse-fc.json'
    ]
  };

  private async fetchWithCache(url: string): Promise<any> {
    const fullUrl = `${ApiService.BASE_URL}${url}`;
    const cached = this.cache.get(fullUrl);

    if (cached && Date.now() - cached.timestamp < ApiService.CACHE_DURATION) {
      return cached.data;
    }

    try {
      const response = await fetch(fullUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      this.cache.set(fullUrl, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error(`Error fetching ${url}:`, error);
      throw error;
    }
  }

  // Get team data for a specific league and team
  private async getTeamData(league: string, teamFile: string): Promise<Player[]> {
    try {
      const data: BackendResponse = await this.fetchWithCache(`/api/get/${league}/${teamFile}`);
      
      if (!data.players || !Array.isArray(data.players)) {
        console.warn(`Invalid data format for ${league}/${teamFile}:`, data);
        return [];
      }

      // Transform backend data to frontend format
      const transformedPlayers: Player[] = data.players.map((backendPlayer: BackendPlayer) => ({
        name: backendPlayer.name || '',
        team: data.team || '',
        position: '', // Position not available in backend data
        nationality: backendPlayer.nationalities?.[0] || '', // Take first nationality
        age: backendPlayer.age || '',
        market_value: backendPlayer.market_value || '',
        photo_url: backendPlayer.photo_url,
        number: backendPlayer.number
      }));

      return transformedPlayers;
    } catch (error) {
      console.error(`Error fetching ${league}/${teamFile}:`, error);
      return [];
    }
  }

  // Legacy method for backward compatibility
  async getTeamDataLegacy(league: string): Promise<Player[]> {
    const leagueKey = league === 'laliga' ? 'laligaes' : league;
    const teamFiles = this.teamFiles[leagueKey as keyof typeof this.teamFiles];
    
    if (!teamFiles) {
      throw new Error(`Liga no soportada: ${league}`);
    }

    const allTeamPlayers: Player[] = [];
    
    for (const teamFile of teamFiles) {
      try {
        const players = await this.getTeamData(leagueKey, teamFile);
        allTeamPlayers.push(...players);
      } catch (error) {
        console.error(`Error fetching ${leagueKey}/${teamFile}:`, error);
        // Continue with other teams
      }
    }
    
    return allTeamPlayers;
  }

  // Get all players from all leagues
  async getAllPlayers(): Promise<Player[]> {
    const leagues = Object.keys(this.teamFiles) as (keyof typeof this.teamFiles)[];
    const allPlayers: Player[] = [];
    
    try {
      for (const league of leagues) {
        const teamFiles = this.teamFiles[league];
        
        for (const teamFile of teamFiles) {
          try {
            const teamPlayers = await this.getTeamData(league, teamFile);
            allPlayers.push(...teamPlayers);
          } catch (error) {
            console.error(`Error fetching ${league}/${teamFile}:`, error);
            // Continue with other teams even if one fails
          }
        }
      }
      
      return allPlayers;
    } catch (error) {
      console.error('Error getting all players:', error);
      return [];
    }
  }

  async getRandomPlayers(count: number = 10): Promise<Player[]> {
    try {
      // Limitar a máximo 30 jugadores para evitar skips infinitos
      const maxPlayers = Math.min(count, 30);
      
      // Cargar solo algunos equipos en lugar de todos para evitar sobrecarga
      const selectedTeams = [
        { league: 'premier', teams: ['manchester-city.json', 'fc-arsenal.json', 'fc-liverpool.json', 'fc-chelsea.json'] },
        { league: 'laligaes', teams: ['real-madrid.json', 'fc-barcelona.json', 'atletico-madrid.json'] },
        { league: 'bundesliga', teams: ['bayern-munich.json', 'borussia-dortmund.json', 'bayer-leverkusen.json'] },
        { league: 'seriea', teams: ['juventus-turin.json', 'ac-mailand.json', 'inter-mailand.json'] },
        { league: 'ligue1', teams: ['pars-saint-germain-fc.json', 'olympique-de-marsella.json'] }
      ];

      const allPlayers: Player[] = [];
      
      for (const leagueData of selectedTeams) {
        for (const teamFile of leagueData.teams) {
          try {
            const teamPlayers = await this.getTeamData(leagueData.league, teamFile);
            allPlayers.push(...teamPlayers);
          } catch (error) {
            console.error(`Error fetching ${leagueData.league}/${teamFile}:`, error);
            // Continue with other teams
          }
        }
      }

      if (allPlayers.length === 0) {
        throw new Error('No se pudieron cargar jugadores');
      }

      // Filtrar jugadores con datos válidos y asegurar categorías del bingo
      const validPlayers = allPlayers.filter(player => 
        player.name && 
        player.team && 
        player.nationality &&
        player.age &&
        player.name.trim() !== '' &&
        player.team.trim() !== '' &&
        player.nationality.trim() !== '' &&
        ApiService.extractAge(player.age) !== null
      );

      if (validPlayers.length === 0) {
        throw new Error('No se encontraron jugadores válidos');
      }

      // Asegurar que tenemos jugadores de las categorías principales del bingo
      const categorizedPlayers = {
        england: validPlayers.filter(p => p.nationality?.toLowerCase() === 'england'),
        spain: validPlayers.filter(p => p.nationality?.toLowerCase() === 'spain'),
        france: validPlayers.filter(p => p.nationality?.toLowerCase() === 'france'),
        germany: validPlayers.filter(p => p.nationality?.toLowerCase() === 'germany'),
        brazil: validPlayers.filter(p => p.nationality?.toLowerCase() === 'brazil'),
        portugal: validPlayers.filter(p => p.nationality?.toLowerCase() === 'portugal'),
        manchesterCity: validPlayers.filter(p => p.team?.toLowerCase().includes('manchester-city') || p.team?.toLowerCase().includes('manchester city')),
        realMadrid: validPlayers.filter(p => p.team?.toLowerCase().includes('real-madrid') || p.team?.toLowerCase().includes('real madrid')),
        barcelona: validPlayers.filter(p => p.team?.toLowerCase().includes('barcelona')),
        young: validPlayers.filter(p => {
          const age = ApiService.extractAge(p.age);
          return age !== null && age < 25;
        }),
        veteran: validPlayers.filter(p => {
          const age = ApiService.extractAge(p.age);
          return age !== null && age > 30;
        }),
        prime: validPlayers.filter(p => {
          const age = ApiService.extractAge(p.age);
          return age !== null && age >= 25 && age <= 30;
        })
      };

      // Seleccionar jugadores balanceados de cada categoría
      const selectedPlayers: Player[] = [];
      const playersPerCategory = Math.floor(maxPlayers / 12); // 12 categorías del bingo
      
      Object.values(categorizedPlayers).forEach(categoryPlayers => {
        if (categoryPlayers.length > 0 && selectedPlayers.length < maxPlayers) {
          const shuffled = categoryPlayers.sort(() => 0.5 - Math.random());
          const toAdd = shuffled.slice(0, Math.min(playersPerCategory, categoryPlayers.length));
          
          // Evitar duplicados
          toAdd.forEach(player => {
            if (!selectedPlayers.some(p => p.name === player.name && p.team === player.team)) {
              selectedPlayers.push(player);
            }
          });
        }
      });

      // Si no tenemos suficientes jugadores, completar con jugadores aleatorios válidos
      if (selectedPlayers.length < maxPlayers) {
        const remaining = validPlayers.filter(player => 
          !selectedPlayers.some(p => p.name === player.name && p.team === player.team)
        );
        
        const shuffledRemaining = remaining.sort(() => 0.5 - Math.random());
        const needed = maxPlayers - selectedPlayers.length;
        selectedPlayers.push(...shuffledRemaining.slice(0, needed));
      }

      // Mezclar el array final
      const finalPlayers = selectedPlayers.sort(() => 0.5 - Math.random());
      
      return finalPlayers;
    } catch (error) {
      console.error('Error getting random players:', error);
      throw error;
    }
  }

  async getPlayersByNationality(nationality: string, excludePlayer?: Player): Promise<Player[]> {
    try {
      const allPlayers = await this.getAllPlayers();
      
      let filteredPlayers = allPlayers.filter(player => 
        player.nationality?.toLowerCase() === nationality.toLowerCase()
      );

      if (excludePlayer) {
        filteredPlayers = filteredPlayers.filter(player => 
          player.name !== excludePlayer.name || player.team !== excludePlayer.team
        );
      }

      return filteredPlayers;
    } catch (error) {
      console.error('Error getting players by nationality:', error);
      throw error;
    }
  }

  async getPlayersByTeam(team: string, excludePlayer?: Player): Promise<Player[]> {
    try {
      const allPlayers = await this.getAllPlayers();
      
      let filteredPlayers = allPlayers.filter(player => 
        player.team?.toLowerCase() === team.toLowerCase()
      );

      if (excludePlayer) {
        filteredPlayers = filteredPlayers.filter(player => 
          player.name !== excludePlayer.name
        );
      }

      return filteredPlayers;
    } catch (error) {
      console.error('Error getting players by team:', error);
      throw error;
    }
  }

  // Limpiar cache manualmente si es necesario
  clearCache(): void {
    this.cache.clear();
  }
}

export const apiService = new ApiService();
export type { Player };
