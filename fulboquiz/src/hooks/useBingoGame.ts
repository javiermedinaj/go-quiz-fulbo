import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/apiService';
import type { Player } from '../services/apiService';

export interface BingoCategory {
  id: string;
  title: string;
  checkFunction: (player: Player) => boolean;
  filled: boolean;
  playerName?: string;
}

export interface GameError {
  playerName: string;
  attemptedCategory: string;
  correctCategories: string[];
}

export const useBingoGame = () => {
  // Game state
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [bingoBoard, setBingoBoard] = useState<BingoCategory[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [correctPlacements, setCorrectPlacements] = useState(0);
  const [wrongPlacements, setWrongPlacements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [playerQueue, setPlayerQueue] = useState<Player[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [gameErrors, setGameErrors] = useState<GameError[]>([]);

  // Helper to parse age from strings like "06/02/1995 (30)" or plain "22"
  const parseAge = useCallback((ageStr?: string): number => {
    if (!ageStr) return NaN;
    // Try parentheses first
    const par = ageStr.match(/\((\d+)\)/);
    if (par && par[1]) return parseInt(par[1], 10);
    // Fallback to any number in the string (e.g., "22")
    const num = ageStr.match(/(\d+)/);
    return num ? parseInt(num[1], 10) : NaN;
  }, []);

  // Helper to normalize nationality and check variants
  const nationalityMatches = useCallback((player: Player | undefined, variants: string[]) => {
    const raw = (player?.nationality || '').toLowerCase();
    if (!raw) return false;
    // Remove diacritics (ñ, á, é, etc.) to compare safely
    const norm = raw.normalize('NFD').replace(/\p{Diacritic}/gu, '');
    return variants.some(v => norm.includes(v));
  }, []);

  // Create bingo board with categories
  const createBingoBoard = useCallback((): BingoCategory[] => {
    const categories: BingoCategory[] = [
      // Nacionalidades específicas
      {
        id: 'england',
        title: 'Inglaterra',
        checkFunction: (player) => nationalityMatches(player, ['england', 'english', 'inglaterra']),
        filled: false
      },
      {
        id: 'spain',
        title: 'España',
        checkFunction: (player) => nationalityMatches(player, ['spain', 'espana', 'espanol', 'espanola', 'españa']),
        filled: false
      },
      {
        id: 'france',
        title: 'Francia',
        checkFunction: (player) => nationalityMatches(player, ['france', 'frances', 'francais', 'francia', 'french']),
        filled: false
      },
      {
        id: 'germany',
        title: 'Alemania',
        checkFunction: (player) => nationalityMatches(player, ['germany', 'deutschland', 'alemania', 'german']),
        filled: false
      },
      {
        id: 'brazil',
        title: 'Brasil',
        checkFunction: (player) => nationalityMatches(player, ['brazil', 'brasil', 'brazilian', 'brasileiro']),
        filled: false
      },
      {
        id: 'portugal',
        title: 'Portugal',
        checkFunction: (player) => nationalityMatches(player, ['portugal', 'portugues', 'portuguese']),
        filled: false
      },
      // Equipos específicos
      {
        id: 'manchester-city',
        title: 'Manchester City',
        checkFunction: (player) => player.team?.toLowerCase().includes('manchester-city') || player.team?.toLowerCase().includes('manchester city'),
        filled: false
      },
      {
        id: 'real-madrid',
        title: 'Real Madrid',
        checkFunction: (player) => player.team?.toLowerCase().includes('real-madrid') || player.team?.toLowerCase().includes('real madrid'),
        filled: false
      },
      {
        id: 'barcelona',
        title: 'FC Barcelona',
        checkFunction: (player) => player.team?.toLowerCase().includes('barcelona'),
        filled: false
      },
      // Rangos de edad
      {
        id: 'young',
        title: 'Menor de 25',
        checkFunction: (player) => {
          const age = parseAge(player.age);
          return !isNaN(age) && age < 25;
        },
        filled: false
      },
      {
        id: 'veteran',
        title: 'Mayor de 30',
        checkFunction: (player) => {
          const age = parseAge(player.age);
          return !isNaN(age) && age > 30;
        },
        filled: false
      },
      {
        id: 'prime',
        title: '25-30 años',
        checkFunction: (player) => {
          const age = parseAge(player.age);
          return !isNaN(age) && age >= 25 && age <= 30;
        },
        filled: false
      }
    ];

    return categories;
  }, [nationalityMatches, parseAge]);

  // Load players
  const loadPlayers = useCallback(async () => {
    setLoading(true);
    try {
      const players = await apiService.getRandomPlayers(30);
      const validPlayers = players.filter(player => 
        player.name && 
        player.nationality && 
        player.team && 
        player.age &&
        player.name.trim() !== '' &&
        player.nationality.trim() !== '' &&
        player.team.trim() !== ''
      );
      
      if (validPlayers.length === 0) {
        throw new Error('No se encontraron jugadores válidos');
      }
      
      const shuffledPlayers = validPlayers.sort(() => 0.5 - Math.random());
      setPlayerQueue(shuffledPlayers);
      
      if (shuffledPlayers.length > 0) {
        setCurrentPlayer(shuffledPlayers[0]);
        setQueueIndex(0);
      }
    } catch (error) {
      console.error('Error loading players:', error);
    }
    setLoading(false);
  }, []);

  // Move to next player
  const nextPlayer = useCallback(() => {
    if (queueIndex + 1 < playerQueue.length) {
      setQueueIndex(queueIndex + 1);
      setCurrentPlayer(playerQueue[queueIndex + 1]);
    } else {
      loadPlayers();
    }
  }, [queueIndex, playerQueue, loadPlayers]);

  // Start game
  const startGame = useCallback(() => {
    setGameStarted(true);
    setTimeLeft(60);
    setScore(0);
    setCorrectPlacements(0);
    setWrongPlacements(0);
    setGameFinished(false);
    setGameErrors([]);
    setBingoBoard(createBingoBoard());
  }, [createBingoBoard]);

  // Handle category click
  const handleCategoryClick = useCallback((categoryId: string) => {
    if (!gameStarted || gameFinished || !currentPlayer) return;

    const clickedCategory = bingoBoard.find(cat => cat.id === categoryId);
    if (!clickedCategory || clickedCategory.filled) return;

    let finalBoard = bingoBoard.slice();
    let filledCount = 0;

    const target = bingoBoard.find(cat => cat.id === categoryId);
    if (target && !target.filled) {
      const isCorrect = target.checkFunction(currentPlayer);

      if (isCorrect) {
        finalBoard = bingoBoard.map(cat => {
          if (!cat.filled && cat.checkFunction(currentPlayer)) {
            filledCount += 1;
            return { ...cat, filled: true, playerName: currentPlayer.name };
          }
          return cat;
        });

        setCorrectPlacements(prev => prev + filledCount);
        setScore(prev => prev + 10 * filledCount);
      } else {
        finalBoard = bingoBoard.map(cat => {
          if (cat.id === categoryId) {
            return { ...cat, filled: true, playerName: currentPlayer.name };
          }
          return cat;
        });

        setWrongPlacements(prev => prev + 1);
        setScore(prev => Math.max(0, prev - 5));

        const correctCategories = bingoBoard
          .filter(cat => cat.checkFunction(currentPlayer))
          .map(cat => cat.title);

        const error: GameError = {
          playerName: currentPlayer.name,
          attemptedCategory: clickedCategory.title,
          correctCategories: correctCategories.length > 0 ? correctCategories : [
            ...(currentPlayer.nationality ? [`Nacionalidad: ${currentPlayer.nationality}`] : []),
            ...(currentPlayer.team ? [`Equipo: ${currentPlayer.team}`] : []),
            ...(currentPlayer.age ? [`Edad: ${currentPlayer.age}`] : [])
          ]
        };

        setGameErrors(prev => [...prev, error]);
      }
    }

    setBingoBoard(finalBoard);
    nextPlayer();

    if (finalBoard.every(cat => cat.filled)) {
      setGameFinished(true);
    }
  }, [gameStarted, gameFinished, currentPlayer, bingoBoard, nextPlayer]);

  // Skip player
  const skipPlayer = useCallback(() => {
    if (!gameStarted || gameFinished) return;
    nextPlayer();
  }, [gameStarted, gameFinished, nextPlayer]);

  // Timer effect
  useEffect(() => {
    let timer: number;
    
    if (gameStarted && !gameFinished && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameStarted) {
      setGameFinished(true);
    }

    return () => clearTimeout(timer);
  }, [timeLeft, gameStarted, gameFinished]);

  // Initialize game
  useEffect(() => {
    setBingoBoard(createBingoBoard());
    loadPlayers();
  }, [createBingoBoard, loadPlayers]);

  return {
    // State
    currentPlayer,
    bingoBoard,
    timeLeft,
    gameStarted,
    gameFinished,
    score,
    correctPlacements,
    wrongPlacements,
    loading,
    gameErrors,
    
    // Actions
    startGame,
    handleCategoryClick,
    skipPlayer
  };
};
